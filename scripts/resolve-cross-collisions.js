const fs = require('fs');
const path = require('path');
const { searchWikimedia, searchOpenverse, searchPexels, isLiveImage, cleanUrlKey } = require('./image-search-engine.js');

const slugs = [
  'varanasi',
  'bijapur-fort',
  'munger-fort',
  'nalanda',
  'rohtasgarh-fort',
  'sri-sri-nookambika-ammavari-temple',
  'kaziranga',
  'hoollongapar-gibbon-sanctuary',
  'orang-national-park'
];

async function resolveCrossCollisions() {
  console.log('Resolving cross collisions across 9 destinations...');
  const allUsed = new Set();

  for (const slug of slugs) {
    const file = path.join('data', 'destinations', slug + '.json');
    const d = JSON.parse(fs.readFileSync(file, 'utf8'));
    let modified = false;

    async function getReplacement(placeName, query) {
      const candidates = [];
      const pex = await searchPexels(query, 6);
      pex.forEach(x => candidates.push(x.url));
      const opv = await searchOpenverse(query, 6);
      opv.forEach(x => candidates.push(x.url));
      const wm = await searchWikimedia(query, 10);
      wm.forEach(x => candidates.push(x.url));

      for (const u of candidates) {
        const k = cleanUrlKey(u);
        if (!k || allUsed.has(k)) continue;
        const ok = await isLiveImage(u);
        if (ok) {
          allUsed.add(k);
          return u;
        }
      }
      return null;
    }

    // Check gallery
    for (let i = 0; i < (d.gallery || []).length; i++) {
      const k = cleanUrlKey(d.gallery[i].src);
      if (allUsed.has(k)) {
        console.log(slug, 'gallery[' + i + '] collides:', k);
        const rep = await getReplacement(d.title, d.title + ' ' + d.state + ' heritage');
        if (rep) {
          d.gallery[i].src = rep;
          if (i === 0) d.heroImage.src = rep;
          modified = true;
          console.log('  -> Replaced with:', rep);
        }
      } else {
        allUsed.add(k);
      }
    }
    if (d.heroImage?.src) {
      d.heroImage.src = d.gallery[0].src;
    }

    // Check topPlaces
    for (let i = 0; i < (d.topPlaces || []).length; i++) {
      const pl = d.topPlaces[i];
      const cardKey = cleanUrlKey(pl.image?.src);
      if (allUsed.has(cardKey)) {
        console.log(slug, 'P' + i + ' card collides:', cardKey);
        const rep = await getReplacement(pl.name, pl.name + ' ' + d.title + ' ' + d.state);
        if (rep) {
          pl.image.src = rep;
          modified = true;
          console.log('  -> Replaced card with:', rep);
        }
      } else {
        allUsed.add(cardKey);
      }

      for (let j = 0; j < (pl.photos || []).length; j++) {
        const pk = cleanUrlKey(pl.photos[j]);
        if (allUsed.has(pk)) {
          console.log(slug, 'P' + i + ' photo[' + j + '] collides:', pk);
          const rep = await getReplacement(pl.name, pl.name + ' ' + d.title);
          if (rep) {
            pl.photos[j] = rep;
            modified = true;
            console.log('  -> Replaced photo with:', rep);
          }
        } else {
          allUsed.add(pk);
        }
      }
    }

    if (modified) {
      fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
      console.log('Saved modified', slug);
    }
  }
}

resolveCrossCollisions().catch(console.error);
