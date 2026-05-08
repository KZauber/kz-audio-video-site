import type { APIRoute } from "astro";

const base = "https://kzaudioandvideo.com";
const today = new Date().toISOString().split("T")[0];

const pages = [
  { url: "/", priority: "1.0" },
  { url: "/home-theater-installation-san-antonio-tx/", priority: "0.9" },
  { url: "/whole-house-audio-san-antonio/", priority: "0.8" },
  { url: "/outdoor-audio-video-san-antonio/", priority: "0.8" },
  { url: "/surround-sound-installation-san-antonio/", priority: "0.7" },
  { url: "/security-camera-installation-san-antonio/", priority: "0.7" },
  { url: "/av-repair-san-antonio-tx/", priority: "0.7" },
  { url: "/av-partner-for-home-builders-san-antonio/", priority: "0.8" },
  { url: "/home-theater-projects-san-antonio/", priority: "0.7" },
  { url: "/about-kz-audio-video/", priority: "0.6" },
  { url: "/faq-home-theater-av-installation-san-antonio/", priority: "0.7" },
  { url: "/contact-kz-audio-video-san-antonio-tx/", priority: "0.8" },
  { url: "/home-theater-boerne-tx/", priority: "0.7" },
  { url: "/home-theater-bulverde-tx/", priority: "0.7" },
  { url: "/home-theater-canyon-lake-tx/", priority: "0.7" },
  { url: "/home-theater-helotes-tx/", priority: "0.7" },
  { url: "/home-theater-stone-oak-san-antonio/", priority: "0.7" },
  { url: "/home-theater-timberwood-park-tx/", priority: "0.7" },
  { url: "/home-theater-new-braunfels-tx/", priority: "0.7" },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    ({ url, priority }) => `  <url>
    <loc>${base}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

export const GET: APIRoute = () =>
  new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
