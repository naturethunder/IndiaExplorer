const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

const insufficient = [];
const mismatches = [];

for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const hotels = d.hotels || [];
  if (hotels.length < 2) {
    insufficient.push({ file: f, title: d.title, count: hotels.length });
  }
  const minP = hotels.length > 0 ? Math.min(...hotels.map(h => h.priceMin || 9999)) : 9999;
  if (d.overview && d.overview.minPrice !== minP && minP < 9999) {
    mismatches.push({ file: f, title: d.title, ov: d.overview.minPrice, hotelMin: minP });
  }
}

console.log('Insufficient hotels (<2):', insufficient.length);
console.log(insufficient.slice(0, 10));
console.log('\nMismatches:', mismatches);
