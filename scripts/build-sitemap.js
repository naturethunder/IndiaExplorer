#!/usr/bin/env node
/**
 * build-sitemap.js — generate Google-compliant Sitemap Index & modular sub-sitemaps
 * with Google Image Sitemap extensions.
 *
 * Emits:
 *   - sitemap.xml (Master Sitemap Index linking to sub-sitemaps)
 *   - sitemap-main.xml (Static core pages: Home, Catalogue, Finder, About, Contact)
 *   - sitemap-states.xml (State landings, category/type landings, and monthly guides)
 *   - sitemap-destinations-<n>.xml (Chunked destination detail guides with <image:image> blocks)
 *
 * Usage: node scripts/build-sitemap.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = (process.env.SITE_ORIGIN || 'https://exploredesh.com').replace(/\/$/, '');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const idx = JSON.parse(fs.readFileSync(path.join(DEST_DIR, 'index.json'), 'utf8'));

const TODAY = new Date().toISOString().split('T')[0];
const DESTINATIONS_PER_CHUNK = 1000;

// Static pages with crawl priorities.
const STATIC = [
  { loc: '', priority: '1.0', changefreq: 'weekly' },
  { loc: 'destinations.html', priority: '0.9', changefreq: 'weekly' },
  { loc: 'ai-finder.html', priority: '0.8', changefreq: 'monthly' },
  { loc: 'about.html', priority: '0.4', changefreq: 'yearly' },
  { loc: 'contact.html', priority: '0.4', changefreq: 'yearly' },
];

function xmlEscape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, priority, changefreq, images = [], lastmod = TODAY) {
  let xml = '  <url>\n' +
    '    <loc>' + xmlEscape(ORIGIN + '/' + loc) + '</loc>\n' +
    '    <lastmod>' + lastmod + '</lastmod>\n' +
    '    <changefreq>' + changefreq + '</changefreq>\n' +
    '    <priority>' + priority + '</priority>\n';

  if (images && images.length) {
    images.slice(0, 5).forEach(img => {
      if (!img.url) return;
      xml += '    <image:image>\n' +
        '      <image:loc>' + xmlEscape(img.url) + '</image:loc>\n' +
        '      <image:title>' + xmlEscape(img.title || 'ExploreDesh Image') + '</image:title>\n' +
        (img.caption ? '      <image:caption>' + xmlEscape(img.caption) + '</image:caption>\n' : '') +
        '    </image:image>\n';
    });
  }

  xml += '  </url>';
  return xml;
}

function wrapUrlset(entries) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    entries.join('\n') + '\n' +
    '</urlset>\n';
}

function wrapSitemapIndex(sitemapLocs) {
  const entries = sitemapLocs.map(loc =>
    '  <sitemap>\n' +
    '    <loc>' + xmlEscape(ORIGIN + '/' + loc) + '</loc>\n' +
    '    <lastmod>' + TODAY + '</lastmod>\n' +
    '  </sitemap>'
  ).join('\n');

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries + '\n' +
    '</sitemapindex>\n';
}

console.log('Building modular Google-compliant sitemaps for ' + ORIGIN + '...');

const subSitemaps = [];

// 1. sitemap-main.xml (Static core pages)
const mainEntries = STATIC.map(s => urlEntry(s.loc, s.priority, s.changefreq));
fs.writeFileSync(path.join(ROOT, 'sitemap-main.xml'), wrapUrlset(mainEntries));
subSitemaps.push('sitemap-main.xml');
console.log(`  ✓ Wrote sitemap-main.xml (${mainEntries.length} URLs)`);

// 2. sitemap-states.xml (State, Type/Category, and Month filter landing pages)
const stateEntries = [];

// State landings
idx.meta.states.forEach(state => {
  const destinationCount = idx.destinations.filter(d => d.state === state).length;
  if (destinationCount >= 3) {
    stateEntries.push(urlEntry('destinations.html?state=' + encodeURIComponent(state), '0.8', 'weekly'));
  }
});

// Category / type landings
idx.meta.types.forEach(type => {
  stateEntries.push(urlEntry('destinations.html?type=' + encodeURIComponent(type.id), '0.8', 'weekly'));
});

// Monthly travel guides
idx.meta.months.forEach(month => {
  stateEntries.push(urlEntry('destinations.html?month=' + month.num, '0.7', 'monthly'));
});

fs.writeFileSync(path.join(ROOT, 'sitemap-states.xml'), wrapUrlset(stateEntries));
subSitemaps.push('sitemap-states.xml');
console.log(`  ✓ Wrote sitemap-states.xml (${stateEntries.length} filter landings)`);

// 3. Chunked destination detail pages (sitemap-destinations-1.xml, -2.xml, etc.)
console.log('Compiling destination URLs with Google Image Sitemap metadata...');
let totalImages = 0;
const destEntries = [];

idx.destinations.forEach(d => {
  const imgList = [];
  const dPath = path.join(DEST_DIR, d.slug + '.json');
  let detail = null;
  if (fs.existsSync(dPath)) {
    try { detail = JSON.parse(fs.readFileSync(dPath, 'utf8')); } catch (_) {}
  }

  const target = detail || d;
  const heroSrc = typeof target.heroImage === 'string'
    ? target.heroImage
    : (target.heroImage && target.heroImage.src ? target.heroImage.src : (target.image && target.image.src ? target.image.src : null));

  if (heroSrc) {
    imgList.push({
      url: heroSrc,
      title: (target.title || d.name) + ' Travel Guide',
      caption: target.tagline || (target.title + ' in ' + target.state + ', India')
    });
  }

  if (Array.isArray(target.gallery)) {
    target.gallery.forEach(g => {
      const gUrl = typeof g === 'string' ? g : (g && g.src);
      if (gUrl && !imgList.some(x => x.url === gUrl)) {
        imgList.push({
          url: gUrl,
          title: (typeof g === 'object' && g.title) ? g.title : (target.title + ' Photo'),
          caption: (typeof g === 'object' && g.alt) ? g.alt : (target.title + ' attraction')
        });
      }
    });
  }

  totalImages += imgList.length;
  destEntries.push(urlEntry('destination.html?slug=' + encodeURIComponent(d.slug), '0.8', 'monthly', imgList));
});

// Split destinations into chunks of DESTINATIONS_PER_CHUNK
const numChunks = Math.ceil(destEntries.length / DESTINATIONS_PER_CHUNK);
for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
  const start = chunkIdx * DESTINATIONS_PER_CHUNK;
  const end = start + DESTINATIONS_PER_CHUNK;
  const chunkEntries = destEntries.slice(start, end);
  const filename = `sitemap-destinations-${chunkIdx + 1}.xml`;
  fs.writeFileSync(path.join(ROOT, filename), wrapUrlset(chunkEntries));
  subSitemaps.push(filename);
  console.log(`  ✓ Wrote ${filename} (${chunkEntries.length} destinations)`);
}

// 4. Master sitemap.xml (Sitemap Index)
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), wrapSitemapIndex(subSitemaps));
console.log(`✅ Wrote master sitemap.xml (Sitemap Index pointing to ${subSitemaps.length} sub-sitemaps)`);
console.log(`   Total URLs: ${mainEntries.length + stateEntries.length + destEntries.length} across all sitemaps`);
console.log(`   Total Indexed Images: ${totalImages}`);
