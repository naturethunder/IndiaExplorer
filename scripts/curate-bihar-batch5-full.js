const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
  // 16. Kaimur Wildlife Sanctuary
  {
    slug: 'kaimur-wildlife-sanctuary',
    title: 'Kaimur Wildlife Sanctuary',
    state: 'Bihar',
    region: 'Kaimur & Rohtas Plateau (Southwestern Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Kaimur Sanctuary — Bihar’s Largest Wildlife Reserve & Proposed 2nd Tiger Reserve',
    overview: {
      short: 'Kaimur Wildlife Sanctuary covers 1,342 square kilometers across Kaimur and Rohtas districts, featuring rugged Vindhyan valleys, prehistoric rock art, and thriving tiger-corridor wildlife.',
      description: 'As Bihar’s largest protected forest, Kaimur Wildlife Sanctuary spans dense dry deciduous Sal forests, dramatic sandstone canyons, and perennial waterfalls like Telhar Kund and Karkat. It serves as a vital corridor for leopards, sloth bears, striped hyenas, chital, blackbucks, and proposed reintroduction of Bengal tigers.',
      features: ['Bihar’s Largest Wildlife Sanctuary (1,342 sq km)', 'Proposed Bihar 2nd Tiger Reserve Corridor', 'Prehistoric Cave Rock Paintings (Palaeolithic)', 'Telhar Kund, Karkat & Tutla Bhawani Waterfalls'],
      altitude: '280 m', rating: 4.7, reviewCount: 8800, minPrice: 1300, distanceFromDelhi: 940,
      about: 'A rugged wilderness of dramatic plateau scarps, hidden waterfalls, prehistoric rock art, and rich wildlife.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 24.9000, lng: 83.6500, tempSummer: '27–43°C', tempWinter: '7–23°C' },
    howToReach: {
      nearestAirport: { name: 'Varanasi Airport (VNS)', distance: 110 },
      nearestRailway: { name: 'Bhabua Road (BBU) / Sasaram Junction (SSM)', distance: 30 },
      roadNote: 'Connected via NH-19 to Mohania and SH-14 to Bhabua and Adhaura plateau.',
      routes: [{ from: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', distance: 110, byCar: '2.5 hrs', byTrain: 'Train to Bhabua Road (1.5 hrs)', byAir: 'Via Varanasi Airport', via: 'NH-19 Eastbound' }]
    },
    galleryQueries: ['Kaimur Wildlife Sanctuary', 'Kaimur plateau Bihar', 'Telhar waterfall Kaimur', 'Karkat waterfall Bihar', 'Kaimur forest landscape'],
    places: [
      { name: 'Kaimur Sanctuary Core Forest & Safari Trail', category: 'wildlife', distance: 'Centre', entryFee: '₹50', timings: '6:30 AM – 5:00 PM', duration: '3.5 hrs', rating: 4.8, description: 'Sprawling Sal forest hosting sloth bears, leopards, nilgai, chital deer, and wild boars.', queries: ['Kaimur Wildlife Sanctuary', 'Kaimur sanctuary forest', 'Kaimur wildlife Bihar', 'Kaimur hills forest'] },
      { name: 'Telhar Kund Waterfall & Forest Canyon', category: 'nature', distance: '32 km', entryFee: 'Free', timings: '7:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.8, description: '80-meter sheer plunge waterfall dropping into an emerald canyon surrounded by dense woods.', queries: ['Telhar Kund waterfall', 'Telhar waterfall Kaimur', 'Telhar Kund Bihar', 'Kaimur hill waterfall'] },
      { name: 'Karkat Waterfall & River Canyon', category: 'nature', distance: '38 km', entryFee: '₹20', timings: '7:00 AM – 5:30 PM', duration: '2 hrs', rating: 4.7, description: 'Wide picturesque waterfall on the Karmanasa River offering boating and birdwatching.', queries: ['Karkat waterfall', 'Karkat waterfall Kaimur', 'Karkat falls Bihar', 'Karmanasa river waterfall'] },
      { name: 'Adhaura Plateau Forest Vistas', category: 'nature', distance: '45 km', entryFee: 'Free', timings: '6:00 AM – 5:30 PM', duration: '2.5 hrs', rating: 4.6, description: 'Cool elevated plateau at 2,000 feet adorned with tribal hamlets, Sal groves, and deep valleys.', queries: ['Adhaura hill Kaimur', 'Adhaura plateau Bihar', 'Kaimur hill range', 'Adhaura nature landscape'] },
      { name: 'Maa Mundeshwari Hill Sanctuary', category: 'spiritual', distance: '22 km', entryFee: 'Free', timings: '5:00 AM – 8:00 PM', duration: '2 hrs', rating: 4.9, description: 'India’s oldest functional stone temple (635 CE) perched on the solitary Pavra Hill.', queries: ['Mundeshwari Temple', 'Mundeshwari Devi temple Bihar', 'Mundeshwari temple sanctum', 'Mundeshwari stone carving'] },
      { name: 'Durgavati Reservoir & Dam Viewpoint', category: 'nature', distance: '26 km', entryFee: 'Free', timings: '7:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.6, description: 'Vast scenic water reservoir flanked by the forested Kaimur foothills.', queries: ['Durgavati Dam Bihar', 'Karamchat Dam Kaimur', 'Durgavati reservoir', 'Kaimur lake dam'] },
      { name: 'Prehistoric Rock Art Caves of Kaimur', category: 'heritage', distance: '28 km', entryFee: 'Free', timings: '8:00 AM – 4:30 PM', duration: '2 hrs', rating: 4.7, description: 'Ancient rock shelters displaying Upper Palaeolithic and Mesolithic red-ochre animal drawings.', queries: ['Kaimur rock art Bihar', 'Prehistoric rock art Kaimur', 'Kaimur cave paintings', 'Ancient rock shelter Bihar'] },
      { name: 'Tutla Bhawani Waterfall & Canyon Bridge', category: 'nature', distance: '42 km', entryFee: '₹30', timings: '7:00 AM – 5:30 PM', duration: '2 hrs', rating: 4.8, description: 'Deep forest canyon with 200m suspension bridge leading to the sacred waterfall shrine.', queries: ['Tutla Bhawani waterfall', 'Tutla Bhawani Rohtas', 'Tutla Bhawani temple Bihar', 'Kachhuar waterfall Rohtas'] }
    ]
  },

  // 17. Munger Fort
  {
    slug: 'munger-fort',
    title: 'Munger Fort',
    state: 'Bihar',
    region: 'Munger / Anga (Eastern Bihar)',
    type: 'heritage',
    badge: 'Heritage',
    tagline: 'Munger Fort — The Ancient Ganga Citadel & World Capital of Modern Yoga',
    overview: {
      short: 'Munger Fort is a legendary stone fortress built on a rocky promontory overlooking the holy River Ganga, dating back to the Karna of Mahabharata and Bengal Nawab Mir Qasim.',
      description: 'Rising grandly on the southern banks of the River Ganga, Munger Fort spans 222 acres enclosed by massive stone ramparts and a wide moat. Historically held by the Guptas, Palas, Karnas, and Nawab Mir Qasim who shifted Bengal’s capital here in 1762, the fort today houses the globally renowned Bihar School of Yoga (Ganga Darshan), the sacred Chandika Sthan Shaktipith, and thermal Sita Kund springs.',
      features: ['Historic 222-Acre Riverfront Stone Citadel', 'Bihar School of Yoga (Ganga Darshan Ashram)', 'Chandika Sthan Shaktipith (Sati’s Left Eye)', 'Sita Kund & Rishikund Geothermal Springs'],
      altitude: '54 m', rating: 4.8, reviewCount: 18400, minPrice: 1400, distanceFromDelhi: 1130,
      about: 'A sublime riverfront confluence where ancient military citadel ramparts, spiritual yoga ashrams, and sacred geothermal springs embrace the holy Ganga.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.3700, lng: 86.4700, tempSummer: '26–42°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT) / Deoghar Airport (DGH)', distance: 150 },
      nearestRailway: { name: 'Jamalpur Junction (JMP) / Munger Station (MGR)', distance: 3 },
      roadNote: 'Connected via NH-80 and the newly opened Sri Krishna Setu (Munger Ganga Bridge).',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 175, byCar: '4 hrs', byTrain: 'Vande Bharat / Express (2.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-31 and NH-80' }]
    },
    galleryQueries: ['Munger Fort Bihar', 'Munger Fort Ganga', 'Bihar School of Yoga Munger', 'Kastaharni Ghat Munger', 'Munger Fort citadel'],
    places: [
      { name: 'Munger Fort Ramparts & Lal Darwaza', category: 'heritage', distance: 'Centre', entryFee: 'Free', timings: '6:00 AM – 6:30 PM', duration: '2 hrs', rating: 4.8, description: 'Massive stone ramparts, historic brick battlements, and the grand Lal Darwaza gateway overlooking the Ganga.', queries: ['Munger Fort Bihar', 'Munger Fort gate', 'Munger Fort ramparts', 'Munger citadel wall'] },
      { name: 'Bihar School of Yoga (Ganga Darshan)', category: 'spiritual', distance: 'Fort Hilltop', entryFee: 'Free (Registration for courses)', timings: '9:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.9, description: 'World-renowned yoga ashram founded in 1964 by Swami Satyananda Saraswati overlooking the Ganga.', queries: ['Bihar School of Yoga Munger', 'Ganga Darshan Munger', 'Bihar Yoga Bharati', 'Munger yoga ashram'] },
      { name: 'Chandika Sthan Shaktipith', category: 'spiritual', distance: '2 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.8, description: 'Revered Shaktipith where Goddess Sati’s left eye fell, known for granting wishes to eye ailments.', queries: ['Chandika Sthan Munger', 'Chandika Sthan temple', 'Munger Shaktipith temple', 'Chandika temple Bihar'] },
      { name: 'Kastaharni Ghat (Sacred Ganga Snan Ghat)', category: 'spiritual', distance: '1 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.7, description: 'Sacred riverfront ghat where the Ganga flows northwards (Uttaravahini), relieving all pilgrims’ distress.', queries: ['Kastaharni Ghat Munger', 'Kastaharni Ghat Ganga', 'Munger Ganga riverfront', 'Kastaharni ghat snan'] },
      { name: 'Sita Kund Geothermal Reservoir', category: 'spiritual', distance: '6 km', entryFee: 'Free', timings: '6:00 AM – 6:30 PM', duration: '1 hr', rating: 4.7, description: 'Enclosed bubbling natural hot spring tied to Sita’s Agni Pariksha, with hot and cold bathing tanks.', queries: ['Sita Kund Munger', 'Sita Kund hot spring Bihar', 'Sita Kund Munger boiling spring', 'Sita Kund water temple'] },
      { name: 'Tomb of Pir Shah Nufa (Fort Citadel)', category: 'heritage', distance: 'Inside Fort', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '45 mins', rating: 4.5, description: '15th-century domed Sufi mausoleum situated on a high circular bastion within the fort walls.', queries: ['Pir Shah Nufa Munger', 'Pir Shah Nufa tomb', 'Munger fort dargah', 'Historic tomb Munger'] },
      { name: 'Mir Qasim’s Arsenal (Topkhana Ruins)', category: 'heritage', distance: 'Inside Fort', entryFee: 'Free', timings: '8:00 AM – 5:00 PM', duration: '45 mins', rating: 4.5, description: 'Ruins of the historic 18th-century gun and arms foundry established by Nawab Mir Qasim of Bengal.', queries: ['Mir Qasim arsenal Munger', 'Munger gun factory history', 'Mir Qasim fort Munger', 'Munger fort ruins'] },
      { name: 'Sri Krishna Setu Munger Ganga Bridge View', category: 'nature', distance: '3.5 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '45 mins', rating: 4.6, description: 'Majestic 3.7-kilometer rail-cum-road bridge offering breathtaking panoramas across the broad Ganga river.', queries: ['Sri Krishna Setu Munger', 'Munger Ganga bridge', 'Munger rail road bridge', 'Ganga bridge Munger Bihar'] }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 5 (Destinations 16–17)');
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

  console.log('\n🎉 Finished Batch 5 successfully!');
}

run().catch(console.error);
