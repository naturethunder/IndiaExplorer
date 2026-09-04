const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const destDir = path.join(ROOT, 'data', 'destinations');
const files = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');

const METRO_REGEX = /\bmetro(\s+station)?\b/i;

let modifiedFiles = 0;
let totalMetroMoved = 0;

files.forEach(file => {
  const filePath = path.join(destDir, file);
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const places = d.topPlaces || [];
  const metroItems = places.filter(p => METRO_REGEX.test(p.name));

  if (metroItems.length > 0) {
    // Select closest/first metro station
    const best = metroItems[0];
    const distMatch = (best.distance || '').match(/(\d+(\.\d+)?)/);
    const distKm = distMatch ? parseFloat(distMatch[1]) : 1;

    if (!d.howToReach) d.howToReach = {};
    d.howToReach.nearestMetro = {
      name: best.name,
      distance: distKm
    };

    // Filter out metro stations from topPlaces
    d.topPlaces = places.filter(p => !METRO_REGEX.test(p.name));
    totalMetroMoved += metroItems.length;

    // If topPlaces became empty (unlikely), restore a general grounds place
    if (d.topPlaces.length === 0) {
      d.topPlaces.push({
        name: d.title + ' Grounds & Precinct',
        category: d.type || 'heritage',
        distance: 'Town Centre',
        entryFee: 'Varies',
        timings: 'Varies by season',
        duration: '1–2 hrs',
        rating: 4.5,
        description: `The main historic grounds, architecture, and precinct of ${d.title}.`,
        image: d.heroImage || { src: '', alt: d.title },
        photos: []
      });
    }

    // Clean up itinerary items referencing metro stations
    if (Array.isArray(d.itinerary)) {
      d.itinerary = d.itinerary.filter(day => {
        if (!day.items || !day.items.length) return true;
        day.items = day.items.filter(it => !METRO_REGEX.test(it.activity));
        return day.items.length > 0;
      });
      d.itinerary.forEach((day, idx) => { day.day = idx + 1; });
    }

    // Update FAQ if referencing metro in top places
    if (Array.isArray(d.faq)) {
      d.faq.forEach(q => {
        if (q.q && q.q.includes('top places to visit')) {
          const names = d.topPlaces.slice(0, 4).map(p => p.name).join(', ');
          q.a = `The top attractions are ${names || d.title}.`;
        }
      });
    }

    fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n', 'utf8');
    modifiedFiles++;
  }
});

console.log(`[METRO CONVERSION COMPLETE]`);
console.log(`Files modified: ${modifiedFiles}`);
console.log(`Metro stations converted to howToReach.nearestMetro: ${totalMetroMoved}`);
