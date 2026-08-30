const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
  {
    slug: 'kanwar-lake-bird-sanctuary',
    title: 'Kanwar Lake Bird Sanctuary',
    state: 'Bihar',
    region: 'Mithila / Begusarai (Central Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Kanwar Lake (Kabar Taal) — Asia’s Largest Freshwater Oxbow Lake & Bihar’s 1st Ramsar Site',
    overview: {
      short: 'Kanwar Lake (Kabar Taal) in Begusarai is Asia’s largest freshwater oxbow lake and Bihar’s premier Ramsar wetland, hosting over 106 species of winter migratory birds.',
      description: 'Formed as a residual oxbow meander of the Burhi Gandak River, Kabar Taal spans 67.5 square kilometers in Begusarai district. Designated as a Ramsar Wetland of International Importance in 2020, this aquatic haven shelters critically endangered species including the white-rumped vulture, Indian vulture, greater spotted eagle, and red-crested pochards. Surrounded by the historic Jaimangalgarh island temple, lush agricultural wetlands, and traditional fishing communities, it is Bihar’s crowning ecological wonderland.',
      features: ['Asia’s Largest Freshwater Oxbow Lake', 'Bihar’s First Ramsar Wetland Site (2020)', '106+ Species of Winter Migratory Waterfowl', 'Jaimangalgarh Historic Island Temple'],
      altitude: '44 m',
      rating: 4.6,
      reviewCount: 6800,
      minPrice: 1200,
      distanceFromDelhi: 1080,
      about: 'A tranquil birdwatcher’s paradise where silent country boats navigate expansive lotus marshes, tall reed beds, and ancient island shrines alive with avian calls.'
    },
    bestTime: { label: 'Nov – Mar', months: [1, 2, 3, 11, 12] },
    weather: { lat: 25.5800, lng: 86.1300, tempSummer: '26–42°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 125 },
      nearestRailway: { name: 'Begusarai Railway Station (BGS)', distance: 22 },
      roadNote: 'Located 22 km north of Begusarai town, easily accessible via SH-55 and local paved roads through Manjhaul.',
      routes: [
        { from: 'Patna', city: 'Patna', state: 'Bihar', distance: 125, byCar: '3 hrs', byTrain: 'Express train to Begusarai (2 hrs)', byAir: 'Via Patna Airport', via: 'NH-31 Eastbound' },
        { from: 'Begusarai', city: 'Begusarai', state: 'Bihar', distance: 22, byCar: '45 mins', byTrain: 'Local auto / taxi', byAir: 'Via Patna Airport', via: 'SH-55 to Manjhaul' }
      ]
    },
    galleryQueries: ['Kanwar Lake Bihar', 'Kabar Taal Begusarai', 'Kanwar Lake bird sanctuary', 'Jaimangalgarh temple Begusarai', 'Begusarai wetland bird'],
    places: [
      {
        name: 'Kabar Taal Oxbow Wetland Core',
        category: 'wildlife',
        distance: 'Centre',
        entryFee: 'Free (Boat ride ₹200)',
        timings: '6:00 AM – 5:30 PM',
        duration: '3 hrs',
        rating: 4.8,
        description: 'Vast open freshwater lagoon and marshland where thousands of migratory shovelers, garganeys, coots, and painted storks congregate during winter.',
        queries: ['Kanwar Lake Bihar', 'Kabar Taal Begusarai', 'Kabar Taal wetland', 'Bihar oxbow lake bird']
      },
      {
        name: 'Jaimangalgarh Island & Mangla Chandi Temple',
        category: 'spiritual',
        distance: 'Island in Lake',
        entryFee: 'Free',
        timings: '6:00 AM – 7:00 PM',
        duration: '1.5 hrs',
        rating: 4.7,
        description: 'Ancient fortified island mound in the center of Kabar Taal housing the revered Maa Chandi temple, surrounded by dense groves and ancient Pala-era black basalt sculptures.',
        queries: ['Jaimangalgarh temple Begusarai', 'Jaimangalgarh Begusarai', 'Jaimangalgarh island Bihar', 'Mangla Chandi temple Begusarai']
      },
      {
        name: 'Manjhaul Birdwatching Watchtower & Bund',
        category: 'nature',
        distance: '3 km',
        entryFee: 'Free',
        timings: '6:00 AM – 6:00 PM',
        duration: '1.5 hrs',
        rating: 4.6,
        description: 'Elevated timber watchtower providing panoramic 360-degree views across the lotus channels, waterfowl roosting grounds, and surrounding village wetlands.',
        queries: ['Begusarai wetland bird', 'Kabar lake watchtower', 'Bihar wetland birdwatching', 'Kanwar lake view']
      },
      {
        name: 'Simaria Ghat (Holy Ganga Sangam & Kalpwas Site)',
        category: 'spiritual',
        distance: '32 km',
        entryFee: 'Free',
        timings: 'Open 24 Hours',
        duration: '2 hrs',
        rating: 4.7,
        description: 'Sacred riverfront ghat on the River Ganga in Begusarai, famous for the month-long Kartik Kalpwas Mela, holy snan ghats, and poet Ramdhari Singh Dinkar’s memorial.',
        queries: ['Simaria Ghat Begusarai', 'Simaria Ganga Ghat Bihar', 'Simaria Ghat Ganga', 'Begusarai Ganga riverfront']
      },
      {
        name: 'Naulakha Temple (Begusarai Heritage)',
        category: 'heritage',
        distance: '21 km',
        entryFee: 'Free',
        timings: '6:00 AM – 8:00 PM',
        duration: '1 hr',
        rating: 4.5,
        description: 'Magnificent 1953 white marble and sandstone Hindu temple constructed at a cost of nine lakhs by Mahanth Mahavir Das, featuring ornate carved domes.',
        queries: ['Naulakha Temple Begusarai', 'Begusarai Naulakha Mandir', 'Naulakha Mandir Bihar', 'Begusarai Hindu temple']
      },
      {
        name: 'Barauni Thermal Power Eco Park & Lake',
        category: 'nature',
        distance: '25 km',
        entryFee: '₹20',
        timings: '9:00 AM – 6:00 PM',
        duration: '1.5 hrs',
        rating: 4.4,
        description: 'Landscaped recreational eco-park featuring lush botanical gardens, walking tracks, children’s play lawns, and illuminated evening fountains.',
        queries: ['Barauni eco park', 'Barauni Begusarai park', 'Begusarai eco garden', 'Barauni lake park']
      },
      {
        name: 'Begusarai District Archaeological Museum',
        category: 'cultural',
        distance: '20 km',
        entryFee: '₹10',
        timings: '10:30 AM – 4:30 PM (Closed Monday)',
        duration: '1 hr',
        rating: 4.4,
        description: 'Regional repository exhibiting Pala-era stone sculptures, terracotta figurines, ancient coins, and stone inscriptions discovered in the Kabar Taal region.',
        queries: ['Begusarai Museum', 'Begusarai district museum', 'Begusarai archaeology museum', 'Pala sculpture Begusarai']
      },
      {
        name: 'Burhi Gandak Riverfront & Birding Marshes',
        category: 'nature',
        distance: '8 km',
        entryFee: 'Free',
        timings: '6:00 AM – 6:00 PM',
        duration: '1.5 hrs',
        rating: 4.5,
        description: 'Meandering river banks supporting kingfishers, river terns, and freshwater waders amid golden mustard fields and scenic village floodplains.',
        queries: ['Burhi Gandak river Bihar', 'Burhi Gandak Begusarai', 'Gandak river wetland bird', 'Bihar floodplain river']
      }
    ],
    itinerary: [
      { day: 1, title: 'Day 1 — Kabar Taal Bird Safari, Jaimangalgarh & Simaria Ghat', items: [
        { time: 'Early Morning (6:00 AM)', activity: 'Country Boat Birdwatching Safari on Kabar Taal', note: 'Spot migratory ducks, pelicans, and raptors in morning mist.' },
        { time: 'Midday (11:00 AM)', activity: 'Jaimangalgarh Island & Ancient Chandi Shrine', note: 'Explore the historic mound and ancient stone relics.' },
        { time: 'Afternoon (3:30 PM)', activity: 'Simaria Holy Ganga Ghat & Sunset Aarti', note: 'Witness spiritual evening ceremonies along the Ganga.' }
      ]}
    ],
    hotels: [
      { name: 'Hotel Yuvraj Begusarai', type: 'hotel', tier: 'better', priceMin: 2200, priceMax: 4200, rating: 4.2, reviews: 650, amenities: ['Restaurant', 'AC', 'WiFi', 'Room Service'], tags: ['City Center', 'Comfort'], url: 'https://www.google.com/search?q=Hotel%20Yuvraj%20Begusarai' },
      { name: 'Hotel James Begusarai', type: 'hotel', tier: 'better', priceMin: 1800, priceMax: 3500, rating: 4.1, reviews: 480, amenities: ['AC', 'Free Parking', 'Travel Desk'], tags: ['Near Railway Station', 'Budget'], url: 'https://www.google.com/search?q=Hotel%20James%20Begusarai' }
    ],
    faq: [
      { q: 'What is the best month to spot migratory birds at Kanwar Lake?', a: 'December and January offer the peak concentrations of winter migratory waterfowl arriving from Central Asia and Siberia.' },
      { q: 'How can visitors arrange a boat safari on Kabar Taal?', a: 'Local traditional boatmen are available at the Manjhaul and Jaimangalgarh ghats. Negotiate standard rates before departure.' }
    ]
  },
  {
    slug: 'vishnupad-temple-gaya',
    title: 'Vishnupad Temple, Gaya',
    state: 'Bihar',
    region: 'Magadh (Southern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Vishnupad Temple — The Sacred Footprint of Lord Vishnu & Pind Daan Epicenter',
    overview: {
      short: 'Vishnupad Temple in Gaya is an ancient 30-meter-tall black basalt temple enshrining the divine 40-cm footprint of Lord Vishnu (Dharmasila), rebuilt by Queen Ahilyabai Holkar in 1787.',
      description: 'Standing majestically on the banks of the sacred Falgu River, Vishnupad Temple is the supreme pilgrimage destination for the sacred Hindu rite of Pind Daan (ancestral salvation). Legend holds that Lord Vishnu subdued the demon Gayasura by placing his right foot upon his chest. Queen Ahilyabai Holkar of Indore reconstructed the octagonal 100-foot-high temple in 1787 using solid black basalt stone. Encircled by sacred sites including the immortal Akshayavat Banyan Tree, Brahmayoni Hill, and Ramshila Hill, it remains an eternal spiritual powerhouse.',
      features: ['40-cm Divine Footprint of Lord Vishnu (Vishnupad)', '1787 Solid Black Basalt Temple by Ahilyabai Holkar', 'World Epicenter of Ancestral Pind Daan Rites', 'Sacred Immortal Akshayavat Banyan Tree'],
      altitude: '111 m',
      rating: 4.8,
      reviewCount: 32000,
      minPrice: 1400,
      distanceFromDelhi: 1030,
      about: 'A deeply sacred Vedic pilgrimage complex where Vedic chants, ancestral offerings, black basalt shikhara carvings, and the subterranean Falgu River evoke timeless spiritual devotion.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 9, 10, 11, 12] },
    weather: { lat: 24.7797, lng: 85.0069, tempSummer: '26–42°C', tempWinter: '8–24°C' },
    howToReach: {
      nearestAirport: { name: 'Gaya International Airport (GAY)', distance: 9 },
      nearestRailway: { name: 'Gaya Junction (GAYA)', distance: 4 },
      roadNote: 'Conveniently reached via Grand Trunk Road (NH-19) and NH-22 into Gaya city center.',
      routes: [
        { from: 'Patna', city: 'Patna', state: 'Bihar', distance: 100, byCar: '2.5 hrs', byTrain: 'Vande Bharat / Express (1.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-22 Southbound' },
        { from: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', distance: 245, byCar: '4.5 hrs', byTrain: 'Vande Bharat / Doon Exp (3 hrs)', byAir: 'Train / Road', via: 'NH-19 Eastbound' }
      ]
    },
    galleryQueries: ['Vishnupad Temple Gaya', 'Vishnupad Temple Bihar', 'Falgu River Gaya', 'Akshayavat Gaya', 'Gaya temple ghats'],
    places: [
      {
        name: 'Vishnupad Sanctum & Ahilyabai Holkar Shikhara',
        category: 'spiritual',
        distance: 'Centre',
        entryFee: 'Free',
        timings: '5:00 AM – 9:00 PM',
        duration: '2 hrs',
        rating: 4.9,
        description: 'Magnificent 100-foot black basalt temple housing the 40-cm footprint of Lord Vishnu embossed in solid rock, plated in silver inside an octagonal sanctum.',
        queries: ['Vishnupad Temple Gaya', 'Vishnupad temple sanctum', 'Vishnupad Temple Bihar', 'Vishnupad temple Ahilyabai']
      },
      {
        name: 'Akshayavat (The Undying Sacred Banyan Tree)',
        category: 'spiritual',
        distance: '1.2 km',
        entryFee: 'Free',
        timings: '5:00 AM – 8:00 PM',
        duration: '1 hr',
        rating: 4.8,
        description: 'Immortal sacred banyan tree where Goddess Sita is believed to have performed Pind Daan for King Dasharatha, marking the final completion spot of ancestral rites.',
        queries: ['Akshayavat Gaya', 'Akshayavat tree Gaya', 'Akshayavat sacred tree Bihar', 'Gaya banyan tree']
      },
      {
        name: 'Falgu River Devghat & Pind Daan Enclave',
        category: 'spiritual',
        distance: 'Temple Front',
        entryFee: 'Free',
        timings: 'Open 24 Hours',
        duration: '1.5 hrs',
        rating: 4.7,
        description: 'Sacred riverfront ghat where the Falgu river flows subterraneanly beneath sands, where millions of pilgrims offer sacred rice and sesame balls (Pind) to ancestors.',
        queries: ['Falgu River Gaya', 'Falgu river ghats', 'Gaya river ghat Devghat', 'Gaya Pind Daan ghat']
      },
      {
        name: 'Mangla Gauri Temple (Shaktipith of Gaya)',
        category: 'spiritual',
        distance: '2.5 km',
        entryFee: 'Free',
        timings: '5:00 AM – 8:30 PM',
        duration: '1 hr',
        rating: 4.8,
        description: 'Ancient 15th-century hilltop temple recognized as one of the 18 Maha Shakti Peethas where Goddess Sati’s breast fell, revered for fulfilling marital wishes.',
        queries: ['Mangla Gauri Temple Gaya', 'Mangla Gauri temple', 'Mangla Gauri Gaya Bihar', 'Gaya Shaktipith temple']
      },
      {
        name: 'Brahmayoni Hill Temple & 424 Stone Steps',
        category: 'spiritual',
        distance: '3.5 km',
        entryFee: 'Free',
        timings: '5:30 AM – 6:30 PM',
        duration: '2 hrs',
        rating: 4.7,
        description: 'Highest hill peak in Gaya offering breathtaking panoramic vistas of the temple city, crowned by temples of Brahmayoni and Matreyoni and narrow rebirth caves.',
        queries: ['Brahmayoni Hill Gaya', 'Brahmayoni temple Bihar', 'Brahmayoni hill steps', 'Gaya hill summit view']
      },
      {
        name: 'Pretshila Hill & Shraddha Tank (Pretkund)',
        category: 'spiritual',
        distance: '9 km',
        entryFee: 'Free',
        timings: '6:00 AM – 6:00 PM',
        duration: '2 hrs',
        rating: 4.6,
        description: 'Sacred hill dedicated to Lord Yama and ancestral souls, featuring 676 stone steps leading to an Ahilyabai Holkar shrine and holy Pretkund tank at the foot.',
        queries: ['Pretshila Hill Gaya', 'Pretshila temple Bihar', 'Pretkund Gaya', 'Pretshila hill steps']
      },
      {
        name: 'Ramshila Hill & Ancient Shiva Temple',
        category: 'spiritual',
        distance: '5 km',
        entryFee: 'Free',
        timings: '6:00 AM – 7:00 PM',
        duration: '1.5 hrs',
        rating: 4.6,
        description: 'Sacred hill on the southeast of Gaya where Lord Rama offered Pind Daan, housing ancient Pataleshwar Shiva temples with intricate medieval carvings.',
        queries: ['Ramshila Hill Gaya', 'Ramshila temple Bihar', 'Ramshila hill Gaya', 'Ancient Shiva temple Gaya']
      },
      {
        name: 'Gaya Surya Kund & Dakshinarka Sun Temple',
        category: 'heritage',
        distance: '800 m',
        entryFee: 'Free',
        timings: '5:30 AM – 8:00 PM',
        duration: '1 hr',
        rating: 4.7,
        description: 'Sacred stepped water tank and Sun temple dedicated to Lord Surya, housing ancient multi-armed granite idols of the Sun God standing upon a seven-horse chariot.',
        queries: ['Surya Kund Gaya', 'Dakshinarka Sun Temple Gaya', 'Gaya Sun temple', 'Surya temple Gaya Bihar']
      }
    ],
    itinerary: [
      { day: 1, title: 'Day 1 — Vishnupad Temple, Falgu Ghats & Akshayavat Banyan', items: [
        { time: 'Morning (6:00 AM)', activity: 'Vishnupad Sanctum Darshan & Falgu Snan', note: 'Witness morning aarti and view the divine silver-plated footprint.' },
        { time: 'Midday (11:00 AM)', activity: 'Akshayavat Sacred Tree & Surya Kund', note: 'Visit the immortal banyan tree and Dakshinarka Sun Temple.' },
        { time: 'Afternoon (3:30 PM)', activity: 'Brahmayoni Hill Climb for Sunset Vistas', note: 'Ascend the 424 steps for breathtaking sunset views over Gaya.' }
      ]}
    ],
    hotels: [
      { name: 'Hotel Grand Palace Gaya', type: 'hotel', tier: 'better', priceMin: 2500, priceMax: 5000, rating: 4.3, reviews: 1200, amenities: ['Restaurant', 'AC', 'Free Parking', 'Travel Desk'], tags: ['City Center', 'Comfort'], url: 'https://www.google.com/search?q=Hotel%20Grand%20Palace%20Gaya' },
      { name: 'Hotel Viraat Inn Gaya', type: 'hotel', tier: 'better', priceMin: 1900, priceMax: 3800, rating: 4.1, reviews: 850, amenities: ['Near Railway Station', 'Restaurant', 'WiFi'], tags: ['Convenient', 'Budget'], url: 'https://www.google.com/search?q=Hotel%20Viraat%20Inn%20Gaya' }
    ],
    faq: [
      { q: 'Is non-Hindu entry permitted inside Vishnupad Temple?', a: 'Traditional temple customs restrict entry to the inner sanctum to practicing Hindus; visitors of other backgrounds can view the exterior architecture and Falgu ghats.' },
      { q: 'When is the Pitru Paksha Mela held in Gaya?', a: 'The world-renowned Pitru Paksha Mela occurs annually during September–October (Bhadrapada Anant Chaturdashi to Sarvapitri Amavasya), drawing millions of pilgrims.' }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 2 (Part A)');
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
      itinerary: config.itinerary,
      hotels: config.hotels,
      restaurants: [],
      activities: topPlaces.map(p => p.name),
      gallery: gallery,
      faq: config.faq,
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

  console.log('\n🎉 Finished Batch 2 Part A successfully!');
}

run().catch(console.error);
