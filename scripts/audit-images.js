/**
 * Image quality audit across all destination JSON files.
 * Checks: cross-dest duplicates, intra-dest duplicates, fake/placeholder URLs,
 * missing hero/gallery images, hotel image presence.
 */

const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '..', 'data', 'destinations');

const SKIP = new Set(['index.json', 'search-index.json']);

// Suspicious/fake URL patterns (excluding picsum per instructions)
const FAKE_PATTERNS = [
  /lorempixel\.com/i,
  /placeholder\.com/i,
  /via\.placeholder/i,
  /dummyimage\.com/i,
  /placehold\.it/i,
  /imageplaceholder/i,
  /placeholder/i,
  /dummy/i,
  /source\.unsplash\.com(?!\/photos\/[a-zA-Z0-9_-]{10,})/i,  // random unsplash (not specific)
];

// ---- accumulators ----
// Check 1: cross-dest duplicates
const urlToSlugs = new Map(); // url -> Set of slugs

// Check 2: intra-dest duplicates
let intraDupCount = 0;
const intraDupExamples = [];

// Check 3: fake/placeholder
const fakeMatches = []; // {slug, url, pattern}

// Check 4: missing/empty
let missingHero = 0;
let galleryLt5 = 0;
let emptyPlaceImage = 0;

// Check 5: hotels
let hotelsWithImage = 0;
let hotelsWithoutImage = 0;
let destWithHotels = 0;

const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && !SKIP.has(f));

console.log(`Scanning ${files.length} destination files...\n`);

for (const file of files) {
  const slug = file.replace('.json', '');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
  } catch (e) {
    console.error(`PARSE ERROR: ${file} — ${e.message}`);
    continue;
  }

  // Collect all URLs in this destination
  const urlsInFile = []; // all urls (with duplication for intra check)

  const add = (url) => {
    if (!url || typeof url !== 'string') return;
    url = url.trim();
    if (!url) return;
    urlsInFile.push(url);

    // cross-dest map
    if (!urlToSlugs.has(url)) urlToSlugs.set(url, new Set());
    urlToSlugs.get(url).add(slug);

    // fake pattern check
    for (const pat of FAKE_PATTERNS) {
      if (pat.test(url)) {
        fakeMatches.push({ slug, url, pattern: pat.toString() });
        break;
      }
    }
  };

  // heroImage
  const heroSrc = data.heroImage?.src;
  add(heroSrc);

  // gallery
  const gallery = data.gallery || [];
  for (const g of gallery) add(g?.src);

  // topPlaces
  const places = data.topPlaces || [];
  for (const p of places) {
    add(p?.image?.src);
    if (!p?.image?.src) emptyPlaceImage++;
    const photos = p?.photos || [];
    for (const ph of photos) add(ph?.src);
  }

  // ---- Check 2: intra-dest duplicates ----
  const seen = new Set();
  const dupsHere = new Set();
  for (const url of urlsInFile) {
    if (seen.has(url)) dupsHere.add(url);
    seen.add(url);
  }
  if (dupsHere.size > 0) {
    intraDupCount++;
    if (intraDupExamples.length < 5) {
      intraDupExamples.push({ slug, urls: [...dupsHere].slice(0, 3) });
    }
  }

  // ---- Check 4: missing/empty ----
  if (!heroSrc) missingHero++;
  if (gallery.length < 5) galleryLt5++;

  // ---- Check 5: hotels ----
  const hotels = data.hotels || [];
  if (hotels.length > 0) destWithHotels++;
  for (const h of hotels) {
    if (h?.image?.src) hotelsWithImage++;
    else hotelsWithoutImage++;
  }
}

// ---- Check 1: cross-dest duplicates ----
const crossDups = [];
for (const [url, slugSet] of urlToSlugs) {
  if (slugSet.size > 1) {
    crossDups.push({ url, slugs: [...slugSet] });
  }
}

// ---- Report ----
console.log('='.repeat(70));
console.log('CHECK 1 — Cross-destination duplicate image URLs');
console.log('='.repeat(70));
console.log(`Total unique URLs across all files: ${urlToSlugs.size}`);
console.log(`URLs appearing in MORE than 1 destination: ${crossDups.length}`);
if (crossDups.length > 0) {
  // Sort by most-shared first
  crossDups.sort((a, b) => b.slugs.length - a.slugs.length);
  const show = crossDups.slice(0, 20);
  console.log(`\nTop ${show.length} duplicated URLs:`);
  for (const d of show) {
    console.log(`  [${d.slugs.length} destinations] ${d.url.slice(0, 100)}`);
    console.log(`    Destinations: ${d.slugs.slice(0, 5).join(', ')}${d.slugs.length > 5 ? ` ... +${d.slugs.length - 5} more` : ''}`);
  }
  if (crossDups.length > 20) console.log(`  ... and ${crossDups.length - 20} more duplicated URLs`);
} else {
  console.log('  PASS: No cross-destination duplicate URLs found.');
}

console.log('\n' + '='.repeat(70));
console.log('CHECK 2 — Intra-destination duplicate image URLs');
console.log('='.repeat(70));
console.log(`Destinations with at least one intra-file duplicate URL: ${intraDupCount}`);
if (intraDupExamples.length > 0) {
  console.log('Sample examples:');
  for (const ex of intraDupExamples) {
    console.log(`  ${ex.slug}:`);
    for (const u of ex.urls) console.log(`    ${u.slice(0, 100)}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('CHECK 3 — Suspicious / fake / placeholder image URLs');
console.log('='.repeat(70));
// Deduplicate by url
const fakeSeen = new Set();
const fakeUniq = fakeMatches.filter(m => {
  if (fakeSeen.has(m.url)) return false;
  fakeSeen.add(m.url);
  return true;
});
console.log(`Total fake/placeholder URL instances: ${fakeMatches.length}`);
console.log(`Unique fake URLs: ${fakeUniq.length}`);
if (fakeMatches.length > 0) {
  // Group by slug
  const bySlug = {};
  for (const m of fakeMatches) {
    if (!bySlug[m.slug]) bySlug[m.slug] = [];
    bySlug[m.slug].push(m.url);
  }
  const slugs = Object.keys(bySlug);
  console.log(`Destinations affected: ${slugs.length}`);
  console.log('Sample (up to 10):');
  for (const s of slugs.slice(0, 10)) {
    console.log(`  ${s}: ${bySlug[s].slice(0, 2).join(' | ')}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('CHECK 4 — Missing / empty image URLs');
console.log('='.repeat(70));
console.log(`Destinations with missing/empty heroImage.src: ${missingHero}`);
console.log(`Destinations with gallery < 5 entries: ${galleryLt5}`);
console.log(`topPlaces entries with empty image.src: ${emptyPlaceImage}`);

console.log('\n' + '='.repeat(70));
console.log('CHECK 5 — Hotel image fields');
console.log('='.repeat(70));
console.log(`Destinations with at least 1 hotel: ${destWithHotels}`);
console.log(`Hotel entries WITH image.src: ${hotelsWithImage}`);
console.log(`Hotel entries WITHOUT image.src (stripped): ${hotelsWithoutImage}`);
console.log(`Hotel image coverage: ${hotelsWithImage + hotelsWithoutImage > 0 ? ((hotelsWithImage / (hotelsWithImage + hotelsWithoutImage)) * 100).toFixed(1) : 'N/A'}%`);

console.log('\nDone.');
