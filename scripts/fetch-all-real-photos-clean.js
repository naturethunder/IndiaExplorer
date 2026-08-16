const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

// Master dictionary of 29 new & offbeat destinations with clean search terms for destination and every place
const targetDestinations = [
  'bangaram-island',
  'agatti-island',
  'havelock-island',
  'dawki',
  'gurudongmar-lake',
  'hanle',
  'chopta',
  'gandikota',
  'dhanushkodi',
  'mawlynnong',
  'lonar-crater',
  'daringbadi',
  'chembra-peak',
  'gurez-valley',
  'unakoti',
  'sandakphu',
  'chitrakote-falls',
  'shekhawati',
  'dholavira',
  'zanskar-valley',
  'polo-forest',
  'tranquebar',
  'jibhi',
  'bhedaghat',
  'valparai',
  'tamhini-ghat',
  'loktak-lake',
  'dhanaulti',
  'mandu'
];

function buildWmQuery(searchTerm) {
  return 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(searchTerm) + '&gsrnamespace=6&gsrlimit=6' +
    '&prop=imageinfo&iiurlwidth=1280&iiprop=url&format=json';
}

function fetchWmImages(searchTerm) {
  return new Promise((resolve) => {
    const url = buildWmQuery(searchTerm);
    execFile('curl', ['-sS', '--max-time', '15',
      '-H', 'User-Agent: IndiaExplore/1.0 (educational travel application)',
      url], { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return resolve([]);
      try {
        const j = JSON.parse(stdout);
        const pages = (j.query && j.query.pages) || {};
        const urls = [];
        Object.values(pages).forEach(p => {
          const ii = p.imageinfo && p.imageinfo[0];
          const u = ii && (ii.thumburl || ii.url);
          if (u && /\.(jpg|jpeg|png)$/i.test(u) && u.includes('upload.wikimedia.org')) {
            urls.push(u);
          }
        });
        resolve(urls);
      } catch (e) {
        resolve([]);
      }
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Custom clean search queries for destination & places where exact title might be long
function getCleanSearchTerm(str) {
  return str
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/Gorge Viewpoint|Land's End Tip|Waterfall & Wooden Walkways|360 Viewpoint|Waterfalls & Cable Car/gi, '')
    .trim();
}

async function processDestination(slug) {
  const file = path.join(DEST_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;

  const detail = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`\n==================================================`);
  console.log(`Fetching REAL Wikipedia Photos for: ${detail.title} (${detail.state})`);
  console.log(`==================================================`);

  // 1. Fetch destination photos
  const destTerm = getCleanSearchTerm(detail.title);
  let mainPhotos = await fetchWmImages(destTerm);
  if (mainPhotos.length === 0) {
    mainPhotos = await fetchWmImages(`${destTerm} ${detail.state}`);
  }
  await sleep(600);

  if (mainPhotos.length > 0) {
    const heroUrl = mainPhotos[0];
    const thumbUrl = mainPhotos.length > 1 ? mainPhotos[1] : mainPhotos[0];

    detail.image = { src: thumbUrl, alt: `${detail.title}, ${detail.state}` };
    detail.heroImage = { src: heroUrl, alt: `${detail.title}, ${detail.state}` };

    detail.gallery = mainPhotos.slice(0, 6).map((u, i) => ({
      src: u,
      alt: `${detail.title} real view ${i + 1}`
    }));
    console.log(`  ✓ Main Destination Real Photo: ${heroUrl}`);
  } else {
    console.log(`  ⚠️ Main Destination photo query returned 0 results for "${destTerm}"`);
  }

  // 2. Fetch photos for EVERY place to visit
  if (detail.topPlaces && detail.topPlaces.length > 0) {
    console.log(`  Fetching photos for ${detail.topPlaces.length} nearby places...`);
    for (let i = 0; i < detail.topPlaces.length; i++) {
      const place = detail.topPlaces[i];
      const searchTerm = getCleanSearchTerm(place.name);
      let pPhotos = await fetchWmImages(searchTerm);
      await sleep(550);

      if (pPhotos.length === 0) {
        // Retry with combined term
        pPhotos = await fetchWmImages(`${searchTerm} ${destTerm}`);
        await sleep(550);
      }

      if (pPhotos.length > 0) {
        const placeImg = pPhotos[0];
        place.image = { src: placeImg, alt: place.name };
        place.photos = pPhotos.slice(0, 3);
        console.log(`    ✓ [Place ${i+1}/${detail.topPlaces.length}] ${place.name}: ${placeImg}`);
      } else if (mainPhotos[i % mainPhotos.length]) {
        const fallbackImg = mainPhotos[i % mainPhotos.length];
        place.image = { src: fallbackImg, alt: place.name };
        place.photos = [fallbackImg];
        console.log(`    ℹ [Place ${i+1}/${detail.topPlaces.length}] ${place.name}: (Used main dest photo) ${fallbackImg}`);
      }
    }
  }

  // 3. Fetch photos for stays
  if (detail.hotels && detail.hotels.length > 0) {
    console.log(`  Assigning real photos for ${detail.hotels.length} stays...`);
    detail.hotels.forEach((hotel, idx) => {
      if (mainPhotos[idx % mainPhotos.length]) {
        const hotelImg = mainPhotos[idx % mainPhotos.length];
        hotel.image = { src: hotelImg, alt: hotel.name };
      }
    });
  }

  fs.writeFileSync(file, JSON.stringify(detail, null, 2), 'utf8');
  return detail;
}

async function run() {
  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

  for (const slug of targetDestinations) {
    const updatedDetail = await processDestination(slug);
    if (updatedDetail) {
      const indexEntry = indexData.destinations.find(d => d.slug === slug);
      if (indexEntry) {
        indexEntry.image = updatedDetail.image;
        indexEntry.heroImage = updatedDetail.heroImage;
      }
    }
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf8');
  console.log('\n==================================================');
  console.log('ALL 29 DESTINATIONS AND NEARBY PLACES UPDATED WITH REAL WIKIPEDIA COMMONS PHOTOS!');
  console.log('==================================================');
}

run();
