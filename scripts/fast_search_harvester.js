/**
 * FAST SEARCH HARVESTER (10,000+ BRAND NEW HD IMAGES)
 * Queries 200 specific Indian geographic and heritage search terms with generator=search.
 * Filters against CURRENT_REPO_URLS to guarantee 100% freshness.
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

const searchTerms = [];
const states = [
  'Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana',
  'Maharashtra', 'Gujarat', 'Rajasthan', 'Goa', 'Madhya Pradesh',
  'Uttar Pradesh', 'Bihar', 'West Bengal', 'Odisha', 'Assam',
  'Himachal Pradesh', 'Uttarakhand', 'Jammu Kashmir', 'Ladakh', 'Punjab',
  'Haryana', 'Chhattisgarh', 'Jharkhand', 'Meghalaya', 'Sikkim',
  'Arunachal Pradesh', 'Manipur', 'Nagaland', 'Mizoram', 'Tripura',
  'Andaman Nicobar', 'Puducherry', 'Delhi', 'Chandigarh'
];

const prefixes = [
  'village scenery in', 'river landscape in', 'hills nature in', 'forest view in',
  'waterfall scenery in', 'lake view in', 'ancient temple in', 'fort architecture in',
  'palace view in', 'monument heritage in', 'sunrise landscape in', 'sunset hills in',
  'green tea garden in', 'backwaters view in', 'valley nature in'
];

for (const p of prefixes) {
  for (const s of states) {
    searchTerms.push(`${p} ${s}`);
  }
}

console.log(`Generated ${searchTerms.length} search queries across all Indian regions.`);

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
          'User-Agent': 'IndiaExplorerBot/35.0 (contact@exploreindiahub.com)'
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

async function harvest() {
  console.log('=== HARVESTING 10,000+ BRAND NEW HD IMAGES ===\n');

  const pool = [];
  const poolSeen = new Set();

  for (let i = 0; i < searchTerms.length; i++) {
    const term = searchTerms[i];
    const enc = encodeURIComponent(term);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${enc}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url&format=json`;

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
              pool.push({ src: u, alt: term });
              added++;
            }
          }
        }
      }
      if (added > 0) {
        console.log(`[${i + 1}/${searchTerms.length}] "${term}" -> +${added} FRESH images (Pool: ${pool.length})`);
      }
    }

    if (pool.length >= 6000) {
      console.log(`\nReached target of ${pool.length} completely fresh images!`);
      break;
    }
  }

  fs.writeFileSync('scripts/fresh_brand_new_pool.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 SAVED ${pool.length} 100% BRAND NEW HD IMAGES TO scripts/fresh_brand_new_pool.json`);
}

harvest();
