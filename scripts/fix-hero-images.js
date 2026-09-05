/**
 * fix-hero-images.js
 *
 * Fixes two categories of broken hero images:
 * 1. Wikimedia /thumb/ URLs → converted to original full-resolution URLs
 * 2. Pixabay direct-download URLs (blocked 400) → replaced by first gallery image
 *
 * Run: node scripts/fix-hero-images.js
 */

const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '../data/destinations');

/**
 * Converts a Wikimedia /thumb/ URL to the original full-resolution URL.
 * Example:
 *   /thumb/a/ab/File.jpg/1280px-File.jpg  →  /a/ab/File.jpg
 */
function thumbToOriginal(src) {
  if (!src.includes('/thumb/')) return src;
  const parts = src.split('/thumb/');
  if (parts.length !== 2) return src;
  const afterThumb = parts[1];
  const segments = afterThumb.split('/');
  // Remove the last segment (e.g. "1280px-File.jpg")
  segments.pop();
  // Also strip any query string from the last remaining segment
  const lastSeg = segments[segments.length - 1].split('?')[0];
  segments[segments.length - 1] = lastSeg;
  return parts[0] + '/' + segments.join('/');
}

/**
 * Returns true if the URL is a broken Pixabay direct-download link.
 */
function isBrokenPixabay(src) {
  return src && src.includes('pixabay.com/get/');
}

let thumbFixed = 0;
let pixabayFixed = 0;
let pixabaySkipped = 0;

const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(DEST_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  if (!data.heroImage || !data.heroImage.src) continue;

  const src = data.heroImage.src;

  // Fix 1: /thumb/ → original
  if (src.includes('/thumb/')) {
    const fixed = thumbToOriginal(src);
    if (fixed !== src) {
      console.log(`[THUMB→ORIGINAL] ${file}`);
      console.log(`  Before: ${src.substring(0, 100)}`);
      console.log(`  After:  ${fixed.substring(0, 100)}`);
      data.heroImage.src = fixed;
      changed = true;
      thumbFixed++;
    }
  }

  // Fix 2: Pixabay direct-download → fallback to first gallery item
  if (isBrokenPixabay(data.heroImage.src)) {
    const gallery = data.gallery || [];
    // Find the first usable gallery item that isn't also a broken pixabay URL
    const fallback = gallery.find(g => {
      const gsrc = typeof g === 'string' ? g : (g && g.src ? g.src : '');
      return gsrc && !isBrokenPixabay(gsrc) && gsrc !== data.heroImage.src;
    });

    if (fallback) {
      const fallbackSrc = typeof fallback === 'string' ? fallback : fallback.src;
      const fallbackAlt = (fallback && fallback.alt) ? fallback.alt : data.heroImage.alt;
      console.log(`[PIXABAY→GALLERY] ${file}`);
      console.log(`  Before: ${data.heroImage.src.substring(0, 80)}`);
      console.log(`  After:  ${fallbackSrc.substring(0, 80)}`);
      data.heroImage.src = fallbackSrc;
      if (fallbackAlt) data.heroImage.alt = fallbackAlt;
      changed = true;
      pixabayFixed++;
    } else {
      console.log(`[PIXABAY-SKIP] ${file} — no usable gallery fallback`);
      pixabaySkipped++;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Thumb URLs fixed:        ${thumbFixed}`);
console.log(`Pixabay URLs fixed:      ${pixabayFixed}`);
console.log(`Pixabay URLs skipped:    ${pixabaySkipped}`);
console.log('Done.');
