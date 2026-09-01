#!/usr/bin/env node
'use strict';

/**
 * Cross-destination duplicate image audit
 * Finds images reused across different destinations/places
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return url;
  // Remove query parameters
  url = url.split('?')[0];
  // Normalize Wikimedia thumbnails
  url = url.replace(/\/thumb\//g, '/');
  url = url.replace(/\/[0-9]+px-.*\.jpg$/i, '.jpg');
  url = url.replace(/\/[0-9]+px-.*\.jpeg$/i, '.jpeg');
  url = url.replace(/\/[0-9]+px-.*\.png$/i, '.png');
  // Normalize Pexels/Unsplash/Pixabay
  if (url.includes('pexels.com') || url.includes('unsplash.com') || url.includes('pixabay.com')) {
    return url.split('?')[0];
  }
  return url;
}

function extractFilename(url) {
  try {
    const u = new URL(url);
    return u.pathname.split('/').pop() || url;
  } catch {
    return url.split('/').pop() || url;
  }
}

const imageMap = new Map(); // normalizedUrl -> {destinations: Set, places: Array, type: 'hero'|'gallery'|'place-image'|'place-photos'}

const destDir = path.join(ROOT, 'data', 'destinations');
const files = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json').sort();

console.log('Scanning', files.length, 'destination files...\n');

for (const file of files) {
  const filePath = path.join(destDir, file);
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    continue;
  }

  const slug = doc.slug || file.replace('.json', '');

  // Hero image
  if (doc.heroImage?.src) {
    const norm = normalizeUrl(doc.heroImage.src);
    if (!imageMap.has(norm)) imageMap.set(norm, { destinations: new Set(), places: [], type: 'hero' });
    imageMap.get(norm).destinations.add(slug);
    imageMap.get(norm).places.push({ dest: slug, place: 'HERO', originalUrl: doc.heroImage.src });
  }

  // Gallery images
  if (Array.isArray(doc.gallery)) {
    for (const g of doc.gallery) {
      const src = g.src || g;
      const norm = normalizeUrl(src);
      if (!imageMap.has(norm)) imageMap.set(norm, { destinations: new Set(), places: [], type: 'gallery' });
      imageMap.get(norm).destinations.add(slug);
      imageMap.get(norm).places.push({ dest: slug, place: 'GALLERY', originalUrl: src });
    }
  }

  // Top places
  if (Array.isArray(doc.topPlaces)) {
    for (const place of doc.topPlaces) {
      const placeName = place.name;

      // Place cover image
      if (place.image?.src) {
        const norm = normalizeUrl(place.image.src);
        if (!imageMap.has(norm)) imageMap.set(norm, { destinations: new Set(), places: [], type: 'place-image' });
        imageMap.get(norm).destinations.add(slug);
        imageMap.get(norm).places.push({ dest: slug, place: placeName, originalUrl: place.image.src });
      }

      // Place photos array
      if (Array.isArray(place.photos)) {
        for (const p of place.photos) {
          const norm = normalizeUrl(p);
          if (!imageMap.has(norm)) imageMap.set(norm, { destinations: new Set(), places: [], type: 'place-photos' });
          imageMap.get(norm).destinations.add(slug);
          imageMap.get(norm).places.push({ dest: slug, place: placeName, originalUrl: p });
        }
      }
    }
  }
}

// Find cross-destination duplicates
const crossDestDuplicates = [];
for (const [normUrl, info] of imageMap.entries()) {
  if (info.destinations.size > 1) {
    crossDestDuplicates.push({
      normalizedUrl: normUrl,
      destinations: Array.from(info.destinations),
      count: info.destinations.size,
      places: info.places,
      type: info.type
    });
  }
}

console.log('=== CROSS-DESTINATION DUPLICATE ANALYSIS ===\n');
console.log('Total unique images:', imageMap.size);
console.log('Images used in multiple destinations:', crossDestDuplicates.length);
console.log('');

// Group by destination count
const byCount = {};
for (const dup of crossDestDuplicates) {
  if (!byCount[dup.count]) byCount[dup.count] = [];
  byCount[dup.count].push(dup);
}

for (const count of Object.keys(byCount).sort((a,b) => b-a)) {
  console.log(`--- Images used in ${count} destinations (${byCount[count].length} unique images) ---`);
  for (const dup of byCount[count].slice(0, 10)) {
    console.log(`  ${dup.normalizedUrl}`);
    for (const p of dup.places.slice(0, 5)) {
      console.log(`    - ${p.dest} :: ${p.place}`);
    }
    if (dup.places.length > 5) console.log(`    ... and ${dup.places.length - 5} more`);
  }
  if (byCount[count].length > 10) console.log(`  ... and ${byCount[count].length - 10} more images`);
  console.log('');
}

// Taj Mahal specific check
console.log('=== TAJ MAHAL SPECIFIC CHECK ===');
const tajUrls = [];
for (const [normUrl, info] of imageMap.entries()) {
  const urlLower = normUrl.toLowerCase();
  if (urlLower.includes('taj-mahal') || urlLower.includes('tajmahal') || urlLower.includes('taj_mahal')) {
    tajUrls.push({ normUrl, destinations: Array.from(info.destinations), places: info.places });
  }
}
console.log('Taj Mahal related images found:', tajUrls.length);
for (const t of tajUrls) {
  console.log(`  ${t.normUrl}`);
  console.log(`    Destinations: ${t.destinations.join(', ')}`);
  for (const p of t.places) {
    console.log(`    - ${p.dest} :: ${p.place}`);
  }
}

// Common monuments check
console.log('\n=== COMMON MONUMENT NAMES IN URLs ===');
const monumentKeywords = [
  'qutub-minar', 'qutub_minar', 'qutb-minar',
  'red-fort', 'redfort',
  'humayun-tomb', 'humayun_tomb',
  'india-gate', 'india_gate',
  'lotus-temple', 'lotus_temple',
  'akshardham', 'akshar-dham',
  'jama-masjid', 'jama_masjid',
  'fatehpur-sikri', 'fatehpur_sikri',
  'amber-fort', 'amber_fort', 'amer-fort',
  'hawa-mahal', 'hawa_mahal',
  'city-palace', 'city_palace',
  'jantar-mantar', 'jantar_mantar',
  'gateway-of-india', 'gateway_of_india',
  'chhatrapati-shivaji', 'cst-', 'victoria-terminus',
  'elephanta-caves', 'elephanta_caves',
  'ajanta', 'ellora',
  'khajuraho',
  'konark', 'sun-temple',
  'mahabalipuram', 'mahabalipuram',
  'sanchi', 'stupa',
  'bodh-gaya', 'bodhgaya',
  'sarnath',
  'kushinagar',
  'vaishali',
  'rajgir',
  'nalanda',
  'hampi', 'vijayanagara',
  'belur', 'halebidu',
  'pattadakal',
  'badami',
  'aihole',
  'golconda', 'golconda-fort',
  'charminar',
  'mecca-masjid', 'mecca_masjid',
  'salim-chishti', 'salim_chishti',
  'basilica-bom-jesus', 'bom-jesus',
  'se-cathedral', 'se_cathedral',
  'dudhsagar',
  'palolem', 'baga-beach', 'calangute', 'anjuna', 'vagator',
  'fort-aguada', 'fort_aguada',
  'chapora-fort', 'chapora_fort',
  'shantadurga', 'mangeshi',
  'mormugao',
  'rohtang', 'solang', 'hadimba', 'manu-temple',
  'jogini', 'vashisht', 'nehru-kund',
  'naggar-castle', 'naggar_castle',
  'beas-kund', 'kheerganga',
  'kasol', 'kullu-dussehra',
  'eravikulam', 'anamudi', 'mattupetty',
  'top-station', 'pothamedu', 'lockhart-gap',
  'attukal', 'kundala', 'echo-point',
  'marayoor', 'chinnar', 'blossom', 'kolukkumalai'
];

for (const keyword of monumentKeywords) {
  const matches = [];
  for (const [normUrl, info] of imageMap.entries()) {
    if (normUrl.toLowerCase().includes(keyword)) {
      matches.push({ normUrl, destinations: Array.from(info.destinations) });
    }
  }
  if (matches.length > 0) {
    // Check if any of these are used in multiple destinations
    const multiDest = matches.filter(m => m.destinations.length > 1);
    if (multiDest.length > 0) {
      console.log(`\n${keyword.toUpperCase()} (${multiDest.length} cross-dest images):`);
      for (const m of multiDest.slice(0, 3)) {
        console.log(`  ${m.normUrl}`);
        console.log(`    Destinations: ${m.destinations.join(', ')}`);
      }
      if (multiDest.length > 3) console.log(`    ... and ${multiDest.length - 3} more`);
    }
  }
}

console.log('\n=== SUMMARY ===');
console.log('Total unique normalized images:', imageMap.size);
console.log('Cross-destination duplicates:', crossDestDuplicates.length);
console.log('Destinations affected:', new Set(crossDestDuplicates.flatMap(d => d.destinations)).size);

// Save full report
fs.writeFileSync(
  path.join(ROOT, 'cross-destination-duplicates.json'),
  JSON.stringify(crossDestDuplicates, null, 2)
);
console.log('\nFull report saved to cross-destination-duplicates.json');