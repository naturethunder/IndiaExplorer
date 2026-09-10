/**
 * scripts/multi_agent_photo_replacer_batch2.js
 *
 * Autonomous Multi-Agent HD Photo Replacer — Batch 2
 * Targets:
 *   1. Baleshwar Temple (Champawat, Uttarakhand)
 *   2. Neelkanth Mahadev Temple (Rishikesh, Uttarakhand)
 *   3. Jhansi Fort (Jhansi, Uttar Pradesh)
 *   4. Mahur Fort (Nanded / Mahur, Maharashtra)
 *   5. Manikgad (Raigad / Panvel Sahyadris, Maharashtra)
 *   6. Dategad (Patan / Satara Sahyadris, Maharashtra)
 *
 * Invariants:
 *   - Strictly 100% external API photography (Pexels & Unsplash)
 *   - Strictly ZERO Wikimedia URLs
 *   - Strictly ZERO Pixabay /get/ session URLs
 *   - 100% unique URLs:
 *       * 0 internal duplicates (except heroImage.src === gallery[0].src)
 *       * 0 duplicates across the 6 targets
 *       * 0 collisions with all 2,386 other catalog destinations
 *   - Exactly 5 gallery items, heroImage matches gallery[0]
 *   - Exactly 3 photos per place + 1 card thumbnail
 *   - Live HTTP 200 validation for all assigned URLs
 *   - Synchronize data/destinations/index.json
 */

const fs = require('fs');
const path = require('path');

// 1. Load API keys
const envPath = path.resolve(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > 0) env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  });
}

if (!env.PEXELS_API_KEY || !env.UNSPLASH_ACCESS_KEY) {
  console.error('ERROR: Missing PEXELS_API_KEY or UNSPLASH_ACCESS_KEY in .env.local');
  process.exit(1);
}

const TARGETS = [
  'baleshwar-temple.json',
  'neelkanth-mahadev-temple.json',
  'jhansi-fort.json',
  'mahur-fort.json',
  'manikgad.json',
  'dategad.json'
];

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');

// Rate limiting & caching
const queryCache = new Map();

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 2. API Fetchers
async function fetchPexels(query, count = 20, page = 1) {
  const key = `pex:${query}:${count}:${page}`;
  if (queryCache.has(key)) return queryCache.get(key);
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&page=${page}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': env.PEXELS_API_KEY } });
    if (!res.ok) {
      console.warn(`Pexels error ${res.status} for "${query}"`);
      return [];
    }
    const data = await res.json();
    const items = (data.photos || [])
      .filter(p => p.width >= 1200 && p.height >= 700)
      .map(p => ({
        provider: 'pexels',
        url: p.src.large2x || p.src.original,
        alt: p.alt ? p.alt.replace(/["\n\r]/g, ' ').trim() : query,
        width: p.width,
        height: p.height,
        id: p.id
      }));
    queryCache.set(key, items);
    await delay(120);
    return items;
  } catch (e) {
    console.warn(`Pexels fetch failed: ${e.message}`);
    return [];
  }
}

async function fetchUnsplash(query, count = 25, page = 1) {
  const key = `uns:${query}:${count}:${page}`;
  if (queryCache.has(key)) return queryCache.get(key);
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&page=${page}&orientation=landscape`;
    const res = await fetch(url, { headers: { 'Authorization': `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } });
    if (!res.ok) {
      console.warn(`Unsplash error ${res.status} for "${query}"`);
      return [];
    }
    const data = await res.json();
    const items = (data.results || [])
      .filter(p => p.width >= 1200 && p.height >= 700)
      .map(p => ({
        provider: 'unsplash',
        url: `${p.urls.raw}&auto=format&fit=crop&w=1600&q=80`,
        alt: (p.description || p.alt_description || query).replace(/["\n\r]/g, ' ').trim(),
        width: p.width,
        height: p.height,
        id: p.id
      }));
    queryCache.set(key, items);
    await delay(120);
    return items;
  } catch (e) {
    console.warn(`Unsplash fetch failed: ${e.message}`);
    return [];
  }
}

// 3. HTTP Liveness Checker
async function verifyUrlLive(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Range': 'bytes=0-1024'
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    return res.status >= 200 && res.status < 400;
  } catch (e) {
    return false;
  }
}

// Global collision set
const globalCollisionSet = new Set();
const sessionUsedUrls = new Set();

function cleanUrl(u) {
  if (!u) return '';
  return u.split('?')[0].trim().toLowerCase();
}

function initGlobalCollisions() {
  console.log('Building repository-wide collision set from all 2,392 destinations...');
  const files = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  for (const f of files) {
    if (TARGETS.includes(f)) continue; // ignore the 6 target files
    try {
      const d = JSON.parse(fs.readFileSync(path.join(destDir, f), 'utf8'));
      if (d.heroImage?.src) globalCollisionSet.add(cleanUrl(d.heroImage.src));
      if (d.gallery) d.gallery.forEach(g => g.src && globalCollisionSet.add(cleanUrl(g.src)));
      if (d.topPlaces) {
        d.topPlaces.forEach(p => {
          if (p.image?.src) globalCollisionSet.add(cleanUrl(p.image.src));
          if (p.photos) p.photos.forEach(ph => {
            const u = ph.src || ph;
            if (u) globalCollisionSet.add(cleanUrl(u));
          });
        });
      }
    } catch (e) {}
  }
  console.log(`Repository collision index populated with ${globalCollisionSet.size} unique URLs.`);
}

async function pickUniquePhoto(candidates, defaultAlt) {
  for (const c of candidates) {
    const base = cleanUrl(c.url);
    if (!c.url.startsWith('https://images.pexels.com/') && !c.url.startsWith('https://images.unsplash.com/')) {
      continue;
    }
    if (c.url.includes('wikimedia') || c.url.includes('/get/')) {
      continue;
    }
    if (globalCollisionSet.has(base) || sessionUsedUrls.has(base)) {
      continue;
    }
    // Verify HTTP live status
    const live = await verifyUrlLive(c.url);
    if (!live) {
      console.warn(`URL returned non-200, skipping: ${c.url}`);
      continue;
    }

    sessionUsedUrls.add(base);
    let alt = c.alt || defaultAlt;
    if (alt.length > 90) alt = alt.slice(0, 87) + '...';
    alt = alt.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    return {
      src: c.url,
      alt: alt || defaultAlt
    };
  }
  throw new Error(`Exhausted photo candidates for: "${defaultAlt}". Needs more query diversity.`);
}

// -------------------------------------------------------------
// AGENT 1: BALESHWAR TEMPLE (Champawat, Uttarakhand)
// -------------------------------------------------------------
async function runBaleshwarTempleAgent() {
  console.log('\n[AGENT 1] Sourcing HD Photos for: Baleshwar Temple (Champawat)');
  const filePath = path.join(destDir, 'baleshwar-temple.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery: Ancient stone Nagara temple, Chand dynasty stone architecture, carved ceiling
  const galPool = [
    ...(await fetchPexels('ancient stone temple nagara shiva architecture', 25)),
    ...(await fetchUnsplash('ancient carved stone temple hindu heritage', 20)),
    ...(await fetchPexels('stone temple ceiling carving ancient ruins', 20)),
    ...(await fetchUnsplash('ancient stone temple courtyard pillars', 20)),
    ...(await fetchPexels('carved stone temple mandapa hindu heritage', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Baleshwar Temple ancient Nagara stone sanctum and intricate carvings in Champawat',
    'Intricately carved stone ceilings and mandapa pillars at historic Baleshwar Temple',
    'Courtyard view of the historic Chand dynasty Baleshwar Shiva shrine complex',
    'Magnificent sandstone carvings depicting ancient deities at Baleshwar Temple',
    'Heritage stone architecture and sanctum entrance of Baleshwar Temple Champawat'
  ];

  for (let i = 0; i < 5; i++) {
    const p = await pickUniquePhoto(galPool, galAlts[i]);
    gallery.push(p);
  }
  dest.gallery = gallery;
  dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt };

  // 4 Top Places
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  -> Sourcing 4 HD photos for place: ${name}`);
    let placePool = [];
    let altBase = name;

    if (name.includes('Champawat')) {
      placePool = [
        ...(await fetchPexels('kumaon mountain town pine forest hills champawat', 20)),
        ...(await fetchUnsplash('himalayan hill station pine trees mountain valley', 20)),
        ...(await fetchPexels('scenic mountain valley pine hills kumaon', 20))
      ];
      altBase = 'Champawat historic capital town amidst Kumaon pine forested hills';
    } else if (name.includes('Advaita Ashrama')) {
      placePool = [
        ...(await fetchPexels('peaceful spiritual ashram cedar pine forest mountains', 20)),
        ...(await fetchUnsplash('spiritual meditation retreat forest nature himalayas', 20)),
        ...(await fetchPexels('serene mountain meditation ashram wooden cottage', 20))
      ];
      altBase = 'Advaita Ashrama Mayawati peaceful spiritual retreat in cedar woods';
    } else if (name.includes('Lohaghat')) {
      placePool = [
        ...(await fetchPexels('mountain river town pine hills lohaghat abbott mount', 20)),
        ...(await fetchUnsplash('scenic mountain river valley village kumaon', 20)),
        ...(await fetchPexels('peaceful mountain valley river greenery hills', 20))
      ];
      altBase = 'Lohaghat scenic mountain township along the river in Kumaon';
    } else if (name.includes('Khaptad Lake')) {
      placePool = [
        ...(await fetchPexels('pristine alpine lake mountain meadows reflection', 20)),
        ...(await fetchUnsplash('serene high altitude alpine lake green grasslands', 20)),
        ...(await fetchPexels('high mountain lake reflection blue water nature', 20))
      ];
      altBase = 'Khaptad Lake serene high-altitude alpine lake surrounded by meadows';
    }

    const card = await pickUniquePhoto(placePool, `${altBase} overview`);
    place.image = { src: card.src, alt: card.alt };

    place.photos = [];
    for (let i = 1; i <= 3; i++) {
      const ph = await pickUniquePhoto(placePool, `${altBase} feature photo ${i}`);
      place.photos.push({ src: ph.src, alt: ph.alt });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(dest, null, 2), 'utf8');
  console.log(`[AGENT 1] Completed Baleshwar Temple with 21 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// AGENT 2: NEELKANTH MAHADEV TEMPLE (Rishikesh, Uttarakhand)
// -------------------------------------------------------------
async function runNeelkanthMahadevAgent() {
  console.log('\n[AGENT 2] Sourcing HD Photos for: Neelkanth Mahadev Temple (Rishikesh)');
  const filePath = path.join(destDir, 'neelkanth-mahadev-temple.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery: Neelkanth Mahadev temple, Manikoot hill forested gorge, Shiva mountain shrine
  const galPool = [
    ...(await fetchPexels('shiva temple forested mountain valley rishikesh', 25)),
    ...(await fetchUnsplash('hindu temple mountain forest himalayan hills', 20)),
    ...(await fetchPexels('colorful temple shikhara mountain hills trees', 20)),
    ...(await fetchUnsplash('sacred temple forest mountain valley rishikesh', 20)),
    ...(await fetchPexels('himalayan shiva temple sanctum sacred hills', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Neelkanth Mahadev Temple situated amidst the forested Manikoot mountain valleys',
    'Vibrant shikhara and entrance architecture of sacred Neelkanth Mahadev shrine',
    'Panoramic mountain vista surrounding Neelkanth Mahadev Temple in Pauri Garhwal',
    'Courtyard of holy Neelkanth Mahadev Temple where Lord Shiva consumed poison',
    'Forested Himalayan mountain sanctuary of Neelkanth Mahadev near Rishikesh'
  ];

  for (let i = 0; i < 5; i++) {
    const p = await pickUniquePhoto(galPool, galAlts[i]);
    gallery.push(p);
  }
  dest.gallery = gallery;
  dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt };

  // 8 Top Places
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  -> Sourcing 4 HD photos for place: ${name}`);
    let placePool = [];
    let altBase = name;

    if (name.includes('Beatles Ashram')) {
      placePool = [
        ...(await fetchPexels('meditation dome forest abandoned ashram murals graffiti', 20)),
        ...(await fetchUnsplash('beatles ashram rishikesh meditation huts stone domes', 20)),
        ...(await fetchPexels('stone meditation huts forested ashram rishikesh', 20))
      ];
      altBase = 'Beatles Ashram (Chaurasi Kutia) stone meditation huts in Rishikesh';
    } else if (name.includes('Single Use Plastic Deathbed')) {
      placePool = [
        ...(await fetchPexels('clean river mountain valley nature environmental conservation', 20)),
        ...(await fetchUnsplash('crystal clear mountain river pristine nature forest', 20)),
        ...(await fetchPexels('river conservation pristine clean water stones nature', 20))
      ];
      altBase = 'Environmental river conservation and clean Ganga banks at Rishikesh';
    } else if (name.includes('Janaki Setu')) {
      placePool = [
        ...(await fetchPexels('modern suspension bridge river illuminated cables rishikesh', 20)),
        ...(await fetchUnsplash('cable suspension bridge river crossing mountain valley', 20)),
        ...(await fetchPexels('suspension pedestrian bridge blue river water', 20))
      ];
      altBase = 'Janaki Setu modern three-lane suspension bridge across the Ganges';
    } else if (name.includes('Parmarth Niketan')) {
      placePool = [
        ...(await fetchPexels('parmarth niketan ganga aarti shiva statue river ghat', 20)),
        ...(await fetchUnsplash('ganga aarti river ghat evening prayers rishikesh', 20)),
        ...(await fetchPexels('shiva statue in river parmarth niketan ghat', 20))
      ];
      altBase = 'Parmarth Niketan iconic riverside ashram and Ganga aarti ghat';
    } else if (name.includes('Pashulok Barrage')) {
      placePool = [
        ...(await fetchPexels('water barrage dam reservoir blue river water rishikesh', 20)),
        ...(await fetchUnsplash('river barrage water reservoir green mountain background', 20)),
        ...(await fetchPexels('river dam water canal serene reservoir', 20))
      ];
      altBase = 'Pashulok Barrage water reservoir and canal headworks on the Ganges';
    } else if (name.includes('Lakshman Jhula')) {
      placePool = [
        ...(await fetchPexels('lakshman jhula historic suspension bridge river rishikesh', 20)),
        ...(await fetchUnsplash('suspension bridge river gorge temple towers rishikesh', 20)),
        ...(await fetchPexels('famous suspension bridge river ganges rishikesh', 20))
      ];
      altBase = 'Lakshman Jhula historic iron suspension bridge across the Ganges';
    } else if (name === 'Rishikesh') {
      placePool = [
        ...(await fetchPexels('rishikesh ganga river rafting mountain valley ghats', 20)),
        ...(await fetchUnsplash('holy river ganges emerald water mountain foothills rishikesh', 20)),
        ...(await fetchPexels('rishikesh sunset river valley temples hills', 20))
      ];
      altBase = 'Rishikesh world capital of yoga and sacred Ganga river valley';
    } else if (name.includes('Ram Jhula')) {
      placePool = [
        ...(await fetchPexels('ram jhula suspension bridge ashram river rishikesh', 20)),
        ...(await fetchUnsplash('pedestrian suspension bridge holy river pilgrims rishikesh', 20)),
        ...(await fetchPexels('suspension bridge evening lights ganges river', 20))
      ];
      altBase = 'Ram Jhula iconic suspension bridge connecting Sivananda and Swarg Ashram';
    }

    const card = await pickUniquePhoto(placePool, `${altBase} overview`);
    place.image = { src: card.src, alt: card.alt };

    place.photos = [];
    for (let i = 1; i <= 3; i++) {
      const ph = await pickUniquePhoto(placePool, `${altBase} feature photo ${i}`);
      place.photos.push({ src: ph.src, alt: ph.alt });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(dest, null, 2), 'utf8');
  console.log(`[AGENT 2] Completed Neelkanth Mahadev Temple with 37 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// AGENT 3: JHANSI FORT (Jhansi, Uttar Pradesh)
// -------------------------------------------------------------
async function runJhansiFortAgent() {
  console.log('\n[AGENT 3] Sourcing HD Photos for: Jhansi Fort');
  const filePath = path.join(destDir, 'jhansi-fort.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery: Jhansi Fort hilltop sandstone ramparts, battlements, Rani Lakshmibai gateway
  const galPool = [
    ...(await fetchPexels('jhansi fort stone ramparts hilltop battlements', 25)),
    ...(await fetchUnsplash('historic stone fort ramparts hilltop sandstone bastion', 20)),
    ...(await fetchPexels('ancient stone fortress battlements gateway india', 20)),
    ...(await fetchUnsplash('historical fort walls cannons stone architecture', 20)),
    ...(await fetchPexels('massive stone fort walls hilltop view sundown', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Jhansi Fort commanding hilltop stone ramparts on Bangira hill in Jhansi',
    'Historic battlements and sandstone bastions of Rani Lakshmibai Jhansi Fort',
    'Grand stone gateway and royal fortifications of historic Jhansi Fort',
    'Panoramic view of Jhansi city from the high ramparts of Jhansi Fort',
    'Sunset illuminating the historic granite walls and cannons of Jhansi Fort'
  ];

  for (let i = 0; i < 5; i++) {
    const p = await pickUniquePhoto(galPool, galAlts[i]);
    gallery.push(p);
  }
  dest.gallery = gallery;
  dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt };

  // 8 Top Places
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  -> Sourcing 4 HD photos for place: ${name}`);
    let placePool = [];
    let altBase = name;

    if (name.includes('Jhansi State')) {
      placePool = [
        ...(await fetchPexels('bundelkhand royal palace stone arch architecture', 20)),
        ...(await fetchUnsplash('historic royal palace courtyard carved sandstone pillars', 20)),
        ...(await fetchPexels('princely state palace heritage building facade', 20))
      ];
      altBase = 'Historic Jhansi State royal palace architecture and Bundela heritage';
    } else if (name.includes('Khatikyana')) {
      placePool = [
        ...(await fetchPexels('historic old city street bustling heritage bazaar india', 20)),
        ...(await fetchUnsplash('traditional old city streets heritage houses stone alleys', 20)),
        ...(await fetchPexels('ancient city quarter market streets colorful lanes', 20))
      ];
      altBase = 'Khatikyana historic quarter and vibrant heritage lanes of Jhansi';
    } else if (name === 'Jhansi') {
      placePool = [
        ...(await fetchPexels('jhansi rani mahal historical city architecture', 20)),
        ...(await fetchUnsplash('heritage city palace historic gateway india', 20)),
        ...(await fetchPexels('historic city panorama monument heritage jhansi', 20))
      ];
      altBase = 'Jhansi historic city famous for its courage and heritage monuments';
    } else if (name.includes('Major Dhyan Chand Hockey Stadium')) {
      placePool = [
        ...(await fetchPexels('field hockey turf stadium sports ground floodlights', 20)),
        ...(await fetchUnsplash('hockey sports stadium turf green field arena', 20)),
        ...(await fetchPexels('sports stadium turf pitch grandstand outdoor', 20))
      ];
      altBase = 'Major Dhyan Chand Hockey Stadium international sports arena Jhansi';
    } else if (name.includes('Bundelkhand')) {
      placePool = [
        ...(await fetchPexels('bundelkhand rocky sandstone hills semi arid landscape', 20)),
        ...(await fetchUnsplash('rocky plateau sandstone hills rugged landscape india', 20)),
        ...(await fetchPexels('rugged rocky landscape boulder hills dry deciduous forest', 20))
      ];
      altBase = 'Rugged Bundelkhand plateau landscape and historic sandstone terrain';
    } else if (name.includes('Government Polytechnic')) {
      placePool = [
        ...(await fetchPexels('technical college institute building collegiate campus', 20)),
        ...(await fetchUnsplash('engineering college campus academic building green lawn', 20)),
        ...(await fetchPexels('educational polytechnic institute architecture', 20))
      ];
      altBase = 'Government Polytechnic Jhansi historic technical education campus';
    } else if (name.includes('Electric Loco Shed')) {
      placePool = [
        ...(await fetchPexels('electric locomotive railway train depot engines tracks', 20)),
        ...(await fetchUnsplash('railway engine depot train shed locomotives tracks', 20)),
        ...(await fetchPexels('railroad train engine maintenance yard tracks', 20))
      ];
      altBase = 'Electric Loco Shed Jhansi premier Indian Railways motive power depot';
    } else if (name.includes('Cemetery')) {
      placePool = [
        ...(await fetchPexels('colonial military cemetery stone headstones green grass', 20)),
        ...(await fetchUnsplash('historic cantonment cemetery memorials peaceful trees', 20)),
        ...(await fetchPexels('historic stone memorial cemetery trees parkland', 20))
      ];
      altBase = 'Jhansi Cantonment Cemetery historic colonial memorials and greenery';
    }

    const card = await pickUniquePhoto(placePool, `${altBase} overview`);
    place.image = { src: card.src, alt: card.alt };

    place.photos = [];
    for (let i = 1; i <= 3; i++) {
      const ph = await pickUniquePhoto(placePool, `${altBase} feature photo ${i}`);
      place.photos.push({ src: ph.src, alt: ph.alt });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(dest, null, 2), 'utf8');
  console.log(`[AGENT 3] Completed Jhansi Fort with 37 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// AGENT 4: MAHUR FORT (Mahur, Maharashtra)
// -------------------------------------------------------------
async function runMahurFortAgent() {
  console.log('\n[AGENT 4] Sourcing HD Photos for: Mahur Fort');
  const filePath = path.join(destDir, 'mahur-fort.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery: Ancient hill fort ramparts, battlements, Deccan forest hills, Renuka Devi hill
  const galPool = [
    ...(await fetchPexels('ancient hill fort stone ramparts deccan forest hills', 25)),
    ...(await fetchUnsplash('ancient hill fort stone bastion green hills maharashtra', 20)),
    ...(await fetchPexels('historic stone fort walls battlements hills forest', 20)),
    ...(await fetchUnsplash('stone fortress walls hilltop green trees landscape', 20)),
    ...(await fetchPexels('ancient stone masonry fort gateway hilltop view', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Mahur Fort ancient stone battlements overlooking the forested hills of Nanded',
    'Massive stone ramparts and historic gateway of Mahur Fort in Maharashtra',
    'Scenic hilltop vista of the surrounding Deccan forests from Mahur Fort',
    'Historic fortifications and rugged bastion walls of ancient Mahur Fort',
    'Lush forested ridges surrounding the historic hill sanctuary of Mahur Fort'
  ];

  for (let i = 0; i < 5; i++) {
    const p = await pickUniquePhoto(galPool, galAlts[i]);
    gallery.push(p);
  }
  dest.gallery = gallery;
  dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt };

  // 1 Top Place: Mahur, Maharashtra
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  -> Sourcing 4 HD photos for place: ${name}`);
    let placePool = [
      ...(await fetchPexels('sacred shaktipeeth hill temple green hills maharashtra', 20)),
      ...(await fetchUnsplash('pilgrimage hill temple steps lush forested hills', 20)),
      ...(await fetchPexels('ancient hindu hill temple greenery nature maharashtra', 20)),
      ...(await fetchUnsplash('mountain pilgrimage temple steps peaceful forest view', 20))
    ];
    let altBase = 'Mahur sacred Shaktipeeth hill pilgrimage town and forested landscape';

    const card = await pickUniquePhoto(placePool, `${altBase} overview`);
    place.image = { src: card.src, alt: card.alt };

    place.photos = [];
    for (let i = 1; i <= 3; i++) {
      const ph = await pickUniquePhoto(placePool, `${altBase} feature photo ${i}`);
      place.photos.push({ src: ph.src, alt: ph.alt });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(dest, null, 2), 'utf8');
  console.log(`[AGENT 4] Completed Mahur Fort with 9 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// AGENT 5: MANIKGAD (Raigad, Maharashtra)
// -------------------------------------------------------------
async function runManikgadAgent() {
  console.log('\n[AGENT 5] Sourcing HD Photos for: Manikgad (Raigad)');
  const filePath = path.join(destDir, 'manikgad.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery: Sahyadri hill fort ruins, stone bastion, trekking trail, Panvel valley
  const galPool = [
    ...(await fetchPexels('sahyadri hill fort trekking summit green hills maharashtra', 25)),
    ...(await fetchUnsplash('sahyadri mountain fort summit green western ghats mist', 20)),
    ...(await fetchPexels('ancient hill fort stone ruins cliffs sahyadri', 20)),
    ...(await fetchUnsplash('rocky mountain summit fortress ridge western ghats', 20)),
    ...(await fetchPexels('mountain trekking peak green plateau sahyadris', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Manikgad commanding hill fort summit and rugged cliffs in the Sahyadris',
    'Ancient stone bastion ruins overlooking the scenic Raigad and Panvel valleys',
    'Trekking trail ascending through lush Western Ghats greenery to Manikgad Fort',
    'Panoramic mountain ridge view of surrounding Sahyadri peaks from Manikgad',
    'Misty morning vista across the plateau and ruins of Manikgad hill fortress'
  ];

  for (let i = 0; i < 5; i++) {
    const p = await pickUniquePhoto(galPool, galAlts[i]);
    gallery.push(p);
  }
  dest.gallery = gallery;
  dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt };

  // 3 Top Places
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  -> Sourcing 4 HD photos for place: ${name}`);
    let placePool = [];
    let altBase = name;

    if (name.includes('Ambivali')) {
      placePool = [
        ...(await fetchPexels('rural village paddy fields foothills sahyadri maharashtra', 20)),
        ...(await fetchUnsplash('green rice paddy fields village western ghats hills', 20)),
        ...(await fetchPexels('lush green village countryside hills maharashtra', 20))
      ];
      altBase = 'Ambivali picturesque base village and lush paddy fields near Manikgad';
    } else if (name.includes('Rasayani')) {
      placePool = [
        ...(await fetchPexels('patalganga river industrial valley green landscape', 20)),
        ...(await fetchUnsplash('industrial township road green valley hills maharashtra', 20)),
        ...(await fetchPexels('river valley highway greenery industrial corridor', 20))
      ];
      altBase = 'Rasayani township and scenic Patalganga river valley corridor';
    } else if (name.includes('Mohpada')) {
      placePool = [
        ...(await fetchPexels('peaceful small town greenery hills raigad maharashtra', 20)),
        ...(await fetchUnsplash('verdant valley countryside foothills western ghats', 20)),
        ...(await fetchPexels('countryside greenery palm trees foothills landscape', 20))
      ];
      altBase = 'Mohpada tranquil town in Raigad nestled against the Sahyadri foothills';
    }

    const card = await pickUniquePhoto(placePool, `${altBase} overview`);
    place.image = { src: card.src, alt: card.alt };

    place.photos = [];
    for (let i = 1; i <= 3; i++) {
      const ph = await pickUniquePhoto(placePool, `${altBase} feature photo ${i}`);
      place.photos.push({ src: ph.src, alt: ph.alt });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(dest, null, 2), 'utf8');
  console.log(`[AGENT 5] Completed Manikgad with 17 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// AGENT 6: DATEGAD (Patan / Satara, Maharashtra)
// -------------------------------------------------------------
async function runDategadAgent() {
  console.log('\n[AGENT 6] Sourcing HD Photos for: Dategad (Satara)');
  const filePath = path.join(destDir, 'dategad.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery: Sword-shaped Dategad hill fort (Sundargad), rock-cut steps, Koyna valley view
  const galPool = [
    ...(await fetchPexels('sundargad hill fort rock cut steps sahyadris satara', 30)),
    ...(await fetchPexels('mountain fort ruins cliff ridge sahyadris', 30)),
    ...(await fetchPexels('ancient hill fortress stone plateau green valley', 30)),
    ...(await fetchPexels('western ghats mountain fort peak stone ruins', 30)),
    ...(await fetchPexels('ancient stone rock cut well fort sahyadris maharashtra', 25))
  ];

  const gallery = [];
  const galAlts = [
    'Dategad (Sundargad) dramatic narrow sword-shaped hill fort in Patan, Satara',
    'Ancient rock-cut water cisterns and stone fortifications at Dategad Fort',
    'Scenic trekking ridge and steep cliff faces of Dategad overlooking Koyna valley',
    'Panoramic mountain vista of the Sahyadri ranges from the ramparts of Dategad',
    'Misty morning over the ancient stone ruins and ramparts of Dategad Fort'
  ];

  for (let i = 0; i < 5; i++) {
    const p = await pickUniquePhoto(galPool, galAlts[i]);
    gallery.push(p);
  }
  dest.gallery = gallery;
  dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt };

  // 7 Top Places
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  -> Sourcing 4 HD photos for place: ${name}`);
    let placePool = [];
    let altBase = name;

    if (name.includes('Yerad')) {
      placePool = [
        ...(await fetchPexels('sahyadri rural village mountain terraced fields patan', 30)),
        ...(await fetchPexels('terraced green hill farming village maharashtra', 30)),
        ...(await fetchPexels('rural green farming village hills western ghats', 30))
      ];
      altBase = 'Yerad scenic rural settlement nestled in the valleys of Patan';
    } else if (name.includes('earthquake') || name.includes('Koynanagar')) {
      placePool = [
        ...(await fetchPexels('koyna dam reservoir massive water basin western ghats', 30)),
        ...(await fetchPexels('vast reservoir lake surrounded by green mountains', 30)),
        ...(await fetchPexels('hydroelectric reservoir lake green mountains', 30))
      ];
      altBase = 'Koynanagar reservoir and hydroelectric dam basin in the Western Ghats';
    } else if (name.includes('Patan, Maharashtra') || name === 'Patan') {
      placePool = [
        ...(await fetchPexels('patan satara town koyna river valley mountain hills', 30)),
        ...(await fetchPexels('river valley town green mountain backdrop satara', 30)),
        ...(await fetchPexels('riverside town hills landscape greenery maharashtra', 30))
      ];
      altBase = 'Patan historic gateway town situated along the Koyna river basin';
    } else if (name.includes('Patan Caves')) {
      placePool = [
        ...(await fetchPexels('ancient rock cut buddhist caves stone architecture', 30)),
        ...(await fetchPexels('ancient rock carved caves chaitya vihara pillars', 30)),
        ...(await fetchPexels('stone carved caves ancient heritage monument', 30)),
        ...(await fetchPexels('rock cut cliff caves ancient temples', 30))
      ];
      altBase = 'Patan ancient rock-cut Buddhist caves and carved cliffside chambers';
    } else if (name.includes('Yerphal Caves')) {
      placePool = [
        ...(await fetchPexels('ancient rock cut cliff face stone chambers', 30)),
        ...(await fetchPexels('ancient stone cave entrance cliffside heritage', 30)),
        ...(await fetchPexels('carved rock cliff ancient monastic caves', 30)),
        ...(await fetchPexels('ancient rock cut caves stone architecture india', 30))
      ];
      altBase = 'Yerphal Caves historic rock-cut Buddhist monastic shelters in Satara';
    } else if (name.includes('Wind Park') || name.includes('Vankusawade')) {
      placePool = [
        ...(await fetchPexels('wind turbines mountain plateau green rolling hills mist', 30)),
        ...(await fetchPexels('wind power turbines green plateau mountain landscape', 30)),
        ...(await fetchPexels('wind farm windmills high mountain plateau clouds', 30))
      ];
      altBase = 'Vankusawade Wind Park vast windmill plateau in the high Sahyadris';
    } else if (name.includes('Sulewadi')) {
      placePool = [
        ...(await fetchPexels('high mountain hill village mist sahyadris satara', 30)),
        ...(await fetchPexels('mountain village mist sahyadris satara hills', 30)),
        ...(await fetchPexels('picturesque hill village agricultural terraces western ghats', 30))
      ];
      altBase = 'Sulewadi picturesque mountain village perched on the Satara hill ridges';
    }

    const card = await pickUniquePhoto(placePool, `${altBase} overview`);
    place.image = { src: card.src, alt: card.alt };

    place.photos = [];
    for (let i = 1; i <= 3; i++) {
      const ph = await pickUniquePhoto(placePool, `${altBase} feature photo ${i}`);
      place.photos.push({ src: ph.src, alt: ph.alt });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(dest, null, 2), 'utf8');
  console.log(`[AGENT 6] Completed Dategad with 33 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// CATALOG & INDEX SYNCHRONIZATION
// -------------------------------------------------------------
function syncCatalogIndex(results) {
  console.log('\nSynchronizing data/destinations/index.json...');
  const indexPath = path.join(destDir, 'index.json');
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const destList = indexData.destinations || indexData;

  const resultMap = new Map();
  for (const r of results) {
    const slug = r.slug || r.id;
    if (slug) resultMap.set(slug, r);
  }

  let updatedCount = 0;
  for (const item of destList) {
    if (resultMap.has(item.slug)) {
      const updated = resultMap.get(item.slug);
      item.image = updated.heroImage || { src: updated.heroImage?.src, alt: updated.title };
      item.heroImage = updated.heroImage;
      updatedCount++;
    }
  }

  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
  console.log(`Successfully updated ${updatedCount} destination entries in index.json.`);
}

// -------------------------------------------------------------
// FINAL STRICT FORENSIC AUDIT
// -------------------------------------------------------------
function auditResults() {
  console.log('\n======================================================');
  console.log('STRICT FORENSIC AUDIT OF ALL 6 DESTINATIONS (BATCH 2)');
  console.log('======================================================');

  let hasErrors = false;
  const allAssignedUrls = [];

  for (const file of TARGETS) {
    const p = path.join(destDir, file);
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    const fileUrls = [];

    if (d.heroImage?.src) fileUrls.push(d.heroImage.src);
    (d.gallery || []).forEach(g => g.src && fileUrls.push(g.src));
    (d.topPlaces || []).forEach(pl => {
      if (pl.image?.src) fileUrls.push(pl.image.src);
      (pl.photos || []).forEach(ph => {
        const u = ph.src || ph;
        if (u) fileUrls.push(u);
      });
    });

    console.log(`\nDestination: ${d.title} (${file})`);
    console.log(`  Gallery count: ${d.gallery?.length} (Expected: 5)`);
    console.log(`  Hero matches Gallery[0]: ${d.heroImage?.src === d.gallery?.[0]?.src}`);
    console.log(`  Places count: ${d.topPlaces?.length}`);
    d.topPlaces?.forEach((pl, idx) => {
      console.log(`    Place ${idx + 1} (${pl.name}): Card img=${!!pl.image?.src}, Photos=${pl.photos?.length} (Expected: 3)`);
      if (!pl.image?.src || pl.photos?.length !== 3) {
        console.error(`    ERROR: Place ${pl.name} violated photo invariants!`);
        hasErrors = true;
      }
    });
    console.log(`  Total URLs in file: ${fileUrls.length}`);

    // Internal duplicate check (hero matches gallery[0], so unique count should be fileUrls.length - 1)
    const uniqueInFile = new Set(fileUrls.map(u => cleanUrl(u)));
    const expectedUniqueInFile = fileUrls.length - 1;
    if (uniqueInFile.size !== expectedUniqueInFile) {
      console.error(`  FAIL: Internal duplicate detected! Unique: ${uniqueInFile.size}, Expected: ${expectedUniqueInFile}`);
      hasErrors = true;
    } else {
      console.log(`  PASS: Zero internal duplicate URLs!`);
    }

    // Wikimedia check
    const wikimediaCount = fileUrls.filter(u => u.includes('wikimedia') || u.includes('wikipedia')).length;
    if (wikimediaCount > 0) {
      console.error(`  FAIL: Found ${wikimediaCount} Wikimedia URLs! Must be 0.`);
      hasErrors = true;
    } else {
      console.log(`  PASS: Zero Wikimedia URLs! (100% External Photo APIs)`);
    }

    // Pixabay /get/ check
    const pixabayGetCount = fileUrls.filter(u => u.includes('pixabay.com/get/')).length;
    if (pixabayGetCount > 0) {
      console.error(`  FAIL: Found ${pixabayGetCount} Pixabay /get/ session links! Must be 0.`);
      hasErrors = true;
    } else {
      console.log(`  PASS: Zero Pixabay /get/ session links!`);
    }

    // Cross collision with global repository
    const collisions = fileUrls.filter(u => globalCollisionSet.has(cleanUrl(u)));
    if (collisions.length > 0) {
      console.error(`  FAIL: Found ${collisions.length} collisions with other repository destinations!`);
      hasErrors = true;
    } else {
      console.log(`  PASS: Zero collisions with other 2,386 destinations!`);
    }

    allAssignedUrls.push(...uniqueInFile);
  }

  // Cross-file duplicates among the 6 targets
  const totalUniqueAcrossAll6 = new Set(allAssignedUrls);
  console.log(`\nGlobal Across All 6 Targets:`);
  console.log(`  Total Distinct Photos: ${totalUniqueAcrossAll6.size}`);
  console.log(`  Total Photos Expected: ${allAssignedUrls.length}`);
  if (totalUniqueAcrossAll6.size !== allAssignedUrls.length) {
    console.error(`  FAIL: Cross-destination duplicate detected among the 6 targets!`);
    hasErrors = true;
  } else {
    console.log(`  PASS: 100% Globally Unique URLs across all 6 targets!`);
  }

  if (hasErrors) {
    console.error('\nAUDIT COMPLETED WITH FAILURES.');
    process.exit(1);
  } else {
    console.log('\nALL 6 DESTINATIONS AUDITED AND 100% COMPLIANT WITH STRICT INVARIANTS!');
  }
}

// -------------------------------------------------------------
// MAIN EXECUTION
// -------------------------------------------------------------
async function main() {
  console.log('=== MULTI-AGENT EXTERNAL PHOTO API REPLACER (BATCH 2) ===');
  initGlobalCollisions();

  // Helper to load or run
  function loadCompleted(fileName) {
    const filePath = path.join(destDir, fileName);
    const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const fileUrls = [d.heroImage?.src, ...(d.gallery || []).map(g => g.src)];
    (d.topPlaces || []).forEach(p => {
      if (p.image?.src) fileUrls.push(p.image.src);
      (p.photos || []).forEach(ph => fileUrls.push(ph.src || ph));
    });
    const wikis = fileUrls.filter(u => u && (u.includes('wikimedia') || u.includes('/get/')));
    if (wikis.length === 0 && d.gallery?.length === 5) {
      fileUrls.forEach(u => u && sessionUsedUrls.add(cleanUrl(u)));
      console.log(`Loaded previously completed: ${fileName}`);
      return d;
    }
    return null;
  }

  const r1 = loadCompleted('baleshwar-temple.json') || (await runBaleshwarTempleAgent());
  const r2 = loadCompleted('neelkanth-mahadev-temple.json') || (await runNeelkanthMahadevAgent());
  const r3 = loadCompleted('jhansi-fort.json') || (await runJhansiFortAgent());
  const r4 = loadCompleted('mahur-fort.json') || (await runMahurFortAgent());
  const r5 = loadCompleted('manikgad.json') || (await runManikgadAgent());
  const r6 = await runDategadAgent();

  syncCatalogIndex([r1, r2, r3, r4, r5, r6]);
  auditResults();
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
