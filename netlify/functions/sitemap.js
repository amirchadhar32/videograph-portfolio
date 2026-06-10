/* Dynamic sitemap — uses Netlify URL env on deploy */
'use strict';

const PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/projects.html', priority: '0.8', changefreq: 'weekly' },
];

exports.handler = async () => {
  const base = (process.env.URL || 'https://example.com').replace(/\/$/, '');
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = PAGES.map((p) => `  <url>
    <loc>${base}${p.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
    body: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`,
  };
};
