const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
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
      description: 'Formed as a residual oxbow meander of the Burhi Gandak River, Kabar Taal spans 67.5 square kilometers in Begusarai district. Designated as a Ramsar Wetland in 2020, this aquatic haven shelters critically endangered vultures, eagles, red-crested pochards, and the ancient Jaimangalgarh island temple.',
      features: ['Asia’s Largest Freshwater Oxbow Lake', 'Bihar’s First Ramsar Wetland Site (2020)', '106+ Migratory Bird Species', 'Jaimangalgarh Island Temple'],
      altitude: '44 m', rating: 4.6, reviewCount: 6800, minPrice: 1200, distanceFromDelhi: 1080,
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
      altitude: '111 m', rating: 4.8, reviewCount: 32000, minPrice: 1400, distanceFromDelhi: 1030,
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
      description: 'Located in the heart of Muzaffarpur city, Baba Garibnath Mandir is renowned as the Mini Deoghar of Bihar. Devotees carry holy Ganga water on foot from Pahleza Ghat (Sonepur) during Shravan to perform Jalabhishek on the self-manifested Shiva Lingam.',
      features: ['Swayambhu Shiva Lingam (Baba Garibnath)', 'Mini Deoghar of North Bihar', 'Shravan Kanwar Yatra from Pahleza Ghat', 'Famous Shahi Litchi Heritage Hub'],
      altitude: '60 m', rating: 4.7, reviewCount: 19500, minPrice: 1400, distanceFromDelhi: 1040,
      about: 'A vibrant spiritual and cultural landmark where ringing temple bells, fragrant litchi groves, and ancient Shiva lore define North Bihar.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 26.1200, lng: 85.3900, tempSummer: '25–41°C', tempWinter: '9–24°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT) / Darbhanga Airport (DBR)', distance: 65 },
      nearestRailway: { name: 'Muzaffarpur Junction (MFP)', distance: 2 },
      roadNote: 'Connected via NH-27 and NH-22 to Patna (70 km) and Hajipur (55 km).',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 70, byCar: '1.5 hrs', byTrain: 'Intercity (1 hr)', byAir: 'Via Patna Airport', via: 'NH-22 Northbound' }]
    },
    galleryQueries: ['Garibnath Mandir Muzaffarpur', 'Muzaffarpur temple Bihar', 'Garib Sthan temple', 'Muzaffarpur city Bihar', 'Muzaffarpur landmark'],
    places: [
      { name: 'Baba Garibnath Main Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '4:30 AM – 9:30 PM', duration: '1.5 hrs', rating: 4.8, description: 'Swayambhu Shiva Lingam sanctum revered as the Mini Deoghar of Bihar.', queries: ['Garibnath Mandir Muzaffarpur', 'Garibnath temple Muzaffarpur', 'Garib Sthan temple', 'Muzaffarpur Shiva temple'] },
      { name: 'Jubba Sahni Park & Memorial Gardens', category: 'nature', distance: '2.5 km', entryFee: '₹15', timings: '6:00 AM – 8:00 PM', duration: '1.5 hrs', rating: 4.5, description: 'Lush 15-acre green park with musical fountains, jogging tracks, and flower gardens.', queries: ['Jubba Sahni Park Muzaffarpur', 'Jubba Sahni Park', 'Muzaffarpur park garden', 'Muzaffarpur city park'] },
      { name: 'Sikandarpur Lake & Eco Promenade', category: 'nature', distance: '1.8 km', entryFee: 'Free', timings: '5:30 AM – 7:30 PM', duration: '1 hr', rating: 4.4, description: 'Historic lake and water reservoir with tree-lined paved walking pathways.', queries: ['Sikandarpur Lake Muzaffarpur', 'Muzaffarpur lake', 'Sikandarpur pond Bihar', 'Muzaffarpur water body'] },
      { name: 'Ramchandra Shahi Museum', category: 'cultural', distance: '3 km', entryFee: '₹10', timings: '10:30 AM – 4:30 PM (Closed Mon)', duration: '1 hr', rating: 4.4, description: 'Museum showcasing rare ancient stone sculptures, weapons, coins, and manuscripts.', queries: ['Ramchandra Shahi Museum Muzaffarpur', 'Muzaffarpur museum', 'Muzaffarpur archaeology museum', 'Tirhut museum Bihar'] },
      { name: 'Katra Garh Archaeological Fort Mound', category: 'heritage', distance: '28 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.5, description: 'Massive ancient earthen rampart and fort mound dating back to the Mauryan and Sunga eras.', queries: ['Katra Garh Muzaffarpur', 'Katra Garh Bihar', 'Katra Garh mound', 'Ancient fort mound Muzaffarpur'] },
      { name: 'National Research Centre for Litchi & Orchards', category: 'nature', distance: '8 km', entryFee: 'Free', timings: '9:30 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Sprawling research orchards showcasing the GI-tagged Shahi Litchi and China varieties.', queries: ['Shahi Litchi Muzaffarpur', 'Litchi orchard Muzaffarpur', 'NRC Litchi Bihar', 'Muzaffarpur fruit orchard'] },
      { name: 'Kali Mandir Sahu Pokhar', category: 'spiritual', distance: '1.5 km', entryFee: 'Free', timings: '5:00 AM – 8:30 PM', duration: '45 mins', rating: 4.6, description: 'Sacred lakeside temple dedicated to Goddess Kali, known for evening aarti ceremonies.', queries: ['Sahu Pokhar Kali Mandir Muzaffarpur', 'Sahu Pokhar Muzaffarpur', 'Kali Mandir Muzaffarpur', 'Muzaffarpur pond temple'] },
      { name: 'Dargah Hazrat Data Kambal Shah', category: 'heritage', distance: '3.5 km', entryFee: 'Free', timings: '6:00 AM – 9:00 PM', duration: '45 mins', rating: 4.5, description: 'Historic Sufi shrine fostering communal harmony and revered by people of all faiths.', queries: ['Dargah Kambal Shah Muzaffarpur', 'Data Kambal Shah Bihar', 'Muzaffarpur dargah shrine', 'Sufi shrine Muzaffarpur'] }
    ]
  },

  // 9. Bhimbandh Wildlife Sanctuary (Munger)
  {
    slug: 'bhimbandh-wildlife-sanctuary',
    title: 'Bhimbandh Wildlife Sanctuary',
    state: 'Bihar',
    region: 'Kharagpur Hills / Munger (Eastern Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Bhimbandh Sanctuary — Thermal Geothermal Springs & Verdant Kharagpur Hills',
    overview: {
      short: 'Bhimbandh Wildlife Sanctuary in Munger covers 682 square kilometers of dense Sal forests in the Kharagpur Hills, renowned for its pristine natural hot thermal springs.',
      description: 'Nestled south of the River Ganga, Bhimbandh Sanctuary takes its name from Mahabharata legend, where Pandava prince Bhima is said to have built a dam (bandh). The sanctuary is celebrated for its natural geothermal hot springs maintaining constant 52°C to 65°C temperatures, surrounded by dense dry deciduous forests sheltering leopards, tigers, sloth bears, sambar deer, and barking deer.',
      features: ['Natural Geothermal Hot Springs (52°C–65°C)', 'Sprawling 682-sq-km Sal Forest Wilderness', 'Rameshwar Kund & Rishikund Thermal Pools', 'Historic Kharagpur Hills & Ancient Rock Formations'],
      altitude: '240 m', rating: 4.7, reviewCount: 7600, minPrice: 1300, distanceFromDelhi: 1120,
      about: 'An eco-tourism jewel where soothing thermal spring waters, jungle trekking trails, and Mahabharata legends harmonize.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.0600, lng: 86.4000, tempSummer: '26–42°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT) / Deoghar Airport (DGH)', distance: 140 },
      nearestRailway: { name: 'Jamui / Munger Railway Station', distance: 30 },
      roadNote: 'Accessible via NH-333 and SH-82 from Munger, Jamui, and Bhagalpur.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 175, byCar: '4.5 hrs', byTrain: 'Train to Jamui / Kiul (2.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-31 and NH-333' }]
    },
    galleryQueries: ['Bhimbandh Wildlife Sanctuary', 'Bhimbandh hot spring', 'Bhimbandh Munger Bihar', 'Kharagpur hills Munger', 'Bhimbandh forest'],
    places: [
      { name: 'Bhimbandh Geothermal Hot Springs', category: 'nature', distance: 'Centre', entryFee: '₹30', timings: '7:00 AM – 5:30 PM', duration: '2.5 hrs', rating: 4.8, description: 'Natural sulfur thermal springs emerging from rock fissures with temperatures ranging between 52°C and 65°C.', queries: ['Bhimbandh hot spring', 'Bhimbandh thermal spring Bihar', 'Bhimbandh hot water pool', 'Bhimbandh natural spring'] },
      { name: 'Kharagpur Hills Jungle Trek & Forest Trail', category: 'nature', distance: 'Sanctuary Forest', entryFee: 'Included', timings: '6:30 AM – 5:00 PM', duration: '3 hrs', rating: 4.7, description: 'Scenic Sal and bamboo forest trails home to sloth bears, chital, barking deer, and peacocks.', queries: ['Kharagpur hills forest', 'Bhimbandh Wildlife Sanctuary forest', 'Munger hills nature trek', 'Bhimbandh jungle Bihar'] },
      { name: 'Rameshwar Kund Hot Springs', category: 'nature', distance: '14 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.6, description: 'Historic hot spring nestled at the foot of forested hills, with sacred bathing enclosures.', queries: ['Rameshwar Kund Munger', 'Rameshwar Kund Bihar', 'Rameshwar thermal spring', 'Munger hot kund'] },
      { name: 'Rishikund Thermal Waterfall & Sacred Pool', category: 'nature', distance: '22 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '2 hrs', rating: 4.7, description: 'Picturesque valley spring situated between two ridges, revered as an ancient hermitage of sage Rishyasringa.', queries: ['Rishikund Munger', 'Rishikund hot spring Bihar', 'Rishikund waterfall Munger', 'Rishikund sacred pool'] },
      { name: 'Hareshwar Nath Shiva Mandir (Kharagpur)', category: 'spiritual', distance: '16 km', entryFee: 'Free', timings: '5:30 AM – 7:30 PM', duration: '1 hr', rating: 4.6, description: 'Ancient Shiva temple nestled amidst hill slopes, hosting vibrant Shivratri festivities.', queries: ['Hareshwar Nath temple Munger', 'Hareshwar Nath Kharagpur', 'Kharagpur temple Bihar', 'Shiva temple Munger'] },
      { name: 'Sita Kund Geothermal Reservoir (Munger)', category: 'spiritual', distance: '38 km', entryFee: 'Free', timings: '6:00 AM – 7:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Famous boiling hot spring enclosed in stone masonry, linked to Goddess Sita’s Agni Pariksha.', queries: ['Sita Kund Munger', 'Sita Kund hot spring Bihar', 'Sita Kund Munger boiling spring', 'Sita Kund water temple'] },
      { name: 'Kharagpur Lake & Dam Viewpoint', category: 'nature', distance: '18 km', entryFee: 'Free', timings: '7:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.5, description: 'Large artificial lake constructed during the British era offering scenic hill backdrop views.', queries: ['Kharagpur Lake Munger', 'Kharagpur Dam Bihar', 'Munger reservoir lake', 'Kharagpur lake hills'] },
      { name: 'Ghorghat River Valley & Eco Buffer', category: 'nature', distance: '12 km', entryFee: 'Free', timings: '6:30 AM – 5:30 PM', duration: '1 hr', rating: 4.4, description: 'Gentle river valley surrounded by dry deciduous forest and traditional tribal craft hamlets.', queries: ['Ghorghat Munger', 'Ghorghat river Bihar', 'Bhimbandh valley buffer', 'Munger rural landscape'] }
    ]
  },

  // 10. Mangla Gauri Temple (Gaya)
  {
    slug: 'mangla-gauri-temple',
    title: 'Mangla Gauri Temple',
    state: 'Bihar',
    region: 'Magadh (Southern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Maa Mangla Gauri — The Supreme Upa-Shaktipith of Magadh & Gaya Hill Sanctum',
    overview: {
      short: 'Maa Mangla Gauri Temple on Mangalagauri Hill in Gaya is one of the 18 Maha Shakti Peethas, where the breast of Goddess Sati fell according to sacred Puranic scriptures.',
      description: 'Dating back to the 15th century and mentioned in the Padma Purana, Vayu Purana, and Agni Purana, the temple features an east-facing hilltop sanctum housing the sacred breast stone (Sthana Pitha) of Goddess Shakti. The complex also encompasses ancient shrines of Lord Shiva, Ganesha, and Maa Kali.',
      features: ['One of 18 Maha Shakti Peethas', 'Ancient 15th-Century Hilltop Sanctum', 'Sacred Akhand Deep (Eternal Flame)', 'Panoramic Overlook of Ancient Gaya'],
      altitude: '135 m', rating: 4.8, reviewCount: 22000, minPrice: 1400, distanceFromDelhi: 1030,
      about: 'A sublime Shaktipith sanctuary where the sacred Akhand Deep, vermilion offerings, and mystical hilltop breezes welcome pilgrims.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 24.7800, lng: 85.0100, tempSummer: '26–42°C', tempWinter: '8–24°C' },
    howToReach: {
      nearestAirport: { name: 'Gaya International Airport (GAY)', distance: 8 },
      nearestRailway: { name: 'Gaya Junction (GAYA)', distance: 3.5 },
      roadNote: 'Conveniently accessible via NH-22 and local city roads to the foot of Mangalagauri Hill.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 100, byCar: '2.5 hrs', byTrain: 'Vande Bharat (1.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-22 Southbound' }]
    },
    galleryQueries: ['Mangla Gauri Temple Gaya', 'Mangla Gauri temple', 'Mangla Gauri Gaya Bihar', 'Gaya Shaktipith temple', 'Manglagauri hill Gaya'],
    places: [
      { name: 'Maa Mangla Gauri Main Sanctum', category: 'spiritual', distance: 'Hilltop', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.9, description: 'Revered Shaktipith sanctum housing the sacred Sthana Pitha and burning Akhand Deep.', queries: ['Mangla Gauri Temple Gaya', 'Mangla Gauri temple sanctum', 'Mangla Gauri idol Gaya', 'Shaktipith Mangla Gauri'] },
      { name: 'Mangalagauri Hill Stone Steps & Viewpoint', category: 'nature', distance: 'Hill Base', entryFee: 'Free', timings: '5:00 AM – 8:00 PM', duration: '1 hr', rating: 4.7, description: 'Steep flight of stone stairs leading up the hill with panoramic views over the temple roofs of Gaya.', queries: ['Manglagauri hill Gaya', 'Mangla Gauri hill steps', 'Gaya city hill viewpoint', 'Manglagauri hill vista'] },
      { name: 'Lord Shiva Temple of Mangalagauri Complex', category: 'spiritual', distance: 'Temple Grounds', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '30 mins', rating: 4.7, description: 'Ancient stone temple dedicated to Lord Shiva as Bhairava protecting the Shaktipith sanctum.', queries: ['Mangla Gauri Shiva temple', 'Gaya Bhairava temple', 'Mangla Gauri shrine', 'Gaya hilltop Shiva mandir'] },
      { name: 'Brahmayoni Sacred Hill & Rebirth Caves', category: 'spiritual', distance: '1.8 km', entryFee: 'Free', timings: '5:30 AM – 6:30 PM', duration: '2 hrs', rating: 4.7, description: 'Sacred peak with 424 stone steps and narrow natural rock passages symbolizing spiritual rebirth.', queries: ['Brahmayoni Hill Gaya', 'Brahmayoni temple Bihar', 'Brahmayoni hill steps', 'Gaya hill summit view'] },
      { name: 'Falgu Riverbank Devghat Promenade', category: 'spiritual', distance: '1.2 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1.5 hrs', rating: 4.7, description: 'Vibrant riverside ghats where morning snan, Vedic chants, and ancestral offerings take place.', queries: ['Falgu River Gaya', 'Falgu river ghats', 'Gaya river ghat Devghat', 'Gaya Pind Daan ghat'] },
      { name: 'Vishnupad Temple Complex', category: 'spiritual', distance: '1.5 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '2 hrs', rating: 4.9, description: 'Famous 1787 black basalt temple enshrining Lord Vishnu’s sacred footprint.', queries: ['Vishnupad Temple Gaya', 'Vishnupad temple sanctum', 'Vishnupad Temple Bihar', 'Vishnupad temple Ahilyabai'] },
      { name: 'Gaya Surya Kund & Sun Shrine', category: 'heritage', distance: '1.4 km', entryFee: 'Free', timings: '5:30 AM – 8:00 PM', duration: '1 hr', rating: 4.6, description: 'Ancient stepped water tank flanked by stone sculptures of the Sun God standing on a seven-horse chariot.', queries: ['Surya Kund Gaya', 'Dakshinarka Sun Temple Gaya', 'Gaya Sun temple', 'Surya temple Gaya Bihar'] },
      { name: 'Akshayavat Sacred Tree Enclave', category: 'spiritual', distance: '2 km', entryFee: 'Free', timings: '5:00 AM – 8:00 PM', duration: '1 hr', rating: 4.8, description: 'Immortal banyan tree revered since the Ramayana era for the final completion of sacred rites.', queries: ['Akshayavat Gaya', 'Akshayavat tree Gaya', 'Akshayavat sacred tree Bihar', 'Gaya banyan tree'] }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 2 (Destinations 6–10)');
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
        { day: 1, title: `Day 1 — Discovering ${config.title}`, items: [
          { time: 'Morning (7:00 AM)', activity: `Explore ${topPlaces[0]?.name || config.title}`, note: 'Start your journey at the primary attraction.' },
          { time: 'Afternoon (2:00 PM)', activity: `Visit ${topPlaces[1]?.name || 'Regional Landmarks'}`, note: 'Experience local culture and architectural beauty.' },
          { time: 'Evening (5:30 PM)', activity: 'Sunset Viewpoint & Local Evening Walk', note: 'Enjoy serene regional vistas and traditional cuisine.' }
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

  console.log('\n🎉 Finished Batch 2 successfully!');
}

run().catch(console.error);
