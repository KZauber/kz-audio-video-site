// Auto image optimizer — runs on every build via the "prebuild" npm hook.
// Compresses/right-sizes any oversized image in public/images IN PLACE
// (same filename, so no code references change). Idempotent: images already
// within the size + dimension budget are skipped, so quality never drifts
// across rebuilds and builds stay fast.
import sharp from 'sharp';
import { readdirSync, statSync, renameSync, unlinkSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');
const JPG_MAX_W = 1400;      // full-bleed hero cap (sharp on retina, keeps files lean)
const LOGO_MAX_W = 500;      // logos display small; 2x retina is plenty
const JPG_QUALITY = 80;
const JPG_BUDGET = 300 * 1024;  // already-fine JPG threshold
const LOGO_BUDGET = 60 * 1024;  // already-fine logo/PNG threshold

function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT).filter(f => /\.(jpe?g|png)$/i.test(f));
let saved = 0, changed = 0;

for (const f of files) {
  const before = statSync(f).size;
  const isPng = extname(f).toLowerCase() === '.png';
  const isLogo = /logo|kz-mark/i.test(basename(f));
  const maxW = isLogo ? LOGO_MAX_W : JPG_MAX_W;
  const budget = isLogo ? LOGO_BUDGET : JPG_BUDGET;

  try {
    const meta = await sharp(f).metadata();
    // Idempotency guard: within budget AND within dimensions -> leave it alone.
    if (before <= budget && (!meta.width || meta.width <= maxW)) continue;

    const tmp = f + '.tmp';
    let pipe = sharp(f, { failOn: 'none' }).rotate();
    if (meta.width && meta.width > maxW) pipe = pipe.resize({ width: maxW });
    pipe = isPng
      ? pipe.png({ compressionLevel: 9, palette: true, quality: 90 })
      : pipe.jpeg({ quality: JPG_QUALITY, mozjpeg: true });

    await pipe.toFile(tmp);
    const after = statSync(tmp).size;
    // Only overwrite on a MEANINGFUL saving (>15% AND >20KB). This keeps the
    // step idempotent: once an image is optimized, later builds save little
    // and leave it untouched, so quality never drifts across rebuilds.
    const worthIt = (before - after) > Math.max(20 * 1024, before * 0.15);
    if (worthIt) {
      unlinkSync(f); renameSync(tmp, f);
      saved += before - after; changed++;
      console.log(`  optimized ${basename(f)}: ${(before/1024).toFixed(0)}KB -> ${(after/1024).toFixed(0)}KB`);
    } else {
      unlinkSync(tmp);
    }
  } catch (err) {
    console.log(`  skip ${basename(f)}: ${err.message.slice(0, 50)}`);
  }
}

console.log(`[optimize-images] ${changed} image(s) optimized, ${(saved/1048576).toFixed(2)} MB saved`);
