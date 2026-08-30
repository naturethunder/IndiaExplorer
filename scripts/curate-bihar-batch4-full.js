const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
  // 14. Aranya Devi Temple (Arrah)
  {
    slug: 'aranya-devi-temple-arrah',
    title: 'Aranya Devi Temple, Arrah',
    state: 'Bihar',
    region: 'Bhojpur / Arrah (Western Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Maa Aranya Devi — The Forest Goddess of Mahabharata & Historic Veer Kunwar Singh Heritage',
    overview: {
      short: 'Maa Aranya Devi Temple in Arrah is an ancient Shakti temple dating back to the Mahabharata era, enshrining twin stone deities who blessed the Pandavas during their exile.',
      description: 'Located in the historic town of Arrah (Bhojpur district), Aranya Devi Temple is the presiding patron deity of the city. Legend holds that the town was named Arrah after Maa Aranya Devi (Goddess of the Forests), worshipped by King Yudhishthira and the Pandavas. The district is also world-renowned for Babu Veer Kunwar Singh, the legendary 80-year-old hero of India’s 1857 First War of Independence, whose historic fort at Jagdishpur stands nearby.',
      features: ['Twin Ancient Stone Deities of Maa Aranya Devi', 'Mahabharata-Era Forest Goddess Sanctorum', 'Historic Jagdishpur Fort of Veer Kunwar Singh', '1857 Arrah House Historic Siege Monument'],
      altitude: '65 m', rating: 4.7, reviewCount: 11200, minPrice: 1200, distanceFromDelhi: 970,
      about: 'A historic Bhojpuri cultural center where sacred Shakti traditions blend with the revolutionary valor of Babu Veer Kunwar Singh.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.5600, lng: 84.6700, tempSummer: '26–42°C', tempWinter: '8–24°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 50 },
      nearestRailway: { name: 'Ara Junction (ARA)', distance: 2.5 },
      roadNote: 'Located 50 km west of Patna, connected via NH-922 (Patna-Buxar Four-Lane Highway).',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 50, byCar: '1 hr', byTrain: 'Express train (40 mins)', byAir: 'Via Patna Airport', via: 'NH-922 Westbound' }]
    },
    galleryQueries: ['Aranya Devi Temple Arrah', 'Aranya Devi temple Bihar', 'Arrah Bihar landmark', 'Veer Kunwar Singh fort Jagdishpur', 'Arrah House Bihar'],
    places: [
      { name: 'Maa Aranya Devi Main Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 9:30 PM', duration: '1.5 hrs', rating: 4.8, description: 'Ancient stone temple housing the twin rounded stone murtis of Aranya Devi and sister Aditi.', queries: ['Aranya Devi Temple Arrah', 'Aranya Devi temple Bihar', 'Arrah Devi temple', 'Maa Aranya Devi sanctum'] },
      { name: 'Veer Kunwar Singh Fort & Memorial (Jagdishpur)', category: 'heritage', distance: '30 km', entryFee: 'Free', timings: '9:00 AM – 5:30 PM', duration: '2 hrs', rating: 4.8, description: 'Historic fort and ancestral palace of 1857 revolutionary leader Babu Veer Kunwar Singh.', queries: ['Veer Kunwar Singh fort Jagdishpur', 'Veer Kunwar Singh fort', 'Jagdishpur fort Bihar', 'Kunwar Singh memorial Arrah'] },
      { name: 'Historic Arrah House & 1857 Siege Monument', category: 'heritage', distance: '3 km', entryFee: 'Free', timings: '10:00 AM – 5:00 PM', duration: '1 hr', rating: 4.6, description: 'Two-storey colonial billiard room that withstood an eight-day siege by Kunwar Singh’s forces in 1857.', queries: ['Arrah House Bihar', 'Arrah House 1857', 'Arrah House monument', 'Siege of Arrah building'] },
      { name: 'Maharaja College Heritage Hall & Museum', category: 'cultural', distance: '2 km', entryFee: 'Free', timings: '10:00 AM – 4:30 PM', duration: '1 hr', rating: 4.5, description: 'Colonial-era educational heritage campus featuring historic stone arches and regional archives.', queries: ['Maharaja College Arrah', 'Maharaja College Bihar', 'Arrah heritage college', 'Historic college building Arrah'] },
      { name: 'Karisath Sun Temple (Surya Mandir)', category: 'spiritual', distance: '12 km', entryFee: 'Free', timings: '5:30 AM – 7:30 PM', duration: '1 hr', rating: 4.6, description: 'Lakeside Sun temple featuring ancient stone reliefs of Lord Surya and vibrant Chhath ghats.', queries: ['Karisath Sun temple Arrah', 'Karisath temple Bihar', 'Surya Mandir Arrah', 'Karisath Surya Mandir'] },
      { name: 'Gangi Riverfront & Historic Bathing Ghats', category: 'nature', distance: '1.5 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '45 mins', rating: 4.4, description: 'Tranquil riverfront tributary offering open skies, morning bathing pavilions, and village views.', queries: ['Gangi river Arrah', 'Gangi riverfront Bihar', 'Arrah riverbank', 'Gangi river ghat'] },
      { name: 'Koilwar Bridge (Historic Abdul Bari Bridge)', category: 'heritage', distance: '16 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.7, description: 'Monumental 1.4-kilometer lattice girder rail-road bridge opened in 1862 across the sacred Son River.', queries: ['Koilwar Bridge Son river', 'Abdul Bari bridge Bihar', 'Koilwar bridge Son', 'Historic railway bridge Bihar'] },
      { name: 'Bhojpur Regional Folk Art & Craft Enclave', category: 'cultural', distance: '3.5 km', entryFee: 'Free', timings: '10:00 AM – 8:00 PM', duration: '1 hr', rating: 4.5, description: 'Artisan quarter specializing in Bhojpuri traditional woodcraft, brassware, and Khaja sweets.', queries: ['Bhojpur folk craft Arrah', 'Arrah traditional market', 'Bhojpuri artisan market', 'Arrah local crafts'] }
    ]
  },

  // 15. Maa Tara Chandi Temple (Sasaram)
  {
    slug: 'maa-tara-chandi-temple',
    title: 'Maa Tara Chandi Temple',
    state: 'Bihar',
    region: 'Kaimur Foothills / Sasaram (Southwestern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Maa Tara Chandi — Ancient Shaktipith of Sati’s Right Eye & Sher Shah Suri’s Grand Mausoleum',
    overview: {
      short: 'Maa Tara Chandi Temple near Sasaram is one of the 51 sacred Shakti Peethas, where Goddess Sati’s right eye is believed to have fallen, located beside Ashoka’s rock edicts.',
      description: 'Nestled on the rugged slopes of the Kaimur hills in Sasaram, Maa Tara Chandi is an ancient Tantric Shaktipith where Goddess Sati’s right eye (Netra) fell. Adjacent to the shrine is an ancient minor rock edict of Emperor Ashoka (256 BCE) carved on Chandan Shahid hill. Sasaram is also world-famous for the UNESCO-tentative Tomb of Sher Shah Suri, a monumental red sandstone mausoleum rising out of an artificial lake.',
      features: ['One of the 51 Sacred Shakti Peethas', 'Tomb of Sher Shah Suri (UNESCO Tentative)', 'Emperor Ashoka Minor Rock Inscription (256 BCE)', 'Dhua Kund & Manjhar Kund Waterfalls'],
      altitude: '108 m', rating: 4.8, reviewCount: 24500, minPrice: 1300, distanceFromDelhi: 940,
      about: 'A magnificent heritage hub combining ancient Tantric spirituality, Mauryan rock inscriptions, and India’s greatest Afghan imperial architecture.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 24.9500, lng: 84.0200, tempSummer: '26–43°C', tempWinter: '7–23°C' },
    howToReach: {
      nearestAirport: { name: 'Varanasi Airport (VNS)', distance: 120 },
      nearestRailway: { name: 'Sasaram Junction (SSM)', distance: 4 },
      roadNote: 'Located directly on Grand Trunk Road (NH-19), 120 km east of Varanasi and 150 km southwest of Patna.',
      routes: [
        { from: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', distance: 120, byCar: '2.5 hrs', byTrain: 'Express train (1.5 hrs)', byAir: 'Via Varanasi Airport', via: 'NH-19 Eastbound' },
        { from: 'Patna', city: 'Patna', state: 'Bihar', distance: 150, byCar: '3.5 hrs', byTrain: 'Express train (2.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-139 / NH-19' }
      ]
    },
    galleryQueries: ['Tara Chandi Temple Sasaram', 'Tomb of Sher Shah Suri', 'Maa Tara Chandi Sasaram', 'Sher Shah Suri tomb Bihar', 'Sasaram monument'],
    places: [
      { name: 'Maa Tara Chandi Shaktipith Sanctum', category: 'spiritual', distance: 'Hill Slopes', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '2 hrs', rating: 4.9, description: 'Sacred cave-temple sanctorum where Goddess Sati’s right eye fell, revered for wish fulfillment.', queries: ['Tara Chandi Temple Sasaram', 'Maa Tara Chandi sanctum', 'Tara Chandi Bihar', 'Sasaram Shaktipith temple'] },
      { name: 'Tomb of Sher Shah Suri (Lake Mausoleum)', category: 'heritage', distance: '5 km', entryFee: '₹25 (Foreigners ₹300)', timings: '6:00 AM – 6:00 PM', duration: '2.5 hrs', rating: 4.9, description: '122-foot red sandstone Afghan architectural masterpiece rising majestically in the center of an artificial lake.', queries: ['Tomb of Sher Shah Suri', 'Sher Shah Suri tomb Bihar', 'Sher Shah Suri mausoleum', 'Sasaram lake tomb'] },
      { name: 'Tomb of Hasan Khan Suri (Sukha Maqbara)', category: 'heritage', distance: '4.5 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1 hr', rating: 4.6, description: 'Walled octagonal mausoleum built for Sher Shah’s father Hasan Khan Suri, featuring stone pavilions.', queries: ['Tomb of Hasan Khan Suri', 'Hasan Suri tomb Sasaram', 'Sukha Maqbara Sasaram', 'Hasan Khan tomb Bihar'] },
      { name: 'Ashoka Minor Rock Edict on Chandan Shahid Hill', category: 'heritage', distance: '2 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Ancient 256 BCE rock inscription inscribed in Brahmi script by Emperor Ashoka inside a hillside rock shelter.', queries: ['Ashoka rock edict Sasaram', 'Chandan Shahid hill Ashoka', 'Ashoka inscription Sasaram', 'Brahmi rock edict Bihar'] },
      { name: 'Dhua Kund Waterfall (Kaimur Escarpment)', category: 'nature', distance: '12 km', entryFee: 'Free', timings: '7:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.8, description: 'Roaring natural waterfall plunging into a deep rocky plunge pool on the forested Kaimur plateau edge.', queries: ['Dhua Kund waterfall Sasaram', 'Dhua Kund Bihar', 'Dhua Kund falls', 'Kaimur waterfall Sasaram'] },
      { name: 'Manjhar Kund Natural Springs', category: 'nature', distance: '11 km', entryFee: 'Free', timings: '7:00 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Twin cascading thermal and mineral waterfall pools, famous during Raksha Bandhan fairs.', queries: ['Manjhar Kund Sasaram', 'Manjhar Kund waterfall', 'Manjhar Kund Bihar', 'Sasaram natural spring'] },
      { name: 'Rohtasgarh Plateau Overlook Point', category: 'nature', distance: '35 km', entryFee: 'Free', timings: '6:00 AM – 5:30 PM', duration: '2.5 hrs', rating: 4.7, description: 'Commanding cliffside viewpoint offering panoramic vistas over the Son river valley and dense hills.', queries: ['Rohtas plateau viewpoint', 'Kaimur scarp overlook', 'Son valley view Bihar', 'Rohtas hill view'] },
      { name: 'Tomb of Salim Shah Suri (Unfinished Lake Tomb)', category: 'heritage', distance: '6 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1 hr', rating: 4.5, description: 'Grand unfinished island tomb of Sher Shah’s son Islam Shah Suri situated in a tranquil reservoir.', queries: ['Tomb of Salim Shah Suri', 'Salim Shah tomb Sasaram', 'Islam Shah Suri tomb', 'Unfinished tomb Sasaram'] }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 4 (Destinations 14–15)');
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

  console.log('\n🎉 Finished Batch 4 successfully!');
}

run().catch(console.error);
