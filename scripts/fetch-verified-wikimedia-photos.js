const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const targetSlugs = [
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

function fetchWmImage(searchTerm) {
  return new Promise((resolve) => {
    const url = buildWmQuery(searchTerm);
    execFile('curl', ['-sS', '--max-time', '15',
      '-H', 'User-Agent: IndiaExplore/1.0 (educational travel app; contact@indiaexplore.example)',
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
        resolve(urls.length > 0 ? urls : null);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function cleanSearchTerm(name) {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/Viewpoint|Park & Butterfly Garden|Waterfalls & Cable Car|Horseshoe Waterfall|360 Viewpoint|Observation Tower|& Water Sports|& Marble Rocks/gi, '')
    .trim();
}

async function run() {
  console.log(`Starting precision Wikimedia photo mapping for ${targetSlugs.length} destinations...`);
  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

  for (const slug of targetSlugs) {
    const file = path.join(DEST_DIR, `${slug}.json`);
    if (!fs.existsSync(file)) continue;

    const detail = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`\n==================================================`);
    console.log(`Processing Destination: ${detail.title}`);
    console.log(`==================================================`);

    // 1. Fetch main destination photos
    const mainQuery = cleanSearchTerm(detail.title);
    let mainPhotos = await fetchWmImage(mainQuery);
    await sleep(700);

    if (!mainPhotos) {
      mainPhotos = await fetchWmImage(`${mainQuery} ${detail.state}`);
      await sleep(700);
    }

    if (mainPhotos && mainPhotos.length > 0) {
      detail.image = { src: mainPhotos[0], alt: `${detail.title}, ${detail.state}` };
      detail.heroImage = { src: mainPhotos[0], alt: `${detail.title}, ${detail.state}` };
      detail.gallery = mainPhotos.slice(0, 6).map((u, i) => ({
        src: u,
        alt: `${detail.title} photo ${i + 1}`
      }));
      console.log(`  ✓ Main Destination Photo: ${mainPhotos[0]}`);

      const indexEntry = indexData.destinations.find(d => d.slug === slug);
      if (indexEntry) {
        indexEntry.image = detail.image;
        indexEntry.heroImage = detail.heroImage;
      }
    }

    // 2. Fetch photo for EVERY place to visit
    if (detail.topPlaces && detail.topPlaces.length > 0) {
      for (const place of detail.topPlaces) {
        const placeQuery = cleanSearchTerm(place.name);
        let placePhotos = await fetchWmImage(placeQuery);
        await sleep(700);

        if (!placePhotos) {
          // Retry with destination name attached
          placePhotos = await fetchWmImage(`${placeQuery} ${mainQuery}`);
          await sleep(700);
        }

        if (placePhotos && placePhotos.length > 0) {
          place.image = { src: placePhotos[0], alt: place.name };
          place.photos = placePhotos.slice(0, 3);
          console.log(`  ✓ Place Photo [${place.name}]: ${placePhotos[0]}`);
        } else {
          console.log(`  ⚠️ Place Photo [${place.name}]: 0 results returned for query "${placeQuery}"`);
        }
      }
    }

    // 3. Update hotels photos if main photos available
    if (detail.hotels && detail.hotels.length > 0 && mainPhotos) {
      detail.hotels.forEach((h, idx) => {
        const hImg = mainPhotos[idx % mainPhotos.length];
        h.image = { src: hImg, alt: h.name };
      });
    }

    fs.writeFileSync(file, JSON.stringify(detail, null, 2), 'utf8');
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf8');
  console.log('\n==================================================');
  console.log('PRECISION WIKIMEDIA MAPPING COMPLETE FOR ALL DESTINATIONS & PLACES!');
  console.log('==================================================');
}

run();
