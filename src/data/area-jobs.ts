/**
 * Real KZ jobs shown on the town pages (Kelly, 2026-11-27: "Yes, strengthen them", meaning strengthen
 * the town pages with real jobs instead of a separate page for every service in every town).
 *
 * Every job here is a real KZ install with its own photo. One town per job, used the same way on
 * every page. The barn is in Dripping Springs (Kelly, 2026-11-27). Where a job shows no town, Kelly's
 * rule applies (2026-11-25: "if we have a project that doesnt show any town, we can name it what we
 * want"): the Ring job is New Braunfels (Kelly: "lets say new braunfels"), the UniFi camera and Wi-Fi
 * job is Bulverde.
 *
 * RULES: no customer names, no builder names, no addresses, no builder prices. Never "no monthly
 * fees" on a Ring job (saving Ring video takes a Ring plan). Captions say only what the photo or
 * the job record shows.
 */

import { CAMERA_JOBS } from './camera-prices';

type Covers = 'cameras' | 'wifi' | 'audio';

export interface AreaJob {
  title: string;
  location: string;
  service: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
  linkLabel: string;
  lat: number;
  lng: number;
  covers: Covers[];
}

const NEW_BRAUNFELS = { lat: 29.703, lng: -98.124 };
const BULVERDE = { lat: 29.744, lng: -98.453 };
const DRIPPING_SPRINGS = { lat: 30.19, lng: -98.087 };
const SAN_ANTONIO = { lat: 29.53, lng: -98.49 };

export const AREA_JOBS: AreaJob[] = [
  {
    title: 'Ring Cameras on Solar Where No Cable Could Go',
    location: 'New Braunfels, TX',
    service: 'Security Cameras',
    description:
      'Ring Spotlight Cams with solar panels, mounted on the timber porch posts and beams. We used WiFi cameras here because there was no way to run a cable.',
    imageSrc: '/images/projects/ring-solar/ring-spotlight-cam-solar-panel-timber-post.jpg',
    imageAlt: 'Ring Spotlight Cam with a Ring solar panel mounted on a timber porch post by KZ Audio & Video in New Braunfels',
    href: '/security-camera-installation-san-antonio/',
    linkLabel: 'Security cameras',
    ...NEW_BRAUNFELS,
    covers: ['cameras'],
  },
  {
    title: 'Barn Wired for Wi-Fi, Starlink and Music',
    location: 'Dripping Springs, TX',
    service: 'Low Voltage',
    description:
      'The low voltage ran before drywall, across the floor of the insulated barn. Finished, the barn has UniFi Wi-Fi, Starlink and two zones of music with speakers on the wall.',
    imageSrc: '/images/projects/barn-prewire/barn-low-voltage-prewire-dripping-springs.jpg',
    imageAlt: 'Low voltage cable runs across the floor of an insulated barn before drywall, prewired by KZ Audio & Video in Dripping Springs',
    href: '/low-voltage-prewire-builders-san-antonio/',
    linkLabel: 'Low voltage prewire',
    ...DRIPPING_SPRINGS,
    covers: ['wifi', 'audio'],
  },
  {
    title: 'Wired Cameras and Outdoor Wi-Fi on a Metal Building',
    location: 'Bulverde, TX',
    service: 'Cameras and Wi-Fi',
    description:
      'Wired UniFi cameras and U7 Pro Outdoor access points on the house and the metal building, on the same network as the home\'s Wi-Fi.',
    imageSrc: '/images/projects/unifi-cameras/unifi-camera-outdoor-access-point-metal-building.jpg',
    imageAlt: 'Wired UniFi camera and U7 Pro Outdoor access point on a metal building, installed by KZ Audio & Video in Bulverde',
    href: '/unifi-installer-san-antonio/',
    linkLabel: 'UniFi cameras and Wi-Fi',
    ...BULVERDE,
    covers: ['cameras', 'wifi'],
  },
  {
    title: 'Network, Cameras and Music in One Rack',
    location: 'San Antonio, TX',
    service: 'New Construction',
    description:
      'Set before drywall in a new build: six Sonos Amps for the rooms of the house, an Illumivue camera recorder, a UniFi gateway and Furman power, all in one rack.',
    imageSrc: '/images/projects/unifi-racks/unifi-network-audio-rack-new-build-san-antonio.jpg',
    imageAlt: 'Network and audio rack set before drywall in a new home, with six Sonos Amps, an Illumivue camera recorder, a UniFi gateway and a Furman power unit',
    href: '/home-network-installation-san-antonio/',
    linkLabel: 'Home networks',
    ...SAN_ANTONIO,
    covers: ['wifi', 'audio'],
  },
  {
    title: 'Music in Five Zones From One Wall Cabinet',
    location: 'San Antonio, TX',
    service: 'Whole House Audio',
    description:
      'A wall-mounted rack in a finished home: patch panel, UniFi switch and gateway, and the music for the master bath, master bedroom, kitchen, dining room and kitchen patio.',
    imageSrc: '/images/projects/unifi-racks/unifi-network-rack-wall-cabinet-san-antonio.jpg',
    imageAlt: 'Wall-mounted network cabinet in a finished home with a patch panel, a UniFi switch and gateway, and music shelves labeled by room',
    href: '/whole-house-audio-san-antonio/',
    linkLabel: 'Whole house audio',
    ...SAN_ANTONIO,
    covers: ['audio', 'wifi'],
  },
  {
    title: 'Pool Projector and Rock Speakers',
    location: 'San Antonio, TX',
    service: 'Outdoor Audio',
    description:
      'A ceiling-mounted pool projector under a limestone arch, and rock speakers placed across the yard.',
    imageSrc: '/images/projects/outdoor-av/rock-speaker-behind-pool-san-antonio.jpg',
    imageAlt: 'Rock speaker behind a pool, part of an outdoor audio install by KZ Audio & Video in San Antonio',
    href: '/projects/hill-country-outdoor-av-pool/',
    linkLabel: 'View full project',
    ...SAN_ANTONIO,
    covers: ['audio'],
  },
];

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const x = (b.lng - a.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  const y = b.lat - a.lat;
  return Math.sqrt(x * x + y * y) * 111.32;
}

/**
 * The real jobs nearest a town, picked so the set shows cameras, Wi-Fi and audio where it can,
 * then filled with the next nearest. Same input always gives the same jobs.
 */
export function jobsNear(lat: number, lng: number, n = 3): AreaJob[] {
  const here = { lat, lng };
  const sorted = AREA_JOBS.map((j, i) => ({ j, i, d: km(here, j) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map(({ j }) => j);
  const picked: AreaJob[] = [];
  const covered = new Set<Covers>();
  for (const j of sorted) {
    if (picked.length >= n) break;
    if (j.covers.some((c) => !covered.has(c))) {
      picked.push(j);
      j.covers.forEach((c) => covered.add(c));
    }
  }
  for (const j of sorted) {
    if (picked.length >= n) break;
    if (!picked.includes(j)) picked.push(j);
  }
  return picked;
}

/** The sold Boerne camera job, from the camera price data so the number lives in one place. */
const boerneJob = CAMERA_JOBS.find((j) => j.t.includes('Boerne'));
export const BOERNE_CAMERA_LINE = boerneJob
  ? `In Boerne, KZ Audio & Video sold nine cameras with a sixteen-channel recorder for ${boerneJob.p} (quoted October 2026).`
  : '';

/** Real theater projects for town theater pages that had none. */
export const THEATER_PROJECTS = [
  {
    title: 'Dedicated Home Theater: Canyon Lake TX',
    location: 'Canyon Lake, TX',
    service: 'Home Theater',
    description: 'Full theater room with custom leather power recliner seating, blue LED accent lighting, projection system, and in-wall surround sound.',
    imageSrc: '/images/projects/monty-theater/Canyon-Lake-Tesac-Home-Theater-Custom-Seating.jpeg.jpg',
    imageAlt: 'Dedicated home theater with custom leather recliner seating installed by KZ Audio & Video in Canyon Lake TX',
    href: '/projects/canyon-lake-dedicated-home-theater/',
  },
  {
    title: 'Epson and Martin Logan Theater: Stone Oak',
    location: 'San Antonio, TX',
    service: 'Home Theater',
    description: 'Dedicated theater with an Epson laser projector, Martin Logan speakers, and LED lighting.',
    imageSrc: '/images/projects/asanka-theater/home-theater-led-lights-san-antonio.jpg',
    imageAlt: 'Home theater in Stone Oak San Antonio with LED accent lighting and a projection screen',
    href: '/projects/stone-oak-home-theater-epson-martin-logan/',
  },
  {
    title: 'Star Wars Home Theater: San Antonio',
    location: 'San Antonio, TX',
    service: 'Home Theater',
    description: 'Star Wars themed theater with a JVC projector, a fixed-frame screen, and Dolby Atmos surround.',
    imageSrc: '/images/projects/davids-theater/home-theater-from-rear.jpeg.jpg',
    imageAlt: 'Star Wars themed home theater in San Antonio TX installed by KZ Audio & Video',
    href: '/projects/star-wars-home-theater-san-antonio/',
  },
];
