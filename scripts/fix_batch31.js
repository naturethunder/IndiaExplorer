/**
 * Batch 31 - Image Replacement Script
 * Destinations: 9 temples, churches, monasteries
 * Source: Pexels API (primary), Unsplash (fallback)
 * Rules: 5 unique HD gallery images, 3 unique photos per place, 0 duplicates, 0 Wikimedia
 */

const fs = require('fs');
const https = require('https');

const PEXELS_API_KEY = 'jGjuzCz3RjIGd17EEfwO00QafPWl7jpe7XM4hFKQ8h95lMNj459WfJ5c';
const UNSPLASH_KEY = 'b5SJtVH8cpSj584Voko6hCJIP8XfBX15M693dDqMh4o';

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const options = {
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: 'GET',
      headers: { 'User-Agent': 'ExploreDesh/1.0', ...headers }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, data: {} }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function searchPexels(query, count = 15) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;
  const res = await httpGet(url, { Authorization: PEXELS_API_KEY });
  if (res.status !== 200) return [];
  return (res.data.photos || []).map(p => ({
    src: p.src.large2x || p.src.original,
    alt: p.alt || query,
    width: p.width
  })).filter(p => p.width >= 1280);
}

async function searchUnsplash(query, count = 15) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;
  const res = await httpGet(url, { Authorization: `Client-ID ${UNSPLASH_KEY}` });
  if (res.status !== 200) return [];
  return (res.data.results || []).map(p => ({
    src: `${p.urls.raw}&auto=format&fit=crop&w=1280&q=80`,
    alt: (p.alt_description || query),
    width: p.width
  })).filter(p => p.width >= 1280);
}

async function getUniquePhotos(queries, needed, globalUsed) {
  const results = [];
  for (const q of queries) {
    if (results.length >= needed) break;
    let photos = await searchPexels(q, 20);
    if (photos.length < 3) {
      const u = await searchUnsplash(q, 10);
      photos = [...photos, ...u];
    }
    for (const p of photos) {
      if (results.length >= needed) break;
      if (!globalUsed.has(p.src)) {
        results.push(p);
        globalUsed.add(p.src);
      }
    }
  }
  return results;
}

async function fixDestination(slug, destTitle, state, galleryQueries, placeQueries) {
  const filePath = `data/destinations/${slug}.json`;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const places = data.places || data.topPlaces || [];
  const globalUsed = new Set();

  console.log(`\n[${slug}] Starting... (${places.length} places)`);

  // Gallery: 5 unique HD images
  const galleryPhotos = await getUniquePhotos(galleryQueries, 5, globalUsed);
  if (galleryPhotos.length < 5) {
    console.log(`  WARNING: Only got ${galleryPhotos.length}/5 gallery photos`);
  }

  const newGallery = galleryPhotos.map((p, i) => ({
    src: p.src,
    alt: p.alt || `${destTitle} - view ${i+1}`,
    caption: i === 0 ? `${destTitle}, ${state}` : `${destTitle} - ${state}`
  }));

  if (newGallery.length > 0) {
    data.heroImage = { src: newGallery[0].src, alt: newGallery[0].alt };
    data.gallery = newGallery;
    if (data.seo) data.seo.ogImage = newGallery[0].src;
    if (data.image) data.image = newGallery[0].src;
  }

  // Places: 3 unique photos each
  for (let i = 0; i < places.length; i++) {
    const pl = places[i];
    const plName = pl.name || pl.title || `Place ${i+1}`;
    const queries = placeQueries[i] || [plName + ' ' + state, state + ' temple architecture', state + ' landscape'];
    const plPhotos = await getUniquePhotos(queries, 4, globalUsed); // 1 cover + 3 photos
    if (plPhotos.length >= 1) {
      if (pl.image) pl.image = { src: plPhotos[0].src, alt: plPhotos[0].alt || plName };
      if (pl.cover !== undefined) pl.cover = plPhotos[0].src;
      pl.photos = plPhotos.slice(1, 4).map(p => p.src);
      if (pl.photos.length < 3) {
        console.log(`  WARNING: Place "${plName}" only got ${pl.photos.length}/3 photos`);
      }
    }
  }

  if (data.places) data.places = places;
  else if (data.topPlaces) data.topPlaces = places;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[${slug}] DONE. Gallery=${newGallery.length}, UsedURLs=${globalUsed.size}`);
}

async function main() {
  // Run all 9 destinations in parallel
  await Promise.all([

    fixDestination(
      'beeramgunta-poleramma-temple',
      'Beeramgunta Poleramma Temple',
      'Andhra Pradesh',
      ['Hindu temple Andhra Pradesh architecture', 'Telugu temple gopuram', 'Andhra Pradesh sacred temple', 'Indian goddess temple', 'South India temple festival'],
      [
        ['Damegunta Andhra Pradesh village', 'Andhra Pradesh rural landscape'],
        ['Vidavalur Andhra Pradesh', 'Andhra Pradesh farmland'],
        ['Kodavalur temple Andhra Pradesh', 'Andhra Pradesh scenic view']
      ]
    ),

    fixDestination(
      'sri-sri-nookambika-ammavari-temple',
      'Sri Sri Nookambika Ammavari Temple',
      'Andhra Pradesh',
      ['Anakapalli temple Andhra Pradesh', 'Hindu goddess temple Visakhapatnam', 'Telugu Hindu temple architecture', 'Indian sacred temple gopuram', 'Andhra Pradesh temple festival'],
      [
        ['Narsipatnam Andhra Pradesh landscape', 'Andhra Pradesh hills nature'],
        ['Paderu tribal area Andhra Pradesh', 'Eastern Ghats hills Andhra Pradesh'],
        ['Anakapalli city Andhra Pradesh', 'Visakhapatnam Andhra Pradesh'],
        ['Anakapalli mandal Andhra Pradesh', 'Andhra Pradesh village life'],
        ['Anakapalli town market', 'Andhra Pradesh town center'],
        ['Bowluvada Andhra Pradesh', 'Andhra Pradesh rural village'],
        ['Golagam Andhra Pradesh', 'Andhra Pradesh countryside'],
        ['Thummapala Andhra Pradesh', 'Andhra Pradesh scenic village']
      ]
    ),

    fixDestination(
      'kotasattemma-temple-nidadavolu',
      'Kotasattemma Temple Nidadavolu',
      'Andhra Pradesh',
      ['Nidadavolu temple Andhra Pradesh', 'Rajahmundry temple East Godavari', 'Godavari river Andhra Pradesh', 'Telugu temple East Godavari district', 'Hindu temple Andhra Pradesh'],
      [
        ['Rajahmundry East Godavari Andhra Pradesh', 'Rajahmundry city'],
        ['Dowleswaram barrage Godavari river', 'Dowleswaram dam Andhra Pradesh'],
        ['Bommuru Andhra Pradesh', 'East Godavari village'],
        ['Vullithota East Godavari village', 'Andhra Pradesh rural landscape'],
        ['Godavari Bridge Rajahmundry', 'Godavari river bridge'],
        ['Gandhipuram East Godavari', 'Andhra Pradesh town'],
        ['Rajamahendravaram bus station city', 'Rajahmundry city Andhra Pradesh'],
        ['Godavari River scenic view', 'Godavari river sunset']
      ]
    ),

    fixDestination(
      'st-joseph-s-syro-malabar-catholic-church-meenkunnam',
      "St. Joseph's Syro-Malabar Catholic Church Meenkunnam",
      'Kerala',
      ['Kerala Catholic church architecture', 'Syro-Malabar church Kerala', 'Kerala Christian church heritage', 'Kerala church colonial architecture', 'Ernakulam Kerala church'],
      [
        ['Meenkunnam Kerala village', 'Kerala backwaters village'],
        ["St Mary's Church Kerala architecture", 'Kerala heritage church'],
        ['Arakuzha Ernakulam Kerala', 'Kerala church Ernakulam'],
        ['Arakuzha Kerala village', 'Kerala nature greenery'],
        ['Marady Kerala church village', 'Kerala church village'],
        ['Muvattupuzha Kerala river', 'Kerala river landscape'],
        ['Perumpalloor Kerala village', 'Kerala village church'],
        ['Areekkal Waterfalls Kerala', 'Kerala waterfall nature']
      ]
    ),

    fixDestination(
      'sacred-heart-forane-church',
      'Sacred Heart Forane Church',
      'Kerala',
      ['Kerala Catholic church architecture', 'Kerala colonial church heritage', 'Kerala Christian church', 'Kozhikode Kerala church', 'Kerala church scenery'],
      [
        ['Kattippara Kozhikode Kerala hills', 'Wayanad hills Kerala'],
        ['Thiruvambady Kerala temple', 'Kerala religious site'],
        ['Mukkam Kozhikode Kerala', 'Kozhikode Kerala town'],
        ['Kerala river weir dam scenic', 'Kerala water reservoir'],
        ["St Mary's Orthodox Church Kerala", 'Kerala orthodox church'],
        ['Maikave Kerala village nature', 'Kerala greenery landscape'],
        ['Maikave Syriac Church Kerala', 'Kerala church heritage'],
        ['Poovaranthode Kerala village', 'Kerala countryside scenery']
      ]
    ),

    fixDestination(
      'kottarakkara-sree-mahaganapathi-kshethram',
      'Kottarakkara Sree Mahaganapathi Kshethram',
      'Kerala',
      ['Ganapathi temple Kerala architecture', 'Kollam Kerala Hindu temple', 'Kerala temple festival Thrissur', 'South India temple gopuram Kerala', 'Hindu Ganesha temple India'],
      [
        ['Mylom Kollam Kerala village', 'Kerala rural village landscape'],
        ['Kerala Pentecostal church Christian', 'Kerala Christian community'],
        ['Thrikkannamangal Kollam Kerala', 'Kollam Kerala landscape'],
        ['Kottarakkara town Kollam Kerala', 'Kottarakkara Kerala'],
        ['Neduvathoor Kollam Kerala', 'Kerala village countryside'],
        ['Padinjaretheruvu Kerala', 'Kerala traditional village'],
        ['Indilayappan temple Kerala', 'Kerala Hindu temple architecture'],
        ['Vendar Kollam Kerala', 'Kerala backwater landscape']
      ]
    ),

    fixDestination(
      'shatrughna-temple',
      'Shatrughna Temple',
      'Kerala',
      ['Hindu temple Kerala architecture', 'Kerala temple Thrissur', 'Mukundapuram temple Kerala', 'South India temple gopuram', 'Kerala sacred temple'],
      [
        ['Vadakkumkara Thrissur Kerala temple', 'Thrissur Kerala landscape'],
        ['Aripalam Thrissur Kerala', 'Kerala rural scenic'],
        ['Padiyur Thrissur Kerala', 'Kerala paddy fields'],
        ['Vadakkumkara Kerala village', 'Kerala greenery village'],
        ['Chamakunnu Kerala', 'Kerala nature landscape'],
        ["St Mary's Church Cheloor Kerala", 'Kerala church village'],
        ['Vellangallur panchayath Kerala', 'Kerala village landscape'],
        ['Cheloor Thrissur Kerala', 'Thrissur district Kerala']
      ]
    ),

    fixDestination(
      'tingmosgang-monastery',
      'Tingmosgang Monastery',
      'Ladakh',
      ['Ladakh Buddhist monastery mountains', 'Tingmosgang Ladakh gompa', 'Himalayan monastery white walls', 'Ladakh landscape monastery', 'Buddhist monastery Leh Ladakh'],
      [
        ['Temisgam Ladakh village monastery', 'Ladakh mountain village'],
        ['Skinlingyong Ladakh scenic', 'Ladakh remote village mountains'],
        ['Nurla Ladakh Indus river', 'Ladakh Indus valley'],
        ['Tia Leh Ladakh village', 'Ladakh highland village landscape'],
        ['Domkhar Ladakh village', 'Ladakh remote mountain village'],
        ['Hemis Shukpachan Ladakh', 'Ladakh apricot village monastery'],
        ['Khalatse Ladakh Indus valley', 'Ladakh river canyon']
      ]
    ),

    fixDestination(
      'karsha-monastery',
      'Karsha Monastery',
      'Ladakh',
      ['Karsha monastery Zanskar Ladakh', 'Zanskar valley Buddhist gompa', 'Ladakh monastery white walls mountains', 'Himalayan monastery Zanskar', 'Buddhist monastery Ladakh Himalaya'],
      [
        ['Stongdey monastery Zanskar Ladakh', 'Zanskar monastery hilltop'],
        ['Stongdey Zanskar village monastery', 'Zanskar valley landscape'],
        ['Padum Zanskar Ladakh town', 'Padum Zanskar valley'],
        ['Sani monastery Zanskar Ladakh', 'Sani temple Zanskar valley']
      ]
    )

  ]);

  console.log('\n✅ All 9 destinations processed!');
}

main().catch(console.error);
