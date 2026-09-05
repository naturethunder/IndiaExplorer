const fs = require('fs');
const path = require('path');
const {
  destDir,
  cleanUrlKey,
  globalUsed,
  isLiveImage,
  searchUnsplash,
  searchPexels,
  searchOpenverse,
  searchWikimedia
} = require('./image-search-engine.js');

const BAD_WORDS = [
  'fish', 'wallago', 'garra', 'aenigmachanna', 'murrel', 'dog', 'puppy',
  'selfie', 'portrait', 'close-up of face', 'model', 'wedding pose',
  'map', 'flag', 'logo', 'diagram', 'icon', 'stamp', 'census', 'drawing',
  'district.png', 'division_in_', 'interim_agreements',
  'hajdúszoboszló', 'hungary', 'bastion', 'kalvin', 'ziegelmauer',
  'taipei', 'taiwan', 'buenos aires', 'argentina', 'chinese pavilion',
  'rachakonda_viswanatha_sastry', 'local_fair_market'
];

function isAuthentic(item) {
  const text = ((item.title || '') + ' ' + (item.url || '')).toLowerCase();
  for (const b of BAD_WORDS) {
    if (text.includes(b)) return false;
  }
  return true;
}

async function getCandidates(queries) {
  const list = [];
  const seen = new Set();
  function add(it) {
    const k = cleanUrlKey(it.url);
    if (!k || seen.has(k) || !isAuthentic(it)) return;
    seen.add(k);
    list.push(it);
  }

  // 1. Unsplash
  for (const q of queries) {
    const res = await searchUnsplash(q, 8);
    for (const it of res) add(it);
  }
  // 2. Pexels
  for (const q of queries) {
    const res = await searchPexels(q, 8);
    for (const it of res) add(it);
  }
  // 3. Openverse
  for (const q of queries) {
    const res = await searchOpenverse(q, 8);
    for (const it of res) add(it);
  }
  // 4. Wikimedia (LAST FALLBACK)
  for (const q of queries) {
    const res = await searchWikimedia(q, 10);
    for (const it of res) add(it);
  }
  return list;
}

async function pickUnique(candidates, fileUsed) {
  for (const c of candidates) {
    const k = cleanUrlKey(c.url);
    if (!k || fileUsed.has(k) || globalUsed.has(k)) continue;
    const ok = await isLiveImage(c.url);
    if (ok) {
      fileUsed.add(k);
      return c.url;
    }
  }
  return null;
}

// 1. MUNGER FORT
async function fixMunger() {
  console.log('\n--- Finalizing Munger Fort ---');
  const file = path.join(destDir, 'munger-fort.json');
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));

  const fileUsed = new Set();
  if (d.heroImage?.src) fileUsed.add(cleanUrlKey(d.heroImage.src));
  (d.gallery || []).forEach(g => g.src && fileUsed.add(cleanUrlKey(g.src)));

  // Queries for Munger places
  const placeQueries = {
    'Munger': ['Munger Fort Bihar', 'Fort of Munger', 'Munger Bihar'],
    'Tarapur, Bihar': ['Munger Bihar landscape', 'Munger countryside Bihar', 'Bihar Ganges river'],
    'Kastaharni Ghat': ['Munger Ganga ghat', 'Munger riverfront Bihar', 'Kashtaharni Ghat Ganges', 'River Ganges Munger sunset'],
    'Kaunhara Ghat': ['Munger Ganges boat Bihar', 'Munger riverfront Ganga', 'Karnachaura Munger Ganges'],
    'Chandika Sthan': ['Chandika Asthan Munger', 'Chandika Sthan Munger temple', 'Maa Chandika Sthan Bihar'],
    'Munger Ganga Bridge': ['Munger Ganga Bridge', 'Sri Krishna Setu Munger', 'Munger bridge rail road'],
    'Khajuraha': ['Munger hills Bihar', 'Kharagpur hills Munger', 'Munger countryside Bihar landscape'],
    'Nauagarhi': ['Munger green landscape Bihar', 'Munger countryside Bihar', 'Rural Bihar scenery']
  };

  for (let i = 0; i < d.topPlaces.length; i++) {
    const pl = d.topPlaces[i];
    const queries = placeQueries[pl.name] || [`${pl.name} Munger`, 'Munger Bihar'];
    const candidates = await getCandidates(queries);

    // Ensure valid card
    const cardKey = cleanUrlKey(pl.image?.src);
    if (!cardKey || fileUsed.has(cardKey)) {
      const u = await pickUnique(candidates, fileUsed);
      if (u) pl.image = { src: u, alt: `${pl.name} — Munger Fort` };
    } else {
      fileUsed.add(cardKey);
    }

    // Ensure 3 valid photos
    const goodPhotos = [];
    for (const ph of (pl.photos || [])) {
      const u = ph.src || ph;
      const k = cleanUrlKey(u);
      if (k && !fileUsed.has(k) && !k.includes('rohtasgarh')) {
        fileUsed.add(k);
        goodPhotos.push(u);
      }
    }

    while (goodPhotos.length < 3) {
      const u = await pickUnique(candidates, fileUsed);
      if (u) {
        goodPhotos.push(u);
      } else {
        // Fallback general Munger/Bihar queries
        const genCand = await getCandidates(['Munger Fort Bihar', 'Munger Ganga river', 'Bihar river Ganges landscape']);
        const u2 = await pickUnique(genCand, fileUsed);
        if (u2) goodPhotos.push(u2);
        else break;
      }
    }
    pl.photos = goodPhotos;
    console.log(`  P${i} ${pl.name}: Card + ${pl.photos.length} photos`);
  }

  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  console.log('Munger Fort updated. Total unique URLs:', fileUsed.size);
}

// 2. ROHTASGARH FORT
async function fixRohtasgarh() {
  console.log('\n--- Finalizing Rohtasgarh Fort ---');
  const file = path.join(destDir, 'rohtasgarh-fort.json');
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));

  const fileUsed = new Set();
  if (d.heroImage?.src) fileUsed.add(cleanUrlKey(d.heroImage.src));
  (d.gallery || []).forEach(g => g.src && fileUsed.add(cleanUrlKey(g.src)));

  const placeQueries = {
    'Maghigawan': ['Rohtasgarh Fort plateau', 'Kaimur hills Rohtas Bihar', 'Rohtasgarh fort hills'],
    'Akbarpur, Rohtas': ['Rohtasgarh Fort Bihar', 'Rohtas fort ramparts', 'Akbarpur Rohtas Bihar'],
    'Banjari, Bihar': ['Kaimur hills Rohtas landscape', 'Son river Rohtas Bihar', 'Rohtas plateau Bihar'],
    'Deorikalan': ['Rohtasgarh Fort palace ruins', 'Rohtasgarh fort architecture', 'Rohtas Bihar heritage']
  };

  for (let i = 0; i < d.topPlaces.length; i++) {
    const pl = d.topPlaces[i];
    const queries = placeQueries[pl.name] || [`${pl.name} Rohtasgarh`, 'Rohtasgarh Fort Bihar'];
    const candidates = await getCandidates(queries);

    // Card
    const cardKey = cleanUrlKey(pl.image?.src);
    if (!cardKey || fileUsed.has(cardKey) || cardKey.includes('ziegelmauer')) {
      const u = await pickUnique(candidates, fileUsed);
      if (u) pl.image = { src: u, alt: `${pl.name} — Rohtasgarh Fort` };
    } else {
      fileUsed.add(cardKey);
    }

    // Photos
    const goodPhotos = [];
    for (const ph of (pl.photos || [])) {
      const u = ph.src || ph;
      const k = cleanUrlKey(u);
      if (k && !fileUsed.has(k) && !k.includes('ziegelmauer') && !k.includes('budhdha')) {
        fileUsed.add(k);
        goodPhotos.push(u);
      }
    }

    while (goodPhotos.length < 3) {
      const u = await pickUnique(candidates, fileUsed);
      if (u) {
        goodPhotos.push(u);
      } else {
        const genCand = await getCandidates(['Rohtasgarh Fort Bihar', 'Rohtas Fort', 'Kaimur hills landscape Bihar']);
        const u2 = await pickUnique(genCand, fileUsed);
        if (u2) goodPhotos.push(u2);
        else break;
      }
    }
    pl.photos = goodPhotos;
    console.log(`  P${i} ${pl.name}: Card + ${pl.photos.length} photos`);
  }

  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  console.log('Rohtasgarh Fort updated. Total unique URLs:', fileUsed.size);
}

// 3. SRI SRI NOOKAMBIKA TEMPLE
async function fixNookambika() {
  console.log('\n--- Finalizing Sri Sri Nookambika Temple ---');
  const file = path.join(destDir, 'sri-sri-nookambika-ammavari-temple.json');
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));

  const fileUsed = new Set();
  if (d.heroImage?.src) fileUsed.add(cleanUrlKey(d.heroImage.src));
  (d.gallery || []).forEach(g => g.src && fileUsed.add(cleanUrlKey(g.src)));

  const placeQueries = {
    'Narsipatnam revenue division': ['Lambasingi hills Visakhapatnam Andhra', 'Narsipatnam hills Eastern Ghats', 'Visakhapatnam coffee hills Andhra'],
    'Paderu revenue division': ['Araku valley Visakhapatnam hills', 'Paderu Eastern Ghats Andhra', 'Araku waterfalls Andhra Pradesh'],
    'Anakapalli revenue division': ['Anakapalle town Sarada river Andhra', 'Anakapalli jaggery market Andhra', 'Visakhapatnam rural hills Andhra'],
    'Anakapalli mandal': ['Anakapalle countryside Andhra Pradesh', 'Sarada river Anakapalle Andhra', 'Bojjannakonda Anakapalle Andhra'],
    'Anakapalli': ['Bojjannakonda Buddhist rock-cut caves Anakapalle', 'Bojjannakonda stupas Sankaram', 'Anakapalle heritage Andhra Pradesh'],
    'Bowluvada': ['Sarada river valley Andhra Pradesh', 'Anakapalle rural green landscape', 'Visakhapatnam green valley Andhra'],
    'Golagam': ['Andhra Pradesh farmland green fields', 'Anakapalle agricultural landscape', 'Rural Andhra Pradesh scenery'],
    'Thummapala': ['Anakapalle sugarcane fields Andhra', 'Visakhapatnam district rural landscape', 'Andhra Pradesh countryside nature']
  };

  for (let i = 0; i < d.topPlaces.length; i++) {
    const pl = d.topPlaces[i];
    const queries = placeQueries[pl.name] || [`${pl.name} Anakapalle`, 'Bojjannakonda Anakapalle'];
    const candidates = await getCandidates(queries);

    // Card
    const cardKey = cleanUrlKey(pl.image?.src);
    const isBadCard = !cardKey || fileUsed.has(cardKey) || cardKey.includes('local_fair_market') || cardKey.includes('rachakonda_viswanatha_sastry') || cardKey.includes('district.png');
    if (isBadCard) {
      const u = await pickUnique(candidates, fileUsed);
      if (u) pl.image = { src: u, alt: `${pl.name} — Sri Sri Nookambika Temple` };
    } else {
      fileUsed.add(cardKey);
    }

    // Photos
    const goodPhotos = [];
    for (const ph of (pl.photos || [])) {
      const u = ph.src || ph;
      const k = cleanUrlKey(u);
      if (k && !fileUsed.has(k) && !k.includes('local_fair_market') && !k.includes('rachakonda_viswanatha_sastry')) {
        fileUsed.add(k);
        goodPhotos.push(u);
      }
    }

    while (goodPhotos.length < 3) {
      const u = await pickUnique(candidates, fileUsed);
      if (u) {
        goodPhotos.push(u);
      } else {
        const genCand = await getCandidates(['Bojjannakonda', 'Visakhapatnam landscape Andhra', 'Andhra Pradesh nature hills']);
        const u2 = await pickUnique(genCand, fileUsed);
        if (u2) goodPhotos.push(u2);
        else break;
      }
    }
    pl.photos = goodPhotos;
    console.log(`  P${i} ${pl.name}: Card + ${pl.photos.length} photos`);
  }

  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  console.log('Sri Sri Nookambika Temple updated. Total unique URLs:', fileUsed.size);
}

async function run() {
  await fixMunger();
  await fixRohtasgarh();
  await fixNookambika();
  console.log('\n=== ALL 3 COMPLETED! ===');
}

run().catch(console.error);
