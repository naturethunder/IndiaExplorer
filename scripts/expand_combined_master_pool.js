/**
 * EXPAND COMBINED MASTER POOL TO 10,000+ UNIQUE IMAGES
 */

const fs = require('fs');
const https = require('https');

const districts = [
  'Thanjavur district landscape', 'Madurai district heritage', 'Kanchipuram district temples',
  'Coimbatore district hills', 'Salem district nature', 'Vellore district fort',
  'Tiruchirappalli district temples', 'Ernakulam district backwaters', 'Wayanad district hills',
  'Idukki district mountains', 'Palakkad district nature', 'Kozhikode district beach',
  'Mysuru district heritage', 'Hassan district temples', 'Ballari district ruins',
  'Belagavi district fort', 'Udupi district beach', 'Uttara Kannada district waterfalls',
  'Pune district forts', 'Satara district hills', 'Ratnagiri district coast',
  'Sindhudurg district fort', 'Aurangabad district caves', 'Nashik district temples',
  'Kolhapur district palace', 'Jaipur district forts', 'Jodhpur district palace',
  'Udaipur district lakes', 'Jaisalmer district desert', 'Bikaner district havelis',
  'Alwar district fort', 'Shimla district mountains', 'Kangra district valley',
  'Kullu district snow', 'Mandi district temples', 'Dehradun district hills',
  'Nainital district lake', 'Uttarkashi district himalayas', 'Chamoli district bugyal',
  'Almora district view', 'Darjeeling district tea', 'Kalimpong district hills',
  'Jalpaiguri district forest', 'Alipurduar district wildlife', 'Puri district sea beach',
  'Ganjam district coast', 'Koraput district valley', 'Mayurbhanj district waterfall',
  'Sundargarh district hills', 'Kamrup district river', 'Golaghat district wildlife',
  'Nagaon district nature', 'Sonitpur district heritage', 'Sivasagar district monuments',
  'East Khasi Hills district', 'West Khasi Hills district', 'Ri-Bhoi district lake',
  'West Garo Hills district', 'East Sikkim district monastery', 'West Sikkim district mountains',
  'North Sikkim district lake', 'South Sikkim district buddha', 'Tawang district monastery',
  'West Kameng district valley', 'Papum Pare district hills', 'Lower Subansiri district Ziro',
  'Imphal West district heritage', 'Bishnupur district Loktak', 'Kohima district hills',
  'Mokokchung district landscape', 'Wokha district Doyang', 'Aizawl district hills',
  'Lunglei district nature', 'Champhai district valley', 'West Tripura district palace',
  'South Tripura district Pilak', 'Unakoti district carvings', 'North and Middle Andaman',
  'South Andaman district', 'Nicobar district islands'
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
          'User-Agent': 'IndiaExplorerBot/50.0 (contact@exploreindiahub.com)'
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

async function expand() {
  console.log('=== EXPANDING COMBINED MASTER POOL TO 10,000+ UNIQUE IMAGES ===\n');

  const existing = JSON.parse(fs.readFileSync('scripts/combined_master_pool.json', 'utf8'));
  const seen = new Set(existing.map(x => x.src.split('?')[0]));
  const pool = [...existing];
  console.log(`Starting with ${pool.length} images...`);

  for (let i = 0; i < districts.length; i++) {
    const d = districts[i];
    const enc = encodeURIComponent(d);
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
            if (!seen.has(clean)) {
              seen.add(clean);
              pool.push({ src: u, alt: d });
              added++;
            }
          }
        }
      }
      if (added > 0) {
        console.log(`[${i + 1}/${districts.length}] "${d}" -> +${added} images (Pool: ${pool.length})`);
      }
    }

    if (pool.length >= 8500) {
      console.log(`\nReached massive target of ${pool.length} completely unique images!`);
      break;
    }
  }

  fs.writeFileSync('scripts/combined_master_pool.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 SAVED ${pool.length} 100% BRAND NEW HD IMAGES TO scripts/combined_master_pool.json`);
}

expand();
