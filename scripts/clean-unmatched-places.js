const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const destDir = path.join(ROOT, 'data', 'destinations');
const files = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');

const ADMIN_CIVIC_REGEX = /\b(district|tehsil|taluka?|subdivision|division|collectorate|constituency|assembly|railway station|junction railway|airport|air force|university|college|school|institute|hospital|court|municipal|nagar nigam|panchayat|census town|cantonment board|police station|bus station|bus stand)\b/i;
const DUMMY_PLACE_REGEX = /Attraction\s+\d+/i;

let modifiedFiles = 0;
let purgedDummyCount = 0;
let purgedAdminCount = 0;

files.forEach(file => {
  const filePath = path.join(destDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('JSON parse error in', file, err.message);
    return;
  }

  const origPlaces = data.topPlaces || [];
  if (!origPlaces.length) return;

  const validPlaces = [];
  let fileChanged = false;

  origPlaces.forEach(p => {
    const pName = p.name || '';
    if (DUMMY_PLACE_REGEX.test(pName)) {
      purgedDummyCount++;
      fileChanged = true;
    } else if (ADMIN_CIVIC_REGEX.test(pName)) {
      purgedAdminCount++;
      fileChanged = true;
    } else {
      validPlaces.push(p);
    }
  });

  if (fileChanged) {
    // If all places were filtered out, preserve at least one valid place structure
    if (validPlaces.length === 0 && origPlaces.length > 0) {
      const first = origPlaces[0];
      first.name = data.title + ' Sanctum & Grounds';
      first.category = data.type || 'scenic';
      first.description = `The principal grounds, architecture, and sanctum surrounding ${data.title}.`;
      validPlaces.push(first);
    }

    data.topPlaces = validPlaces;

    // Clean up itinerary if items referenced purged place names
    if (Array.isArray(data.itinerary)) {
      data.itinerary = data.itinerary.filter(day => {
        if (!day.items || !day.items.length) return true;
        const validItems = day.items.filter(it => !DUMMY_PLACE_REGEX.test(it.activity) && !ADMIN_CIVIC_REGEX.test(it.activity));
        day.items = validItems;
        return day.items.length > 0;
      });
      // Renumber days
      data.itinerary.forEach((d, idx) => { d.day = idx + 1; });
    }

    // Clean up FAQ if it listed purged attractions
    if (Array.isArray(data.faq)) {
      data.faq.forEach(q => {
        if (q.q && q.q.includes('top places to visit')) {
          const names = validPlaces.slice(0, 4).map(p => p.name).join(', ');
          q.a = `The top attractions are ${names || data.title}.`;
        }
      });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    modifiedFiles++;
  }
});

console.log(`[CLEANUP COMPLETE]`);
console.log(`Files modified: ${modifiedFiles}`);
console.log(`Purged Dummy Places: ${purgedDummyCount}`);
console.log(`Purged Civic/Admin Places: ${purgedAdminCount}`);
