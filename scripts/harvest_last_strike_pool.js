/**
 * LAST STRIKE POOL (2,000+ FRESH UNUSED HD IMAGES)
 */

const fs = require('fs');
const https = require('https');

const queries = [
  'Indian traditional handicrafts wooden toys',
  'Indian silk sari weaving handloom',
  'Indian pottery clay earthenware terracotta',
  'Indian brass metal craft utensils',
  'Indian folk painting pattachitra madhubani',
  'Indian tribal jewelry silver ornaments',
  'Indian traditional puppet kathputli',
  'Indian classical music sitar veena tabla',
  'Indian heritage stepwell baoli adhyatmik',
  'Indian ancient cave paintings ajanta ellora',
  'Indian rock cut monument badami hampi',
  'Indian temple car procession rathotsavam',
  'Indian tea plantation mist morning',
  'Indian coffee blossom estates coorg',
  'Indian spice plantation cardamon cloves',
  'Indian backwaters houseboats sunset',
  'Indian mangrove forest creek sundarbans',
  'Indian coral reef marine national park',
  'Indian white desert salt rann kutch',
  'Indian sand dunes camel safari jaisalmer',
  'Indian snow mountains himalayas rohtang',
  'Indian frozen river zanskar valley',
  'Indian living root bridges meghalaya',
  'Indian waterfalls Western Ghats monsoon',
  'Indian pine forest cedar deodar shimla',
  'Indian alpine meadows bugyal uttarakhand',
  'Indian rhododendron flowers forest sikkim',
  'Indian bird sanctuary flamingos pelicans',
  'Indian national park deer swamp barasingha',
  'Indian wild elephants herd forest reserve',
  'Indian one horned rhinoceros grassland',
  'Indian royal bengal tiger grassland jungle',
  'Indian leopard rocky hills sanctuary',
  'Indian snow leopard spiti ladakh mountains',
  'Indian river dolphins ganga brahmaputra',
  'Indian river ghats evening lamps aarti',
  'Indian holy lake sarovar gurudwara',
  'Indian sacred pushkarini temple tank',
  'Indian ancient stone pillar inscriptions',
  'Indian historic gateway arched entrance'
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
          'User-Agent': 'IndiaExplorerBot/90.0 (contact@exploreindiahub.com)'
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
  console.log('=== HARVESTING LAST STRIKE POOL ===\n');

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

  const pool = [];
  const seen = new Set();

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const enc = encodeURIComponent(q);
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
            if (!current.has(clean) && !seen.has(clean)) {
              seen.add(clean);
              pool.push({ src: u, alt: q });
              added++;
            }
          }
        }
      }
      console.log(`[${i + 1}/${queries.length}] "${q}" -> +${added} images (Pool: ${pool.length})`);
    }

    if (pool.length >= 2000) break;
  }

  fs.writeFileSync('scripts/last_strike_pool.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 SAVED ${pool.length} FRESH IMAGES TO scripts/last_strike_pool.json`);
}

harvest();
