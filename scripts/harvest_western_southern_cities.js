/**
 * HARVEST WESTERN & SOUTHERN CITIES (1,500+ BRAND NEW HD IMAGES)
 */

const fs = require('fs');
const https = require('https');

const spots = [
  'Kumbakonam Tamil Nadu temple', 'Thanjavur Tamil Nadu heritage', 'Madurai Tamil Nadu meenakshi',
  'Tirunelveli Tamil Nadu nellaiappar', 'Rameswaram Tamil Nadu ramanathaswamy', 'Kanyakumari Tamil Nadu sunrise',
  'Trivandrum Kerala padmanabhaswamy', 'Kollam Kerala ashtamudi lake', 'Alappuzha Kerala houseboats backwaters',
  'Kottayam Kerala rubber plantation', 'Thrissur Kerala vadakkunnathan', 'Palakkad Kerala silent valley',
  'Kozhikode Kerala kappad beach', 'Kannur Kerala st angelo fort', 'Kasaragod Kerala bekal fort',
  'Mangalore Karnataka panambur beach', 'Udupi Karnataka st marys island', 'Murudeshwar Karnataka shiva statue',
  'Gokarna Karnataka om beach', 'Karwar Karnataka devbagh beach', 'Ratnagiri Maharashtra ganpatipule',
  'Sindhudurg Maharashtra fort sea', 'Alibaug Maharashtra kolaba fort', 'Lonavala Maharashtra bhushi dam',
  'Khandala Maharashtra tiger leap', 'Mahabaleshwar Maharashtra venna lake', 'Panchgani Maharashtra table land',
  'Matheran Maharashtra toy train', 'Igatpuri Maharashtra vipassana', 'Bhandardara Maharashtra arthur lake',
  'Lavasa Maharashtra waterfront', 'Silvassa Dadra Nagar Haveli gardens', 'Daman Moti Daman fort beach',
  'Diu Nagoa beach fort', 'Somnath Gujarat jyotirlinga temple', 'Dwarka Gujarat dwarkadhish temple',
  'Porbandar Gujarat kirti mandir', 'Gir Gujarat Asiatic lion forest', 'Palitana Gujarat shatrunjaya hills',
  'Mandvi Gujarat vijay vilas palace beach', 'Saputara Gujarat sunrise hill station'
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
          'User-Agent': 'IndiaExplorerBot/120.0 (contact@exploreindiahub.com)'
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
  console.log('=== HARVESTING WESTERN & SOUTHERN CITIES ===\n');

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

  for (let i = 0; i < spots.length; i++) {
    const q = spots[i];
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
        console.log(`[${i + 1}/${spots.length}] "${q}" -> +${added} images (Pool: ${pool.length})`);
      }
    }

    if (pool.length >= 1500) break;
  }

  fs.writeFileSync('scripts/western_southern_pool.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 SAVED ${pool.length} FRESH IMAGES TO scripts/western_southern_pool.json`);
}

harvest();
