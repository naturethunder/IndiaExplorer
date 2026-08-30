const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
  // 18. Buxar Fort
  {
    slug: 'buxar-fort',
    title: 'Buxar Fort',
    state: 'Bihar',
    region: 'Bhojpur / Buxar (Western Bihar)',
    type: 'heritage',
    badge: 'Heritage',
    tagline: 'Buxar Fort — The Ganga River Citadel & Battle of Buxar Historic Grounds',
    overview: {
      short: 'Buxar Fort stands on a high bluff overlooking the sacred River Ganga in Buxar, famous for Vedic hermitage lore of Sage Vishwamitra and the historic 1764 Battle of Buxar.',
      description: 'Erected in 1054 CE by King Rudra Deo of the Paramara dynasty and fortified through the Mughal and British eras, Buxar Fort commands spectacular views over the sacred Ganga. The historic town is legendary as the Tapovan of Sage Vishwamitra where Lord Rama slew demoness Tadaka, as well as the site of the pivotal 1764 Battle of Buxar and the 1539 Battle of Chausa.',
      features: ['11th-Century Ganga Riverfront Stone Fortress', 'Battle of Buxar (1764) Monument at Katkauli', 'Ramrekha Ghat (Lord Rama’s Holy Bathing Ghat)', 'Chausa Battlefield & Memorial (1539 CE)'],
      altitude: '65 m', rating: 4.7, reviewCount: 12500, minPrice: 1200, distanceFromDelhi: 920,
      about: 'A historic riverfront destination blending ancient Ramayana legends with epic battlefield monuments along the holy Ganga.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.5600, lng: 83.9800, tempSummer: '26–43°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Varanasi Airport (VNS)', distance: 95 },
      nearestRailway: { name: 'Buxar Railway Station (BXR)', distance: 2 },
      roadNote: 'Located directly on the Varanasi-Patna highway (NH-922) and Purvanchal Expressway spur.',
      routes: [{ from: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', distance: 95, byCar: '2 hrs', byTrain: 'Express train (1 hr)', byAir: 'Via Varanasi Airport', via: 'NH-922 / NH-19' }]
    },
    galleryQueries: ['Buxar Fort Bihar', 'Ramrekha Ghat Buxar', 'Buxar Ganga river', 'Battle of Buxar memorial', 'Buxar monument'],
    places: [
      { name: 'Buxar Fort Citadel & Ganga Viewpoint', category: 'heritage', distance: 'Centre', entryFee: 'Free', timings: '6:00 AM – 6:30 PM', duration: '2 hrs', rating: 4.8, description: 'Medieval stone fort bastion perched on the Ganga bluff with ancient carved subterranean cells.', queries: ['Buxar Fort Bihar', 'Buxar Fort ramparts', 'Buxar citadel Ganga', 'Buxar fort view'] },
      { name: 'Ramrekha Ghat (Sacred Ganga Promenade)', category: 'spiritual', distance: '500 m', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1.5 hrs', rating: 4.8, description: 'Holy riverfront bathing ghat where Lord Rama and Lakshmana crossed the Ganga with Sage Vishwamitra.', queries: ['Ramrekha Ghat Buxar', 'Ramrekha ghat Ganga', 'Buxar Ganga ghat snan', 'Ramrekha ghat Bihar'] },
      { name: 'Katkauli Maidan (Battle of Buxar 1764 Monument)', category: 'heritage', distance: '6 km', entryFee: 'Free', timings: '8:00 AM – 6:00 PM', duration: '1 hr', rating: 4.7, description: 'Historic battleground and British victory stone obelisk commemorating the historic October 1764 battle.', queries: ['Battle of Buxar memorial', 'Katkauli Maidan Buxar', 'Battle of Buxar monument', 'Katkauli memorial Bihar'] },
      { name: 'Chausa Battlefield & Historic Monument', category: 'heritage', distance: '14 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.6, description: 'Famous riverfront site where Sher Shah Suri defeated Mughal Emperor Humayun in June 1539.', queries: ['Chausa battlefield Buxar', 'Chausa monument Bihar', 'Battle of Chausa site', 'Chausa Ganga Buxar'] },
      { name: 'Vishwamitra Ashram (Charitravan)', category: 'spiritual', distance: '2 km', entryFee: 'Free', timings: '5:30 AM – 8:00 PM', duration: '1 hr', rating: 4.7, description: 'Ancient hermitage complex where Sage Vishwamitra taught divine astras to Lord Rama.', queries: ['Vishwamitra Ashram Buxar', 'Charitravan Buxar', 'Vishwamitra ashram Bihar', 'Buxar sage hermitage'] },
      { name: 'Ahirauli Devi Ahilya Temple & Kund', category: 'spiritual', distance: '5 km', entryFee: 'Free', timings: '6:00 AM – 7:30 PM', duration: '1 hr', rating: 4.6, description: 'Sacred village temple commemorating the redemption of Devi Ahilya from a stone curse by Rama’s lotus touch.', queries: ['Ahirauli temple Buxar', 'Ahilya temple Ahirauli', 'Ahirauli Bihar', 'Devi Ahilya temple Buxar'] },
      { name: 'Brahmapur Baba Bameshwar Nath Temple', category: 'spiritual', distance: '36 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '2 hrs', rating: 4.7, description: 'Ancient westward-facing Swayambhu Shiva temple renowned for massive cattle and pilgrim fairs during Shivratri.', queries: ['Brahmapur Shiv temple Buxar', 'Baba Bameshwar Nath temple', 'Brahmapur temple Bihar', 'Bameshwar Nath Buxar'] },
      { name: 'Naulakha Mandir (Charitravan Buxar)', category: 'heritage', distance: '2.5 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '45 mins', rating: 4.5, description: 'Intricately sculpted marble South Indian-style temple complex constructed in the early 20th century.', queries: ['Naulakha Mandir Buxar', 'Naulakha temple Charitravan', 'Buxar South Indian temple', 'Naulakha shrine Bihar'] }
    ]
  },

  // 19. Darbhanga Fort
  {
    slug: 'darbhanga-fort',
    title: 'Darbhanga Fort',
    state: 'Bihar',
    region: 'Mithila / Darbhanga (Northern Bihar)',
    type: 'heritage',
    badge: 'Heritage',
    tagline: 'Darbhanga Fort — The Royal Red-Brick Citadel of Raj Darbhanga & Mithila Cultural Capital',
    overview: {
      short: 'Darbhanga Fort (Rambagh Palace Walls) in Darbhanga is a massive 1934 red-brick royal citadel built by Maharaja Kameshwar Singh of the Khandavala dynasty of Raj Darbhanga.',
      description: 'Modeled after the Red Fort in Delhi, the fort features a 1-kilometer-long, 90-foot-high monumental red-brick perimeter wall and grand gateways. The royal enclave encompasses the Rambagh Palace, the Italianate Anand Bagh Palace, Nargona Palace (India’s first earthquake-resistant royal residence), the revered Shyama Mai Kali Temple, and world-class museums housing priceless gold thrones and Mithila manuscripts.',
      features: ['Massive 1-km Red-Brick Royal Citadel Wall', 'Anand Bagh Palace & Kameshwar Singh Museum', 'Shyama Mai Kali Temple (Royal Crematorium Mandir)', 'Chandradhari Museum of Mithila Art Antiquities'],
      altitude: '52 m', rating: 4.8, reviewCount: 21500, minPrice: 1500, distanceFromDelhi: 1100,
      about: 'The majestic royal heart of Mithila where opulent palaces, grand temple tanks, and ancient classical music traditions flourish.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 26.1500, lng: 85.9000, tempSummer: '25–41°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Darbhanga Airport (DBR)', distance: 6 },
      nearestRailway: { name: 'Darbhanga Junction (DBG)', distance: 3 },
      roadNote: 'Connected via East-West Corridor (NH-27) and SH-50 to Patna (135 km) and Muzaffarpur (60 km).',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 135, byCar: '3 hrs', byTrain: 'Express train (2.5 hrs)', byAir: 'Fly PAT/DBR', via: 'NH-22 and NH-27' }]
    },
    galleryQueries: ['Darbhanga Fort Bihar', 'Raj Darbhanga palace', 'Rambagh Palace Darbhanga', 'Shyama Mai temple Darbhanga', 'Anand Bagh palace Darbhanga'],
    places: [
      { name: 'Raj Darbhanga Fort Wall & Main Gate (Singh Dwar)', category: 'heritage', distance: 'Centre', entryFee: 'Free', timings: '6:00 AM – 6:30 PM', duration: '1.5 hrs', rating: 4.8, description: 'Towering 90-foot red-brick fortified rampart and monumental arched gateways modeled on Delhi’s Red Fort.', queries: ['Darbhanga Fort Bihar', 'Darbhanga Fort wall', 'Singh Dwar Darbhanga', 'Rambagh fort gate'] },
      { name: 'Shyama Mai Kali Temple (Rambagh Complex)', category: 'spiritual', distance: 'Fort Enclave', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.9, description: 'Famous royal temple built in 1933 over the funeral pyre of Maharaja Rameshwar Singh, revered for divine grace.', queries: ['Shyama Mai temple Darbhanga', 'Shyama Kali temple Darbhanga', 'Shyama Mai Mandir Bihar', 'Raj Darbhanga Kali temple'] },
      { name: 'Anand Bagh Palace & Kameshwar Singh Museum', category: 'heritage', distance: '1.5 km', entryFee: '₹10', timings: '10:00 AM – 5:00 PM (Closed Mon)', duration: '2 hrs', rating: 4.8, description: 'Opulent European-style palace housing the Maharajadhiraja Kameshwar Singh Kalyani Foundation museum.', queries: ['Anand Bagh Palace Darbhanga', 'Kameshwar Singh Museum', 'Anand Bagh Bihar', 'Raj Darbhanga palace museum'] },
      { name: 'Nargona Palace (First Earthquake-Resistant Palace)', category: 'heritage', distance: '2 km', entryFee: 'Free (Exterior view)', timings: '9:00 AM – 5:00 PM', duration: '1 hr', rating: 4.7, description: 'Innovative palace constructed in 1939 with earthquake-resistant engineering, now housing LNMU.', queries: ['Nargona Palace Darbhanga', 'Nargona Palace Bihar', 'LNMU Darbhanga palace', 'Historic palace Darbhanga'] },
      { name: 'Chandradhari Museum of Mithila Antiquities', category: 'cultural', distance: '1.8 km', entryFee: '₹5', timings: '10:00 AM – 5:00 PM (Closed Mon)', duration: '1.5 hrs', rating: 4.7, description: 'Celebrated museum featuring 11 galleries exhibiting jewel-encrusted swords, ivory sculptures, and manuscripts.', queries: ['Chandradhari Museum Darbhanga', 'Chandradhari Museum Bihar', 'Darbhanga art museum', 'Mithila painting museum'] },
      { name: 'Ahilya Asthan (Historic Stone Temple)', category: 'spiritual', distance: '24 km', entryFee: 'Free', timings: '6:00 AM – 7:30 PM', duration: '1.5 hrs', rating: 4.7, description: 'Ancient temple built by Maharaja Chhatra Singh on the spot where Lord Rama liberated Devi Ahilya.', queries: ['Ahilya Asthan Darbhanga', 'Ahilya Asthan Bihar', 'Ahilya temple Kamtaul', 'Darbhanga Ramayana temple'] },
      { name: 'Kusheshwar Asthan Shiva Mandir & Waterways', category: 'spiritual', distance: '45 km', entryFee: 'Free', timings: '5:00 AM – 8:30 PM', duration: '2 hrs', rating: 4.7, description: 'Ancient pilgrimage temple dedicated to Baba Kusheshwar Nath surrounded by seasonal waterlogged bird wetlands.', queries: ['Kusheshwar Asthan temple', 'Kusheshwar Asthan Darbhanga', 'Kusheshwar Shiva mandir', 'Darbhanga wetland temple'] },
      { name: 'Manokamna Temple (Carved Red Stone Shrine)', category: 'spiritual', distance: 'Fort Enclave', entryFee: 'Free', timings: '5:30 AM – 8:00 PM', duration: '45 mins', rating: 4.6, description: 'Beautifully sculpted modern red-sandstone temple dedicated to Lord Hanuman, situated inside royal gardens.', queries: ['Manokamna temple Darbhanga', 'Manokamna Mandir Rambagh', 'Darbhanga Hanuman temple', 'Rambagh temple Darbhanga'] }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 6 (Destinations 18–19)');
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

  console.log('\n🎉 Finished Batch 6 successfully!');
}

run().catch(console.error);
