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

const CURATED_SEARCHES = {
  'ladakh': 'Ladakh Himalayas mountain',
  'goa': 'Goa beach ocean palm trees',
  'manali': 'Manali Himalayas snow mountain',
  'udaipur': 'Udaipur palace lake',
  'varanasi': 'Varanasi ghats ganges river',
  'coorg': 'Coorg coffee estate waterfalls nature',
  'rishikesh': 'Rishikesh ganga river suspension bridge',
  'darjeeling': 'Darjeeling tea garden kanchenjunga mountain',
  'hampi': 'Hampi temple ruins boulders karnataka',
  'spiti': 'Spiti valley himachal monastery',
  'jaisalmer': 'Jaisalmer fort thar desert rajasthan',
  'munnar': 'Munnar tea gardens hills kerala',
  'ooty': 'Ooty nilgiri hills lake tea estate',
  'shimla': 'Shimla ridge mall road snow hills',
  'jaipur': 'Hawa Mahal Jaipur Rajasthan palace',
  'alleppey': 'Alleppey houseboat backwaters kerala',
  'kodaikanal': 'Kodaikanal lake pine forest hills',
  'pondicherry': 'Pondicherry french quarter beach promenade',
  'gokarna': 'Gokarna om beach karnataka coast',
  'agra': 'Taj Mahal Agra monument sunrise',
  'amritsar': 'Golden Temple Amritsar punjab illuminated',
  'shillong': 'Shillong meghalaya hills waterfalls',
  'gangtok': 'Gangtok sikkim himalayas mountain view',
  'mysore': 'Mysore Palace karnataka illuminated architecture',
  'cherrapunji': 'Cherrapunji living root bridge waterfalls meghalaya',
  'kaziranga': 'Kaziranga national park assam rhino wildlife',
  'kanatal': 'Kanatal uttarakhand forest mountain view',
  'dhanushkodi': 'Dhanushkodi ghost town beach ruins rameshwaram',
  'chembra-peak': 'Chembra peak wayanad heart lake kerala',
  'bangaram-island': 'Bangaram island lakshadweep turquoise lagoon coral',
  'gurez-valley': 'Gurez valley kashmir habba khatoon mountain river',
  'hanle': 'Hanle ladakh dark sky observatory starry night',
  'jibhi': 'Jibhi tirthan valley pine forest stream cottage',
  'loktak-lake': 'Loktak lake phumdis floating islands manipur',
  'dhanaulti': 'Dhanaulti eco park deodar forest hills',
  'mandu': 'Mandu jahaz mahal madhya pradesh fort',
  'daringbadi': 'Daringbadi kashmir of odisha pine forest hills',
  'havelock-island': 'Radhanagar beach havelock island andaman turquoise sea'
};

async function getCinematicPhotos(query) {
  let list = [];
  try {
    const u = await unsplash.search(query, { limit: 10 });
    (u || []).forEach(x => { if (x.url && !list.includes(x.url)) list.push(x.url); });
  } catch (e) {}
  try {
    const p = await pexels.search(query, { limit: 10 });
    (p || []).forEach(x => { if (x.url && !list.includes(x.url)) list.push(x.url); });
  } catch (e) {}
  return list;
}

async function run() {
  console.log('Applying latest high-definition curated photography...');

  for (const [slug, query] of Object.entries(CURATED_SEARCHES)) {
    const destPath = path.join(DEST_DIR, `${slug}.json`);
    if (!fs.existsSync(destPath)) continue;

    const d = JSON.parse(fs.readFileSync(destPath, 'utf8'));
    console.log(`Fetching 4K latest photography for ${d.title} (${query})...`);

    const photos = await getCinematicPhotos(query);
    if (photos.length > 0) {
      // Set Hero
      d.heroImage = { src: photos[0], alt: `${d.title}, ${d.state}` };
      if (d.seo) d.seo.ogImage = photos[0];
      if (d.image) d.image.src = photos[0];

      // Set Gallery
      const galleryCount = Math.min(photos.length, 5);
      d.gallery = photos.slice(0, galleryCount).map((src, idx) => ({
        src,
        alt: `${d.title} photo ${idx + 1}`
      }));

      // Set Top Places
      if (Array.isArray(d.topPlaces)) {
        d.topPlaces.forEach((p, pIdx) => {
          const placePhoto = photos[(pIdx + 1) % photos.length] || photos[0];
          p.image = { src: placePhoto, alt: p.name };
          p.photos = [placePhoto];
        });
      }

      fs.writeFileSync(destPath, JSON.stringify(d, null, 2));
      console.log(`Updated ${d.title} with ${photos.length} latest HD photos.`);
    }
  }

  console.log('All curated top destinations updated with latest 4K/HD photography!');
}

run().catch(console.error);
