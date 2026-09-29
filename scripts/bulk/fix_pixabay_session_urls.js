/**
 * scripts/bulk/fix_pixabay_session_urls.js
 * 
 * Bulk fixer for Pixabay session URLs (pixabay.com/get/...) across all destination JSON files.
 * Replaces banned Pixabay URLs with zero-collision Pexels/Unsplash photos.
 * 
 * Data structure:
 *  - topPlaces[N].image = { src: "...", alt: "..." } OR plain string
 *  - topPlaces[N].photos = [string, string, string]
 * 
 * Usage: node scripts/bulk/fix_pixabay_session_urls.js [--dry-run] [--limit=N]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST_DIR = path.join(__dirname, '../../data/destinations');
const PIXABAY_PATTERN = /pixabay\.com\/get\//i;
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : Infinity;
const DELAY_MS = 300; // Rate limiting between API calls

// API Keys
const PEXELS_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';
const UNSPLASH_KEY = 'b5SJtVH8cpSj584Voko6hCJIP8XfBX15M693dDqMh4o';

// ─── Global URL Index (for zero-collision) ─────────────────────────────────────
const allFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'home-manifest.json');
const globalUrls = new Set();

console.log(`Building global URL index from ${allFiles.length} destination files...`);
allFiles.forEach(f => {
  const content = fs.readFileSync(path.join(DEST_DIR, f), 'utf8');
  const urls = content.match(/https?:\/\/[^"'\s,]+/g) || [];
  urls.forEach(u => {
    const clean = u.split('?')[0];
    globalUrls.add(clean);
  });
});
console.log(`Indexed ${globalUrls.size} unique photo base URLs.\n`);

// ─── Helpers ───────────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpsGet(options) {
  return new Promise((resolve) => {
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function searchPexels(query, count = 1) {
  const json = await httpsGet({
    hostname: 'api.pexels.com',
    path: `/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=20`,
    headers: { 'Authorization': PEXELS_KEY }
  });
  if (!json || !json.photos) return [];
  return json.photos.filter(p => {
    const clean = p.src.large2x.split('?')[0];
    const cleanOrig = p.src.original.split('?')[0];
    const hasCollision = globalUrls.has(clean) || globalUrls.has(cleanOrig);
    const isLandscape = p.width > p.height;
    const alt = (p.alt || '').toLowerCase();
    const hasPerson = /\bperson\b|\bwoman\b|\bman\b|\bgirl\b|\bboy\b|\bportrait\b|\bmodel\b|\bselfie\b|\bcrowd\b|\bface\b|\bpeople\b/i.test(alt);
    return !hasCollision && isLandscape && !hasPerson;
  }).slice(0, count);
}

async function searchUnsplash(query, count = 1) {
  const json = await httpsGet({
    hostname: 'api.unsplash.com',
    path: `/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=20`,
    headers: { 'Authorization': `Client-ID ${UNSPLASH_KEY}` }
  });
  if (!json || !json.results) return [];
  return json.results.filter(p => {
    const clean = p.urls.raw.split('?')[0];
    const hasCollision = globalUrls.has(clean);
    const isLandscape = p.width > p.height;
    const desc = `${p.description || ''} ${p.alt_description || ''}`.toLowerCase();
    const hasPerson = /\bperson\b|\bwoman\b|\bman\b|\bgirl\b|\bboy\b|\bportrait\b|\bmodel\b|\bselfie\b|\bcrowd\b|\bface\b|\bpeople\b/i.test(desc);
    return !hasCollision && isLandscape && !hasPerson;
  }).slice(0, count);
}

function buildPexelsUrl(photo) {
  const base = photo.src.large2x.split('?')[0];
  return `${base}?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`;
}

function buildUnsplashUrl(photo) {
  const base = photo.urls.raw.split('?')[0];
  return `${base}&auto=format&fit=crop&w=1920&q=85`;
}

function registerUrl(url) {
  const clean = url.split('?')[0];
  globalUrls.add(clean);
}

/** Extract the actual URL string regardless of whether field is string or {src, alt} object */
function getUrl(field) {
  if (!field) return null;
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field.src) return field.src;
  return null;
}

// ─── Find Affected Files ────────────────────────────────────────────────────────
console.log('Scanning for Pixabay session URL violations...');
const affectedFiles = [];

allFiles.forEach(fname => {
  const fpath = path.join(DEST_DIR, fname);
  const raw = fs.readFileSync(fpath, 'utf8');
  if (!PIXABAY_PATTERN.test(raw)) return;
  
  let data;
  try { data = JSON.parse(raw); } catch { return; }
  
  const violations = [];
  const topPlaces = data.topPlaces || data.places || [];
  
  topPlaces.forEach((place, pi) => {
    // Check image field (can be object {src, alt} or plain string)
    const imgUrl = getUrl(place.image);
    if (imgUrl && PIXABAY_PATTERN.test(imgUrl)) {
      violations.push({
        path: `topPlaces[${pi}].image`,
        fieldType: 'image',
        placeIdx: pi,
        photoIdx: null,
        placeName: place.name || `Place ${pi}`
      });
    }
    
    // Check photos array (plain strings)
    if (Array.isArray(place.photos)) {
      place.photos.forEach((photo, phi) => {
        const photoUrl = getUrl(photo);
        if (photoUrl && PIXABAY_PATTERN.test(photoUrl)) {
          violations.push({
            path: `topPlaces[${pi}].photos[${phi}]`,
            fieldType: 'photo',
            placeIdx: pi,
            photoIdx: phi,
            placeName: place.name || `Place ${pi}`
          });
        }
      });
    }
  });
  
  if (violations.length > 0) {
    affectedFiles.push({ fname, fpath, data, violations, topPlaces });
  }
});

console.log(`Found ${affectedFiles.length} files with Pixabay session URL violations.\n`);
const totalViolations = affectedFiles.reduce((sum, f) => sum + f.violations.length, 0);
console.log(`Total violations: ${totalViolations}\n`);

// ─── Fix Each File ─────────────────────────────────────────────────────────────
async function fetchReplacements(query, needed) {
  let replacements = [];
  
  await delay(DELAY_MS);
  const pexelsResults = await searchPexels(query, needed + 5);
  replacements = pexelsResults.map(p => ({
    url: buildPexelsUrl(p),
    alt: p.alt || query,
    src: 'pexels'
  }));
  
  if (replacements.length < needed) {
    await delay(DELAY_MS);
    const unsplashResults = await searchUnsplash(query, needed - replacements.length + 5);
    replacements = replacements.concat(unsplashResults.map(u => ({
      url: buildUnsplashUrl(u),
      alt: u.alt_description || u.description || query,
      src: 'unsplash'
    })));
  }
  
  return replacements;
}

async function fixFile(fileInfo) {
  const { fname, fpath, data, violations, topPlaces } = fileInfo;
  const destName = data.name || data.title || fname.replace('.json', '').replace(/-/g, ' ');
  const destState = data.state || '';
  
  console.log(`\n📁 ${fname} (${violations.length} violations)`);
  
  let changed = false;
  
  // Group violations by place index
  const byPlace = {};
  violations.forEach(v => {
    const key = v.placeIdx;
    if (!byPlace[key]) byPlace[key] = { placeName: v.placeName, violations: [] };
    byPlace[key].violations.push(v);
  });
  
  for (const [placeIdxStr, placeInfo] of Object.entries(byPlace)) {
    const placeIdx = parseInt(placeIdxStr);
    const place = topPlaces[placeIdx];
    const placeName = placeInfo.placeName;
    const needed = placeInfo.violations.length;
    
    // Try specific query first
    const specificQuery = `${placeName} ${destName} ${destState} India`.replace(/\s+/g, ' ').trim();
    let replacements = await fetchReplacements(specificQuery, needed);
    
    // Fallback 1: destination + state
    if (replacements.length < needed) {
      const fallbackQuery = `${destName} ${destState} India landmark tourism`.replace(/\s+/g, ' ').trim();
      const extra = await fetchReplacements(fallbackQuery, needed - replacements.length + 3);
      replacements = replacements.concat(extra);
    }
    
    // Fallback 2: state only
    if (replacements.length < needed && destState) {
      const stateQuery = `${destState} India nature architecture temple historic`.trim();
      const extra = await fetchReplacements(stateQuery, needed - replacements.length + 3);
      replacements = replacements.concat(extra);
    }
    
    // Fallback 3: India generic
    if (replacements.length < needed) {
      const genericQuery = 'India heritage architecture landscape temple';
      const extra = await fetchReplacements(genericQuery, needed - replacements.length + 3);
      replacements = replacements.concat(extra);
    }
    
    // Apply replacements
    for (let i = 0; i < placeInfo.violations.length; i++) {
      const violation = placeInfo.violations[i];
      const replacement = replacements[i];
      
      if (!replacement) {
        console.log(`    ⚠️  No replacement found for ${violation.path}`);
        continue;
      }
      
      registerUrl(replacement.url);
      
      if (violation.fieldType === 'image') {
        if (typeof place.image === 'object' && place.image !== null) {
          place.image.src = replacement.url;
        } else {
          place.image = replacement.url;
        }
        changed = true;
        console.log(`    ✅ [${replacement.src}] image → ${replacement.url.substring(0, 75)}...`);
      } else if (violation.fieldType === 'photo') {
        place.photos[violation.photoIdx] = replacement.url;
        changed = true;
        console.log(`    ✅ [${replacement.src}] photos[${violation.photoIdx}] → ${replacement.url.substring(0, 75)}...`);
      }
    }
  }
  
  if (changed && !DRY_RUN) {
    fs.writeFileSync(fpath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`  💾 Saved.`);
  } else if (changed && DRY_RUN) {
    console.log(`  🔍 [DRY RUN] Would save.`);
  }
  
  return changed;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const toFix = affectedFiles.slice(0, LIMIT);
  console.log(`Processing ${toFix.length} files${LIMIT < Infinity ? ` (limited to ${LIMIT})` : ''}...`);
  if (DRY_RUN) console.log('🔍 DRY RUN MODE - no files will be written\n');
  
  let fixed = 0;
  let failed = 0;
  
  for (const fileInfo of toFix) {
    try {
      const result = await fixFile(fileInfo);
      if (result) fixed++;
    } catch (err) {
      console.error(`  ❌ Error processing ${fileInfo.fname}: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Fixed: ${fixed} files`);
  if (failed > 0) console.log(`❌ Failed: ${failed} files`);
  console.log(`Total processed: ${toFix.length} files`);
  console.log(`\nRun 'node scripts/deep_pre_commit_audit.js' to verify.`);
})();
