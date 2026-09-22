const fs = require('fs');
const path = require('path');

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
const now = Date.now();
const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
const fourDaysMs = 4 * 24 * 60 * 60 * 1000;

const files = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
let within3Days = [];
let within4Days = [];

for (const f of files) {
  const stat = fs.statSync(path.join(destDir, f));
  if (now - stat.mtimeMs <= threeDaysMs) {
    within3Days.push(f);
  }
  if (now - stat.mtimeMs <= fourDaysMs) {
    within4Days.push(f);
  }
}

console.log('Total destinations in folder:', files.length);
console.log('Destinations with mtime <= 3 days:', within3Days.length);
console.log('Destinations with mtime <= 4 days:', within4Days.length);

// Also compare with git log targets
const gitLogTargets = JSON.parse(fs.readFileSync('scratch_updated_destinations.json', 'utf8')).map(f => path.basename(f));
const unionTargets = Array.from(new Set([...within3Days, ...within4Days, ...gitLogTargets])).sort();
console.log('Union of mtime and git log targets:', unionTargets.length);

fs.writeFileSync('scratch_combined_targets.json', JSON.stringify(unionTargets, null, 2));
