const fs = require('fs');
const path = require('path');

// 1. Check meta referrer in HTML files
console.log('=== META REFERRER POLICY ===');
['destination.html', 'index.html', 'destinations.html', 'ai-finder.html'].forEach(function(f) {
  const c = fs.readFileSync(f, 'utf8');
  const idx = c.indexOf('meta name="referrer" content="');
  if (idx >= 0) {
    const snippet = c.slice(idx + 30, idx + 80);
    const end = snippet.indexOf('"');
    console.log(f + ':', end >= 0 ? snippet.slice(0, end) : snippet);
  } else {
    console.log(f + ': NOT FOUND');
  }
});

// 2. Check remaining broken URLs
console.log('\n=== REMAINING BAD URLS ===');
const dir = './data/destinations';
const files = fs.readdirSync(dir).filter(function(f) { return f.endsWith('.json'); });
let thumbHero = 0, pixHero = 0, thumbGallery = 0, pixGallery = 0;
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const d = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const src = d.heroImage && d.heroImage.src ? d.heroImage.src : '';
  if (src.indexOf('/thumb/') >= 0) thumbHero++;
  if (src.indexOf('pixabay.com/get/') >= 0) pixHero++;
  const gallery = d.gallery || [];
  for (let j = 0; j < gallery.length; j++) {
    const g = gallery[j];
    const gs = typeof g === 'string' ? g : (g && g.src ? g.src : '');
    if (gs.indexOf('/thumb/') >= 0) thumbGallery++;
    if (gs.indexOf('pixabay.com/get/') >= 0) pixGallery++;
  }
}
console.log('Hero /thumb/ remaining:', thumbHero);
console.log('Hero pixabay/get/ remaining:', pixHero);
console.log('Gallery /thumb/ remaining:', thumbGallery);
console.log('Gallery pixabay/get/ remaining:', pixGallery);
