const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

const totalDestinations = indexData.destinations.length;
const statesSet = new Set();
indexData.destinations.forEach(d => {
  if (d.state) statesSet.add(d.state.trim());
});

let totalPlaces = 0;
let totalHotels = 0;

const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, f), 'utf8'));
  if (d.topPlaces && Array.isArray(d.topPlaces)) {
    totalPlaces += d.topPlaces.length;
  }
  if (d.hotels && Array.isArray(d.hotels)) {
    totalHotels += d.hotels.length;
  }
});

console.log('==================================================');
console.log('EXACT DATASET COUNTS AUDIT:');
console.log('==================================================');
console.log(`Total Destinations: ${totalDestinations}`);
console.log(`Total States & UTs: ${statesSet.size}`);
console.log(`Total Places to Visit: ${totalPlaces}`);
console.log(`Total Stays / Hotels: ${totalHotels}`);
console.log('==================================================');
