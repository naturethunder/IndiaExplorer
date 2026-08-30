const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
  // 20. Gurdwara Bal Lila Maini Sangat
  {
    slug: 'gurdwara-bal-lila-maini-sangat',
    title: 'Gurdwara Bal Lila Maini Sangat',
    state: 'Bihar',
    region: 'Patna (Central Bihar)',
    type: 'heritage',
    badge: 'Heritage',
    tagline: 'Gurdwara Bal Lila — The Childhood Play Palace of Guru Gobind Singh Ji & Sacred Chulha Sahib',
    overview: {
      short: 'Gurdwara Bal Lila Maini Sangat in Patna City marks the historic palace of Raja Fateh Chand Maini, where child Gobind Rai spent his early childhood playing and blessing Rani Maini.',
      description: 'Situated just a few hundred paces from Takht Sri Patna Sahib, Gurdwara Bal Lila is a deeply revered Sikh historical sanctuary. Child Gobind Rai (later Guru Gobind Singh Ji) would sit in the lap of childless Rani Maini, who lovingly served him boiled gram (Chhola-Poori). To this day, the unique prasad of boiled spiced chickpeas is served to all visitors from the historic Chulha Sahib hearth.',
      features: ['Childhood Palace of Guru Gobind Singh Ji', 'Historic Chulha Sahib Sacred Hearth', 'Traditional Chhola-Poori Prasad Custom', 'Takht Sri Patna Sahib Heritage Corridor'],
      altitude: '53 m', rating: 4.8, reviewCount: 16200, minPrice: 1500, distanceFromDelhi: 1010,
      about: 'A tender, sacred shrine vibrating with pure childhood devotion, selfless hospitality, and historic seventeenth-century Sikh heritage along the Ganga.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.5920, lng: 85.2280, tempSummer: '26–42°C', tempWinter: '9–24°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 18 },
      nearestRailway: { name: 'Patna Sahib Railway Station (PNC)', distance: 2 },
      roadNote: 'Located in Patna City on Maini Sangat Lane off Ashok Rajpath and Patna Marine Drive.',
      routes: [{ from: 'Patna Junction', city: 'Patna', state: 'Bihar', distance: 12, byCar: '30 mins', byTrain: 'Local train to Patna Sahib (15 mins)', byAir: 'Via Patna Airport', via: 'Ganga Path Marine Drive' }]
    },
    galleryQueries: ['Gurdwara Bal Lila Maini Sangat', 'Gurdwara Bal Lila Patna', 'Bal Lila Maini Sangat', 'Takht Sri Patna Sahib', 'Patna Sahib Sikh gurdwara'],
    places: [
      { name: 'Gurdwara Bal Lila Main Sanctum & Darbar', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '4:00 AM – 9:30 PM', duration: '1.5 hrs', rating: 4.9, description: 'White marble darbar hall preserving the sacred cradle and holy Guru Granth Sahib.', queries: ['Gurdwara Bal Lila Maini Sangat', 'Bal Lila gurdwara darbar', 'Gurdwara Bal Lila Patna', 'Patna Sahib Bal Lila'] },
      { name: 'Historic Chulha Sahib (Rani Maini Hearth)', category: 'spiritual', distance: 'Shrine Complex', entryFee: 'Free', timings: '4:00 AM – 9:30 PM', duration: '45 mins', rating: 4.8, description: 'Sacred hearth where boiled spiced grams are prepared continuously and served as unique prasad.', queries: ['Chulha Sahib Bal Lila', 'Chulha Sahib Patna', 'Rani Maini Chulha Sahib', 'Bal Lila prasad'] },
      { name: 'Takht Sri Harmandir Ji Patna Sahib', category: 'spiritual', distance: '400 m', entryFee: 'Free', timings: '3:30 AM – 10:00 PM', duration: '2.5 hrs', rating: 4.9, description: 'One of the five holy Takhts of Sikhism marking the birthplace of Guru Gobind Singh Ji.', queries: ['Takht Sri Patna Sahib', 'Patna Sahib Gurudwara', 'Harmandir Sahib Patna', 'Takht Sri Harmandir Ji'] },
      { name: 'Gurdwara Guru Ka Bagh', category: 'spiritual', distance: '2.2 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1 hr', rating: 4.7, description: 'Historic garden site where Guru Tegh Bahadur Ji rested on his return from Assam.', queries: ['Gurdwara Guru Ka Bagh Patna', 'Guru Ka Bagh Patna', 'Patna Sahib Guru Ka Bagh', 'Sikh garden gurdwara Patna'] },
      { name: 'Gurdwara Gai Ghat (Bhai Jetha Ji Shrine)', category: 'spiritual', distance: '3.2 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1 hr', rating: 4.7, description: 'Sacred riverfront shrine where Guru Nanak Dev Ji stayed on his First Udasi.', queries: ['Gurdwara Gai Ghat Patna', 'Gai Ghat Gurudwara', 'Gurdwara Gai Ghat Bihar', 'Ganga ghat gurdwara Patna'] },
      { name: 'Mangal Talab & Historic City Promenades', category: 'nature', distance: '1.2 km', entryFee: 'Free', timings: '5:30 AM – 8:00 PM', duration: '1 hr', rating: 4.5, description: 'Historic excavated water tank and public park serving as a peaceful communal retreat in Old Patna.', queries: ['Mangal Talab Patna', 'Mangal Talab Patna City', 'Patna City pond park', 'Old Patna lake'] },
      { name: 'Paduka Sahib Sacred Footprint Shrine', category: 'spiritual', distance: '800 m', entryFee: 'Free', timings: '5:00 AM – 8:30 PM', duration: '45 mins', rating: 4.6, description: 'Sacred shrine preserving the holy wooden footwear (Khadau) of Guru Tegh Bahadur Ji.', queries: ['Paduka Sahib Patna', 'Gurdwara Paduka Sahib Bihar', 'Sikh relic shrine Patna', 'Paduka Sahib Takht'] },
      { name: 'Sabhyata Dwar & Ganga Riverfront Promenade', category: 'cultural', distance: '9 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.7, description: 'Monumental 32-meter Mauryan archway on the scenic riverfront promenade along the Ganga.', queries: ['Sabhyata Dwar Patna', 'Patna Marine Drive Ganga Path', 'Sabhyata Dwar monument', 'Ganga riverfront promenade Patna'] }
    ]
  },

  // 21. Pataleshwar Mandir (Hajipur)
  {
    slug: 'pataleshwar-mandir',
    title: 'Pataleshwar Mandir',
    state: 'Bihar',
    region: 'Tirhut / Vaishali (Central Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Pataleshwar Mahadev — The Subterranean Shiva Shrine & Historic Ramchaura of Hajipur',
    overview: {
      short: 'Pataleshwar Mandir in Hajipur is an ancient subterranean Shiva temple where the Lingam is situated deep below ground level, surrounded by sacred Ramayana pilgrim ghats.',
      description: 'Located in Hajipur (Vaishali district) at the confluence of the sacred Ganga and Gandak rivers, Pataleshwar Mandir is famed for its self-manifested (Swayambhu) Shiva Lingam located inside an underground sanctum. The pilgrimage circuit includes the Ramchaura Mandir enshrining the footprint of Lord Rama and Konhara Ghat, the mythical site of Gajendra Moksha.',
      features: ['Subterranean (Patala) Shiva Lingam Sanctum', 'Ramchaura Mandir (Footprint of Lord Rama)', 'Konhara Ghat (Mythical Gajendra Moksha Sangam)', 'Proximity to Sonepur Hariharnath Temple'],
      altitude: '52 m', rating: 4.7, reviewCount: 9800, minPrice: 1200, distanceFromDelhi: 1010,
      about: 'A tranquil riverine pilgrimage hub where subterranean Shiva devotion, Ramayana footprints, and holy river confluences meet.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.6800, lng: 85.2100, tempSummer: '26–42°C', tempWinter: '9–24°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 20 },
      nearestRailway: { name: 'Hajipur Junction (HJP)', distance: 3 },
      roadNote: 'Located just 15 km north of Patna across Mahatma Gandhi Setu / JP Ganga Setu.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 15, byCar: '30 mins', byTrain: 'Train to Hajipur (20 mins)', byAir: 'Via Patna Airport', via: 'JP Setu / Gandhi Setu' }]
    },
    galleryQueries: ['Pataleshwar Mandir Hajipur', 'Ramchaura Mandir Hajipur', 'Konhara Ghat Hajipur', 'Hajipur temple Bihar', 'Gandak river Hajipur'],
    places: [
      { name: 'Pataleshwar Mahadev Subterranean Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.8, description: 'Underground stone sanctum housing the ancient Swayambhu Pataleshwar Shiva Lingam.', queries: ['Pataleshwar Mandir Hajipur', 'Pataleshwar temple Bihar', 'Pataleshwar Shiv mandir Hajipur', 'Hajipur Shiva temple'] },
      { name: 'Ramchaura Mandir (Lord Rama’s Footprints)', category: 'spiritual', distance: '1.5 km', entryFee: 'Free', timings: '5:30 AM – 8:30 PM', duration: '1 hr', rating: 4.8, description: 'Ancient temple marking the spot where Lord Rama placed his feet en route to Janakpur for Sita Swayamvar.', queries: ['Ramchaura Mandir Hajipur', 'Ramchaura temple Bihar', 'Lord Rama footprint Hajipur', 'Ramchaura mandir'] },
      { name: 'Konhara Ghat (Gajendra Moksha Sangam)', category: 'spiritual', distance: '2.5 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1.5 hrs', rating: 4.7, description: 'Sacred river confluence ghat where Lord Vishnu saved King of Elephants Gajendra from the crocodile.', queries: ['Konhara Ghat Hajipur', 'Konhara Ghat Gandak', 'Gajendra Moksha Hajipur', 'Konhara ghat Bihar'] },
      { name: 'Sonepur Harihar Nath Temple (Across Gandak)', category: 'spiritual', distance: '6 km', entryFee: 'Free', timings: '5:00 AM – 9:30 PM', duration: '2 hrs', rating: 4.9, description: 'Ancient temple enshrining the united form of Vishnu (Hari) and Shiva (Hara), home of the Asia’s largest cattle fair.', queries: ['Harihar Nath temple Sonepur', 'Sonepur temple Bihar', 'Hariharnath mandir', 'Sonepur Mela temple'] },
      { name: 'Gandak-Ganga Sacred Sangam Viewpoint', category: 'nature', distance: '2 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.6, description: 'Breathtaking broad confluence where the blue waters of Gandak merge with the muddy sacred Ganga.', queries: ['Gandak Ganga Sangam Hajipur', 'Ganga Gandak confluence', 'Hajipur river confluence', 'Gandak riverbank Bihar'] },
      { name: 'Vaishali Relic Stupa Site', category: 'heritage', distance: '34 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.8, description: 'Excavated 5th-century BCE mud stupa that contained one-eighth of the original holy bone relics of Lord Buddha.', queries: ['Vaishali Relic Stupa', 'Buddha relic stupa Vaishali', 'Vaishali excavation Bihar', 'Ancient Buddha stupa Vaishali'] },
      { name: 'Kolhua Ashokan Lion Pillar & Ananda Stupa', category: 'heritage', distance: '36 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.9, description: 'Complete polished monolithic Ashokan pillar crowned by a life-sized lion facing north towards Kushinagar.', queries: ['Kolhua Ashokan Pillar Vaishali', 'Ashoka pillar Kolhua', 'Kolhua lion pillar Bihar', 'Vaishali Ashokan pillar'] },
      { name: 'Bawan Pokhar Temple (Vaishali Lake Shrine)', category: 'spiritual', distance: '33 km', entryFee: 'Free', timings: '6:00 AM – 7:30 PM', duration: '1 hr', rating: 4.6, description: 'Pala-era temple located on the northern bank of a massive ancient water tank, housing Hindu and Jain deities.', queries: ['Bawan Pokhar temple Vaishali', 'Bawan Pokhar Bihar', 'Vaishali lake temple', 'Ancient temple Bawan Pokhar'] }
    ]
  },

  // 22. Vikramshila Gangetic Dolphin Sanctuary
  {
    slug: 'vikramshila-gangetic-dolphin-sanctuary',
    title: 'Vikramshila Gangetic Dolphin Sanctuary',
    state: 'Bihar',
    region: 'Anga / Bhagalpur (Eastern Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Vikramshila Dolphin Sanctuary — River Dolphins of the Holy Ganga & Ancient Vikramshila University',
    overview: {
      short: 'Vikramshila Gangetic Dolphin Sanctuary spans 65 kilometers of the River Ganga from Sultanganj to Kahalgaon in Bhagalpur, the only designated protected sanctuary for endangered Gangetic dolphins in Asia.',
      description: 'Protecting the national aquatic animal of India (Platanista gangetica), this river sanctuary shelters over 300 freshwater Gangetic dolphins (Susu), smooth-coated otters, gharials, and endangered Indian skimmers. The region is rich in heritage, including the 8th-century Vikramshila Ancient Buddhist University, the rock-island temple of Ajgaibinath at Sultanganj, and the Bateshwar Sthan cliff carvings.',
      features: ['Asia’s Only Protected River Dolphin Sanctuary (65 km)', 'Vikramshila Ancient Buddhist University Ruins (8th CE)', 'Ajgaibinath Rock Island Temple (Sultanganj)', 'Bateshwar Sthan Rock Sculptures & Kahalgaon Islands'],
      altitude: '52 m', rating: 4.8, reviewCount: 17800, minPrice: 1400, distanceFromDelhi: 1180,
      about: 'A breathtaking river safari paradise where playful Gangetic dolphins breach alongside ancient rock monasteries, granite islands, and silk-weaving heritage.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.2500, lng: 86.9800, tempSummer: '26–42°C', tempWinter: '9–23°C' },
    howToReach: {
      nearestAirport: { name: 'Deoghar Airport (DGH) / Patna Airport (PAT)', distance: 130 },
      nearestRailway: { name: 'Bhagalpur Junction (BGP) / Kahalgaon (CLG)', distance: 5 },
      roadNote: 'Connected via NH-80 from Munger, Bhagalpur, and Kahalgaon.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 220, byCar: '5 hrs', byTrain: 'Vande Bharat / Express (3.5 hrs)', byAir: 'Via Patna/Deoghar Airport', via: 'NH-31 and NH-80' }]
    },
    galleryQueries: ['Vikramshila Gangetic Dolphin Sanctuary', 'Gangetic dolphin Ganga', 'Ajgaibinath temple Sultanganj', 'Vikramshila ruins Antichak', 'Bateshwar Sthan Kahalgaon'],
    places: [
      { name: 'Gangetic Dolphin River Safari (Kahalgaon / Barari)', category: 'wildlife', distance: 'River Stretch', entryFee: 'Free (Boat Safari ₹500)', timings: '6:00 AM – 5:30 PM', duration: '3 hrs', rating: 4.9, description: 'Motorized and country boat safaris along the Ganga to observe endangered Gangetic dolphins surfacing and leaping.', queries: ['Gangetic dolphin Ganga', 'Vikramshila dolphin safari', 'G Dolphin Bhagalpur', 'River dolphin Bihar'] },
      { name: 'Vikramshila Ancient University Ruins (Antichak)', category: 'heritage', distance: '38 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '2.5 hrs', rating: 4.9, description: 'Excavated 8th-century Pala royal Buddhist university featuring a massive cruciform brick stupa and 52 monasteries.', queries: ['Vikramshila ruins Antichak', 'Vikramshila University Bihar', 'Vikramshila stupa', 'Ancient Vikramshila excavations'] },
      { name: 'Ajgaibinath Rock Island Temple (Sultanganj)', category: 'spiritual', distance: '28 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '2 hrs', rating: 4.8, description: 'Spectacular Shiva temple perched on a granite rock island in the Ganga, starting point of the 100km Kanwar Yatra to Deoghar.', queries: ['Ajgaibinath temple Sultanganj', 'Ajgaibinath Shiva temple', 'Sultanganj Ganga temple', 'Ajgaibinath rock temple'] },
      { name: 'Bateshwar Sthan Cliff Sculptures & Hermitage', category: 'heritage', distance: '36 km', entryFee: 'Free', timings: '6:00 AM – 6:30 PM', duration: '1.5 hrs', rating: 4.7, description: 'Scenic river bluff adorned with 6th-century rock-cut reliefs of Hindu deities and ancient hermitage caves.', queries: ['Bateshwar Sthan Kahalgaon', 'Bateshwar Sthan Bihar', 'Bateshwar rock carvings', 'Kahalgaon rock temple'] },
      { name: 'Kahalgaon Three Granite Islands (Teen Pahar)', category: 'nature', distance: '32 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Trio of picturesque rocky granite islands rising dramatically in the middle of the Ganga river channel.', queries: ['Kahalgaon granite islands', 'Teen Pahar Kahalgaon', 'Ganga rock islands Bihar', 'Kahalgaon river island'] },
      { name: 'Kuppa Ghat Maharshi Mehi Ashram & Caves', category: 'spiritual', distance: '6 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Lush riverside spiritual ashram featuring ancient subterranean meditation caves used by Sant Maharshi Mehi Paramhans.', queries: ['Kuppa Ghat Bhagalpur', 'Maharshi Mehi Ashram', 'Kuppa Ghat caves', 'Bhagalpur ashram Ganga'] },
      { name: 'Champanagar Jain Teerth (Birthplace of Vasupujya)', category: 'spiritual', distance: '8 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '1 hr', rating: 4.7, description: 'Sacred Jain pilgrimage temple marking the birthplace and salvation of 12th Tirthankar Lord Vasupujya.', queries: ['Champanagar Jain temple Bhagalpur', 'Vasupujya Jain temple Champanagar', 'Champanagar Bihar', 'Jain Teerth Bhagalpur'] },
      { name: 'Bhagalpur Tussar Silk Weaving Quarter', category: 'cultural', distance: '5 km', entryFee: 'Free', timings: '9:00 AM – 8:30 PM', duration: '1.5 hrs', rating: 4.6, description: 'Famous artisan silk village and markets known worldwide as the "Silk City of India" for handwoven Tussar sarees.', queries: ['Bhagalpur silk weaving', 'Bhagalpur Tussar silk market', 'Silk city Bhagalpur', 'Tussar silk Bihar handloom'] }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 7 (Destinations 20–22)');
  console.log('====================================================\n');

  for (const config of BATCH_CONFIGS) {
    console.log(`\n----------------------------------------------------`);
    console.log(`Processing: "${config.title}" (${config.slug})`);
    console.log(`----------------------------------------------------`);

    console.log(`Fetching 5 unique gallery images...`);
    const galleryItems = await collectUniqueImages(config.galleryQueries, 5);
    if (galleryItems.length < 5) {
      const extra = await collectUniqueImages([`${config.title} Bihar`, `Bihar landmark`, `Bihar heritage`], 5 - galleryItems.length);
      galleryItems.push(...extra);
    }

    const gallery = galleryItems.slice(0, 5).map((item, idx) => ({
      src: item.url,
      alt: `${config.title} - ${item.desc || config.title + ' scenic view ' + (idx + 1)}`.slice(0, 120).trim()
    }));

    const heroImage = {
      src: gallery[0].src,
      alt: `${config.title} in ${config.state}, India`
    };

    const topPlaces = [];
    for (let i = 0; i < config.places.length; i++) {
      const p = config.places[i];
      console.log(`  - Place ${i + 1}/8: "${p.name}"`);
      const placeImgs = await collectUniqueImages(p.queries, 4);
      if (placeImgs.length < 4) {
        console.log(`    ⚠️ Extra query needed for "${p.name}" (${placeImgs.length}/4)...`);
        const extra = await collectUniqueImages([`${p.name} Bihar`, `Bihar ${p.category} landmark`], 4 - placeImgs.length);
        placeImgs.push(...extra);
      }

      const cardImg = placeImgs[0];
      const photoImgs = placeImgs.slice(1, 4);

      topPlaces.push({
        name: p.name,
        category: p.category,
        distance: p.distance,
        entryFee: p.entryFee,
        timings: p.timings,
        duration: p.duration,
        rating: p.rating,
        description: p.description,
        image: {
          src: cardImg ? cardImg.url : gallery[0].src,
          alt: `${p.name} in ${config.title}, ${config.state}`
        },
        photos: photoImgs.map(ph => ph.url)
      });
    }

    const destinationData = {
      slug: config.slug,
      title: config.title,
      state: config.state,
      country: 'India',
      region: config.region,
      type: config.type,
      badge: config.badge,
      tagline: config.tagline,
      heroImage: heroImage,
      overview: config.overview,
      bestTime: config.bestTime,
      weather: config.weather,
      howToReach: config.howToReach,
      topPlaces: topPlaces,
      itinerary: [
        { day: 1, title: `Day 1 — Highlights of ${config.title}`, items: [
          { time: 'Morning (7:00 AM)', activity: `Explore ${topPlaces[0]?.name || config.title}`, note: 'Start your journey at the primary attraction.' },
          { time: 'Afternoon (2:00 PM)', activity: `Visit ${topPlaces[1]?.name || 'Regional Landmarks'}`, note: 'Experience local heritage and culture.' },
          { time: 'Evening (5:30 PM)', activity: 'Sunset Viewpoint & Promenade', note: 'Enjoy serene regional vistas.' }
        ]}
      ],
      hotels: [
        { name: `Hotel Grand ${config.title.split(' ')[0]}`, type: 'hotel', tier: 'better', priceMin: 2200, priceMax: 4500, rating: 4.3, reviews: 850, amenities: ['Restaurant', 'AC', 'Free WiFi', 'Room Service'], tags: ['City Center', 'Comfort'], url: `https://www.google.com/search?q=Hotel%20in%20${encodeURIComponent(config.title)}%20Bihar` }
      ],
      restaurants: [],
      activities: topPlaces.map(p => p.name),
      gallery: gallery,
      faq: [
        { q: `What is the best time to visit ${config.title}?`, a: `October to March is ideal with pleasant temperatures ranging between 9°C and 25°C.` },
        { q: `What are the primary highlights of ${config.title}?`, a: `${config.overview.short}` }
      ],
      seo: {
        title: `${config.title} Travel Guide 2026 — Places, Hotels, How to Reach | ExploreDesh`,
        description: `${config.overview.short} Plan your visit with ${topPlaces.length} top places, stays from ₹${config.overview.minPrice}/night, best time, and routes.`,
        canonical: `destination.html?slug=${config.slug}`,
        ogImage: heroImage.src,
        keywords: [
          `${config.title} travel guide`,
          `places to visit in ${config.title}`,
          `${config.title} Bihar tourism`
        ]
      }
    };

    const outPath = path.join(DEST_DIR, `${config.slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(destinationData, null, 2));
    console.log(`  💾 Saved destination to ${outPath}`);

    const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    const targetIdx = idx.destinations.findIndex(d => d.slug === config.slug);
    const summary = {
      slug: destinationData.slug,
      title: destinationData.title,
      state: destinationData.state,
      region: destinationData.region,
      type: destinationData.type,
      badge: destinationData.badge,
      short: destinationData.overview.short,
      bestTime: destinationData.bestTime,
      rating: destinationData.overview.rating,
      reviewCount: destinationData.overview.reviewCount,
      minPrice: destinationData.overview.minPrice,
      distanceFromDelhi: destinationData.overview.distanceFromDelhi,
      lat: destinationData.weather.lat,
      lng: destinationData.weather.lng,
      image: destinationData.heroImage,
      heroImage: destinationData.heroImage,
      features: destinationData.overview.features,
      tiers: ['budget', 'good', 'better', 'best', 'luxury'],
      tagline: destinationData.tagline
    };

    if (targetIdx !== -1) {
      idx.destinations[targetIdx] = summary;
    } else {
      idx.destinations.push(summary);
    }

    fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2));
    console.log(`  ✅ Synced ${config.slug} in index.json`);
  }

  console.log('\n🎉 Finished Batch 7 successfully!');
}

run().catch(console.error);
