/**
 * scripts/phase2_worker.js
 *
 * Universal multi-agent worker for Phase 2 batch repair.
 * Run 4 instances in parallel:
 *   node scripts/phase2_worker.js 0   (Worker A)
 *   node scripts/phase2_worker.js 1   (Worker B)
 *   node scripts/phase2_worker.js 2   (Worker C)
 *   node scripts/phase2_worker.js 3   (Worker D)
 *
 * Each worker:
 *   - Reads its assigned batch from scripts/phase2_batches/batch_X.json
 *   - Builds a full repository collision set (all clean files + other batches already processed)
 *   - Uses a page offset (workerIndex * 25) to start API queries from different pages
 *   - Writes used URLs to a shared session_state.json for cross-worker collision avoidance
 *   - Never throws on photo exhaustion (deep fallback cascade)
 *   - Skips already-clean files, continues past per-file errors
 */

const fs = require('fs');
const path = require('path');

const WORKER_INDEX = parseInt(process.argv[2] ?? '0', 10);
if (isNaN(WORKER_INDEX) || WORKER_INDEX < 0 || WORKER_INDEX > 3) {
  console.error('Usage: node phase2_worker.js <0|1|2|3>');
  process.exit(1);
}

const WORKER_LABEL = String.fromCharCode(65 + WORKER_INDEX); // A, B, C, D
const PAGE_OFFSET = WORKER_INDEX * 25; // Workers start at pages: 0, 25, 50, 75

// ── 1. Load API keys ─────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > 0) env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  });
}
if (!env.PEXELS_API_KEY || !env.UNSPLASH_ACCESS_KEY) {
  console.error('ERROR: Missing PEXELS_API_KEY or UNSPLASH_ACCESS_KEY in .env.local');
  process.exit(1);
}

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
const batchDir = path.resolve(__dirname, '..', 'scripts', 'phase2_batches');
const batchFile = path.join(batchDir, `batch_${WORKER_LABEL}.json`);
const sessionStateFile = path.join(batchDir, 'session_state.json');

if (!fs.existsSync(batchFile)) {
  console.error(`Batch file not found: ${batchFile}`);
  console.error('Run: node scripts/phase2_scanner.js first');
  process.exit(1);
}

const { files: BATCH_FILES } = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
console.log(`\n[Worker ${WORKER_LABEL}] Starting with ${BATCH_FILES.length} destinations (page offset: +${PAGE_OFFSET})`);

// ── 2. Collision Tracking ─────────────────────────────────────────────────────
const globalRepoCollisions = new Set();
const sessionUsedUrls = new Set();

function cleanUrl(u) {
  if (!u) return '';
  return u.split('?')[0].trim().toLowerCase();
}

function loadSessionState() {
  try {
    const state = JSON.parse(fs.readFileSync(sessionStateFile, 'utf8'));
    (state.usedUrls || []).forEach(u => sessionUsedUrls.add(u));
  } catch (e) {}
}

function appendToSessionState(newUrls) {
  try {
    let state = { usedUrls: [], completedFiles: [] };
    try { state = JSON.parse(fs.readFileSync(sessionStateFile, 'utf8')); } catch (e) {}
    const existing = new Set(state.usedUrls);
    newUrls.forEach(u => existing.add(u));
    state.usedUrls = [...existing];
    fs.writeFileSync(sessionStateFile, JSON.stringify(state, null, 2));
  } catch (e) {}
}

function initGlobalCollisions() {
  console.log(`[Worker ${WORKER_LABEL}] Building repository collision index...`);
  const allFiles = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  for (const f of allFiles) {
    if (BATCH_FILES.includes(f)) continue; // exclude own batch (will process these)
    try {
      const d = JSON.parse(fs.readFileSync(path.join(destDir, f), 'utf8'));
      if (d.heroImage?.src) globalRepoCollisions.add(cleanUrl(d.heroImage.src));
      (d.gallery || []).forEach(g => g.src && globalRepoCollisions.add(cleanUrl(g.src)));
      (d.topPlaces || []).forEach(p => {
        if (p.image?.src) globalRepoCollisions.add(cleanUrl(p.image.src));
        (p.photos || []).forEach(ph => {
          const u = ph.src || ph; if (u) globalRepoCollisions.add(cleanUrl(u));
        });
      });
    } catch (e) {}
  }
  // Load cross-worker session state
  loadSessionState();
  console.log(`[Worker ${WORKER_LABEL}] Collision index: ${globalRepoCollisions.size} URLs, session: ${sessionUsedUrls.size} URLs`);
}

// ── 3. Safety Filters ─────────────────────────────────────────────────────────
const BANNED_PATTERNS = [
  /\bperson\b/i, /\bpeople\b/i, /\bman\b/i, /\bwoman\b/i, /\bwomen\b/i, /\bgirl\b/i, /\bboy\b/i,
  /\bchild\b/i, /\bbaby\b/i, /\bportrait\b/i, /\bselfie\b/i, /\bmodel\b/i, /\bposing\b/i,
  /\bface\b/i, /\btourists\b/i, /\bcrowd\b/i, /\bmob\b/i, /\bfamily\b/i, /\byogi\b/i,
  /\bbus\b/i, /\btruck\b/i, /\bcar\b/i, /\btractor\b/i, /\btrain\b/i, /\bairport\b/i,
  /\brunway\b/i, /\bflight\b/i, /\bspeedboat\b/i,
  /\bmap\b/i, /\bdiagram\b/i, /\.svg$/i, /\.pdf$/i, /census/i, /chart/i, /drawing/i,
  /spinach/i, /recipe/i, /curry/i, /collapsed/i, /flood/i, /damage/i, /accident/i,
  /disaster/i, /massacre/i, /killing/i, /stampede/i,
  /kyiv/i, /ukraine/i, /vietnam/i, /cuba/i, /malaysia/i, /thailand/i, /indonesia/i, /bali/i,
  /germany/i, /berlin/i, /spain/i, /italy/i, /france/i, /switzerland/i, /china/i, /turkey/i,
  /sri lanka/i, /colombo/i, /pakistan/i, /bangladesh/i, /greece/i, /america/i, /california/i,
  /penang/i, /baku/i, /valencia/i, /mexico/i, /canada/i, /austria/i, /australia/i, /brazil/i,
  /alps/i, /japan/i, /korea/i
];
function isSafeSubject(text) {
  if (!text) return true;
  return !BANNED_PATTERNS.some(p => p.test(text));
}

// ── 4. API Fetchers ───────────────────────────────────────────────────────────
const queryCache = new Map();
const delay = ms => new Promise(r => setTimeout(r, ms));

async function fetchPexels(query, count = 25, page = 1) {
  const actualPage = page + PAGE_OFFSET;
  const key = `pex:${query}:${count}:${actualPage}`;
  if (queryCache.has(key)) return queryCache.get(key);
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&page=${actualPage}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': env.PEXELS_API_KEY } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.photos || [])
      .filter(p => p.width >= 1200 && p.height >= 675 && (p.width / p.height) >= 1.25 && isSafeSubject(p.alt))
      .map(p => ({
        provider: 'pexels',
        url: `https://images.pexels.com/photos/${p.id}/pexels-photo-${p.id}.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1920`,
        alt: p.alt || query, width: p.width, height: p.height, id: p.id
      }));
    queryCache.set(key, items);
    await delay(100);
    return items;
  } catch (e) { return []; }
}

async function fetchUnsplash(query, count = 25, page = 1) {
  const actualPage = page + PAGE_OFFSET;
  const key = `uns:${query}:${count}:${actualPage}`;
  if (queryCache.has(key)) return queryCache.get(key);
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&page=${actualPage}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.results || [])
      .filter(p => p.width >= 1200 && p.height >= 675 && (p.width / p.height) >= 1.25 && isSafeSubject(p.description || p.alt_description))
      .map(p => ({
        provider: 'unsplash',
        url: `${p.urls.raw}&auto=format&fit=crop&w=1920&q=85`,
        alt: p.description || p.alt_description || query, width: p.width, height: p.height, id: p.id
      }));
    queryCache.set(key, items);
    await delay(100);
    return items;
  } catch (e) { return []; }
}

async function verifyUrlLive(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Range': 'bytes=0-1024' },
      signal: controller.signal
    });
    clearTimeout(timer);
    return res.status >= 200 && res.status < 400;
  } catch (e) { return false; }
}

// ── 5. Unique Photo Picker (never throws) ─────────────────────────────────────
async function pickUniquePhoto(candidates, defaultAlt, fallbackQueries = []) {
  // Try existing candidates first
  for (const c of candidates) {
    const url = typeof c === 'string' ? c : c?.url || c?.src;
    if (!url) continue;
    if (url.includes('wikimedia') || url.includes('/get/')) continue;
    if (!url.startsWith('https://images.pexels.com/') && !url.startsWith('https://images.unsplash.com/')) continue;
    const base = cleanUrl(url);
    if (!base || globalRepoCollisions.has(base) || sessionUsedUrls.has(base)) continue;
    const altText = (typeof c === 'object' && c?.alt) ? c.alt : defaultAlt;
    if (!isSafeSubject(altText) || !isSafeSubject(url)) continue;
    const live = await verifyUrlLive(url);
    if (!live) continue;
    sessionUsedUrls.add(base);
    let alt = (altText || defaultAlt).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    if (alt.length > 95) alt = alt.slice(0, 92) + '...';
    return { src: url, alt: alt || defaultAlt };
  }

  // Try fallback queries with multiple pages
  for (const q of fallbackQueries) {
    for (let pg = 1; pg <= 3; pg++) {
      const pool = [...await fetchPexels(q, 30, pg), ...await fetchUnsplash(q, 30, pg)];
      for (const item of pool) {
        const base = cleanUrl(item.url);
        if (!base || globalRepoCollisions.has(base) || sessionUsedUrls.has(base)) continue;
        if (!isSafeSubject(item.alt) || !isSafeSubject(item.url)) continue;
        const live = await verifyUrlLive(item.url);
        if (!live) continue;
        sessionUsedUrls.add(base);
        let alt = (item.alt || defaultAlt).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
        if (alt.length > 95) alt = alt.slice(0, 92) + '...';
        return { src: item.url, alt: alt || defaultAlt };
      }
    }
  }

  // Broad Indian landscape/heritage fallbacks
  const broadFallbacks = [
    'india landscape nature scenic', 'indian heritage temple stone ancient',
    'india architecture historic monument', 'india nature forest river valley',
    'sacred shrine ancient india stone', 'india wildlife forest nature reserve',
    'india hills mountains scenic panoramic', 'india rural village nature green',
    'ancient stone architecture india heritage', 'india travel destination landmark scenic'
  ];
  for (const bq of broadFallbacks) {
    for (let pg = 1; pg <= 5; pg++) {
      for (const item of [...await fetchPexels(bq, 30, pg), ...await fetchUnsplash(bq, 30, pg)]) {
        const base = cleanUrl(item.url);
        if (base && !globalRepoCollisions.has(base) && !sessionUsedUrls.has(base)) {
          if (!isSafeSubject(item.alt)) continue;
          const live = await verifyUrlLive(item.url);
          if (!live) continue;
          sessionUsedUrls.add(base);
          return { src: item.url, alt: defaultAlt };
        }
      }
    }
  }

  // Last resort: deep page crawl
  for (let pg = 6; pg <= 30; pg++) {
    for (const item of await fetchPexels('india scenic landscape', 30, pg)) {
      const base = cleanUrl(item.url);
      if (base && !globalRepoCollisions.has(base) && !sessionUsedUrls.has(base)) {
        sessionUsedUrls.add(base);
        return { src: item.url, alt: defaultAlt };
      }
    }
  }

  // Absolute last resort - hardcoded safe Pexels nature photos
  console.warn(`  [Worker ${WORKER_LABEL}] [WARN] Truly exhausted candidates for "${defaultAlt}" — using safe fallback.`);
  const safeUrls = [
    'https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1920',
    'https://images.pexels.com/photos/1007426/pexels-photo-1007426.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1920',
    'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1920',
    'https://images.pexels.com/photos/3194519/pexels-photo-3194519.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1920',
    'https://images.pexels.com/photos/3401403/pexels-photo-3401403.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1920'
  ];
  for (const su of safeUrls) {
    const base = cleanUrl(su);
    if (!globalRepoCollisions.has(base) && !sessionUsedUrls.has(base)) {
      sessionUsedUrls.add(base);
      return { src: su, alt: defaultAlt };
    }
  }
  sessionUsedUrls.add(cleanUrl(safeUrls[WORKER_INDEX % safeUrls.length]));
  return { src: safeUrls[WORKER_INDEX % safeUrls.length], alt: defaultAlt };
}

// ── 6. Check if destination is already clean ──────────────────────────────────
function isAlreadyClean(filename) {
  try {
    const raw = fs.readFileSync(path.join(destDir, filename), 'utf8');
    const d = JSON.parse(raw);
    return !raw.includes('wikimedia') &&
      !raw.includes('/get/') &&
      !raw.includes('nearest airport') &&
      Array.isArray(d.gallery) && d.gallery.length === 5 &&
      d.heroImage?.src === d.gallery[0]?.src &&
      (d.topPlaces || []).every(pl => pl.image?.src && Array.isArray(pl.photos) && pl.photos.length === 3);
  } catch (e) { return false; }
}

// ── 7. Process one destination ────────────────────────────────────────────────
async function processDestination(filename) {
  const p = path.join(destDir, filename);
  const dest = JSON.parse(fs.readFileSync(p, 'utf8'));
  const dName = dest.name || dest.title || filename.replace('.json', '');
  console.log(`\n[Worker ${WORKER_LABEL}] Processing: ${dName} (${filename})`);

  // Fix transit placeholder
  if (dest.howToReach?.nearestAirport?.name?.includes('nearest airport')) {
    dest.howToReach.nearestAirport.name = `${dest.state || 'Regional'} Airport`;
  }

  // Clean disaster words in place descriptions
  (dest.topPlaces || []).forEach(pl => {
    if (pl.description && /incident happened.*stampede|flood.*killed|massacre|bomb blast|terror/i.test(pl.description)) {
      pl.description = pl.description
        .replace(/incident happened.*stampede.*?\.?/gi, '')
        .replace(/flood.*killed.*?\.?/gi, '')
        .replace(/massacre.*?\.?/gi, '')
        .replace(/bomb blast.*?\.?/gi, '')
        .replace(/terror(ist)?.*?\.?/gi, '')
        .trim() || 'Renowned attraction in the region offering rich historical and natural appeal.';
    }
    // Replace disaster place names
    if (/massacre|stampede|flood|bomb|terror|accident|killed|rail disaster/i.test(pl.name)) {
      pl.name = `${dName} Heritage Site`;
      pl.description = 'Historic landmark and cultural heritage attraction in the surrounding region.';
    }
  });

  // Fix badge if it contains generic airport/transit text
  if (dest.badge && /nearest airport|km from|terminal/i.test(dest.badge)) {
    const dType = (dest.type || dest.category || 'heritage').replace(/_/g, ' ');
    dest.badge = `${dest.state || 'India'} ${dType.charAt(0).toUpperCase() + dType.slice(1)}`;
  }

  // Gallery: 5 HD unique images
  const dType = (dest.type || dest.category || 'heritage').toLowerCase();
  const searchThemes = [
    `${dName} india`,
    `${dest.state || 'india'} ${dType} scenic`,
    `ancient ${dType} architecture india`,
    `sacred ${dType} landscape india`,
    `panoramic ${dest.state || 'india'} nature`
  ];

  const newGallery = [];
  const existingGallery = dest.gallery || [];
  for (let i = 0; i < 5; i++) {
    const existing = existingGallery[i];
    const candidatePool = [];
    if (existing?.src && !existing.src.includes('wikimedia') && !existing.src.includes('/get/')) {
      candidatePool.push(existing);
    }
    const photo = await pickUniquePhoto(
      candidatePool,
      `${dName} — Scenic Vista ${i + 1}`,
      [searchThemes[i % searchThemes.length], searchThemes[0]]
    );
    newGallery.push({
      src: photo.src,
      alt: photo.alt,
      title: `${dName} — View ${i + 1}`,
      caption: `${dest.badge || 'Historic Landmark'} in ${dest.state || 'India'}`
    });
  }
  dest.gallery = newGallery;
  dest.heroImage = { src: newGallery[0].src, alt: newGallery[0].alt };

  // Top Places: 1 card + 3 photos each
  for (let pIdx = 0; pIdx < (dest.topPlaces || []).length; pIdx++) {
    const pl = dest.topPlaces[pIdx];
    const plName = pl.name || `Attraction ${pIdx + 1}`;
    const plQueries = [
      `${plName} ${dest.state || 'india'}`,
      `${plName} scenic`,
      `${pl.category || 'attraction'} landscape india`
    ];

    const cardPool = [];
    if (pl.image?.src && !pl.image.src.includes('wikimedia') && !pl.image.src.includes('/get/')) {
      cardPool.push(pl.image);
    }
    const cardPhoto = await pickUniquePhoto(cardPool, `${plName} landmark`, plQueries);
    pl.image = { src: cardPhoto.src, alt: cardPhoto.alt };

    const newPhotos = [];
    for (let phIdx = 0; phIdx < 3; phIdx++) {
      const existingPh = pl.photos?.[phIdx];
      const exUrl = typeof existingPh === 'string' ? existingPh : existingPh?.src;
      const phPool = (exUrl && !exUrl.includes('wikimedia') && !exUrl.includes('/get/')) ? [exUrl] : [];
      const ph = await pickUniquePhoto(phPool, `${plName} photo ${phIdx + 1}`, plQueries);
      newPhotos.push(ph.src);
    }
    pl.photos = newPhotos;
  }

  // Sync seo.ogImage
  if (dest.seo) dest.seo.ogImage = dest.heroImage.src;

  fs.writeFileSync(p, JSON.stringify(dest, null, 2), 'utf8');
  console.log(`  [Worker ${WORKER_LABEL}] [OK] Saved ${filename} ✓`);
}

// ── 8. Sync index for this batch ──────────────────────────────────────────────
function syncIndex() {
  console.log(`\n[Worker ${WORKER_LABEL}] Syncing index.json for batch...`);
  const indexPath = path.join(destDir, 'index.json');
  try {
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    for (const filename of BATCH_FILES) {
      const slug = filename.replace('.json', '');
      const p = path.join(destDir, filename);
      if (!fs.existsSync(p)) continue;
      try {
        const d = JSON.parse(fs.readFileSync(p, 'utf8'));
        const item = (indexData.destinations || []).find(x => x.slug === slug || x.id === slug);
        if (item) {
          item.heroImage = d.heroImage;
          if (d.badge) item.badge = d.badge;
          if (d.tagline) item.tagline = d.tagline;
        }
      } catch (e) {}
    }
    indexData.generated = new Date().toISOString();
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
    console.log(`[Worker ${WORKER_LABEL}] index.json updated.`);
  } catch (e) {
    console.error(`[Worker ${WORKER_LABEL}] index.json sync failed:`, e.message);
  }
}

// ── 9. Main ───────────────────────────────────────────────────────────────────
async function main() {
  initGlobalCollisions();

  let processed = 0, skipped = 0, errors = 0;
  const fileUrls = [];

  for (let i = 0; i < BATCH_FILES.length; i++) {
    const filename = BATCH_FILES[i];
    const p = path.join(destDir, filename);
    console.log(`\n[Worker ${WORKER_LABEL}] [${i + 1}/${BATCH_FILES.length}] ${filename}`);

    if (!fs.existsSync(p)) {
      console.log(`  [Worker ${WORKER_LABEL}] SKIP (file not found)`);
      skipped++;
      continue;
    }

    if (isAlreadyClean(filename)) {
      console.log(`  [Worker ${WORKER_LABEL}] ALREADY CLEAN — skipping`);
      // Still register its URLs to prevent session collisions
      try {
        const d = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (d.heroImage?.src) sessionUsedUrls.add(cleanUrl(d.heroImage.src));
        (d.gallery || []).forEach(g => g.src && sessionUsedUrls.add(cleanUrl(g.src)));
        (d.topPlaces || []).forEach(pl => {
          if (pl.image?.src) sessionUsedUrls.add(cleanUrl(pl.image.src));
          (pl.photos || []).forEach(ph => { const u = ph.src || ph; if (u) sessionUsedUrls.add(cleanUrl(u)); });
        });
      } catch (e) {}
      skipped++;
      continue;
    }

    try {
      await processDestination(filename);
      processed++;

      // Periodically flush used URLs to shared session state (every 5 files)
      if (processed % 5 === 0) {
        appendToSessionState([...sessionUsedUrls]);
      }
    } catch (err) {
      console.error(`  [Worker ${WORKER_LABEL}] [ERROR] ${filename}: ${err.message} — continuing...`);
      errors++;
    }
  }

  // Final flush
  appendToSessionState([...sessionUsedUrls]);

  console.log(`\n[Worker ${WORKER_LABEL}] ══════════════════════════════════════`);
  console.log(`[Worker ${WORKER_LABEL}] Processed : ${processed}`);
  console.log(`[Worker ${WORKER_LABEL}] Skipped   : ${skipped} (already clean)`);
  console.log(`[Worker ${WORKER_LABEL}] Errors    : ${errors}`);
  console.log(`[Worker ${WORKER_LABEL}] ══════════════════════════════════════`);

  syncIndex();
  console.log(`\n[Worker ${WORKER_LABEL}] Done ✓`);
}

main().catch(err => {
  console.error(`[Worker ${WORKER_LABEL}] Fatal:`, err);
  process.exit(1);
});
