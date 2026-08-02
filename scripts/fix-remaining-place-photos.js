const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const placeTermMap = {
  // Mandu
  'Rani Roopmati Pavilion & Sunset Point': 'Roopmati Pavilion',
  
  // Chembra Peak
  'Hradayathadakam (Natural Heart Lake)': 'Chembra Heart lake',
  'Chembra Peak Trailhead & Watchtower': 'Chembra Peak Wayanad',
  'Banantara Tea Estate & Factory': 'Wayanad tea estate',
  'Banasura Sagar Dam & Speedboating': 'Banasura Sagar Dam',
  'Meppadi Ridge Viewpoint': 'Meppadi Wayanad',

  // Chitrakote
  'Chitrakote Horseshoe Waterfall': 'Chitrakote falls',
  'Indravati River Boat Safari': 'Indravati river Chitrakote',
  'Tirathgarh Waterfalls (Kanger Valley)': 'Tirathgarh falls',
  'Kotumsar Cave & Blind Cavefish': 'Kotumsar cave',
  'Bastar Palace & Danteshwari Temple': 'Danteshwari temple Jagdalpur',

  // Shekhawati
  'Castle Mandawa Fort & Armor Museum': 'Castle Mandawa',
  'Murmuria & Jhunjhunwala Havelis': 'Mandawa haveli',
  'Nawalgarh Poddar Haveli Museum': 'Nawalgarh haveli',
  'Dundlod Fort & Marwari Horse Stables': 'Dundlod fort',
  'Churu Sethani Ka Johra Stepwell': 'Sethani ka Johra',

  // Zanskar
  'Phugtal Cave Monastery (Phuktal Gompa)': 'Phugtal monastery',
  'Drang Drung Glacier & Pensi La Pass': 'Drang Drung glacier',
  'Karsha Gompa Padum': 'Karsha monastery',
  'Sani Monastery & Ancient Stupa': 'Sani monastery',
  'Zangla Fort & Palace Ruins': 'Zangla fort',
  'Stongdey Monastery Cliff': 'Stongdey monastery',

  // Polo Forest
  'Sharaneshwar Shiva Temple Ruins': 'Sharaneshwar temple',
  'Harnav River Walk & Dam': 'Harnav river',
  'Idar Rock Formations & Fort': 'Idar fort',

  // Tranquebar
  'Zion Church & Danish Governor Bungalow': 'Zion Church Tranquebar',
  'Tranquebar Ozone Coast Walk & Gateway (Landporten)': 'Tranquebar Landporten',
  'Masilamani Nathar Temple': 'Masilamani temple Tranquebar',

  // Tamhini Ghat
  'Mulshi Dam Lake Backwaters': 'Mulshi dam',
  'Tamhini Cascading Waterfalls': 'Tamhini ghat',
  'Kolad White Water Rafting (Kundalika)': 'Kundalika river rafting',
  'Andharban Dark Forest Trek Trailhead': 'Andharban',
  'Devkund Plunge Pool Waterfall': 'Devkund waterfall',

  // Dhanaulti
  'Amber & Dhara Eco Parks': 'Dhanaulti eco park',
  'Surkanda Devi Temple & Cable Car': 'Surkanda Devi temple',
  'Tehri Dam Backwaters & Water Sports': 'Tehri dam',
  'Kodia Jungle Forest Trek': 'Kanatal jungle'
};

function buildWmQuery(searchTerm) {
  return 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(searchTerm) + '&gsrnamespace=6&gsrlimit=3' +
    '&prop=imageinfo&iiurlwidth=1280&iiprop=url&format=json';
}

function fetchWmImage(searchTerm) {
  return new Promise((resolve) => {
    const url = buildWmQuery(searchTerm);
    execFile('curl', ['-sS', '--max-time', '15',
      '-H', 'User-Agent: IndiaExplore/1.0 (educational travel app)',
      url], { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return resolve(null);
      try {
        const j = JSON.parse(stdout);
        const pages = (j.query && j.query.pages) || {};
        const urls = [];
        Object.values(pages).forEach(p => {
          const ii = p.imageinfo && p.imageinfo[0];
          const u = ii && (ii.thumburl || ii.url);
          if (u && /\.(jpg|jpeg|png)$/i.test(u) && u.includes('upload.wikimedia.org') && !u.toLowerCase().includes('logo') && !u.toLowerCase().includes('map')) {
            urls.push(u);
          }
        });
        resolve(urls.length > 0 ? urls[0] : null);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log(`Starting Pass 2 specific place photo fixes for ${Object.keys(placeTermMap).length} landmarks...`);
  
  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.join(DEST_DIR, file);
    const detail = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;

    if (detail.topPlaces && detail.topPlaces.length > 0) {
      for (const place of detail.topPlaces) {
        if (placeTermMap[place.name]) {
          const queryTerm = placeTermMap[place.name];
          const realUrl = await fetchWmImage(queryTerm);
          await sleep(650);

          if (realUrl) {
            place.image = { src: realUrl, alt: place.name };
            place.photos = [realUrl];
            modified = true;
            fixedCount++;
            console.log(`  ✓ Fixed [${place.name}] -> ${realUrl}`);
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(detail, null, 2), 'utf8');
    }
  }

  console.log(`\nPass 2 Complete! Fixed ${fixedCount} specific landmark photos with real Wikimedia files.`);
}

run();
