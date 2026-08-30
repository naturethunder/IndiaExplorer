const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../data/destinations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json');

// Legitimate Agra / Taj Mahal destinations
const legitimateSlugs = new Set(['agra', 'taj-mahal', 'mehtab-bagh', 'agra-fort', 'fatehpur-sikri', 'itmad-ud-daulah']);

let destCountWithTaj = 0;
let placeCountWithTaj = 0;
let totalTajImageOccurrences = 0;
const affectedDests = [];
const tajUrlOccurrences = new Map();

const tajRegex = /taj[_\s-]?mahal/i;

files.forEach(file => {
  const slug = file.replace('.json', '');
  const isLegitimate = legitimateSlugs.has(slug);

  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    let tajInGalleryOrHero = 0;
    let placesWithTaj = [];

    // Helper to test URL
    const checkUrl = (url) => {
      if (typeof url !== 'string') return false;
      if (tajRegex.test(url)) {
        tajUrlOccurrences.set(url, (tajUrlOccurrences.get(url) || 0) + 1);
        return true;
      }
      return false;
    };

    // Check heroImage
    if (data.heroImage && data.heroImage.src && checkUrl(data.heroImage.src)) {
      tajInGalleryOrHero++;
      totalTajImageOccurrences++;
    }

    // Check gallery
    if (Array.isArray(data.gallery)) {
      data.gallery.forEach(g => {
        if (g && g.src && checkUrl(g.src)) {
          tajInGalleryOrHero++;
          totalTajImageOccurrences++;
        }
      });
    }

    // Check topPlaces or places
    const places = data.topPlaces || data.places || [];
    if (Array.isArray(places)) {
      places.forEach((p, idx) => {
        let pTajCount = 0;
        if (p.image && p.image.src && checkUrl(p.image.src)) {
          pTajCount++;
          totalTajImageOccurrences++;
        }
        if (Array.isArray(p.photos)) {
          p.photos.forEach(ph => {
            const u = typeof ph === 'string' ? ph : ph?.src;
            if (u && checkUrl(u)) {
              pTajCount++;
              totalTajImageOccurrences++;
            }
          });
        }
        if (pTajCount > 0) {
          const pName = p.name || p.title || ('Place #' + (idx + 1));
          if (!tajRegex.test(pName) || !isLegitimate) {
            placesWithTaj.push({ name: pName, count: pTajCount });
          }
        }
      });
    }

    if (!isLegitimate && (tajInGalleryOrHero > 0 || placesWithTaj.length > 0)) {
      destCountWithTaj++;
      placeCountWithTaj += placesWithTaj.length;
      affectedDests.push({
        slug,
        title: data.title || slug,
        state: data.state || data.region || 'Unknown',
        galleryHeroTaj: tajInGalleryOrHero,
        placesWithTaj: placesWithTaj
      });
    }
  } catch (err) {}
});

console.log('====================================================');
console.log('       TAJ MAHAL IMAGE MISMATCH AUDIT REPORT        ');
console.log('====================================================');
console.log(`Total Destinations Analyzed: ${files.length}`);
console.log(`Destinations with Taj Mahal images (Unrelated): ${destCountWithTaj}`);
console.log(`Places with Taj Mahal images (Unrelated): ${placeCountWithTaj}`);
console.log(`Total Taj Mahal Image Occurrences: ${totalTajImageOccurrences}`);
console.log(`Distinct Taj Mahal Image URLs found: ${tajUrlOccurrences.size}`);

console.log('\n--- Breakdown of Taj Mahal URLs Found ---');
for (const [url, count] of tajUrlOccurrences.entries()) {
  const shortUrl = url.length > 80 ? '...' + url.slice(-75) : url;
  console.log(`  [${count} times] ${shortUrl}`);
}

console.log('\n--- Breakdown by State (Unrelated Destinations Affected) ---');
const byState = {};
affectedDests.forEach(d => {
  byState[d.state] = (byState[d.state] || 0) + 1;
});
Object.entries(byState).sort((a, b) => b[1] - a[1]).forEach(([st, cnt]) => {
  console.log(`  • ${st}: ${cnt} destinations`);
});

console.log('\n--- Sample 15 Affected Destinations ---');
affectedDests.slice(0, 15).forEach(d => {
  const placeNames = d.placesWithTaj.map(p => p.name).slice(0, 3).join(', ');
  const morePlaces = d.placesWithTaj.length > 3 ? ` +${d.placesWithTaj.length - 3} more` : '';
  console.log(`  • ${d.title} (${d.slug}) [${d.state}]`);
  if (d.galleryHeroTaj > 0) console.log(`      - Hero/Gallery Taj images: ${d.galleryHeroTaj}`);
  if (d.placesWithTaj.length > 0) console.log(`      - Affected places (${d.placesWithTaj.length}): ${placeNames}${morePlaces}`);
});
