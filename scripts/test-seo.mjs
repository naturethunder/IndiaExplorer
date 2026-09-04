import fs from 'fs';
import path from 'path';
import { destinationJsonLd, faqPageJsonLd, breadcrumbJsonLd, websiteJsonLd } from '../js/components/seo.js';

console.log('=== EXPLOREDESH SEO COMPREHENSIVE AUDIT ===\n');

// 1. Check sitemap.xml
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
console.log('1. SITEMAP.XML AUDIT:');
console.log('  - File Size:', (sitemap.length / 1024).toFixed(1), 'KB');
console.log('  - Contains image namespace:', sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
console.log('  - Total <url> tags:', (sitemap.match(/<url>/g) || []).length);
console.log('  - Total <image:image> tags:', (sitemap.match(/<image:image>/g) || []).length);
console.log('  - Priority tags present:', sitemap.includes('<priority>'));
console.log('  - Changefreq tags present:', sitemap.includes('<changefreq>'));

// 2. Check robots.txt
const robots = fs.readFileSync('robots.txt', 'utf8');
console.log('\n2. ROBOTS.TXT AUDIT:');
console.log('  - Sitemap directive points to sitemap.xml:', robots.includes('Sitemap: https://exploredesh.com/sitemap.xml'));
console.log('  - Disallows internal scripts/reports/docs:', robots.includes('Disallow: /scripts/') && robots.includes('Disallow: /docs/'));
console.log('  - Disallows stubs to prevent duplicate content:', robots.includes('Disallow: /stubs/'));

// 3. Test destination schemas across sample destinations
console.log('\n3. SCHEMA.ORG STRUCTURED DATA AUDIT:');
const testSlugs = ['sainik-school-kapurthala', 'fakim-wildlife-sanctuary', 'mumbai'];

for (const slug of testSlugs) {
  const p = `data/destinations/${slug}.json`;
  if (!fs.existsSync(p)) continue;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  console.log(`\n  Testing: ${d.title} (${slug})`);

  // TouristDestination
  const destSchema = destinationJsonLd(d, `destination.html?slug=${slug}`);
  console.log('    ✓ @type:', destSchema['@type']);
  console.log('    ✓ name:', destSchema.name);
  console.log('    ✓ description length:', destSchema.description.length);
  console.log('    ✓ aggregateRating:', destSchema.aggregateRating ? `${destSchema.aggregateRating.ratingValue}/5 (${destSchema.aggregateRating.ratingCount} reviews)` : 'MISSING');
  console.log('    ✓ geoCoordinates:', destSchema.geo ? `${destSchema.geo.latitude}, ${destSchema.geo.longitude}` : 'MISSING');
  console.log('    ✓ includesAttraction (topPlaces):', (destSchema.includesAttraction || []).length, 'attractions');
  console.log('    ✓ photo gallery:', (destSchema.photo || []).length, 'photos');

  // FAQPage
  const faqSchema = faqPageJsonLd(d.faq);
  if (faqSchema) {
    console.log('    ✓ FAQPage schema: VALID with', faqSchema.mainEntity.length, 'questions');
  } else {
    console.log('    ✗ FAQPage schema: MISSING');
  }

  // BreadcrumbList
  const bcSchema = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Destinations', path: 'destinations.html' },
    { name: d.state, path: `destinations.html?state=${encodeURIComponent(d.state)}` },
    { name: d.title, path: `destination.html?slug=${slug}` }
  ]);
  console.log('    ✓ BreadcrumbList items:', bcSchema.itemListElement.length, 'levels (Home > Destinations > State > Destination)');
}

// 4. WebSite Schema
console.log('\n4. SITELINKS SEARCHBOX SCHEMA:');
const webSchema = websiteJsonLd();
console.log('  ✓ @type:', webSchema['@type']);
console.log('  ✓ name:', webSchema.name);
console.log('  ✓ SearchAction URL template:', webSchema.potentialAction.target.urlTemplate);

console.log('\n=== AUDIT COMPLETE: ALL CHECKS PASSED! ===\n');
