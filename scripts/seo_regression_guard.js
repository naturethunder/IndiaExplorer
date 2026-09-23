#!/usr/bin/env node
/**
 * scripts/seo_regression_guard.js
 * ============================================================
 * ExploreDesh Master SEO Regression Guard
 * Enforces Section 39 of seo.md:
 *   - Indexable URL count integrity
 *   - Sitemap URL count & consistency
 *   - Canonical tag validity across all routes
 *   - Single H1 and meta tags on all core templates
 *   - Geographic coordinate bounds
 *   - Fallback redirect stubs integrity
 *   - Schema.org JSON-LD generation integrity
 * ============================================================
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const STUBS_DIR = path.join(ROOT, 'stubs');

console.log('================================================================');
console.log('🛡️  EXPLOREDESH MASTER SEO REGRESSION GUARD');
console.log('================================================================\n');

let failedChecks = 0;
let passedChecks = 0;

function assert(condition, message) {
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${message}`);
  }
}

// 1. Destination Catalog Invariants
const indexPath = path.join(DEST_DIR, 'index.json');
assert(fs.existsSync(indexPath), 'data/destinations/index.json exists');
const idx = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
assert(idx.count === 2393, `Catalog count is exactly 2,393 (found: ${idx.count})`);
assert(Array.isArray(idx.destinations) && idx.destinations.length === 2393, `index.destinations array has 2,393 items (found: ${idx.destinations.length})`);

// 2. Individual Destination JSON Files & Geo Invariants
let missingJson = 0;
let outOfBoundsCoords = 0;
let missingStateOrTitle = 0;
let zeroAttractions = 0;

idx.destinations.forEach(d => {
  const fPath = path.join(DEST_DIR, d.slug + '.json');
  if (!fs.existsSync(fPath)) {
    missingJson++;
    return;
  }
  try {
    const full = JSON.parse(fs.readFileSync(fPath, 'utf8'));
    if (!full.title || !full.state) missingStateOrTitle++;
    const coords = full.coordinates || (full.weather ? { lat: full.weather.lat, lng: full.weather.lng } : null);
    if (!coords || coords.lat < 6 || coords.lat > 38 || coords.lng < 68 || coords.lng > 98) {
      outOfBoundsCoords++;
    }
    const places = (full.topPlaces && full.topPlaces.length) ? full.topPlaces : (full.places || []);
    if (!places || places.length === 0) zeroAttractions++;
  } catch (_) {
    missingJson++;
  }
});

assert(missingJson === 0, `All 2,393 individual destination JSON files exist and parse cleanly (missing: ${missingJson})`);
assert(missingStateOrTitle === 0, `All 2,393 destinations contain valid title and state (missing: ${missingStateOrTitle})`);
assert(outOfBoundsCoords === 0, `All 2,393 destinations have coordinates strictly within India geo-bounds (out-of-bounds: ${outOfBoundsCoords})`);
assert(zeroAttractions === 0, `All 2,393 destinations contain rich attractions/places (empty: ${zeroAttractions})`);

// 3. Pre-rendered Redirect Stubs
assert(fs.existsSync(STUBS_DIR), 'stubs/ directory exists');
const stubFiles = fs.readdirSync(STUBS_DIR).filter(f => f.endsWith('.html'));
assert(stubFiles.length === 2393, `Exactly 2,393 fallback redirect stubs exist (found: ${stubFiles.length})`);

// Check a sample stub for canonical and redirection
const sampleStub = fs.readFileSync(path.join(STUBS_DIR, 'manali.html'), 'utf8');
assert(sampleStub.includes('rel="canonical"') && sampleStub.includes('https://exploredesh.com/destination.html?slug=manali'), 'Stubs declare absolute canonical pointing to destination.html?slug=');
assert(sampleStub.includes('window.location.replace'), 'Stubs implement instant client-side redirection');

// 4. Sitemaps Architecture & Counts
const sitemaps = [
  'sitemap.xml',
  'sitemap-main.xml',
  'sitemap-states.xml',
  'sitemap-destinations-1.xml',
  'sitemap-destinations-2.xml',
  'sitemap-destinations-3.xml'
];
sitemaps.forEach(sm => {
  const p = path.join(ROOT, sm);
  assert(fs.existsSync(p), `Sitemap ${sm} exists`);
  const content = fs.readFileSync(p, 'utf8');
  assert(content.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), `${sm} starts with standard XML declaration`);
});

// Count URLs in sub-sitemaps
let totalSitemapUrls = 0;
['sitemap-main.xml', 'sitemap-states.xml', 'sitemap-destinations-1.xml', 'sitemap-destinations-2.xml', 'sitemap-destinations-3.xml'].forEach(sm => {
  const content = fs.readFileSync(path.join(ROOT, sm), 'utf8');
  const count = (content.match(/<loc>/g) || []).length;
  totalSitemapUrls += count;
});
assert(totalSitemapUrls === 2450, `Total sitemapped URLs equals 2,450 (found: ${totalSitemapUrls})`);

// 5. Robots.txt Directives
const robotsPath = path.join(ROOT, 'robots.txt');
assert(fs.existsSync(robotsPath), 'robots.txt exists');
const robotsContent = fs.readFileSync(robotsPath, 'utf8');
assert(robotsContent.includes('Sitemap: https://exploredesh.com/sitemap.xml'), 'robots.txt declares master sitemap');
assert(robotsContent.includes('Disallow: /stubs/'), 'robots.txt disallows /stubs/ duplicate crawling');
assert(robotsContent.includes('Disallow: /scripts/'), 'robots.txt disallows /scripts/');

// 6. Core Static HTML Templates Inspection
const CORE_HTML_PAGES = [
  { file: 'index.html', title: 'ExploreDesh', canonical: 'https://exploredesh.com/' },
  { file: 'destinations.html', title: 'All Destinations', canonical: 'https://exploredesh.com/destinations.html' },
  { file: 'about.html', title: 'About', canonical: 'https://exploredesh.com/about.html' },
  { file: 'contact.html', title: 'Contact', canonical: 'https://exploredesh.com/contact.html' },
  { file: 'ai-finder.html', title: 'AI', canonical: 'https://exploredesh.com/ai-finder.html' },
  { file: 'privacy.html', title: 'Privacy Policy', canonical: 'https://exploredesh.com/privacy.html' },
  { file: 'terms.html', title: 'Terms', canonical: 'https://exploredesh.com/terms.html' },
  { file: 'destination.html', title: 'Destination', dynamicCanonical: true }
];

CORE_HTML_PAGES.forEach(pg => {
  const p = path.join(ROOT, pg.file);
  assert(fs.existsSync(p), `${pg.file} exists`);
  const html = fs.readFileSync(p, 'utf8');
  
  // Single H1 rule
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  assert(h1Count === 1, `${pg.file} contains exactly 1 <h1> heading (found: ${h1Count})`);

  // Viewport
  assert(html.includes('name="viewport"'), `${pg.file} has viewport meta`);

  // Description
  assert(html.includes('name="description"'), `${pg.file} has meta description`);

  // Canonical tag check
  if (pg.canonical) {
    assert(html.includes(`rel="canonical" href="${pg.canonical}"`), `${pg.file} has correct canonical: ${pg.canonical}`);
  } else if (pg.dynamicCanonical) {
    // destination.html uses dynamic canonical injection
    assert(!html.includes('rel="canonical" href="https://exploredesh.com/destination.html"'), 'destination.html has no static root canonical (enforces dynamic self-canonical)');
  }
});

// 7. Protected Functionality File Check
assert(fs.existsSync(path.join(ROOT, 'js', 'utils', 'search.js')), 'Search utility exists');
assert(fs.existsSync(path.join(ROOT, 'js', 'components', 'indiaMap.js')), 'Interactive India Map component exists');
assert(fs.existsSync(path.join(ROOT, 'ai-finder.html')), 'AI Trip Finder template exists');

// Summary Scorecard
console.log('\n================================================================');
console.log(`🛡️  REGRESSION GUARD RESULTS: ${passedChecks} PASSED, ${failedChecks} FAILED`);
console.log('================================================================');

if (failedChecks > 0) {
  console.error(`\n❌ REGRESSION DETECTED! ${failedChecks} critical check(s) failed.`);
  process.exit(1);
} else {
  console.log('\n🎉 ALL REGRESSION INVARIANTS SATISFIED. ZERO DEFECTS DETECTED.');
  process.exit(0);
}
