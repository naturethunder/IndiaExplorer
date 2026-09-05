const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

const corrupted = [];

for (const file of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  if (!d.hotelSourceTried) continue;
  const hotels = d.hotels || [];
  
  const badHotels = [];
  for (const h of hotels) {
    const isLodge = /lodge|homestay|cottage|tourist home|inn|rooms|dorm/i.test(h.name);
    const isLuxuryPrice = h.priceMin >= 5000;
    if (isLodge && isLuxuryPrice && !/jungle|safari|river|ecolodge/i.test(h.name)) {
      badHotels.push({ name: h.name, price: `${h.priceMin}-${h.priceMax}`, tier: h.tier });
    }
  }

  if (badHotels.length > 0) {
    corrupted.push({
      file,
      slug: d.slug,
      title: d.title,
      badHotels
    });
  }
}

console.log(`Destinations with hotelSourceTried: 109`);
console.log(`Destinations with corrupted lodge in luxury slot: ${corrupted.length}`);
console.log(JSON.stringify(corrupted, null, 2));
