const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateAndroidIcons() {
  console.log('--- Iniciando geração dos ícones Android com Safe Zone ---');

  // Find the source icon in assets
  let sourcePath = 'assets/icon.png';
  if (!fs.existsSync(sourcePath)) {
    if (fs.existsSync('public/icon.png')) {
      sourcePath = 'public/icon.png';
    } else {
      console.error('Nenhum arquivo icon.png encontrado!');
      return;
    }
  }

  const inputBuffer = fs.readFileSync(sourcePath);
  console.log('Usando fonte de ícone:', sourcePath);

  // Densities for Android launcher icons
  const densities = [
    { name: 'mipmap-mdpi', legacySize: 48, adaptiveSize: 108, logoRatio: 0.60 },
    { name: 'mipmap-hdpi', legacySize: 72, adaptiveSize: 162, logoRatio: 0.60 },
    { name: 'mipmap-xhdpi', legacySize: 96, adaptiveSize: 216, logoRatio: 0.60 },
    { name: 'mipmap-xxhdpi', legacySize: 144, adaptiveSize: 324, logoRatio: 0.60 },
    { name: 'mipmap-xxxhdpi', legacySize: 192, adaptiveSize: 432, logoRatio: 0.60 }
  ];

  const resBaseDir = path.join('android', 'app', 'src', 'main', 'res');
  if (!fs.existsSync(resBaseDir)) {
    fs.mkdirSync(resBaseDir, { recursive: true });
  }

  // 1. Create values/ic_launcher_background.xml
  const valuesDir = path.join(resBaseDir, 'values');
  fs.mkdirSync(valuesDir, { recursive: true });
  const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
`;
  fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), backgroundXml);

  // 2. Create mipmap-anydpi-v26 adaptive icon XMLs
  const anydpiDir = path.join(resBaseDir, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpiDir, { recursive: true });

  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);

  // 3. Generate icons for each density
  for (const d of densities) {
    const targetDir = path.join(resBaseDir, d.name);
    fs.mkdirSync(targetDir, { recursive: true });

    // A) Adaptive Foreground (108dp standard with 60% safe zone logo in center)
    const logoTargetSize = Math.round(d.adaptiveSize * d.logoRatio);
    const resizedLogoBuffer = await sharp(inputBuffer)
      .resize(logoTargetSize, logoTargetSize, {
        fit: 'inside',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();

    const logoMeta = await sharp(resizedLogoBuffer).metadata();

    const topOffset = Math.round((d.adaptiveSize - logoMeta.height) / 2);
    const leftOffset = Math.round((d.adaptiveSize - logoMeta.width) / 2);

    await sharp({
      create: {
        width: d.adaptiveSize,
        height: d.adaptiveSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    })
    .composite([{
      input: resizedLogoBuffer,
      top: topOffset,
      left: leftOffset
    }])
    .png()
    .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    // B) Legacy square icon with solid white background and safe margins
    const legacyLogoSize = Math.round(d.legacySize * 0.85);
    const resizedLegacyLogo = await sharp(inputBuffer)
      .resize(legacyLogoSize, legacyLogoSize, {
        fit: 'inside',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toBuffer();

    const legacyMeta = await sharp(resizedLegacyLogo).metadata();

    await sharp({
      create: {
        width: d.legacySize,
        height: d.legacySize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{
      input: resizedLegacyLogo,
      top: Math.round((d.legacySize - legacyMeta.height) / 2),
      left: Math.round((d.legacySize - legacyMeta.width) / 2)
    }])
    .png()
    .toFile(path.join(targetDir, 'ic_launcher.png'));

    // C) Legacy round icon
    await sharp({
      create: {
        width: d.legacySize,
        height: d.legacySize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{
      input: resizedLegacyLogo,
      top: Math.round((d.legacySize - legacyMeta.height) / 2),
      left: Math.round((d.legacySize - legacyMeta.width) / 2)
    }])
    .png()
    .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    console.log(`✓ Gerado ícones para ${d.name} (${d.adaptiveSize}x${d.adaptiveSize} fg, ${d.legacySize}x${d.legacySize} legacy)`);
  }

  console.log('--- Todos os ícones Android foram gerados com sucesso com Margens Seguras! ---');
}

generateAndroidIcons().catch(err => {
  console.error('Erro gerando ícones:', err);
  process.exit(1);
});
