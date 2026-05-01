import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://kzaudioandvideo.com',
  integrations: [
    tailwind(),
  ],
  image: {
    // Astro handles WebP/AVIF conversion via sharp at build time
    domains: [],
  },
});
