const fs = require('fs');
const path = require('path');

const idx = JSON.parse(fs.readFileSync('data/destinations/index.json', 'utf8'));
const dests = idx.destinations || idx;
const states = {};
dests.forEach(d => {
  const s = d.state || d.region || 'Unknown';
  states[s] = (states[s] || 0) + 1;
});

console.log('Total destinations:', dests.length);
console.log('\nBy state:');
Object.entries(states).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
  console.log(`  ${s}: ${c}`);
});
