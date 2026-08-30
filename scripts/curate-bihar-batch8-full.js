const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
  // 23. Chandika Sthan (Munger)
  {
    slug: 'chandika-sthan',
    title: 'Chandika Sthan',
    state: 'Bihar',
    region: 'Munger / Anga (Eastern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Chandika Sthan — The Netra Shaktipith of Maa Sati & Mahabharata Karna Chauraha',
    overview: {
      short: 'Chandika Sthan in Munger is one of the 51 sacred Shakti Peethas, where Goddess Sati’s left eye fell, renowned for miraculous cures of eye ailments.',
      description: 'Located in Munger on the banks of the sacred Ganga, Chandika Sthan is an ancient cave-shrine where the left eye of Goddess Sati is worshipped inside a subterranean stone sanctum. Mahabharata legend recounts that King Karna of Anga used to boil himself daily in a cauldron of oil and offer his flesh to Goddess Chandika, who would restore him and grant gold charities.',
      features: ['One of 51 Sacred Shakti Peethas (Sati’s Left Eye)', 'Mahabharata King Karna Charity Legend', 'Sacred Subterranean Cave Sanctorum', 'Proximity to Kastaharni Ganga Ghat'],
      altitude: '54 m', rating: 4.8, reviewCount: 16500, minPrice: 1300, distanceFromDelhi: 1130,
      about: 'A powerful Siddhapeeth sanctuary where ancient Tantric worship, Ganga breezes, and King Karna’s legends harmonize.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.3800, lng: 86.4800, tempSummer: '26–42°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT) / Deoghar Airport (DGH)', distance: 150 },
      nearestRailway: { name: 'Munger / Jamalpur Junction', distance: 2.5 },
      roadNote: 'Located in Munger city on the banks of the Ganga, accessible via NH-80 and Sri Krishna Setu.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 175, byCar: '4 hrs', byTrain: 'Express train (2.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-31 and NH-80' }]
    },
    galleryQueries: ['Chandika Sthan Munger', 'Chandika Sthan temple', 'Munger Shaktipith temple', 'Kastaharni Ghat Munger', 'Chandika temple Bihar'],
    places: [
      { name: 'Maa Chandika Subterranean Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.9, description: 'Ancient cave-temple sanctorum where the eye of Goddess Sati is worshipped with vermilion.', queries: ['Chandika Sthan Munger', 'Chandika Sthan sanctum', 'Chandika Sthan temple Bihar', 'Maa Chandika Munger'] },
      { name: 'Karna Chauraha & Charity Legend Spot', category: 'heritage', distance: 'Temple Grounds', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '45 mins', rating: 4.7, description: 'Historic altar where King Karna performed gold charities after worshipping Goddess Chandika.', queries: ['Karna Chauraha Munger', 'King Karna Munger', 'Karna temple Munger', 'Karna Chaupar Bihar'] },
      { name: 'Kastaharni Ghat (North-Flowing Ganga Ghat)', category: 'spiritual', distance: '1.5 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.8, description: 'Sacred riverfront where the Ganga flows northwards, famous for sunrise and evening aarti.', queries: ['Kastaharni Ghat Munger', 'Kastaharni Ghat Ganga', 'Munger Ganga riverfront', 'Kastaharni ghat snan'] },
      { name: 'Munger Fort Citadel & Ramparts', category: 'heritage', distance: '2 km', entryFee: 'Free', timings: '6:00 AM – 6:30 PM', duration: '2 hrs', rating: 4.8, description: 'Massive stone fortress with grand gateways overlooking the Ganga River.', queries: ['Munger Fort Bihar', 'Munger Fort gate', 'Munger Fort ramparts', 'Munger citadel wall'] },
      { name: 'Bihar School of Yoga (Ganga Darshan)', category: 'spiritual', distance: '2.5 km', entryFee: 'Free', timings: '9:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.9, description: 'World-renowned yoga ashram on a hillock overlooking the majestic Ganga.', queries: ['Bihar School of Yoga Munger', 'Ganga Darshan Munger', 'Bihar Yoga Bharati', 'Munger yoga ashram'] },
      { name: 'Sita Kund Thermal Spring Reservoir', category: 'spiritual', distance: '7 km', entryFee: 'Free', timings: '6:00 AM – 6:30 PM', duration: '1 hr', rating: 4.7, description: 'Boiling hot sulfur spring tied to Sita’s Agni Pariksha, with ritual bathing kunds.', queries: ['Sita Kund Munger', 'Sita Kund hot spring Bihar', 'Sita Kund Munger boiling spring', 'Sita Kund water temple'] },
      { name: 'Pir Shah Nufa Tomb (Bastion Dargah)', category: 'heritage', distance: '2 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '45 mins', rating: 4.5, description: '15th-century domed Sufi mausoleum on a high circular bastion within the fort walls.', queries: ['Pir Shah Nufa Munger', 'Pir Shah Nufa tomb', 'Munger fort dargah', 'Historic tomb Munger'] },
      { name: 'Goenka Shivalaya (Marble Shiva Temple)', category: 'spiritual', distance: '1.8 km', entryFee: 'Free', timings: '5:30 AM – 8:30 PM', duration: '45 mins', rating: 4.6, description: 'Ornate white marble Shiva temple built by merchant philanthropists with intricate carvings.', queries: ['Goenka Shivalaya Munger', 'Goenka temple Munger', 'Munger Shiva temple', 'Goenka Mandir Bihar'] }
    ]
  },

  // 24. Pant Wildlife Sanctuary (Rajgir)
  {
    slug: 'pant-wildlife-sanctuary',
    title: 'Pant Wildlife Sanctuary',
    state: 'Bihar',
    region: 'Magadh / Rajgir (Southern Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Pant Wildlife Sanctuary — The Five Sacred Hills of Rajgir & Historic Peace Pagoda',
    overview: {
      short: 'Pant Wildlife Sanctuary in Rajgir covers 35.8 square kilometers across the historic five hills (Vipulagiri, Ratnagiri, Gridhrakuta, Udaygiri, and Sona Giri), rich in ancient Buddhist and Jain lore.',
      description: 'Cradled in a green valley encircled by the ancient 40-kilometer Cyclopean Stone Wall, Pant Sanctuary preserves dry deciduous forests sheltering leopards, nilgai, hyenas, and rich birdlife. Perched atop the hills are the world-famous Vishwa Shanti Stupa, Vulture Peak (Gridhrakuta) where Lord Buddha delivered the Lotus Sutra, and the Swarna Bhandar caves.',
      features: ['Vulture Peak (Gridhrakuta Lotus Sutra Site)', 'Vishwa Shanti Stupa & Aerial Ropeway', 'Ancient 40-km Cyclopean Wall of Rajgir', 'Swarna Bhandar & Bimbisara Jail Ruins'],
      altitude: '73 m', rating: 4.9, reviewCount: 38000, minPrice: 1500, distanceFromDelhi: 1030,
      about: 'A historic landscape where ancient mountain citadels, serene stupas, hot springs, and forested hills create an unforgettable experience.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.0300, lng: 85.4200, tempSummer: '25–41°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 100 },
      nearestRailway: { name: 'Rajgir Railway Station (RGD)', distance: 3 },
      roadNote: 'Connected via NH-120 and Bakhtiyarpur-Rajgir 4-lane highway from Patna and Gaya.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 100, byCar: '2.5 hrs', byTrain: 'Express train (2 hrs)', byAir: 'Via Patna Airport', via: 'NH-120 Southbound' }]
    },
    galleryQueries: ['Rajgir hills Bihar', 'Vishwa Shanti Stupa Rajgir', 'Gridhrakuta Vulture Peak', 'Cyclopean wall Rajgir', 'Rajgir aerial ropeway'],
    places: [
      { name: 'Vishwa Shanti Stupa & Ratnagiri Hilltop', category: 'spiritual', distance: 'Hilltop', entryFee: 'Free (Ropeway ₹100)', timings: '9:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.9, description: 'Dazzling white marble Peace Pagoda erected in 1969 by Nichidatsu Fuji Guruji atop Ratnagiri Hill.', queries: ['Vishwa Shanti Stupa Rajgir', 'Peace Pagoda Rajgir', 'Ratnagiri hill stupa', 'Shanti Stupa Rajgir Bihar'] },
      { name: 'Gridhrakuta Peak (Vulture Peak Meditation Site)', category: 'spiritual', distance: 'Ratnagiri Slope', entryFee: 'Free', timings: '6:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.9, description: 'Sacred natural rock ledge where Lord Buddha spent many rainy seasons preaching the Lotus Sutra.', queries: ['Gridhrakuta Vulture Peak', 'Vulture Peak Rajgir', 'Gridhrakuta hill Buddha', 'Vulture peak rock'] },
      { name: 'Rajgir Aerial Ropeway & Chairlift', category: 'nature', distance: 'Base to Top', entryFee: '₹100', timings: '9:00 AM – 5:00 PM', duration: '45 mins', rating: 4.8, description: 'India’s oldest operating single-chair scenic ropeway gliding across lush forested hill slopes.', queries: ['Rajgir aerial ropeway', 'Rajgir chairlift', 'Ropeway Rajgir hills', 'Rajgir cable car'] },
      { name: 'Swarna Bhandar (Treasury Caves of Bimbisara)', category: 'heritage', distance: '2.5 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '1 hr', rating: 4.7, description: '3rd-century BCE polished rock-cut caves believed to house the unrecovered treasury of King Bimbisara.', queries: ['Swarna Bhandar Rajgir', 'Son Bhandar caves', 'Swarna Bhandar cave Bihar', 'Bimbisara treasury cave'] },
      { name: 'Cyclopean Wall of Rajgir (40-km Stone Rampart)', category: 'heritage', distance: 'Valley Ridge', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.8, description: 'Pre-Mauryan 2,500-year-old monumental raw stone rampart that encircled the ancient capital of Magadh.', queries: ['Cyclopean wall Rajgir', 'Cyclopean wall Bihar', 'Ancient stone wall Rajgir', 'Magadh stone rampart'] },
      { name: 'Bimbisara Jail & Maniyar Math Ruins', category: 'heritage', distance: '3 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '1 hr', rating: 4.6, description: 'Historic stone enclosure where Prince Ajatashatru imprisoned his father King Bimbisara.', queries: ['Bimbisara Jail Rajgir', 'Maniyar Math Rajgir', 'Bimbisara prison Bihar', 'Ancient ruins Rajgir'] },
      { name: 'Venuvana (Bamboo Grove Monastery of Buddha)', category: 'spiritual', distance: '1.5 km', entryFee: '₹20', timings: '6:00 AM – 6:00 PM', duration: '1 hr', rating: 4.7, description: 'Historic peaceful bamboo park and pond donated by King Bimbisara for Buddha and the Sangha.', queries: ['Venuvana Rajgir', 'Venuvana bamboo grove', 'Venuvana garden Bihar', 'Buddha bamboo monastery'] },
      { name: 'Saptaparni Cave (First Buddhist Council Site)', category: 'spiritual', distance: 'Vaibhara Hill', entryFee: 'Free', timings: '6:00 AM – 5:00 PM', duration: '2.5 hrs', rating: 4.7, description: 'Sacred cave atop Vaibhara Hill where 500 Arhats convened the First Buddhist Council in 483 BCE.', queries: ['Saptaparni Cave Rajgir', 'Saptaparni cave Bihar', 'First Buddhist Council cave', 'Vaibhara hill cave'] }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 8 (Destinations 23–24)');
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

  console.log('\n🎉 Finished Batch 8 successfully!');
}

run().catch(console.error);
