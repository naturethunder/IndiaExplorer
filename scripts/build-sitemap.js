#!/usr/bin/env node
/**
 * build-sitemap.js — generate Google-compliant sitemap.xml with Image Sitemap extensions.
 * Emits static pages + filter landings + all 2,388 destinations with <image:image> blocks
 * for hero & gallery photos to rank in Google Images, Discover, and Web Search.
 *
 * Usage: node scripts/build-sitemap.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = (process.env.SITE_ORIGIN || 'https://exploredesh.com').replace(/\/$/, '');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const idx = JSON.parse(fs.readFileSync(path.join(DEST_DIR, 'index.json'), 'utf8'));

// Static pages with crawl priorities.
const STATIC = [
  { loc: '', priority: '1.0', changefreq: 'weekly' },
  { loc: 'destinations.html', priority: '0.9', changefreq: 'weekly' },
  { loc: 'ai-finder.html', priority: '0.8', changefreq: 'monthly' },
  { loc: 'about.html', priority: '0.4', changefreq: 'yearly' },
  { loc: 'contact.html', priority: '0.4', changefreq: 'yearly' },
];

function xmlEscape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function urlEntry(loc, priority, changefreq, images = []) {
  let xml = '  <url>\n' +
    '    <loc>' + xmlEscape(ORIGIN + '/' + loc) + '</loc>\n' +
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

const urls = [];
STATIC.forEach(function (s) { urls.push(urlEntry(s.loc, s.priority, s.changefreq)); });

// State landing pages
idx.meta.states.forEach(function (state) {
  const destinationCount = idx.destinations.filter(function (destination) { return destination.state === state; }).length;
  if (destinationCount >= 3) {
    urls.push(urlEntry('destinations.html?state=' + encodeURIComponent(state), '0.8', 'weekly'));
  }
});

// Category / type landing pages
idx.meta.types.forEach(function (type) {
  urls.push(urlEntry('destinations.html?type=' + encodeURIComponent(type.id), '0.8', 'weekly'));
});

// Monthly travel guides
idx.meta.months.forEach(function (month) {
  urls.push(urlEntry('destinations.html?month=' + month.num, '0.7', 'monthly'));
});

// Destination detail pages with Google Image Sitemap markup
console.log('Compiling destination URLs with Google Image Sitemap metadata...');
let totalImages = 0;

idx.destinations.forEach(function (d) {
  const imgList = [];
  const dPath = path.join(DEST_DIR, d.slug + '.json');
  let detail = null;
  if (fs.existsSync(dPath)) {
    try { detail = JSON.parse(fs.readFileSync(dPath, 'utf8')); } catch (e) {}
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
      const gUrl = typeof g === 'string' ? g : g.src;
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
  urls.push(urlEntry('destination.html?slug=' + encodeURIComponent(d.slug), '0.8', 'monthly', imgList));
});

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
  '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  urls.join('\n') + '\n' +
  '</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`✅ Wrote sitemap.xml — ${urls.length} URLs, ${totalImages} indexed images for Google (origin: ${ORIGIN})`);
