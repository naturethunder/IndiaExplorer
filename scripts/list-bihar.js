const fs = require('fs');
const path = require('path');
const DEST_DIR = 'data/destinations';
const idx = JSON.parse(fs.readFileSync(path.join(DEST_DIR, 'index.json'), 'utf8'));

const biharInIndex = idx.destinations.filter(d => (d.state || '').toLowerCase() === 'bihar');
console.log(`Total Bihar destinations in index.json: ${biharInIndex.length}`);
biharInIndex.forEach((d, i) => {
  console.log(`${i + 1}. [${d.slug}] "${d.title}" (${d.type})`);
});

const allFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
const biharInFiles = [];
allFiles.forEach(f => {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
    if ((d.state || '').toLowerCase() === 'bihar') {
      biharInFiles.push({ file: f, slug: d.slug, title: d.title });
    }
  } catch(e) {}
});

console.log(`\nTotal JSON files in data/destinations with state Bihar: ${biharInFiles.length}`);
biharInFiles.forEach((d, i) => {
  console.log(`${i + 1}. ${d.file} -> "${d.title}"`);
});
