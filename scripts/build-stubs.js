#!/usr/bin/env node
/**
 * build-stubs.js — generate rich, crawlable pre-rendered stubs for all destinations.
 * Every slug in data/destinations/index.json gets a static <slug>.html with:
 *   - Canonical self-referencing link to /destination?slug=<slug>
 *   - Complete Schema.org TouristDestination JSON-LD with geo coordinates & state
 *   - Semantic HTML5 markup (breadcrumb nav, H1, meta, hero photo, overview & attractions)
 *   - Client-side seamless redirect for interactive browser visitors
 *
 * Usage: node scripts/build-stubs.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = (process.env.SITE_ORIGIN || 'https://exploredesh.com').replace(/\/$/, '');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const idx = JSON.parse(fs.readFileSync(path.join(DEST_DIR, 'index.json'), 'utf8'));

function xmlEscape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stubHTML(summary) {
  const slug = summary.slug;
  const fp = path.join(DEST_DIR, slug + '.json');
  let d = summary;
  if (fs.existsSync(fp)) {
    try {
      d = JSON.parse(fs.readFileSync(fp, 'utf8'));
    } catch (_) {
      d = summary;
    }
  }

  const relUrl = '/destination?slug=' + encodeURIComponent(slug);
  const canonicalUrl = ORIGIN + relUrl;
  const title = xmlEscape((d.seo && d.seo.title) || (d.title + ' Travel Guide 2026 — Places, Hotels, How to Reach | ExploreDesh'));
  const desc = xmlEscape((d.seo && d.seo.description) || (d.overview && (d.overview.description || d.overview.short)) || ((d.short || '') + ' Plan your ' + d.title + ' trip: top attractions, stays and how to reach.'));
  const rawImg = (d.heroImage && d.heroImage.src) || (d.gallery && d.gallery[0] && d.gallery[0].src) || (summary.image && summary.image.src) || '';
  const imgUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : ORIGIN + '/' + rawImg.replace(/^\/+/, '')) : '';
  const places = (d.topPlaces || []).slice(0, 6);
  const overviewText = (d.overview && d.overview.description) || (d.overview && d.overview.short) || d.short || summary.short || '';
  const bestTime = d.bestTime ? (d.bestTime.label || d.bestTime.season || '') : '';

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": d.title,
    "description": overviewText,
    "url": canonicalUrl,
    "touristType": d.type || "Tourism",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": d.state,
      "addressCountry": "IN"
    }
  };
  if (imgUrl) schema.image = imgUrl;
  if (d.coordinates && d.coordinates.lat != null) {
    schema.geo = {
      "@type": "GeoCoordinates",
      "latitude": d.coordinates.lat,
      "longitude": d.coordinates.lng
    };
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta http-equiv="refresh" content="0;url=${relUrl}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonicalUrl}" />
  ${imgUrl ? `<meta property="og:image" content="${xmlEscape(imgUrl)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  ${imgUrl ? `<meta name="twitter:image" content="${xmlEscape(imgUrl)}" />` : ''}
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 2rem 1rem; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    h1 { font-size: 2.25rem; color: #0f172a; margin-top: 0; }
    .meta { color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem; }
    .hero-img { width: 100%; max-height: 400px; object-fit: cover; border-radius: 0.75rem; margin-bottom: 1.5rem; }
    .btn { display: inline-block; background: #15803d; color: #fff; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin-top: 1rem; }
    .btn:hover { background: #166534; }
    ul { padding-left: 1.25rem; }
    li { margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <nav style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">
      <a href="/" style="color: #15803d; text-decoration: none;">Home</a> &rsaquo;
      <a href="/destinations" style="color: #15803d; text-decoration: none;">Destinations</a> &rsaquo;
      <a href="/destinations?state=${encodeURIComponent(d.state || '')}" style="color: #15803d; text-decoration: none;">${xmlEscape(d.state || '')}</a> &rsaquo;
      <span>${xmlEscape(d.title)}</span>
    </nav>
    <h1>${xmlEscape(d.title)}</h1>
    <div class="meta">
      <span><strong>State:</strong> ${xmlEscape(d.state || '')}</span>
      ${d.type ? ` | <span><strong>Category:</strong> ${xmlEscape(d.type)}</span>` : ''}
      ${bestTime ? ` | <span><strong>Best Time:</strong> ${xmlEscape(bestTime)}</span>` : ''}
    </div>
    ${imgUrl ? `<img src="${xmlEscape(imgUrl)}" alt="${xmlEscape(d.title)}" class="hero-img" />` : ''}
    <p style="font-size: 1.1rem; color: #334155;">${xmlEscape(overviewText)}</p>
    ${places.length ? `
    <h2>Top Attractions & Places to Visit</h2>
    <ul>
      ${places.map(p => `<li><strong>${xmlEscape(p.name)}</strong>${p.description ? ` — ${xmlEscape(p.description)}` : ''}</li>`).join('\n      ')}
    </ul>` : ''}
    <div style="margin-top: 2rem; padding: 1.5rem; background: #f1f5f9; border-radius: 0.75rem;">
      <p style="margin: 0 0 1rem 0; font-weight: 600; color: #0f172a;">Looking for hotels, restaurants, live maps & detailed itineraries?</p>
      <a href="${relUrl}" class="btn">Explore Full Interactive Guide for ${xmlEscape(d.title)} &rarr;</a>
    </div>
  </div>
  <script>
    // Seamless instant redirect for interactive browser visitors
    window.location.replace('${relUrl}');
  </script>
</body>
</html>`;
}

const STUBS_DIR = path.join(ROOT, 'stubs');
if (!fs.existsSync(STUBS_DIR)) {
  fs.mkdirSync(STUBS_DIR, { recursive: true });
}

let n = 0;
let cleaned = 0;

idx.destinations.forEach(function (d) {
  const rootFile = path.join(ROOT, d.slug + '.html');
  if (fs.existsSync(rootFile)) {
    try { fs.unlinkSync(rootFile); cleaned++; } catch (e) {}
  }
  fs.writeFileSync(path.join(STUBS_DIR, d.slug + '.html'), stubHTML(d), 'utf8');
  n++;
});

console.log('Wrote ' + n + ' rich, pre-rendered stubs into stubs/ directory (cleaned ' + cleaned + ' root-level stubs) → destination?slug=<slug>');
