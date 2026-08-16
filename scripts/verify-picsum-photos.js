/**
 * verify-picsum-photos.js — rescan data/destinations/*.json from disk and
 * report how many heroImage / topPlaces[].image entries are still picsum.
 * Read-only; makes no writes.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const idx = JSON.parse(fs.readFileSync(path.join(DEST_DIR, 'index.json'), 'utf8'));

let heroPicsum = 0, placePicsum = 0, heroTotalChecked = 0;
const heroExamples = [];
const placeExamples = [];

for (const s of idx.destinations) {
  const f = path.join(DEST_DIR, s.slug + '.json');
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  heroTotalChecked++;
  if (d.heroImage && /picsum\.photos/.test(d.heroImage.src)) {
    heroPicsum++;
    if (heroExamples.length < 8) heroExamples.push(s.slug);
  }
  (d.topPlaces || []).forEach((p, pi) => {
    const src = p.image && (p.image.src || (typeof p.image === 'string' ? p.image : null));
    if (typeof src === 'string' && /picsum\.photos/.test(src)) {
      placePicsum++;
      if (placeExamples.length < 8) placeExamples.push(s.slug + '#' + pi + ' (' + p.name + ')');
    }
  });
}

console.log('destinations checked:', heroTotalChecked);
console.log('heroImage still picsum:', heroPicsum);
console.log('topPlaces image still picsum:', placePicsum);
console.log('hero examples still picsum:', heroExamples);
console.log('place examples still picsum:', placeExamples);
