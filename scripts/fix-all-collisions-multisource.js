const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');

const PEXELS_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';
const PIXABAY_KEY = '57319596-22154b955dc5e927e4fe09081';
const UNSPLASH_KEY = 'b5SJtVH8cpSj584Voko6hCJIP8XfBX15M693dDqMh4o';

// ─── 1. Build Global Used Key & URL Set ─────────────────────────────
const usedCanonicalKeys = new Set();
const usedUrls = new Set();

function getCanonicalKey(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim().toLowerCase().split('?')[0];
  if (!clean.startsWith('http')) return null;
  if (clean.includes('pexels.com')) {
    const m = clean.match(/photos\/(\d+)/);
    if (m) return 'pexels:' + m[1];
  }
  if (clean.includes('unsplash.com')) {
    const parts = clean.split('/');
    return 'unsplash:' + parts[parts.length - 1];
  }
  if (clean.includes('wikimedia.org') || clean.includes('wikipedia.org')) {
    const raw = clean.split('/').pop();
    return 'wiki:' + decodeURIComponent(raw);
  }
  return 'generic:' + clean;
}

const allDestFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'search-index.json');
allDestFiles.forEach(f => {
  const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
  const register = (u) => {
    if (!u || typeof u !== 'string') return;
    const clean = u.split('?')[0].toLowerCase();
    usedUrls.add(clean);
    const k = getCanonicalKey(u);
    if (k) usedCanonicalKeys.add(k);
  };
  if (d.heroImage && d.heroImage.src) register(d.heroImage.src);
  (d.gallery || []).forEach(g => { register(typeof g === 'string' ? g : (g && g.src ? g.src : '')); });
  (d.topPlaces || []).forEach(p => {
    register(p.image && p.image.src ? p.image.src : (typeof p.image === 'string' ? p.image : ''));
    (p.photos || []).forEach(ph => register(typeof ph === 'string' ? ph : (ph && ph.src ? ph.src : '')));
  });
});

console.log(`Initial Catalog: ${usedUrls.size} URLs, ${usedCanonicalKeys.size} Canonical Keys tracked.`);

// ─── 2. Provider Fetch Helpers ─────────────────────────────────────
function fetchJson(url, headers = {}) {
  return new Promise(resolve => {
    const req = https.get(url, { headers: { 'User-Agent': 'ExploreDesh/2.0 (travel@exploredesh.org)', ...headers }, timeout: 10000 }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

const BAD_KEYWORDS = /diagram|plan|floor_plan|map|flag|logo|seal|stamp|coin|portrait|headshot|selfie|drawing|sketch|table|chart|census|icon|audio|\.ogg|\.svg|\.pdf|\.djvu/i;

async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`;
  const data = await fetchJson(url, { Authorization: PEXELS_KEY });
  const results = [];
  if (data && Array.isArray(data.photos)) {
    for (const p of data.photos) {
      if (p.width && p.height && p.width > p.height) {
        const ratio = p.width / p.height;
        if (ratio >= 1.2 && ratio <= 2.2 && p.width >= 1200) {
          const src = p.src.large2x || p.src.large || p.src.original;
          const k = 'pexels:' + p.id;
          if (!usedCanonicalKeys.has(k) && !usedUrls.has(src.split('?')[0].toLowerCase())) {
            results.push({
              src: src,
              canonicalKey: k,
              alt: p.alt || query,
              width: p.width,
              height: p.height,
              provider: 'Pexels'
            });
          }
        }
      }
    }
  }
  return results;
}

async function searchPixabay(query) {
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=10&safesearch=true`;
  const data = await fetchJson(url);
  const results = [];
  if (data && Array.isArray(data.hits)) {
    for (const p of data.hits) {
      if (p.imageWidth && p.imageHeight && p.imageWidth > p.imageHeight) {
        const ratio = p.imageWidth / p.imageHeight;
        if (ratio >= 1.2 && ratio <= 2.2 && p.imageWidth >= 1200) {
          const src = p.largeImageURL || p.webformatURL;
          const k = 'pixabay:' + p.id;
          if (!usedCanonicalKeys.has(k) && !usedUrls.has(src.split('?')[0].toLowerCase())) {
            results.push({
              src: src,
              canonicalKey: k,
              alt: p.tags || query,
              width: p.imageWidth,
              height: p.imageHeight,
              provider: 'Pixabay'
            });
          }
        }
      }
    }
  }
  return results;
}

async function searchUnsplash(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`;
  const data = await fetchJson(url, { Authorization: 'Client-ID ' + UNSPLASH_KEY });
  const results = [];
  if (data && Array.isArray(data.results)) {
    for (const p of data.results) {
      if (p.width && p.height && p.width > p.height) {
        const ratio = p.width / p.height;
        if (ratio >= 1.2 && ratio <= 2.2 && p.width >= 1200) {
          const src = p.urls.raw ? `${p.urls.raw}&auto=format&fit=crop&w=1920&q=85` : (p.urls.regular || p.urls.full);
          const k = 'unsplash:' + p.id;
          if (!usedCanonicalKeys.has(k) && !usedUrls.has(src.split('?')[0].toLowerCase())) {
            results.push({
              src: src,
              canonicalKey: k,
              alt: p.alt_description || p.description || query,
              width: p.width,
              height: p.height,
              provider: 'Unsplash'
            });
          }
        }
      }
    }
  }
  return results;
}

async function searchWikimedia(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=12&prop=imageinfo&iiprop=url|size|mime&format=json`;
  const data = await fetchJson(url);
  const results = [];
  if (data && data.query && data.query.pages) {
    for (const page of Object.values(data.query.pages)) {
      const ii = page.imageinfo && page.imageinfo[0];
      if (ii && ii.url && (ii.mime === 'image/jpeg' || ii.mime === 'image/png' || ii.mime === 'image/webp')) {
        const title = page.title || '';
        if (!BAD_KEYWORDS.test(title) && !BAD_KEYWORDS.test(ii.url)) {
          const w = ii.width;
          const h = ii.height;
          if (w && h && w > h) {
            const ratio = w / h;
            if (ratio >= 1.2 && ratio <= 2.2 && w >= 1200) {
              const k = getCanonicalKey(ii.url);
              if (k && !usedCanonicalKeys.has(k) && !usedUrls.has(ii.url.split('?')[0].toLowerCase())) {
                const cleanAlt = title.replace(/^File:/i, '').replace(/[-_]/g, ' ').replace(/\.[a-zA-Z0-9]+$/, '');
                results.push({
                  src: ii.url,
                  canonicalKey: k,
                  alt: cleanAlt,
                  width: w,
                  height: h,
                  provider: 'Wikimedia'
                });
              }
            }
          }
        }
      }
    }
  }
  return results;
}

async function findBestReplacement(slot) {
  const item = slot.item;
  const placeName = (item.meta && item.meta.placeName) ? item.meta.placeName : '';
  const title = item.title || '';
  const state = item.state || '';
  const category = (item.meta && item.meta.category) || item.type || 'heritage';

  const queries = [];
  if (placeName && placeName !== title) {
    queries.push(`${placeName} ${state}`);
    queries.push(`${placeName} landscape`);
  }
  queries.push(`${title} ${state}`);
  queries.push(`${title} landscape`);
  queries.push(`${state} ${category} landscape India`);
  queries.push(`${state} India ancient architecture`);
  queries.push(`${state} nature landscape India`);

  for (const q of queries) {
    // 1. Try Pexels first (User requested non-Wikimedia)
    let candidates = await searchPexels(q);
    if (candidates.length > 0) return candidates[0];

    // 2. Try Pixabay next
    candidates = await searchPixabay(q);
    if (candidates.length > 0) return candidates[0];

    // 3. Try Unsplash next
    candidates = await searchUnsplash(q);
    if (candidates.length > 0) return candidates[0];

    // 4. Try Wikimedia Commons if needed
    candidates = await searchWikimedia(q);
    if (candidates.length > 0) return candidates[0];
  }

  return null;
}

// ─── 3. Main Execution ──────────────────────────────────────────────
async function main() {
  const slotsList = JSON.parse(fs.readFileSync(path.join(__dirname, 'slots_needing_replacement.json'), 'utf8'));
  console.log(`Starting replacement of ${slotsList.length} collision slots...`);

  const fileCache = new Map();
  function getDoc(filename) {
    if (!fileCache.has(filename)) {
      const full = path.join(DEST_DIR, filename);
      fileCache.set(filename, JSON.parse(fs.readFileSync(full, 'utf8')));
    }
    return fileCache.get(filename);
  }

  let replacedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < slotsList.length; i++) {
    const slot = slotsList[i];
    const item = slot.item;
    const doc = getDoc(item.file);
    const field = item.field;

    process.stdout.write(`[${i + 1}/${slotsList.length}] ${item.file} -> ${field}... `);

    const match = await findBestReplacement(slot);
    if (match) {
      // Register new unique key
      usedCanonicalKeys.add(match.canonicalKey);
      usedUrls.add(match.src.split('?')[0].toLowerCase());

      // Apply to doc
      if (field === 'heroImage') {
        doc.heroImage = { src: match.src, alt: match.alt };
        if (doc.gallery && doc.gallery[0]) {
          doc.gallery[0] = { src: match.src, alt: match.alt };
        }
      } else if (field.startsWith('gallery[')) {
        const idx = parseInt(field.match(/gallery\[(\d+)\]/)[1], 10);
        if (Array.isArray(doc.gallery) && doc.gallery[idx] !== undefined) {
          doc.gallery[idx] = { src: match.src, alt: match.alt };
        }
      } else if (field.includes('.image')) {
        const pIdx = parseInt(field.match(/place\[(\d+)\]/)[1], 10);
        if (doc.topPlaces && doc.topPlaces[pIdx]) {
          doc.topPlaces[pIdx].image = { src: match.src, alt: match.alt };
        }
      } else if (field.includes('.photo[')) {
        const pIdx = parseInt(field.match(/place\[(\d+)\]/)[1], 10);
        const phIdx = parseInt(field.match(/photo\[(\d+)\]/)[1], 10);
        if (doc.topPlaces && doc.topPlaces[pIdx] && Array.isArray(doc.topPlaces[pIdx].photos)) {
          doc.topPlaces[pIdx].photos[phIdx] = match.src;
        }
      }

      replacedCount++;
      console.log(`✅ [${match.provider}] ${match.width}x${match.height} (${match.canonicalKey})`);
    } else {
      skippedCount++;
      console.log(`⚠️ No match found`);
    }

    // Small delay between network queries
    await new Promise(r => setTimeout(r, 120));
  }

  // Save all modified documents
  console.log(`\nSaving ${fileCache.size} modified destination files...`);
  for (const [filename, doc] of fileCache.entries()) {
    if (doc.seo && doc.heroImage && doc.heroImage.src) {
      doc.seo.ogImage = doc.heroImage.src;
    }
    fs.writeFileSync(path.join(DEST_DIR, filename), JSON.stringify(doc, null, 2), 'utf8');
  }

  console.log(`\n=== MULTI-SOURCE REPLACEMENT COMPLETED ===`);
  console.log(`Total replaced: ${replacedCount}`);
  console.log(`Total skipped: ${skippedCount}`);
  console.log(`Total files modified: ${fileCache.size}`);
}

main();
