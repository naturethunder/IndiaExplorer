const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');
const IMG_DIR = path.join(ROOT, 'images', 'destinations');

const imgFiles = fs.readdirSync(IMG_DIR);

const map = {
  'bangaram-island': imgFiles.find(f => f.startsWith('bangaram_island_lagoon')),
  'dawki': imgFiles.find(f => f.startsWith('dawki_umngot_river')),
  'gurudongmar-lake': imgFiles.find(f => f.startsWith('gurudongmar_sacred_lake')),
  'hanle': imgFiles.find(f => f.startsWith('hanle_dark_sky'))
};

const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

Object.keys(map).forEach(slug => {
  const fileName = map[slug];
  if (fileName) {
    const relPath = `images/destinations/${fileName}`;

    // Update index entry
    const entry = idx.destinations.find(d => d.slug === slug);
    if (entry) {
      entry.image = { src: relPath, alt: `${entry.title}, ${entry.state}` };
      entry.heroImage = { src: relPath, alt: `${entry.title}, ${entry.state}` };
    }

    // Update individual json file
    const detailPath = path.join(DEST_DIR, `${slug}.json`);
    if (fs.existsSync(detailPath)) {
      const detail = JSON.parse(fs.readFileSync(detailPath, 'utf8'));
      detail.image = { src: relPath, alt: `${detail.title}, ${detail.state}` };
      detail.heroImage = { src: relPath, alt: `${detail.title}, ${detail.state}` };
      
      // Update places to visit first image as well
      if (detail.placesToVisit && detail.placesToVisit.length > 0) {
        detail.placesToVisit[0].image = relPath;
      }
      fs.writeFileSync(detailPath, JSON.stringify(detail, null, 2), 'utf8');
      console.log(`Updated local image paths for ${slug} -> ${relPath}`);
    }
  }
});

fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2), 'utf8');
console.log('Successfully updated index.json image references.');
