const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '..', 'data', 'destinations', 'index.json');
const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

const stateCounts = {};
indexData.destinations.forEach(d => {
  const st = (d.state || 'Unknown').trim();
  stateCounts[st] = (stateCounts[st] || 0) + 1;
});

console.log('==================================================');
console.log(`DISTINCT STATE STRINGS IN INDEX.JSON (${Object.keys(stateCounts).length} total):`);
console.log('==================================================');
Object.entries(stateCounts).sort((a, b) => a[0].localeCompare(b[0])).forEach(([st, count]) => {
  console.log(`  • "${st}" -> ${count} destinations`);
});
console.log('==================================================');
