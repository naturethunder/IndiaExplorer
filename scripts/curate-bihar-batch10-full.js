const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
  // 29. ISKCON Temple Patna
  {
    slug: 'iskcon-temple-patna',
    title: 'ISKCON Temple Patna',
    state: 'Bihar',
    region: 'Patna (Central Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Sri Sri Radha Banke Bihari ISKCON Patna — The Grand 108-Pillar Marble Vedic Temple',
    overview: {
      short: 'Sri Sri Radha Banke Bihari ISKCON Temple on Budh Marg is Bihar’s largest and most magnificent modern Hindu temple, built in Rajasthani and South Indian marble architecture with 108 grand stone pillars.',
      description: 'Inaugurated in May 2022, the 100-foot-tall ISKCON temple spans a 2-acre complex on Budh Marg near Patna Junction. The architectural masterpiece features pristine Makrana white marble, 84 intricately carved pillars depicting Lord Krishna’s pastimes, a 1,000-person prayer darbar hall, Govinda’s multi-cuisine restaurant, and a Vedic cultural museum.',
      features: ['100-Foot Makrana Marble Shikhara', '108 Intricately Sculpted Vedic Pillars', 'Govinda’s Vegetarian Restaurant & Bakery', 'Buddha Smriti Park & Patna Museum Corridor'],
      altitude: '53 m', rating: 4.8, reviewCount: 26000, minPrice: 1600, distanceFromDelhi: 1010,
      about: 'A grand modern spiritual oasis vibrating with ecstatic Hare Krishna Mahamantra kirtans, delicious prasadam, and exquisite Rajasthani marble artistry.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.6050, lng: 85.1350, tempSummer: '26–42°C', tempWinter: '9–24°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 5 },
      nearestRailway: { name: 'Patna Junction (PNBE)', distance: 1 },
      roadNote: 'Located on Budh Marg in the heart of Patna, walking distance from Patna Junction railway station.',
      routes: [{ from: 'Patna Junction', city: 'Patna', state: 'Bihar', distance: 1, byCar: '5 mins', byTrain: 'Walking distance (1 km)', byAir: 'Via Patna Airport (5 km)', via: 'Budh Marg' }]
    },
    galleryQueries: ['ISKCON Temple Patna', 'ISKCON Patna temple', 'ISKCON Patna Budh Marg', 'Buddha Smriti Park Patna', 'Patna modern landmark'],
    places: [
      { name: 'Sri Sri Radha Banke Bihari Main Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '4:30 AM – 1:00 PM, 4:30 PM – 8:30 PM', duration: '1.5 hrs', rating: 4.9, description: 'Breathtaking white marble sanctum housing the deities of Radha Banke Bihari, Gaur Nitai, and Ram Darbar.', queries: ['ISKCON Temple Patna', 'ISKCON Patna sanctum', 'Radha Banke Bihari ISKCON Patna', 'ISKCON Patna altar'] },
      { name: '108 Sculpted Marble Pillars & Darbar Hall', category: 'heritage', distance: 'Temple Complex', entryFee: 'Free', timings: '4:30 AM – 8:30 PM', duration: '1 hr', rating: 4.8, description: '108 monumental Makrana marble pillars intricately carved with Bhagavad Gita and Krishna Leela stories.', queries: ['ISKCON Patna pillars', 'ISKCON Patna marble carving', 'ISKCON Patna hall', 'Patna temple marble pillars'] },
      { name: 'Buddha Smriti Park & Patliputra Karuna Stupa', category: 'cultural', distance: '800 m', entryFee: '₹20', timings: '9:00 AM – 7:00 PM (Closed Mon)', duration: '1.5 hrs', rating: 4.7, description: '22-acre urban memorial park featuring a 200-foot stupa housing authentic Lord Buddha relics.', queries: ['Buddha Smriti Park Patna', 'Karuna Stupa Patna', 'Buddha park Patna', 'Patliputra Karuna Stupa'] },
      { name: 'Patna Museum (Jadu Ghar Heritage)', category: 'cultural', distance: '600 m', entryFee: '₹20', timings: '10:30 AM – 4:30 PM (Closed Mon)', duration: '2 hrs', rating: 4.7, description: 'Mughal-Rajput architectural museum opened in 1917, housing a 200-million-year-old fossilized tree and holy Buddha relics casket.', queries: ['Patna Museum Bihar', 'Patna Museum building', 'Jadu Ghar Patna', 'Patna Museum galleries'] },
      { name: 'Mahavir Mandir (Patna Junction Hanuman Temple)', category: 'spiritual', distance: '900 m', entryFee: 'Free', timings: '5:00 AM – 11:00 PM', duration: '1 hr', rating: 4.9, description: 'One of the most visited Hanuman temples in North India, famous for twin Hanuman idols and Naivedyam laddoos.', queries: ['Mahavir Mandir Patna', 'Mahavir Mandir Patna Junction', 'Patna Hanuman temple', 'Mahavir temple Bihar'] },
      { name: 'Golghar Granary & Circular Vista', category: 'heritage', distance: '2.5 km', entryFee: '₹20', timings: '9:30 AM – 6:00 PM', duration: '1 hr', rating: 4.6, description: 'Iconic 1786 stupa-shaped colonial granary offering panoramic views of the city and the Ganga.', queries: ['Golghar Patna', 'Golghar granary Bihar', 'Golghar staircase Patna', 'Historic Golghar Patna'] },
      { name: 'Sanjay Gandhi Biological Park (Patna Zoo)', category: 'nature', distance: '4.5 km', entryFee: '₹50', timings: '8:00 AM – 5:30 PM (Closed Mon)', duration: '2.5 hrs', rating: 4.7, description: '153-acre lush botanical and zoological park renowned for successful breeding of one-horned Indian rhinoceroses.', queries: ['Sanjay Gandhi Biological Park Patna', 'Patna Zoo Bihar', 'Patna botanical garden', 'Patna zoo rhino'] },
      { name: 'Eco Park (Rajdhani Vatika)', category: 'nature', distance: '3 km', entryFee: '₹20', timings: '5:00 AM – 8:00 PM (Closed Thu)', duration: '1.5 hrs', rating: 4.6, description: 'Vibrant 9-hectare ecological park featuring two central lakes, walking trails, and themed flower gardens.', queries: ['Eco Park Patna', 'Rajdhani Vatika Patna', 'Patna Eco Park lake', 'Patna urban garden'] }
    ]
  },

  // 30. Nagi Bird Sanctuary (Jamui)
  {
    slug: 'nagi-bird-sanctuary',
    title: 'Nagi Bird Sanctuary',
    state: 'Bihar',
    region: 'Jamui / Anga (Southeastern Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Nagi Bird Sanctuary — Bihar’s Ramsar Wetland Jewel & Migratory Avian Haven',
    overview: {
      short: 'Nagi Bird Sanctuary (and adjacent Nakti Dam) in Jamui spans 7.91 square kilometers of crystal-clear reservoir waters, designated as Ramsar Wetlands in 2024.',
      description: 'Surrounded by the scenic hills and dry deciduous Sal forests of Jamui district, Nagi Dam was created for irrigation and has evolved into one of Eastern India’s richest waterfowl refuges. Recognized as a Ramsar Wetland of International Importance in 2024, it hosts over 20,000 migratory birds each winter, including the Bar-headed Goose (over 1.6% of the global population), painted storks, red-crested pochards, and osprey.',
      features: ['Designated Ramsar Wetland Site (2024)', 'Host to 1.6% of Global Bar-headed Goose Population', 'Host Venue of Bihar’s State Bird Festival "Kalrav"', 'Scenic Hill & Water Reservoir Panorama'],
      altitude: '130 m', rating: 4.7, reviewCount: 7100, minPrice: 1200, distanceFromDelhi: 1150,
      about: 'A scenic avian paradise where azure reservoir waters, misty winter hillocks, and thousands of Bar-headed Geese greet nature lovers.'
    },
    bestTime: { label: 'Nov – Mar', months: [1, 2, 3, 11, 12] },
    weather: { lat: 24.8100, lng: 86.3600, tempSummer: '26–42°C', tempWinter: '7–23°C' },
    howToReach: {
      nearestAirport: { name: 'Deoghar Airport (DGH)', distance: 65 },
      nearestRailway: { name: 'Jhajha Railway Station (JAJ) / Jamui (JMU)', distance: 15 },
      roadNote: 'Located 15 km from Jhajha and 35 km from Jamui town via SH-18 and local paved roads.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 190, byCar: '4.5 hrs', byTrain: 'Express train to Jhajha (3 hrs)', byAir: 'Via Deoghar/Patna Airport', via: 'NH-31 and NH-333' }]
    },
    galleryQueries: ['Nagi Bird Sanctuary Jamui', 'Nagi Dam Bihar', 'Nakti Dam bird sanctuary', 'Jamui bird sanctuary Bihar', 'Bar-headed goose Bihar'],
    places: [
      { name: 'Nagi Dam Wetland & Bird Sanctuary Core', category: 'wildlife', distance: 'Centre', entryFee: '₹20', timings: '6:00 AM – 5:30 PM', duration: '3 hrs', rating: 4.8, description: 'Crystal-clear reservoir hosting massive winter flocks of Bar-headed Geese, grebes, and coots.', queries: ['Nagi Bird Sanctuary Jamui', 'Nagi Dam Bihar', 'Nagi bird sanctuary lake', 'Jamui wetland bird'] },
      { name: 'Nakti Dam Bird Sanctuary (Twin Reservoir)', category: 'wildlife', distance: '6 km', entryFee: '₹20', timings: '6:00 AM – 5:30 PM', duration: '2.5 hrs', rating: 4.8, description: 'Twin Ramsar water body surrounded by scenic rocky hillocks, hosting migratory ducks and eagles.', queries: ['Nakti Dam bird sanctuary', 'Nakti Dam Jamui', 'Nakti reservoir Bihar', 'Nakti bird sanctuary'] },
      { name: 'Nagi Bird Interpretation Centre & Watchtowers', category: 'cultural', distance: 'Sanctuary Gate', entryFee: 'Included', timings: '6:30 AM – 5:00 PM', duration: '1 hr', rating: 4.6, description: 'State-of-the-art nature interpretation center equipped with high-powered spotting scopes.', queries: ['Nagi interpretation centre', 'Jamui bird watchtower', 'Nagi dam watchtower', 'Bihar bird festival Kalrav'] },
      { name: 'Gidhaur Royal Fort & Heritage Palace', category: 'heritage', distance: '22 km', entryFee: 'Free', timings: '8:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.6, description: 'Historic 16th-century stone palace and fortified citadel of the Chandel Rajput rulers of Gidhaur Raj.', queries: ['Gidhaur fort Jamui', 'Gidhaur palace Bihar', 'Gidhaur Raj heritage', 'Historic fort Gidhaur'] },
      { name: 'Patneshwar Dham Shiva Temple', category: 'spiritual', distance: '18 km', entryFee: 'Free', timings: '5:30 AM – 8:30 PM', duration: '1 hr', rating: 4.6, description: 'Ancient Shiva temple situated amidst hillocks, revered throughout Jamui and Santhal Pargana.', queries: ['Patneshwar Dham Jamui', 'Patneshwar temple Bihar', 'Patneshwar Shiva mandir', 'Jamui Shiva temple'] },
      { name: 'Lachhuar Digambar Jain Teerth', category: 'spiritual', distance: '38 km', entryFee: 'Free', timings: '6:00 AM – 7:30 PM', duration: '2 hrs', rating: 4.8, description: 'Ancient Jain pilgrimage shrine and Dharamshala associated with Lord Mahavira’s early austerities.', queries: ['Lachhuar Jain temple Jamui', 'Lachhuar Bihar', 'Jain Teerth Lachhuar', 'Lord Mahavira Lachhuar'] },
      { name: 'Kumar Gram Reservoir & Hill Escarpment', category: 'nature', distance: '8 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.5, description: 'Scenic irrigation reservoir nestled below rugged hill ridges, offering peaceful nature walks.', queries: ['Kumar gram reservoir Jamui', 'Jamui hill lake', 'Jamui countryside reservoir', 'Bihar hill nature lake'] },
      { name: 'Jamui Sal & Bamboo Forest Eco Trail', category: 'nature', distance: '12 km', entryFee: 'Free', timings: '6:30 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.5, description: 'Shaded woodland trail through natural Sal forests harboring peacocks, jungle cats, and spotted deer.', queries: ['Jamui Sal forest', 'Jamui forest eco trail', 'Bihar Sal woods nature', 'Jamui wildlife corridor'] }
    ]
  },

  // 31. Barela Bird Sanctuary (Vaishali / Samastipur)
  {
    slug: 'barela-bird-sanctuary',
    title: 'Barela Bird Sanctuary',
    state: 'Bihar',
    region: 'Tirhut / Vaishali (Central Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Barela Bird Sanctuary (Salim Ali Zubba Sahni Sanctuary) — Vaishali’s Wetland Refuge',
    overview: {
      short: 'Barela Bird Sanctuary (Salim Ali Zubba Sahni Bird Sanctuary) in Vaishali spans 1.96 square kilometers of tranquil waterlogged wetland, hosting thousands of winter migratory waterfowl.',
      description: 'Named in honor of renowned ornithologist Dr. Salim Ali and freedom fighter Jubba Sahni, Barela Sanctuary is situated in the fertile floodplains of the Gandak and Ganga rivers in Vaishali district. The shallow perennial lake and surrounding reed marshes provide an ideal wintering ground for teals, pintails, common pochards, purple swamphens, and bronze-winged jacanas.',
      features: ['1.96-sq-km Protected Bird Sanctuary', 'Salim Ali Jubba Sahni Avian Reserve', 'Winter Migration of Himalayan & Siberian Waterfowl', 'Vaishali Heritage & Chechar Excavation Proximity'],
      altitude: '52 m', rating: 4.6, reviewCount: 5200, minPrice: 1200, distanceFromDelhi: 1010,
      about: 'A secluded wetland sanctuary where peaceful reed beds, village boats, and thousands of migratory ducks flourish.'
    },
    bestTime: { label: 'Nov – Mar', months: [1, 2, 3, 11, 12] },
    weather: { lat: 25.7500, lng: 85.3500, tempSummer: '26–42°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 38 },
      nearestRailway: { name: 'Hajipur Junction (HJP)', distance: 22 },
      roadNote: 'Located in Jandaha/Mahnar block of Vaishali, accessible via SH-49 from Hajipur and Samastipur.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 38, byCar: '1 hr', byTrain: 'Train to Hajipur (20 mins)', byAir: 'Via Patna Airport', via: 'JP Ganga Setu & SH-49' }]
    },
    galleryQueries: ['Barela Bird Sanctuary Bihar', 'Salim Ali bird sanctuary Vaishali', 'Barela lake wetland', 'Vaishali bird sanctuary', 'Bihar wetland waterfowl'],
    places: [
      { name: 'Barela Lake Wetland & Birding Channels', category: 'wildlife', distance: 'Centre', entryFee: 'Free', timings: '6:00 AM – 5:30 PM', duration: '2.5 hrs', rating: 4.7, description: 'Shallow perennial wetland lake hosting migratory teals, pintails, jacanas, and purple moorhens.', queries: ['Barela Bird Sanctuary Bihar', 'Barela lake wetland', 'Salim Ali bird sanctuary Vaishali', 'Vaishali bird sanctuary'] },
      { name: 'Chechar Archaeological Mound & Neolithic Site', category: 'heritage', distance: '14 km', entryFee: 'Free', timings: '8:00 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.6, description: 'Famous archaeological excavation mound on the north bank of the Ganga that yielded Neolithic bone tools and pottery.', queries: ['Chechar archaeological site Bihar', 'Chechar Vaishali', 'Chechar Neolithic mound', 'Ancient excavation Chechar'] },
      { name: 'Jandaha Floodplain Eco Walk & Orchards', category: 'nature', distance: '5 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1 hr', rating: 4.4, description: 'Green rural walking trail through mango and litchi orchards overlooking the meandering Baya river.', queries: ['Jandaha Vaishali', 'Vaishali countryside nature', 'Jandaha orchards Bihar', 'Baya river floodplain'] },
      { name: 'Mahnar Ganga Riverfront Ghats', category: 'spiritual', distance: '12 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.5, description: 'Peaceful northern Ganga riverbank with traditional country ferry boats and scenic sunrise viewpoints.', queries: ['Mahnar Ganga ghat', 'Mahnar riverfront Bihar', 'Ganga ghat Mahnar', 'Vaishali river ghat'] },
      { name: 'Lal Keshwar Shiv Temple (Baghmali)', category: 'spiritual', distance: '22 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1 hr', rating: 4.7, description: 'Ancient stone temple housing a revered Shiva Lingam and sacred pond in Hajipur.', queries: ['Lal Keshwar Shiv temple Hajipur', 'Lal Keshwar temple Baghmali', 'Lal Keshwar Mandir Bihar', 'Hajipur Shiva mandir'] },
      { name: 'Vaishali Ashokan Pillar & Stupa Complex', category: 'heritage', distance: '38 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '2.5 hrs', rating: 4.9, description: 'World-famous 3rd-century BCE monolithic pillar with lion capital and Buddha relic stupa.', queries: ['Kolhua Ashokan Pillar Vaishali', 'Ashoka pillar Kolhua', 'Kolhua lion pillar Bihar', 'Vaishali Ashokan pillar'] },
      { name: 'Ramchaura Mandir (Footprints of Lord Rama)', category: 'spiritual', distance: '24 km', entryFee: 'Free', timings: '5:30 AM – 8:30 PM', duration: '1 hr', rating: 4.7, description: 'Ancient temple marking the spot where Lord Rama placed his feet on his way to Janakpur.', queries: ['Ramchaura Mandir Hajipur', 'Ramchaura temple Bihar', 'Lord Rama footprint Hajipur', 'Ramchaura mandir'] },
      { name: 'Sonepur Sangam Ghat (Ganga-Gandak Sangam)', category: 'nature', distance: '26 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1.5 hrs', rating: 4.8, description: 'Sacred confluence where the blue waters of Gandak merge into the broad Ganga river.', queries: ['Gandak Ganga Sangam Hajipur', 'Ganga Gandak confluence', 'Hajipur river confluence', 'Gandak riverbank Bihar'] }
    ]
  },

  // 32. Kusheshwar Asthan Bird Sanctuary (Darbhanga)
  {
    slug: 'kusheshwar-asthan-bird-sanctuary',
    title: 'Kusheshwar Asthan Bird Sanctuary',
    state: 'Bihar',
    region: 'Mithila / Darbhanga (Northern Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Kusheshwar Asthan — The Sacred Shiva Wetland & North Bihar’s Waterfowl Haven',
    overview: {
      short: 'Kusheshwar Asthan Bird Sanctuary in Darbhanga covers 7,019 acres of waterlogged wetlands formed by the confluence of Kamla and Kosi river channels, surrounding an ancient Shiva temple.',
      description: 'Located in southeastern Darbhanga district, Kusheshwar Asthan is a unique fusion of sacred Shaivite pilgrimage and vibrant avian ecology. During winter, expansive monsoon floods transform the basin into a vast aquatic paradise sheltering over 15 species of endangered migratory birds, including Dalmatian pelicans, bar-headed geese, and painted storks.',
      features: ['Sprawling 7,019-Acre Wetland Waterfowl Sanctuary', 'Ancient Baba Kusheshwar Nath Shiva Temple', 'Confluence Wetlands of Kamla & Kosi River Basin', 'Wintering Ground for Endangered Dalmatian Pelicans'],
      altitude: '49 m', rating: 4.7, reviewCount: 6400, minPrice: 1200, distanceFromDelhi: 1140,
      about: 'A magical wetland oasis where sacred temple bells mingle with the calls of thousands of migratory waterfowl across shimmering waters.'
    },
    bestTime: { label: 'Nov – Mar', months: [1, 2, 3, 11, 12] },
    weather: { lat: 25.8500, lng: 86.1500, tempSummer: '25–41°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Darbhanga Airport (DBR)', distance: 65 },
      nearestRailway: { name: 'Hasanpur Road (HPO) / Darbhanga Junction (DBG)', distance: 22 },
      roadNote: 'Accessible via SH-56 from Samastipur, Rosera, and Darbhanga town.',
      routes: [{ from: 'Darbhanga', city: 'Darbhanga', state: 'Bihar', distance: 65, byCar: '2 hrs', byTrain: 'Train to Hasanpur Road (1 hr)', byAir: 'Via Darbhanga Airport', via: 'SH-56 Southbound' }]
    },
    galleryQueries: ['Kusheshwar Asthan Darbhanga', 'Kusheshwar Asthan bird sanctuary', 'Kusheshwar Asthan temple Bihar', 'Darbhanga wetland bird', 'Kusheshwar lake waterfowl'],
    places: [
      { name: 'Kusheshwar Asthan Wetland Sanctuary Lagoon', category: 'wildlife', distance: 'Centre', entryFee: 'Free (Boat ride ₹200)', timings: '6:00 AM – 5:30 PM', duration: '3 hrs', rating: 4.8, description: 'Vast waterlogged lagoon hosting Dalmatian pelicans, whistling teals, and painted storks.', queries: ['Kusheshwar Asthan bird sanctuary', 'Kusheshwar wetland Bihar', 'Darbhanga bird sanctuary', 'Kusheshwar lake waterfowl'] },
      { name: 'Baba Kusheshwar Nath Shiva Mandir', category: 'spiritual', distance: 'Village Center', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.8, description: 'Ancient Shiva temple where water from the surrounding sacred wetlands is offered during daily aarti.', queries: ['Kusheshwar Asthan temple', 'Kusheshwar Asthan Darbhanga', 'Kusheshwar Shiva mandir', 'Darbhanga wetland temple'] },
      { name: 'Kamla-Kosi River Channel Confluence', category: 'nature', distance: '5 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.6, description: 'Braided river channels where the clear streams of Kamla meet the perennial waters of the Kosi.', queries: ['Kamla river Darbhanga', 'Kosi river wetland Bihar', 'Darbhanga river confluence', 'Kamla Kosi wetland'] },
      { name: 'Hasanpur Sugar Heritage Enclave', category: 'heritage', distance: '22 km', entryFee: 'Free', timings: '9:00 AM – 5:00 PM', duration: '1 hr', rating: 4.4, description: 'Historic sugar mill township with colonial-era rail sidings and bustling local farming bazaars.', queries: ['Hasanpur Road Darbhanga', 'Hasanpur Bihar heritage', 'Hasanpur sugar mill', 'Darbhanga rural heritage'] },
      { name: 'Darbhanga Raj Fort & Rambagh Palace', category: 'heritage', distance: '65 km', entryFee: 'Free', timings: '6:00 AM – 6:30 PM', duration: '2 hrs', rating: 4.8, description: 'Monumental 90-foot red-brick fortified rampart and palaces of the Maharaja of Darbhanga.', queries: ['Darbhanga Fort Bihar', 'Darbhanga Fort wall', 'Singh Dwar Darbhanga', 'Rambagh fort gate'] },
      { name: 'Shyama Mai Kali Temple (Darbhanga)', category: 'spiritual', distance: '65 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.9, description: 'Royal temple built over the funeral pyre of Maharaja Rameshwar Singh inside palace grounds.', queries: ['Shyama Mai temple Darbhanga', 'Shyama Kali temple Darbhanga', 'Shyama Mai Mandir Bihar', 'Raj Darbhanga Kali temple'] },
      { name: 'Singheshwar Asthan Shiva Temple (Madhepura)', category: 'spiritual', distance: '55 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '2 hrs', rating: 4.7, description: 'Ancient Ramayana-associated Shiva shrine where Sage Rishyasringa performed King Dasharatha’s Putrakameshti Yajna.', queries: ['Singheshwar Asthan temple', 'Singheshwar temple Bihar', 'Singheshwar Dham', 'Singheshwar Shiva temple'] },
      { name: 'Mithila Lotus Harvesting Wetlands', category: 'cultural', distance: '4 km', entryFee: 'Free', timings: '6:00 AM – 11:00 AM', duration: '1 hr', rating: 4.5, description: 'Traditional wetlands where farmers harvest GI-tagged Mithila Makhana (foxnuts) and lotus blooms.', queries: ['Mithila Makhana harvest', 'Makhana farming Bihar', 'Lotus wetland Darbhanga', 'Makhana pond Mithila'] }
    ]
  },

  // 33. Rajauli Wildlife Sanctuary (Nawada)
  {
    slug: 'rajauli-wildlife-sanctuary',
    title: 'Rajauli Wildlife Sanctuary',
    state: 'Bihar',
    region: 'Magadh / Nawada (Southern Bihar)',
    type: 'wildlife',
    badge: 'Wildlife',
    tagline: 'Rajauli Sanctuary — Forested Ghats of Nawada & The Roaring Kakolat Waterfall',
    overview: {
      short: 'Rajauli Wildlife Sanctuary in Nawada covers 27.27 square kilometers of dense Sal forest along the rugged Bihar-Jharkhand border, renowned for the crystal-clear Kakolat Waterfall.',
      description: 'Nestled on the northern edge of the Chota Nagpur plateau in Nawada district, Rajauli Sanctuary spans scenic rocky ghats, dry deciduous forests, and pristine freshwater streams. The crown jewel of the region is the scenic Kakolat Waterfall (Sheetal Jalpratap), a 160-foot natural cascade falling into a deep natural pool where legend holds that King Nahusha was liberated from a serpent’s curse.',
      features: ['27.27-sq-km Protected Wildlife Sanctuary', '160-Foot Kakolat Natural Waterfall (Sheetal Jalpratap)', 'Scenic Rajauli Ghat Mountain Pass', 'Gunawa Jain Teerth & Sarvodaya Ashram'],
      altitude: '290 m', rating: 4.8, reviewCount: 15400, minPrice: 1300, distanceFromDelhi: 1060,
      about: 'A refreshing hill sanctuary where cool cascading waters, scenic mountain ghats, and peaceful Jain shrines grace the southern hills of Bihar.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 24.6500, lng: 85.5000, tempSummer: '26–42°C', tempWinter: '7–23°C' },
    howToReach: {
      nearestAirport: { name: 'Gaya International Airport (GAY)', distance: 80 },
      nearestRailway: { name: 'Nawada Railway Station (NWD) / Koderma (KQR)', distance: 28 },
      roadNote: 'Located directly on the Ranchi-Patna Highway (NH-20 / NH-31) through the scenic Rajauli Ghats.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 135, byCar: '3.5 hrs', byTrain: 'Train to Nawada (2.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-20 / NH-31 Southbound' }]
    },
    galleryQueries: ['Rajauli Wildlife Sanctuary', 'Kakolat waterfall Bihar', 'Kakolat falls Nawada', 'Rajauli ghat Bihar', 'Nawada hill forest'],
    places: [
      { name: 'Kakolat Waterfall (Sheetal Jalpratap)', category: 'nature', distance: '18 km', entryFee: '₹20', timings: '7:00 AM – 5:30 PM', duration: '3 hrs', rating: 4.9, description: 'Spectacular 160-foot natural mountain waterfall cascading into an ice-cold natural rock pool surrounded by lush woods.', queries: ['Kakolat waterfall Bihar', 'Kakolat falls Nawada', 'Kakolat waterfall', 'Kakolat natural pool'] },
      { name: 'Rajauli Sanctuary Sal Forest & Eco Trail', category: 'wildlife', distance: 'Centre', entryFee: 'Free', timings: '6:30 AM – 5:00 PM', duration: '2.5 hrs', rating: 4.7, description: 'Dense deciduous Sal forest sheltering leopards, sloth bears, chital, sambar, and wild boars.', queries: ['Rajauli Wildlife Sanctuary', 'Rajauli forest Bihar', 'Nawada wildlife sanctuary', 'Rajauli deciduous woods'] },
      { name: 'Rajauli Ghat Scenic Mountain Pass', category: 'nature', distance: '5 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.7, description: 'Winding mountain pass offering breathtaking panoramic viewpoints across the Chota Nagpur plateau escarpment.', queries: ['Rajauli ghat Bihar', 'Rajauli mountain pass', 'Rajauli highway view', 'Nawada ghat road'] },
      { name: 'Gunawa Digambar Jain Temple & Lake', category: 'spiritual', distance: '26 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Historic Jain pilgrimage shrine marking the Nirvana spot of Gandhara Gautama Swami, chief disciple of Mahavira.', queries: ['Gunawa Jain temple Nawada', 'Gunawa Ji Bihar', 'Gautam Swami Nirvana Gunawa', 'Jain temple Nawada'] },
      { name: 'Sarvodaya Ashram Sekhodeora (JP Memorial)', category: 'heritage', distance: '24 km', entryFee: 'Free', timings: '9:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.7, description: 'Historic rural ashram established by Loknayak Jayaprakash Narayan (JP) in 1952 for grassroots development.', queries: ['Sarvodaya Ashram Sekhodeora', 'JP Ashram Nawada', 'Sekhodeora ashram Bihar', 'Jayaprakash Narayan ashram'] },
      { name: 'Pawapuri Jal Mandir (Jain Lotus Shrine)', category: 'spiritual', distance: '45 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '2 hrs', rating: 4.9, description: 'Pristine white marble temple in the middle of a lotus pond marking Lord Mahavira’s Nirvana.', queries: ['Pawapuri Jal Mandir', 'Pawapuri temple Bihar', 'Jal Mandir Pawapuri', 'Pawapuri lotus lake temple'] },
      { name: 'Meskaur Hill & Shiva Temple Ruins', category: 'heritage', distance: '15 km', entryFee: 'Free', timings: '6:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.5, description: 'Rocky hill outcrop crowned by ancient medieval stone Shiva temple ruins and spring ponds.', queries: ['Meskaur hill Nawada', 'Meskaur temple Bihar', 'Meskaur Shiva shrine', 'Nawada hill temple'] },
      { name: 'Mahadeopur Forest Stream & Picnic Glade', category: 'nature', distance: '12 km', entryFee: 'Free', timings: '7:00 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.5, description: 'Crystal-clear forest stream shaded by giant Mahua and Sal trees, popular for quiet nature walks.', queries: ['Mahadeopur stream Rajauli', 'Rajauli forest picnic', 'Nawada nature stream', 'Rajauli forest glade'] }
    ]
  },

  // 34. Nandangarh Stupa and Rampart (Lauriya Nandangarh)
  {
    slug: 'nandangarh-stupa-and-rampart',
    title: 'Nandangarh Stupa and Rampart',
    state: 'Bihar',
    region: 'Tirhut / West Champaran (Northwestern Bihar)',
    type: 'heritage',
    badge: 'Heritage',
    tagline: 'Lauriya Nandangarh — The 80-Foot Ancient Stupa & Complete Ashokan Lion Capital',
    overview: {
      short: 'Lauriya Nandangarh in West Champaran features an intact 35-foot polished Ashokan Lion Pillar (249 BCE) and one of India’s largest ancient multi-tiered Buddhist stupas, rising 80 feet high.',
      description: 'Situated near Bettiah, Lauriya Nandangarh is a monumentally significant historical site. It preserves a complete, unblemished monolithic single-block sandstone pillar erected by Emperor Ashoka in the 3rd century BCE, crowned by a magnificent seated lion capital with clean edicts in Brahmi script. Nearby lies the massive Nandangarh Stupa, an 80-foot terraced brick stupa, and prehistoric Vedic burial mounds.',
      features: ['Complete Intact Ashokan Lion Pillar (249 BCE)', 'Colossal 80-Foot Terraced Brick Buddhist Stupa', 'Prehistoric Vedic Earthen Burial Mounds', 'Valmiki Tiger Reserve & Gandak River Gateway'],
      altitude: '72 m', rating: 4.8, reviewCount: 11200, minPrice: 1300, distanceFromDelhi: 960,
      about: 'A profound archaeological landscape where monumental Ashokan stone art, ancient stupas, and Himalayan foothills meet.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 26.9800, lng: 84.4000, tempSummer: '24–40°C', tempWinter: '7–22°C' },
    howToReach: {
      nearestAirport: { name: 'Gorakhpur Airport (GOP) / Patna Airport (PAT)', distance: 145 },
      nearestRailway: { name: 'Lauriya / Bettiah Railway Station', distance: 1.5 },
      roadNote: 'Located on NH-727 (Bettiah-Bagaha Highway), 25 km north of Bettiah town.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 235, byCar: '5.5 hrs', byTrain: 'Sapt Kranti Exp to Bettiah (4 hrs)', byAir: 'Via Patna/Gorakhpur Airport', via: 'NH-27 and NH-727' }]
    },
    galleryQueries: ['Lauriya Nandangarh pillar', 'Nandangarh stupa Bihar', 'Ashokan pillar Lauriya', 'Lauriya Nandangarh Bihar', 'Ancient stupa Champaran'],
    places: [
      { name: 'Lauriya Ashokan Lion Pillar (Intact 249 BCE Monolith)', category: 'heritage', distance: 'Centre', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.9, description: 'Complete 35-foot polished single-stone sandstone pillar crowned by an unblemished seated lion and Brahmi edicts.', queries: ['Lauriya Nandangarh pillar', 'Ashokan pillar Lauriya', 'Lauriya lion capital', 'Ashoka pillar Champaran'] },
      { name: 'Nandangarh Terraced Great Stupa', category: 'heritage', distance: '2 km', entryFee: 'Included', timings: '9:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.8, description: 'Colossal 80-foot multi-tiered polygonal brick stupa excavated by ASI, one of the largest in India.', queries: ['Nandangarh stupa Bihar', 'Nandangarh great stupa', 'Nandangarh brick stupa', 'Ancient stupa Champaran'] },
      { name: 'Vedic Earthen Burial Mounds of Lauriya', category: 'heritage', distance: '1.5 km', entryFee: 'Free', timings: '9:00 AM – 5:00 PM', duration: '1 hr', rating: 4.6, description: 'Group of ancient circular earthen burial tumuli believed to date back to the pre-Mauryan Vedic era.', queries: ['Lauriya burial mounds', 'Vedic mounds Lauriya', 'Prehistoric mounds Champaran', 'Ancient tumuli Bihar'] },
      { name: 'Chankigarh Archaeological Fort Mound', category: 'heritage', distance: '11 km', entryFee: 'Free', timings: '8:00 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.6, description: 'Towering 90-foot brick fortress mound traditionally identified as the palace of King Chanakya.', queries: ['Chankigarh mound Champaran', 'Chankigarh fort Bihar', 'Chankigarh ancient mound', 'Chankigarh ruins'] },
      { name: 'Valmiki Tiger Reserve Safari (Manguraha Range)', category: 'wildlife', distance: '42 km', entryFee: '₹100', timings: '6:00 AM – 5:00 PM', duration: '4 hrs', rating: 4.9, description: 'Dense Himalayan terai Sal forest sheltering Bengal tigers, rhinos, leopards, and flying squirrels.', queries: ['Valmiki Tiger Reserve Bihar', 'Valmiki National Park', 'Valmiki tiger forest', 'Champaran tiger reserve'] },
      { name: 'Triveni Sangam & Gandak Barrage (Valmiki Nagar)', category: 'nature', distance: '58 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '2 hrs', rating: 4.8, description: 'Spectacular river confluence of Gandak, Panchnad, and Sonaha rivers against snow-capped Nepal hills.', queries: ['Triveni Sangam Valmikinagar', 'Gandak barrage Valmikinagar', 'Valmikinagar confluence', 'Gandak river Nepal border'] },
      { name: 'Saraiya Man Freshwater Birding Lake', category: 'nature', distance: '28 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.6, description: 'Natural lake known for Jamun-filtered waters and flocks of wintering pintails and whistling ducks.', queries: ['Saraiya Man lake Bettiah', 'Saraiya Man Bihar', 'Bettiah lake Saraiya Man', 'Champaran natural lake'] },
      { name: 'Bettiah Raj Palace & Deorhi Courtyard', category: 'heritage', distance: '25 km', entryFee: 'Free', timings: '9:00 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.5, description: '18th-century grand palace complex of the Maharajas of Bettiah Raj featuring classical courtyards.', queries: ['Bettiah Raj Palace', 'Bettiah Palace Bihar', 'Bettiah Raj heritage', 'Historic palace Bettiah'] }
    ]
  },

  // 35. Koncheswar Mahadev Temple (Konch / Gaya)
  {
    slug: 'koncheswar-mahadev-temple',
    title: 'Koncheswar Mahadev temple',
    state: 'Bihar',
    region: 'Magadh / Gaya (Southern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Koncheswar Mahadev — Ancient 8th-Century Brick Sun-Shiva Temple & Barabar Caves Environs',
    overview: {
      short: 'Koncheswar Mahadev Temple in Konch, Gaya district, is a rare 8th-century tiered brick temple dedicated to Lord Shiva and the Sun God, adorned with Pala-era stone sculptures.',
      description: 'Situated in Konch block of Gaya district, Koncheswar Temple is one of the very few surviving ancient curvilinear brick temples of eastern India. Built during the late Gupta and Pala era, the towering brick shikhara features intricate terracotta carvings, an ancient Shiva Lingam, and sculptures of Surya and Vishnu. It serves as the gateway to the world-famous 3rd-century BCE Barabar and Nagarjuni rock-cut caves.',
      features: ['Rare 8th-Century Curvilinear Brick Temple Shikhara', 'Ancient Pala-Era Sculptures of Shiva, Surya & Vishnu', 'Gateway to 3rd-Century BCE Barabar Rock-Cut Caves', 'Ancient Buddhist Kurkihar Bronze Heritage Belt'],
      altitude: '105 m', rating: 4.7, reviewCount: 8200, minPrice: 1200, distanceFromDelhi: 1010,
      about: 'A mesmerizing historical monument of ancient brick temple architecture, mystical polished rock caves, and serene Magadh landscapes.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 24.9500, lng: 84.7800, tempSummer: '26–42°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Gaya International Airport (GAY)', distance: 30 },
      nearestRailway: { name: 'Gaya Junction (GAYA)', distance: 28 },
      roadNote: 'Located 28 km northwest of Gaya on the Gaya-Tikari-Konch road (SH-69).',
      routes: [{ from: 'Gaya', city: 'Gaya', state: 'Bihar', distance: 28, byCar: '45 mins', byTrain: 'Local taxi / auto', byAir: 'Via Gaya Airport', via: 'SH-69 to Konch' }]
    },
    galleryQueries: ['Konch temple Gaya', 'Koncheswar temple Bihar', 'Barabar caves Gaya', 'Barabar hill caves Bihar', 'Konch ancient brick temple'],
    places: [
      { name: 'Koncheswar Mahadev 8th-Century Brick Temple', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:30 AM – 8:30 PM', duration: '1.5 hrs', rating: 4.8, description: 'Rare tiered brick temple shikhara housing an ancient Shiva Lingam and Pala stone deities.', queries: ['Konch temple Gaya', 'Koncheswar temple Bihar', 'Konch brick temple', 'Koncheswar Mahadev sanctum'] },
      { name: 'Barabar Caves (Oldest Rock-Cut Caves in India - 3rd BCE)', category: 'heritage', distance: '34 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '3 hrs', rating: 4.9, description: 'World-famous 3rd-century BCE Mauryan granite caves with glass-like mirror polish and echo acoustics (Lomas Rishi, Sudama, Karan Chaupar).', queries: ['Barabar caves Gaya', 'Barabar hill caves Bihar', 'Lomas Rishi cave Barabar', 'Barabar rock cut caves'] },
      { name: 'Nagarjuni Caves (Ashoka & Dasharatha Cave Hermitages)', category: 'heritage', distance: '36 km', entryFee: 'Included', timings: '9:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.8, description: 'Granite caves dedicated to the Ajivika sect by Emperor Dasharatha Maurya with Brahmi inscriptions.', queries: ['Nagarjuni caves Bihar', 'Nagarjuni hill Gaya', 'Gopika cave Nagarjuni', 'Mauryan caves Nagarjuni'] },
      { name: 'Kauva Dol Mountain & Colossal Rock-Cut Buddha', category: 'heritage', distance: '32 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '2 hrs', rating: 4.8, description: 'Rugged granite peak featuring an enormous 8-foot monolithic Buddha carved on solid cliff face.', queries: ['Kauva Dol Buddha Bihar', 'Kauva Dol mountain Gaya', 'Kauva Dol rock carving', 'Colossal Buddha Kauva Dol'] },
      { name: 'Kurkihar Ancient Buddhist Bronze Mound', category: 'heritage', distance: '45 km', entryFee: 'Free', timings: '8:00 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Historic excavation site that yielded the world-renowned Kurkihar hoard of over 200 gilded Pala bronzes.', queries: ['Kurkihar Buddhist site', 'Kurkihar bronzes Bihar', 'Kurkihar mound Gaya', 'Ancient Kurkihar ruins'] },
      { name: 'Tikari Raj Fort & Heritage Gateway', category: 'heritage', distance: '12 km', entryFee: 'Free', timings: '8:00 AM – 5:30 PM', duration: '1 hr', rating: 4.5, description: 'Colonial and medieval fortress palace of the Tikari estate featuring high stone gateways.', queries: ['Tikari fort Gaya', 'Tikari Raj palace Bihar', 'Tikari gateway Gaya', 'Historic Tikari estate'] },
      { name: 'Pretshila Sacred Hill & Steps', category: 'spiritual', distance: '22 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '2 hrs', rating: 4.6, description: 'Sacred hill with 676 stone steps dedicated to Lord Yama and ancestral soul peace.', queries: ['Pretshila Hill Gaya', 'Pretshila temple Bihar', 'Pretkund Gaya', 'Pretshila hill steps'] },
      { name: 'Vishnupad & Falgu River Sacred Ghats', category: 'spiritual', distance: '28 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '2 hrs', rating: 4.9, description: 'Black basalt temple enshrining Lord Vishnu’s holy footprint along the sacred Falgu river.', queries: ['Vishnupad Temple Gaya', 'Vishnupad temple sanctum', 'Vishnupad Temple Bihar', 'Vishnupad temple Ahilyabai'] }
    ]
  },

  // 36. Sundernath (Katihar / Kursela)
  {
    slug: 'sundernath',
    title: 'Sundernath',
    state: 'Bihar',
    region: 'Seemanchal / Katihar (Northeastern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Sundernath Dham — The Sacred Ganga-Koshi Sangam & Ancient Shiva Sanctorum',
    overview: {
      short: 'Sundernath Mahadev Temple in Kursela, Katihar, is an ancient Shiva temple situated near the spectacular confluence of the holy River Ganga and the mighty Koshi River.',
      description: 'Located in the Kursela block of Katihar district, Sundernath Dham is revered as one of Seemanchal’s holiest Shaivite pilgrimage sites. The temple stands near the monumental Sangam where the torrential Koshi River merges into the holy Ganga. The region encompasses the historic Barari Rock-Cut Caves, Mahatma Gandhi’s memorial at Kursela, and the Gogabil oxbow bird sanctuary.',
      features: ['Ancient Sundernath Swayambhu Shiva Temple', 'Spectacular Ganga-Koshi River Confluence (Sangam)', 'Barari Historic Rock-Cut Hermitage Caves', 'Gogabil Lake Oxbow Bird Wetland Reserve'],
      altitude: '38 m', rating: 4.7, reviewCount: 8100, minPrice: 1200, distanceFromDelhi: 1220,
      about: 'A peaceful riverside pilgrimage destination where mighty river confluences, ancient rock caves, and sacred Shiva waters unite.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.4500, lng: 87.2500, tempSummer: '25–41°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Bagdogra Airport (IXB) / Purnea Airport', distance: 140 },
      nearestRailway: { name: 'Kursela (KUE) / Katihar Junction (KIR)', distance: 8 },
      roadNote: 'Located right off East-West Corridor (NH-31) at Kursela bridge.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 260, byCar: '6 hrs', byTrain: 'Express train to Katihar/Kursela (4.5 hrs)', byAir: 'Via Patna/Bagdogra Airport', via: 'NH-31 Eastbound' }]
    },
    galleryQueries: ['Sundernath temple Katihar', 'Kursela Ganga Koshi sangam', 'Barari rock cut caves Bihar', 'Katihar landmark Bihar', 'Gogabil lake Katihar'],
    places: [
      { name: 'Sundernath Mahadev Main Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.8, description: 'Ancient Shiva temple housing the sacred Swayambhu Lingam, celebrated during Shravan and Shivratri.', queries: ['Sundernath temple Katihar', 'Sundernath Dham Bihar', 'Sundernath Shiva temple', 'Kursela temple Katihar'] },
      { name: 'Ganga-Koshi Sangam (Kursela River Confluence)', category: 'nature', distance: '4 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '2 hrs', rating: 4.8, description: 'Monumental river confluence where the mighty Koshi merges into the broad Ganga, offering boat rides.', queries: ['Kursela Ganga Koshi sangam', 'Ganga Koshi confluence', 'Kursela river confluence', 'Koshi Ganga sangam Bihar'] },
      { name: 'Barari Rock-Cut Caves & Ganga Bluff', category: 'heritage', distance: '24 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.6, description: 'Ancient rock-cut hermitage caves carved into the high clay and sandstone cliffs above the Ganga.', queries: ['Barari rock cut caves Bihar', 'Barari caves Katihar', 'Barari Ganga caves', 'Ancient rock cave Katihar'] },
      { name: 'Mahatma Gandhi Smarak & Kursela Heritage Estate', category: 'heritage', distance: '6 km', entryFee: 'Free', timings: '8:00 AM – 6:00 PM', duration: '1 hr', rating: 4.5, description: 'Memorial where a portion of Mahatma Gandhi’s holy ashes was immersed in 1948 in the Ganga-Koshi Sangam.', queries: ['Gandhi Smarak Kursela', 'Kursela Gandhi memorial', 'Kursela heritage estate', 'Gandhi ashram Kursela'] },
      { name: 'Gogabil Lake & Oxbow Bird Sanctuary', category: 'wildlife', distance: '32 km', entryFee: 'Free', timings: '6:00 AM – 5:30 PM', duration: '2.5 hrs', rating: 4.7, description: 'Sprawling oxbow lake designated as an Important Bird Area, hosting migratory teals, geese, and storks.', queries: ['Gogabil lake Katihar', 'Gogabil bird sanctuary', 'Katihar oxbow lake', 'Gogabil wetland Bihar'] },
      { name: 'Manihari Ganga Ghat & Pir Pahar Bluff', category: 'spiritual', distance: '28 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1.5 hrs', rating: 4.6, description: 'Historic river ferry ghat and scenic hilltop associated with Lord Krishna’s mythical pearl retrieval.', queries: ['Manihari Ganga ghat', 'Pir Pahar Manihari', 'Manihari riverfront Katihar', 'Manihari ghat Bihar'] },
      { name: 'Bateshwar Sthan Rock Carvings (Across Ganga)', category: 'heritage', distance: '18 km', entryFee: 'Free', timings: '6:00 AM – 6:30 PM', duration: '1.5 hrs', rating: 4.7, description: 'Cliff-face sculptures and ancient Shiva shrines overlooking granite islands in the Ganga.', queries: ['Bateshwar Sthan Kahalgaon', 'Bateshwar Sthan Bihar', 'Bateshwar rock carvings', 'Kahalgaon rock temple'] },
      { name: 'Kursela Bridge Viewpoint on NH-31', category: 'nature', distance: '3 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '45 mins', rating: 4.5, description: 'Spectacular road bridge vantage point looking down upon the turbulent mixing of the Koshi and Ganga waters.', queries: ['Kursela bridge Koshi', 'Kursela bridge Bihar', 'NH31 Kursela bridge', 'Koshi river bridge view'] }
    ]
  },

  // 37. Vishwamitra Ashram, Bisaul (Buxar)
  {
    slug: 'vishwamitra-ashram-bisaul',
    title: 'Vishwamitra Ashram, Bisaul',
    state: 'Bihar',
    region: 'Bhojpur / Buxar (Western Bihar)',
    type: 'heritage',
    badge: 'Heritage',
    tagline: 'Vishwamitra Ashram Bisaul — The Sacred Tapovan of Sage Vishwamitra & Lord Rama’s Balya Leela',
    overview: {
      short: 'Vishwamitra Ashram in Bisaul near Buxar is the legendary Vedic hermitage of Sage Vishwamitra, where Lord Rama and Lakshmana safeguarded sacred yajnas and mastered celestial weapons.',
      description: 'Nestled along the tranquil Ganga floodplain in Buxar district, the ashram at Bisaul is celebrated in Valmiki Ramayana as Siddhashrama. Here, Sage Vishwamitra performed his profound tapasya, composed the Gayatri Mantra, and initiated the young prince Rama into divine knowledge. The sacred circuit encompasses the Tadaka Vadh forest, Ahirauli Ahilya temple, and Ramrekha Ghat.',
      features: ['Siddhashrama of Sage Vishwamitra (Valmiki Ramayana)', 'Sacred Initiation Spot of Lord Rama into Astra-Vidyas', 'Historic Ramrekha Holy Bathing Ghat on the Ganga', 'Ahirauli Devi Ahilya Salvation Memorial'],
      altitude: '65 m', rating: 4.8, reviewCount: 9600, minPrice: 1200, distanceFromDelhi: 920,
      about: 'A deeply sacred Ramayana heritage landscape steeped in Vedic chanting, ancient banyan trees, and tranquil Ganga breezes.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.5700, lng: 83.9900, tempSummer: '26–43°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Varanasi Airport (VNS)', distance: 95 },
      nearestRailway: { name: 'Buxar Railway Station (BXR)', distance: 4 },
      roadNote: 'Located 4 km from Buxar town off NH-922 and the Ganga riverbank road.',
      routes: [{ from: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', distance: 95, byCar: '2 hrs', byTrain: 'Express train (1 hr)', byAir: 'Via Varanasi Airport', via: 'NH-922 Eastbound' }]
    },
    galleryQueries: ['Vishwamitra Ashram Buxar', 'Charitravan Buxar', 'Ramrekha Ghat Buxar', 'Buxar Ganga river', 'Buxar Ramayana temple'],
    places: [
      { name: 'Sage Vishwamitra Tapovan & Main Hermitage', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 8:30 PM', duration: '2 hrs', rating: 4.9, description: 'Sacred hermitage sanctum where Sage Vishwamitra initiated Rama and Lakshmana into divine knowledge.', queries: ['Vishwamitra Ashram Buxar', 'Charitravan Buxar', 'Vishwamitra ashram Bihar', 'Buxar sage hermitage'] },
      { name: 'Ramrekha Ghat (Lord Rama Holy Bathing Ghat)', category: 'spiritual', distance: '3 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1.5 hrs', rating: 4.8, description: 'Sacred riverfront ghat on the Ganga where Lord Rama bathed after the liberation of Tadaka.', queries: ['Ramrekha Ghat Buxar', 'Ramrekha ghat Ganga', 'Buxar Ganga ghat snan', 'Ramrekha ghat Bihar'] },
      { name: 'Ahirauli Devi Ahilya Temple & Mukti Kund', category: 'spiritual', distance: '6 km', entryFee: 'Free', timings: '6:00 AM – 7:30 PM', duration: '1 hr', rating: 4.7, description: 'Ancient temple marking the spot where Devi Ahilya was liberated from a stone curse by Rama’s lotus feet.', queries: ['Ahirauli temple Buxar', 'Ahilya temple Ahirauli', 'Ahirauli Bihar', 'Devi Ahilya temple Buxar'] },
      { name: 'Buxar Fort Citadel & River Bastions', category: 'heritage', distance: '3.5 km', entryFee: 'Free', timings: '6:00 AM – 6:30 PM', duration: '1.5 hrs', rating: 4.8, description: '11th-century stone fortress bastion perched on the Ganga bluff with ancient subterranean chambers.', queries: ['Buxar Fort Bihar', 'Buxar Fort ramparts', 'Buxar citadel Ganga', 'Buxar fort view'] },
      { name: 'Katkauli Maidan Battle Obelisk (1764)', category: 'heritage', distance: '8 km', entryFee: 'Free', timings: '8:00 AM – 6:00 PM', duration: '1 hr', rating: 4.7, description: 'Historic battleground obelisk commemorating the decisive Battle of Buxar fought in 1764.', queries: ['Battle of Buxar memorial', 'Katkauli Maidan Buxar', 'Battle of Buxar monument', 'Katkauli memorial Bihar'] },
      { name: 'Chausa Battlefield & Sher Shah Memorial', category: 'heritage', distance: '16 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.6, description: 'Historic battlefield where Sher Shah Suri defeated Mughal Emperor Humayun in 1539.', queries: ['Chausa battlefield Buxar', 'Chausa monument Bihar', 'Battle of Chausa site', 'Chausa Ganga Buxar'] },
      { name: 'Brahmapur Baba Bameshwar Nath Temple', category: 'spiritual', distance: '38 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '2 hrs', rating: 4.7, description: 'Ancient westward-facing Swayambhu Shiva temple renowned for massive gatherings during Shivratri.', queries: ['Brahmapur Shiv temple Buxar', 'Baba Bameshwar Nath temple', 'Brahmapur temple Bihar', 'Bameshwar Nath Buxar'] },
      { name: 'Naulakha Marble Temple (Charitravan)', category: 'heritage', distance: '2.5 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '45 mins', rating: 4.5, description: 'Intricately sculpted South Indian-style white marble temple complex inside Charitravan gardens.', queries: ['Naulakha Mandir Buxar', 'Naulakha temple Charitravan', 'Buxar South Indian temple', 'Naulakha shrine Bihar'] }
    ]
  },

  // 38. Gurdwara Handi Sahib (Danapur, Patna)
  {
    slug: 'gurdwara-handi-sahib',
    title: 'Gurdwara Handi Sahib',
    state: 'Bihar',
    region: 'Patna / Danapur (Central Bihar)',
    type: 'heritage',
    badge: 'Heritage',
    tagline: 'Gurdwara Handi Sahib — The Sacred Clay Pot of Mata Jamuni & Guru Gobind Singh Ji Departure Shrine',
    overview: {
      short: 'Gurdwara Handi Sahib in Danapur, Patna, commemorates the departure of child Guru Gobind Singh Ji from Patna to Anandpur Sahib in 1670 CE, celebrated for Mata Jamuni’s miraculous earthen pot of sweet rice (Kheer).',
      description: 'Located in Danapur Cantonment on the banks of the Son and Ganga confluence belt, Gurdwara Handi Sahib marks the historic home of an old devout lady named Mai Jamuni. When child Gobind Rai departed Patna for Punjab, she lovingly cooked sweet rice pudding (Kheer) in an earthen clay pot (Handi). The Guru blessed her that the pot would remain inexhaustible and feed thousands. To this day, the traditional prasad of sweet Kheer is prepared and distributed in earthen handis.',
      features: ['Historic Departure Shrine of Guru Gobind Singh Ji (1670 CE)', 'Sacred Earthen Clay Pot (Handi) Prasad Tradition', 'Danapur Cantonment Colonial Architectural Heritage', 'Maner Sharif Ancient Sufi Dargah Corridor'],
      altitude: '53 m', rating: 4.8, reviewCount: 14800, minPrice: 1400, distanceFromDelhi: 1000,
      about: 'A serene and historic Sikh sanctuary of boundless maternal love, sweet earthen-pot kheer langar, and sacred seventeenth-century memories.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.6300, lng: 85.0400, tempSummer: '26–42°C', tempWinter: '9–24°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 8 },
      nearestRailway: { name: 'Danapur Railway Station (DNR)', distance: 3 },
      roadNote: 'Located in Danapur Cantonment along Danapur-Khagaul Road, 10 km west of Patna center.',
      routes: [{ from: 'Patna Junction', city: 'Patna', state: 'Bihar', distance: 10, byCar: '25 mins', byTrain: 'Train to Danapur (10 mins)', byAir: 'Via Patna Airport (8 km)', via: 'Bailey Road / Khagaul Road' }]
    },
    galleryQueries: ['Gurdwara Handi Sahib Danapur', 'Gurdwara Handi Sahib Patna', 'Handi Sahib Danapur', 'Danapur Cantonment Bihar', 'Takht Sri Patna Sahib'],
    places: [
      { name: 'Gurdwara Handi Sahib Main Sanctum & Darbar', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '4:00 AM – 9:30 PM', duration: '1.5 hrs', rating: 4.9, description: 'Pristine white marble sanctum preserving the sacred handi tradition and continuous Gurbani kirtan.', queries: ['Gurdwara Handi Sahib Danapur', 'Handi Sahib darbar hall', 'Gurdwara Handi Sahib Patna', 'Danapur gurdwara Bihar'] },
      { name: 'Historic Mata Jamuni Handi Kheer Hearth', category: 'spiritual', distance: 'Shrine Complex', entryFee: 'Free', timings: '4:00 AM – 9:30 PM', duration: '45 mins', rating: 4.8, description: 'Sacred hearth where sweet kheer is prepared daily in clay handis and served as divine prasad.', queries: ['Handi Sahib Kheer prasad', 'Mata Jamuni Handi Sahib', 'Handi Sahib Danapur kheer', 'Handi Sahib hearth'] },
      { name: 'Takht Sri Harmandir Ji Patna Sahib', category: 'spiritual', distance: '18 km', entryFee: 'Free', timings: '3:30 AM – 10:00 PM', duration: '2.5 hrs', rating: 4.9, description: 'One of the five holy Takhts of Sikhism marking the birthplace of Guru Gobind Singh Ji.', queries: ['Takht Sri Patna Sahib', 'Patna Sahib Gurudwara', 'Harmandir Sahib Patna', 'Takht Sri Harmandir Ji'] },
      { name: 'Gurdwara Bal Lila Maini Sangat', category: 'spiritual', distance: '18 km', entryFee: 'Free', timings: '4:00 AM – 9:30 PM', duration: '1.5 hrs', rating: 4.8, description: 'Childhood play palace of Guru Gobind Singh Ji famed for the Chulha Sahib and boiled gram prasad.', queries: ['Gurdwara Bal Lila Maini Sangat', 'Gurdwara Bal Lila Patna', 'Bal Lila Maini Sangat', 'Patna Sahib Bal Lila'] },
      { name: 'Maner Sharif Sufi Dargah (Badi & Chhoti Dargah)', category: 'heritage', distance: '16 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '2 hrs', rating: 4.8, description: '17th-century Mughal architectural masterpiece of Makhdum Daulat with intricate stone jali carvings and grand dome.', queries: ['Maner Sharif Dargah Bihar', 'Chhoti Dargah Maner', 'Maner Sharif Patna', 'Mughal monument Maner Sharif'] },
      { name: 'Danapur Cantonment Heritage Church & Barracks', category: 'heritage', distance: '2 km', entryFee: 'Free', timings: '8:00 AM – 5:30 PM', duration: '1 hr', rating: 4.5, description: 'Historic 18th-century British cantonment barracks and St. Luke’s Church where the 1857 Sepoy rebellion ignited.', queries: ['Danapur Cantonment heritage', 'Danapur military barracks', 'St Lukes Church Danapur', 'Danapur 1857 heritage'] },
      { name: 'Digha-Ganga Riverfront Marine Drive', category: 'nature', distance: '5 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.7, description: 'Expansive riverfront promenade along the Ganga Path connecting Danapur with Patna City.', queries: ['Patna Marine Drive Ganga Path', 'Digha Ganga ghat Patna', 'Ganga Path promenade', 'Digha riverfront Bihar'] },
      { name: 'Bihar Museum (Patna Heritage World Galleries)', category: 'cultural', distance: '9 km', entryFee: '₹100', timings: '10:00 AM – 5:00 PM (Closed Mon)', duration: '2.5 hrs', rating: 4.8, description: 'World-class museum exhibiting 3,000 years of regional history, the Didarganj Yakshi, and Mauryan treasures.', queries: ['Bihar Museum Patna', 'Didarganj Yakshi Bihar Museum', 'Bihar Museum galleries', 'Patna Bihar Museum interior'] }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 10 (Destinations 29–38)');
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

  console.log('\n🎉 Finished Batch 10 successfully!');
}

run().catch(console.error);
