const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
  // 11. Ashokdham Temple (Lakhisarai)
  {
    slug: 'ashokdham-temple',
    title: 'Ashokdham Temple',
    state: 'Bihar',
    region: 'Anga / Lakhisarai (Eastern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Ashokdham Dham — The Sacred Indradamneshwar Mahadev & Giant Black Stone Lingam',
    overview: {
      short: 'Ashokdham Temple (Indradamneshwar Mahadev Mandir) in Lakhisarai enshrines a colossal ancient black granite Shiva Lingam discovered by boy Ashok in 1977.',
      description: 'Situated at the confluence of the Kiul and Harohar rivers in Lakhisarai district, Ashokdham is celebrated for its colossal black basalt Shiva Lingam, believed to have been originally worshipped by 8th-century King Indradyumna of the Pala dynasty. Excavated in April 1977, the sacred pilgrimage center features a majestic Nagara-style stone temple complex, sacred ponds, and nearby ancient Buddhist stupas.',
      features: ['Colossal Black Granite Indradamneshwar Lingam', 'Pala-Era 8th-Century Historical Heritage', 'Shringirishi Dham Hill Sacred Springs', 'Nongarh & Rajauna Buddhist Excavation Stupas'],
      altitude: '58 m', rating: 4.7, reviewCount: 14200, minPrice: 1200, distanceFromDelhi: 1090,
      about: 'A divine pilgrimage center in the historic Kiul valley surrounded by ancient Pala monasteries, holy waterfalls, and verdant hills.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.1800, lng: 86.0900, tempSummer: '26–42°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 130 },
      nearestRailway: { name: 'Lakhisarai Junction (LKR) / Kiul Junction (KIUL)', distance: 4 },
      roadNote: 'Located just 4 km from Lakhisarai town on the Lakhisarai-Sikandra road, connected by NH-80 and NH-333A.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 130, byCar: '3 hrs', byTrain: 'Express train (2 hrs)', byAir: 'Via Patna Airport', via: 'NH-31 and NH-80' }]
    },
    galleryQueries: ['Ashokdham temple Lakhisarai', 'Ashokdham Mandir Bihar', 'Indradamneshwar Mahadev', 'Lakhisarai temple', 'Kiul river Lakhisarai'],
    places: [
      { name: 'Indradamneshwar Mahadev Main Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '2 hrs', rating: 4.8, description: 'Towering stone temple sanctum housing the colossal black granite Shiva Lingam.', queries: ['Ashokdham temple Lakhisarai', 'Ashokdham Mandir Bihar', 'Indradamneshwar Mahadev', 'Ashokdham Shiva temple'] },
      { name: 'Shringirishi Dham Hills & Sacred Springs', category: 'spiritual', distance: '22 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '2 hrs', rating: 4.7, description: 'Scenic hill hermitage associated with sage Rishyasringa, featuring freshwater spring kunds.', queries: ['Shringirishi Dham Lakhisarai', 'Shringirishi Bihar', 'Shringirishi hill spring', 'Lakhisarai sacred hill'] },
      { name: 'Jalappa Asthan (Hilltop Shrine)', category: 'spiritual', distance: '12 km', entryFee: 'Free', timings: '6:00 AM – 7:00 PM', duration: '1 hr', rating: 4.6, description: 'Hilltop sanctuary dedicated to Goddess Jalappa, offering panoramic vistas of the Kiul basin.', queries: ['Jalappa Asthan Lakhisarai', 'Jalappa Asthan Bihar', 'Jalappa temple', 'Lakhisarai hill temple'] },
      { name: 'Nongarh Ancient Buddhist Stupa Mound', category: 'heritage', distance: '16 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.5, description: 'Massive 5th-century Buddhist brick stupa mound excavated on the banks of the Kiul River.', queries: ['Nongarh stupa Lakhisarai', 'Nongarh Bihar', 'Nongarh Buddhist mound', 'Ancient stupa Lakhisarai'] },
      { name: 'Rajauna Archaeological Site & Sculptures', category: 'heritage', distance: '6 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '1 hr', rating: 4.5, description: 'Pala-era archaeological mound that yielded exquisite sandstone Buddha and Ganesha idols.', queries: ['Rajauna Lakhisarai', 'Rajauna archaeological site', 'Rajauna Bihar sculpture', 'Lakhisarai ancient ruins'] },
      { name: 'Kiul Riverfront & Bridge Viewpoint', category: 'nature', distance: '4 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.4, description: 'Scenic riverbank providing gentle breezes and sunset reflections along the historic Kiul railway bridges.', queries: ['Kiul river Lakhisarai', 'Kiul river Bihar', 'Kiul railway bridge', 'Lakhisarai riverfront'] },
      { name: 'Lakhisarai Lai Sweet Heritage Market', category: 'cultural', distance: '4 km', entryFee: 'Free', timings: '8:00 AM – 9:30 PM', duration: '45 mins', rating: 4.6, description: 'Traditional bazaar famous for GI-recognized crispy Khoya-Lai, Ramdana Lai, and sweets.', queries: ['Lakhisarai Lai sweet', 'Lakhisarai market', 'Bihar traditional sweet market', 'Lakhisarai street bazaar'] },
      { name: 'Surya Mandir Pokharama', category: 'spiritual', distance: '14 km', entryFee: 'Free', timings: '5:30 AM – 8:00 PM', duration: '1 hr', rating: 4.5, description: 'Historic lakeside Sun temple celebrated for festive Chhath gatherings and ancient stone carvings.', queries: ['Pokharama Surya Mandir', 'Pokharama temple Lakhisarai', 'Surya Mandir Lakhisarai', 'Pokharama sun shrine'] }
    ]
  },

  // 12. Gautam Budha Wildlife Sanctuary (Gaya)
  {
    slug: 'gautam-budha-wildlife-sanctuary',
    title: 'Gautam Budha Wildlife Sanctuary',
    state: 'Bihar',
    region: 'Magadh / Gaya (Southern Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Gautam Budha Sanctuary — Dense Dry Deciduous Forests & Hill Wilderness of Magadh',
    overview: {
      short: 'Gautam Budha Wildlife Sanctuary spans 259 square kilometers across Gaya (Bihar) and Koderma (Jharkhand), preserving rich dry deciduous wildlife corridors.',
      description: 'Named in honor of Lord Gautama Buddha, this expansive sanctuary along the lower Chota Nagpur and Magadh plateau protects thriving populations of leopards, chital deer, sambar, wild boars, Indian gazelles (chinkara), and over 150 species of birds.',
      features: ['259-sq-km Protected Wildlife Sanctuary', 'Vindhyan & Chota Nagpur Hill Ecosystem', 'Gurpa Hill (Kukkutapadagiri Buddhist Hermitage)', 'Chital, Sambar, Leopard & Bird Habitat'],
      altitude: '260 m', rating: 4.6, reviewCount: 6100, minPrice: 1300, distanceFromDelhi: 1060,
      about: 'A tranquil forest sanctuary where rugged hills, Buddhist meditation peaks, and rich biodiversity meet along the Bihar-Jharkhand border.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 24.5800, lng: 85.1800, tempSummer: '26–42°C', tempWinter: '7–23°C' },
    howToReach: {
      nearestAirport: { name: 'Gaya International Airport (GAY)', distance: 35 },
      nearestRailway: { name: 'Gurpa / Gaya Junction Railway Station', distance: 20 },
      roadNote: 'Accessible via GT Road (NH-19) from Dobhi and SH-70.',
      routes: [{ from: 'Gaya', city: 'Gaya', state: 'Bihar', distance: 35, byCar: '1 hr', byTrain: 'Local passenger to Gurpa', byAir: 'Via Gaya Airport', via: 'NH-19 / Dobhi-Chatra Road' }]
    },
    galleryQueries: ['Gautam Budha Wildlife Sanctuary', 'Gurpa hill Bihar', 'Gaya forest wildlife', 'Magadh forest landscape', 'Gautam Budha Sanctuary nature'],
    places: [
      { name: 'Gautam Buddha Sanctuary Core Forest', category: 'wildlife', distance: 'Centre', entryFee: '₹50', timings: '6:30 AM – 5:00 PM', duration: '3 hrs', rating: 4.7, description: 'Dense mixed Sal and bamboo forest sheltering leopards, chital, sambar deer, and peacocks.', queries: ['Gautam Budha Wildlife Sanctuary', 'Gautam Buddha Sanctuary forest', 'Gaya wildlife sanctuary', 'Bihar deciduous forest wildlife'] },
      { name: 'Gurpa Hill (Kukkutapadagiri Sacred Peak)', category: 'spiritual', distance: '12 km', entryFee: 'Free', timings: '6:00 AM – 5:30 PM', duration: '3 hrs', rating: 4.8, description: 'Sacred mountain where Mahakashyapa, foremost disciple of Buddha, entered supreme meditation.', queries: ['Gurpa hill Bihar', 'Kukkutapadagiri Gurpa', 'Gurpa peak Gaya', 'Mahakashyapa Gurpa hill'] },
      { name: 'Dhobi Forest Watchtower & Waterhole', category: 'wildlife', distance: '8 km', entryFee: 'Included', timings: '6:30 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.6, description: 'Forest observation deck overlooking natural watering holes frequented by deer and wild boars.', queries: ['Gaya forest watchtower', 'Bihar forest waterhole', 'Gautam Buddha sanctuary watchtower', 'Wildlife watchtower Bihar'] },
      { name: 'Falgu River Upper Catchment & Rapids', category: 'nature', distance: '15 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.5, description: 'Picturesque rocky riverbed and natural stream cascades feeding the sacred Falgu basin.', queries: ['Falgu river upper stream', 'Gaya river rapids', 'Bihar forest river rocky', 'Falgu catchment landscape'] },
      { name: 'Koderma Border Ridge & Hill Trail', category: 'nature', distance: '18 km', entryFee: 'Free', timings: '7:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.5, description: 'Rugged hill plateau offering panoramic views across the forested boundary of Bihar and Jharkhand.', queries: ['Koderma border hills Bihar', 'Chota Nagpur plateau ridge', 'Gaya hill ridge trail', 'Bihar forest mountain view'] },
      { name: 'Bodh Gaya Green Buffer Eco Trail', category: 'nature', distance: '25 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.6, description: 'Protected forest green belt connecting the wildlife corridor with Bodh Gaya’s monastic zone.', queries: ['Bodh Gaya eco trail', 'Bodh Gaya forest buffer', 'Gaya nature walkway', 'Bodh Gaya green zone'] },
      { name: 'Mahuadanr Butterfly & Birding Meadow', category: 'nature', distance: '10 km', entryFee: 'Free', timings: '6:30 AM – 5:30 PM', duration: '1 hr', rating: 4.5, description: 'Wildflower meadow hosting dozens of native butterfly species and migratory winter warblers.', queries: ['Bihar butterfly meadow', 'Gaya birding meadow', 'Sanctuary flower meadow', 'Bihar forest meadow bird'] },
      { name: 'Barabar Foothills Forest Trail', category: 'heritage', distance: '32 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '2 hrs', rating: 4.7, description: 'Forested granite outcrops and trail leading towards ancient 3rd-century BCE Mauryan rock-cut caves.', queries: ['Barabar hills forest', 'Barabar caves trail', 'Ancient granite hill Bihar', 'Barabar rock landscape'] }
    ]
  },

  // 13. Udaypur Wildlife Sanctuary (West Champaran)
  {
    slug: 'udaypur-wildlife-sanctuary',
    title: 'Udaypur Wildlife Sanctuary',
    state: 'Bihar',
    region: 'Tirhut / West Champaran (Northwestern Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Udaypur Wildlife Sanctuary — Oxbow Lake Wetlands & Gandak Floodplain Wilderness',
    overview: {
      short: 'Udaypur Wildlife Sanctuary in West Champaran spans 8.74 square kilometers of pristine oxbow lake wetlands and swamp forests along the Gandak River basin.',
      description: 'Located near Bettiah in West Champaran, Udaypur Sanctuary is formed around a large oxbow lake created by the Gandak River. The wetland habitat provides vital breeding grounds for resident waterfowl and migratory birds, including spotted bills, whistling teals, kingfishers, and swamp deer.',
      features: ['Gandak River Oxbow Lake Wetland', 'Valmiki Tiger Reserve Ecological Buffer', 'Diverse Waterfowl & Aquatic Habitat', 'Bettiah Raj Historic Heritage Proximity'],
      altitude: '65 m', rating: 4.6, reviewCount: 5400, minPrice: 1300, distanceFromDelhi: 980,
      about: 'A secluded wetland sanctuary where serene lake waters, lotus canopies, and bird song offer peaceful eco-exploration.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 26.8000, lng: 84.5000, tempSummer: '24–40°C', tempWinter: '7–22°C' },
    howToReach: {
      nearestAirport: { name: 'Gorakhpur Airport (GOP) / Patna Airport (PAT)', distance: 135 },
      nearestRailway: { name: 'Bettiah Railway Station (BTH)', distance: 15 },
      roadNote: 'Located 15 km from Bettiah, accessible via NH-727 from Motihari and Gorakhpur.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 210, byCar: '5 hrs', byTrain: 'Sapt Kranti Exp to Bettiah (4 hrs)', byAir: 'Via Patna Airport', via: 'NH-27 and NH-727' }]
    },
    galleryQueries: ['Udaypur Wildlife Sanctuary Bihar', 'Udaypur sanctuary Bettiah', 'Gandak river wetland Champaran', 'Saraiya Man lake Bettiah', 'Champaran wetland bird'],
    places: [
      { name: 'Udaypur Oxbow Lake & Bird Wetland', category: 'wildlife', distance: 'Centre', entryFee: '₹30', timings: '6:00 AM – 5:30 PM', duration: '3 hrs', rating: 4.7, description: 'Scenic oxbow lake surrounded by reed beds, sheltering whistling ducks, coots, and jacanas.', queries: ['Udaypur Wildlife Sanctuary Bihar', 'Udaypur sanctuary lake', 'Bettiah bird sanctuary', 'Gandak oxbow lake'] },
      { name: 'Saraiya Man Lake (Freshwater Sanctuary)', category: 'nature', distance: '12 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '2 hrs', rating: 4.6, description: 'Large picturesque natural lake famous for sweet Jamun-filtered waters and migratory bird flocks.', queries: ['Saraiya Man lake Bettiah', 'Saraiya Man Bihar', 'Bettiah lake Saraiya Man', 'Champaran natural lake'] },
      { name: 'Bettiah Raj Palace & Historic Deorhi', category: 'heritage', distance: '15 km', entryFee: 'Free', timings: '9:00 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.5, description: 'Grand 18th-century palace complex of the Bettiah Raj estate featuring colonial courtyards.', queries: ['Bettiah Raj Palace', 'Bettiah Palace Bihar', 'Bettiah Raj heritage', 'Historic palace Bettiah'] },
      { name: 'Gandak Riverfront & Boat Safari Ghat', category: 'nature', distance: '6 km', entryFee: 'Free (Boat ride extra)', timings: '6:30 AM – 5:30 PM', duration: '2 hrs', rating: 4.7, description: 'Expansive riverbanks offering country boat safaris to observe river dolphins and waterbirds.', queries: ['Gandak river Champaran', 'Gandak river boat safari', 'Gandak riverfront Bihar', 'Great Gandak riverbank'] },
      { name: 'Lauriya Nandangarh Ashokan Lion Pillar', category: 'heritage', distance: '28 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.8, description: 'Pristine 35-foot polished single-stone Ashokan pillar crowned by a magnificent lion capital.', queries: ['Lauriya Nandangarh pillar', 'Ashokan pillar Lauriya', 'Lauriya Nandangarh Bihar', 'Ancient lion pillar Champaran'] },
      { name: 'Valmiki Tiger Reserve Forest Buffer', category: 'wildlife', distance: '45 km', entryFee: '₹100', timings: '6:00 AM – 5:00 PM', duration: '3.5 hrs', rating: 4.9, description: 'Lush Himalayan terai forest harboring Bengal tigers, Indian rhinos, leopards, and elephants.', queries: ['Valmiki Tiger Reserve Bihar', 'Valmiki National Park', 'Valmiki tiger forest', 'Champaran tiger reserve'] },
      { name: 'Bhitiharwa Gandhi Ashram', category: 'heritage', distance: '38 km', entryFee: 'Free', timings: '8:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Historic ashram founded by Mahatma Gandhi during the historic Champaran Satyagraha of 1917.', queries: ['Bhitiharwa Ashram Champaran', 'Gandhi ashram Bhitiharwa', 'Champaran Satyagraha ashram', 'Mahatma Gandhi ashram Bihar'] },
      { name: 'Someshwar Fort & Himalayan Foothills', category: 'nature', distance: '55 km', entryFee: 'Free', timings: '6:00 AM – 5:00 PM', duration: '3 hrs', rating: 4.7, description: 'Highest point in Bihar (880m) offering breathtaking views of snowy Himalayan peaks and Nepal.', queries: ['Someshwar hill Bihar', 'Someshwar fort Champaran', 'Someshwar peak Himalayas', 'Bihar highest peak Someshwar'] }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 3 (Destinations 11–13)');
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

  console.log('\n🎉 Finished Batch 3 successfully!');
}

run().catch(console.error);
