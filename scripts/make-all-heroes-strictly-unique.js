const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const config = require('./images/config');
const { loadEnv } = require('./images/lib/dotenv');
const { PexelsProvider } = require('./images/providers/pexels');
const { UnsplashProvider } = require('./images/providers/unsplash');

loadEnv(config.paths.envPath);

const pexels = new PexelsProvider(process.env.PEXELS_API_KEY);
const unsplash = new UnsplashProvider(process.env.UNSPLASH_ACCESS_KEY);

const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'search-index.json');

const usedHeroUrls = new Set();
const destinations = [];

files.forEach(file => {
  const d = JSON.parse(fs.readFileSync(path.join(DEST_DIR, file), 'utf8'));
  destinations.push(d);
});

console.log(`Auditing 100% unique hero assignment across ${destinations.length} destinations...`);

async function fetchUniquePhoto(query, usedSet) {
  try {
    const results = await pexels.search(query, { limit: 15 });
    for (const r of (results || [])) {
      if (r.url && !usedSet.has(r.url)) {
        return r.url;
      }
    }
  } catch (e) {}

  try {
    const results = await unsplash.search(query, { limit: 15 });
    for (const r of (results || [])) {
      if (r.url && !usedSet.has(r.url)) {
        return r.url;
      }
    }
  } catch (e) {}

  return null;
}

async function run() {
  let reassigned = 0;

  for (const d of destinations) {
    let heroSrc = d.heroImage && (d.heroImage.src || d.heroImage);

    // If hero is already unique, register it and continue
    if (heroSrc && !usedHeroUrls.has(heroSrc)) {
      usedHeroUrls.add(heroSrc);
      continue;
    }

    // Hero is duplicate or missing! Find a unique alternative from gallery or top places
    let candidate = null;

    if (Array.isArray(d.gallery)) {
      for (const g of d.gallery) {
        const src = g.src || g;
        if (src && !usedHeroUrls.has(src)) {
          candidate = src;
          break;
        }
      }
    }

    if (!candidate && Array.isArray(d.topPlaces)) {
      for (const p of d.topPlaces) {
        const pSrc = p.image && (p.image.src || p.image);
        if (pSrc && !usedHeroUrls.has(pSrc)) {
          candidate = pSrc;
          break;
        }
        if (Array.isArray(p.photos)) {
          for (const u of p.photos) {
            if (u && !usedHeroUrls.has(u)) {
              candidate = u;
              break;
            }
          }
        }
        if (candidate) break;
      }
    }

    // If still no unique photo from existing assets, fetch via API
    if (!candidate) {
      const q = `${d.title} ${d.state} travel landscape`;
      candidate = await fetchUniquePhoto(q, usedHeroUrls);
    }

    if (candidate) {
      d.heroImage = { src: candidate, alt: `${d.title}, ${d.state}` };
      if (d.image) d.image.src = candidate;
      if (d.seo) d.seo.ogImage = candidate;
      usedHeroUrls.add(candidate);
      reassigned++;
      fs.writeFileSync(path.join(DEST_DIR, `${d.slug}.json`), JSON.stringify(d, null, 2));
    }
  }

  console.log(`Reassigned ${reassigned} duplicate hero images.`);
  console.log(`Total unique hero images now: ${usedHeroUrls.size} / ${destinations.length} (${(usedHeroUrls.size / destinations.length * 100).toFixed(2)}%)`);
}

run().catch(console.error);
