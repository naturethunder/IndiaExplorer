const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const targetsMap = {
  'gandikota': ['Gandikota gorge', 'Madhavaraya Swamy temple Gandikota'],
  'dhanushkodi': ['Dhanushkodi beach', 'Dhanushkodi church ruin'],
  'mawlynnong': ['Mawlynnong Meghalaya', 'Living Root Bridge Mawlynnong'],
  'lonar-crater': ['Lonar crater lake', 'Lonar lake Maharashtra'],
  'daringbadi': ['Daringbadi Odisha', 'Daringbadi hill station'],
  'chembra-peak': ['Chembra Peak Wayanad', 'Heart lake Chembra'],
  'gurez-valley': ['Gurez valley', 'Habba Khatoon mountain Gurez'],
  'unakoti': ['Unakoti Tripura', 'Unakoti rock relief Shiva'],
  'sandakphu': ['Sandakphu trek', 'Kanchenjunga Sandakphu'],
  'chitrakote-falls': ['Chitrakote falls', 'Chitrakoot waterfall Chhattisgarh'],
  'shekhawati': ['Shekhawati haveli Mandawa', 'Shekhawati fresco painting'],
  'dholavira': ['Dholavira Indus valley', 'Dholavira excavation'],
  'zanskar-valley': ['Phugtal monastery Zanskar', 'Zanskar river valley'],
  'polo-forest': ['Polo forest Vijaynagar', 'Polo forest temple ruins'],
  'tranquebar': ['Fort Dansborg Tranquebar', 'Tranquebar beach'],
  'jibhi': ['Jibhi waterfall', 'Tirthan valley Jibhi'],
  'bhedaghat': ['Bhedaghat marble rocks', 'Dhuandhar falls Jabalpur'],
  'valparai': ['Valparai tea estate', 'Sholayar dam Valparai'],
  'tamhini-ghat': ['Tamhini ghat monsoon', 'Mulshi lake Tamhini'],
  'loktak-lake': ['Loktak lake phumdis', 'Keibul Lamjao national park'],
  'dhanaulti': ['Dhanaulti eco park', 'Surkanda Devi temple Dhanaulti'],
  'mandu': ['Jahaz Mahal Mandu', 'Mandu fort Madhya Pradesh']
};

function buildWmQuery(searchTerm) {
  return 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(searchTerm) + '&gsrnamespace=6&gsrlimit=6' +
    '&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json';
}

function fetchWmImages(searchTerm) {
  return new Promise((resolve) => {
    const url = buildWmQuery(searchTerm);
    execFile('curl', ['-sS', '--max-time', '15',
      '-H', 'User-Agent: IndiaExplore/1.0 (educational travel site)',
      url], { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return resolve([]);
      try {
        const j = JSON.parse(stdout);
        const pages = (j.query && j.query.pages) || {};
        const urls = [];
        Object.keys(pages).forEach(k => {
          const ii = pages[k].imageinfo && pages[k].imageinfo[0];
          const u = ii && (ii.thumburl || ii.url);
          if (u && /\.(jpg|jpeg|png)$/i.test(u) && /upload\.wikimedia\.org/.test(u)) {
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

async function run() {
  console.log(`Fetching precision Wikimedia photos for all ${Object.keys(targetsMap).length} destinations...`);
  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

  for (const [slug, queries] of Object.entries(targetsMap)) {
    const file = path.join(DEST_DIR, `${slug}.json`);
    if (!fs.existsSync(file)) continue;

    const detail = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`\nProcessing: ${detail.title}...`);

    let photos = [];
    for (const q of queries) {
      const fetched = await fetchWmImages(q);
      photos = photos.concat(fetched);
      await sleep(350);
    }

    // Filter duplicates
    photos = Array.from(new Set(photos));

    if (photos.length > 0) {
      const heroUrl = photos[0];
      const thumbUrl = photos.length > 1 ? photos[1] : photos[0];

      detail.image = { src: thumbUrl, alt: `${detail.title}, ${detail.state}` };
      detail.heroImage = { src: heroUrl, alt: `${detail.title}, ${detail.state}` };

      detail.gallery = photos.slice(0, 6).map((u, i) => ({
        src: u,
        alt: `${detail.title} view ${i + 1}`
      }));

      if (detail.topPlaces && detail.topPlaces.length > 0) {
        detail.topPlaces.forEach((p, idx) => {
          const imgUrl = photos[idx % photos.length];
          p.image = { src: imgUrl, alt: p.name };
          p.photos = [imgUrl];
        });
      }

      const indexEntry = indexData.destinations.find(d => d.slug === slug);
      if (indexEntry) {
        indexEntry.image = { src: thumbUrl, alt: `${detail.title}, ${detail.state}` };
        indexEntry.heroImage = { src: heroUrl, alt: `${detail.title}, ${detail.state}` };
      }
      console.log(`  ✓ Updated ${photos.length} Wikimedia photos for ${slug}`);
    } else {
      console.log(`  ⚠️ No Wikimedia photos returned for queries: ${queries.join(', ')}`);
    }

    fs.writeFileSync(file, JSON.stringify(detail, null, 2), 'utf8');
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf8');
  console.log('\nPrecision photo update complete!');
}

run();
