import fs from 'fs';
import path from 'path';

async function createSilhouetteBuffer(sharpInstance, sourceFile, size) {
  const resized = await sharpInstance(sourceFile)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const outData = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0, j = 0; i < data.length; i += info.channels, j += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = info.channels === 4 ? data[i + 3] : 255;

    const brightness = (r + g + b) / 3;
    let silhouetteAlpha = 0;
    if (a > 20) {
      if (brightness < 240) {
        silhouetteAlpha = Math.min(255, Math.round((255 - brightness) * (a / 255) * 1.2));
      }
    }
    outData[j] = 255;     // White R
    outData[j + 1] = 255; // White G
    outData[j + 2] = 255; // White B
    outData[j + 3] = silhouetteAlpha;
  }

  return sharpInstance(outData, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

async function generateIcons() {
  const iconSrc = fs.existsSync(path.resolve('public', 'icon2.png'))
    ? path.resolve('public', 'icon2.png')
    : path.resolve('public', 'icon.png');

  const resDir = path.resolve('android', 'app', 'src', 'main', 'res');

  if (!fs.existsSync(iconSrc)) {
    console.error('Source icon not found:', iconSrc);
    return;
  }

  // Also save a copy of ic_stat_icon.png to public/ for reference
  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch (e) {
    console.log('Sharp not installed, will use fallback copying.');
  }

  if (sharp) {
    try {
      const statBuf = await createSilhouetteBuffer(sharp, iconSrc, 96);
      fs.writeFileSync(path.resolve('public', 'ic_stat_icon.png'), statBuf);
      console.log('✅ Generated public/ic_stat_icon.png monochrome silhouette icon');
    } catch (err) {
      console.warn('Failed to write public/ic_stat_icon.png:', err);
    }
  }

  if (!fs.existsSync(resDir)) {
    console.log('Android res directory not found yet, skipping icon generation until android platform is added.');
    return;
  }

  const sizes = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
  ];

  for (const item of sizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (sharp) {
      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher.png'));

      await sharp(iconSrc)
        .resize(item.size, item.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

      await sharp(iconSrc)
        .resize(item.fgSize, item.fgSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_round.png'));
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_launcher_foreground.png'));
    }
  }

  // Generate notification small icon (ic_stat_icon.png) for status bar / notifications in white silhouette format
  const statIconSizes = [
    { dir: 'drawable', size: 24 },
    { dir: 'drawable-mdpi', size: 24 },
    { dir: 'drawable-hdpi', size: 36 },
    { dir: 'drawable-xhdpi', size: 48 },
    { dir: 'drawable-xxhdpi', size: 72 },
    { dir: 'drawable-xxxhdpi', size: 96 }
  ];

  for (const item of statIconSizes) {
    const targetFolder = path.join(resDir, item.dir);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    if (sharp) {
      const silBuf = await createSilhouetteBuffer(sharp, iconSrc, item.size);
      fs.writeFileSync(path.join(targetFolder, 'ic_stat_icon.png'), silBuf);
    } else {
      fs.copyFileSync(iconSrc, path.join(targetFolder, 'ic_stat_icon.png'));
    }
  }

  const drawableDirs = ['drawable', 'drawable-land-hdpi', 'drawable-land-mdpi', 'drawable-land-xhdpi', 'drawable-land-xxhdpi', 'drawable-land-xxxhdpi', 'drawable-port-hdpi', 'drawable-port-mdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi'];
  for (const d of drawableDirs) {
    const dPath = path.join(resDir, d);
    if (fs.existsSync(dPath)) {
      fs.copyFileSync(iconSrc, path.join(dPath, 'splash.png'));
    }
  }

  console.log('✅ Android icons & monochrome notification small icons successfully injected!');
}

generateIcons().catch(console.error);
