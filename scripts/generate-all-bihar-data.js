const fs = require('fs');
const path = require('path');

// Master Dataset of all 38 Bihar Destinations
const ALL_BIHAR_DESTINATIONS = [
  // 1. Bodh Gaya
  {
    slug: 'bodh-gaya',
    title: 'Bodh Gaya',
    state: 'Bihar',
    region: 'Magadh (Southern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Bodh Gaya — The Cradle of Enlightenment & UNESCO Mahabodhi Sanctuary',
    overview: {
      short: 'Bodh Gaya is the holiest Buddhist pilgrimage site on Earth, where Prince Siddhartha Gautama attained supreme enlightenment beneath the sacred Bodhi Tree in 534 BCE.',
      description: 'Situated on the banks of the sacred Falgu River in Gaya district, Bodh Gaya is the epicenter of the Buddhist world. Anchored by the 55-meter-high Mahabodhi Temple, a UNESCO World Heritage site, the sanctuary houses the diamond throne (Vajrasana) and direct descendant of the legendary Bodhi Tree.',
      features: ['Mahabodhi Temple Complex (UNESCO)', 'Sacred Bodhi Tree & Vajrasana Throne', '80-Foot Giant Great Buddha Statue', 'International Monasteries of 12 Nations'],
      altitude: '113 m', rating: 4.9, reviewCount: 42000, minPrice: 1500, distanceFromDelhi: 1040,
      about: 'A transformative spiritual sanctuary where ancient stupas, butter lamps, and international architecture converge.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 24.6951, lng: 84.9913, tempSummer: '26–42°C', tempWinter: '8–24°C' },
    howToReach: {
      nearestAirport: { name: 'Gaya International Airport (GAY)', distance: 10 },
      nearestRailway: { name: 'Gaya Junction (GAYA)', distance: 16 },
      roadNote: 'Connected via Grand Trunk Road (NH-19) and NH-22 from Gaya and Patna (110 km).',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 110, byCar: '2.5 hrs', byTrain: 'Express (1.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-22 Southbound' }]
    },
    galleryQueries: ['Mahabodhi Temple Bodh Gaya', 'Bodhi Tree Bodh Gaya', 'Great Buddha statue Bodh Gaya', 'Thai Monastery Bodh Gaya', 'Bodh Gaya Buddhist temple'],
    places: [
      { name: 'Mahabodhi Temple Complex (UNESCO Heritage)', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '3 hrs', rating: 4.9, description: '55-meter grand temple sanctum marking the spot where Lord Buddha attained enlightenment.', queries: ['Mahabodhi Temple Bodh Gaya', 'Mahabodhi Temple', 'Mahabodhi temple sanctum', 'Bodh Gaya temple stupa'] },
      { name: 'Sacred Bodhi Tree & Vajrasana Throne', category: 'spiritual', distance: 'Temple Complex', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1 hr', rating: 4.9, description: 'Descendant of the original tree under which Buddha sat, with Ashoka’s Diamond Throne.', queries: ['Bodhi Tree Bodh Gaya', 'Bodhi Tree Mahabodhi', 'Vajrasana Bodh Gaya', 'Bodhi Tree shrine'] },
      { name: 'Great Buddha Statue (Daibutsu)', category: 'cultural', distance: '1.2 km', entryFee: 'Free', timings: '7:00 AM – 6:00 PM', duration: '45 mins', rating: 4.8, description: 'Colossal 80-foot red granite and sandstone seated Buddha statue unveiled in 1989.', queries: ['Great Buddha statue Bodh Gaya', '80 feet Buddha Bodh Gaya', 'Great Buddha Daibutsu Bodh Gaya', 'Buddha statue Gaya'] },
      { name: 'Royal Bhutanese Monastery', category: 'heritage', distance: '800 m', entryFee: 'Free', timings: '7:00 AM – 7:00 PM', duration: '45 mins', rating: 4.7, description: 'Ornately painted traditional Dzong-style monastery with intricate Himalayan reliefs.', queries: ['Bhutan Monastery Bodh Gaya', 'Bhutanese temple Bodh Gaya', 'Royal Bhutan monastery Bihar', 'Bhutanese Buddhist monastery'] },
      { name: 'Wat Thai Bodh Gaya (Royal Thai Temple)', category: 'heritage', distance: '900 m', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '45 mins', rating: 4.7, description: 'Magnificent Thai monastery built in 1957 by the King of Thailand with sloping golden roofs.', queries: ['Thai Monastery Bodh Gaya', 'Wat Thai Bodh Gaya', 'Thai Temple Bodh Gaya', 'Thai Buddhist temple Gaya'] },
      { name: 'Dungeshwari Cave Temples (Mahakala Caves)', category: 'spiritual', distance: '12 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '2.5 hrs', rating: 4.7, description: 'Holy cave hermitage on Pragbodhi Hill where Siddhartha underwent six years of penance.', queries: ['Dungeshwari Cave', 'Mahakala Caves Bodh Gaya', 'Dungeshwari temple Gaya', 'Pragbodhi hill caves'] },
      { name: 'Metta Buddharam Temple & Butter Lamp Pavilion', category: 'spiritual', distance: '1.5 km', entryFee: 'Free', timings: '7:00 AM – 6:30 PM', duration: '45 mins', rating: 4.8, description: 'Stainless-steel and white marble Thai temple complex featuring evening meditation ceremonies.', queries: ['Metta Buddharam Temple', 'Metta Buddharam Bodh Gaya', 'White temple Bodh Gaya', 'Buddharam monastery Gaya'] },
      { name: 'Archaeological Museum Bodh Gaya', category: 'cultural', distance: '400 m', entryFee: '₹10', timings: '10:00 AM – 5:00 PM (Closed Fri)', duration: '1.5 hrs', rating: 4.6, description: 'Museum displaying 1st-century BCE Sunga railings, Yaksha sculptures, and bronze antiquities.', queries: ['Archaeological Museum Bodh Gaya', 'Bodh Gaya ASI museum', 'Bodh Gaya sculpture museum', 'Ancient Buddhist museum Bihar'] }
    ]
  },

  // 2. Nalanda
  {
    slug: 'nalanda',
    title: 'Nalanda',
    state: 'Bihar',
    region: 'Magadh (Southern Bihar)',
    type: 'heritage',
    badge: 'Heritage',
    tagline: 'Nalanda — The World’s Greatest Ancient University & UNESCO Mahavihara',
    overview: {
      short: 'Nalanda Mahavihara is an iconic UNESCO World Heritage site and the most revered ancient residential university in history, flourishing from the 5th to the 12th century CE.',
      description: 'Located 90 kilometers southeast of Patna, Nalanda was the ancient world’s pinnacle of higher learning, attracting scholars from across Asia. The monumental red-brick complex spanned vast residential monasteries, multi-tiered stupas, and ancient meditation halls.',
      features: ['Nalanda University Ruins (UNESCO)', 'Sariputta Stupa Monolith (Site 3)', 'Xuanzang Memorial Hall', 'Pawapuri Jal Mandir (Jain Nirvana)'],
      altitude: '67 m', rating: 4.8, reviewCount: 28000, minPrice: 1400, distanceFromDelhi: 1020,
      about: 'A historic center of learning where brick courtyards, lecture halls, and world-class museums narrate over 800 years of academic mastery.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.1357, lng: 85.4439, tempSummer: '25–41°C', tempWinter: '9–24°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 85 },
      nearestRailway: { name: 'Rajgir / Nalanda Railway Station', distance: 12 },
      roadNote: 'Connected via NH-120 from Patna (85 km) and Rajgir (15 km).',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 85, byCar: '2 hrs', byTrain: 'Express (1.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-120 / Bakhtiyarpur Hwy' }]
    },
    galleryQueries: ['Nalanda University ruins', 'Nalanda Mahavihara stupa', 'Nalanda archaeological ruins', 'Xuanzang Memorial Hall Nalanda', 'Nalanda site 3 stupa'],
    places: [
      { name: 'Nalanda Mahavihara Archaeological Ruins (UNESCO)', category: 'heritage', distance: 'Centre', entryFee: '₹40', timings: '9:00 AM – 5:00 PM', duration: '3 hrs', rating: 4.9, description: 'Vast red-brick excavation complex featuring 11 monasteries and 6 ancient temples.', queries: ['Nalanda University ruins', 'Nalanda Mahavihara', 'Nalanda ruins Bihar', 'Nalanda archaeological site'] },
      { name: 'Great Stupa of Sariputta (Temple Site 3)', category: 'heritage', distance: 'Ruins Complex', entryFee: 'Included', timings: '9:00 AM – 5:00 PM', duration: '1 hr', rating: 4.9, description: 'Towering brick monument built over relics of Sariputta with 6th-century stucco panels.', queries: ['Nalanda site 3 stupa', 'Sariputta Stupa Nalanda', 'Nalanda Stupa temple 3', 'Nalanda brick stupa'] },
      { name: 'Xuanzang (Hiuen Tsang) Memorial Hall', category: 'heritage', distance: '1.5 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.8, description: 'Grand Indo-Chinese pavilion commemorating Chinese pilgrim-scholar Xuanzang.', queries: ['Xuanzang Memorial Hall Nalanda', 'Hiuen Tsang Memorial Nalanda', 'Xuanzang Hall Bihar', 'Hiuen Tsang museum Nalanda'] },
      { name: 'Nalanda Archaeological Museum', category: 'cultural', distance: '300 m', entryFee: '₹5', timings: '10:00 AM – 5:00 PM (Closed Fri)', duration: '1.5 hrs', rating: 4.7, description: 'Museum displaying over 13,000 excavated antiquities including Pala bronzes and terracotta seals.', queries: ['Nalanda Archaeological Museum', 'Nalanda Museum antiquities', 'Nalanda bronze gallery', 'Pala sculpture Nalanda museum'] },
      { name: 'Kundalpur Digambar Jain Temple', category: 'spiritual', distance: '4 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '1 hr', rating: 4.7, description: 'Revered Jain pilgrimage shrine believed to be the birthplace of Lord Mahavira.', queries: ['Kundalpur Nalanda', 'Kundalpur Jain temple Bihar', 'Kundalpur Digambar temple', 'Kundalpur Mahavira shrine'] },
      { name: 'Pawapuri Jal Mandir (Lotus Pond Shrine)', category: 'spiritual', distance: '18 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '2 hrs', rating: 4.9, description: 'White marble temple in the center of a lotus tank, marking Mahavira’s Nirvana spot.', queries: ['Pawapuri Jal Mandir', 'Pawapuri temple Bihar', 'Jal Mandir Pawapuri', 'Pawapuri lotus lake temple'] },
      { name: 'Surya Mandir (Sun Temple of Surajpur Baragaon)', category: 'spiritual', distance: '2.5 km', entryFee: 'Free', timings: '5:30 AM – 8:30 PM', duration: '1 hr', rating: 4.6, description: 'Historic Sun temple on the banks of Surajpur lake, hosting massive Chhath celebrations.', queries: ['Surya Mandir Surajpur Nalanda', 'Baragaon Sun Temple Nalanda', 'Surajpur lake temple Bihar', 'Sun temple Nalanda'] },
      { name: 'Ghora Katora Eco Lake & Buddha Monolith', category: 'nature', distance: '16 km', entryFee: '₹20', timings: '7:00 AM – 5:30 PM', duration: '2 hrs', rating: 4.8, description: 'Pristine lake between five scenic hills with a 70-foot pink sandstone statue of Buddha.', queries: ['Ghora Katora Lake', 'Ghora Katora Buddha statue', 'Ghora Katora Rajgir Nalanda', 'Ghora Katora eco lake'] }
    ]
  }
];

fs.writeFileSync('scripts/bihar-all-data.json', JSON.stringify(ALL_BIHAR_DESTINATIONS, null, 2));
console.log('Saved master Bihar dataset skeleton');
