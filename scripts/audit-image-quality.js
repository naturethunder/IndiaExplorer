const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '..', 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
const destinations = indexData.destinations;

console.log(`Starting scan across ${destinations.length} destinations...`);

const summary = {
  totalDestinations: destinations.length,
  totalImagesChecked: 0,
  picsumOrPlaceholder: [],
  documentScansPdfDjvu: [],
  videoWebmAudio: [],
  logosFlagsMapsDiagrams: [],
  tinyBlurryThumbnails: [],
  malformedOrNonHttpUrls: [],
  missingLocalImages: [],
};

// Patterns for non-photo or unwanted media
const PDF_DJVU_PATTERN = /\.(pdf|djvu|doc|txt)(\/page|\.jpg|\.png)?/i;
const WEBM_OGV_PATTERN = /\.(webm|ogv|mp4|avi|mov|flv)(\/|\.jpg|\.png)?/i;
const LOGO_FLAG_MAP_PATTERN = /(flag_of|coat_of_arms|logo_of|map_of|diagram|chart|census|stamp_of|location_map|seal_of|symbol_of)/i;
const BLURRY_THUMB_PATTERN = /\/([1-9][0-9]|1[0-9][0-9]|200)px-/i; // < 200px thumbs

destinations.forEach(s => {
  const file = path.join(DEST_DIR, `${s.slug}.json`);
  if (!fs.existsSync(file)) return;

  const d = JSON.parse(fs.readFileSync(file, 'utf8'));

  // Collect all image URLs with context
  const imageEntries = [];

  if (d.heroImage && d.heroImage.src) {
    imageEntries.push({ field: 'heroImage', name: d.title, src: d.heroImage.src, destSlug: s.slug });
  }
  if (d.image && d.image.src) {
    imageEntries.push({ field: 'image', name: d.title, src: d.image.src, destSlug: s.slug });
  }
  (d.gallery || []).forEach((g, idx) => {
    if (g && g.src) {
      imageEntries.push({ field: `gallery[${idx}]`, name: d.title, src: g.src, destSlug: s.slug });
    }
  });
  (d.topPlaces || []).forEach((p, pIdx) => {
    const pSrc = p.image && (p.image.src || (typeof p.image === 'string' ? p.image : null));
    if (pSrc) {
      imageEntries.push({ field: `topPlaces[${pIdx}] (${p.name})`, name: p.name, src: pSrc, destSlug: s.slug });
    }
    (p.photos || []).forEach((ph, phIdx) => {
      if (ph) {
        imageEntries.push({ field: `topPlaces[${pIdx}].photos[${phIdx}] (${p.name})`, name: p.name, src: ph, destSlug: s.slug });
      }
    });
  });
  (d.hotels || []).forEach((h, hIdx) => {
    const hSrc = h.image && (h.image.src || (typeof h.image === 'string' ? h.image : null));
    if (hSrc) {
      imageEntries.push({ field: `hotels[${hIdx}] (${h.name})`, name: h.name, src: hSrc, destSlug: s.slug });
    }
  });

  imageEntries.forEach(entry => {
    summary.totalImagesChecked++;
    const src = entry.src;

    // 1. Picsum / Placeholder
    if (src.includes('picsum.photos') || src.includes('via.placeholder') || src.includes('placeholder')) {
      summary.picsumOrPlaceholder.push({ ...entry });
    }

    // 2. Local missing files
    if (src.startsWith('images/')) {
      const localPath = path.join(__dirname, '..', src);
      if (!fs.existsSync(localPath)) {
        summary.missingLocalImages.push({ ...entry, localPath });
      }
    }

    // 3. Malformed / Non-HTTP non-local
    if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('images/')) {
      summary.malformedOrNonHttpUrls.push({ ...entry });
    }

    // 4. PDF / DJVU document scans
    if (PDF_DJVU_PATTERN.test(src) || src.includes('Agricultural_libraries') || src.includes('mirage_of_life') || src.includes('Provincial_geographies')) {
      summary.documentScansPdfDjvu.push({ ...entry });
    }

    // 5. Video thumbnails (webm, ogv)
    if (WEBM_OGV_PATTERN.test(src)) {
      summary.videoWebmAudio.push({ ...entry });
    }

    // 6. Logos, flags, diagrams, maps
    if (LOGO_FLAG_MAP_PATTERN.test(src)) {
      summary.logosFlagsMapsDiagrams.push({ ...entry });
    }

    // 7. Blurry / tiny low-res thumbnail links
    if (BLURRY_THUMB_PATTERN.test(src)) {
      summary.tinyBlurryThumbnails.push({ ...entry });
    }
  });
});

console.log('\n================ AUDIT RESULTS ================');
console.log(`Total Destinations Analyzed: ${summary.totalDestinations}`);
console.log(`Total Image References Checked: ${summary.totalImagesChecked}`);
console.log(`-----------------------------------------------`);
console.log(`1. Placeholder / Fake Stock Images (picsum/placeholder): ${summary.picsumOrPlaceholder.length}`);
console.log(`2. Document / PDF / Book / Journal Scans (unrelated): ${summary.documentScansPdfDjvu.length}`);
console.log(`3. Video Frame Thumbnails (.webm / .ogv): ${summary.videoWebmAudio.length}`);
console.log(`4. Logos / Flags / Maps / Diagrams (unrelated non-photo): ${summary.logosFlagsMapsDiagrams.length}`);
console.log(`5. Blurry / Tiny low-res thumbnails (<200px): ${summary.tinyBlurryThumbnails.length}`);
console.log(`6. Missing Local Image files: ${summary.missingLocalImages.length}`);
console.log(`7. Malformed or Invalid URLs: ${summary.malformedOrNonHttpUrls.length}`);

// Print detailed samples for each category
if (summary.documentScansPdfDjvu.length > 0) {
  console.log('\n--- SAMPLE Document / PDF / Book Scans ---');
  summary.documentScansPdfDjvu.slice(0, 15).forEach(e => {
    console.log(`[${e.destSlug}] ${e.field}: ${e.src}`);
  });
}

if (summary.videoWebmAudio.length > 0) {
  console.log('\n--- before video block ---');
  summary.videoWebmAudio.slice(0, 10).forEach(e => {
    console.log(`[${e.destSlug}] ${e.field}: ${e.src}`);
  });
}

if (summary.logosFlagsMapsDiagrams.length > 0) {
  console.log('\n--- SAMPLE Logos / Flags / Maps / Diagrams ---');
  summary.logosFlagsMapsDiagrams.slice(0, 10).forEach(e => {
    console.log(`[${e.destSlug}] ${e.field}: ${e.src}`);
  });
}

if (summary.tinyBlurryThumbnails.length > 0) {
  console.log('\n--- SAMPLE Tiny / Blurry Thumbnails ---');
  summary.tinyBlurryThumbnails.slice(0, 10).forEach(e => {
    console.log(`[${e.destSlug}] ${e.field}: ${e.src}`);
  });
}

if (summary.missingLocalImages.length > 0) {
  console.log('\n--- MISSING Local Images ---');
  summary.missingLocalImages.forEach(e => {
    console.log(`[${e.destSlug}] ${e.field}: ${e.src}`);
  });
}

fs.writeFileSync(path.join(__dirname, 'image-audit-report.json'), JSON.stringify(summary, null, 2));
console.log('\nSaved full report to scripts/image-audit-report.json');
