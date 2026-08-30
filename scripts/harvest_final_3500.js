/**
 * HARVEST FINAL 3,500 FRESH IMAGES
 * Harvests across 40 high-volume categorymembers.
 */

const fs = require('fs');
const https = require('https');

const categories = [
  'Category:Flora of India',
  'Category:Trees in India',
  'Category:Flowers of India',
  'Category:Birds of India',
  'Category:Butterflies of India',
  'Category:Animals of India',
  'Category:Mammals of India',
  'Category:Sunsets in India',
  'Category:Sunrises in India',
  'Category:Agriculture in India',
  'Category:Farms in India',
  'Category:Boats in India',
  'Category:Bridges in India',
  'Category:Railway stations in India',
  'Category:Trains in India',
  'Category:Roads in India',
  'Category:Festivals in India',
  'Category:Traditional architecture in India',
  'Category:Historic buildings in India',
  'Category:Palaces in Rajasthan',
  'Category:Forts in Maharashtra',
  'Category:Water bodies of India',
  'Category:Dams in India',
  'Category:Canals in India',
  'Category:Beaches of Goa',
  'Category:Beaches of Kerala',
  'Category:Beaches of Tamil Nadu',
  'Category:Beaches of Karnataka',
  'Category:Beaches of Maharashtra',
  'Category:Waterfalls of Kerala',
  'Category:Waterfalls of Karnataka',
  'Category:Waterfalls of Maharashtra',
  'Category:Waterfalls of Tamil Nadu',
  'Category:Waterfalls of Meghalaya',
  'Category:Lakes of Kerala',
  'Category:Lakes of Karnataka',
  'Category:Lakes of Maharashtra',
  'Category:Lakes of Tamil Nadu',
  'Category:Lakes of Rajasthan',
  'Category:Mountains of Himachal Pradesh'
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
          'User-Agent': 'IndiaExplorerBot/60.0 (contact@exploreindiahub.com)'
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
  console.log('=== HARVESTING FINAL 3,500 FRESH IMAGES ===\n');

  const DEST_DIR = 'data/destinations';
  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  const current = new Set();
  files.forEach(f => {
    try {
      const d = JSON.parse(fs.readFileSync(`${DEST_DIR}/${f}`, 'utf8'));
      if (Array.isArray(d.gallery)) d.gallery.forEach(g => { if (g && g.src) current.add(g.src.split('?')[0]); });
      if (Array.isArray(d.topPlaces)) d.topPlaces.forEach(p => {
        if (p.image && p.image.src) current.add(p.image.src.split('?')[0]);
        if (Array.isArray(p.photos)) p.photos.forEach(ph => { if (ph) current.add(ph.split('?')[0]); });
      });
    } catch (e) {}
  });

  const finalPool = [];
  const seen = new Set();

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
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
            if (!current.has(clean) && !seen.has(clean)) {
              seen.add(clean);
              finalPool.push({ src: u, alt: cat.replace('Category:', '') });
              added++;
            }
          }
        }
      }
      console.log(`[${i + 1}/${categories.length}] ${cat} -> +${added} images (Pool: ${finalPool.length})`);
    }

    if (finalPool.length >= 4000) break;
  }

  fs.writeFileSync('scripts/final_fresh_3500.json', JSON.stringify(finalPool, null, 2), 'utf8');
  console.log(`\n🎉 SAVED ${finalPool.length} 100% UNUSED HD IMAGES TO scripts/final_fresh_3500.json`);
}

harvest();
