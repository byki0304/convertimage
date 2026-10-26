// Builds install icons from brand-source masters. Run: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = 'public/assets/brand/icons';
const DESKTOP_MASTER = 'brand-source/icon-desktop-master.jpg';
const MOBILE_MASTER = 'brand-source/icon-mobile-master.jpg';

// The desktop master already contains a rounded-square plate; trim the outer margin
// and cut transparent corners so OS docks/taskbars don't show a black square.
const DESKTOP_INSET = 0.018;
const DESKTOP_RADIUS = 0.2;

async function desktopBase() {
  const meta = await sharp(DESKTOP_MASTER).metadata();
  const inset = Math.round(meta.width * DESKTOP_INSET);
  const size = meta.width - inset * 2;
  const r = Math.round(size * DESKTOP_RADIUS);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
  );
  return sharp(DESKTOP_MASTER)
    .extract({ left: inset, top: inset, width: size, height: size })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(`${OUT}/desktop`, { recursive: true });
  await mkdir(`${OUT}/mobile`, { recursive: true });

  const desktop = await desktopBase();
  for (const size of [16, 32, 48, 64, 128, 192, 256, 512]) {
    await sharp(desktop)
      .resize(size, size, { kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toFile(`${OUT}/desktop/icon-${size}.png`);
  }

  for (const size of [192, 512]) {
    await sharp(MOBILE_MASTER)
      .resize(size, size, { kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toFile(`${OUT}/mobile/maskable-${size}.png`);
  }
  // iOS ignores transparency and applies its own corner mask, so use the full-bleed art.
  await sharp(MOBILE_MASTER)
    .resize(180, 180, { kernel: 'lanczos3' })
    .flatten({ background: '#0B0C10' })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/mobile/apple-touch-icon.png`);

  console.log('Icons generated in', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
