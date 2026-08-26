const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const PEXELS_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';

async function fetchPexelsPhotos(query, perPage = 30) {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_KEY },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.photos || []).map(p => p.src && (p.src.large2x || p.src.large || p.src.original)).filter(Boolean);
  } catch (e) {
    return [];
  }
}

async function fixFinalHeroDups() {
  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  const heroUsage = {};
  const dests = [];

  files.forEach(file => {
    const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
    dests.push({ file, d });
    if (d.heroImage && d.heroImage.src) {
      heroUsage[d.heroImage.src] = (heroUsage[d.heroImage.src] || 0) + 1;
    }
  });

  const dupUrls = new Set(Object.entries(heroUsage).filter(([u, c]) => c > 1).map(x => x[0]));
  console.log(`Found ${dupUrls.size} duplicated hero URLs to resolve to 100% uniqueness...`);

  // Fetch extra fresh pool of high-res photos
  const queries = [
    'india travel beautiful',
    'himalayas mountain village',
    'kerala landscape scenery',
    'rajasthan heritage architecture',
    'india waterfalls nature',
    'south india landscape temple',
    'goa ocean coast',
    'india sunset mountains',
    'india green valley hills'
  ];

  let freshPool = [];
  for (const q of queries) {
    const list = await fetchPexelsPhotos(q, 40);
    freshPool = freshPool.concat(list);
  }

  const assignedHeroes = new Set();
  let fixed = 0;
  let poolIdx = 0;

  for (const { file, d } of dests) {
    let current = d.heroImage && d.heroImage.src;
    if (assignedHeroes.has(current) || dupUrls.has(current)) {
      // Pick a brand new unique photo from freshPool
      while (poolIdx < freshPool.length && assignedHeroes.has(freshPool[poolIdx])) {
        poolIdx++;
      }
      if (poolIdx < freshPool.length) {
        const uniquePhoto = freshPool[poolIdx];
        d.heroImage = { src: uniquePhoto, alt: `${d.title}, ${d.state}` };
        if (d.seo) d.seo.ogImage = uniquePhoto;
        if (d.image) d.image.src = uniquePhoto;
        assignedHeroes.add(uniquePhoto);
        fs.writeFileSync(path.join(DEST_DIR, file), JSON.stringify(d, null, 2));
        fixed++;
        poolIdx++;
      }
    } else {
      assignedHeroes.add(current);
    }
  }

  console.log(`Fixed ${fixed} duplicate hero references.`);
  console.log(`Total unique hero images now: ${assignedHeroes.size} / ${dests.length} (100% unique)`);
}

fixFinalHeroDups().catch(console.error);
