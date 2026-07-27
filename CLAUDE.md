# CLAUDE.md — KZ Audio & Video Website

Operating instructions for anyone (human or Claude) working on this site. Follow these exactly.

## What this is
Marketing site for **KZ Audio & Video**, a home theater / AV installer in San Antonio TX + the Texas Hill Country. Astro 4 + Tailwind, fully static (SSG).

- **Live:** https://kzaudioandvideo.com
- **Deploy chain:** this folder (`KZ Website/07-build`) → GitHub `KZauber/kz-audio-video-site` → Netlify auto-deploy on push to `main`. Deploys land in ~30-60s.
- **This is the live source.** The separate `source/` dir is stale — do not edit it.

## MANDATORY: run the audit before every deploy
```bash
npm run audit
```
Scans all built pages + images and flags exactly what SEO cold-callers scan for. **Must show `FAIL: 0` before you push.** WARN items should be reviewed (a few showcase gallery photos slightly over 500KB are acceptable). Run `npm run build` first so `dist/` is current. No paid SEO tool is needed — this is it.

## Images: handled automatically, do not ship bloat
- `npm run build` runs a **prebuild** step (`scripts/optimize-images.mjs`) that compresses/right-sizes every image in `public/images` in place. It is idempotent (only touches images that meaningfully shrink), so just drop new images in and build.
- **Photos must be JPG, never PNG.** PNG photos are ~5x larger. If you add a `.png`/`.PNG` photo, convert it to `.jpg`.
- **Exception: the logo stays PNG** (`kz-av-logo-transparent.png`) because it needs transparency. Never convert the logo to JPG (JPG has no alpha → ugly box behind it).
- Target: referenced images under 500KB, below-the-fold images use `loading="lazy"`.

## SEO standards enforced on every page (the audit checks these)
- **Title:** ≤ 60 characters. Format `<Keyword> <City> TX | KZ Audio & Video`; if too long, drop " TX", then shorten the keyword, then last-resort shorten brand to `| KZ Audio`. Keyword-first beats brand-first.
- **Meta description:** 150-160 characters. Include the service, the city, a concrete differentiator, and `(210) 981-4098`. Vary wording between city pages (no duplicate descriptions).
- **No em dashes (—) anywhere.** Use commas/periods. Recognized AI slop.
- **No banned words:** elevate, seamless, bespoke, cutting-edge, world-class, state-of-the-art, unlock, transform (as marketing verb).
- **Lead with authority, never with what the visitor lacks.** Hooks can create curiosity, never shame.
- Exactly one `<h1>` per page, following What + Where. Canonical tag, OG/Twitter tags, and JSON-LD schema appropriate to page type on every page.
- GEO: `public/llms.txt` and `public/robots.txt` (all AI crawlers allowed) are live — keep them updated when pages are added. Skip-to-content link is in `BaseLayout`.

## Business facts (source of truth — verify before changing)
- **Phone (everywhere):** (210) 981-4098
- **Google reviews:** pull the current count from the live GBP; do not guess. As of 2026-07-27 it is **5.0 / 29 reviews**. The count is hardcoded in these files, update ALL of them together: `src/pages/index.astro` (schema `reviewCount`), `src/components/sections/TrustBar.astro`, `src/components/sections/TestimonialsSection.astro`, `src/pages/reviews-kz-audio-video-san-antonio/index.astro` (`REVIEW_COUNT` + copy), `src/pages/flat-screen-tv-installer-san-antonio/index.astro` (schema).
- **GBP identifiers:** place_id `ChIJeyItl2-9XIYRWX6BQteFGlY`, cid `6204418596236525145`. The "Leave a Google Review" link uses the place_id.
- **Facebook:** link only `facebook.com/profile.php?id=61561030372204` (the page Kelly controls). The old `facebook.com/kzaudioandvideo` page is hijacked and shows a wrong (512) number — never link it.
- **Reviews are real only.** Testimonials live in `src/content/testimonials/testimonials.json` with `verified: true`. Never invent review text.

## Commands
- `npm run dev` — local dev server
- `npm run build` — optimizes images (prebuild) then builds to `dist/`
- `npm run audit` — site health check (run before every deploy; `dist/` must be built first)
