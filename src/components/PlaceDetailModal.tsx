import { StreetView } from "./StreetView";
import React, { useState, useRef, useEffect } from 'react';
import { X, Star, MapPin, Phone, Globe, Bookmark, Check, Sparkles, Navigation, Clock, DollarSign, Users, MessageCircle, ChevronDown, ChevronUp, AlertCircle, Camera, Trash2, ImagePlus, Plus } from 'lucide-react';
import { PlaceCategory, SavedPlace } from '../types';
import heic2any from 'heic2any';
import { getOpeningStatus, getWeekdaySchedules, getDefaultOpeningHoursForCategory } from '../utils/openingHours';

interface PlaceDetailModalProps {
  place: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating?: number;
    userRatingsTotal?: number;
    phoneNumber?: string;
    website?: string;
    photoUrl?: string;
    placeId?: string;
    openingHours?: string[];
    priceLevel?: string;
    peakHours?: string;
    googleMapsUri?: string;
    description?: string;
  };
  onClose: () => void;
  onSave: (savedData: { name: string; category: PlaceCategory; notes: string; customPhotos?: string[]; rating?: number }) => void;
  existingSaved?: SavedPlace;
  userLocation?: { lat: number; lng: number } | null;
  categories: PlaceCategory[];
  onPinFromStreetView?: (latLng: { lat: number; lng: number }) => void;
  onAddCategory?: (newCategory: string) => void;
  onNavigate?: () => void;
  onOpenWebsite?: (url: string) => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const isValidPhoto = (photo: string): boolean => {
  return typeof photo === 'string' && (photo.startsWith('data:image/') || photo.startsWith('blob:') || photo.startsWith('http://') || photo.startsWith('https://')) && photo.length > 30;
};

export function PlaceDetailModal({
  place,
  onClose,
  onSave,
  existingSaved,
  userLocation,
  categories,
  onAddCategory,
  onPinFromStreetView,
  onNavigate,
  onOpenWebsite,
}: PlaceDetailModalProps) {
  const [name, setName] = useState(() => {
    try {
      const draft = sessionStorage.getItem(`draft_${place.placeId || place.lat}`);
      if (draft) return JSON.parse(draft).name;
    } catch (e) {}
    return existingSaved?.name || place.name;
  });
  const [category, setCategory] = useState<PlaceCategory>(() => {
    try {
      const draft = sessionStorage.getItem(`draft_${place.placeId || place.lat}`);
      if (draft) return JSON.parse(draft).category;
    } catch (e) {}
    return existingSaved?.category || 'Restaurante';
  });
  const [notes, setNotes] = useState(() => {
    try {
      const draft = sessionStorage.getItem(`draft_${place.placeId || place.lat}`);
      if (draft) return JSON.parse(draft).notes;
    } catch (e) {}
    return existingSaved?.notes || '';
  });
  const [personalRating, setPersonalRating] = useState<number>(() => {
    return existingSaved?.rating || 0;
  });
  const [customPhotos, setCustomPhotos] = useState<string[]>(() => {
    try {
      const draft = sessionStorage.getItem(`draft_${place.placeId || place.lat}`);
      if (draft) {
        const photos = JSON.parse(draft).customPhotos;
        if (Array.isArray(photos)) {
          return photos.filter(isValidPhoto);
        }
      }
    } catch (e) {}
    return (existingSaved?.customPhotos || []).filter(isValidPhoto);
  });

  useEffect(() => {
    try {
      const validOnly = customPhotos.filter(isValidPhoto);
      const draft = { name, category, notes, customPhotos: validOnly };
      sessionStorage.setItem(`draft_${place.placeId || place.lat}`, JSON.stringify(draft));
    } catch (e) {
      try {
        const draftNoPhotos = { name, category, notes, customPhotos: [] };
        sessionStorage.setItem(`draft_${place.placeId || place.lat}`, JSON.stringify(draftNoPhotos));
      } catch (e2) {}
    }
  }, [name, category, notes, customPhotos, place.placeId, place.lat]);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [showHours, setShowHours] = useState(false);
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState<number | null>(null);
  const [showMainPhotoOptions, setShowMainPhotoOptions] = useState(false);
  const [viewingMainPhotoFullscreen, setViewingMainPhotoFullscreen] = useState(false);
  const [viewingStreetView, setViewingStreetView] = useState(false);
  
  const effectiveOpeningHours = (place.openingHours && place.openingHours.length > 0)
    ? place.openingHours
    : getDefaultOpeningHoursForCategory(category || (place as any).category, name || place.name);

  const openingStatus = getOpeningStatus(effectiveOpeningHours);
  const weekdaySchedules = getWeekdaySchedules(effectiveOpeningHours);
  const todayDescription = openingStatus.todaySchedule;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<string> => {
    let workingFile: Blob = file;

    // Check for HEIC / HEIF from iPhones / Samsung Galaxy
    const fileName = file.name ? file.name.toLowerCase() : '';
    const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';

    if (isHeic) {
      try {
        const converted = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.7,
        });
        workingFile = Array.isArray(converted) ? converted[0] : converted;
      } catch (e) {
        console.warn('HEIC conversion fallback:', e);
      }
    }

    // Method 1: Hardware-accelerated createImageBitmap with native downscale
    if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
      try {
        let bitmap: ImageBitmap | null = null;
        try {
          bitmap = await createImageBitmap(workingFile, {
            resizeWidth: 800,
            resizeQuality: 'medium',
          } as any);
        } catch {
          bitmap = await createImageBitmap(workingFile);
        }

        if (bitmap) {
          const MAX_DIM = 800;
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            bitmap.close();
            if (dataUrl && dataUrl.length > 50) {
              return dataUrl;
            }
          }
          bitmap.close();
        }
      } catch (err) {
        console.warn('createImageBitmap failed, trying Blob URL / FileReader:', err);
      }
    }

    // Method 2: Blob URL + Image() fallback
    return new Promise((resolve) => {
      let resolved = false;
      const finish = (result: string) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      const timeout = setTimeout(() => {
        finish('');
      }, 10000);

      try {
        const blobUrl = URL.createObjectURL(workingFile);
        const img = new Image();

        img.onload = () => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 800;
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
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              URL.revokeObjectURL(blobUrl);
              if (dataUrl && dataUrl.length > 50) {
                finish(dataUrl);
                return;
              }
            }
          } catch (err) {
            console.warn('Canvas compression error, using fallback:', err);
          }
          URL.revokeObjectURL(blobUrl);
          readWithFileReader(workingFile, finish);
        };

        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          readWithFileReader(workingFile, finish);
        };

        img.src = blobUrl;
      } catch (err) {
        readWithFileReader(workingFile, finish);
      }
    });
  };

  const readWithFileReader = (file: Blob, callback: (res: string) => void) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        let result = (e.target?.result as string) || '';
        if (result.startsWith('data:')) {
          if (!result.startsWith('data:image/')) {
            result = result.replace(/^data:[^;]+;base64,/, 'data:image/jpeg;base64,');
          }
          callback(result);
        } else {
          callback('');
        }
      };
      reader.onerror = () => callback('');
      reader.readAsDataURL(file);
    } catch {
      callback('');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileList = Array.from(files) as File[];
    setIsProcessingPhoto(true);
    setProcessingCount(fileList.length);
    
    try {
      // Process all selected photos in parallel for high speed
      const compressedResults = await Promise.all(
        fileList.map((file) => compressImage(file))
      );

      const validPhotos = compressedResults.filter((img): img is string => !!img && isValidPhoto(img));
      
      if (validPhotos.length > 0) {
        setCustomPhotos((prev) => [...prev.filter(isValidPhoto), ...validPhotos]);
      }
    } catch (err) {
      console.error('Error uploading photos in batch:', err);
    } finally {
      setIsProcessingPhoto(false);
      setProcessingCount(0);
      try {
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
      } catch (e) {}
    }
  };

  const removePhoto = (index: number) => {
    setCustomPhotos(prev => prev.filter((_, i) => i !== index));
    if (viewingPhotoIndex === index) {
      setViewingPhotoIndex(null);
    }
  };

  const getSmartPeakHours = (p: any) => {
    const pName = (p.name || '').toLowerCase();
    const d = new Date();
    const hour = d.getHours();
    const day = d.getDay(); // 0 is Sunday, 6 is Saturday

    let isLikelyClosed = false;
    const is24h = todayDescription.toLowerCase().includes('24 horas') || todayDescription.toLowerCase().includes('24h') || pName.includes('24h');

    if (todayDescription.toLowerCase().includes('fechado')) {
      isLikelyClosed = true;
    } else if (!is24h && todayDescription) {
      // Parse todayDescription format, e.g., "sábado: 10:00 – 18:00"
      const match = todayDescription.match(/\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/g);
      if (match) {
        let isOpenNow = false;
        for (const timeRange of match) {
          const parts = timeRange.split(/[–-]/).map(p => p.trim());
          if (parts.length === 2) {
            const openHour = parseInt(parts[0].split(':')[0], 10);
            let closeHour = parseInt(parts[1].split(':')[0], 10);
            
            if (closeHour <= openHour && closeHour < 12) {
              closeHour += 24; // Handles past midnight closing
            }
            
            let currentHourAdjusted = hour;
            if (hour < 6 && closeHour > 24) {
              currentHourAdjusted += 24;
            }
            
            if (currentHourAdjusted >= openHour && currentHourAdjusted < closeHour) {
              isOpenNow = true;
              break;
            }
          }
        }
        if (!isOpenNow) {
          isLikelyClosed = true;
        }
      }
    } else if (!is24h) {
      if (hour >= 23 || hour < 6) {
        if (!pName.includes('bar') && !pName.includes('club') && !pName.includes('pub') && !pName.includes('lanchonete') && !pName.includes('farmácia')) {
          isLikelyClosed = true;
        }
      } else if (hour >= 6 && hour < 10) {
        if (pName.includes('restaurante') || pName.includes('pizzaria') || pName.includes('sushi') || pName.includes('burger')) {
          isLikelyClosed = true;
        }
      }
    }

    if (isLikelyClosed) return 'Fechado (Sem movimento)';

    if (pName.includes('padaria') || pName.includes('pão') || pName.includes('cafe') || pName.includes('café') || pName.includes('panificadora')) {
      if (hour >= 6 && hour <= 9) return 'Agora: Pico do café da manhã';
      if (hour >= 15 && hour <= 18) return 'Agora: Pico do café da tarde';
      return 'Pico normal: 07h–09h e 16h–18h';
    }
    
    if (pName.includes('restaurante') || pName.includes('churrascaria') || pName.includes('sushi') || pName.includes('pizzaria') || pName.includes('burger') || pName.includes('lanchonete')) {
      if (hour >= 11 && hour <= 14) return 'Agora: Pico do almoço';
      if (hour >= 19 && hour <= 22) return 'Agora: Pico do jantar';
      return 'Pico normal: 12h–14h e 19h–21h';
    }

    if (pName.includes('supermercado') || pName.includes('mercado') || pName.includes('atacado')) {
      if (hour >= 17 && hour <= 20) return 'Agora: Pico pós-expediente';
      if (day === 0 || day === 6) return 'Movimento alto (Fim de semana)';
      return 'Pico normal: 18h–20h';
    }

    if (pName.includes('farmácia') || pName.includes('drogaria')) {
      return 'Pico normal: 17h–19h';
    }

    if (pName.includes('bar') || pName.includes('pub') || pName.includes('cervejaria')) {
      if (hour >= 19 || hour < 2) return 'Agora: Pico noturno';
      return 'Pico normal: 20h–01h';
    }

    if (pName.includes('shopping') || pName.includes('mall')) {
      if (hour >= 15 && hour <= 19) return 'Agora: Pico de movimento';
      if (day === 0 || day === 6) return 'Pico normal de fim de semana';
      return 'Pico normal: 16h–19h';
    }

    if (hour >= 12 && hour <= 14) return 'Agora: Possível pico de almoço';
    if (hour >= 18 && hour <= 20) return 'Agora: Possível pico de fim de dia';
    return 'Movimento moderado no momento';
  };

  const smartPeakHours = getSmartPeakHours(place);

  // Calculate distance if user location is available
  let distanceText = '';
  if (userLocation) {
    const R = 6371; // Earth radius in km
    const dLat = (place.lat - userLocation.lat) * (Math.PI / 180);
    const dLng = (place.lng - userLocation.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * (Math.PI / 180)) *
        Math.cos(place.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // in km
    distanceText = d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
  }

  // Format WhatsApp link if phone exists
  const cleanPhone = place.phoneNumber ? place.phoneNumber.replace(/\D/g, '') : '';
  const whatsappUrl = cleanPhone ? `https://wa.me/55${cleanPhone}` : undefined;

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), category, notes, customPhotos, rating: personalRating || place.rating });
    setSavedSuccess(true);
    // Remove auto-close so the user can see their photo was saved, they can close manually
  };

  const googleReviewUrl = place.placeId 
    ? `https://search.google.com/local/writereview?placeid=${place.placeId}`
    : (place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name || place.name} ${place.address || ''}`)}`);

  return (
    <>
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Photo Header if available */}
        {place.photoUrl ? (
          <div className="relative h-64 w-full bg-slate-100 group overflow-hidden shrink-0">
            <div 
              onClick={() => setShowMainPhotoOptions(true)}
              className="absolute inset-0 block cursor-pointer"
            >
              <img 
                src={place.photoUrl} 
                alt={place.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium border border-white/20 shadow-xl">
                  <MapPin className="w-4 h-4" />
                  <span>Ver Opções</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-4 right-4 text-white pointer-events-none z-10 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold drop-shadow-sm">{name}</h2>
                {distanceText && (
                  <div className="flex items-center gap-1 text-xs text-blue-200 mt-0.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Aprox. {distanceText} de você</span>
                  </div>
                )}
              </div>
              {onNavigate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-bold shadow-lg transition-colors flex items-center gap-2 text-sm pointer-events-auto"
                >
                  <Navigation className="w-4 h-4" />
                  Ir agora
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 pb-3 flex items-start justify-between border-b border-slate-100 bg-slate-50">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Detalhes do Local</h2>
              {distanceText && (
                <div className="flex items-center gap-1 text-xs text-blue-600 mt-1 font-medium">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Aprox. {distanceText} de você</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onNavigate && (
                <button
                  onClick={onNavigate}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2.5 rounded-full transition-colors flex items-center shadow-sm"
                  title="Ir agora"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Editable Name & Address */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Estabelecimento (Editável)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do local..."
                className="w-full text-base font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400"
                required
              />
            </div>

            <div className="flex items-start justify-between gap-2 text-sm text-slate-600 px-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{place.address || 'Endereço não informado'}</span>
              </div>
              <div className="shrink-0 bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-lg border border-blue-200">
                {(() => {
                  const match = place.address.match(/n[º°]\s*(\d+)/i) || place.address.match(/,\s*(\d+)/);
                  if (match) return `Nº ${match[1]}`;
                  return `Nº ${Math.floor(Math.abs((place.lat + place.lng) * 100000) % 950) + 50} (Aprox.)`;
                })()}
              </div>
            </div>

            {place.description && (
              <div className="text-sm text-slate-700 mt-3 px-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {place.description}
              </div>
            )}

            <button 
              type="button"
              onClick={() => setViewingStreetView(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-blue-100"
            >
              <Navigation className="w-4 h-4" />
              <span>Explorar no Street View</span>
            </button>
          </div>

          {/* Google Details info (Rating, Price, Peak hours, Phone, WhatsApp) */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-sm">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Avaliação Google</span>
              <div className="flex items-center gap-2.5">
                {typeof place.rating === 'number' && (
                  <div className="flex items-center text-amber-500 font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                    <span>{place.rating.toFixed(1)}</span>
                    {typeof place.userRatingsTotal === 'number' && (
                      <span className="text-xs text-slate-400 ml-1">({place.userRatingsTotal})</span>
                    )}
                  </div>
                )}
                <a 
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-bold border border-amber-300 transition-colors shadow-xs active:scale-95"
                  title="Escrever avaliação no Google"
                >
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>Avaliar</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Média de Preço</span>
              <div className="flex items-center text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <DollarSign className="w-3.5 h-3.5 mr-0.5" />
                <span>{place.priceLevel || '$$ • Moderado'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Horário de Pico</span>
              <div className={`flex items-center font-medium text-xs px-2 py-0.5 rounded-full border ${smartPeakHours.includes('Fechado') ? 'text-slate-500 bg-slate-100 border-slate-200' : 'text-indigo-600 bg-indigo-50 border-indigo-200'}`}>
                <Users className="w-3.5 h-3.5 mr-1" />
                <span>{smartPeakHours}</span>
              </div>
            </div>

            {/* Horário de Funcionamento - Card em Destaque */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-4 h-4 ${openingStatus.isOpen ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Horário de Funcionamento</span>
                  </div>
                  
                  {/* Status Aberto / Fechado / Fecha em breve */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    openingStatus.badgeColor === 'emerald'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : openingStatus.badgeColor === 'amber'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      openingStatus.badgeColor === 'emerald'
                        ? 'bg-emerald-500 animate-pulse'
                        : openingStatus.badgeColor === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`} />
                    {openingStatus.statusText}
                  </span>
                </div>

                {/* Horário de Hoje */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="text-sm text-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 font-medium text-xs">Hoje:</span>
                    <span className={openingStatus.isOpen ? 'text-emerald-700 font-bold' : 'text-slate-800 font-semibold'}>
                      {openingStatus.todaySchedule}
                    </span>
                    {openingStatus.detailText && (
                      <span className="text-xs text-slate-500 font-normal">
                        • {openingStatus.detailText}
                      </span>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={() => setShowHours(!showHours)}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-semibold text-xs gap-1 shrink-0 ml-2 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <span>{showHours ? 'Ocultar semana' : 'Ver semana inteira'}</span>
                    {showHours ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Grade Semanal Completa */}
                {showHours && (
                  <div className="mt-2 text-xs text-slate-600 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase pb-1 border-b border-slate-200 flex justify-between items-center">
                      <span>Dias da Semana</span>
                      <span>Horário</span>
                    </div>
                    {weekdaySchedules.map((schedule, idx) => (
                      <div 
                        key={idx} 
                        className={`flex justify-between items-center py-1 px-2 rounded-md transition-colors ${
                          schedule.isToday 
                            ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200 shadow-xs' 
                            : 'border-b border-slate-200/50 last:border-0'
                        }`}
                      >
                        <span className={`capitalize flex items-center gap-1.5 ${schedule.isToday ? 'text-emerald-900 font-bold' : 'text-slate-600'}`}>
                          {schedule.dayName}
                          {schedule.isToday && (
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase">
                              Hoje
                            </span>
                          )}
                        </span>
                        <span className={`font-semibold ${
                          schedule.isClosed 
                            ? 'text-rose-600' 
                            : schedule.isToday 
                            ? 'text-emerald-700 font-bold' 
                            : 'text-slate-700'
                        }`}>
                          {schedule.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {place.phoneNumber && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-xs font-semibold text-slate-500 uppercase">Contato</span>
                <div className="flex items-center gap-2">
                  <a 
                    href={`tel:${place.phoneNumber}`} 
                    className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-medium border border-blue-200 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Ligar</span>
                  </a>
                  {whatsappUrl && (
                    <a 
                      href={whatsappUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg font-medium border border-emerald-200 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {place.website && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 truncate">
                <span className="text-xs font-semibold text-slate-500 uppercase shrink-0">Website</span>
                {onOpenWebsite ? (
                  <button onClick={() => onOpenWebsite(place.website!)} className="text-xs text-blue-600 hover:underline truncate max-w-[200px]">
                    {place.website}
                  </button>
                ) : (
                  <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[200px]">
                    {place.website}
                  </a>
                )}
              </div>
            )}

            {place.googleMapsUri && (
              <div className="pt-2 mt-1 border-t border-slate-200/60 flex justify-center">
                <a 
                  href={place.googleMapsUri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Encontrou um erro? Sugerir alteração no Google</span>
                </a>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Form to Save / Edit Category & Notes */}
          <form onSubmit={handleSaveSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Categoria do Estabelecimento
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                      category === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                
                {onAddCategory && (
                  isAddingCategory ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nova categoria"
                        className="py-1.5 px-3 rounded-xl text-xs font-medium border border-blue-300 outline-none focus:ring-2 focus:ring-blue-100 shadow-sm w-32"
                        onBlur={() => {
                          if (!newCategoryName.trim()) setIsAddingCategory(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCategoryName.trim()) {
                              onAddCategory(newCategoryName.trim());
                              setCategory(newCategoryName.trim());
                              setNewCategoryName('');
                              setIsAddingCategory(false);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            onAddCategory(newCategoryName.trim());
                            setCategory(newCategoryName.trim());
                          }
                          setNewCategoryName('');
                          setIsAddingCategory(false);
                        }}
                        className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="py-2 px-3 text-xs font-medium rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Novo
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Sua Avaliação Pessoal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Sua Avaliação do Local</span>
                {personalRating > 0 && (
                  <span className="text-amber-600 font-bold text-xs">{personalRating} de 5 estrelas</span>
                )}
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setPersonalRating(personalRating === star ? 0 : star)}
                    className="p-1 hover:scale-125 transition-transform"
                    title={`${star} estrelas`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= personalRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-500 ml-2">
                  {personalRating === 0 ? 'Toque para avaliar' : `${personalRating}/5`}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Anotações Pessoais (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Pedir o prato executivo, ótimo atendimento..."
                rows={2}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:bg-white text-slate-800 placeholder-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Fotos Salvas</span>
                  {customPhotos.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                      {customPhotos.length}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:bg-emerald-100 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors shadow-sm active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tirar Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="flex items-center gap-1.5 text-xs text-blue-700 font-medium hover:bg-blue-100 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors shadow-sm active:scale-95"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>Galeria</span>
                  </button>
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                multiple
                className="hidden" 
              />
              <input 
                type="file" 
                ref={cameraInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
              />

              {isProcessingPhoto && (
                <div className="w-full py-3 px-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center gap-2 text-blue-700 text-xs font-medium animate-pulse mb-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>
                    {processingCount > 1
                      ? `Processando e otimizando ${processingCount} fotos ao mesmo tempo...`
                      : 'Processando e otimizando imagem...'}
                  </span>
                </div>
              )}
              
              {customPhotos.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {customPhotos.map((photo, idx) => (
                    <div 
                      key={idx} 
                      className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100 shadow-sm"
                    >
                      <img 
                        src={photo} 
                        alt={`Foto ${idx + 1}`} 
                        onClick={() => setViewingPhotoIndex(idx)}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200" 
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(idx);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors shadow"
                        title="Remover foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[10px] font-medium">+ Mais</span>
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-5 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-1.5 cursor-pointer hover:bg-slate-50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Adicionar fotos do local</span>
                  <span className="text-[11px] text-slate-400">Cardápios, fachadas, preços ou recibos</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savedSuccess}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-5 h-5 text-amber-300" />
                  <span>{existingSaved ? 'Atualizar Favorito' : 'Salvar nos Favoritos'}</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>

      {/* Photo Viewer Modal */}
      {viewingPhotoIndex !== null && (
        <div className="fixed inset-0 z-[160] bg-black/95 flex flex-col animate-fadeIn">
          <div className="flex justify-between items-center p-4">
            <button
              onClick={(e) => { e.stopPropagation(); setViewingPhotoIndex(null); }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removePhoto(viewingPhotoIndex); }}
              className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-500 transition-colors flex items-center gap-2 text-sm font-medium pr-4"
            >
              <Trash2 className="w-5 h-5" />
              Excluir
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <img 
              src={customPhotos[viewingPhotoIndex]} 
              alt={`Foto ${viewingPhotoIndex + 1}`} 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
      {/* Main Photo Options Modal */}
      {showMainPhotoOptions && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowMainPhotoOptions(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">O que deseja fazer?</h3>
              <button
                onClick={() => setShowMainPhotoOptions(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button 
                onClick={() => {
                  setShowMainPhotoOptions(false);
                  setViewingStreetView(true);
                }}
                className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Ir para o Street View</div>
                  <div className="text-xs text-slate-500">Abrir a localização no mapa 3D</div>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  setShowMainPhotoOptions(false);
                  setViewingMainPhotoFullscreen(true);
                }}
                className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center shrink-0">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Ver foto em tela cheia</div>
                  <div className="text-xs text-slate-500">Expandir a imagem da fachada</div>
                </div>
              </button>
              
              <button 
                onClick={() => setShowMainPhotoOptions(false)}
                className="w-full py-3 mt-2 font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Photo Fullscreen Viewer */}
      {viewingMainPhotoFullscreen && place.photoUrl && (
        <div className="fixed inset-0 z-[170] bg-black/95 flex flex-col animate-fadeIn">
          <div className="flex justify-between items-center p-4">
            <button
              onClick={() => setViewingMainPhotoFullscreen(false)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
            <img 
              src={place.photoUrl} 
              alt={place.name} 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
      {/* Street View Embedded Fullscreen */}
      {viewingStreetView && API_KEY && (
        <StreetView
          lat={place.lat}
          lng={place.lng}
          onClose={() => setViewingStreetView(false)}
          onPinLocation={(latLng) => {
            setViewingStreetView(false);
            if (onPinFromStreetView) {
              onPinFromStreetView(latLng);
            }
          }}
        />
      )}
    </>
  );
}

