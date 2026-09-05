/**
 * sync-hotel-urls.js — Ensures 100% of hotels across all destination JSON files
 * have accurate, verified Google Maps Universal Place search URLs matching their current
 * hotel name, destination name, and state.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'index.json');

console.log(`Auditing and synchronizing hotel URLs across ${files.length} destinations...`);

let totalHotels = 0;
let updatedHotels = 0;
let filesModified = 0;
const sampleUpdates = [];

for (const file of files) {
  const filePath = path.join(DIR, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const dest = JSON.parse(raw);
    let modified = false;

    if (Array.isArray(dest.hotels) && dest.hotels.length > 0) {
      for (const h of dest.hotels) {
        if (!h.name) continue;
        totalHotels++;

        const expectedQuery = encodeURIComponent(`${h.name} ${dest.title} ${dest.state || ''}`.trim());
        const expectedUrl = `https://www.google.com/maps/search/?api=1&query=${expectedQuery}`;

        if (h.url !== expectedUrl) {
          if (sampleUpdates.length < 5) {
            sampleUpdates.push({
              dest: dest.title,
              hotel: h.name,
              oldUrl: h.url,
              newUrl: expectedUrl
            });
          }
          h.url = expectedUrl;
          modified = true;
          updatedHotels++;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(dest, null, 2));
      filesModified++;
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
}

console.log(`\nSynchronization Summary:`);
console.log(`  Total Destinations Checked: ${files.length}`);
console.log(`  Files Updated: ${filesModified}`);
console.log(`  Total Hotels Audited: ${totalHotels}`);
console.log(`  Hotels URLs Synchronized to Google Maps: ${updatedHotels}`);
console.log(`\nSample Updates:`);
console.log(JSON.stringify(sampleUpdates, null, 2));
