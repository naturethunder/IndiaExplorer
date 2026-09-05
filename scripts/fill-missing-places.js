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

const TARGETS = [
  'bijapur-fort',
  'munger-fort',
  'rohtasgarh-fort',
  'sri-sri-nookambika-ammavari-temple',
  'kaziranga',
  'hoollongapar-gibbon-sanctuary'
];

function isAuthenticMatch(item, destTitle, destState) {
  const text = ((item.title || '') + ' ' + (item.url || '')).toLowerCase();

  // Negative terms
  const badTerms = [
    'fish', 'wallago', 'garra', 'aenigmachanna', 'murrel', 'dog', 'puppy',
    'selfie', 'portrait', 'close-up of face', 'model', 'wedding pose',
    'map', 'flag', 'logo', 'diagram', 'icon', 'stamp', 'census', 'drawing',
    'district.png', 'division_in_', 'interim_agreements',
    'hajdúszoboszló', 'hungary', 'bastion', 'kalvin', 'ziegelmauer',
    'taipei', 'taiwan', 'buenos aires', 'argentina', 'chinese pavilion',
    'rachakonda_viswanatha_sastry', 'local_fair_market'
  ];
  for (const b of badTerms) {
    if (text.includes(b)) return false;
  }

  // State mismatch
  const s = (destState || '').toLowerCase();
  if (s === 'bihar') {
    if (text.includes('delhi') || text.includes('karnataka') || text.includes('tamil nadu') || text.includes('telangana') || text.includes('kerala') || text.includes('rohtasgarh') && destTitle.includes('munger')) return false;
  } else if (s === 'assam') {
    if (text.includes('rajasthan') || text.includes('gujarat') || text.includes('tamil nadu') || text.includes('kerala') || text.includes('telangana') || text.includes('bihar')) return false;
  } else if (s === 'karnataka') {
    if (text.includes('bihar') || text.includes('assam') || text.includes('delhi') || text.includes('rajasthan') || text.includes('goa')) return false;
  } else if (s.includes('andhra')) {
    if (text.includes('delhi') || text.includes('rajasthan') || text.includes('punjab') || text.includes('bihar') || text.includes('assam')) return false;
  }

  return true;
}

async function fetchCandidateList(queries, limit = 10, destTitle = '', destState = '') {
  const list = [];
  const seen = new Set();

  function pushItem(item) {
    const k = cleanUrlKey(item.url);
    if (!k || seen.has(k)) return;
    if (!isAuthenticMatch(item, destTitle, destState)) return;
    seen.add(k);
    list.push(item);
  }

  // 1. Unsplash
  for (const q of queries) {
    try {
      const res = await searchUnsplash(q, limit);
      for (const it of res) pushItem(it);
    } catch(e) {}
  }

  // 2. Pexels
  for (const q of queries) {
    try {
      const res = await searchPexels(q, limit);
      for (const it of res) pushItem(it);
    } catch(e) {}
  }

  // 3. Openverse
  for (const q of queries) {
    try {
      const res = await searchOpenverse(q, limit);
      for (const it of res) pushItem(it);
    } catch(e) {}
  }

  // 4. Wikimedia (LAST RESORT ONLY)
  if (list.length < 12) {
    for (const q of queries) {
      try {
        const res = await searchWikimedia(q, limit);
        for (const it of res) pushItem(it);
      } catch(e) {}
    }
  }

  return list;
}

async function selectBestValid(candidates, fileUsedUrls, placeName, destTitle, destState) {
  for (const c of candidates) {
    if (!c.url) continue;
    const key = cleanUrlKey(c.url);
    if (!key) continue;
    if (globalUsed.has(key)) continue;
    if (fileUsedUrls.has(key)) continue;
    if (!isAuthenticMatch(c, destTitle, destState)) continue;

    const ok = await isLiveImage(c.url);
    if (ok) {
      fileUsedUrls.add(key);
      return {
        src: c.url,
        alt: `${placeName} — ${destTitle}`,
        provider: c.provider
      };
    }
  }
  return null;
}

const FILL_QUERIES = {
  'bijapur-fort': {
    'Mecca Masjid, Bijapur': ['Mecca Masjid Bijapur', 'Makkah Masjid Bijapur Karnataka', 'Bijapur Ali Adil Shah mosque', 'Bijapur historic mosque', 'Bijapur heritage Karnataka']
  },
  'munger-fort': {
    'Tarapur, Bihar': ['Munger Bihar landscape', 'Munger countryside Bihar', 'Tarapur Munger Bihar', 'Munger Ganges hills'],
    'Kastaharni Ghat': ['Kashtaharni Ghat Munger', 'Munger Ganga ghat', 'Munger riverfront Bihar', 'River Ganga Munger sunset'],
    'Kaunhara Ghat': ['Munger riverfront Ganga Bihar', 'Karnachaura Munger', 'Munger Ganges boat Bihar', 'Munger Ganga river'],
    'Chandika Sthan': ['Chandika Asthan Munger', 'Chandika Sthan Munger temple', 'Maa Chandika Sthan Bihar', 'Munger sacred temple'],
    'Munger Ganga Bridge': ['Munger Ganga Bridge Sri Krishna Setu', 'Sri Krishna Setu Munger', 'Munger bridge rail road Ganga'],
    'Khajuraha': ['Munger hills Bihar', 'Kharagpur hills Munger', 'Munger countryside green Bihar', 'Munger landscape Bihar']
  },
  'rohtasgarh-fort': {
    'Akbarpur, Rohtas': ['Rohtasgarh Fort Bihar', 'Rohtas fort ramparts Bihar', 'Kaimur hills Rohtas Bihar', 'Rohtas plateau Son river'],
    'Deorikalan': ['Rohtasgarh Fort palace ruins', 'Rohtasgarh plateau Son valley', 'Kaimur hills landscape Bihar', 'Rohtas Bihar heritage']
  },
  'sri-sri-nookambika-ammavari-temple': {
    'Narsipatnam revenue division': ['Lambasingi hills Visakhapatnam Andhra', 'Narsipatnam hills Eastern Ghats', 'Visakhapatnam coffee hills Andhra'],
    'Paderu revenue division': ['Araku valley Visakhapatnam hills', 'Paderu Eastern Ghats Andhra', 'Araku waterfalls Andhra Pradesh', 'Eastern Ghats Visakhapatnam'],
    'Anakapalli revenue division': ['Anakapalle town Sarada river Andhra', 'Anakapalli jaggery market Andhra', 'Visakhapatnam rural hills Andhra'],
    'Anakapalli mandal': ['Anakapalle countryside Andhra Pradesh', 'Sarada river Anakapalle Andhra', 'Bojjannakonda Anakapalle Andhra'],
    'Anakapalli': ['Bojjannakonda Buddhist rock-cut caves Anakapalle', 'Bojjannakonda stupas Sankaram', 'Anakapalle heritage Andhra Pradesh'],
    'Bowluvada': ['Sarada river valley Andhra Pradesh', 'Anakapalle rural green landscape', 'Visakhapatnam green valley Andhra'],
    'Golagam': ['Andhra Pradesh farmland green fields', 'Anakapalle agricultural landscape', 'Rural Andhra Pradesh scenery'],
    'Thummapala': ['Anakapalle sugarcane fields Andhra', 'Visakhapatnam district rural landscape', 'Andhra Pradesh countryside nature']
  },
  'kaziranga': {
    'Deopahar Ruins': ['Deopahar ruins Golaghat Assam', 'Deopahar ancient temple ruins Assam', 'Deopahar heritage Assam'],
    'Numaligarh Tea Estates': ['Assam tea plantation lush green', 'Numaligarh tea estate Assam', 'Assam tea garden hills', 'Tea picking Assam plantation']
  },
  'hoollongapar-gibbon-sanctuary': {
    'Mariani, Jorhat': ['Mariani tea estate Jorhat Assam', 'Jorhat tea plantation Assam', 'Assam evergreen tea garden Jorhat', 'Mariani green landscape Assam']
  }
};

async function runFill() {
  console.log('=== FILLING MISSING PLACE PHOTOS & FIXING RESIDUAL DUPLICATES ===');

  for (const slug of TARGETS) {
    const filePath = path.join(destDir, slug + '.json');
    const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`\n------------------------------------------------------`);
    console.log(`Auditing & Repairing: ${slug}`);

    // Build used URLs set for this file
    const fileUsedUrls = new Set();
    if (d.heroImage?.src) fileUsedUrls.add(cleanUrlKey(d.heroImage.src));
    (d.gallery || []).forEach(g => g.src && fileUsedUrls.add(cleanUrlKey(g.src)));

    // Clean duplicate or corrupted card images in topPlaces
    const seenCardUrls = new Set();
    for (let i = 0; i < (d.topPlaces || []).length; i++) {
      const pl = d.topPlaces[i];
      const cardKey = cleanUrlKey(pl.image?.src);
      const isBadCard = !cardKey || seenCardUrls.has(cardKey) || fileUsedUrls.has(cardKey) ||
                        cardKey.includes('local_fair_market') || cardKey.includes('rachakonda_viswanatha_sastry') ||
                        cardKey.includes('district.png') || cardKey.includes('ziegelmauer') || cardKey.includes('interim_agreements');

      if (isBadCard) {
        console.log(`  Replacing invalid/duplicate card image for P${i}: ${pl.name}`);
        const placeConfigQueries = FILL_QUERIES[slug]?.[pl.name] || [`${pl.name} ${d.title}`, `${d.title} ${d.state} landscape`];
        const candidates = await fetchCandidateList(placeConfigQueries, 10, d.title, d.state);
        const chosen = await selectBestValid(candidates, fileUsedUrls, pl.name, d.title, d.state);
        if (chosen) {
          pl.image = {
            src: chosen.src,
            alt: `${pl.name} — ${d.title}`
          };
          seenCardUrls.add(cleanUrlKey(chosen.src));
          console.log(`    ✓ Replaced Card (${chosen.provider}): ${chosen.src}`);
        }
      } else {
        seenCardUrls.add(cardKey);
        fileUsedUrls.add(cardKey);
      }
    }

    // Now check photos array for every place and fill until length === 3
    for (let i = 0; i < (d.topPlaces || []).length; i++) {
      const pl = d.topPlaces[i];
      const validPhotos = [];

      // Filter out bad or duplicate photos already present
      for (const ph of (pl.photos || [])) {
        const u = ph.src || ph;
        const k = cleanUrlKey(u);
        if (k && !fileUsedUrls.has(k) && !globalUsed.has(k)) {
          fileUsedUrls.add(k);
          validPhotos.push(u);
        }
      }

      // If fewer than 3 photos, acquire more
      if (validPhotos.length < 3) {
        console.log(`  P${i} (${pl.name}) has ${validPhotos.length}/3 photos. Acquiring ${3 - validPhotos.length} more...`);
        const placeQueries = FILL_QUERIES[slug]?.[pl.name] || [
          `${pl.name} ${d.title}`,
          `${pl.name} ${d.state}`,
          `${d.title} ${d.state} heritage`,
          `${d.title} ${d.state} landscape`
        ];
        const candidates = await fetchCandidateList(placeQueries, 15, d.title, d.state);

        while (validPhotos.length < 3) {
          const chosen = await selectBestValid(candidates, fileUsedUrls, pl.name, d.title, d.state);
          if (chosen) {
            validPhotos.push(chosen.src);
            console.log(`    ✓ Added Photo ${validPhotos.length}/3 (${chosen.provider}): ${chosen.src}`);
          } else {
            // Broader fallback
            const broad = await fetchCandidateList([`${d.title} ${d.state} scenic`, `${d.title} heritage`], 10, d.title, d.state);
            const chosenBroad = await selectBestValid(broad, fileUsedUrls, pl.name, d.title, d.state);
            if (chosenBroad) {
              validPhotos.push(chosenBroad.src);
              console.log(`    ✓ Added Broad Photo ${validPhotos.length}/3 (${chosenBroad.provider}): ${chosenBroad.src}`);
            } else {
              console.warn(`    ⚠️ Still missing photo for P${i} (${pl.name})`);
              break;
            }
          }
        }
      }

      pl.photos = validPhotos;
    }

    // Save JSON
    fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
    console.log(`Updated ${filePath}`);
    console.log(`Unique URLs in file: ${fileUsedUrls.size}`);
  }
  console.log('\n=== FILL PASS COMPLETED ===');
}

runFill().catch(console.error);
