import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kzaudioandvideo.com',
  integrations: [
    react(),
    tailwind(),
    sitemap({
      // Exclude noindex/paid-only pages from the sitemap so they don't compete in organic.
      filter: (page) =>
        !page.includes('/thank-you') &&
        !page.includes('/premium-home-theater-san-antonio'),
    }),
  ],
  image: {
    domains: [],
  },
});
