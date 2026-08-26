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

const TOP_SLUGS = [
  'ladakh', 'goa', 'manali', 'udaipur', 'varanasi', 'coorg', 'rishikesh', 'darjeeling',
  'hampi', 'spiti', 'jaisalmer', 'munnar', 'ooty', 'shimla', 'jaipur', 'alleppey',
  'kodaikanal', 'pondicherry', 'gokarna', 'agra', 'amritsar', 'shillong', 'gangtok',
  'mysore', 'cherrapunji', 'kaziranga', 'kanatal', 'dhanushkodi', 'chembra-peak',
  'bangaram-island', 'gurez-valley', 'hanle', 'jibhi', 'loktak-lake', 'dhanaulti',
  'mandu', 'daringbadi', 'andaman-nicobar', 'havelock-island', 'neil-island'
];

async function getBestPhoto(query) {
  try {
    const u = await unsplash.search(query, { limit: 5 });
    if (u && u.length > 0 && u[0].url) return u[0].url;
  } catch (e) {}
  try {
    const p = await pexels.search(query, { limit: 5 });
    if (p && p.length > 0 && p[0].url) return p[0].url;
  } catch (e) {}
  return null;
}

async function getBestGallery(query, count = 5) {
  const list = [];
  try {
    const u = await unsplash.search(query, { limit: count * 2 });
    (u || []).forEach(x => { if (x.url && list.length < count) list.push(x.url); });
  } catch (e) {}
  if (list.length < count) {
    try {
      const p = await pexels.search(query, { limit: count * 2 });
      (p || []).forEach(x => { if (x.url && list.length < count && !list.includes(x.url)) list.push(x.url); });
    } catch (e) {}
  }
  return list;
}

async function run() {
  console.log(`Enriching top destinations with latest HD photography...`);

  for (const slug of TOP_SLUGS) {
    const destPath = path.join(DEST_DIR, `${slug}.json`);
    if (!fs.existsSync(destPath)) continue;

    const d = JSON.parse(fs.readFileSync(destPath, 'utf8'));
    console.log(`Upgrading ${d.title} (${slug})...`);

    const q = `${d.title} ${d.state} travel landscape`;
    const heroUrl = await getBestPhoto(q) || await getBestPhoto(`${d.title} India`);
    const galleryUrls = await getBestGallery(`${d.title} ${d.state}`, 5);

    if (heroUrl) {
      d.heroImage = { src: heroUrl, alt: `${d.title}, ${d.state}` };
      if (d.seo) d.seo.ogImage = heroUrl;
      if (d.image) d.image.src = heroUrl;
    }

    if (galleryUrls.length >= 3) {
      d.gallery = galleryUrls.map((src, i) => ({ src, alt: `${d.title} photo ${i + 1}` }));
    }

    // Top places upgrade
    if (Array.isArray(d.topPlaces)) {
      for (let pIdx = 0; pIdx < Math.min(d.topPlaces.length, 6); pIdx++) {
        const p = d.topPlaces[pIdx];
        const pQuery = `${p.name} ${d.title} ${d.state}`;
        const pPhoto = await getBestPhoto(pQuery) || (d.gallery[pIdx % d.gallery.length] && d.gallery[pIdx % d.gallery.length].src);
        if (pPhoto) {
          p.image = { src: pPhoto, alt: p.name };
          p.photos = [pPhoto];
        }
      }
    }

    fs.writeFileSync(destPath, JSON.stringify(d, null, 2));
  }

  console.log('Top destinations upgraded to latest HD photography!');
}

run().catch(console.error);
