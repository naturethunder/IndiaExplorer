const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

let stats = {
  totalFiles: files.length,
  syntheticCount: 0,
  realCuratedCount: 0,
  osmCount: 0,
  zeroHotels: 0,
  fakeTemplates: {
    oyo: 0,
    airbnb: 0,
    grandHotel: 0,
    chainDest: 0
  }
};

const syntheticChains = /^(Marriott|Fortune Park|Sterling|Jungle Lodges|Radisson)\s+(.+)$/i;

const examples = [];

for (const file of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  const hotels = d.hotels || [];
  if (hotels.length === 0) {
    stats.zeroHotels++;
    continue;
  }

  let hasOyo = false, hasAirbnb = false, hasGrand = false, hasChain = false;
  for (const h of hotels) {
    if (/^OYO\s.+Stay$/i.test(h.name)) hasOyo = true;
    if (/^Airbnb:\s(Stay in\s.+|Tea Estate Cottage)$/i.test(h.name)) hasAirbnb = true;
    if (/Grand Hotel$/i.test(h.name)) hasGrand = true;
    if (syntheticChains.test(h.name)) hasChain = true;
  }

  if (hasOyo) stats.fakeTemplates.oyo++;
  if (hasAirbnb) stats.fakeTemplates.airbnb++;
  if (hasGrand) stats.fakeTemplates.grandHotel++;
  if (hasChain) stats.fakeTemplates.chainDest++;

  const isSynthetic = hasOyo || hasAirbnb || hasGrand || hasChain;
  if (isSynthetic) {
    stats.syntheticCount++;
    if (examples.length < 5) {
      examples.push({
        slug: d.slug,
        title: d.title,
        hotels: hotels.map(h => ({ name: h.name, tier: h.tier, price: `${h.priceMin}-${h.priceMax}` }))
      });
    }
  } else if (d.hotelSourceTried) {
    stats.osmCount++;
  } else {
    stats.realCuratedCount++;
  }
}

console.log(JSON.stringify(stats, null, 2));
console.log('\nExamples of Synthetic:');
console.log(JSON.stringify(examples, null, 2));
