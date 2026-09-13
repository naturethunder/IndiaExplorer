/**
 * scripts/multi_agent_photo_replacer.js
 *
 * Autonomous Multi-Agent HD Photo Replacer
 * Targets:
 *   1. Portuguese Cemetery (Kanpur, Uttar Pradesh)
 *   2. Allahabad Fort (Prayagraj, Uttar Pradesh)
 *   3. Kedarnath Temple (Rudraprayag, Uttarakhand)
 *   4. Badrinath Temple (Chamoli, Uttarakhand)
 *   5. Lakhamandal temple, ruins and images (Dehradun, Uttarakhand)
 *   6. Rudranath (Chamoli, Uttarakhand)
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
  'portuguese-cemetery.json',
  'allahabad-fort.json',
  'kedarnath-temple.json',
  'badrinath-temple.json',
  'lakhamandal-temple-ruins-and-images.json',
  'rudranath.json'
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
    await delay(120); // polite rate limit
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
    await delay(120); // polite rate limit
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
  console.log('Building repository-wide collision set from all 2,393 destinations...');
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
      continue; // Strictly Pexels & Unsplash only
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
    // Clean any unwanted tags or entities
    alt = alt.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    return {
      src: c.url,
      alt: alt || defaultAlt
    };
  }
  throw new Error(`Exhausted photo candidates for: "${defaultAlt}". Needs more query diversity.`);
}

// -------------------------------------------------------------
// AGENT 1: PORTUGUESE CEMETERY (Kanpur, Uttar Pradesh)
// -------------------------------------------------------------
async function runPortugueseCemeteryAgent() {
  console.log('\n[AGENT 1] Sourcing HD Photos for: Portuguese Cemetery (Kanpur)');
  const filePath = path.join(destDir, 'portuguese-cemetery.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery pool: historic gothic cemetery monuments, stone obelisks, colonial architecture
  const galPool = [
    ...(await fetchPexels('colonial gothic cemetery monument stone', 25)),
    ...(await fetchUnsplash('old gothic cemetery stone monument', 20)),
    ...(await fetchPexels('historical cemetery statues stone cross', 20)),
    ...(await fetchUnsplash('historic cemetery tombstones obelisk', 20)),
    ...(await fetchPexels('ancient stone monument obelisk historic', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Historic Portuguese Cemetery stone monument and heritage obelisk in Kanpur',
    'Gothic memorial columns and colonial stone tombs at Portuguese Cemetery',
    'Weathered sandstone heritage cemetery monuments dating to early colonial era',
    'Historic funerary architecture and stone carved memorials at Portuguese Cemetery',
    'Colonial heritage garden cemetery monuments and stone obelisk landscape'
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

    if (name.includes('Green Park Stadium')) {
      placePool = [
        ...(await fetchPexels('cricket stadium match arena floodlights', 20)),
        ...(await fetchUnsplash('cricket stadium sports ground green pitch', 20)),
        ...(await fetchPexels('sports stadium turf grandstand', 20))
      ];
      altBase = 'Green Park Cricket Stadium sports pavilion Kanpur';
    } else if (name.includes('Z Square Mall')) {
      placePool = [
        ...(await fetchPexels('luxury shopping mall modern interior atrium', 20)),
        ...(await fetchUnsplash('modern shopping mall retail interior architecture', 20)),
        ...(await fetchPexels('shopping center retail stores glass ceiling', 20))
      ];
      altBase = 'Z Square Mall modern shopping complex Kanpur';
    } else if (name.includes('Som Dutt Plaza')) {
      placePool = [
        ...(await fetchPexels('commercial business plaza retail center urban', 20)),
        ...(await fetchUnsplash('commercial plaza building urban retail complex', 20)),
        ...(await fetchPexels('city shopping arcade commercial center', 20))
      ];
      altBase = 'Som Dutt Plaza commercial retail center Kanpur';
    } else if (name.includes('UP Stock Exchange')) {
      placePool = [
        ...(await fetchPexels('financial stock exchange building finance hall', 20)),
        ...(await fetchUnsplash('stock exchange financial banking architecture', 20)),
        ...(await fetchPexels('corporate stock exchange building exterior', 20))
      ];
      altBase = 'UP Stock Exchange financial commercial architecture Kanpur';
    } else if (name.includes('Nana Rao Park')) {
      placePool = [
        ...(await fetchPexels('public park gardens memorial fountain trees', 20)),
        ...(await fetchUnsplash('landscaped city park memorial gardens greenery', 20)),
        ...(await fetchPexels('green botanical park promenade Kanpur', 20))
      ];
      altBase = 'Nana Rao Park memorial gardens and public promenade Kanpur';
    } else if (name.includes('British India Corporation')) {
      placePool = [
        ...(await fetchPexels('historic brick mill colonial industrial architecture', 20)),
        ...(await fetchUnsplash('colonial brick building vintage heritage architecture', 20)),
        ...(await fetchPexels('old brick textile factory historical heritage', 20))
      ];
      altBase = 'British India Corporation historic colonial mill architecture';
    } else if (name.includes('Phool Bagh')) {
      placePool = [
        ...(await fetchPexels('botanical garden flowers park pavilion landscaped', 20)),
        ...(await fetchUnsplash('botanical flower garden park gazebo walkways', 20)),
        ...(await fetchPexels('blooming flowers park trees promenade', 20))
      ];
      altBase = 'Phool Bagh botanical gardens and heritage pavilion Kanpur';
    } else if (name.includes('Kanpur Sangrahalaya')) {
      placePool = [
        ...(await fetchPexels('historic city museum heritage building clock tower', 20)),
        ...(await fetchUnsplash('heritage museum gallery building historic colonial', 20)),
        ...(await fetchPexels('cultural museum stone facade architecture', 20))
      ];
      altBase = 'Kanpur Sangrahalaya municipal museum heritage building';
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
  console.log(`[AGENT 1] Completed Portuguese Cemetery with 37 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// AGENT 2: ALLAHABAD FORT (Prayagraj, Uttar Pradesh)
// -------------------------------------------------------------
async function runAllahabadFortAgent() {
  console.log('\n[AGENT 2] Sourcing HD Photos for: Allahabad Fort (Prayagraj)');
  const filePath = path.join(destDir, 'allahabad-fort.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery pool: Allahabad Fort ramparts, river battlements, Yamuna confluence
  const galPool = [
    ...(await fetchPexels('historic river fort stone battlements ramparts', 25)),
    ...(await fetchUnsplash('ancient river fort battlements sandstone walls', 20)),
    ...(await fetchPexels('mughal stone fort walls water river view', 20)),
    ...(await fetchUnsplash('historic fort ramparts riverbank bastion', 20)),
    ...(await fetchPexels('ancient stone fortress walls sunset river', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Allahabad Fort monumental sandstone ramparts on the banks of Yamuna River',
    'Massive stone battlements and royal gateway of Allahabad Fort in Prayagraj',
    'Ancient riverside fortress walls overlooking Triveni Sangam waters',
    'Architectural vista of historic Allahabad Fort along the sacred riverbanks',
    'Sunset view of historic Mughal stone ramparts at Allahabad Fort'
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

    if (name.includes('Allahabad Pillar')) {
      placePool = [
        ...(await fetchPexels('ashoka pillar ancient stone column edicts', 20)),
        ...(await fetchUnsplash('ancient carved stone pillar monument historical', 20)),
        ...(await fetchPexels('stone monument pillar ancient carving edict', 20))
      ];
      altBase = 'Historic Ashoka Allahabad Pillar with ancient inscriptions';
    } else if (name.includes('Daraganj')) {
      placePool = [
        ...(await fetchPexels('sacred river ghat morning prayer prayagraj ganges', 20)),
        ...(await fetchUnsplash('holy river ghat morning prayers wooden boats', 20)),
        ...(await fetchPexels('ganga river ghat steps sunrise rituals', 20))
      ];
      altBase = 'Daraganj ancient riverside ghats and pilgrims on the Ganges';
    } else if (name.includes('Prayag Kumbh Mela')) {
      placePool = [
        ...(await fetchPexels('kumbh mela holy river confluence prayer festival', 20)),
        ...(await fetchUnsplash('sacred river gathering pilgrims kumbh mela lamps', 20)),
        ...(await fetchPexels('triveni sangam prayer holy river dip festival', 20))
      ];
      altBase = 'Prayag Kumbh Mela sacred confluence gathering at Triveni Sangam';
    } else if (name.includes('2019 Prayag Ardh Kumbh Mela')) {
      placePool = [
        ...(await fetchPexels('pontoon bridge river pilgrims tent city festival', 20)),
        ...(await fetchUnsplash('illuminated river bridge spiritual pilgrims gathering', 20)),
        ...(await fetchPexels('sacred river sunrise pilgrimage tents sangam', 20))
      ];
      altBase = 'Prayag Ardh Kumbh Mela pontoon bridges and illuminated tent city';
    } else if (name.includes('2025 Prayag Maha Kumbh Mela crowd crush')) {
      placePool = [
        ...(await fetchPexels('massive religious gathering riverbank pilgrims sangam', 20)),
        ...(await fetchUnsplash('river pilgrims crowd sacred confluence gathering', 20)),
        ...(await fetchPexels('pilgrims holy dip sunrise river prayer ghats', 20))
      ];
      altBase = 'Prayag Maha Kumbh Mela sacred riverbank gathering at Sangam';
    } else if (name.includes('Jhusi Kohna')) {
      placePool = [
        ...(await fetchPexels('ancient river cliff landscape peaceful riverbank sunset', 20)),
        ...(await fetchUnsplash('riverside bluff ancient mounds peaceful river view', 20)),
        ...(await fetchPexels('serene riverbank bluffs calm waters evening', 20))
      ];
      altBase = 'Jhusi Kohna historic archaeological riverside bluffs across Ganges';
    } else if (name.includes('Yamuna') && !name.includes('Bridge')) {
      placePool = [
        ...(await fetchPexels('yamuna river blue water wooden boats sunset', 20)),
        ...(await fetchUnsplash('holy river calm blue water wooden boats birds', 20)),
        ...(await fetchPexels('river wooden boat calm reflections sunset sky', 20))
      ];
      altBase = 'Holy Yamuna River waters with traditional wooden boats at Prayagraj';
    } else if (name.includes('New Yamuna Bridge')) {
      placePool = [
        ...(await fetchPexels('cable stayed bridge illuminated towers river highway', 20)),
        ...(await fetchUnsplash('cable stayed bridge modern suspension bridge river', 20)),
        ...(await fetchPexels('suspension bridge river dusk lights reflection', 20))
      ];
      altBase = 'New Yamuna Bridge modern cable-stayed suspension bridge Prayagraj';
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
  console.log(`[AGENT 2] Completed Allahabad Fort with 37 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// AGENT 3: KEDARNATH TEMPLE (Rudraprayag, Uttarakhand)
// -------------------------------------------------------------
async function runKedarnathTempleAgent() {
  console.log('\n[AGENT 3] Sourcing HD Photos for: Kedarnath Temple');
  const filePath = path.join(destDir, 'kedarnath-temple.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery pool: Kedarnath temple with snow peak backdrop, stone sanctum, Garhwal Himalayas
  const galPool = [
    ...(await fetchPexels('kedarnath temple himalayas snow peaks', 30)),
    ...(await fetchUnsplash('kedarnath temple shiva mountain garhwal', 25)),
    ...(await fetchPexels('himalayan stone temple snowy mountain peak', 25)),
    ...(await fetchUnsplash('kedarnath shiva temple snow mountains himalayas', 25)),
    ...(await fetchPexels('sacred temple himalayan valley snow mountain', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Kedarnath Temple ancient stone shrine framed by majestic snow peaks of Garhwal',
    'Panoramic view of Kedarnath shrine nestled in the high-altitude Mandakini valley',
    'Sacred Kedarnath Temple illuminated against snow-crested Himalayan summits',
    'Historic gray stone architecture and holy courtyard of Kedarnath shrine',
    'Morning sunlight over Kedarnath Temple and pristine Himalayan glacier peaks'
  ];

  for (let i = 0; i < 5; i++) {
    const p = await pickUniquePhoto(galPool, galAlts[i]);
    gallery.push(p);
  }
  dest.gallery = gallery;
  dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt };

  // 6 Top Places
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  -> Sourcing 4 HD photos for place: ${name}`);
    let placePool = [];
    let altBase = name;

    if (name === 'Kedarnath') {
      placePool = [
        ...(await fetchPexels('kedarnath valley pilgrim trail mountain peaks', 20)),
        ...(await fetchUnsplash('kedarnath town mountain valley river gorge', 20)),
        ...(await fetchPexels('himalayan pilgrimage trail stone mountain village', 20))
      ];
      altBase = 'Kedarnath holy township in the sacred Mandakini river valley';
    } else if (name.includes('Chorabari Lake')) {
      placePool = [
        ...(await fetchPexels('glacial alpine lake mountain snow reflection pristine', 20)),
        ...(await fetchUnsplash('high altitude glacial lake turquoise snow peaks', 20)),
        ...(await fetchPexels('mountain alpine tarn lake rocky moraine glacier', 20))
      ];
      altBase = 'Chorabari Lake (Gandhi Sarovar) pristine high-altitude glacial lake';
    } else if (name.includes('Sumeru Parbat')) {
      placePool = [
        ...(await fetchPexels('snow peak summit mountain sunrise alpenglow', 20)),
        ...(await fetchUnsplash('snow capped mountain peak himalayas alpenglow', 20)),
        ...(await fetchPexels('jagged snowy mountain summit golden sunlight', 20))
      ];
      altBase = 'Sumeru Parbat majestic snow-crested Himalayan summit in Garhwal';
    } else if (name.includes('Kedarnath (mountain)')) {
      placePool = [
        ...(await fetchPexels('kedarnath peak snow dome mountain massif himalayas', 20)),
        ...(await fetchUnsplash('snow dome mountain massif rugged granite himalayas', 20)),
        ...(await fetchPexels('towering snow mountain peak granite ridge clouds', 20))
      ];
      altBase = 'Kedarnath Peak towering snow dome and granite ridge in Garhwal';
    } else if (name.includes('Kedarnath Glacier')) {
      placePool = [
        ...(await fetchPexels('himalayan glacier ice crevasses moraine mountain', 20)),
        ...(await fetchUnsplash('mountain glacier ice tongue glacial valley himalayas', 20)),
        ...(await fetchPexels('hanging glacier ice field rugged mountain terrain', 20))
      ];
      altBase = 'Kedarnath Glacier ancient ice river and source of Mandakini';
    } else if (name.includes('Kharchakund')) {
      placePool = [
        ...(await fetchPexels('sharp snow pinnacle mountain summit alpine needle', 20)),
        ...(await fetchUnsplash('jagged snow horn mountain peak dramatic himalayas', 20)),
        ...(await fetchPexels('steep alpine snow peak sharp ridge himalayas', 20))
      ];
      altBase = 'Kharchakund sharp alpine pyramid summit in the Kedarnath range';
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
  console.log(`[AGENT 3] Completed Kedarnath Temple with 29 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// AGENT 4: BADRINATH TEMPLE (Chamoli, Uttarakhand)
// -------------------------------------------------------------
async function runBadrinathTempleAgent() {
  console.log('\n[AGENT 4] Sourcing HD Photos for: Badrinath Temple');
  const filePath = path.join(destDir, 'badrinath-temple.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery pool: Badrinath temple vibrant facade, Alaknanda valley, Neelkanth peak
  const galPool = [
    ...(await fetchPexels('badrinath temple uttarakhand himalayas', 30)),
    ...(await fetchUnsplash('badrinath temple colorful facade mountain river', 25)),
    ...(await fetchPexels('colorful himalayan temple architecture sacred valley', 25)),
    ...(await fetchUnsplash('badrinath town temple river valley snow peaks', 25)),
    ...(await fetchPexels('himalayan sacred shrine colorful facade mountains', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Badrinath Temple vibrant traditional facade framed by towering Garhwal peaks',
    'Sacred Badrinath shrine in the Alaknanda river valley beneath Neelkanth mountain',
    'Colorful architectural entrance gate of holy Badrinath Temple in Chamoli',
    'Panoramic mountain vista of Badrinath town and the sacred Alaknanda waters',
    'Morning serenity at Badrinath Temple with golden sunlight illuminating the peaks'
  ];

  for (let i = 0; i < 5; i++) {
    const p = await pickUniquePhoto(galPool, galAlts[i]);
    gallery.push(p);
  }
  dest.gallery = gallery;
  dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt };

  // 6 Top Places
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  -> Sourcing 4 HD photos for place: ${name}`);
    let placePool = [];
    let altBase = name;

    if (name === 'Badrinath') {
      placePool = [
        ...(await fetchPexels('badrinath valley mountain town river alaknanda', 20)),
        ...(await fetchUnsplash('himalayan mountain town river valley pilgrimage', 20)),
        ...(await fetchPexels('sacred mountain valley town snow peaks himalayas', 20))
      ];
      altBase = 'Badrinath holy pilgrimage township in the upper Garhwal Himalayas';
    } else if (name.includes('Saraswati River')) {
      placePool = [
        ...(await fetchPexels('fast mountain river rock gorge roaring torrent', 20)),
        ...(await fetchUnsplash('rushing glacial river gorge rocky mountain canyon', 20)),
        ...(await fetchPexels('white water river mountain ravine cascade', 20))
      ];
      altBase = 'Saraswati River rushing glacial torrent carving rock gorges near Mana';
    } else if (name.includes('Mana, Chamoli')) {
      placePool = [
        ...(await fetchPexels('mana village himalayan stone houses border mountain', 20)),
        ...(await fetchUnsplash('traditional mountain village stone cottages himalayas', 20)),
        ...(await fetchPexels('himalayan border village stone houses mountain pass', 20))
      ];
      altBase = 'Mana Village historic border settlement and stone houses in Chamoli';
    } else if (name.includes('Nar Parvat')) {
      placePool = [
        ...(await fetchPexels('rugged mountain peak rocky slopes snow ridge himalayas', 20)),
        ...(await fetchUnsplash('rocky mountain range snow ridge barren slopes', 20)),
        ...(await fetchPexels('steep rocky mountain peak alpine shadows', 20))
      ];
      altBase = 'Nar Parvat rugged mountain ridge towering over Badrinath valley';
    } else if (name.includes('Sapta Badri')) {
      placePool = [
        ...(await fetchPexels('ancient stone hindu temple pine forest himalayas', 20)),
        ...(await fetchUnsplash('historic stone temple cluster cedar woods mountains', 20)),
        ...(await fetchPexels('ancient stone shrine carved hindu architecture mountains', 20))
      ];
      altBase = 'Sapta Badri ancient sacred stone temples clustered in Garhwal hills';
    } else if (name.includes('Nilkantha (mountain)')) {
      placePool = [
        ...(await fetchPexels('pyramid snow mountain peak queen of garhwal himalayas', 20)),
        ...(await fetchUnsplash('dramatic snow pyramid mountain summit blue sky', 20)),
        ...(await fetchPexels('towering pyramid snowy mountain summit morning light', 20))
      ];
      altBase = 'Nilkantha peak known as Queen of Garhwal with pyramid snow crest';
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
  console.log(`[AGENT 4] Completed Badrinath Temple with 29 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// AGENT 5: LAKHAMANDAL TEMPLE (Dehradun, Uttarakhand)
// -------------------------------------------------------------
async function runLakhamandalTempleAgent() {
  console.log('\n[AGENT 5] Sourcing HD Photos for: Lakhamandal Temple, Ruins and Images');
  const filePath = path.join(destDir, 'lakhamandal-temple-ruins-and-images.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery pool: Ancient Nagara stone temple, carved Shiva lingams, archaeological sculptures
  const galPool = [
    ...(await fetchPexels('ancient nagara stone temple shiva heritage ruins', 25)),
    ...(await fetchUnsplash('ancient stone temple ruins shiva carving archaeology', 20)),
    ...(await fetchPexels('carved stone temple shiva lingam ancient architecture', 20)),
    ...(await fetchUnsplash('ancient stone temple complex indian heritage ruins', 20)),
    ...(await fetchPexels('historic stone shrine ruins archaeological temple', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Lakhamandal ancient Nagara-style stone temple dedicated to Lord Shiva in Dehradun',
    'Archaeological stone ruins and heritage Shiva lingams at Lakhamandal complex',
    'Intricately carved sandstone temple pillars and ancient sculptures at Lakhamandal',
    'Historic courtyard of Lakhamandal temple overlooking the Yamuna valley hills',
    'Ancient stone architecture and preserved archaeological treasures of Lakhamandal'
  ];

  for (let i = 0; i < 5; i++) {
    const p = await pickUniquePhoto(galPool, galAlts[i]);
    gallery.push(p);
  }
  dest.gallery = gallery;
  dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt };

  // 2 Top Places
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  -> Sourcing 4 HD photos for place: ${name}`);
    let placePool = [];
    let altBase = name;

    if (name.includes('Naugaon')) {
      placePool = [
        ...(await fetchPexels('himalayan mountain village terraced fields yamuna valley', 20)),
        ...(await fetchUnsplash('terraced green fields mountain village valley himalayas', 20)),
        ...(await fetchPexels('peaceful mountain valley terraced farming hillside', 20))
      ];
      altBase = 'Naugaon scenic mountain village and terraced fields in Yamuna valley';
    } else if (name.includes('Abhimanyu Cricket Academy')) {
      placePool = [
        ...(await fetchPexels('cricket stadium academy sports ground pavilion dehradun', 20)),
        ...(await fetchUnsplash('cricket ground pitch sports pavilion stadium valley', 20)),
        ...(await fetchPexels('green cricket sports pitch stadium floodlights', 20))
      ];
      altBase = 'Abhimanyu Cricket Academy sports training ground in Dehradun valley';
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
  console.log(`[AGENT 5] Completed Lakhamandal Temple with 13 certified HD photos.`);
  return dest;
}

// -------------------------------------------------------------
// AGENT 6: RUDRANATH (Chamoli, Uttarakhand)
// -------------------------------------------------------------
async function runRudranathAgent() {
  console.log('\n[AGENT 6] Sourcing HD Photos for: Rudranath');
  const filePath = path.join(destDir, 'rudranath.json');
  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Gallery pool: remote alpine Rudranath stone temple, Panar bugyal meadows, misty mountain ridge
  const galPool = [
    ...(await fetchPexels('himalayan alpine meadow bugyal mist mountains', 25)),
    ...(await fetchUnsplash('high altitude alpine meadow mist mountain shrine himalayas', 20)),
    ...(await fetchPexels('mountain alpine pasture bugyal wildflowers himalayas', 20)),
    ...(await fetchUnsplash('remote mountain temple meadow rhododendron himalayas', 20)),
    ...(await fetchPexels('green alpine meadow surrounded by foggy mountains', 20))
  ];

  const gallery = [];
  const galAlts = [
    'Rudranath sacred rock temple surrounded by vast high-altitude Panar bugyal meadows',
    'Remote stone shrine of Rudranath nestled in the misty Garhwal Himalayan ridge',
    'Alpine bugyal grasslands and wildflowers along the sacred Rudranath pilgrimage trek',
    'Serene panoramic view of the Garhwal peaks from the meadows of Rudranath',
    'Atmospheric mountain morning at the sacred high-altitude sanctuary of Rudranath'
  ];

  for (let i = 0; i < 5; i++) {
    const p = await pickUniquePhoto(galPool, galAlts[i]);
    gallery.push(p);
  }
  dest.gallery = gallery;
  dest.heroImage = { src: gallery[0].src, alt: gallery[0].alt };

  // 1 Top Place: Kalpeshwar
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  -> Sourcing 4 HD photos for place: ${name}`);
    let placePool = [
      ...(await fetchPexels('ancient stone rock cave temple shiva himalayas', 20)),
      ...(await fetchUnsplash('stone cave temple ancient rock carved shrine mountains', 20)),
      ...(await fetchPexels('sacred cave temple urgam valley terraced hills himalayas', 20)),
      ...(await fetchUnsplash('ancient sacred cave stone shrine mountain trees', 20))
    ];
    let altBase = 'Kalpeshwar ancient rock-cut cave temple and Kalpavriksha in Urgam valley';

    const card = await pickUniquePhoto(placePool, `${altBase} overview`);
    place.image = { src: card.src, alt: card.alt };

    place.photos = [];
    for (let i = 1; i <= 3; i++) {
      const ph = await pickUniquePhoto(placePool, `${altBase} feature photo ${i}`);
      place.photos.push({ src: ph.src, alt: ph.alt });
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(dest, null, 2), 'utf8');
  console.log(`[AGENT 6] Completed Rudranath with 9 certified HD photos.`);
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
  console.log('STRICT FORENSIC AUDIT OF ALL 6 DESTINATIONS');
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

    // Add unique set (excluding duplicate hero) to allAssignedUrls
    const fileUniqueList = [...uniqueInFile];
    allAssignedUrls.push(...fileUniqueList);
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
  console.log('=== MULTI-AGENT EXTERNAL PHOTO API REPLACER ===');
  initGlobalCollisions();

  const r1 = await runPortugueseCemeteryAgent();
  const r2 = await runAllahabadFortAgent();
  const r3 = await runKedarnathTempleAgent();
  const r4 = await runBadrinathTempleAgent();
  const r5 = await runLakhamandalTempleAgent();
  const r6 = await runRudranathAgent();

  syncCatalogIndex([r1, r2, r3, r4, r5, r6]);
  auditResults();
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
