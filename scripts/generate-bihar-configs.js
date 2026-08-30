const fs = require('fs');
const path = require('path');

const CONFIGS = [
  // 6. Kanwar Lake Bird Sanctuary
  {
    slug: 'kanwar-lake-bird-sanctuary',
    title: 'Kanwar Lake Bird Sanctuary',
    state: 'Bihar',
    region: 'Begusarai (Central Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Kanwar Lake (Kabar Taal) — Asia’s Largest Freshwater Oxbow Lake & Ramsar Wetland',
    overview: {
      short: 'Kanwar Lake (Kabar Taal) in Begusarai is Asia’s largest freshwater oxbow lake and Bihar’s first Ramsar wetland, hosting over 106 species of winter migratory waterfowl.',
      description: 'Formed as a residual oxbow meander of the Burhi Gandak River, Kabar Taal spans 67.5 square kilometers in Begusarai district. Designated as a Ramsar Wetland of International Importance in 2020, this aquatic haven shelters critically endangered vultures, eagles, red-crested pochards, and the ancient Jaimangalgarh island temple.',
      features: ['Asia’s Largest Freshwater Oxbow Lake', 'Bihar’s First Ramsar Wetland Site (2020)', '106+ Migratory Bird Species', 'Jaimangalgarh Island Temple'],
      altitude: '44 m',
      rating: 4.6,
      reviewCount: 6800,
      minPrice: 1200,
      distanceFromDelhi: 1080,
      about: 'A peaceful wetland wonderland where country boats glide through lotus-filled waters, reed beds, and historic island mounds.'
    },
    bestTime: { label: 'Nov – Mar', months: [1, 2, 3, 11, 12] },
    weather: { lat: 25.5800, lng: 86.1300, tempSummer: '26–42°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 125 },
      nearestRailway: { name: 'Begusarai Railway Station (BGS)', distance: 22 },
      roadNote: 'Accessible via SH-55 from Begusarai and NH-31 from Patna.',
      routes: [
        { from: 'Patna', city: 'Patna', state: 'Bihar', distance: 125, byCar: '3 hrs', byTrain: 'Train to Begusarai (2 hrs)', byAir: 'Via Patna Airport', via: 'NH-31 Eastbound' },
        { from: 'Begusarai', city: 'Begusarai', state: 'Bihar', distance: 22, byCar: '45 mins', byTrain: 'Local taxi', byAir: 'Via Patna Airport', via: 'SH-55 to Manjhaul' }
      ]
    },
    galleryQueries: ['Kanwar Lake Bihar', 'Kabar Taal Begusarai', 'Kanwar Lake bird sanctuary', 'Jaimangalgarh temple Begusarai', 'Begusarai wetland bird'],
    places: [
      { name: 'Kabar Taal Oxbow Wetland Core', category: 'wildlife', distance: 'Centre', entryFee: 'Free', timings: '6:00 AM – 5:30 PM', duration: '3 hrs', rating: 4.8, description: 'Vast freshwater lagoon hosting shovelers, garganeys, coots, and painted storks.', queries: ['Kanwar Lake Bihar', 'Kabar Taal Begusarai', 'Kabar Taal wetland', 'Bihar oxbow lake bird'] },
      { name: 'Jaimangalgarh Island & Mangla Chandi Temple', category: 'spiritual', distance: 'Island in Lake', entryFee: 'Free', timings: '6:00 AM – 7:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Fortified island mound in the lake housing the revered Maa Chandi temple and Pala relics.', queries: ['Jaimangalgarh temple Begusarai', 'Jaimangalgarh Begusarai', 'Jaimangalgarh island Bihar', 'Mangla Chandi temple Begusarai'] },
      { name: 'Manjhaul Birdwatching Watchtower', category: 'nature', distance: '3 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.6, description: 'Elevated timber watchtower providing panoramic 360-degree views across waterfowl roosting grounds.', queries: ['Begusarai wetland bird', 'Kabar lake watchtower', 'Bihar wetland birdwatching', 'Kanwar lake view'] },
      { name: 'Simaria Ghat (Holy Ganga Sangam)', category: 'spiritual', distance: '32 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '2 hrs', rating: 4.7, description: 'Sacred riverfront ghat on the Ganga famous for the Kartik Kalpwas Mela and holy snan.', queries: ['Simaria Ghat Begusarai', 'Simaria Ganga Ghat Bihar', 'Simaria Ghat Ganga', 'Begusarai Ganga riverfront'] },
      { name: 'Naulakha Temple (Begusarai Heritage)', category: 'heritage', distance: '21 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '1 hr', rating: 4.5, description: 'Magnificent 1953 white marble and sandstone temple constructed by Mahanth Mahavir Das.', queries: ['Naulakha Temple Begusarai', 'Begusarai Naulakha Mandir', 'Naulakha Mandir Bihar', 'Begusarai Hindu temple'] },
      { name: 'Barauni Thermal Power Eco Park', category: 'nature', distance: '25 km', entryFee: '₹20', timings: '9:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.4, description: 'Landscaped eco-park featuring lush botanical gardens, walking tracks, and fountains.', queries: ['Barauni eco park', 'Barauni Begusarai park', 'Begusarai eco garden', 'Barauni lake park'] },
      { name: 'Begusarai District Archaeological Museum', category: 'cultural', distance: '20 km', entryFee: '₹10', timings: '10:30 AM – 4:30 PM (Closed Mon)', duration: '1 hr', rating: 4.4, description: 'Regional repository exhibiting Pala stone sculptures, terracotta antiquities, and coins.', queries: ['Begusarai Museum', 'Begusarai district museum', 'Begusarai archaeology museum', 'Pala sculpture Begusarai'] },
      { name: 'Burhi Gandak Riverfront & Birding Marshes', category: 'nature', distance: '8 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.5, description: 'Meandering river banks supporting kingfishers, river terns, and freshwater waders.', queries: ['Burhi Gandak river Bihar', 'Burhi Gandak Begusarai', 'Gandak river wetland bird', 'Bihar floodplain river'] }
    ]
  },

  // 7. Vishnupad Temple Gaya
  {
    slug: 'vishnupad-temple-gaya',
    title: 'Vishnupad Temple, Gaya',
    state: 'Bihar',
    region: 'Magadh (Southern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Vishnupad Temple — The Sacred Footprint of Lord Vishnu & Pind Daan Epicenter',
    overview: {
      short: 'Vishnupad Temple in Gaya is an ancient 30-meter black basalt temple enshrining the divine 40-cm footprint of Lord Vishnu, reconstructed by Queen Ahilyabai Holkar in 1787.',
      description: 'Standing on the banks of the sacred Falgu River, Vishnupad Temple is the supreme pilgrimage destination for the sacred Hindu rite of Pind Daan. Queen Ahilyabai Holkar of Indore reconstructed the octagonal 100-foot-high temple in 1787 using solid black basalt stone.',
      features: ['40-cm Divine Footprint of Lord Vishnu', '1787 Solid Black Basalt Temple by Ahilyabai Holkar', 'World Epicenter of Ancestral Pind Daan Rites', 'Sacred Immortal Akshayavat Banyan Tree'],
      altitude: '111 m',
      rating: 4.8,
      reviewCount: 32000,
      minPrice: 1400,
      distanceFromDelhi: 1030,
      about: 'A deeply sacred Vedic pilgrimage complex where ancestral offerings, black basalt carvings, and the subterranean Falgu River evoke timeless devotion.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 9, 10, 11, 12] },
    weather: { lat: 24.7797, lng: 85.0069, tempSummer: '26–42°C', tempWinter: '8–24°C' },
    howToReach: {
      nearestAirport: { name: 'Gaya International Airport (GAY)', distance: 9 },
      nearestRailway: { name: 'Gaya Junction (GAYA)', distance: 4 },
      roadNote: 'Conveniently reached via Grand Trunk Road (NH-19) and NH-22 into Gaya.',
      routes: [
        { from: 'Patna', city: 'Patna', state: 'Bihar', distance: 100, byCar: '2.5 hrs', byTrain: 'Express train (1.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-22 Southbound' },
        { from: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', distance: 245, byCar: '4.5 hrs', byTrain: 'Express train (3 hrs)', byAir: 'Train / Road', via: 'NH-19 Eastbound' }
      ]
    },
    galleryQueries: ['Vishnupad Temple Gaya', 'Vishnupad Temple Bihar', 'Falgu River Gaya', 'Akshayavat Gaya', 'Gaya temple ghats'],
    places: [
      { name: 'Vishnupad Sanctum & Ahilyabai Holkar Shikhara', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '2 hrs', rating: 4.9, description: '100-foot black basalt temple housing the 40-cm footprint of Lord Vishnu embossed in rock.', queries: ['Vishnupad Temple Gaya', 'Vishnupad temple sanctum', 'Vishnupad Temple Bihar', 'Vishnupad temple Ahilyabai'] },
      { name: 'Akshayavat (The Undying Sacred Banyan Tree)', category: 'spiritual', distance: '1.2 km', entryFee: 'Free', timings: '5:00 AM – 8:00 PM', duration: '1 hr', rating: 4.8, description: 'Immortal sacred banyan tree where Goddess Sita performed Pind Daan for King Dasharatha.', queries: ['Akshayavat Gaya', 'Akshayavat tree Gaya', 'Akshayavat sacred tree Bihar', 'Gaya banyan tree'] },
      { name: 'Falgu River Devghat & Pind Daan Enclave', category: 'spiritual', distance: 'Temple Front', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1.5 hrs', rating: 4.7, description: 'Sacred riverfront ghat where pilgrims offer sacred rice and sesame balls (Pind) to ancestors.', queries: ['Falgu River Gaya', 'Falgu river ghats', 'Gaya river ghat Devghat', 'Gaya Pind Daan ghat'] },
      { name: 'Mangla Gauri Temple (Shaktipith of Gaya)', category: 'spiritual', distance: '2.5 km', entryFee: 'Free', timings: '5:00 AM – 8:30 PM', duration: '1 hr', rating: 4.8, description: 'Ancient 15th-century hilltop temple recognized as one of the 18 Maha Shakti Peethas.', queries: ['Mangla Gauri Temple Gaya', 'Mangla Gauri temple', 'Mangla Gauri Gaya Bihar', 'Gaya Shaktipith temple'] },
      { name: 'Brahmayoni Hill Temple & 424 Stone Steps', category: 'spiritual', distance: '3.5 km', entryFee: 'Free', timings: '5:30 AM – 6:30 PM', duration: '2 hrs', rating: 4.7, description: 'Highest hill peak in Gaya offering panoramic vistas, crowned by temples of Brahmayoni.', queries: ['Brahmayoni Hill Gaya', 'Brahmayoni temple Bihar', 'Brahmayoni hill steps', 'Gaya hill summit view'] },
      { name: 'Pretshila Hill & Shraddha Tank (Pretkund)', category: 'spiritual', distance: '9 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '2 hrs', rating: 4.6, description: 'Sacred hill dedicated to Lord Yama featuring 676 stone steps and holy Pretkund tank.', queries: ['Pretshila Hill Gaya', 'Pretshila temple Bihar', 'Pretkund Gaya', 'Pretshila hill steps'] },
      { name: 'Ramshila Hill & Ancient Shiva Temple', category: 'spiritual', distance: '5 km', entryFee: 'Free', timings: '6:00 AM – 7:00 PM', duration: '1.5 hrs', rating: 4.6, description: 'Sacred hill where Lord Rama offered Pind Daan, housing ancient Pataleshwar Shiva temples.', queries: ['Ramshila Hill Gaya', 'Ramshila temple Bihar', 'Ramshila hill Gaya', 'Ancient Shiva temple Gaya'] },
      { name: 'Gaya Surya Kund & Dakshinarka Sun Temple', category: 'heritage', distance: '800 m', entryFee: 'Free', timings: '5:30 AM – 8:00 PM', duration: '1 hr', rating: 4.7, description: 'Sacred stepped water tank and Sun temple dedicated to Lord Surya with ancient granite idols.', queries: ['Surya Kund Gaya', 'Dakshinarka Sun Temple Gaya', 'Gaya Sun temple', 'Surya temple Gaya Bihar'] }
    ]
  },

  // 8. Baba Garib Sthan Mandir (Muzaffarpur)
  {
    slug: 'baba-garib-sthan-mandir',
    title: 'Baba Garib Sthan Mandir',
    state: 'Bihar',
    region: 'Tirhut / Muzaffarpur (North Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Baba Garibnath Dham — The Mini Deoghar of North Bihar & Sacred Shiva Sanctorum',
    overview: {
      short: 'Baba Garib Sthan Mandir in Muzaffarpur is one of Bihar’s most venerated Shiva temples, known as the Mini Deoghar, attracting millions of Kanwariya pilgrims annually.',
      description: 'Located in the heart of Muzaffarpur city, Baba Garibnath Mandir is renowned as the Mini Deoghar of Bihar. Devotees carry holy Ganga water on foot from Pahleza Ghat (Sonepur) during the sacred month of Shravan to perform Jalabhishek on the self-manifested (Swayambhu) Shiva Lingam. Surrounding the temple are the lush Shahi Litchi orchards, historic Jubba Sahni Park, and the Sikandarpur Lake.',
      features: ['Swayambhu Shiva Lingam (Baba Garibnath)', 'Mini Deoghar of North Bihar', 'Shravan Kanwar Yatra from Pahleza Ghat', 'Famous Shahi Litchi Heritage Hub'],
      altitude: '60 m',
      rating: 4.7,
      reviewCount: 19500,
      minPrice: 1400,
      distanceFromDelhi: 1040,
      about: 'A vibrant spiritual and cultural landmark where ringing temple bells, fragrant litchi groves, and ancient Shiva lore define North Bihar’s heartland.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 26.1200, lng: 85.3900, tempSummer: '25–41°C', tempWinter: '9–24°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT) / Darbhanga Airport (DBR)', distance: 65 },
      nearestRailway: { name: 'Muzaffarpur Junction (MFP)', distance: 2 },
      roadNote: 'Connected via NH-27 (East-West Corridor) and NH-22 to Patna (70 km) and Hajipur (55 km).',
      routes: [
        { from: 'Patna', city: 'Patna', state: 'Bihar', distance: 70, byCar: '1.5 hrs', byTrain: 'Intercity / Express (1 hr)', byAir: 'Via Patna Airport', via: 'NH-22 Northbound' }
      ]
    },
    galleryQueries: ['Garibnath Mandir Muzaffarpur', 'Muzaffarpur temple Bihar', 'Garib Sthan temple', 'Muzaffarpur city Bihar', 'Muzaffarpur landmark'],
    places: [
      { name: 'Baba Garibnath Main Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '4:30 AM – 9:30 PM', duration: '1.5 hrs', rating: 4.8, description: 'Swayambhu Shiva Lingam sanctum revered as the Mini Deoghar of Bihar.', queries: ['Garibnath Mandir Muzaffarpur', 'Garibnath temple Muzaffarpur', 'Garib Sthan temple', 'Muzaffarpur Shiva temple'] },
      { name: 'Jubba Sahni Park & Memorial Gardens', category: 'nature', distance: '2.5 km', entryFee: '₹15', timings: '6:00 AM – 8:00 PM', duration: '1.5 hrs', rating: 4.5, description: 'Lush 15-acre green park with musical fountains, jogging tracks, and flower gardens.', queries: ['Jubba Sahni Park Muzaffarpur', 'Jubba Sahni Park', 'Muzaffarpur park garden', 'Muzaffarpur city park'] },
      { name: 'Sikandarpur Lake & Eco Promenade', category: 'nature', distance: '1.8 km', entryFee: 'Free', timings: '5:30 AM – 7:30 PM', duration: '1 hr', rating: 4.4, description: 'Historic lake and water reservoir with tree-lined paved walking pathways.', queries: ['Sikandarpur Lake Muzaffarpur', 'Muzaffarpur lake', 'Sikandarpur pond Bihar', 'Muzaffarpur water body'] },
      { name: 'Ramchandra Shahi Museum', category: 'cultural', distance: '3 km', entryFee: '₹10', timings: '10:30 AM – 4:30 PM (Closed Mon)', duration: '1 hr', rating: 4.4, description: 'Museum showcasing rare ancient stone sculptures, weapons, coins, and manuscripts.', queries: ['Ramchandra Shahi Museum Muzaffarpur', 'Muzaffarpur museum', 'Muzaffarpur archaeology museum', 'Tirhut museum Bihar'] },
      { name: 'Katra Garh Archaeological Fort Mound', category: 'heritage', distance: '28 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.5, description: 'Massive ancient earthen rampart and fort mound dating back to the Mauryan and Sunga eras.', queries: ['Katra Garh Muzaffarpur', 'Katra Garh Bihar', 'Katra Garh mound', 'Ancient fort mound Muzaffarpur'] },
      { name: 'National Research Centre for Litchi & Orchards', category: 'nature', distance: '8 km', entryFee: 'Free / Tour', timings: '9:30 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Sprawling research orchards showcasing the GI-tagged Shahi Litchi and China varieties.', queries: ['Shahi Litchi Muzaffarpur', 'Litchi orchard Muzaffarpur', 'NRC Litchi Bihar', 'Muzaffarpur fruit orchard'] },
      { name: 'Kali Mandir Sahu Pokhar', category: 'spiritual', distance: '1.5 km', entryFee: 'Free', timings: '5:00 AM – 8:30 PM', duration: '45 mins', rating: 4.6, description: 'Sacred lakeside temple dedicated to Goddess Kali, known for evening aarti ceremonies.', queries: ['Sahu Pokhar Kali Mandir Muzaffarpur', 'Sahu Pokhar Muzaffarpur', 'Kali Mandir Muzaffarpur', 'Muzaffarpur pond temple'] },
      { name: 'Dargah Hazrat Data Kambal Shah', category: 'heritage', distance: '3.5 km', entryFee: 'Free', timings: '6:00 AM – 9:00 PM', duration: '45 mins', rating: 4.5, description: 'Historic Sufi shrine fostering communal harmony and revered by people of all faiths.', queries: ['Dargah Kambal Shah Muzaffarpur', 'Data Kambal Shah Bihar', 'Muzaffarpur dargah shrine', 'Sufi shrine Muzaffarpur'] }
    ]
  }
];

fs.writeFileSync('scripts/bihar-batch2-data.json', JSON.stringify(CONFIGS, null, 2));
console.log('Saved bihar-batch2-data.json with', CONFIGS.length, 'destinations');
