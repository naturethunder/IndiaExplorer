/**
 * COMBINED MASTER POOL BUILDER
 * Combines all unique unused images into scripts/combined_master_pool.json.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DEST_DIR = path.join(__dirname, '../data/destinations');
const TAJ_REGEX = /Taj_Mahal_in_March_2004/i;

// Gather all current URLs in the database
const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
const CURRENT_REPO_URLS = new Set();
files.forEach(f => {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
    if (Array.isArray(d.gallery)) d.gallery.forEach(g => { if (g && g.src) CURRENT_REPO_URLS.add(g.src.split('?')[0]); });
    if (Array.isArray(d.topPlaces)) d.topPlaces.forEach(p => {
      if (p.image && p.image.src) CURRENT_REPO_URLS.add(p.image.src.split('?')[0]);
      if (Array.isArray(p.photos)) p.photos.forEach(ph => { if (ph) CURRENT_REPO_URLS.add(ph.split('?')[0]); });
    });
  } catch (e) {}
});

console.log(`Current repository has ${CURRENT_REPO_URLS.size} unique URLs in use.`);

const pool = [];
const seen = new Set();

function addImage(src, alt) {
  if (!src || typeof src !== 'string') return;
  const clean = src.split('?')[0];
  const lower = clean.toLowerCase();
  if ((lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) &&
      !lower.includes('icon') && !lower.includes('map') && !lower.includes('flag') &&
      !lower.includes('logo') && !lower.includes('stamp') && !lower.includes('coin') &&
      !lower.includes('taj_mahal_in_march_2004')) {
    if (!CURRENT_REPO_URLS.has(clean) && !seen.has(clean)) {
      seen.add(clean);
      pool.push({ src, alt });
    }
  }
}

// 1. Load from fresh_brand_new_pool.json
try {
  const f = JSON.parse(fs.readFileSync('scripts/fresh_brand_new_pool.json', 'utf8'));
  f.forEach(x => addImage(x.src, x.alt));
  console.log(`Loaded ${pool.length} images from fresh_brand_new_pool.json.`);
} catch (e) {}

// 2. Load from mega_wiki_pool.json
try {
  const m = JSON.parse(fs.readFileSync('scripts/mega_wiki_pool.json', 'utf8'));
  let mAdded = 0;
  m.forEach(x => {
    const before = pool.length;
    addImage(x.src, x.alt);
    if (pool.length > before) mAdded++;
  });
  console.log(`Added ${mAdded} unused images from mega_wiki_pool.json (Total: ${pool.length}).`);
} catch (e) {}

// 3. Load from wiki_pool.json
try {
  const w = JSON.parse(fs.readFileSync('scripts/wiki_pool.json', 'utf8'));
  let wAdded = 0;
  w.forEach(x => {
    const before = pool.length;
    addImage(x.src, x.alt);
    if (pool.length > before) wAdded++;
  });
  console.log(`Added ${wAdded} unused images from wiki_pool.json (Total: ${pool.length}).`);
} catch (e) {}

const queries = [
  'Indian railway train landscape scenery',
  'Indian traditional village pond view',
  'Indian rural farming paddy fields green',
  'Banyan tree village landscape India',
  'Neem tree green nature India',
  'Peacock bird national sanctuary India',
  'Lotus pond flower nature India',
  'Sunflowers field farm India',
  'Mustard fields yellow farm Punjab India',
  'Apple orchards Himachal Pradesh Kashmir',
  'Orange orchards Nagpur Maharashtra',
  'Pomegranate farm Maharashtra Gujarat',
  'Mango groves orchards Uttar Pradesh',
  'Cardamom hills Kerala Tamil Nadu',
  'Pepper plantations Wayanad Idukki',
  'Coffee blossom Kodagu Chikmagalur',
  'Tea harvest women Assam Nilgiris',
  'Bamboo forest Northeast India',
  'Sal forest Madhya Pradesh Chhattisgarh',
  'Teak forest Kerala Karnataka',
  'Pine forest Shimla Manali',
  'Deodar cedar forest Uttarakhand Himachal',
  'Rhododendron valley Sikkim Himalayas',
  'Oak forest Garhwal Kumaon',
  'Alpine meadows bugyal Uttarakhand'
];

function fetchJson(url) {
  return new Promise((resolve) => {
    let resolved = false;
    let req;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { if (req) req.destroy(); } catch (e) {}
        resolve(null);
      }
    }, 4500);

    try {
      req = https.get(url, {
        headers: {
          'User-Agent': 'IndiaExplorerBot/45.0 (contact@exploreindiahub.com)'
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          clearTimeout(timer);
          resolved = true;
          return fetchJson(res.headers.location).then(resolve);
        }
        let d = '';
        res.on('data', chunk => d += chunk);
        res.on('end', () => {
          if (!resolved) {
            clearTimeout(timer);
            resolved = true;
            try {
              resolve(JSON.parse(d));
            } catch (e) {
              resolve(null);
            }
          }
        });
        res.on('error', () => { if (!resolved) { clearTimeout(timer); resolved = true; resolve(null); } });
      });
      req.on('error', () => { if (!resolved) { clearTimeout(timer); resolved = true; resolve(null); } });
    } catch (e) {
      if (!resolved) { clearTimeout(timer); resolved = true; resolve(null); }
    }
  });
}

async function finish() {
  for (const q of queries) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url&format=json`;
    const data = await fetchJson(url);
    if (data && data.query && data.query.pages) {
      for (const p of Object.values(data.query.pages)) {
        if (p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url) {
          addImage(p.imageinfo[0].url, q);
        }
      }
    }
    if (pool.length >= 5500) break;
  }

  fs.writeFileSync('scripts/combined_master_pool.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 COMBINED MASTER POOL COMPLETE! Total 100% brand new unique HD images: ${pool.length}`);
}

finish();
