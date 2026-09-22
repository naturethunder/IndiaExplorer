const fs = require('fs');
const path = require('path');

const report = JSON.parse(fs.readFileSync('scratch_295_defects.json', 'utf8'));
console.log('Total destinations with defects:', report.length);

let totalDefectiveSlots = 0;
let defectiveByLoc = { hero: 0, gallery: 0, placeImage: 0, placePhoto: 0 };

for (const dest of report) {
  const slots = new Set();
  for (const d of dest.defects) {
    if (d.loc === 'heroImage' || d.loc === 'heroImage_sync') {
      slots.add('heroImage');
      defectiveByLoc.hero++;
    } else if (d.loc && d.loc.startsWith('gallery')) {
      slots.add(d.loc);
      defectiveByLoc.gallery++;
    } else if (d.loc && d.loc.includes('.image')) {
      slots.add(d.loc);
      defectiveByLoc.placeImage++;
    } else if (d.loc && d.loc.includes('.photos')) {
      slots.add(d.loc);
      defectiveByLoc.placePhoto++;
    }
  }
  totalDefectiveSlots += slots.size;
}

console.log('Total defective slots needing replacement:', totalDefectiveSlots);
console.log('Defective slots by location:', defectiveByLoc);
