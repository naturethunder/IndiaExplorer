const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

let count = 0;
indexData.destinations.forEach(d => {
  if (d.state === 'Ladakh (UT)') {
    d.state = 'Ladakh';
    count++;
  }
});

const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
files.forEach(f => {
  const filePath = path.join(DEST_DIR, f);
  const detail = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (detail.state === 'Ladakh (UT)') {
    detail.state = 'Ladakh';
    fs.writeFileSync(filePath, JSON.stringify(detail, null, 2), 'utf8');
  }
});

fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf8');
console.log(`Normalised ${count} Ladakh state strings to 'Ladakh'. Total distinct States & UTs is now 36.`);
