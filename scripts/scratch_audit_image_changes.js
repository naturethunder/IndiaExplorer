const { execSync } = require('child_process');
const fs = require('fs');

const diff5dc = execSync('git diff --name-only 3ad9b7ea 5dc7e3ff -- "data/destinations/*.json"', { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
const files5dc = diff5dc.split('\n').map(l => l.trim()).filter(Boolean);

const diffD6 = execSync('git diff --name-only 17833b6e d6f41a4a -- "data/destinations/*.json"', { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
const filesD6 = diffD6.split('\n').map(l => l.trim()).filter(Boolean);

const diff17 = execSync('git diff --name-only 17833b6e^ 17833b6e -- "data/destinations/*.json"', { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
const files17 = diff17.split('\n').map(l => l.trim()).filter(Boolean);

console.log(`Files in 5dc7e3ff: ${files5dc.length}`);
console.log(`Files in d6f41a4a: ${filesD6.length}`);
console.log(`Files in 17833b6e: ${files17.length}`);

// Union of all changed destination files
const allFiles = Array.from(new Set([...files5dc, ...filesD6, ...files17])).sort();
console.log(`Total union of files modified in last 3 days: ${allFiles.length}`);

fs.writeFileSync('scratch_image_changed_files.json', JSON.stringify(allFiles, null, 2));
