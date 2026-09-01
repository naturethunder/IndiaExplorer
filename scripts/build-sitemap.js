#!/usr/bin/env node
/**
 * build-sitemap.js — generate sitemap.xml from the destination manifest.
 * Emits the static pages + the canonical detail URL for every destination
 * (destination.html?slug=<slug>). Re-run after adding destinations:
 *   node scripts/build-sitemap.js
 *
 * Set SITE_ORIGIN (env) to override the production origin.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = (process.env.SITE_ORIGIN || 'https://exploredesh.com').replace(/\/$/, '');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'destinations', 'index.json'), 'utf8'));

// Static pages with crawl priorities.
const STATIC = [
  { loc: '', priority: '1.0', changefreq: 'weekly' },
  { loc: 'destinations.html', priority: '0.9', changefreq: 'weekly' },
  { loc: 'ai-finder.html', priority: '0.8', changefreq: 'monthly' },
  { loc: 'about.html', priority: '0.4', changefreq: 'yearly' },
  { loc: 'contact.html', priority: '0.4', changefreq: 'yearly' },
];

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function urlEntry(loc, priority, changefreq) {
  return '  <url>\n' +
    '    <loc>' + xmlEscape(ORIGIN + '/' + loc) + '</loc>\n' +
    '    <changefreq>' + changefreq + '</changefreq>\n' +
    '    <priority>' + priority + '</priority>\n' +
    '  </url>';
}

const urls = [];
STATIC.forEach(function (s) { urls.push(urlEntry(s.loc, s.priority, s.changefreq)); });
idx.meta.states.forEach(function (state) {
  const destinationCount = idx.destinations.filter(function (destination) { return destination.state === state; }).length;
  if (destinationCount >= 3) {
    urls.push(urlEntry('destinations.html?state=' + encodeURIComponent(state), '0.8', 'weekly'));
  }
});
idx.meta.types.forEach(function (type) {
  urls.push(urlEntry('destinations.html?type=' + encodeURIComponent(type.id), '0.8', 'weekly'));
});
idx.meta.months.forEach(function (month) {
  urls.push(urlEntry('destinations.html?month=' + month.num, '0.7', 'monthly'));
});
idx.destinations.forEach(function (d) {
  urls.push(urlEntry('destination.html?slug=' + encodeURIComponent(d.slug), '0.7', 'monthly'));
});

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.join('\n') + '\n' +
  '</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log('Wrote sitemap.xml — ' + urls.length + ' URLs (origin: ' + ORIGIN + ')');
