/**
 * HARVEST 5,000+ UNIQUE HD IMAGES VIA WIKIMEDIA CATEGORYMEMBERS
 * Uses generator=categorymembers to pull 500 unique images per category in a single request.
 */

const fs = require('fs');
const https = require('https');

const categories = [
  'Category:Monuments and memorials in India',
  'Category:Hindu temples in India',
  'Category:Forts in India',
  'Category:Palaces in India',
  'Category:National parks of India',
  'Category:Lakes of India',
  'Category:Waterfalls of India',
  'Category:Mountains of India',
  'Category:Beaches of India',
  'Category:Churches in India',
  'Category:Gardens in India',
  'Category:Forests of India',
  'Category:Rivers of India',
  'Category:Valleys of India',
  'Category:Hill stations in India',
  'Category:Caves of India',
  'Category:Stepwells in India',
  'Category:Wildlife sanctuaries in India',
  'Category:Nature of India',
  'Category:Architecture of India'
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
          'User-Agent': 'IndiaExplorerBot/20.0 (contact@exploreindiahub.com)'
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
        res.on('error', () => {
          if (!resolved) {
            clearTimeout(timer);
            resolved = true;
            resolve(null);
          }
        });
      });
      req.on('error', () => { if (!resolved) { clearTimeout(timer); resolved = true; resolve(null); } });
    } catch (e) {
      if (!resolved) { clearTimeout(timer); resolved = true; resolve(null); }
    }
  });
}

async function harvest() {
  console.log('=== HARVESTING 5,000+ UNIQUE IMAGES VIA CATEGORYMEMBERS ===\n');

  const pool = [];
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
            if (!seen.has(clean)) {
              seen.add(clean);
              pool.push({ src: u, alt: cat.replace('Category:', '') });
              added++;
            }
          }
        }
      }
      console.log(`[${i + 1}/${categories.length}] ${cat} -> Added ${added} unique images (Total pool: ${pool.length})`);
    } else {
      console.log(`[${i + 1}/${categories.length}] ${cat} -> No direct files, trying search query...`);
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cat.replace('Category:', ''))}&gsrnamespace=6&gsrlimit=200&prop=imageinfo&iiprop=url&format=json`;
      const searchData = await fetchJson(searchUrl);
      if (searchData && searchData.query && searchData.query.pages) {
        let added = 0;
        for (const p of Object.values(searchData.query.pages)) {
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
        console.log(`[${i + 1}/${categories.length}] ${cat} (Search) -> Added ${added} unique images (Total pool: ${pool.length})`);
      }
    }
  }

  fs.writeFileSync('scripts/wiki_pool_5000.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 HARVEST COMPLETE! Saved ${pool.length} completely unique HD images to scripts/wiki_pool_5000.json`);
}

harvest();
