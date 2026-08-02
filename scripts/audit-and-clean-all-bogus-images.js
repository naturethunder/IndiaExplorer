const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');

const targetSlugs = [
  'bangaram-island', 'agatti-island', 'havelock-island', 'dawki', 'gurudongmar-lake', 'hanle', 'chopta',
  'gandikota', 'dhanushkodi', 'mawlynnong', 'lonar-crater', 'daringbadi', 'chembra-peak', 'gurez-valley',
  'unakoti', 'sandakphu', 'chitrakote-falls', 'shekhawati', 'dholavira', 'zanskar-valley', 'polo-forest',
  'tranquebar', 'jibhi', 'bhedaghat', 'valparai', 'tamhini-ghat', 'loktak-lake', 'dhanaulti', 'mandu'
];

function isBogusUrl(url) {
  if (!url) return true;
  const u = url.toLowerCase();
  if (u.includes('.pdf') || u.includes('.djvu') || u.includes('book') || u.includes('journal') ||
      u.includes('page1-') || u.includes('american_homes') || u.includes('sandy_loam') ||
      u.includes('map') || u.includes('diagram') || u.includes('haplocampa') ||
      u.includes('netaji_papers') || u.includes('shop_at_bhedaghat')) {
    return true;
  }
  return false;
}

console.log('Scanning 29 destinations for bogus book/scan/dictionary image URLs...');

const bogusFound = [];

targetSlugs.forEach(slug => {
  const file = path.join(DEST_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return;

  const d = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (isBogusUrl(d.image ? d.image.src : '')) {
    bogusFound.push({ type: 'main', slug, title: d.title, url: d.image.src });
  }

  if (d.topPlaces) {
    d.topPlaces.forEach(p => {
      const src = p.image ? p.image.src : (p.photos && p.photos[0] ? p.photos[0] : '');
      if (isBogusUrl(src)) {
        bogusFound.push({ type: 'place', slug, title: d.title, placeName: p.name, url: src });
      }
    });
  }
});

console.log(`Found ${bogusFound.length} bogus scan/dictionary/pdf image URLs:`);
bogusFound.forEach(b => {
  if (b.type === 'main') {
    console.log(` ❌ [DEST] ${b.title} (${b.slug}): ${b.url}`);
  } else {
    console.log(` ❌ [PLACE] ${b.title} -> ${b.placeName}: ${b.url}`);
  }
});
