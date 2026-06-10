/* Dynamic robots.txt — blocks admin, points to sitemap */
'use strict';

exports.handler = async () => {
  const base = (process.env.URL || '').replace(/\/$/, '');

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
    body: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /form-detect.html

Sitemap: ${base}/sitemap.xml
`,
  };
};
