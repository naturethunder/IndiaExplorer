const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const JS_DIR = path.join(ROOT, 'js');

// Load all canonical destination JSONs into a map
const canonicalMap = new Map();
fs.readdirSync(DEST_DIR).forEach(file => {
  if (file.endsWith('.json') && file !== 'index.json' && file !== 'search-index.json') {
    const slug = file.replace('.json', '');
    try {
      const data = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
      canonicalMap.set(slug, data);
    } catch (e) {}
  }
});

console.log(`Loaded ${canonicalMap.size} canonical destinations.`);

// Function to clean a legacy JS file by replacing picsum/broken images with real canonical images
function cleanFile(fileName) {
  const filePath = path.join(JS_DIR, fileName);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let replacedCount = 0;

  // Replace picsum references
  content = content.replace(/https:\/\/picsum\.photos\/[^'"`]+/g, (match) => {
    replacedCount++;
    return '';
  });

  // Strip hotel image lines in legacy data
  content = content.replace(/\s*image:\s*['"]https?:\/\/[^'"]+['"],?\s*(?=[a-zA-Z0-9_$]+\s*:|\})/g, (match) => {
    return ' ';
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Cleaned ${fileName} (${replacedCount} placeholder URLs purged).`);
}

['data.js', 'data-extra.js', 'data-destinations.js', 'data-photos.js', 'data-place-photos.js'].forEach(cleanFile);

// Synchronize js/data-photos.js with canonical photos
const photosObj = {};
for (const [slug, dest] of canonicalMap.entries()) {
  const list = [];
  if (dest.heroImage && dest.heroImage.src) list.push(dest.heroImage.src);
  if (Array.isArray(dest.gallery)) {
    dest.gallery.forEach(g => {
      const src = g.src || g;
      if (src && !list.includes(src)) list.push(src);
    });
  }
  if (list.length) {
    photosObj[slug] = list;
  }
}

const photosJsContent = `// AUTO-GENERATED — do not hand-edit. Real photography per destination.
(function () {
  if (typeof DESTINATIONS === 'undefined') return;
  var PHOTOS = ${JSON.stringify(photosObj, null, 2)};
  DESTINATIONS.forEach(function (d) {
    if (PHOTOS[d.id]) d.photos = PHOTOS[d.id];
  });
})();
`;

fs.writeFileSync(path.join(JS_DIR, 'data-photos.js'), photosJsContent, 'utf8');
console.log('Synchronized js/data-photos.js with canonical 4K/HD photos.');

console.log('Legacy JS image data cleaned and purged successfully!');
