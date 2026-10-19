// Site health check. Drop-in, zero dependencies, works on any static build.
//
// INSTALL
//   1. copy this file to  scripts/audit.mjs  in the project
//   2. add to package.json:  "audit": "node scripts/audit.mjs"
//   3. run `npm run build` first so dist/ is current, then `npm run audit`
//
// Assumes build output in ./dist and images in ./public/images.
// Change DIST / PUB_IMAGES below if the project differs.
//
// FAIL: 0 is the deploy gate. Exits non-zero so CI can block on it.
// Shipped with the website-build-standard skill. Keep the two in sync.
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
const VIDEO_WARN_MB = 4, VIDEO_FAIL_MB = 8;  // hero loop budgets, see SKILL.md "Cinematic Hero"

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

// Tolerates a missing directory. Not every project has public/images, and a site
// without one is a valid site, not a crash. Previously this threw ENOENT and took
// the whole audit down before a single check ran, which meant the audit silently
// went unused on exactly the projects that most needed it.
function walk(dir, test) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return out;
    throw err;
  }
  for (const e of entries) {
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
// Cross-page state, filled during the scan and evaluated after it.
const titles   = new Map();  // title -> [urls]
const pageUrls = [];         // every page url
const inbound  = new Set();  // urls that at least one internal link points at
const pageText = new Map();  // url -> visible text
const videoRefs = new Set(); // local video paths any page references

// 2) Per-page HTML checks
const htmls = walk(DIST, f => f.endsWith('.html'));

// An audit that finds nothing must not report a clean bill of health. Without
// this, a wrong DIST path, a failed build, or an unbuilt project all print
// "FAIL: 0" and read as a pass. Silent success is the worst possible output for
// a checking tool, so treat an empty dist as a hard failure.
if (htmls.length === 0) {
  console.error(`=== site health check ===`);
  console.error(`X [FAIL] no .html files found in ${DIST}`);
  console.error(`    Did the build run? Is DIST pointing at the right folder?`);
  console.error(`    This is a failure, not a pass: nothing was checked.`);
  process.exit(1);
}
for (const f of htmls) {
  const html = readFileSync(f, 'utf8');
  // Handles both Astro output formats: about/index.html and about.html are both
  // the page /about/ here, so the orphan check matches links either way.
  const url = '/' + relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '/');

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

  // CANONICAL MUST NAME THE PAGE ITSELF. Added 2026-10-15: switching Astro to
  // build.format 'file' made every canonical on zaubergroup.com end in .html, a second
  // address for each page that Netlify also serves. The presence check above passed it,
  // and it was live for about two hours before a manual look caught it.
  const canon = (html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) || [])[1];
  if (canon) {
    let cpath;
    try { cpath = new URL(canon, 'https://x.invalid').pathname; } catch { cpath = canon; }
    if (/\.html?$/i.test(cpath) || /\/index$/i.test(cpath)) {
      add('FAIL', url, `canonical points at a file name (${cpath}); use the clean URL the page is served at`);
    } else {
      const norm = cpath.endsWith('/') ? cpath : cpath + '/';
      if (norm !== url) add('WARN', url, `canonical points at ${cpath}, not at this page`);
    }
  }
  if (noAlt > 0) add('WARN', url, `${noAlt} image(s) missing alt text`);

  // Copy rules from CLAUDE.md. These were stated but unenforced, so 1000+ em dashes
  // accumulated before anyone noticed.
  //
  // "Copy" is every surface a human or an AI reads, which is more than the body text:
  //   1. visible text   - what a visitor sees
  //   2. JSON-LD schema - what Google and the LLMs parse; lives in a <script>
  //   3. meta + a11y    - title, description, OG/Twitter, alt, aria-label
  // Checking only #1 would let an em dash sit in a meta description forever.
  // Deliberately NOT checked: HTML comments and non-JSON-LD scripts (not reader-facing).
  const noComments = html.replace(/<!--[\s\S]*?-->/g, '');

  const visibleText = decode(
    noComments.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
  );
  pageUrls.push(url);
  pageText.set(url, visibleText);

  // EMPTY RENDER. The most expensive failure this audit can catch, and the one
  // nothing checked before. A client-only SPA emits <div id="root"></div> and
  // hides every word inside the JS bundle. Google renders that unreliably on a
  // delayed second pass; GPTBot, ClaudeBot and PerplexityBot never render it at
  // all, so the page cannot be cited in AI search under any circumstances.
  //
  // Woolsey Design Build shipped exactly this: 46 routes, 0 words, no <h1>, one
  // shared <title>. It ran 3.5 months and earned zero non-brand keywords before
  // anyone looked. Everything else in this file is cosmetic next to it, so it is
  // a hard FAIL, and it is checked first.
  const wordCount = visibleText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 150) {
    add('FAIL', url,
      `only ${wordCount} words in static HTML: page is not server-rendered. ` +
      `AI crawlers do not execute JS and will see nothing here. Prerender or SSG this route.`);
  }

  if (title) { if (!titles.has(title)) titles.set(title, []); titles.get(title).push(url); }
  // Match internal hrefs with OR without a trailing slash, then normalise to the
  // trailing-slash form `url` uses. The old pattern required a trailing slash, so on
  // any site emitting href="/about" it matched nothing and reported every page an orphan.
  for (const m of new Set(html.match(/href="(\/[^"#?]*)"/g) || [])) {
    let t = m.match(/href="(\/[^"#?]*)"/)[1];
    if (!t.endsWith('/')) t += '/';
    if (t !== url) inbound.add(t);
  }

  const jsonLd = (noComments.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || []).join(' ');
  const metaAndA11y = decode(
    (noComments.match(/<title>[^<]*<\/title>/gi) || [])
      .concat(noComments.match(/<meta[^>]+(?:name="(?:description|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/gi) || [])
      .concat(noComments.match(/(?:alt|aria-label)="[^"]*"/gi) || [])
      .join(' ')
  );

  for (const [label, text] of [['copy', visibleText], ['JSON-LD schema', jsonLd], ['meta/alt text', metaAndA11y]]) {
    const n = (text.match(/\u2014/g) || []).length;
    if (n > 0) add('FAIL', url, `${n} em dash(es) in ${label} (CLAUDE.md: use commas/periods)`);
  }

  // Banned-word scan stays on visible copy only.
  const visible = visibleText;
  // WARN not FAIL: some of these have legitimate technical uses. Example from the
  // KZ build: "seamless" on a micro LED page describes literal zero-bezel tile
  // construction. Document any accepted exception in a comment right here.
  const BANNED = ['elevate','seamless','bespoke','cutting-edge','world-class','state-of-the-art','unlock'];
  const hits = BANNED.filter(w => new RegExp(`\\b${w.replace(/-/g,'[- ]')}\\b`, 'i').test(visible));
  if (hits.length) add('WARN', url, `banned word(s) in copy: ${hits.join(', ')}`);

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

  // BACKGROUND VIDEO. Added 2026-10-15 with the cinematic hero rule in SKILL.md.
  // The agency sample that prompted the rule shipped a 122 MB, 152-second listing
  // video set to autoplay on phones. A looping video (the `loop` attribute marks a
  // background loop; a real player with controls is left alone) needs all three:
  //   muted       - browsers refuse to autoplay sound, so the hero sits blank
  //   playsinline - iOS refuses to autoplay a video inline without it
  //   poster      - the still shown before the first frame and under reduced motion
  let loopVideo = false;
  for (const tag of noComments.match(/<video\b[^>]*>/gi) || []) {
    if (!/\sloop(?=[\s>=\/])/i.test(tag)) continue;
    loopVideo = true;
    const missing = [];
    if (!/\smuted(?=[\s>=\/])/i.test(tag)) missing.push('muted');
    if (!/\splaysinline(?=[\s>=\/])/i.test(tag)) missing.push('playsinline');
    if (!/\sposter\s*=/i.test(tag)) missing.push('poster');
    if (missing.length) add('FAIL', url, `background video missing ${missing.join(', ')}`);
  }
  if (loopVideo && !/aria-label="[^"]*pause[^"]*"/i.test(noComments)) {
    add('WARN', url, 'background video has no pause button (motion longer than 5 seconds needs a way to stop it, WCAG 2.2.2)');
  }
  for (const m of noComments.matchAll(/["'](\/[^"'?#\s]+\.(?:mp4|webm|mov))["'?#]/gi)) videoRefs.add(m[1]);
}

// Video files a page references, sized from dist/ (Astro copies public/ there).
// SKILL.md budgets the 1080p file at 4 MB. The 720p file's 1.5 MB is a hand check.
for (const v of videoRefs) {
  let size;
  try { size = statSync(join(DIST, v)).size; } catch { add('WARN', v, 'video file referenced but not found in dist'); continue; }
  const mb = size / 1048576;
  if (mb > VIDEO_FAIL_MB) add('FAIL', v, `video is ${mb.toFixed(1)}MB (budget 4MB; a hero loop is 10 to 15 seconds)`);
  else if (mb > VIDEO_WARN_MB) add('WARN', v, `video is ${mb.toFixed(1)}MB (budget 4MB)`);
}

// Oversized images: only ones a page actually loads (unused files don't slow anything).
for (const r of referenced) {
  const kb = imgSize.get(r) || 0;
  if (kb > IMG_WARN) add('WARN', r, `image is ${(kb/1024).toFixed(0)}KB (target < ${IMG_WARN/1024}KB)`);
}

// ---------------------------------------------------------------------------
// Cross-page checks. These need every page collected first, so they run here
// rather than inside the per-page loop. All three come from real problems found
// on the KZ build in 2026-07 that no single-page check could have caught.
// ---------------------------------------------------------------------------

// 1. DUPLICATE TITLE TAGS = keyword cannibalization.
//    KZ had seven cities with two URLs each, five of them byte-identical titles.
//    Two of your own pages competing for one query. FAIL: this is never intentional.
for (const [t, urls] of titles) {
  if (urls.length > 1) {
    add('FAIL', urls[0], `duplicate <title> on ${urls.length} URLs (cannibalization): ${urls.slice(1).join(', ')}`);
  }
}

// 2. ORPHAN PAGES = zero inbound internal links.
//    KZ's best city pages (950-2100 words) had 0 inbound links while the thinner
//    hub pages had 85. Content nothing links to cannot rank and will not be crawled
//    often. WARN, because a deliberately unlinked landing page is a valid choice.
for (const url of pageUrls) {
  if (url === '/') continue;
  if (!inbound.has(url)) add('WARN', url, 'orphan page: no internal links point here');
}

// 3. HARDCODED PAST YEAR in evergreen copy.
//    The build standard already banned this; nothing checked it, so "in 2025" and
//    "Best TVs 2024-2025" sat on the live site into 2026. Only flags a year that has
//    already passed, and skips historical framings (since/founded/built/from).
const THIS_YEAR = new Date().getFullYear();
for (const [url, text] of pageText) {
  const hits = new Set();
  for (const m of text.matchAll(/(\w+)\s+(20\d\d)/g)) {
    const [, prev, yr] = m;
    // Only recent years read as stale. 'started in 2009' is history and fine;
    // 'in 2025' during 2026 reads as out of date. Window of 2 years keeps noise low.
    if (+yr >= THIS_YEAR || +yr < THIS_YEAR - 2) continue;
    if (/^(since|founded|built|installed|started|from|in_business|established|until)$/i.test(prev)) continue;
    // Only flag framings that imply currency. 'of 2005' / 'for 2008' are historical
    // references and legitimate; 'in 2025' / 'guide 2024' go stale and read dated.
    if (/^(in|edition|guide|update|updated|version)$/i.test(prev)) hits.add(`${prev} ${yr}`);
  }
  if (hits.size) add('WARN', url, `stale hardcoded year in copy: ${[...hits].join(', ')} (use "today"/"now")`);
}

// ---------------------------------------------------------------------------
// DESIGN CHECKS. Added 2026-09-29, after a build passed every check above and
// still looked wrong.
//
// Everything before this point gates text, SEO and weight. Nothing gated how a
// site LOOKS, so "no emoji icons", "everything uses clamp()", "two fonts" and
// the rest of the design floor sat stated-but-unenforced. That is the same
// failure that let 1,093 em dashes pile up: a stated rule with no check is not
// a rule.
//
// These cannot see beauty. They can see DISCIPLINE, and its absence is what a
// bad-looking build usually is: forty scattered hex values instead of a token
// palette, twenty-five arbitrary font sizes instead of a scale, four typefaces,
// fixed pixel type that breaks between breakpoints. Thresholds are calibrated
// so the Canyon reference build (references/canyon-custom-homes.html) passes
// clean. If a change makes Canyon fail, the threshold is wrong, not Canyon.
// ---------------------------------------------------------------------------
const MAX_HEX = 30;       // distinct colors before it stops being a palette
const MAX_SIZES = 32;     // distinct font-size values before it stops being a scale
                          // (Canyon, hand-built and beautiful, runs 24. Real pages
                          // carry one-offs for nav, buttons and footnotes, so the
                          // line sits above the reference, not at it.)
const MAX_FAMILIES = 3;   // Canyon's whole look is two: one serif, one sans

const cssText = [
  ...walk(DIST, f => f.endsWith('.css')).map(f => readFileSync(f, 'utf8')),
  ...htmls.flatMap(f => readFileSync(f, 'utf8').match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [])
].join('\n');

if (!cssText.trim()) {
  add('WARN', '(site-wide)', 'no CSS found in dist: design checks did not run');
} else {
  // Normalise #abc and #aabbccdd to a comparable 6-digit RGB so shorthand and
  // alpha variants of one color do not inflate the count.
  const hex = new Set();
  for (const h of cssText.match(/#[0-9a-fA-F]{3,8}\b/g) || []) {
    let v = h.slice(1).toLowerCase();
    if (v.length === 3 || v.length === 4) v = v.split('').map(c => c + c).join('');
    hex.add(v.slice(0, 6));
  }
  if (!/:root[^{]*\{[^}]*--[\w-]+\s*:/.test(cssText)) {
    add('WARN', '(site-wide CSS)',
      'no :root custom-property palette: colors and spacing are hardcoded per rule. ' +
      'Copy the token block from references/canyon-patterns.md.');
  }
  if (hex.size > MAX_HEX) {
    add('WARN', '(site-wide CSS)',
      `${hex.size} distinct colors (target < ${MAX_HEX}). That is not a palette. ` +
      `Canyon ships its entire look on ~11 tokens.`);
  }

  const sizes = new Set((cssText.match(/font-size\s*:\s*[^;}]+/gi) || [])
    .map(s => s.split(':').slice(1).join(':').replace(/\s+/g, ' ').trim().toLowerCase()));
  if (sizes.size > MAX_SIZES) {
    add('WARN', '(site-wide CSS)',
      `${sizes.size} distinct font-size values (target < ${MAX_SIZES}): no type scale. ` +
      `Use the .heading-xl through .label utility classes instead of one-off sizes.`);
  }

  const fams = new Set();
  for (const m of cssText.match(/font-family\s*:\s*[^;}]+/gi) || []) {
    const first = m.split(':').slice(1).join(':').split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
    if (first && !/^(inherit|initial|unset|revert|var\()/.test(first)) fams.add(first);
  }
  if (fams.size > MAX_FAMILIES) {
    add('WARN', '(site-wide CSS)',
      `${fams.size} typefaces (${[...fams].slice(0, 6).join(', ')}): target ${MAX_FAMILIES} or fewer. ` +
      `Restraint is the first thing that makes the reference builds look expensive.`);
  }

  if (!/\bclamp\s*\(/i.test(cssText)) {
    add('WARN', '(site-wide CSS)',
      'no clamp() anywhere: type and spacing are fixed and will break between breakpoints. ' +
      'The reference build puts clamp() on every font size and section padding.');
  }
}

// Emoji used as icons. A stated hard rule ("SVG only, Lucide or Heroicons")
// that nothing checked. Reports the actual characters so a false positive is
// obvious at a glance rather than something to argue with.
// U+2605/2606 (star, hollow star) are deliberately excluded: star ratings are a
// legitimate typographic use and the Canyon reference build itself uses them.
// Flagging those trains people to ignore the check, which costs more than it saves.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{2604}\u{2607}-\u{27BF}\u{2B00}-\u{2BFF}]\u{FE0F}?/gu;
for (const [url, text] of pageText) {
  const found = [...new Set(text.match(EMOJI) || [])];
  if (found.length) {
    add('FAIL', url, `emoji used in page content: ${found.join(' ')} (SVG icons only: Lucide, Heroicons)`);
  }
}

// report
const fails = problems.filter(p => p.sev === 'FAIL');
const warns = problems.filter(p => p.sev === 'WARN');
const order = { FAIL: 0, WARN: 1 };
problems.sort((a, b) => order[a.sev] - order[b.sev] || a.where.localeCompare(b.where));

console.log(`\n=== site health check ===`);
console.log(`Pages scanned: ${htmls.length}   Images scanned: ${imgs.length}`);
console.log(`FAIL: ${fails.length}   WARN: ${warns.length}\n`);
for (const p of problems) {
  console.log(`${p.sev === 'FAIL' ? 'X' : '!'} [${p.sev}] ${p.where}\n     ${p.msg}`);
}
if (!problems.length) console.log('All clear. No issues found.');
console.log('');
// non-zero exit if hard failures, so CI/build can gate on it
process.exit(fails.length ? 1 : 0);
