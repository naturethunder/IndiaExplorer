/**
 * remove-hotel-images-add-google-urls.js
 * 
 * 1. Strips the image property from all hotel objects across data/destinations/*.json and data/bulk/*.json.
 * 2. Adds direct Google search url to every hotel: https://www.google.com/search?q=<Hotel+Name>+<Destination>+<State>+hotel
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const BULK_DIR = path.join(ROOT, 'data', 'bulk');

// 1. Process all destination files
const destFiles = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
console.log(`Processing ${destFiles.length} destination JSON files...`);

let totalHotelsUpdated = 0;

destFiles.forEach(file => {
  const filePath = path.join(DEST_DIR, file);
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (Array.isArray(d.hotels)) {
    d.hotels.forEach(h => {
      // Remove image
      delete h.image;
      
      // Add direct Google search URL
      const query = `${h.name} ${d.title} ${d.state || ''} hotel`;
      h.url = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
      totalHotelsUpdated++;
    });

    fs.writeFileSync(filePath, JSON.stringify(d, null, 2));
  }
});

console.log(`Updated ${totalHotelsUpdated} hotels across ${destFiles.length} destination JSONs.`);

// 2. Process all bulk state files
const bulkFiles = fs.readdirSync(BULK_DIR).filter(f => f.endsWith('.json'));
console.log(`Processing ${bulkFiles.length} bulk state JSON files...`);

let totalBulkHotels = 0;

bulkFiles.forEach(file => {
  const bulkPath = path.join(BULK_DIR, file);
  const destList = JSON.parse(fs.readFileSync(bulkPath, 'utf8'));

  destList.forEach(d => {
    if (Array.isArray(d.stays)) {
      d.stays.forEach(s => {
        delete s.image;
        const query = `${s.name} ${d.name} ${d.state || ''} hotel`;
        s.url = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
        totalBulkHotels++;
      });
    }
  });

  fs.writeFileSync(bulkPath, JSON.stringify(destList, null, 2));
});

console.log(`Updated ${totalBulkHotels} stays across 36 bulk state files.`);
console.log('Hotel images removed and Google search URLs added successfully!');
