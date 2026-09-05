/**
 * fix-gallery-images.js
 *
 * Fixes broken image URLs in gallery arrays across all destination JSON files:
 * 1. Wikimedia /thumb/ URLs → converted to original full-resolution URLs
 * 2. Pixabay direct-download URLs (pixabay.com/get/...) → kept but flagged
 *    (Pixabay get/ URLs may not be valid outside their API context;
 *     we attempt to replace them from other gallery items or remove them)
 *
 * Run: node scripts/fix-gallery-images.js
 */

const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '../data/destinations');

/**
 * Converts a Wikimedia /thumb/ URL to the original full-resolution URL.
 * Example:
 *   .../thumb/a/ab/File.jpg/1280px-File.jpg  →  .../a/ab/File.jpg
 */
function thumbToOriginal(src) {
  if (!src.includes('/thumb/')) return src;
  const parts = src.split('/thumb/');
  if (parts.length !== 2) return src;
  const afterThumb = parts[1];
  const segments = afterThumb.split('/');
  // Remove the last "NNNpx-Filename" segment
  segments.pop();
  // Also strip any query string from the last remaining segment
  const lastSeg = segments[segments.length - 1].split('?')[0];
  segments[segments.length - 1] = lastSeg;
  return parts[0] + '/' + segments.join('/');
}

function isBrokenPixabay(src) {
  return src && src.includes('pixabay.com/get/');
}

let thumbFixed = 0;
let pixabayRemoved = 0;
let filesChanged = 0;

const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(DEST_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  if (!data.gallery || !Array.isArray(data.gallery)) continue;

  const newGallery = [];
  for (const g of data.gallery) {
    const src = typeof g === 'string' ? g : (g && g.src ? g.src : '');

    // Skip/remove broken Pixabay direct-download entries
    if (isBrokenPixabay(src)) {
      console.log(`[GALLERY-PIXABAY-REMOVED] ${file}: ${src.substring(0, 80)}`);
      pixabayRemoved++;
      changed = true;
      continue; // Drop this gallery entry
    }

    // Fix /thumb/ → original
    if (src.includes('/thumb/')) {
      const fixed = thumbToOriginal(src);
      if (fixed !== src) {
        thumbFixed++;
        changed = true;
        if (typeof g === 'string') {
          newGallery.push(fixed);
        } else {
          newGallery.push({ ...g, src: fixed });
        }
        continue;
      }
    }

    newGallery.push(g);
  }

  if (changed) {
    data.gallery = newGallery;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    filesChanged++;
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Gallery /thumb/ URLs fixed:        ${thumbFixed}`);
console.log(`Gallery Pixabay entries removed:   ${pixabayRemoved}`);
console.log(`Destination files updated:         ${filesChanged}`);
console.log('Done.');
