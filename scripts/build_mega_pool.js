/**
 * MEGA POOL BUILDER (15,000+ UNIQUE WIKIMEDIA COMMONS HD IMAGES)
 */

const fs = require('fs');
const https = require('https');

const categories = [
  'Category:Hindu temples in India',
  'Category:Hindu temples in Tamil Nadu',
  'Category:Hindu temples in Karnataka',
  'Category:Hindu temples in Andhra Pradesh',
  'Category:Hindu temples in Kerala',
  'Category:Hindu temples in Maharashtra',
  'Category:Hindu temples in West Bengal',
  'Category:Hindu temples in Odisha',
  'Category:Hindu temples in Madhya Pradesh',
  'Category:Hindu temples in Uttar Pradesh',
  'Category:Hindu temples in Gujarat',
  'Category:Hindu temples in Rajasthan',
  'Category:Hindu temples in Himachal Pradesh',
  'Category:Hindu temples in Uttarakhand',
  'Category:Hindu temples in Assam',
  'Category:Hindu temples in Bihar',
  'Category:Hindu temples in Telangana',
  'Category:Hindu temples in Goa',
  'Category:Hindu temples in Jammu and Kashmir',
  'Category:Hindu temples in Delhi',
  'Category:Forts in India',
  'Category:Forts in Maharashtra',
  'Category:Forts in Rajasthan',
  'Category:Forts in Madhya Pradesh',
  'Category:Forts in Karnataka',
  'Category:Forts in Tamil Nadu',
  'Category:Forts in Kerala',
  'Category:Forts in Andhra Pradesh',
  'Category:Forts in Telangana',
  'Category:Palaces in India',
  'Category:Palaces in Rajasthan',
  'Category:Palaces in Karnataka',
  'Category:Palaces in Madhya Pradesh',
  'Category:Palaces in Kerala',
  'Category:National parks of India',
  'Category:Wildlife sanctuaries in India',
  'Category:Lakes of India',
  'Category:Waterfalls of India',
  'Category:Mountains of India',
  'Category:Himalayas',
  'Category:Western Ghats',
  'Category:Eastern Ghats',
  'Category:Rivers of India',
  'Category:Ghats of India',
  'Category:Beaches of India',
  'Category:Gardens in India',
  'Category:Forests of India',
  'Category:Caves of India',
  'Category:Stepwells in India',
  'Category:Monasteries in Ladakh',
  'Category:Monasteries in Sikkim',
  'Category:Monasteries in Himachal Pradesh',
  'Category:Churches in Goa',
  'Category:Churches in Kerala',
  'Category:Churches in Tamil Nadu',
  'Category:Mosques in India',
  'Category:Archaeological sites in India',
  'Category:Monuments in India',
  'Category:World Heritage Sites in India',
  'Category:Tourism in India'
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
    }, 6000);

    try {
      req = https.get(url, {
        headers: {
          'User-Agent': 'IndiaExplorerBot/25.0 (contact@exploreindiahub.com)'
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

async function buildMegaPool() {
  console.log('=== BUILDING MEGA IMAGE POOL (TARGET: 15,000+ UNIQUE IMAGES) ===\n');

  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync('scripts/wiki_pool_5000.json', 'utf8'));
  } catch (e) {}

  const seen = new Set(existing.map(x => x.src.split('?')[0]));
  const pool = [...existing];
  console.log(`Starting with ${pool.length} existing unique images...`);

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
            if (!seen.has(clean)) {
              seen.add(clean);
              pool.push({ src: u, alt: cat.replace('Category:', '') });
              added++;
            }
          }
        }
      }
      console.log(`[${i + 1}/${categories.length}] ${cat} -> +${added} images (Pool: ${pool.length})`);
    }
  }

  fs.writeFileSync('scripts/mega_wiki_pool.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 MEGA POOL READY! Saved ${pool.length} completely unique HD images to scripts/mega_wiki_pool.json`);
}

buildMegaPool();
