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
      filter: (page) => !page.includes('/thank-you'),
    }),
  ],
  image: {
    domains: [],
  },
});
