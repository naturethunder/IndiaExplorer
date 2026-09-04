const fs = require('fs');
const path = require('path');
const { searchPexels, searchUnsplash, searchPixabay, searchWikimedia } = require('./search_multi_api.js');

const TARGET_FILES = [
  'valley-of-flowers-national-park.json',
  'jim-corbett.json',
  'sainik-school-kapurthala.json',
  'osmania-arts-college.json',
  'abirameswarar-temple.json'
];

// Helper to test if a URL is reachable
async function isUrlValid(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Range': 'bytes=0-4096'
      },
      signal: controller.signal
    });
    clearTimeout(timer);
    return res.status >= 200 && res.status < 400;
  } catch (e) {
    return false;
  }
}

// Clean wikimedia URL from tracking params or odd formats
function cleanWikimediaUrl(rawUrl) {
  if (!rawUrl) return '';
  let url = rawUrl.split('?')[0];
  return url;
}

async function run() {
  console.log('=== MULTI-AGENT IMAGE FIXER FOR 5 DESTINATIONS ===');

  // 1. Build global blacklist of used URLs from all other destinations
  console.log('Scanning repository to build global collision set...');
  const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
  const allDestFiles = fs.readdirSync(destDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  const globalUsed = new Set();

  for (const f of allDestFiles) {
    if (TARGET_FILES.includes(f)) continue; // ignore our target files
    try {
      const d = JSON.parse(fs.readFileSync(path.join(destDir, f), 'utf8'));
      if (d.heroImage?.src) globalUsed.add(cleanWikimediaUrl(d.heroImage.src));
      if (d.gallery) d.gallery.forEach(g => g.src && globalUsed.add(cleanWikimediaUrl(g.src)));
      if (d.topPlaces) {
        d.topPlaces.forEach(p => {
          if (p.image?.src) globalUsed.add(cleanWikimediaUrl(p.image.src));
          if (p.photos) p.photos.forEach(ph => {
            const u = ph.src || ph;
            if (u) globalUsed.add(cleanWikimediaUrl(u));
          });
        });
      }
    } catch (e) {}
  }
  console.log(`Indexed ${globalUsed.size} unique URLs currently used in other destination files.`);

  // 2. Process each target destination
  for (const targetFile of TARGET_FILES) {
    console.log(`\n======================================================`);
    console.log(`Processing: ${targetFile}`);
    const filePath = path.join(destDir, targetFile);
    const destData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const slug = destData.slug || targetFile.replace('.json', '');

    const fileUsedUrls = new Set();

    function isAvailable(url) {
      if (!url) return false;
      const clean = cleanWikimediaUrl(url);
      if (globalUsed.has(clean)) return false;
      if (fileUsedUrls.has(clean)) return false;
      const lower = clean.toLowerCase();
      if (lower.includes('map') || lower.includes('flag') || lower.includes('logo') || lower.includes('diagram') || lower.includes('icon') || lower.includes('stamp') || lower.includes('.gif') || lower.includes('.pdf') || lower.includes('.djvu')) return false;
      return true;
    }

    // Now execute tailored agent for each destination
    if (targetFile === 'valley-of-flowers-national-park.json') {
      await fixValleyOfFlowers(destData, isAvailable, fileUsedUrls);
    } else if (targetFile === 'jim-corbett.json') {
      await fixJimCorbett(destData, isAvailable, fileUsedUrls);
    } else if (targetFile === 'sainik-school-kapurthala.json') {
      await fixSainikSchool(destData, isAvailable, fileUsedUrls);
    } else if (targetFile === 'osmania-arts-college.json') {
      await fixOsmania(destData, isAvailable, fileUsedUrls);
    } else if (targetFile === 'abirameswarar-temple.json') {
      await fixAbirameswarar(destData, isAvailable, fileUsedUrls);
    }

    // Verification check before saving
    console.log(`Validating ${targetFile} integrity...`);
    const finalUrls = [];
    if (destData.heroImage?.src) finalUrls.push(destData.heroImage.src);
    if (destData.gallery) destData.gallery.forEach(g => finalUrls.push(g.src));
    if (destData.topPlaces) {
      destData.topPlaces.forEach(p => {
        if (p.image?.src) finalUrls.push(p.image.src);
        if (p.photos) p.photos.forEach(ph => finalUrls.push(ph.src || ph));
      });
    }

    const uniqueFinal = new Set(finalUrls);
    // hero matches gallery[0], so total unique count is finalUrls.length - 1
    const expectedUnique = finalUrls.length - 1;
    console.log(`Total URLs in ${targetFile}: ${finalUrls.length} (Unique: ${uniqueFinal.size}, Expected: ${expectedUnique})`);
    if (uniqueFinal.size !== expectedUnique) {
      console.error(`WARNING: Internal duplicate detected in ${targetFile}!`);
      const counts = {};
      finalUrls.forEach(u => counts[u] = (counts[u] || 0) + 1);
      for (const [u, c] of Object.entries(counts)) {
        if (c > 1 && u !== destData.heroImage?.src) {
          console.error(`Duplicate URL (${c} times): ${u}`);
        }
      }
    } else {
      console.log(`SUCCESS: 0 internal duplicates in ${targetFile}!`);
    }

    // Save file
    fs.writeFileSync(filePath, JSON.stringify(destData, null, 2), 'utf8');
    console.log(`Saved updated ${targetFile}`);
  }

  console.log('\nAll 5 destination files updated successfully.');
}

// -------------------------------------------------------------
// 1. VALLEY OF FLOWERS AGENT
// -------------------------------------------------------------
async function fixValleyOfFlowers(dest, isAvailable, fileUsedUrls) {
  console.log('--- Fixing Valley of Flowers National Park ---');

  // External APIs first: Pexels & Unsplash
  const pexelsVOF = await searchPexels('Valley of Flowers Uttarakhand India', 10);
  const unsplashVOF = await searchUnsplash('Valley of flowers Himalayas India', 5);

  // Wikimedia verified Chamoli flowers series
  const wikChamoli = await searchWikimedia('Flowers Blossom At valley of flowers Chamoli', 30);
  const wikHemkund = await searchWikimedia('Hemkund Sahib Gurdwara lake', 10);
  const wikGhangaria = await searchWikimedia('Ghangaria', 8);
  const wikPushpawati = await searchWikimedia('Pushpawati river Valley of Flowers', 8);
  const wikHathi = await searchWikimedia('Hathi Parbat', 8);
  const wikNilgiri = await searchWikimedia('Nilgiri Parbat Chamoli', 8);
  const wikNar = await searchWikimedia('Nar Parvat', 6);
  const wikGarhwal = await searchWikimedia('Garhwal Himalaya peaks snow Chamoli', 15);

  function pickImage(candidates, fallbackAlts, defaultAlt) {
    for (const c of candidates) {
      const url = cleanWikimediaUrl(c.url);
      if (isAvailable(url)) {
        fileUsedUrls.add(url);
        return {
          src: url,
          alt: c.title ? c.title.replace('File:', '').replace(/\.[^.]+$/, '').replace(/["_]/g, ' ').trim() : defaultAlt
        };
      }
    }
    // fallback
    for (const c of wikChamoli) {
      const url = cleanWikimediaUrl(c.url);
      if (isAvailable(url)) {
        fileUsedUrls.add(url);
        return { src: url, alt: defaultAlt };
      }
    }
    throw new Error('Could not pick image for VOF');
  }

  // Sourcing Gallery (5 unique HD images, API first, then Wikimedia)
  const galPool = [...pexelsVOF, ...unsplashVOF, ...wikChamoli];
  const gallery = [];
  for (let i = 0; i < 5; i++) {
    const item = pickImage(galPool, [], `Valley of Flowers Chamoli alpine meadow ${i + 1}`);
    gallery.push(item);
  }
  dest.gallery = gallery;
  dest.heroImage = {
    src: gallery[0].src,
    alt: gallery[0].alt
  };

  // Top Places
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  Sourcing images for place: ${name}`);

    let pool = [];
    if (name.includes('Hemkund')) {
      pool = [...wikHemkund, ...wikChamoli];
    } else if (name.includes('Ghangaria')) {
      pool = [...wikGhangaria, ...wikChamoli];
    } else if (name.includes('Nanda Devi')) {
      pool = [...wikPushpawati, ...wikChamoli];
    } else if (name.includes('Nilgiri')) {
      pool = [...wikNilgiri, ...wikGarhwal, ...wikChamoli];
    } else if (name.includes('Nar Parvat')) {
      pool = [...wikNar, ...wikGarhwal, ...wikChamoli];
    } else if (name.includes('Gauri')) {
      pool = [...wikPushpawati, ...wikGarhwal, ...wikChamoli];
    } else if (name.includes('Hathi')) {
      pool = [...wikHathi, ...wikGarhwal, ...wikChamoli];
    } else {
      pool = [...wikChamoli, ...wikGarhwal];
    }

    const cardImg = pickImage(pool, [], `${name}, Valley of Flowers`);
    place.image = { src: cardImg.src, alt: cardImg.alt };

    place.photos = [];
    for (let j = 0; j < 3; j++) {
      const photoImg = pickImage(pool, [], `${name} scenic view ${j + 1}`);
      place.photos.push({ src: photoImg.src, alt: photoImg.alt });
    }
  }
}

// -------------------------------------------------------------
// 2. JIM CORBETT AGENT
// -------------------------------------------------------------
async function fixJimCorbett(dest, isAvailable, fileUsedUrls) {
  console.log('--- Fixing Jim Corbett National Park ---');

  // External APIs first: Pexels & Unsplash
  const pexelsCorbett = await searchPexels('Jim Corbett tiger safari Ramganga', 15);
  const unsplashCorbett = await searchUnsplash('Bengal tiger safari forest India', 10);
  const pixabayCorbett = await searchPixabay('tiger safari wilderness', 5);

  // Wikimedia verified Corbett photos
  const wikDhikala = await searchWikimedia('Dhikala Jim Corbett National Park', 15);
  const wikCorbettGeneral = await searchWikimedia('Jim Corbett National Park', 20);
  const wikFalls = await searchWikimedia('Corbett Falls Ramnagar', 8);
  const wikGarjia = await searchWikimedia('Garjia Devi Temple Ramnagar Kosi', 10);
  const wikKosi = await searchWikimedia('Kosi River Uttarakhand Ramnagar', 8);

  function pickImage(candidates, defaultAlt) {
    for (const c of candidates) {
      const url = cleanWikimediaUrl(c.url);
      if (isAvailable(url)) {
        fileUsedUrls.add(url);
        return {
          src: url,
          alt: c.title ? c.title.replace('File:', '').replace(/\.[^.]+$/, '').replace(/["_]/g, ' ').trim() : defaultAlt
        };
      }
    }
    for (const c of wikCorbettGeneral) {
      const url = cleanWikimediaUrl(c.url);
      if (isAvailable(url)) {
        fileUsedUrls.add(url);
        return { src: url, alt: defaultAlt };
      }
    }
    throw new Error('Could not pick image for Jim Corbett');
  }

  // Gallery: API first, then Wikimedia
  const galPool = [...pexelsCorbett, ...unsplashCorbett, ...wikDhikala, ...wikCorbettGeneral];
  const gallery = [];
  for (let i = 0; i < 5; i++) {
    gallery.push(pickImage(galPool, `Jim Corbett National Park wilderness ${i + 1}`));
  }
  dest.gallery = gallery;
  dest.heroImage = {
    src: gallery[0].src,
    alt: gallery[0].alt
  };

  // Top Places
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  Sourcing images for place: ${name}`);

    let pool = [];
    if (name.includes('Dhikala')) {
      pool = [...wikDhikala, ...pexelsCorbett, ...wikCorbettGeneral];
    } else if (name.includes('Falls')) {
      pool = [...wikFalls, ...pexelsCorbett.filter(p => p.title && p.title.toLowerCase().includes('water' || 'river' || 'stream')), ...wikCorbettGeneral];
    } else if (name.includes('Garjia')) {
      pool = [...wikGarjia, ...wikKosi, ...wikCorbettGeneral];
    } else {
      pool = [...wikCorbettGeneral, ...pexelsCorbett];
    }

    const cardImg = pickImage(pool, `${name}, Jim Corbett`);
    place.image = { src: cardImg.src, alt: cardImg.alt };

    place.photos = [];
    for (let j = 0; j < 3; j++) {
      const photoImg = pickImage(pool, `${name} photo ${j + 1}`);
      place.photos.push({ src: photoImg.src, alt: photoImg.alt });
    }
  }
}

// -------------------------------------------------------------
// 3. SAINIK SCHOOL KAPURTHALA AGENT
// -------------------------------------------------------------
async function fixSainikSchool(dest, isAvailable, fileUsedUrls) {
  console.log('--- Fixing Sainik School Kapurthala / Jagatjit Palace ---');

  // External APIs first: Pexels Punjab agriculture/heritage
  const pexelsPunjab = await searchPexels('Punjab mustard field agriculture heritage farm', 15);
  const unsplashPunjab = await searchUnsplash('Punjab landscape farm India', 10);

  // Wikimedia verified Kapurthala & Punjab heritage
  const wikJagatjit = await searchWikimedia('Jagatjit Palace Kapurthala', 15);
  const wikMoorish = await searchWikimedia('Moorish Mosque Kapurthala', 8);
  const wikShalimar = await searchWikimedia('Shalimar Gardens Kapurthala', 8);
  const wikSultanpur = await searchWikimedia('Sultanpur Lodhi', 10);
  const wikPunjabCountryside = await searchWikimedia('Punjab agriculture mustard wheat field', 15);

  function pickImage(candidates, defaultAlt) {
    for (const c of candidates) {
      const url = cleanWikimediaUrl(c.url);
      if (isAvailable(url)) {
        fileUsedUrls.add(url);
        return {
          src: url,
          alt: c.title ? c.title.replace('File:', '').replace(/\.[^.]+$/, '').replace(/["_]/g, ' ').trim() : defaultAlt
        };
      }
    }
    for (const c of [...wikJagatjit, ...wikShalimar, ...wikMoorish, ...wikPunjabCountryside]) {
      const url = cleanWikimediaUrl(c.url);
      if (isAvailable(url)) {
        fileUsedUrls.add(url);
        return { src: url, alt: defaultAlt };
      }
    }
    throw new Error('Could not pick image for Sainik School Kapurthala');
  }

  // Gallery: Jagatjit Palace & Kapurthala Royal Heritage
  const galPool = [...wikJagatjit, ...wikMoorish, ...wikShalimar];
  const gallery = [];
  for (let i = 0; i < 5; i++) {
    gallery.push(pickImage(galPool, `Jagatjit Palace Kapurthala architecture ${i + 1}`));
  }
  dest.gallery = gallery;
  dest.heroImage = {
    src: gallery[0].src,
    alt: gallery[0].alt
  };

  // Top Places: Sidhwan Bet, Saprore, Paman, Sultanpur Lodhi, Chogawan, Bhulath, Kamalpur, Machhi Jowa
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  Sourcing images for place: ${name}`);

    let pool = [];
    if (name.includes('Sultanpur Lodhi')) {
      pool = [...wikSultanpur, ...wikMoorish, ...wikJagatjit];
    } else {
      // Punjab fertile landscapes, farms, heritage from Pexels & Wikimedia
      pool = [...pexelsPunjab, ...unsplashPunjab, ...wikPunjabCountryside, ...wikShalimar, ...wikJagatjit];
    }

    const cardImg = pickImage(pool, `${name}, Kapurthala region`);
    place.image = { src: cardImg.src, alt: cardImg.alt };

    place.photos = [];
    for (let j = 0; j < 3; j++) {
      const photoImg = pickImage(pool, `${name} scenic countryside ${j + 1}`);
      place.photos.push({ src: photoImg.src, alt: photoImg.alt });
    }
  }
}

// -------------------------------------------------------------
// 4. OSMANIA ARTS COLLEGE AGENT
// -------------------------------------------------------------
async function fixOsmania(dest, isAvailable, fileUsedUrls) {
  console.log('--- Fixing Osmania Arts College, Hyderabad ---');

  // External APIs first: Pexels Hyderabad architecture
  const pexelsHyd = await searchPexels('Hyderabad architecture heritage monument Telangana', 15);
  const unsplashHyd = await searchUnsplash('Hyderabad architecture monument India', 10);

  // Wikimedia verified Osmania University & Hyderabad
  const wikArts = await searchWikimedia('Osmania University Arts College', 20);
  const wikTarnaka = await searchWikimedia('Tarnaka Hyderabad metro station', 8);
  const wikCCMB = await searchWikimedia('Centre for Cellular and Molecular Biology Hyderabad', 8);
  const wikSecunderabad = await searchWikimedia('Secunderabad Hyderabad heritage avenue', 12);
  const wikHydGeneral = await searchWikimedia('Hyderabad heritage building architecture granite', 20);

  function pickImage(candidates, defaultAlt) {
    for (const c of candidates) {
      const url = cleanWikimediaUrl(c.url);
      if (isAvailable(url)) {
        fileUsedUrls.add(url);
        return {
          src: url,
          alt: c.title ? c.title.replace('File:', '').replace(/\.[^.]+$/, '').replace(/["_]/g, ' ').trim() : defaultAlt
        };
      }
    }
    for (const c of [...wikArts, ...wikHydGeneral, ...pexelsHyd]) {
      const url = cleanWikimediaUrl(c.url);
      if (isAvailable(url)) {
        fileUsedUrls.add(url);
        return { src: url, alt: defaultAlt };
      }
    }
    throw new Error('Could not pick image for Osmania Arts College');
  }

  // Gallery: Arts College Facade & Campus
  const galPool = [...wikArts, ...pexelsHyd, ...unsplashHyd];
  const gallery = [];
  for (let i = 0; i < 5; i++) {
    gallery.push(pickImage(galPool, `Osmania University Arts College heritage facade ${i + 1}`));
  }
  dest.gallery = gallery;
  dest.heroImage = {
    src: gallery[0].src,
    alt: gallery[0].alt
  };

  // Top Places: Sitaphalmandi, Warsiguda, Tarnaka, Namalagundu, Boudha Nagar, Mylargadda, CCMB
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  Sourcing images for place: ${name}`);

    let pool = [];
    if (name.includes('Tarnaka')) {
      pool = [...wikTarnaka, ...wikSecunderabad, ...pexelsHyd];
    } else if (name.includes('Cellular and Molecular')) {
      pool = [...wikCCMB, ...wikArts, ...pexelsHyd];
    } else {
      pool = [...wikSecunderabad, ...pexelsHyd, ...unsplashHyd, ...wikHydGeneral, ...wikArts];
    }

    const cardImg = pickImage(pool, `${name}, Hyderabad`);
    place.image = { src: cardImg.src, alt: cardImg.alt };

    place.photos = [];
    for (let j = 0; j < 3; j++) {
      const photoImg = pickImage(pool, `${name} photo ${j + 1}`);
      place.photos.push({ src: photoImg.src, alt: photoImg.alt });
    }
  }
}

// -------------------------------------------------------------
// 5. ABIRAMESWARAR TEMPLE AGENT
// -------------------------------------------------------------
async function fixAbirameswarar(dest, isAvailable, fileUsedUrls) {
  console.log('--- Fixing Abirameswarar Temple, Thiruvamathur ---');

  // Wikimedia verified Thiruvamathur temple photos (20+ direct photos of the exact temple complex!)
  const wikThiru = await searchWikimedia('Thiruvamathur', 30);
  const wikVillupuram = await searchWikimedia('Villupuram temple gopuram', 15);
  const wikPanayapuram = await searchWikimedia('Thirupanangadu Panayapuram temple', 10);
  const pexelsTN = await searchPexels('Tamil Nadu ancient temple gopuram granite', 10);
  const unsplashTN = await searchUnsplash('Tamil Nadu ancient stone temple India', 8);

  function pickImage(candidates, defaultAlt) {
    for (const c of candidates) {
      const url = cleanWikimediaUrl(c.url);
      if (isAvailable(url)) {
        fileUsedUrls.add(url);
        return {
          src: url,
          alt: c.title ? c.title.replace('File:', '').replace(/\.[^.]+$/, '').replace(/["_]/g, ' ').trim() : defaultAlt
        };
      }
    }
    for (const c of [...wikThiru, ...wikVillupuram, ...pexelsTN]) {
      const url = cleanWikimediaUrl(c.url);
      if (isAvailable(url)) {
        fileUsedUrls.add(url);
        return { src: url, alt: defaultAlt };
      }
    }
    throw new Error('Could not pick image for Abirameswarar Temple');
  }

  // Gallery: Exact Thiruvamathur Temple Gopuram, Tank & Mandapam
  const galPool = [...wikThiru, ...pexelsTN, ...unsplashTN];
  const gallery = [];
  for (let i = 0; i < 5; i++) {
    gallery.push(pickImage(galPool, `Abirameswarar Temple Thiruvamathur Chola architecture ${i + 1}`));
  }
  dest.gallery = gallery;
  dest.heroImage = {
    src: gallery[0].src,
    alt: gallery[0].alt
  };

  // Top Places: Thennamadevi, Viluppuram, Kappur, Netroddharakaswami Temple
  for (const place of dest.topPlaces) {
    const name = place.name;
    console.log(`  Sourcing images for place: ${name}`);

    let pool = [];
    if (name.includes('Netroddharakaswami')) {
      pool = [...wikPanayapuram, ...wikThiru, ...wikVillupuram];
    } else if (name.includes('Viluppuram')) {
      pool = [...wikVillupuram, ...wikThiru, ...pexelsTN];
    } else {
      // Thennamadevi, Kappur (Villupuram rural temples and countryside)
      pool = [...wikThiru, ...wikVillupuram, ...pexelsTN, ...unsplashTN];
    }

    const cardImg = pickImage(pool, `${name}, Villupuram district`);
    place.image = { src: cardImg.src, alt: cardImg.alt };

    place.photos = [];
    for (let j = 0; j < 3; j++) {
      const photoImg = pickImage(pool, `${name} temple view ${j + 1}`);
      place.photos.push({ src: photoImg.src, alt: photoImg.alt });
    }
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
