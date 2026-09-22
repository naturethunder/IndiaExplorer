const { execSync } = require('child_process');
const fs = require('fs');

// Get diff of 5dc7e3ff vs 3ad9b7ea
const diff = execSync('git diff 3ad9b7ea 5dc7e3ff -- "data/destinations/*.json"', { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });

const chunks = diff.split('diff --git a/');
const destsWithPhotoChanges = [];

for (const chunk of chunks) {
  if (!chunk.trim()) continue;
  const firstLine = chunk.split('\n')[0];
  const filename = firstLine.split(' ')[0].trim();
  
  // Check if any + lines contain .jpeg, .jpg, .png, .webp, or unsplash/pexels/pixabay
  const lines = chunk.split('\n');
  let hasImageChange = false;
  for (const l of lines) {
    if ((l.startsWith('+ ') || l.startsWith('- ')) && (l.includes('images.unsplash.com') || l.includes('images.pexels.com') || l.includes('pixabay') || l.includes('.jpg') || l.includes('.jpeg') || l.includes('.png'))) {
      hasImageChange = true;
      break;
    }
  }
  if (hasImageChange) {
    destsWithPhotoChanges.push(filename);
  }
}

console.log('Destinations with photo changes in 5dc7e3ff:', destsWithPhotoChanges.length);
console.log(destsWithPhotoChanges);

fs.writeFileSync('scratch_dests_with_photo_changes.json', JSON.stringify(destsWithPhotoChanges, null, 2));
