/**
 * HARVEST CITY MEGA POOL (3,000+ BRAND NEW HD IMAGES)
 */

const fs = require('fs');
const https = require('https');

const cities = [
  'Ajmer Rajasthan architecture', 'Aligarh Uttar Pradesh monument', 'Amravati Maharashtra scenery',
  'Amritsar Punjab heritage', 'Anand Gujarat landscape', 'Anantapur Andhra Pradesh hills',
  'Asansol West Bengal scenery', 'Aurangabad Maharashtra monuments', 'Ayodhya Uttar Pradesh heritage',
  'Balasore Odisha coast', 'Bardhaman West Bengal temple', 'Bareilly Uttar Pradesh heritage',
  'Baripada Odisha palace', 'Barmer Rajasthan desert', 'Belgaum Karnataka fort',
  'Bellary Karnataka rock fort', 'Bettiah Bihar heritage', 'Bhadrak Odisha temple',
  'Bhagalpur Bihar silk', 'Bharatpur Rajasthan birds', 'Bhavnagar Gujarat palace',
  'Bhilai Chhattisgarh park', 'Bhilwara Rajasthan temples', 'Bhimavaram Andhra Pradesh nature',
  'Bhiwandi Maharashtra landscape', 'Bhiwani Haryana temples', 'Bhopal Madhya Pradesh lakes',
  'Bhubaneswar Odisha temples', 'Bhuj Gujarat heritage', 'Bhusawal Maharashtra river',
  'Bidar Karnataka fort', 'Bijapur Karnataka gol gumbaz', 'Bikaner Rajasthan havelis',
  'Bilaspur Chhattisgarh river', 'Bokaro Jharkhand hills', 'Bundi Rajasthan fort stepwell',
  'Burhanpur Madhya Pradesh shahi qila', 'Chandigarh architecture garden', 'Chandrapur Maharashtra forest',
  'Chhatarpur Madhya Pradesh temples', 'Chhindwara Madhya Pradesh hills', 'Chikmagalur Karnataka coffee',
  'Chitradurga Karnataka fort stone', 'Chittorgarh Rajasthan fort tower', 'Churu Rajasthan haveli fresco',
  'Coimbatore Tamil Nadu nature', 'Cooch Behar West Bengal palace', 'Cuddalore Tamil Nadu coast',
  'Cuttack Odisha barabati fort', 'Darbhanga Bihar palace raj', 'Darjeeling West Bengal tea hills',
  'Davangere Karnataka heritage', 'Dehradun Uttarakhand valley', 'Deoghar Jharkhand baidyanath',
  'Dewas Madhya Pradesh hill', 'Dhanbad Jharkhand lake', 'Dharmavaram Andhra Pradesh silk',
  'Dhule Maharashtra landscape', 'Dibrugarh Assam tea river', 'Dimapur Nagaland ruins',
  'Dindigul Tamil Nadu rock fort', 'Durgapur West Bengal barrage', 'Eluru Andhra Pradesh lake',
  'Erode Tamil Nadu river', 'Etawah Uttar Pradesh safari', 'Faridabad Haryana lake',
  'Fatehpur Uttar Pradesh monument', 'Firozabad Uttar Pradesh craft', 'Gandhinagar Gujarat akshardham',
  'Gaya Bihar bodhgaya heritage', 'Giridih Jharkhand parasnath', 'Gonda Uttar Pradesh landscape',
  'Gorakhpur Uttar Pradesh temple', 'Guntakal Andhra Pradesh railway', 'Guntur Andhra Pradesh hills',
  'Gurgaon Haryana architecture', 'Guwahati Assam brahmaputra', 'Gwalior Madhya Pradesh fort palace',
  'Hajipur Bihar banana river', 'Haldwani Uttarakhand hills', 'Haridwar Uttarakhand ganga ghat',
  'Hassan Karnataka belur halebidu', 'Hazaribagh Jharkhand national park', 'Hisar Haryana firoz shah fort',
  'Hoshangabad Madhya Pradesh narmada', 'Hoshiarpur Punjab hills', 'Hospet Karnataka hampi ruins',
  'Hubli Karnataka unkal lake', 'Hyderabad Telangana charminar golconda', 'Ichalkaranji Maharashtra textiles',
  'Imphal Manipur kangla loktak', 'Indore Madhya Pradesh rajwada', 'Itanagar Arunachal Pradesh monastery',
  'Jabalpur Madhya Pradesh marble rocks', 'Jagdalpur Chhattisgarh bastar waterfall', 'Jaipur Rajasthan hawa mahal',
  'Jaisalmer Rajasthan golden fort', 'Jalandhar Punjab heritage', 'Jalgaon Maharashtra ajanta route',
  'Jalna Maharashtra fort', 'Jalpaiguri West Bengal tea dooars', 'Jammu J&K bahu fort',
  'Jamnagar Gujarat marine park', 'Jamshedpur Jharkhand dalma hills', 'Jaunpur Uttar Pradesh shahi bridge',
  'Jhansi Uttar Pradesh fort rani', 'Jhunjhunu Rajasthan havelis', 'Jodhpur Rajasthan mehrangarh fort',
  'Jorhat Assam majuli island', 'Junagadh Gujarat uparkot fort girnar'
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
          'User-Agent': 'IndiaExplorerBot/110.0 (contact@exploreindiahub.com)'
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
  console.log('=== HARVESTING CITY MEGA POOL ===\n');

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

  for (let i = 0; i < cities.length; i++) {
    const q = cities[i];
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
        console.log(`[${i + 1}/${cities.length}] "${q}" -> +${added} images (Pool: ${pool.length})`);
      }
    }

    if (pool.length >= 2500) break;
  }

  fs.writeFileSync('scripts/city_mega_pool.json', JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 SAVED ${pool.length} FRESH IMAGES TO scripts/city_mega_pool.json`);
}

harvest();
