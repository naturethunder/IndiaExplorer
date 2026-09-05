const fs = require('fs');
const path = require('path');
const {
  destDir,
  TARGET_SLUGS,
  cleanUrlKey,
  globalUsed,
  isLiveImage,
  isRejected,
  searchUnsplash,
  searchPexels,
  searchOpenverse,
  searchWikimedia
} = require('./image-search-engine.js');

function isAuthenticMatch(item, placeName, destTitle, destState) {
  const title = (item.title || '').toLowerCase();
  const url = (item.url || '').toLowerCase();
  const combined = title + ' ' + url;

  // 1. Reject negative keywords and foreign places
  if (isRejected(item.title, item.url, destState)) return false;

  // 2. Foreign terms rejection
  const foreignTerms = [
    'voortrekker', 'south africa', 'taipei', 'taiwan', 'buenos aires', 'argentina',
    'chinese pavilion', 'bangkok', 'thailand', 'vietnam', 'japan', 'shanghai', 'beijing',
    'europe', 'london', 'new york', 'california', 'chicago', 'paris', 'germany'
  ];
  for (const ft of foreignTerms) {
    if (combined.includes(ft)) return false;
  }

  // 3. For Pexels: verify relevance to India or the specific destination
  if (item.provider === 'pexels') {
    const dLower = (destTitle || '').toLowerCase();
    const sLower = (destState || '').toLowerCase();
    const pLower = (placeName || '').toLowerCase();
    const isMatched = (combined.includes(dLower) || combined.includes(sLower) || combined.includes('india')) &&
                      (combined.includes(dLower) || combined.includes(sLower) || combined.includes(pLower) ||
                       combined.includes('temple') || combined.includes('fort') || combined.includes('ghat') ||
                       combined.includes('rhino') || combined.includes('elephant') || combined.includes('gibbon') ||
                       combined.includes('sanctuary') || combined.includes('stupa') || combined.includes('buddhist') ||
                       combined.includes('heritage') || combined.includes('ruins'));
    if (!isMatched) return false;
  }

  // 4. For Unsplash: ensure no foreign or unrelated subjects
  if (item.provider === 'unsplash') {
    const dLower = (destTitle || '').toLowerCase();
    const sLower = (destState || '').toLowerCase();
    const pLower = (placeName || '').toLowerCase();
    // If not matching destination or state or india or place, reject
    if (!combined.includes(dLower) && !combined.includes(sLower) && !combined.includes('india') && !combined.includes(pLower)) {
      return false;
    }
  }

  return true;
}

// Helper to select best valid image from candidates
async function selectBestImage(candidates, fileUsedUrls, placeName, destTitle, destState = '') {
  for (const c of candidates) {
    if (!c.url) continue;
    const key = cleanUrlKey(c.url);
    if (!key) continue;
    if (globalUsed.has(key)) continue;
    if (fileUsedUrls.has(key)) continue;
    if (!isAuthenticMatch(c, placeName, destTitle, destState)) continue;

    // Check if live
    const ok = await isLiveImage(c.url);
    if (ok) {
      fileUsedUrls.add(key);
      return {
        src: c.url,
        alt: `${placeName} — ${destTitle}`,
        provider: c.provider,
        title: c.title
      };
    }
  }
  return null;
}

// Fetch candidates with priority: Unsplash -> Pexels -> Openverse -> Wikimedia in LAST
async function fetchCandidates(queries, limit = 8, destState = '') {
  const list = [];
  const seen = new Set();

  function pushItem(item) {
    const k = cleanUrlKey(item.url);
    if (!k || seen.has(k)) return;
    if (isRejected(item.title, item.url, destState)) return;
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

  // 3. Openverse (Flickr and open repositories)
  for (const q of queries) {
    try {
      const res = await searchOpenverse(q, limit);
      for (const it of res) pushItem(it);
    } catch(e) {}
  }

  // 4. Wikimedia Commons (LAST RESORT ONLY - called if other APIs provide fewer than 15 candidate items)
  if (list.length < 15) {
    for (const q of queries) {
      try {
        const res = await searchWikimedia(q, limit);
        for (const it of res) pushItem(it);
      } catch(e) {}
    }
  }

  return list;
}

// Destination query definitions
const DEST_CONFIGS = {
  'varanasi': {
    galleryQueries: [
      ['Varanasi Ghats sunrise Ganga', 'Dashashwamedh Ghat Varanasi'],
      ['Varanasi boat ride Ganga river morning', 'Varanasi Ghats panoramic'],
      ['Ganga Aarti ceremony Varanasi Dashashwamedh', 'Varanasi evening Aarti'],
      ['Kashi Vishwanath Temple Varanasi', 'Varanasi ancient temple architecture'],
      ['Assi Ghat Varanasi sunrise', 'Manikarnika Ghat Varanasi sacred river']
    ],
    galleryAlts: [
      'Varanasi Ghats along the holy River Ganga at sunrise',
      'Morning boat ride along the ancient ghats of Varanasi',
      'Grand evening Ganga Aarti ceremony at Dashashwamedh Ghat',
      'Spiritual temple architecture and heritage of Varanasi',
      'Sacred riverfront and serene morning atmosphere at Assi Ghat'
    ],
    places: [
      { name: 'Dashashwamedh Ghat Aarti', queries: ['Dashashwamedh Ghat Aarti Varanasi', 'Ganga Aarti Varanasi evening', 'Varanasi Aarti priests ghat'] },
      { name: 'Dawn Boat Ride on Ganga', queries: ['Sunrise boat ride Ganges Varanasi', 'Varanasi boats morning Ganga', 'Banaras river sunrise'] },
      { name: 'Kashi Vishwanath Temple', queries: ['Kashi Vishwanath Temple Varanasi', 'Kashi Vishwanath corridor Varanasi', 'Golden Temple Varanasi temple'] },
      { name: 'Sarnath', queries: ['Sarnath Dhamek Stupa Varanasi', 'Sarnath Buddhist ruins Varanasi', 'Sarnath deer park stupa'] },
      { name: 'Manikarnika Ghat', queries: ['Manikarnika Ghat Varanasi', 'Manikarnika Ghat Ganges sacred', 'Varanasi burning ghat Ganges'] },
      { name: 'Assi Ghat', queries: ['Assi Ghat Varanasi morning', 'Assi Ghat Ganga sunrise', 'Subah-e-Banaras Assi Ghat'] },
      { name: 'Ramnagar Fort Museum', queries: ['Ramnagar Fort Varanasi Ganges', 'Ramnagar Fort palace Varanasi', 'Ramnagar Fort museum ramparts'] },
      { name: 'Silk Weaving Workshop', queries: ['Banarasi silk weaving loom Varanasi', 'Banarasi saree weavers Varanasi', 'Silk weaving loom India'] },
      { name: 'New Vishwanath Temple (BHU)', queries: ['New Vishwanath Temple BHU Varanasi', 'Birla Temple BHU Varanasi marble', 'BHU Vishwanath temple spire'] },
      { name: 'Tulsi Manas Temple', queries: ['Tulsi Manas Temple Varanasi', 'Tulsi Manas Mandir marble Varanasi', 'Varanasi Tulsi temple'] },
      { name: 'Durga Kund Temple', queries: ['Durga Kund Mandir Varanasi red', 'Durga Temple Varanasi monkey temple', 'Durga Mandir Varanasi kund'] },
      { name: 'Bharat Mata Temple', queries: ['Bharat Mata Temple Varanasi map', 'Bharat Mata Mandir Varanasi marble', 'Bharat Mata temple India'] },
      { name: 'Chunar Fort', queries: ['Chunar Fort Mirzapur Ganges', 'Chunar Fort sandstone ramparts', 'Chunar Fort Uttar Pradesh'] },
      { name: 'Man Mandir Observatory', queries: ['Man Mandir Ghat Varanasi observatory', 'Jantar Mantar observatory Varanasi', 'Man Mandir Ghat Varanasi'] }
    ]
  },

  'bijapur-fort': {
    galleryQueries: [
      ['Gol Gumbaz Bijapur dome', 'Gol Gumbaz monument Karnataka'],
      ['Ibrahim Rauza Bijapur mausoleum', 'Ibrahim Rauza architecture'],
      ['Bara Kaman Bijapur arches', 'Bara Kaman monument Karnataka'],
      ['Bijapur Fort ramparts walls', 'Bijapur heritage Adil Shahi'],
      ['Gagan Mahal Bijapur palace', 'Jod Gumbaz Bijapur monument']
    ],
    galleryAlts: [
      'Gol Gumbaz monumental dome in Bijapur, Karnataka',
      'Ibrahim Rauza historic garden mausoleum complex in Bijapur',
      'Bara Kaman majestic unfinished stone arches in Bijapur',
      'Historic stone fortification and bastions of Bijapur Fort',
      'Gagan Mahal and royal heritage palaces of the Adil Shahi dynasty'
    ],
    places: [
      { name: 'Bijapur', queries: ['Bijapur Gol Gumbaz Karnataka', 'Bijapur monument Karnataka heritage', 'Bijapur city Adil Shahi'] },
      { name: 'Jod Gumbaz', queries: ['Jod Gumbaz Bijapur', 'Two sisters tomb Bijapur', 'Jod Gumbaz monument Karnataka'] },
      { name: 'Malik-E-Maidan', queries: ['Malik-e-Maidan cannon Bijapur', 'Malik-e-Maidan Bijapur Burj-E-Sherz', 'Bijapur fort cannon bastion'] },
      { name: 'Ibrahim Rauza', queries: ['Ibrahim Rauza Bijapur', 'Ibrahim Rauza tomb complex Karnataka', 'Ibrahim Roza Bijapur'] },
      { name: 'Bara Kaman', queries: ['Bara Kaman Bijapur arches', 'Bara Kaman monument Karnataka', 'Bara Kaman stone arcade'] },
      { name: 'Andu Masjid', queries: ['Andu Masjid Bijapur mosque', 'Andu Masjid two-storeyed Bijapur', 'Bijapur historic mosque'] },
      { name: 'Mecca Masjid, Bijapur', queries: ['Mecca Masjid Bijapur mosque', 'Makkah Masjid Bijapur Karnataka', 'Bijapur Adil Shahi mosque'] },
      { name: 'Nav Gumbaz', queries: ['Nav Gumbaz Bijapur monument', 'Nau Gumbaz nine domes Bijapur', 'Bijapur heritage domes'] }
    ]
  },

  'munger-fort': {
    galleryQueries: [
      ['Munger Fort ramparts Bihar', 'Fort of Munger Bihar'],
      ['Kashtaharni Ghat Munger Ganges', 'Munger Ganga riverfront'],
      ['Munger Fort ancient gate entrance', 'Munger heritage palace Bihar'],
      ['Munger Ganga Bridge Sri Krishna Setu', 'Munger bridge Ganges'],
      ['Chandika Sthan Munger temple', 'Munger historic monument Bihar']
    ],
    galleryAlts: [
      'Historic ramparts and fortifications of Munger Fort along River Ganga',
      'Sacred Kashtaharni Ghat on the banks of River Ganga in Munger',
      'Ancient arched entrance gateway of Munger Fort',
      'Sri Krishna Setu rail and road bridge across River Ganga in Munger',
      'Sacred Chandika Sthan temple courtyard in Munger, Bihar'
    ],
    places: [
      { name: 'Munger', queries: ['Munger Fort ramparts Bihar', 'Munger town Ganges Bihar', 'Fort of Munger'] },
      { name: 'Tarapur, Bihar', queries: ['Tarapur Munger landscape Bihar', 'Tarapur Shahid Smarak Bihar', 'Munger district countryside Bihar'] },
      { name: 'Kastaharni Ghat', queries: ['Kashtaharni Ghat Munger Ganges', 'Kastaharni Ghat Bihar river', 'Munger Ganga ghat'] },
      { name: 'Kaunhara Ghat', queries: ['Kaunhara Ghat Munger riverfront', 'Munger riverfront Ganga Bihar', 'Karnachaura Munger Ganga'] },
      { name: 'Chandika Sthan', queries: ['Chandika Sthan Munger temple', 'Maa Chandika Sthan Munger', 'Chandika Sthan Shakti Peeth Bihar'] },
      { name: 'Munger Ganga Bridge', queries: ['Munger Ganga Bridge Sri Krishna Setu', 'Munger bridge rail road', 'Sri Krishna Setu Munger'] },
      { name: 'Khajuraha', queries: ['Khajuraha Munger hills Bihar', 'Munger countryside landscape', 'Kharagpur hills Munger Bihar'] },
      { name: 'Nauagarhi', queries: ['Nauagarhi Munger countryside', 'Nauagarhi rural Munger Bihar', 'Munger green landscape Bihar'] }
    ]
  },

  'nalanda': {
    galleryQueries: [
      ['Nalanda University ruins Temple 3', 'Nalanda ancient university Bihar'],
      ['Sariputra Stupa Nalanda ruins', 'Nalanda Mahavihara excavated brick'],
      ['Xuanzang Memorial Hall Nalanda', 'Hiuen Tsang memorial Nalanda'],
      ['Nalanda ancient monastery vihara walkway', 'Nalanda world heritage site'],
      ['Nalanda Archaeological Museum Bihar', 'Nalanda ruins panorama']
    ],
    galleryAlts: [
      'Temple No. 3 and Sariputra Stupa at the ancient Nalanda University ruins',
      'Excavated brick viharas and monasteries of ancient Nalanda Mahavihara',
      'Xuanzang Memorial Hall pagoda architecture in Nalanda, Bihar',
      'Ancient corridors and brick masonry at Nalanda UNESCO World Heritage Site',
      'Courtyard and archaeological landscape of the ancient university of Nalanda'
    ],
    places: [
      { name: 'Nalanda University Ruins', queries: ['Nalanda University ruins Temple 3', 'Nalanda Mahavihara ruins Bihar', 'Sariputra Stupa Nalanda'] },
      { name: 'Nalanda Archaeological Museum', queries: ['Nalanda Archaeological Museum sculptures', 'Nalanda museum artifacts Bihar', 'Nalanda archaeological site museum'] },
      { name: 'Xuanzang Memorial Hall', queries: ['Xuanzang Memorial Hall Nalanda', 'Xuanzang Memorial Hall', 'Hieun Tsang memorial Nalanda', 'Xuanzang memorial Nalanda'] }
    ]
  },

  'rohtasgarh-fort': {
    galleryQueries: [
      ['Rohtasgarh Fort palace ruins Son river', 'Rohtasgarh Fort Bihar ramparts'],
      ['Hathiya Pol elephant gate Rohtasgarh', 'Rohtas Fort gate Bihar'],
      ['Aina Mahal palace Rohtasgarh Fort', 'Rohtasgarh palace architecture'],
      ['Jama Masjid Rohtasgarh Fort Bihar', 'Rohtasgarh Fort mosque stone'],
      ['Rohtas plateau Son river valley Kaimur', 'Rohtasgarh Fort hill view Bihar']
    ],
    galleryAlts: [
      'Majestic ruins of Rohtasgarh Fort perched on the Kaimur plateau',
      'Historic Hathiya Pol (Elephant Gate) at Rohtasgarh Fort, Bihar',
      'Ruins of Aina Mahal palace inside Rohtasgarh Fort',
      'Ancient stone carved Jama Masjid within Rohtasgarh Fort complex',
      'Panoramic view of the Son River valley from Rohtasgarh Fort plateau'
    ],
    places: [
      { name: 'Maghigawan', queries: ['Rohtasgarh Fort plateau Kaimur', 'Rohtasgarh fort hills Son valley', 'Rohtasgarh plateau forest Bihar'] },
      { name: 'Akbarpur, Rohtas', queries: ['Akbarpur Rohtas foot of fort', 'Rohtasgarh fort approach Akbarpur', 'Akbarpur village Rohtas Bihar'] },
      { name: 'Banjari, Bihar', queries: ['Banjari Rohtas Son river valley', 'Banjari Kaimur hills Bihar', 'Son river landscape Rohtas'] },
      { name: 'Deorikalan', queries: ['Deorikalan Rohtas plateau landscape', 'Rohtasgarh fort surroundings', 'Kaimur plateau landscape Rohtas'] }
    ]
  },

  'sri-sri-nookambika-ammavari-temple': {
    galleryQueries: [
      ['Sri Sri Nookambika Ammavari Temple Anakapalle', 'Nookambika temple gopuram Andhra'],
      ['Nookambika temple sanctum festival Anakapalli', 'Anakapalle temple festival lights'],
      ['Bojjannakonda Buddhist rock-cut stupas Anakapalle', 'Bojjannakonda Buddhist caves Sankaram'],
      ['Sarada river valley Anakapalle Andhra Pradesh', 'Anakapalle hills green landscape'],
      ['Anakapalle town jaggery market Andhra', 'Anakapalle heritage Andhra Pradesh']
    ],
    galleryAlts: [
      'Gopuram and sacred entrance of Sri Sri Nookambika Ammavari Temple in Anakapalle',
      'Festive illuminations and devotees at Nookambika Temple, Anakapalle',
      'Ancient Buddhist rock-cut stupas of Bojjannakonda near Anakapalle',
      'Scenic green hills and Sarada River valley near Anakapalle',
      'Traditional heritage and vibrant markets of Anakapalle, Andhra Pradesh'
    ],
    places: [
      { name: 'Narsipatnam revenue division', queries: ['Narsipatnam Eastern Ghats hills', 'Lambasingi hills Visakhapatnam Andhra', 'Narsipatnam coffee hills Andhra'] },
      { name: 'Paderu revenue division', queries: ['Paderu Eastern Ghats hills Andhra', 'Paderu valley coffee plantation', 'Araku Paderu hills Visakhapatnam'] },
      { name: 'Anakapalli revenue division', queries: ['Anakapalle town Sarada river Andhra', 'Anakapalli heritage market', 'Anakapalle jaggery market town'] },
      { name: 'Anakapalli mandal', queries: ['Anakapalle temple rural landscape', 'Anakapalli mandal countryside Andhra', 'Sarada river Anakapalle'] },
      { name: 'Anakapalli', queries: ['Bojjannakonda Buddhist caves Anakapalle', 'Bojjannakonda stupas Sankaram', 'Anakapalle town Andhra Pradesh'] },
      { name: 'Bowluvada', queries: ['Bowluvada Anakapalle countryside hills', 'Sarada river valley Anakapalle', 'Anakapalle rural scenery Andhra'] },
      { name: 'Golagam', queries: ['Golagam Anakapalle agricultural landscape', 'Anakapalle green fields Andhra', 'Rural Andhra Pradesh farmland'] },
      { name: 'Thummapala', queries: ['Thummapala Anakapalle rural scenery', 'Thummapala sugar factory Anakapalle', 'Anakapalle landscape Andhra Pradesh'] }
    ]
  },

  'kaziranga': {
    galleryQueries: [
      ['Indian one-horned rhinoceros Kaziranga National Park', 'Kaziranga rhino grassland Assam'],
      ['Elephant safari Kaziranga morning grassland mist', 'Kaziranga elephant safari Assam'],
      ['Wild water buffalo Kaziranga National Park Assam', 'Swamp deer Kaziranga National Park'],
      ['Kaziranga Orchid and Biodiversity Park flowers', 'Kaziranga National Orchid Park Assam'],
      ['Lush green tea garden landscape Assam Kaziranga', 'Assam tea plantation Kaziranga']
    ],
    galleryAlts: [
      'Greater One-Horned Rhinoceros grazing in the vast grasslands of Kaziranga',
      'Morning elephant safari traversing misty floodplains of Kaziranga National Park',
      'Wild water buffalo and endemic wildlife in Kaziranga marshlands',
      'Exotic indigenous wild orchids blooming at Kaziranga Orchid Park',
      'Vibrant green tea plantations bordering Kaziranga National Park in Assam'
    ],
    places: [
      { name: 'Elephant Safari', queries: ['Elephant safari Kaziranga morning mist', 'Kaziranga elephant ride rhino grassland', 'Kaziranga safari elephant Assam'] },
      { name: 'Jeep Safari (Central Range)', queries: ['Kaziranga Kohora central range jeep safari', 'Jeep safari rhino Kaziranga', 'Kaziranga jeep safari trail'] },
      { name: 'Kaziranga Orchid Park', queries: ['Kaziranga Orchid and Biodiversity Park flowers', 'Kaziranga orchid park greenhouse', 'Assam orchids Kaziranga park'] },
      { name: 'Western Range (Bagori)', queries: ['Bagori range Kaziranga rhino waterhole', 'Kaziranga western range Bagori rhinos', 'Bagori wetland Kaziranga'] },
      { name: 'Brahmaputra River Boat Ride', queries: ['Brahmaputra river dolphin boat safari Assam', 'Brahmaputra boat ride Kaziranga', 'River Brahmaputra boat Assam'] },
      { name: 'Kohora Market', queries: ['Kohora market Kaziranga Assam handloom', 'Assam tea cane crafts market Kohora', 'Kaziranga local craft market'] },
      { name: 'Gibbon Wildlife Sanctuary', queries: ['Hoolock gibbon swinging Assam canopy', 'Hoolock gibbon Assam tree canopy', 'Western Hoolock gibbon branch'] },
      { name: 'Eastern Range (Agoratoli)', queries: ['Agoratoli wetland waterbirds Kaziranga', 'Agoratoli range Kaziranga birding', 'Kaziranga eastern range pelicans waterbody'] },
      { name: 'Burapahar Range (Ghorakati)', queries: ['Burapahar Kaziranga hilly forest trail', 'Burapahar range rhinos Kaziranga', 'Ghorakati Kaziranga forested hills'] },
      { name: 'Panbari Reserve Forest', queries: ['Panbari reserve forest semi-evergreen Assam', 'Panbari forest Golaghat Assam', 'Kaziranga Panbari birding trail'] },
      { name: 'Kakochang Waterfall', queries: ['Kakochang waterfall Bokakhat Golaghat', 'Kakochang falls Kaziranga Assam', 'Kakochang waterfall cascade'] },
      { name: 'Deopahar Ruins', queries: ['Deopahar ancient temple ruins Golaghat', 'Deopahar ruins sculpture Assam', 'Deopahar stone carving monument'] },
      { name: 'Numaligarh Tea Estates', queries: ['Numaligarh lush green tea garden estate', 'Numaligarh tea plantation Assam', 'Assam tea estate garden Golaghat'] }
    ]
  },

  'hoollongapar-gibbon-sanctuary': {
    galleryQueries: [
      ['Western Hoolock Gibbon male branch Hoollongapar', 'Hoolock gibbon Jorhat Assam'],
      ['Hoolock Gibbon family canopy Hoollongapar', 'Hoollongapar Gibbon Sanctuary primate'],
      ['Capped langur tree branch Hoollongapar Assam', 'Capped langur primate Jorhat'],
      ['Wild elephants tea estate boundary Jorhat Hoollongapar', 'Elephant herd Mariani Jorhat Assam'],
      ['Evergreen rainforest canopy Hoollongapar Jorhat Assam', 'Hoollongapar rainforest trail Assam']
    ],
    galleryAlts: [
      'Male Western Hoolock Gibbon calling from high canopy in Hoollongapar Sanctuary',
      'Hoolock Gibbon swinging through dense foliage in Hoollongapar, Jorhat',
      'Capped langur perched among branches in Hoollongapar Gibbon Sanctuary',
      'Wild Asian elephants near tea estate boundaries adjoining Hoollongapar',
      'Pristine semi-evergreen rainforest canopy and trails in Hoollongapar Sanctuary'
    ],
    places: [
      { name: 'Mariani, Jorhat', queries: ['Mariani Jorhat tea gardens forest edge', 'Mariani town railway Assam Jorhat', 'Mariani green tea estate landscape'] }
    ]
  },

  'orang-national-park': {
    galleryQueries: [
      ['Indian rhinoceros grazing Orang National Park grassland', 'Orang National Park rhino Assam'],
      ['Bengal florican in tall grassland Orang National Park', 'Bengal florican grassland Assam'],
      ['Wild elephant herd Brahmaputra floodplain Orang', 'Wild elephants Orang National Park'],
      ['Brahmaputra riverine landscape Orang Assam', 'Orang National Park grassland riverbed'],
      ['Royal Bengal Tiger habitat grasslands Orang National Park', 'Orang National Park safari track']
    ],
    galleryAlts: [
      'One-horned rhinoceros grazing in the alluvial grasslands of Orang National Park',
      'Rare Bengal florican foraging in the tall elephant grass of Orang Sanctuary',
      'Wild elephant herd traversing the Brahmaputra floodplains in Orang National Park',
      'Serene riverine landscape and wetland waterbodies in Orang National Park',
      'Scenic safari trail through the tiger and rhino grasslands of Orang, Assam'
    ],
    places: [
      { name: 'Brahmaputra Valley', queries: ['Brahmaputra river alluvial valley grasslands Assam', 'Brahmaputra floodplain landscape Assam', 'River Brahmaputra scenic valley Assam'] }
    ]
  }
};

async function processDestination(slug) {
  console.log(`\n======================================================`);
  console.log(`Processing destination: ${slug}`);

  const filePath = path.join(destDir, slug + '.json');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const config = DEST_CONFIGS[slug];
  if (!config) {
    console.error(`No configuration for ${slug}`);
    return;
  }

  const fileUsedUrls = new Set();
  const providerStats = { unsplash: 0, pexels: 0, openverse: 0, wikimedia: 0 };

  // 1. Process 5 Gallery Images (and set heroImage)
  console.log(`Acquiring 5 unique HD gallery images...`);
  const newGallery = [];

  for (let i = 0; i < 5; i++) {
    const qList = config.galleryQueries[i] || [`${d.title} ${d.state}`, `${d.title} landmark`];
    const altText = config.galleryAlts[i] || `${d.title} — ${d.state}`;

    console.log(`  Gallery [${i}]: searching queries ->`, qList[0]);
    const candidates = await fetchCandidates(qList, 8, d.state);
    const chosen = await selectBestImage(candidates, fileUsedUrls, d.title, d.state, d.state);

    if (chosen) {
      providerStats[chosen.provider] = (providerStats[chosen.provider] || 0) + 1;
      newGallery.push({
        src: chosen.src,
        alt: altText
      });
      console.log(`    ✓ Chosen (${chosen.provider}): ${chosen.src}`);
    } else {
      console.warn(`    ⚠️ Could not find candidate for gallery [${i}], keeping fallback`);
      // Fallback to existing if unique
      const existing = d.gallery?.[i];
      if (existing && existing.src && !fileUsedUrls.has(cleanUrlKey(existing.src))) {
        fileUsedUrls.add(cleanUrlKey(existing.src));
        newGallery.push(existing);
      }
    }
  }

  // Enforce heroImage matching gallery[0]
  if (newGallery.length > 0) {
    d.heroImage = {
      src: newGallery[0].src,
      alt: newGallery[0].alt || `${d.title} — ${d.state}`
    };
    d.gallery = newGallery;
  }

  // 2. Process Places
  console.log(`Acquiring images for ${d.topPlaces?.length || 0} topPlaces...`);
  if (d.topPlaces && Array.isArray(d.topPlaces)) {
    for (let pIdx = 0; pIdx < d.topPlaces.length; pIdx++) {
      const place = d.topPlaces[pIdx];
      const pConfig = config.places.find(p => p.name.toLowerCase() === place.name.toLowerCase())
        || config.places[pIdx]
        || { name: place.name, queries: [`${place.name} ${d.title}`, `${place.name} ${d.state}`] };

      console.log(`  Place [${pIdx}]: ${place.name}`);

      // A. Pool of candidates for this place
      const placeQueries = [
        ...pConfig.queries,
        `${place.name} ${d.title}`,
        `${place.name} ${d.state}`,
        `${place.name}`
      ];
      const placeCandidates = await fetchCandidates(placeQueries, 15, d.state);

      // Card thumbnail
      const chosenCard = await selectBestImage(placeCandidates, fileUsedUrls, place.name, d.title, d.state);
      if (chosenCard) {
        providerStats[chosenCard.provider] = (providerStats[chosenCard.provider] || 0) + 1;
        place.image = {
          src: chosenCard.src,
          alt: `${place.name} — ${d.title}`
        };
        console.log(`    ✓ Card (${chosenCard.provider}): ${chosenCard.src}`);
      }

      // B. Exactly 3 unique photos
      const newPhotos = [];
      for (let phIdx = 0; phIdx < 3; phIdx++) {
        let chosenPhoto = await selectBestImage(placeCandidates, fileUsedUrls, place.name, d.title, d.state);
        if (chosenPhoto) {
          providerStats[chosenPhoto.provider] = (providerStats[chosenPhoto.provider] || 0) + 1;
          newPhotos.push(chosenPhoto.src);
          console.log(`    ✓ Photo ${phIdx + 1}/3 (${chosenPhoto.provider}): ${chosenPhoto.src}`);
        } else {
          // Try broader destination queries if place-specific candidates exhausted
          const broaderQueries = [
            `${d.title} ${d.state} ${place.name}`,
            `${d.title} ${d.state} heritage`,
            `${d.title} landscape`,
            `${d.title} monument`
          ];
          const broaderCandidates = await fetchCandidates(broaderQueries, 10, d.state);
          chosenPhoto = await selectBestImage(broaderCandidates, fileUsedUrls, place.name, d.title, d.state);
          if (chosenPhoto) {
            providerStats[chosenPhoto.provider] = (providerStats[chosenPhoto.provider] || 0) + 1;
            newPhotos.push(chosenPhoto.src);
            console.log(`    ✓ Photo ${phIdx + 1}/3 (fallback ${chosenPhoto.provider}): ${chosenPhoto.src}`);
          } else {
            console.warn(`    ⚠️ Could not find candidate for photo ${phIdx + 1}/3`);
          }
        }
      }

      place.photos = newPhotos;

      place.photos = newPhotos;
    }
  }

  // 3. Save JSON
  fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf8');
  console.log(`\nSuccessfully updated ${filePath}`);
  console.log(`Provider distribution for ${slug}:`, providerStats);
  console.log(`Total unique URLs used in file: ${fileUsedUrls.size}`);
}

async function run() {
  const argSlug = process.argv[2];
  const slugsToRun = argSlug ? [argSlug] : TARGET_SLUGS;
  console.log('=== STARTING HD AUTHENTIC IMAGE FIX FOR ' + slugsToRun.length + ' DESTINATION(S) ===');
  for (const slug of slugsToRun) {
    await processDestination(slug);
  }
  console.log('\n=== DESTINATIONS PROCESSED ===');
}

run().catch(console.error);
