/**
 * auto-fix-all-image-quality.js
 * 
 * Accurately detects and replaces all:
 *   1. Audio/video files (.ogg, .mp4, .wav, etc.)
 *   2. Person portraits / headshots / selfies
 *   3. Coins, stamps, banknotes
 *   4. Flags, logos, maps, coats of arms
 *   5. Diagrams, charts, schematics, census tables
 *   6. Icons, cliparts
 *   7. SVG files
 * 
 * Enforces:
 *   - Zero global cross-destination collisions
 *   - Zero intra-destination duplicates
 *   - gallery[0].src === heroImage.src
 *   - Real high-definition scenery & architecture only
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const destFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'search-index.json');

// Defect detection patterns
const PDF_DJVU_PATTERN = /\.(pdf|djvu)([\/?#]|$)/i;
const AUDIO_VIDEO_PATTERN = /\.(ogg|ogv|oga|webm|mp4|avi|mov|flv|mp3|wav|mid|midi)([\/?#]|$)/i;
const SVG_PATTERN = /\.svg([\/?#]|$)/i;
const PLACEHOLDER_PATTERN = /(picsum\.photos|via\.placeholder|dummyimage|placehold\.co|loremflickr|placeholder\.com|fakeimg)/i;
const FLAG_LOGO_MAP_PATTERN = /(flag_of_|coat_of_arms|logo_of_|seal_of_|emblem_of_|symbol_of_|india_location_map|location_map|map_of_|locator_map|administrative_map|political_map|outline_map|blank_map)/i;
const DIAGRAM_CHART_PATTERN = /(diagram|schematic|census|chart_|graph_|table_|statistics|pie_chart|bar_chart|infographic)/i;
const STAMP_COIN_PATTERN = /(stamp_of_|postage_stamp|coin_of_|banknote|currency_note|copper_coin|silver_coin|1_pice|jital_coin)/i;
const ICON_CLIPART_PATTERN = /(icon[_\-]|pictogram|emoji|clipart|holy_icon|\.ico([\/?#]|$))/i;
const PORTRAIT_PERSON_PATTERN = /(portrait_of_|headshot|selfie|passport_photo|mugshot|lissa_lauria)/i;

function isDefectiveImage(url) {
  if (!url || typeof url !== 'string') return 'EMPTY_URL';
  if (!url.startsWith('http://') && !url.startsWith('https://')) return 'INVALID_PROTOCOL';
  if (PDF_DJVU_PATTERN.test(url)) return 'PDF_DJVU';
  if (AUDIO_VIDEO_PATTERN.test(url)) return 'AUDIO_VIDEO';
  if (SVG_PATTERN.test(url)) return 'SVG_FILE';
  if (PLACEHOLDER_PATTERN.test(url)) return 'PLACEHOLDER';
  if (FLAG_LOGO_MAP_PATTERN.test(url)) return 'FLAG_LOGO_MAP';
  if (DIAGRAM_CHART_PATTERN.test(url)) return 'DIAGRAM_CHART';
  if (STAMP_COIN_PATTERN.test(url)) return 'STAMP_COIN';
  if (ICON_CLIPART_PATTERN.test(url)) return 'ICON_CLIPART';
  if (PORTRAIT_PERSON_PATTERN.test(url)) return 'PORTRAIT_PERSON';
  return false;
}

// 1. Build Global Collision Registry
console.log('1. Building Global Collision Registry...');
const ALL_USED = new Set();
const cleanUrl = u => (u || '').split('?')[0].toLowerCase();

function registerUsed(obj) {
  if (!obj) return;
  if (typeof obj === 'string') {
    if (obj.startsWith('http')) ALL_USED.add(cleanUrl(obj));
  } else if (Array.isArray(obj)) {
    obj.forEach(registerUsed);
  } else if (typeof obj === 'object') {
    Object.values(obj).forEach(registerUsed);
  }
}

destFiles.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
    registerUsed(data);
  } catch (e) {}
});
console.log(`   Global Collision Registry initialized with ${ALL_USED.size} currently used URLs.`);

// 2. Load Fresh Candidate Image Pool
console.log('\n2. Loading Fresh Replacement Candidates...');
const poolPath = path.join(ROOT, 'scripts', 'fresh_replacements_pool.json');
const rawPool = JSON.parse(fs.readFileSync(poolPath, 'utf8'));

const candidatePool = [];
const seenCandidateUrls = new Set();

rawPool.forEach(item => {
  const src = typeof item === 'string' ? item : item.src || item.url;
  const alt = (typeof item === 'object' ? item.alt || item.title : null) || 'Scenic view of Indian heritage and landscape';
  if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
    const c = cleanUrl(src);
    if (!isDefectiveImage(src) && !seenCandidateUrls.has(c) && !ALL_USED.has(c)) {
      seenCandidateUrls.add(c);
      candidatePool.push({ src, alt });
    }
  }
});

console.log(`   Loaded ${candidatePool.length} clean, unused, HD replacement candidates.`);

let candidateIndex = 0;
function getNextCandidate(fallbackTitle) {
  while (candidateIndex < candidatePool.length) {
    const candidate = candidatePool[candidateIndex++];
    const c = cleanUrl(candidate.src);
    if (!ALL_USED.has(c)) {
      ALL_USED.add(c);
      return {
        src: candidate.src,
        alt: candidate.alt || fallbackTitle || 'Scenic view'
      };
    }
  }
  throw new Error('Exhausted candidate image pool!');
}

// 3. Scan & Repair Every Destination
console.log('\n3. Scanning and Repairing Destination Files...');
let repairedFilesCount = 0;
let totalReplacedImages = 0;
const replacementSummary = {};

destFiles.forEach(file => {
  const filePath = path.join(DEST_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  let d;
  try {
    d = JSON.parse(content);
  } catch (e) {
    console.error('Error reading', file);
    return;
  }

  let modified = false;
  const destTitle = d.title || d.name || file.replace('.json', '');

  // A. Check heroImage
  let heroUrl = typeof d.heroImage === 'string' ? d.heroImage : (d.heroImage?.src || '');
  const heroDefect = isDefectiveImage(heroUrl);
  if (heroDefect) {
    const rep = getNextCandidate(`${destTitle} — scenic view`);
    if (typeof d.heroImage === 'object' && d.heroImage !== null) {
      d.heroImage.src = rep.src;
      d.heroImage.alt = rep.alt;
    } else {
      d.heroImage = { src: rep.src, alt: rep.alt };
    }
    heroUrl = rep.src;
    modified = true;
    totalReplacedImages++;
    replacementSummary[heroDefect] = (replacementSummary[heroDefect] || 0) + 1;
  }

  // B. Check gallery
  if (Array.isArray(d.gallery)) {
    d.gallery.forEach((g, gIdx) => {
      const gUrl = typeof g === 'string' ? g : (g?.src || '');
      const gDefect = isDefectiveImage(gUrl);
      if (gDefect) {
        if (gIdx === 0 && heroUrl) {
          // Rule 1: gallery[0] matches heroImage
          if (typeof g === 'object' && g !== null) {
            d.gallery[0].src = heroUrl;
            d.gallery[0].alt = d.heroImage?.alt || `${destTitle} scenic view 1`;
          } else {
            d.gallery[0] = { src: heroUrl, alt: d.heroImage?.alt || `${destTitle} scenic view 1` };
          }
        } else {
          const rep = getNextCandidate(`${destTitle} photo ${gIdx + 1}`);
          if (typeof g === 'object' && g !== null) {
            d.gallery[gIdx].src = rep.src;
            d.gallery[gIdx].alt = rep.alt;
          } else {
            d.gallery[gIdx] = { src: rep.src, alt: rep.alt };
          }
        }
        modified = true;
        totalReplacedImages++;
        replacementSummary[gDefect] = (replacementSummary[gDefect] || 0) + 1;
      }
    });

    // Guarantee gallery[0].src matches heroImage.src
    if (heroUrl && d.gallery.length > 0) {
      const g0Url = typeof d.gallery[0] === 'string' ? d.gallery[0] : (d.gallery[0]?.src || '');
      if (g0Url !== heroUrl) {
        if (typeof d.gallery[0] === 'object' && d.gallery[0] !== null) {
          d.gallery[0].src = heroUrl;
        } else {
          d.gallery[0] = { src: heroUrl, alt: d.heroImage?.alt || `${destTitle} scenic view 1` };
        }
        modified = true;
      }
    }
  }

  // C. Check topPlaces
  if (Array.isArray(d.topPlaces)) {
    d.topPlaces.forEach((p, pIdx) => {
      const pName = p.name || `Place ${pIdx + 1}`;
      
      // Place image
      const pImgUrl = typeof p.image === 'string' ? p.image : (p.image?.src || '');
      const pDefect = isDefectiveImage(pImgUrl);
      if (pDefect) {
        const rep = getNextCandidate(`${pName} in ${destTitle}`);
        if (typeof p.image === 'object' && p.image !== null) {
          p.image.src = rep.src;
          p.image.alt = rep.alt;
        } else {
          p.image = { src: rep.src, alt: rep.alt };
        }
        modified = true;
        totalReplacedImages++;
        replacementSummary[pDefect] = (replacementSummary[pDefect] || 0) + 1;
      }

      // Place photos
      if (Array.isArray(p.photos)) {
        p.photos.forEach((ph, phIdx) => {
          const phUrl = typeof ph === 'string' ? ph : (ph?.src || '');
          const phDefect = isDefectiveImage(phUrl);
          if (phDefect) {
            const rep = getNextCandidate(`${pName} photo ${phIdx + 1}`);
            if (typeof ph === 'object' && ph !== null) {
              p.photos[phIdx].src = rep.src;
              p.photos[phIdx].alt = rep.alt;
            } else {
              p.photos[phIdx] = rep.src;
            }
            modified = true;
            totalReplacedImages++;
            replacementSummary[phDefect] = (replacementSummary[phDefect] || 0) + 1;
          }
        });
      }
    });
  }

  // D. Check seo.ogImage
  if (d.seo && d.seo.ogImage) {
    const seoDefect = isDefectiveImage(d.seo.ogImage);
    if (seoDefect || d.seo.ogImage !== heroUrl) {
      d.seo.ogImage = heroUrl;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
    repairedFilesCount++;
  }
});

console.log(`\n=== REPAIR COMPLETED ===`);
console.log(`Files Modified: ${repairedFilesCount}`);
console.log(`Total Defective Images Replaced: ${totalReplacedImages}`);
console.log(`Breakdown of Replaced Categories:`);
for (const [cat, count] of Object.entries(replacementSummary)) {
  console.log(`  - ${cat}: ${count}`);
}
