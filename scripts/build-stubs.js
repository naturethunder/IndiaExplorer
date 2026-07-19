#!/usr/bin/env node
/**
 * build-stubs.js — (re)generate the per-destination redirect stubs.
 * Every slug in data/destinations/index.json gets a tiny <slug>.html that
 * redirects to the canonical URL: destination.html?slug=<slug>.
 * Old bookmarks/links to goa.html etc. keep working.
 *
 * Usage: node scripts/build-stubs.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'destinations', 'index.json'), 'utf8'));

function xmlEscape(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function stubHTML(d) {
  const url = 'destination.html?slug=' + encodeURIComponent(d.slug);
  const title = xmlEscape(d.title + ' Travel Guide — Places, Hotels, How to Reach | IndiaExplore');
  const desc = xmlEscape((d.short || '').replace(/\s+$/, '') + ' Plan your ' + d.title + ' trip: top attractions, stays and how to reach.');
  const imgUrl = xmlEscape((d.heroImage && d.heroImage.src) || (d.image && d.image.src) || '');
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8" />\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
    '  <meta http-equiv="refresh" content="0;url=' + url + '" />\n' +
    '  <link rel="canonical" href="' + url + '" />\n' +
    '  <title>' + title + '</title>\n' +
    '  <meta name="description" content="' + desc + '" />\n' +
    '  <meta property="og:title" content="' + title + '" />\n' +
    '  <meta property="og:description" content="' + desc + '" />\n' +
    '  <meta property="og:type" content="article" />\n' +
    '  <meta property="og:url" content="' + url + '" />\n' +
    (imgUrl ? '  <meta property="og:image" content="' + imgUrl + '" />\n' : '') +
    '  <meta name="twitter:card" content="summary_large_image" />\n' +
    '  <meta name="twitter:title" content="' + title + '" />\n' +
    '  <meta name="twitter:description" content="' + desc + '" />\n' +
    (imgUrl ? '  <meta name="twitter:image" content="' + imgUrl + '" />\n' : '') +
    '</head>\n' +
    '<body>\n' +
    '  <script>window.location.replace(\'' + url + '\');</script>\n' +
    '</body>\n' +
    '</html>\n';
}

let n = 0;
idx.destinations.forEach(function (d) {
  fs.writeFileSync(path.join(ROOT, d.slug + '.html'), stubHTML(d));
  n++;
});
console.log('Wrote ' + n + ' redirect stubs → destination.html?slug=<slug>');
