// Site health check — run with `npm run audit` (after a build).
// Flags the exact things SEO cold-callers scan for, so you catch them first:
// oversized images, bad meta lengths, missing alt text, H1 problems,
// missing canonical/description, and heavy pages. Free. No paid tool needed.
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, dirname, extname, basename, relative } from 'path';
import { fileURLToPath } from 'url';

const BASE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(BASE, 'dist');
const PUB_IMAGES = join(BASE, 'public', 'images');

// thresholds
const IMG_WARN = 500 * 1024;      // realistic cap for photographic content
const PAGE_WARN = 2.2 * 1048576;  // total est. page weight (HTML+imgs)
const DESC_MIN = 140, DESC_MAX = 165;
const TITLE_MAX = 60;

const problems = [];
const add = (sev, where, msg) => problems.push({ sev, where, msg });

// Decode common HTML entities so lengths reflect what Google actually counts
// (a rendered character), not the raw entity (&amp; is 1 char, not 5).
function decode(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&#38;/g, '&')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#8211;/g, '–').replace(/&ndash;/g, '–')
    .replace(/&#8217;/g, '’').replace(/&nbsp;/g, ' ');
}

function walk(dir, test) {
  let out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p, test));
    else if (test(p)) out.push(p);
  }
  return out;
}

// Index every image (path -> size) for weight + size lookups.
const imgs = walk(PUB_IMAGES, f => /\.(jpe?g|png|webp)$/i.test(f));
const imgSize = new Map(imgs.map(f => ['/images/' + relative(PUB_IMAGES, f).replace(/\\/g, '/'), statSync(f).size]));
// Only images a real page actually loads matter for speed; collect those as we scan pages.
const referenced = new Set();

// 2) Per-page HTML checks
const htmls = walk(DIST, f => f.endsWith('.html'));
for (const f of htmls) {
  const html = readFileSync(f, 'utf8');
  const url = '/' + relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '');

  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '');
  const descRaw = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1];
  const desc = descRaw === undefined ? undefined : decode(descRaw);
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  const hasCanonical = /<link\s+rel="canonical"/i.test(html);
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  const noAlt = imgTags.filter(t => !/\balt\s*=/.test(t)).length;

  if (!title) add('FAIL', url, 'missing <title>');
  else if (title.length > TITLE_MAX) add('WARN', url, `title ${title.length} chars (> ${TITLE_MAX})`);
  if (desc === undefined) add('FAIL', url, 'missing meta description');
  else if (desc.length < DESC_MIN || desc.length > DESC_MAX) add('WARN', url, `meta description ${desc.length} chars (aim ${DESC_MIN}-${DESC_MAX})`);
  if (h1s === 0) add('FAIL', url, 'no <h1>');
  else if (h1s > 1) add('WARN', url, `${h1s} <h1> tags (should be 1)`);
  if (!hasCanonical) add('WARN', url, 'no canonical tag');
  if (noAlt > 0) add('WARN', url, `${noAlt} image(s) missing alt text`);

  // Initial page weight = HTML + only images that load upfront. Below-the-fold
  // images with loading="lazy" don't block initial render, so they don't count.
  let weight = Buffer.byteLength(html);
  const allRefs = new Set((html.match(/\/images\/[^"'?)\s]+\.(?:jpe?g|png|webp)/gi) || []));
  allRefs.forEach(r => referenced.add(r));
  // eager images: <img> tags without loading="lazy", plus any /images in inline styles (hero bg)
  const eager = new Set();
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    if (/loading\s*=\s*["']lazy["']/i.test(tag)) continue;
    const m = tag.match(/\/images\/[^"'?)\s]+\.(?:jpe?g|png|webp)/i);
    if (m) eager.add(m[0]);
  }
  for (const m of html.match(/style="[^"]*\/images\/[^"'?)\s]+\.(?:jpe?g|png|webp)[^"]*"/gi) || []) {
    const u = m.match(/\/images\/[^"'?)\s]+\.(?:jpe?g|png|webp)/i); if (u) eager.add(u[0]);
  }
  for (const r of eager) weight += imgSize.get(r) || 0;
  if (weight > PAGE_WARN) add('WARN', url, `initial load ~${(weight/1048576).toFixed(1)}MB (target < ${(PAGE_WARN/1048576).toFixed(1)}MB)`);
}

// Oversized images — only ones a page actually loads (unused files don't slow anything).
for (const r of referenced) {
  const kb = imgSize.get(r) || 0;
  if (kb > IMG_WARN) add('WARN', r, `image is ${(kb/1024).toFixed(0)}KB (target < ${IMG_WARN/1024}KB)`);
}

// report
const fails = problems.filter(p => p.sev === 'FAIL');
const warns = problems.filter(p => p.sev === 'WARN');
const order = { FAIL: 0, WARN: 1 };
problems.sort((a, b) => order[a.sev] - order[b.sev] || a.where.localeCompare(b.where));

console.log(`\n=== KZ site health check ===`);
console.log(`Pages scanned: ${htmls.length}   Images scanned: ${imgs.length}`);
console.log(`FAIL: ${fails.length}   WARN: ${warns.length}\n`);
for (const p of problems) {
  console.log(`${p.sev === 'FAIL' ? 'X' : '!'} [${p.sev}] ${p.where}\n     ${p.msg}`);
}
if (!problems.length) console.log('All clear. No issues found.');
console.log('');
// non-zero exit if hard failures, so CI/build can gate on it
process.exit(fails.length ? 1 : 0);
