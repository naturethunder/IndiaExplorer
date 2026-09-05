const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'destinations');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== 'index.json');

const clusters = {};

for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const state = d.state || 'Unknown';
  const region = d.region || 'Unknown';
  const key = `${state} - ${region}`;
  clusters[key] = (clusters[key] || 0) + 1;
}

const sorted = Object.entries(clusters).sort((a, b) => b[1] - a[1]);
console.log(`Total clusters: ${sorted.length}`);
console.log('Top 20 destination clusters:');
console.log(sorted.slice(0, 20));
