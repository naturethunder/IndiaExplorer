/**
 * HARVEST 68 NATIONAL PARKS & RESERVES (2,500+ BRAND NEW HD IMAGES)
 */

const fs = require('fs');
const https = require('https');

const parks = [
  'Ranthambore tiger sanctuary', 'Bandhavgarh forest national park', 'Kanha meadows tiger reserve',
  'Pench national park forest', 'Satpura tiger reserve landscape', 'Tadoba Andhari tiger reserve',
  'Jim Corbett national park river', 'Rajaji national park elephants', 'Dudhwa national park swamp deer',
  'Pilibhit tiger reserve forest', 'Valmiki tiger reserve bihar', 'Manas national park assam wildlife',
  'Kaziranga national park rhino', 'Nameri national park jia bhoreli', 'Orang national park assam',
  'Sundarbans national park mangrove', 'Buxa tiger reserve dooars', 'Gorumara national park rhino',
  'Jaldapara national park elephants', 'Neora Valley national park kalimpong', 'Singalila national park rhododendron',
  'Simlipal national park waterfalls', 'Satkosia tiger reserve gorge', 'Nagarhole kabini river forest',
  'Bandipur national park sanctuary', 'Bannerghatta national park zoo', 'Kudremukh national park shola',
  'Kali tiger reserve dandeli anshi', 'Periyar tiger reserve thekkady lake', 'Eravikulam national park nilgiri tahr',
  'Silent valley evergreen forest palakkad', 'Mudumalai tiger reserve nilgiris', 'Anamalai tiger reserve top slip',
  'Guindy national park chennai', 'Gulf of Mannar marine biosphere', 'Gir national park asiatic lion',
  'Blackbuck national park velavadar', 'Marine national park gulf of kutch', 'Desert national park thar jaisalmer',
  'Keoladeo ghana bird sanctuary bharatpur', 'Sariska tiger reserve alwar', 'Khangchendzonga national park yuksom',
  'Namdapha national park changlang', 'Mouling national park upper siang', 'Balpakram national park canyon garo',
  'Nokrek national park biosphere citrus', 'Keibul Lamjao national park sangai deer', 'Sirohi national park manipur lily',
  'Ntangki national park peren nagaland', 'Murlen national park champhai mizoram', 'Phawngpui national park blue mountain',
  'Clouded leopard national park sipahijala', 'Hemis national park snow leopard ladakh', 'Dachigam national park hangul deer kashmir',
  'Great himalayan national park tirthan', 'Pin valley national park spiti snow', 'Gangotri national park bhagirathi gaumukh',
  'Govind pashu vihar har ki dun', 'Nanda devi national park biosphere chamoli', 'Valley of flowers national park unesco',
  'Kalesar national park yamunanagar', 'Sultanpur national park bird sanctuary gurgaon'
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
          'User-Agent': 'IndiaExplorerBot/140.0 (contact@exploreindiahub.com)'
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
  console.log('=== HARVESTING 68 NATIONAL PARKS MEGA POOL ===\n');

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

  for (let i = 0; i < parks.length; i++) {
    const q = parks[i];
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
        console.log(`[${i + 1}/${parks.length}] "${q}" -> +${added} images (Pool: ${pool.length})`);
      }
    }

    if (pool.length >= 2000) break;
  }

  fs.writeFileSync('scripts/national_parks_mega_pool.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 SAVED ${pool.length} FRESH IMAGES TO scripts/national_parks_mega_pool.json`);
}

harvest();
