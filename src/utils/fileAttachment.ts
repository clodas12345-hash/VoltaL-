import heic2any from 'heic2any';

export type AttachmentCategory = 'image' | 'pdf' | 'text' | 'document' | 'spreadsheet' | 'archive' | 'other';

export interface FileAttachment {
  id: string;
  name: string;
  category: AttachmentCategory;
  extension: string;
  mimeType: string;
  sizeFormatted: string;
  dataUrl: string;
  rawText?: string;
  uploadedAt: number;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(filename: string): string {
  if (!filename || !filename.includes('.')) return '';
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getAttachmentCategory(mimeType: string, extension: string): AttachmentCategory {
  const mime = (mimeType || '').toLowerCase();
  const ext = (extension || '').toLowerCase();

  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'heic', 'heif', 'avif', 'ico', 'tiff'].includes(ext)
  ) {
    return 'image';
  }

  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }

  if (
    mime.startsWith('text/') ||
    ['txt', 'csv', 'md', 'json', 'log', 'xml', 'yaml', 'yml', 'tsv', 'env', 'sql', 'js', 'ts', 'html', 'css'].includes(ext)
  ) {
    return 'text';
  }

  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) {
    return 'spreadsheet';
  }

  if (
    ['doc', 'docx', 'odt', 'rtf', 'pages', 'ppt', 'pptx', 'odp'].includes(ext) ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('powerpoint') ||
    mime.includes('presentation')
  ) {
    return 'document';
  }

  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
    return 'archive';
  }

  return 'other';
}

export function isValidAttachment(item: any): boolean {
  if (typeof item !== 'string' || item.trim().length < 10) return false;
  const str = item.trim();
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      return !!(parsed && (parsed.dataUrl || parsed.rawText || parsed.name));
    } catch {
      return false;
    }
  }
  return str.startsWith('data:') || str.startsWith('blob:') || str.startsWith('http://') || str.startsWith('https://');
}

export function parseAttachment(item: string, index = 0): FileAttachment {
  const defaultId = `att_${Date.now()}_${index}`;

  if (typeof item === 'string' && item.trim().startsWith('{') && item.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(item);
      if (parsed && typeof parsed === 'object') {
        const name = parsed.name || `Arquivo ${index + 1}`;
        const ext = parsed.extension || getFileExtension(name);
        const mimeType = parsed.mimeType || (parsed.dataUrl?.split(';')[0]?.replace('data:', '') || 'application/octet-stream');
        const category = parsed.category || getAttachmentCategory(mimeType, ext);
        return {
          id: parsed.id || defaultId,
          name,
          category,
          extension: ext,
          mimeType,
          sizeFormatted: parsed.sizeFormatted || (parsed.size ? formatFileSize(parsed.size) : ''),
          dataUrl: parsed.dataUrl || '',
          rawText: parsed.rawText,
          uploadedAt: parsed.uploadedAt || Date.now(),
        };
      }
    } catch (e) {
      // fallback to raw string handler below
    }
  }

  const raw = typeof item === 'string' ? item : '';
  let mimeType = 'image/jpeg';
  if (raw.startsWith('data:')) {
    const header = raw.substring(5, raw.indexOf(';'));
    if (header) mimeType = header;
  }

  let ext = '';
  if (mimeType.includes('/')) {
    ext = mimeType.split('/')[1]?.split('+')[0] || '';
  }
  if (raw.startsWith('http')) {
    const cleanUrl = raw.split('?')[0];
    ext = getFileExtension(cleanUrl) || 'jpg';
  }

  const category = getAttachmentCategory(mimeType, ext);
  const name = category === 'image' ? `Foto ${index + 1}` : category === 'pdf' ? `Documento ${index + 1}.pdf` : `Arquivo ${index + 1}`;

  return {
    id: defaultId,
    name,
    category,
    extension: ext,
    mimeType,
    sizeFormatted: '',
    dataUrl: raw,
    uploadedAt: Date.now(),
  };
}

export function serializeAttachment(attachment: FileAttachment): string {
  return JSON.stringify(attachment);
}

// Compress and process an image file
async function processImageFile(file: File): Promise<string> {
  let workingBlob: Blob = file;
  const fileName = file.name ? file.name.toLowerCase() : '';
  const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';

  if (isHeic) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.75,
      });
      workingBlob = Array.isArray(converted) ? converted[0] : converted;
    } catch (e) {
      console.warn('HEIC conversion fallback:', e);
    }
  }

  // If SVG or small animated GIF, keep original dataUrl
  if (file.type === 'image/svg+xml' || (file.type === 'image/gif' && file.size < 1024 * 1024)) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(workingBlob);
    });
  }

  // Method 1: createImageBitmap
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      let bitmap: ImageBitmap | null = null;
      try {
        bitmap = await createImageBitmap(workingBlob, {
          resizeWidth: 1200,
          resizeQuality: 'medium',
        } as any);
      } catch {
        bitmap = await createImageBitmap(workingBlob);
      }

      if (bitmap) {
        const MAX_DIM = 1200;
        let width = bitmap.width;
        let height = bitmap.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          bitmap.close();
          if (dataUrl && dataUrl.length > 50) {
            return dataUrl;
          }
        }
        bitmap.close();
      }
    } catch (err) {
      console.warn('createImageBitmap failed, falling back to FileReader:', err);
    }
  }

  // Method 2: HTML Image
  return new Promise((resolve) => {
    try {
      const blobUrl = URL.createObjectURL(workingBlob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1200;
          let width = img.naturalWidth || img.width || 800;
          let height = img.naturalHeight || img.height || 600;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            URL.revokeObjectURL(blobUrl);
            if (dataUrl && dataUrl.length > 50) {
              resolve(dataUrl);
              return;
            }
          }
        } catch (err) {
          console.warn('Canvas render error, fallback:', err);
        }
        URL.revokeObjectURL(blobUrl);
        readFileAsDataUrl(workingBlob, resolve);
      };

      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        readFileAsDataUrl(workingBlob, resolve);
      };

      img.src = blobUrl;
    } catch {
      readFileAsDataUrl(workingBlob, resolve);
    }
  });
}

function readFileAsDataUrl(blob: Blob, callback: (url: string) => void) {
  try {
    const reader = new FileReader();
    reader.onload = (e) => callback((e.target?.result as string) || '');
    reader.onerror = () => callback('');
    reader.readAsDataURL(blob);
  } catch {
    callback('');
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    } catch {
      resolve('');
    }
  });
}

// Master function to process any uploaded file (photos, PDF, TXT, DOC, spreadsheets, etc.)
export async function processUploadedFile(file: File): Promise<string> {
  const extension = getFileExtension(file.name);
  const mimeType = file.type || 'application/octet-stream';
  const category = getAttachmentCategory(mimeType, extension);
  const sizeFormatted = formatFileSize(file.size);
  const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let dataUrl = '';
  let rawText: string | undefined = undefined;

  if (category === 'image') {
    dataUrl = await processImageFile(file);
  } else if (category === 'text') {
    rawText = await readFileAsText(file);
    // Also create dataUrl for direct download/viewing
    dataUrl = await new Promise<string>((resolve) => readFileAsDataUrl(file, resolve));
  } else {
    // PDF, Documents, Spreadsheets, Archives, Others
    dataUrl = await new Promise<string>((resolve) => readFileAsDataUrl(file, resolve));
  }

  if (!dataUrl && !rawText) {
    throw new Error('Falha ao ler conteúdo do arquivo');
  }

  const attachment: FileAttachment = {
    id,
    name: file.name || `Arquivo_${Date.now()}`,
    category,
    extension,
    mimeType,
    sizeFormatted,
    dataUrl,
    rawText,
    uploadedAt: Date.now(),
  };

  return serializeAttachment(attachment);
}

// Helper to safely trigger a download in browser
export function downloadAttachment(attachment: FileAttachment) {
  try {
    let url = attachment.dataUrl;
    let cleanup = false;

    if (!url && attachment.rawText) {
      const blob = new Blob([attachment.rawText], { type: attachment.mimeType || 'text/plain;charset=utf-8' });
      url = URL.createObjectURL(blob);
      cleanup = true;
    }

    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name || `anexo_${Date.now()}.${attachment.extension || 'bin'}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (cleanup) {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  } catch (e) {
    console.error('Error downloading attachment:', e);
  }
}
