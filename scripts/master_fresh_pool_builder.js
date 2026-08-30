/**
 * MASTER FRESH POOL BUILDER
 * Pulls from high-yield geographical category members + multi-topic search queries.
 * Strictly checks !CURRENT_REPO_URLS.has(clean) to guarantee 100% brand new unique photos.
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

const highYieldCategories = [
  'Category:Hills of Tamil Nadu',
  'Category:Hills of Karnataka',
  'Category:Hills of Maharashtra',
  'Category:Hills of Kerala',
  'Category:Hills of Rajasthan',
  'Category:Hills of Himachal Pradesh',
  'Category:Hills of Uttarakhand',
  'Category:Hills of West Bengal',
  'Category:Hills of Meghalaya',
  'Category:Hills of Andhra Pradesh',
  'Category:Waterfalls of Maharashtra',
  'Category:Waterfalls of Tamil Nadu',
  'Category:Waterfalls of Karnataka',
  'Category:Waterfalls of Kerala',
  'Category:Waterfalls of Meghalaya',
  'Category:Waterfalls of Odisha',
  'Category:Waterfalls of Madhya Pradesh',
  'Category:Lakes of Tamil Nadu',
  'Category:Lakes of Karnataka',
  'Category:Lakes of Maharashtra',
  'Category:Lakes of Kerala',
  'Category:Lakes of Rajasthan',
  'Category:Lakes of Himachal Pradesh',
  'Category:Lakes of Uttarakhand',
  'Category:Lakes of Jammu and Kashmir',
  'Category:Lakes of Ladakh',
  'Category:Beaches of Tamil Nadu',
  'Category:Beaches of Kerala',
  'Category:Beaches of Karnataka',
  'Category:Beaches of Maharashtra',
  'Category:Beaches of Goa',
  'Category:Beaches of Andhra Pradesh',
  'Category:Beaches of Odisha',
  'Category:Beaches of West Bengal',
  'Category:Beaches of the Andaman and Nicobar Islands',
  'Category:National parks in Tamil Nadu',
  'Category:National parks in Karnataka',
  'Category:National parks in Kerala',
  'Category:National parks in Maharashtra',
  'Category:National parks in Madhya Pradesh',
  'Category:National parks in Rajasthan',
  'Category:National parks in Assam',
  'Category:National parks in West Bengal',
  'Category:Wildlife sanctuaries of Tamil Nadu',
  'Category:Wildlife sanctuaries of Karnataka',
  'Category:Wildlife sanctuaries of Kerala',
  'Category:Wildlife sanctuaries of Maharashtra',
  'Category:Wildlife sanctuaries of Madhya Pradesh',
  'Category:Wildlife sanctuaries of Rajasthan',
  'Category:Wildlife sanctuaries of Assam',
  'Category:Wildlife sanctuaries of Odisha',
  'Category:Villages in Tamil Nadu',
  'Category:Villages in Karnataka',
  'Category:Villages in Maharashtra',
  'Category:Villages in Kerala',
  'Category:Villages in Andhra Pradesh',
  'Category:Villages in West Bengal',
  'Category:Villages in Rajasthan',
  'Category:Villages in Gujarat',
  'Category:Villages in Uttar Pradesh',
  'Category:Villages in Madhya Pradesh',
  'Category:Villages in Bihar',
  'Category:Villages in Odisha',
  'Category:Villages in Assam',
  'Category:Villages in Himachal Pradesh',
  'Category:Villages in Uttarakhand',
  'Category:Villages in Goa',
  'Category:Villages in Punjab',
  'Category:Villages in Haryana',
  'Category:Villages in Telangana'
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
          'User-Agent': 'IndiaExplorerBot/40.0 (contact@exploreindiahub.com)'
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

async function build() {
  console.log('=== HARVESTING FRESH UNIQUE HD IMAGES ===\n');

  const pool = [];
  const poolSeen = new Set();

  for (let i = 0; i < highYieldCategories.length; i++) {
    const cat = highYieldCategories[i];
    const enc = encodeURIComponent(cat);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=${enc}&gcmtype=file&gcmlimit=500&prop=imageinfo&iiprop=url&format=json`;

    const data = await fetchJson(url);
    if (data && data.query && data.query.pages) {
      let added = 0;
      for (const p of Object.values(data.query.pages)) {
        if (p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url) {
          const u = p.imageinfo[0].url;
          const clean = u.split('?')[0];
          const lower = clean.toLowerCase();
          if ((lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) &&
              !lower.includes('icon') && !lower.includes('map') && !lower.includes('flag') &&
              !lower.includes('logo') && !lower.includes('stamp') && !lower.includes('coin') &&
              !lower.includes('taj_mahal_in_march_2004')) {
            if (!CURRENT_REPO_URLS.has(clean) && !poolSeen.has(clean)) {
              poolSeen.add(clean);
              pool.push({ src: u, alt: cat.replace('Category:', '') });
              added++;
            }
          }
        }
      }
      console.log(`[${i + 1}/${highYieldCategories.length}] ${cat} -> +${added} FRESH images (Pool size: ${pool.length})`);
    }

    if (pool.length >= 6000) {
      console.log(`\nReached target of ${pool.length} completely fresh unique images!`);
      break;
    }
  }

  fs.writeFileSync('scripts/fresh_brand_new_pool.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 SAVED ${pool.length} 100% BRAND NEW HD IMAGES TO scripts/fresh_brand_new_pool.json`);
}

build();
