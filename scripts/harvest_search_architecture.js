/**
 * HARVEST SEARCH ARCHITECTURE (400+ FRESH UNUSED HD IMAGES)
 */

const fs = require('fs');
const https = require('https');

const queries = [
  'haveli courtyard rajasthan fresco', 'stepwell baoli step gujarat', 'temple gopuram tamil nadu sculpture',
  'temple vimana stone karnataka', 'church basilica goa architecture', 'mosque minaret architecture india',
  'gurudwara sarovar marble punjab', 'jain temple marble carving gujarat', 'buddhist monastery cliff ladakh',
  'fort ramparts view maharashtra', 'palace durbar hall rajasthan', 'wooden carvings temple himachal',
  'rock cut cave carving elura', 'chariot temple wheel hampi', 'buddhist stupa dome sanchi',
  'tea garden morning hills munnar', 'coffee estate plantation coorg', 'backwaters palm trees kerala',
  'mangrove delta sundarbans', 'salt desert white rann kutch', 'sand dunes sunset thar jaisalmer',
  'snow mountain peak himalayas manali', 'frozen lake zanskar ladakh', 'living root bridge cherrapunji',
  'waterfall scenic western ghats', 'evergreen forest shola nilgiris'
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
          'User-Agent': 'IndiaExplorerBot/190.0 (contact@exploreindiahub.com)'
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
  console.log('=== HARVESTING SEARCH ARCHITECTURE ===\n');

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
      if (added > 0) {
        console.log(`[${i + 1}/${queries.length}] "${q}" -> +${added} images (Pool: ${pool.length})`);
      }
    }

    if (pool.length >= 400) break;
  }

  fs.writeFileSync('scripts/architecture_search_pool.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 SAVED ${pool.length} FRESH IMAGES TO scripts/architecture_search_pool.json`);
}

harvest();
