#!/usr/bin/env node
/**
 * scripts/audit/master_seo_audit.js
 * ============================================================
 * Comprehensive Google Crawlability, Indexability, Structured Data,
 * Internal Linking & Orphan Audit for ExploreDesh (https://exploredesh.com).
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const STUBS_DIR = path.join(ROOT, 'stubs');

const auditResults = {
  timestamp: new Date().toISOString(),
  architecture: {},
  robotsTxt: { passed: [], errors: [], warnings: [] },
  headers: { passed: [], errors: [], warnings: [] },
  sitemaps: { totalUrls: 0, totalImages: 0, sitemaps: [], invalidUrls: [], duplicateUrls: [] },
  canonicals: { passed: [], errors: [], warnings: [] },
  noindex: { directives: [] },
  templates: {},
  destinations: {
    totalChecked: 0,
    thinPages: [],
    duplicateSlugs: [],
    duplicateTitles: [],
    missingFields: [],
    invalidCoords: [],
    missingHero: [],
    lowAttractions: [],
    invalidPlaceImages: [],
    invalidAltTexts: []
  },
  internalLinking: {
    stateLandingReachable: 0,
    totalDestinationsReachableViaCards: 0,
    orphanDestinations: [],
    destinationsWithSimilarRail: 0
  },
  structuredData: { passed: [], warnings: [], errors: [] },
  soft404: { verified: [] }
};

console.log('Starting Comprehensive ExploreDesh Technical SEO & Crawlability Audit...\n');

// 1. Robots.txt Inspection
console.log('1. Auditing robots.txt...');
try {
  const robotsPath = path.join(ROOT, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, 'utf8');
    if (robots.includes('User-agent: *')) auditResults.robotsTxt.passed.push('Wildcard user-agent defined');
    if (robots.includes('Allow: /')) auditResults.robotsTxt.passed.push('Public root crawling allowed');
    if (robots.includes('Sitemap: https://exploredesh.com/sitemap.xml')) auditResults.robotsTxt.passed.push('Master sitemap accurately declared');
    else auditResults.robotsTxt.errors.push('Missing or incorrect Sitemap declaration');

    if (robots.includes('Disallow: /stubs/')) auditResults.robotsTxt.passed.push('Disallows /stubs/ to avoid redirect loop / duplicate indexing');
    if (robots.includes('Disallow: /scripts/')) auditResults.robotsTxt.passed.push('Disallows /scripts/ internal tools');
    if (robots.includes('Disallow: /reports/')) auditResults.robotsTxt.passed.push('Disallows /reports/ audit logs');
    if (robots.includes('Disallow: /docs/')) auditResults.robotsTxt.passed.push('Disallows /docs/');

    // Check if public routes are accidentally blocked
    if (/Disallow:\s*\/(?:destination|destinations|about|contact|ai-finder)\b/i.test(robots)) {
      auditResults.robotsTxt.errors.push('CRITICAL: Public user routes are blocked in robots.txt!');
    } else {
      auditResults.robotsTxt.passed.push('Verified: Destination and public routes are NOT blocked');
    }
  } else {
    auditResults.robotsTxt.errors.push('robots.txt does not exist');
  }
} catch (e) {
  auditResults.robotsTxt.errors.push('Error reading robots.txt: ' + e.message);
}

// 2. Cloudflare / Server Headers Inspection
console.log('2. Auditing _headers and caching directives...');
try {
  const headersPath = path.join(ROOT, '_headers');
  if (fs.existsSync(headersPath)) {
    const headers = fs.readFileSync(headersPath, 'utf8');
    if (headers.includes('X-Content-Type-Options: nosniff')) auditResults.headers.passed.push('nosniff header present');
    if (headers.includes('Referrer-Policy: strict-origin-when-cross-origin')) auditResults.headers.passed.push('strict-origin-when-cross-origin present');
    
    // Check X-Robots-Tag on private folders
    if (headers.includes('/scripts/*') && headers.includes('X-Robots-Tag: noindex, nofollow')) {
      auditResults.headers.passed.push('/scripts/* protected with noindex, nofollow header');
    }
    if (headers.includes('/stubs/*') && headers.includes('X-Robots-Tag: noindex, follow')) {
      auditResults.headers.passed.push('/stubs/* protected with noindex, follow header');
    }
  }
} catch (e) {
  auditResults.headers.errors.push('Error reading _headers: ' + e.message);
}

// 3. Sitemaps Deep Audit
console.log('3. Auditing all 6 XML Sitemaps...');
const sitemapFiles = [
  'sitemap.xml',
  'sitemap-main.xml',
  'sitemap-states.xml',
  'sitemap-destinations-1.xml',
  'sitemap-destinations-2.xml',
  'sitemap-destinations-3.xml'
];

const sitemapUrlSet = new Set();
const sitemapUrlList = [];

sitemapFiles.forEach(file => {
  const smPath = path.join(ROOT, file);
  if (!fs.existsSync(smPath)) {
    auditResults.sitemaps.invalidUrls.push(`Missing sitemap file: ${file}`);
    return;
  }
  const content = fs.readFileSync(smPath, 'utf8');
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let locMatch;
  let locCount = 0;
  let imgCount = (content.match(/<image:image>/g) || []).length;

  while ((locMatch = locRegex.exec(content)) !== null) {
    locCount++;
    const url = locMatch[1].trim();
    if (file !== 'sitemap.xml') {
      sitemapUrlList.push(url);
      if (sitemapUrlSet.has(url)) {
        auditResults.sitemaps.duplicateUrls.push({ file, url });
      }
      sitemapUrlSet.add(url);
    }
  }

  auditResults.sitemaps.sitemaps.push({
    file,
    locCount,
    imgCount,
    hasXmlDeclaration: content.startsWith('<?xml version="1.0" encoding="UTF-8"?>'),
    hasNamespace: content.includes('http://www.sitemaps.org/schemas/sitemap/0.9')
  });

  if (file !== 'sitemap.xml') {
    auditResults.sitemaps.totalUrls += locCount;
    auditResults.sitemaps.totalImages += imgCount;
  }
});

// 4. HTML Templates Deep Audit
console.log('4. Auditing core HTML templates...');
const templates = [
  'index.html',
  'destinations.html',
  'destination.html',
  'about.html',
  'contact.html',
  'ai-finder.html',
  'privacy.html',
  'terms.html'
];

templates.forEach(tpl => {
  const tplPath = path.join(ROOT, tpl);
  if (!fs.existsSync(tplPath)) return;
  const html = fs.readFileSync(tplPath, 'utf8');

  // Title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const desc = descMatch ? descMatch[1].trim() : null;

  // Canonical
  const canonMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const canonical = canonMatch ? canonMatch[1].trim() : null;

  // Robots
  const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+(?:id=["'][^"']+["']\s+)?content=["']([^"']+)["']/i);
  const robots = robotsMatch ? robotsMatch[1].trim() : null;

  // H1
  const h1Matches = html.match(/<h1[\s>](.*?)<\/h1>/gis) || [];

  // JSON-LD structured data
  const jsonLdMatches = html.match(/<script\s+type=["']application\/ld\+json["']>(.*?)<\/script>/gis) || [];

  auditResults.templates[tpl] = {
    title,
    titleLength: title ? title.length : 0,
    desc,
    descLength: desc ? desc.length : 0,
    canonical,
    robots,
    h1Count: h1Matches.length,
    jsonLdCount: jsonLdMatches.length
  };
});

// 5. Destination Data & Content Quality Audit (all 2,393 files)
console.log('5. Auditing all destination JSON files (content depth, image validity, coordinates, places)...');
const indexPath = path.join(DEST_DIR, 'index.json');
const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const destinationSlugsInIndex = new Set();
const destinationTitlesInIndex = new Map();

indexData.destinations.forEach(d => {
  destinationSlugsInIndex.add(d.slug);
  if (destinationTitlesInIndex.has(d.title)) {
    destinationTitlesInIndex.get(d.title).push(d.slug);
  } else {
    destinationTitlesInIndex.set(d.title, [d.slug]);
  }
});

// Check title duplicates
for (const [title, slugs] of destinationTitlesInIndex.entries()) {
  if (slugs.length > 1) {
    auditResults.destinations.duplicateTitles.push({ title, slugs });
  }
}

// Inspect every individual destination JSON
indexData.destinations.forEach(d => {
  auditResults.destinations.totalChecked++;
  const dPath = path.join(DEST_DIR, d.slug + '.json');
  if (!fs.existsSync(dPath)) {
    auditResults.destinations.missingFields.push({ slug: d.slug, error: 'JSON file missing' });
    return;
  }
  let full;
  try {
    full = JSON.parse(fs.readFileSync(dPath, 'utf8'));
  } catch (err) {
    auditResults.destinations.missingFields.push({ slug: d.slug, error: 'JSON parse error: ' + err.message });
    return;
  }

  // 1. Content depth check (overview, description, short)
  const ov = full.overview || {};
  const descriptionText = ov.description || full.description || ov.about || ov.short || full.short || '';
  const wordCount = descriptionText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 15) {
    auditResults.destinations.thinPages.push({ slug: d.slug, title: full.title, words: wordCount });
  }

  // 2. Coords check
  const coords = full.coordinates || (full.weather ? { lat: full.weather.lat, lng: full.weather.lng } : null);
  if (!coords || coords.lat < 6 || coords.lat > 38 || coords.lng < 68 || coords.lng > 98) {
    auditResults.destinations.invalidCoords.push({ slug: d.slug, title: full.title, coords });
  }

  // 3. Hero image check
  const heroSrc = typeof full.heroImage === 'string'
    ? full.heroImage
    : (full.heroImage && full.heroImage.src ? full.heroImage.src : (full.image && full.image.src ? full.image.src : null));
  if (!heroSrc) {
    auditResults.destinations.missingHero.push({ slug: d.slug, title: full.title });
  }

  // 4. Attractions / Places check
  const places = (full.topPlaces && full.topPlaces.length) ? full.topPlaces : (full.places || []);
  if (!places || places.length === 0) {
    auditResults.destinations.lowAttractions.push({ slug: d.slug, title: full.title, count: 0 });
  }
});

// 6. Pre-rendered Redirect Stubs Audit
console.log('6. Auditing fallback redirect stubs (stubs/*.html)...');
let totalStubs = 0;
let validStubs = 0;
if (fs.existsSync(STUBS_DIR)) {
  const stubFiles = fs.readdirSync(STUBS_DIR).filter(f => f.endsWith('.html'));
  totalStubs = stubFiles.length;
  stubFiles.forEach(f => {
    const slug = f.replace(/\.html$/, '');
    if (destinationSlugsInIndex.has(slug)) {
      validStubs++;
    }
  });
}

// 7. Internal Link Graph & Orphan URL Analysis
console.log('7. Analyzing internal link graph & orphan URLs...');
// Compare sitemapped URLs vs index destinations
const sitemappedDestSlugs = new Set();
sitemapUrlList.forEach(url => {
  if (url.includes('destination.html?slug=')) {
    const uSlug = decodeURIComponent(url.split('destination.html?slug=')[1]);
    sitemappedDestSlugs.add(uSlug);
  }
});

const sitemapOnlySlugs = [];
const dataOnlySlugs = [];

sitemappedDestSlugs.forEach(slug => {
  if (!destinationSlugsInIndex.has(slug)) {
    sitemapOnlySlugs.push(slug);
  }
});

destinationSlugsInIndex.forEach(slug => {
  if (!sitemappedDestSlugs.has(slug)) {
    dataOnlySlugs.push(slug);
  }
});

auditResults.internalLinking.orphanDestinations = {
  sitemapOnlySlugs,
  dataOnlySlugs,
  totalInIndex: destinationSlugsInIndex.size,
  totalInSitemap: sitemappedDestSlugs.size
};

// Summary output
console.log('\n============================================================');
console.log('AUDIT SUMMARY METRICS:');
console.log(`- Total Destinations in Database: ${indexData.count}`);
console.log(`- Total Sitemapped URLs: ${auditResults.sitemaps.totalUrls}`);
console.log(`- Total Sitemapped Images: ${auditResults.sitemaps.totalImages}`);
console.log(`- Sitemaps Checked: ${auditResults.sitemaps.sitemaps.length}`);
console.log(`- Fallback Stubs: ${validStubs}/${totalStubs}`);
console.log(`- Thin Destination Pages (<15 words): ${auditResults.destinations.thinPages.length}`);
console.log(`- Out of bounds coordinates: ${auditResults.destinations.invalidCoords.length}`);
console.log(`- Duplicate Titles: ${auditResults.destinations.duplicateTitles.length}`);
console.log(`- Data-only slugs (missing from sitemap): ${dataOnlySlugs.length}`);
console.log(`- Sitemap-only slugs (missing from database): ${sitemapOnlySlugs.length}`);
console.log('============================================================\n');

// Write out JSON report for documentation generation
const auditOutPath = path.join(ROOT, 'reports', 'master_seo_audit_results.json');
fs.mkdirSync(path.dirname(auditOutPath), { recursive: true });
fs.writeFileSync(auditOutPath, JSON.stringify(auditResults, null, 2), 'utf8');
console.log(`Saved detailed audit metrics to: ${auditOutPath}`);
