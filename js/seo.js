/* BrainCore — on-page SEO (meta, Open Graph, JSON-LD, GA4) */
'use strict';

(function () {
  const C = window.SEO_CONFIG || {};
  const siteName = C.siteName || 'BrainCore Solutions';
  const tagline = C.tagline || 'Full Stack Dev Agency';
  const defaultDesc = C.defaultDescription
    || 'BrainCore Solutions — A small, sharp full-stack development team building modern web applications, CRMs, and digital products.';
  const locale = C.locale || 'en_US';
  const ga4Id = C.ga4MeasurementId
    || (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.measurementId)
    || '';

  const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
  const pageKey = path.endsWith('projects.html') ? 'projects'
    : path.endsWith('thanks.html') ? 'thanks'
      : path.endsWith('form-detect.html') ? 'none'
        : 'home';

  if (pageKey === 'none') return;

  const pages = {
    home: {
      title: `${siteName} — ${tagline}`,
      description: defaultDesc,
      path: '/',
      type: 'website',
      robots: 'index, follow',
    },
    projects: {
      title: `All Projects — ${siteName}`,
      description: 'Explore our portfolio of web applications, CRMs, e-commerce platforms, and custom software built by BrainCore Solutions.',
      path: '/projects.html',
      type: 'website',
      robots: 'index, follow',
    },
    thanks: {
      title: `Thank you — ${siteName}`,
      description: 'Thank you for contacting BrainCore Solutions.',
      path: '/thanks.html',
      type: 'website',
      robots: 'noindex, nofollow',
    },
  };

  const page = pages[pageKey];
  const siteUrl = (C.siteUrl || window.location.origin).replace(/\/$/, '');
  const canonical = `${siteUrl}${page.path === '/' ? '/' : page.path}`;
  const ogImage = absoluteUrl(C.ogImage || '/assets/chatbot-robot-static.png', siteUrl);

  function absoluteUrl(url, base) {
    if (!url) return base;
    if (/^https?:\/\//i.test(url)) return url;
    return `${base}${url.startsWith('/') ? url : `/${url}`}`;
  }

  function upsertMeta(attr, key, content) {
    if (!content) return;
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function upsertLink(rel, href, extra) {
    if (!href) return;
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
    if (extra) Object.keys(extra).forEach((k) => { el.setAttribute(k, extra[k]); });
  }

  function injectJsonLd(data) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  document.title = page.title;
  upsertMeta('name', 'description', page.description);
  upsertMeta('name', 'robots', page.robots);
  upsertMeta('name', 'author', siteName);
  upsertMeta('name', 'theme-color', '#0a0a0f');

  upsertLink('canonical', canonical);
  upsertLink('icon', absoluteUrl('/assets/chatbot-robot-static.png', siteUrl), { type: 'image/png' });

  upsertMeta('property', 'og:site_name', siteName);
  upsertMeta('property', 'og:title', page.title);
  upsertMeta('property', 'og:description', page.description);
  upsertMeta('property', 'og:type', page.type);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:image', ogImage);
  upsertMeta('property', 'og:locale', locale);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', page.title);
  upsertMeta('name', 'twitter:description', page.description);
  upsertMeta('name', 'twitter:image', ogImage);
  if (C.twitterHandle) {
    upsertMeta('name', 'twitter:site', C.twitterHandle);
    upsertMeta('name', 'twitter:creator', C.twitterHandle);
  }

  if (C.googleSiteVerification) {
    upsertMeta('name', 'google-site-verification', C.googleSiteVerification);
  }

  if (pageKey === 'home') {
    injectJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: siteName,
          url: siteUrl,
          logo: ogImage,
          email: C.contactEmail || undefined,
          sameAs: [C.linkedInUrl].filter(Boolean),
          description: defaultDesc,
        },
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          url: siteUrl,
          name: siteName,
          description: defaultDesc,
          publisher: { '@id': `${siteUrl}/#organization` },
        },
        {
          '@type': 'ProfessionalService',
          '@id': `${siteUrl}/#business`,
          name: siteName,
          url: siteUrl,
          image: ogImage,
          description: defaultDesc,
          email: C.contactEmail || undefined,
          areaServed: 'Worldwide',
          serviceType: [
            'Web Application Development',
            'CRM Development',
            'E-Commerce Development',
            'API Development',
            'Full Stack Development',
          ],
        },
      ],
    });
  }

  if (pageKey === 'projects') {
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Projects — ${siteName}`,
      description: page.description,
      url: canonical,
      isPartOf: { '@id': `${siteUrl}/#website` },
    });
  }

  if (ga4Id && page.robots.indexOf('noindex') === -1) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', ga4Id, { anonymize_ip: true });

    const g = document.createElement('script');
    g.async = true;
    g.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
    document.head.appendChild(g);
  }
})();
