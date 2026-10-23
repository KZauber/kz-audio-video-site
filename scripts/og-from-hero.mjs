// Give every page its own link-preview image (og:image / twitter:image).
//
// WHY THIS EXISTS
//   Every page fell back to /images/og-default.jpg, so every Google Business Profile post,
//   Facebook share and text-message preview that linked to the site showed the same dark
//   theater photo (Kelly, 2026-10-22: "The pics on my GBP posts stay the same"). The layout
//   already accepts an ogImage prop, but no page passed one, and the hero image is only known
//   inside each page. Rather than hand-wire 80 pages (and forget the 81st), this runs after
//   the build and uses the page's own main photo.
//
// RULES
//   - Only pages still on the default are touched. A page that passes its own ogImage keeps it.
//   - Main photo = the first <img> with fetchpriority="high" (the hero), otherwise the first
//     <img> inside <main> that is a .jpg/.jpeg/.webp under /images/ and not the logo.
//   - Pages with no such photo (privacy, terms, contact) keep the default.
//   - Every og:image / twitter:image is written as an absolute https URL; previews need that.
//
// Runs in postbuild, before audit.mjs, so Netlify applies it on every deploy.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const SITE = 'https://kzaudioandvideo.com';
const DEFAULT = '/images/og-default.jpg';
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const abs = src => (src.startsWith('http') ? src : SITE + (src.startsWith('/') ? '' : '/') + src);
// A preview must never point at a file that is not there (9 pages did on 2026-10-22).
const isPhoto = src => /^\/images\/.+\.(jpe?g|webp)$/i.test(src) && !/logo/i.test(src)
  && existsSync(join(DIST, decodeURI(src)));
const srcOf = tag => (tag.match(/\ssrc=["']([^"']+)["']/i) || [])[1];

let changed = 0, kept = 0, custom = 0;
for (const file of walk(DIST)) {
  let html = readFileSync(file, 'utf8');
  const og = (html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i) || [])[1];
  if (og === undefined) continue;

  let image = null;
  if (og === DEFAULT || og === abs(DEFAULT)) {
    const imgs = html.match(/<img\b[^>]*>/gi) || [];
    const hero = imgs.find(t => /fetchpriority=["']high["']/i.test(t) && isPhoto(srcOf(t) || ''));
    if (hero) image = srcOf(hero);
    else {
      const main = html.split(/<main\b/i)[1] || '';
      const first = (main.match(/<img\b[^>]*>/gi) || []).find(t => isPhoto(srcOf(t) || ''));
      if (first) image = srcOf(first);
    }
    if (!image) { image = DEFAULT; kept++; } else changed++;
  } else {
    image = og;
    custom++;
  }

  const url = abs(image);
  html = html
    .replace(/(<meta\s+property=["']og:image["']\s+content=["'])[^"']*(["'])/i, `$1${url}$2`)
    .replace(/(<meta\s+name=["']twitter:image["']\s+content=["'])[^"']*(["'])/i, `$1${url}$2`);
  writeFileSync(file, html);
}
console.log(`[og-from-hero] ${changed} page(s) now preview their own photo, ${kept} kept the default, ${custom} set their own`);
