const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

const syntheticChains = /^(Marriott|Fortune Park|Sterling|Jungle Lodges|Radisson)\s+(.+)$/i;

const curated = [];

for (const file of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const hotels = d.hotels || [];
  if (hotels.length === 0) continue;

  let hasOyo = false, hasAirbnb = false, hasGrand = false, hasChain = false;
  for (const h of hotels) {
    if (/^OYO\s.+Stay$/i.test(h.name)) hasOyo = true;
    if (/^Airbnb:\s(Stay in\s.+|Tea Estate Cottage)$/i.test(h.name)) hasAirbnb = true;
    if (/Grand Hotel$/i.test(h.name)) hasGrand = true;
    if (syntheticChains.test(h.name)) hasChain = true;
  }

  const isSynthetic = hasOyo || hasAirbnb || hasGrand || hasChain;
  if (!isSynthetic && !d.hotelSourceTried) {
    curated.push({
      slug: d.slug,
      title: d.title,
      hotelCount: hotels.length,
      sampleHotels: hotels.slice(0, 3).map(h => `${h.name} (₹${h.priceMin}-${h.priceMax})`)
    });
  }
}

console.log(`Curated count: ${curated.length}`);
console.log(curated.slice(0, 25));
