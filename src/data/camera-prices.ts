/**
 * Single source for the camera price cards and real jobs on the site.
 *
 * Kelly approved these 2026-11-05 ("Lets publish"). Ranges are worked out from KZ's own camera
 * quotes; the workings are in kz/website/Camera-Real-Quotes-DRAFT-2026-11-05.md (SocialMedia repo).
 * If a number changes here, also change the sentences on the camera page, the camera cost page,
 * the UniFi page and public/llms.txt.
 *
 * RULE: no customer names, no addresses, no per-cable prices, and no builder prices or builder jobs
 * (Kelly, 2026-11-05). A job says "sold" only when Kelly has said so; otherwise it says "quoted".
 */

export const CAMERA_TIERS = [
  { t: 'Three to four wired 4K cameras', d: 'With a recorder in your home and no monthly fee.', p: '$2,200 to $3,700' },
  { t: 'Five to eight wired 4K cameras', d: 'With a recorder in your home and no monthly fee.', p: '$3,300 to $6,200' },
  { t: 'Nine to sixteen wired 4K cameras', d: 'With a high-capacity recorder in your home.', p: '$6,000 to $12,300' },
  { t: 'WiFi cameras', d: 'Two to four Ring cameras with solar, only where there is no way to wire. Saving video takes a Ring plan.', p: '$700 to $1,400' },
];

export const CAMERA_JOBS = [
  { t: 'Two Ring cameras with solar', d: 'Two Ring Spotlight Cams with solar panels, mounted, aimed and set up on your devices.', p: '$670', s: 'Quoted, October 2026' },
  { t: 'Three wired 4K cameras, replacing old ones', d: 'A four-channel recorder with 2TB, three Illumivue 4K turret cameras, the old cameras taken down, and the app set up on your devices.', p: '$2,160', s: 'Quoted, October 2026' },
  { t: 'Nine cameras on a Boerne home', d: 'A sixteen-channel recorder with 10TB, six Illumivue 8MP low-light turret cameras, three dual-lens zoom cameras, and three new cable runs.', p: '$13,100', s: 'Sold, quoted October 2026' },
];

export const CAMERA_PRICE_NOTE = 'Real KZ Audio & Video jobs. All prices are before sales tax on materials. Poles, trenching and long runs are quoted per job.';
