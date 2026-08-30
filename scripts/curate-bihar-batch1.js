const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
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
      description: 'Situated on the banks of the sacred Falgu (Neranjara) River in Gaya district, Bodh Gaya is the epicenter of the Buddhist world. Anchored by the 55-meter-high Mahabodhi Temple, a UNESCO World Heritage site constructed originally by Emperor Ashoka in the 3rd century BCE, the sacred sanctuary houses the diamond throne (Vajrasana) and direct descendant of the legendary Bodhi Tree. Pilgrims and travelers from across the globe gather here amid serene monasteries constructed by Buddhist nations worldwide, including Thailand, Bhutan, Japan, Sri Lanka, and Tibet.',
      features: ['Mahabodhi Temple Complex (UNESCO)', 'Sacred Bodhi Tree & Vajrasana Throne', '80-Foot Giant Great Buddha Statue', 'International Monasteries of 12 Nations'],
      altitude: '113 m',
      rating: 4.9,
      reviewCount: 42000,
      minPrice: 1500,
      distanceFromDelhi: 1040,
      about: 'A transformative spiritual sanctuary where ancient stupas, butter lamps, chanting monks, and international architecture converge to create one of the most serene sacred landscapes on the planet.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 24.6951, lng: 84.9913, tempSummer: '26–42°C', tempWinter: '8–24°C' },
    howToReach: {
      nearestAirport: { name: 'Gaya International Airport (GAY)', distance: 10 },
      nearestRailway: { name: 'Gaya Junction (GAYA)', distance: 16 },
      roadNote: 'Conveniently connected via Grand Trunk Road (NH-19) and NH-22 from Gaya, Patna (110 km), and Varanasi (250 km).',
      routes: [
        { from: 'Patna', city: 'Patna', state: 'Bihar', distance: 110, byCar: '2.5 hrs', byTrain: 'Express / Vande Bharat (1.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-22 Southbound' },
        { from: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', distance: 250, byCar: '4.5 hrs', byTrain: 'Vande Bharat / Doon Exp (3 hrs)', byAir: 'Direct train / car', via: 'NH-19 (Grand Trunk Road)' },
        { from: 'Kolkata', city: 'Kolkata', state: 'West Bengal', distance: 480, byCar: '8.5 hrs', byTrain: 'Rajdhani / Poorva Exp (6 hrs)', byAir: 'Fly CCU to GAY', via: 'NH-19 Westbound' }
      ]
    },
    galleryQueries: ['Mahabodhi Temple Bodh Gaya', 'Bodhi Tree Bodh Gaya', 'Great Buddha statue Bodh Gaya', 'Thai Monastery Bodh Gaya', 'Bodh Gaya Buddhist temple'],
    places: [
      {
        name: 'Mahabodhi Temple Complex (UNESCO Heritage)',
        category: 'spiritual',
        distance: 'Centre',
        entryFee: 'Free (Camera ₹100)',
        timings: '5:00 AM – 9:00 PM',
        duration: '3 hrs',
        rating: 4.9,
        description: 'Iconic 55-meter grand pyramidal temple sanctum marking the spot where Lord Buddha attained enlightenment, housing the gilded statue of Buddha in Bhumisparsha mudra.',
        queries: ['Mahabodhi Temple Bodh Gaya', 'Mahabodhi Temple', 'Mahabodhi temple sanctum', 'Bodh Gaya temple stupa']
      },
      {
        name: 'Sacred Bodhi Tree & Vajrasana Throne',
        category: 'spiritual',
        distance: 'Temple Complex',
        entryFee: 'Free',
        timings: '5:00 AM – 9:00 PM',
        duration: '1 hr',
        rating: 4.9,
        description: 'Venerated fifth-generation descendant of the original Ficus religiosa tree beneath which Buddha sat in meditation, accompanied by Emperor Ashoka’s polished sandstone Diamond Throne.',
        queries: ['Bodhi Tree Bodh Gaya', 'Bodhi Tree Mahabodhi', 'Vajrasana Bodh Gaya', 'Bodhi Tree shrine']
      },
      {
        name: 'Great Buddha Statue (Daibutsu)',
        category: 'cultural',
        distance: '1.2 km',
        entryFee: 'Free',
        timings: '7:00 AM – 12:00 PM, 2:00 PM – 6:00 PM',
        duration: '45 mins',
        rating: 4.8,
        description: 'Colossal 80-foot red granite and sandstone seated Buddha statue unveiled by the 14th Dalai Lama in 1989, encircled by statues of the ten chief disciples.',
        queries: ['Great Buddha statue Bodh Gaya', '80 feet Buddha Bodh Gaya', 'Great Buddha Daibutsu Bodh Gaya', 'Buddha statue Gaya']
      },
      {
        name: 'Royal Bhutanese Monastery',
        category: 'heritage',
        distance: '800 m',
        entryFee: 'Free',
        timings: '7:00 AM – 7:00 PM',
        duration: '45 mins',
        rating: 4.7,
        description: 'Ornately painted traditional Dzong-style monastery adorned with intricate Himalayan clay reliefs depicting the life and deeds of Gautama Buddha.',
        queries: ['Bhutan Monastery Bodh Gaya', 'Bhutanese temple Bodh Gaya', 'Royal Bhutan monastery Bihar', 'Bhutanese Buddhist monastery']
      },
      {
        name: 'Wat Thai Bodh Gaya (Royal Thai Temple)',
        category: 'heritage',
        distance: '900 m',
        entryFee: 'Free',
        timings: '6:00 AM – 6:00 PM',
        duration: '45 mins',
        rating: 4.7,
        description: 'Magnificent Thai monastery built in 1957 by King of Thailand, featuring sloping multi-tiered roofs with golden chofas and a massive bronze Buddha image.',
        queries: ['Thai Monastery Bodh Gaya', 'Wat Thai Bodh Gaya', 'Thai Temple Bodh Gaya', 'Thai Buddhist temple Gaya']
      },
      {
        name: 'Dungeshwari Cave Temples (Mahakala Caves)',
        category: 'spiritual',
        distance: '12 km',
        entryFee: 'Free',
        timings: '6:00 AM – 6:00 PM',
        duration: '2.5 hrs',
        rating: 4.7,
        description: 'Holy cave hermitage on Pragbodhi Hill where Siddhartha underwent six years of rigorous penance and asceticism before proceeding to the Bodhi Tree.',
        queries: ['Dungeshwari Cave', 'Mahakala Caves Bodh Gaya', 'Dungeshwari temple Gaya', 'Pragbodhi hill caves']
      },
      {
        name: 'Metta Buddharam Temple & Butter Lamp Pavilion',
        category: 'spiritual',
        distance: '1.5 km',
        entryFee: 'Free',
        timings: '7:00 AM – 6:30 PM',
        duration: '45 mins',
        rating: 4.8,
        description: 'Modern stainless-steel and white marble Thai temple complex featuring thousands of silver mirrors and evening butter lamp meditation ceremonies.',
        queries: ['Metta Buddharam Temple', 'Metta Buddharam Bodh Gaya', 'White temple Bodh Gaya', 'Buddharam monastery Gaya']
      },
      {
        name: 'Archaeological Society of India Museum Bodh Gaya',
        category: 'cultural',
        distance: '400 m',
        entryFee: '₹10',
        timings: '10:00 AM – 5:00 PM (Closed Friday)',
        duration: '1.5 hrs',
        rating: 4.6,
        description: 'Historic repository showcasing 1st-century BCE Sunga railings, Yaksha sandstone sculptures, bronze Buddha antiquities, and gold relic caskets.',
        queries: ['Archaeological Museum Bodh Gaya', 'Bodh Gaya ASI museum', 'Bodh Gaya sculpture museum', 'Ancient Buddhist museum Bihar']
      }
    ],
    itinerary: [
      { day: 1, title: 'Day 1 — Mahabodhi Enlightenment, Bodhi Tree & International Monasteries', items: [
        { time: 'Morning (6:00 AM)', activity: 'Mahabodhi Sanctum & Bodhi Tree Meditation', note: 'Witness morning chanting and circumnavigate the ancient stupa complex.' },
        { time: 'Midday (11:00 AM)', activity: 'Great Buddha 80-Foot Statue & Thai Wat', note: 'Marvel at the gigantic sandstone statue and Thai architecture.' },
        { time: 'Afternoon (3:00 PM)', activity: 'Royal Bhutan Monastery & ASI Museum', note: 'Examine 2,000-year-old Sunga stone railings and Bhutanese wall frescoes.' },
        { time: 'Evening (6:30 PM)', activity: 'Butter Lamp Illumination at Mahabodhi', note: 'Experience thousands of flickering golden butter lamps in temple grounds.' }
      ]},
      { day: 2, title: 'Day 2 — Dungeshwari Caves & Sujata Kuti Hermitage', items: [
        { time: 'Morning (7:00 AM)', activity: 'Dungeshwari Cave Temple Excursion', note: 'Climb Pragbodhi hill to explore the meditation caves of ascetic Siddhartha.' },
        { time: 'Midday (11:30 AM)', activity: 'Sujata Stupa & Falgu River Walk', note: 'Visit the earthen stupa dedicated to maiden Sujata across the Falgu river.' }
      ]}
    ],
    hotels: [
      { name: 'The Bodhi Palace Resort', type: 'resort', tier: 'luxury', priceMin: 6500, priceMax: 14000, rating: 4.7, reviews: 1800, amenities: ['Pool', 'Spa', 'Vegetarian Dining', 'Gardens', 'Free WiFi'], tags: ['Luxury Resort', '5 Star'], url: 'https://www.google.com/search?q=The%20Bodhi%20Palace%20Resort%20Bodh%20Gaya' },
      { name: 'Hotel Mahamaya Bodh Gaya', type: 'hotel', tier: 'better', priceMin: 2200, priceMax: 4500, rating: 4.4, reviews: 1100, amenities: ['Restaurant', 'AC', 'Temple Shuttle', 'Free WiFi'], tags: ['Near Temple', 'Popular'], url: 'https://www.google.com/search?q=Hotel%20Mahamaya%20Bodh%20Gaya' },
      { name: 'Oaks Bodhgaya', type: 'hotel', tier: 'luxury', priceMin: 5500, priceMax: 11000, rating: 4.6, reviews: 1450, amenities: ['Gym', 'Multi-cuisine Restaurant', 'Conference Hall', 'Travel Desk'], tags: ['Premium Hotel', 'International'], url: 'https://www.google.com/search?q=Oaks%20Bodhgaya%20hotel' }
    ],
    faq: [
      { q: 'What is the best time to visit Bodh Gaya?', a: 'October to March offers cool, pleasant weather (8°C to 24°C), making it ideal for meditation and visiting monasteries.' },
      { q: 'Is photography allowed inside Mahabodhi Temple?', a: 'Mobile phones are deposited in lockers outside. Cameras are permitted inside with a nominal ticket of ₹100.' },
      { q: 'Can tourists attend chanting sessions at Mahabodhi Temple?', a: 'Yes, devotees and visitors of all faiths are welcome to sit quietly and join the early morning (5:30 AM) and evening (6:00 PM) chanting sessions.' }
    ]
  },
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
      description: 'Located 90 kilometers southeast of Patna, Nalanda was the ancient world’s pinnacle of higher learning, attracting over 10,000 scholars and 2,000 masters from across Asia, including China, Korea, Japan, Tibet, and Persia. Supported by the Gupta, Harsha, and Pala dynasties, the monumental red-brick complex spanned vast residential monasteries (viharas), multi-tiered stupas, meditation cells, and the legendary nine-storey library Dharmaganja. Today, the majestic archaeological ruins and the Xuanzang Memorial stand as enduring monuments to ancient India’s intellectual golden age.',
      features: ['Nalanda University Ruins (UNESCO)', 'Sariputta Stupa Monolith (Site 3)', 'Xuanzang Memorial Hall', 'Pawapuri Jal Mandir (Jain Nirvana)'],
      altitude: '67 m',
      rating: 4.8,
      reviewCount: 28000,
      minPrice: 1400,
      distanceFromDelhi: 1020,
      about: 'A profoundly historic center of learning where brick courtyards, ancient lecture halls, intricate stucco Buddha niches, and world-class museums narrate over 800 years of academic mastery.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.1357, lng: 85.4439, tempSummer: '25–41°C', tempWinter: '9–24°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Jay Prakash Narayan Airport (PAT)', distance: 85 },
      nearestRailway: { name: 'Nalanda / Rajgir Railway Station', distance: 12 },
      roadNote: 'Connected via NH-120 and NH-31 from Patna (85 km), Rajgir (15 km), and Bodh Gaya (80 km).',
      routes: [
        { from: 'Patna', city: 'Patna', state: 'Bihar', distance: 85, byCar: '2 hrs', byTrain: 'Rajgir Intercity / Passenger (1.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-120 / Bakhtiyarpur-Rajgir Hwy' },
        { from: 'Bodh Gaya', city: 'Bodh Gaya', state: 'Bihar', distance: 80, byCar: '2 hrs', byTrain: 'Gaya to Rajgir Express', byAir: 'Via Gaya Airport', via: 'SH-70 via Hisua' },
        { from: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', distance: 290, byCar: '5.5 hrs', byTrain: 'Express via Patna/Gaya', byAir: 'Train / Road', via: 'NH-19 and NH-120' }
      ]
    },
    galleryQueries: ['Nalanda University ruins', 'Nalanda Mahavihara stupa', 'Nalanda archaeological ruins', 'Xuanzang Memorial Hall Nalanda', 'Nalanda site 3 stupa'],
    places: [
      {
        name: 'Nalanda Mahavihara Archaeological Ruins (UNESCO)',
        category: 'heritage',
        distance: 'Centre',
        entryFee: '₹40 (Foreigners ₹600)',
        timings: '9:00 AM – 5:00 PM',
        duration: '3 hrs',
        rating: 4.9,
        description: 'Vast red-brick excavation complex featuring 11 residential monasteries, 6 temples, stone wells, meditation cells, and ancient drainage systems.',
        queries: ['Nalanda University ruins', 'Nalanda Mahavihara', 'Nalanda ruins Bihar', 'Nalanda archaeological site']
      },
      {
        name: 'Great Stupa of Sariputta (Temple Site 3)',
        category: 'heritage',
        distance: 'Ruins Complex',
        entryFee: 'Included in Site Ticket',
        timings: '9:00 AM – 5:00 PM',
        duration: '1 hr',
        rating: 4.9,
        description: 'Towering multi-layered brick monument built over the relics of Buddha’s foremost disciple Sariputta, adorned with 6th-century stucco panels of Buddha and Bodhisattvas.',
        queries: ['Nalanda site 3 stupa', 'Sariputta Stupa Nalanda', 'Nalanda Stupa temple 3', 'Nalanda brick stupa']
      },
      {
        name: 'Xuanzang (Hiuen Tsang) Memorial Hall',
        category: 'heritage',
        distance: '1.5 km',
        entryFee: '₹25',
        timings: '9:00 AM – 5:00 PM',
        duration: '1.5 hrs',
        rating: 4.8,
        description: 'Grand Indo-Chinese pavilion built to commemorate Chinese pilgrim-scholar Xuanzang, who studied and taught at Nalanda in the 7th century CE.',
        queries: ['Xuanzang Memorial Hall Nalanda', 'Hiuen Tsang Memorial Nalanda', 'Xuanzang Hall Bihar', 'Hiuen Tsang museum Nalanda']
      },
      {
        name: 'Nalanda Archaeological Museum',
        category: 'cultural',
        distance: '300 m',
        entryFee: '₹5',
        timings: '10:00 AM – 5:00 PM (Closed Friday)',
        duration: '1.5 hrs',
        rating: 4.7,
        description: 'Four-gallery museum displaying over 13,000 excavated antiquities including Pala bronzes, terracotta seals with university insignia, stone sculptures, and charred rice grains.',
        queries: ['Nalanda Archaeological Museum', 'Nalanda Museum antiquities', 'Nalanda bronze gallery', 'Pala sculpture Nalanda museum']
      },
      {
        name: 'Kundalpur Digambar Jain Temple',
        category: 'spiritual',
        distance: '4 km',
        entryFee: 'Free',
        timings: '6:00 AM – 8:00 PM',
        duration: '1 hr',
        rating: 4.7,
        description: 'Revered Jain pilgrimage shrine believed to be the birthplace of Lord Mahavira by Digambar tradition, featuring a towering white marble temple and sacred lotus pond.',
        queries: ['Kundalpur Nalanda', 'Kundalpur Jain temple Bihar', 'Kundalpur Digambar temple', 'Kundalpur Mahavira shrine']
      },
      {
        name: 'Pawapuri Jal Mandir (Lotus Pond Shrine)',
        category: 'spiritual',
        distance: '18 km',
        entryFee: 'Free',
        timings: '6:00 AM – 8:00 PM',
        duration: '2 hrs',
        rating: 4.9,
        description: 'Breathtaking white marble temple situated in the center of an expansive lotus-filled water tank, marking the exact cremation and Nirvana spot of Lord Mahavira in 527 BCE.',
        queries: ['Pawapuri Jal Mandir', 'Pawapuri temple Bihar', 'Jal Mandir Pawapuri', 'Pawapuri lotus lake temple']
      },
      {
        name: 'Surya Mandir (Sun Temple of Surajpur Baragaon)',
        category: 'spiritual',
        distance: '2.5 km',
        entryFee: 'Free',
        timings: '5:30 AM – 8:30 PM',
        duration: '1 hr',
        rating: 4.6,
        description: 'Historic Sun temple located on the banks of Surajpur lake, hosting massive gatherings during the sacred Chhath Puja festival, featuring antique stone idols of Surya.',
        queries: ['Surya Mandir Surajpur Nalanda', 'Baragaon Sun Temple Nalanda', 'Surajpur lake temple Bihar', 'Sun temple Nalanda']
      },
      {
        name: 'Ghora Katora Eco Lake & Buddha Monolith',
        category: 'nature',
        distance: '16 km',
        entryFee: '₹20 (Electric Cart ₹100)',
        timings: '7:00 AM – 5:30 PM',
        duration: '2 hrs',
        rating: 4.8,
        description: 'Pristine horse-hoof-shaped lake cradled between five scenic hills, home to a 70-foot pink sandstone statue of Buddha installed amidst the azure waters with pedal boating.',
        queries: ['Ghora Katora Lake', 'Ghora Katora Buddha statue', 'Ghora Katora Rajgir Nalanda', 'Ghora Katora eco lake']
      }
    ],
    itinerary: [
      { day: 1, title: 'Day 1 — UNESCO Nalanda Excavations, Xuanzang Memorial & Museum', items: [
        { time: 'Morning (9:00 AM)', activity: 'Nalanda Mahavihara Guided Exploration', note: 'Walk through ancient vihara courtyards, Site 3 stupa, and lecture halls.' },
        { time: 'Midday (12:30 PM)', activity: 'Archaeological Museum Antiquities', note: 'View original Pala bronze idols and terracotta seals of the ancient varsity.' },
        { time: 'Afternoon (2:30 PM)', activity: 'Xuanzang Memorial Hall & Kundalpur', note: 'Admire Indo-Chinese pagoda architecture and Chinese manuscripts.' },
        { time: 'Evening (5:00 PM)', activity: 'Pawapuri Jal Mandir Sunset Walk', note: 'Witness sunset over the pristine white marble temple floating in lotus waters.' }
      ]}
    ],
    hotels: [
      { name: 'Nalanda Regency Hotel Rajgir', type: 'hotel', tier: 'better', priceMin: 3200, priceMax: 6500, rating: 4.3, reviews: 1400, amenities: ['Restaurant', 'AC', 'Free Parking', 'Room Service'], tags: ['Convenient', 'Comfort'], url: 'https://www.google.com/search?q=Nalanda%20Regency%20Hotel%20Rajgir' },
      { name: 'Indo Hokke Hotel Rajgir', type: 'hotel', tier: 'luxury', priceMin: 5500, priceMax: 11000, rating: 4.6, reviews: 1200, amenities: ['Japanese Onsen Bath', 'Multi-cuisine Restaurant', 'Lush Gardens'], tags: ['Japanese Style', 'Heritage'], url: 'https://www.google.com/search?q=Indo%20Hokke%20Hotel%20Rajgir' },
      { name: 'The Nalanda Resort', type: 'resort', tier: 'better', priceMin: 2800, priceMax: 5200, rating: 4.2, reviews: 850, amenities: ['Cottages', 'Garden Dining', 'Travel Desk'], tags: ['Eco Stay', 'Spacious'], url: 'https://www.google.com/search?q=The%20Nalanda%20Resort%20Bihar' }
    ],
    faq: [
      { q: 'How far is Nalanda from Patna and Rajgir?', a: 'Nalanda is 85 km (2 hrs drive) from Patna and just 15 km (20 mins drive) from Rajgir.' },
      { q: 'What are the visiting hours for the Nalanda ruins?', a: 'The ruins are open daily from 9:00 AM to 5:00 PM. The nearby museum is open 10:00 AM to 5:00 PM and closed on Fridays.' },
      { q: 'Are electric vehicle carts available at Nalanda?', a: 'Yes, battery-operated carts are available at the entrance to transport senior citizens and families comfortably.' }
    ]
  },
  {
    slug: 'rohtasgarh-fort',
    title: 'Rohtasgarh Fort',
    state: 'Bihar',
    region: 'Kaimur Plateau (Southwestern Bihar)',
    type: 'heritage',
    badge: 'Heritage',
    tagline: 'Rohtasgarh Fort — The Impregnable Hilltop Citadel of King Harishchandra & Sher Shah Suri',
    overview: {
      short: 'Perched atop a 1,500-foot sheer cliff on the Kaimur plateau, Rohtasgarh is one of India’s largest and most formidable ancient hill fortresses, spanning 42 square kilometers.',
      description: 'Commanding breathtaking panoramic views of the Son River valley, Rohtasgarh Fort was founded according to legend by Rohitashwa, son of King Harishchandra of Ayodhya. Strategically reinforced by Mughal general Raja Man Singh in the 16th century and captured by Sher Shah Suri in 1539, the immense fort complex encompasses royal palace quarters, the multi-storey Aina Mahal, intricate Hathiya Pol stone gates, Jami Masjid, Phulbari gardens, and hanging waterfalls cascading down the rugged Kaimur scarps.',
      features: ['Sprawling 42-sq-km Hill Citadel', 'Aina Mahal (Mirror Palace of Raja Man Singh)', 'Hathiya Pol (Monumental Elephant Gates)', 'Tutla Bhawani Waterfall Gorge'],
      altitude: '450 m',
      rating: 4.7,
      reviewCount: 9400,
      minPrice: 1300,
      distanceFromDelhi: 960,
      about: 'An adventurous trekker and history lover’s paradise where ancient stone arches, steep cliff faces, Mughal courtyards, and virgin jungle waterfalls meet on the Kaimur plateau.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 24.6300, lng: 83.9100, tempSummer: '27–43°C', tempWinter: '7–23°C' },
    howToReach: {
      nearestAirport: { name: 'Varanasi Lal Bahadur Shastri Airport (VNS)', distance: 140 },
      nearestRailway: { name: 'Dehri-on-Sone / Sasaram Junction', distance: 45 },
      roadNote: 'Accessible via NH-19 (Grand Trunk Road) to Dehri-on-Sone or Sasaram, followed by SH-15 to Akbarpur base village.',
      routes: [
        { from: 'Sasaram', city: 'Sasaram', state: 'Bihar', distance: 55, byCar: '1.5 hrs', byTrain: 'Train to Dehri-on-Sone', byAir: 'Via Varanasi Airport', via: 'SH-15 via Rohtas Block' },
        { from: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', distance: 140, byCar: '3.5 hrs', byTrain: 'Direct train to Sasaram/Dehri', byAir: 'Via Varanasi Airport', via: 'NH-19 Eastbound' },
        { from: 'Patna', city: 'Patna', state: 'Bihar', distance: 165, byCar: '4 hrs', byTrain: 'Express train to Dehri (2.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-139 / NH-19' }
      ]
    },
    galleryQueries: ['Rohtasgarh Fort', 'Rohtasgarh Fort Bihar', 'Rohtasgarh palace', 'Aina Mahal Rohtasgarh', 'Rohtas fort ruins'],
    places: [
      {
        name: 'Rohtasgarh Palace & Citadel Ramparts',
        category: 'heritage',
        distance: 'Centre',
        entryFee: 'Free',
        timings: '6:00 AM – 5:00 PM',
        duration: '3.5 hrs',
        rating: 4.8,
        description: 'Imposing stone palace citadel built by Raja Man Singh featuring royal darbar halls, residential quarters, hidden tunnels, and bastions overlooking the Son River.',
        queries: ['Rohtasgarh Fort', 'Rohtasgarh Fort Bihar', 'Rohtas palace Bihar', 'Rohtasgarh fort palace']
      },
      {
        name: 'Aina Mahal (Mirror Palace of Raja Man Singh)',
        category: 'heritage',
        distance: 'Fort Complex',
        entryFee: 'Free',
        timings: '6:00 AM – 5:00 PM',
        duration: '1 hr',
        rating: 4.7,
        description: 'Three-storey sandstone pleasure pavilion adorned with carved jharokhas, cupolas, and ornamental plasterwork, which served as the Mughal governor’s headquarters.',
        queries: ['Aina Mahal Rohtasgarh', 'Aina Mahal Bihar', 'Rohtasgarh Aina Mahal', 'Rohtas palace hall']
      },
      {
        name: 'Hathiya Pol (Monumental Elephant Gateway)',
        category: 'heritage',
        distance: 'Fort Complex',
        entryFee: 'Free',
        timings: '6:00 AM – 5:00 PM',
        duration: '45 mins',
        rating: 4.6,
        description: 'Main royal portal erected in 1597 flanked by life-sized stone elephant sculptures, guard chambers, and formidable arrow slits.',
        queries: ['Hathiya Pol Rohtasgarh', 'Rohtasgarh gate', 'Hathiya Pol gate Bihar', 'Rohtas fort gateway']
      },
      {
        name: 'Jami Masjid of Rohtasgarh',
        category: 'heritage',
        distance: 'Fort Complex',
        entryFee: 'Free',
        timings: '6:00 AM – 5:00 PM',
        duration: '45 mins',
        rating: 4.6,
        description: 'Grand 1543 white-plastered stone mosque built during the reign of Sher Shah Suri, featuring three domed bays, arched arcades, and a spacious prayer courtyard.',
        queries: ['Jami Masjid Rohtasgarh', 'Rohtasgarh mosque', 'Sher Shah mosque Rohtas', 'Ancient mosque Rohtas Bihar']
      },
      {
        name: 'Chaurasan Mandir & Rohitaswa Temple',
        category: 'spiritual',
        distance: '2 km within fort',
        entryFee: 'Free',
        timings: '6:00 AM – 5:00 PM',
        duration: '1 hr',
        rating: 4.6,
        description: 'Historic hilltop temple complex with 84 steps dedicated to Lord Shiva and King Rohitashwa, commanding panoramic views of the forested ravines.',
        queries: ['Chaurasan Mandir Rohtas', 'Rohitaswa temple Rohtasgarh', 'Rohtasgarh Shiva temple', 'Hill temple Rohtas']
      },
      {
        name: 'Phulwari Bagh (Royal Mughal Gardens)',
        category: 'heritage',
        distance: 'Fort Complex',
        entryFee: 'Free',
        timings: '6:00 AM – 5:00 PM',
        duration: '45 mins',
        rating: 4.5,
        description: 'Symmetrical Charbagh-style terraced pleasure garden complex featuring stone water channels, ornamental fountains, and pavilion ruins.',
        queries: ['Phulwari Bagh Rohtasgarh', 'Rohtasgarh garden', 'Rohtas fort garden pavilion', 'Mughal garden Rohtas']
      },
      {
        name: 'Tutla Bhawani Forest Canyon & Waterfall',
        category: 'nature',
        distance: '28 km from base',
        entryFee: '₹30',
        timings: '7:00 AM – 5:30 PM',
        duration: '2.5 hrs',
        rating: 4.8,
        description: 'Spectacular jungle ravine canyon where the Kachhuar stream drops over sheer rocks, featuring a 200-meter suspension bridge and sacred rock temple of Maa Tutla Bhawani.',
        queries: ['Tutla Bhawani waterfall', 'Tutla Bhawani Rohtas', 'Tutla Bhawani temple Bihar', 'Kachhuar waterfall Rohtas']
      },
      {
        name: 'Dhua Kund & Manjhar Kund Waterfalls',
        category: 'nature',
        distance: '35 km',
        entryFee: 'Free',
        timings: '7:00 AM – 5:00 PM',
        duration: '2 hrs',
        rating: 4.7,
        description: 'Twin dramatic cascades plunging into deep natural rock pools on the Kaimur plateau edge, famous for roaring post-monsoon waters and lush green valley vistas.',
        queries: ['Dhua Kund waterfall', 'Manjhar Kund Sasaram', 'Dhua Kund Rohtas', 'Kaimur waterfalls Bihar']
      }
    ],
    itinerary: [
      { day: 1, title: 'Day 1 — The Climb to Rohtasgarh Citadel & Royal Palaces', items: [
        { time: 'Early Morning (6:00 AM)', activity: 'Trek from Akbarpur Base to Plateau Crest', note: 'Hike the historic stone-paved trail up the Kaimur escarpment.' },
        { time: 'Morning (9:30 AM)', activity: 'Hathiya Pol & Aina Mahal Palace Exploration', note: 'Examine multi-storey sandstone quarters and Raja Man Singh darbar.' },
        { time: 'Midday (1:00 PM)', activity: 'Jami Masjid & Phulwari Gardens', note: 'Picnic amid ancient stone arcades with panoramic Son valley views.' },
        { time: 'Afternoon (3:30 PM)', activity: 'Chaurasan Mandir Cliff Viewpoint', note: 'Enjoy breathtaking 360-degree vistas of the rugged plateau before descent.' }
      ]},
      { day: 2, title: 'Day 2 — Tutla Bhawani Canyon & Dhua Kund Waterfalls', items: [
        { time: 'Morning (8:00 AM)', activity: 'Tutla Bhawani Suspension Bridge Walk', note: 'Walk across the valley gorge to the sacred waterfall shrine.' },
        { time: 'Afternoon (1:00 PM)', activity: 'Dhua Kund Plunge Pool & Relaxing Picnic', note: 'Unwind near the roaring natural pools overlooking the valley.' }
      ]}
    ],
    hotels: [
      { name: 'Hotel Maurya Royal Sasaram', type: 'hotel', tier: 'better', priceMin: 2200, priceMax: 4200, rating: 4.2, reviews: 750, amenities: ['Restaurant', 'AC', 'Free Parking', 'Travel Desk'], tags: ['City Base', 'Comfort'], url: 'https://www.google.com/search?q=Hotel%20Maurya%20Royal%20Sasaram' },
      { name: 'Hotel Rohit International Dehri-on-Sone', type: 'hotel', tier: 'better', priceMin: 1800, priceMax: 3500, rating: 4.1, reviews: 600, amenities: ['AC', 'Room Service', 'WiFi'], tags: ['Near Station', 'Budget Friendly'], url: 'https://www.google.com/search?q=Hotel%20Rohit%20International%20Dehri' }
    ],
    faq: [
      { q: 'How physically demanding is the trek to Rohtasgarh Fort?', a: 'The uphill trek from Akbarpur base takes 2 to 3 hours along a stepped stone path. Moderate fitness is recommended. Carry plenty of water.' },
      { q: 'Is it safe to visit Rohtasgarh Fort with family?', a: 'Yes, daytime visits are very popular and safe, especially on weekends between October and March.' },
      { q: 'Are guides available at the fort base?', a: 'Local village guides are readily available at Akbarpur base to assist with navigation and narrate historical legends.' }
    ]
  },
  {
    slug: 'mundeshwari-temple',
    title: 'Mundeshwari Temple',
    state: 'Bihar',
    region: 'Kaimur Hills (Southwestern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Mundeshwari Temple — India’s Oldest Functional Hindu Stone Temple (635 CE)',
    overview: {
      short: 'Maa Mundeshwari Temple on Pavra Hill is recognized as the oldest surviving functional Hindu stone temple in India, with continuous worship recorded since at least 635 CE.',
      description: 'Perched at an elevation of 608 feet on the solitary Pavra Hill in Kaimur district, Maa Mundeshwari Temple is an octagonal stone architectural masterpiece. Dedicated to Goddess Shakti and Lord Shiva (Mundeshwari Devi and Chaturmukha Lingam), the temple features ancient Gupta-era Nagara carvings, intricate stone lattice windows, carved Dvarapalas, and an extraordinary bloodless animal dedication ritual where sacrificial rams are blessed and released unharmed.',
      features: ['Oldest Functional Temple in India (635 CE)', 'Unique Octagonal Nagara Stone Architecture', 'Sacred Four-Faced Chaturmukha Shiva Linga', 'Telhar Kund & Karkat Waterfalls'],
      altitude: '185 m',
      rating: 4.8,
      reviewCount: 16500,
      minPrice: 1200,
      distanceFromDelhi: 930,
      about: 'A living antiquity of sublime spiritual resonance where 1,400-year-old stone sculptures, mystical hill panoramas, and ancient Tantric traditions continue unbroken.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.0200, lng: 83.5800, tempSummer: '26–42°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Varanasi Airport (VNS)', distance: 105 },
      nearestRailway: { name: 'Bhabua Road Railway Station (BBU)', distance: 22 },
      roadNote: 'Easily reached via NH-19 to Mohania, then south on NH-219 through Bhabua to Pavra Hill (22 km).',
      routes: [
        { from: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', distance: 105, byCar: '2.5 hrs', byTrain: 'Direct train to Bhabua Road', byAir: 'Via Varanasi Airport', via: 'NH-19 Eastbound to Mohania' },
        { from: 'Patna', city: 'Patna', state: 'Bihar', distance: 195, byCar: '4.5 hrs', byTrain: 'Express train to Bhabua Road (3 hrs)', byAir: 'Via Patna Airport', via: 'NH-139 / NH-19' },
        { from: 'Sasaram', city: 'Sasaram', state: 'Bihar', distance: 60, byCar: '1.5 hrs', byTrain: 'Train to Bhabua Road', byAir: 'Via Varanasi Airport', via: 'NH-19 Westbound' }
      ]
    },
    galleryQueries: ['Mundeshwari Temple', 'Mundeshwari Devi temple Bihar', 'Mundeshwari temple Kaimur', 'Pavra hill Mundeshwari', 'Ancient Mundeshwari temple'],
    places: [
      {
        name: 'Maa Mundeshwari Sanctum & Octagonal Shikhara',
        category: 'spiritual',
        distance: 'Hill Summit',
        entryFee: 'Free',
        timings: '5:00 AM – 8:00 PM',
        duration: '2 hrs',
        rating: 4.9,
        description: 'Ancient 7th-century octagonal stone shrine housing the revered idol of Maa Mundeshwari riding a buffalo (Mahishasuramardini) and four-faced Shiva lingam.',
        queries: ['Mundeshwari Temple', 'Mundeshwari Devi temple Bihar', 'Mundeshwari temple sanctum', 'Mundeshwari stone carving']
      },
      {
        name: 'Pavra Hill Vista & Ancient Pilgrim Steps',
        category: 'nature',
        distance: 'Pavra Hill',
        entryFee: 'Free',
        timings: '5:00 AM – 7:00 PM',
        duration: '1 hr',
        rating: 4.7,
        description: 'Scenic hilltop esplanade offering panoramic views across the Kaimur plains, connected by both a stone stairway (250 steps) and a motorable hill road.',
        queries: ['Pavra hill Mundeshwari', 'Pavra hill Kaimur', 'Mundeshwari hill view', 'Kaimur plateau landscape']
      },
      {
        name: 'Telhar Kund Waterfall',
        category: 'nature',
        distance: '32 km',
        entryFee: 'Free',
        timings: '7:00 AM – 5:00 PM',
        duration: '2 hrs',
        rating: 4.8,
        description: 'Magnificent 80-meter vertical waterfall plunging off the Kaimur cliff face into a deep emerald canyon pool surrounded by dense deciduous jungle.',
        queries: ['Telhar Kund waterfall', 'Telhar waterfall Kaimur', 'Telhar Kund Bihar', 'Kaimur hill waterfall']
      },
      {
        name: 'Karkat Waterfall & Eco Park',
        category: 'nature',
        distance: '38 km',
        entryFee: '₹20',
        timings: '7:00 AM – 5:30 PM',
        duration: '2 hrs',
        rating: 4.7,
        description: 'Broad cascade on the Karmanasa river nestled in a rocky canyon, featuring boating facilities, viewpoints, and migratory winter bird sightings.',
        queries: ['Karkat waterfall', 'Karkat waterfall Kaimur', 'Karkat falls Bihar', 'Karmanasa river waterfall']
      },
      {
        name: 'Baidyanath Shiv Mandir (Baidyanath Village)',
        category: 'spiritual',
        distance: '18 km',
        entryFee: 'Free',
        timings: '6:00 AM – 7:30 PM',
        duration: '1 hr',
        rating: 4.6,
        description: 'Gupta-era brick and stone Shiva temple ruin with ancient Nandi bull and intricately carved doorways depicting river goddesses Ganga and Yamuna.',
        queries: ['Baidyanath temple Kaimur', 'Baidyanath Shiv temple Bihar', 'Baidyanath village temple', 'Ancient Shiva temple Kaimur']
      },
      {
        name: 'Durgavati Dam & Reservoir (Karamchat Dam)',
        category: 'nature',
        distance: '26 km',
        entryFee: 'Free',
        timings: '7:00 AM – 6:00 PM',
        duration: '1.5 hrs',
        rating: 4.6,
        description: 'Expansive water reservoir built across the Durgavati river nestled beneath the Kaimur hills, popular for sunset photography and nature walks.',
        queries: ['Durgavati Dam Bihar', 'Karamchat Dam Kaimur', 'Durgavati reservoir', 'Kaimur lake dam']
      },
      {
        name: 'Kaimur Wildlife Sanctuary Safari Buffer',
        category: 'wildlife',
        distance: '15 km',
        entryFee: '₹50',
        timings: '6:30 AM – 5:00 PM',
        duration: '3 hrs',
        rating: 4.7,
        description: 'Sprawling 1,342-sq-km wildlife sanctuary sheltering leopards, striped hyenas, sloth bears, chital, blackbucks, and prehistoric rock art caves.',
        queries: ['Kaimur Wildlife Sanctuary', 'Kaimur sanctuary forest', 'Kaimur wildlife Bihar', 'Kaimur hills forest']
      },
      {
        name: 'Ramgarh Fort Ruins (Kaimur Range)',
        category: 'heritage',
        distance: '12 km',
        entryFee: 'Free',
        timings: '7:00 AM – 5:00 PM',
        duration: '1.5 hrs',
        rating: 4.5,
        description: 'Medieval hill outpost once controlled by regional Chandel chiefs, featuring crumbling stone bastions and secluded vantage points over the valley.',
        queries: ['Ramgarh Fort Kaimur', 'Ramgarh hill fort Bihar', 'Kaimur fort ruins', 'Medieval fort Kaimur']
      }
    ],
    itinerary: [
      { day: 1, title: 'Day 1 — Mundeshwari Darshan & Telhar Kund Waterfall', items: [
        { time: 'Morning (6:30 AM)', activity: 'Maa Mundeshwari Temple Sanctum Darshan', note: 'Witness early morning aarti at India’s oldest functional temple.' },
        { time: 'Midday (11:00 AM)', activity: 'Telhar Kund Waterfall Canyon View', note: 'Drive through Kaimur ghats to view the stunning 80m vertical falls.' },
        { time: 'Afternoon (3:00 PM)', activity: 'Durgavati Dam Sunset Promenade', note: 'Walk along the scenic reservoir with backdrop of Kaimur mountains.' }
      ]}
    ],
    hotels: [
      { name: 'Hotel Kaimur Inn Bhabua', type: 'hotel', tier: 'better', priceMin: 1800, priceMax: 3500, rating: 4.2, reviews: 520, amenities: ['AC', 'Restaurant', 'Free Parking', 'WiFi'], tags: ['Bhabua Center', 'Comfort'], url: 'https://www.google.com/search?q=Hotel%20Kaimur%20Inn%20Bhabua' },
      { name: 'Hotel Subhash International Mohania', type: 'hotel', tier: 'better', priceMin: 2200, priceMax: 4000, rating: 4.3, reviews: 800, amenities: ['Restaurant', 'Highway Access', 'AC Rooms'], tags: ['NH-19 Location', 'Convenient'], url: 'https://www.google.com/search?q=Hotel%20Subhash%20International%20Mohania' }
    ],
    faq: [
      { q: 'Is there a motorable road up to Mundeshwari Temple?', a: 'Yes, a paved motorable road leads directly up to the temple parking area on Pavra Hill. A stairway of 250 steps is also available for walkers.' },
      { q: 'What is unique about the ritual sacrifice at Mundeshwari Temple?', a: 'The temple is famous for Ahimsa (bloodless) dedication: the sacred ram is consecrated with mantras and rice grains until it lies tranquil, after which it is blessed and released totally unharmed.' },
      { q: 'What is the nearest railway station?', a: 'Bhabua Road (BBU) on the Grand Trunk Railway line is 22 km away, with frequent taxis and autos available.' }
    ]
  },
  {
    slug: 'takht-sri-patna-sahib',
    title: 'Takht Sri Patna Sahib',
    state: 'Bihar',
    region: 'Patna (Central Bihar)',
    type: 'heritage',
    badge: 'Heritage',
    tagline: 'Takht Sri Patna Sahib — The Sacred Birthplace of Guru Gobind Singh Ji',
    overview: {
      short: 'Takht Sri Harmandir Ji Patna Sahib is one of the five holy Takhts of Sikhism, marking the birthplace of the tenth Sikh Guru, Guru Gobind Singh Ji, in 1666 CE.',
      description: 'Nestled on the banks of the sacred River Ganga in the historic quarters of Patna City (Patliputra), Takht Sri Patna Sahib is an internationally revered spiritual sanctuary. Originally constructed by Maharaja Ranjit Singh in the 19th century and rebuilt in pristine white marble, the shrine preserves priceless Sikh relics including Guru Gobind Singh Ji’s golden cradles, childhood weapons (Talwar & Khanjar), the sacred Guru Granth Sahib handwritten with golden inks, and footprints of Guru Tegh Bahadur Ji.',
      features: ['One of the Five Holy Takhts of Sikhism', 'Priceless Relics of Guru Gobind Singh Ji', '24/7 Guru Ka Langar Community Kitchen', 'Historic Gurdwara Circuit along the Ganga'],
      altitude: '53 m',
      rating: 4.9,
      reviewCount: 36000,
      minPrice: 1600,
      distanceFromDelhi: 1010,
      about: 'A monumental spiritual center vibrating with round-the-clock Gurbani kirtan, compassionate langar service, and rich seventeenth-century Sikh heritage along the holy Ganga.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.5900, lng: 85.2300, tempSummer: '26–42°C', tempWinter: '9–24°C' },
    howToReach: {
      nearestAirport: { name: 'Jay Prakash Narayan Airport Patna (PAT)', distance: 18 },
      nearestRailway: { name: 'Patna Sahib Railway Station (PNC) / Patna Junction (PNBE)', distance: 2 },
      roadNote: 'Located in Patna City, easily reached via Ashok Rajpath, Patna Marine Drive (Ganga Path), and NH-31.',
      routes: [
        { from: 'New Delhi', city: 'New Delhi', state: 'Delhi', distance: 1010, byCar: '14 hrs', byTrain: 'Vande Bharat / Rajdhani to Patna (8 hrs)', byAir: 'Direct Flight to Patna PAT (1.5 hrs)', via: 'Purvanchal Expressway & NH-31' },
        { from: 'Kolkata', city: 'Kolkata', state: 'West Bengal', distance: 580, byCar: '10 hrs', byTrain: 'Vande Bharat / Howrah Express (6.5 hrs)', byAir: 'Direct Flight to Patna PAT', via: 'NH-19 and NH-31' }
      ]
    },
    galleryQueries: ['Takht Sri Patna Sahib', 'Patna Sahib Gurudwara', 'Takht Sri Harmandir Ji Patna Sahib', 'Patna Sahib marble gurdwara', 'Takht Patna Sahib interior'],
    places: [
      {
        name: 'Takht Sri Harmandir Ji Main Sanctum',
        category: 'spiritual',
        distance: 'Centre',
        entryFee: 'Free',
        timings: '3:30 AM – 10:00 PM',
        duration: '2.5 hrs',
        rating: 4.9,
        description: 'Magnificent white marble Takht sanctum housing the sacred relics, gilded arches, and continuous Gurbani Kirtan echoing through the main darbar hall.',
        queries: ['Takht Sri Patna Sahib', 'Patna Sahib Gurudwara', 'Harmandir Sahib Patna', 'Takht Sri Harmandir Ji']
      },
      {
        name: 'Gurdwara Bal Lila Maini Sangat',
        category: 'spiritual',
        distance: '500 m',
        entryFee: 'Free',
        timings: '4:00 AM – 9:30 PM',
        duration: '1 hr',
        rating: 4.8,
        description: 'Historic palace of Raja Fateh Chand Maini where child Gobind Rai played, famous for its tradition of serving boiled gram (Chhola-Poori) in memory of Rani Maini.',
        queries: ['Gurdwara Bal Lila Maini Sangat', 'Gurdwara Bal Lila Patna', 'Bal Lila Maini Sangat', 'Patna Sahib Bal Lila']
      },
      {
        name: 'Gurdwara Guru Ka Bagh',
        category: 'spiritual',
        distance: '2.5 km',
        entryFee: 'Free',
        timings: '5:00 AM – 9:00 PM',
        duration: '1 hr',
        rating: 4.7,
        description: 'Lush historic garden site where Guru Tegh Bahadur Ji rested on his return from Assam, causing the dry garden of Nawab Rahim Bakhsh to bloom miraculously.',
        queries: ['Gurdwara Guru Ka Bagh Patna', 'Guru Ka Bagh Patna', 'Patna Sahib Guru Ka Bagh', 'Sikh garden gurdwara Patna']
      },
      {
        name: 'Gurdwara Gai Ghat (Bhai Jaita Ji Shrine)',
        category: 'spiritual',
        distance: '3.5 km',
        entryFee: 'Free',
        timings: '5:00 AM – 9:00 PM',
        duration: '1 hr',
        rating: 4.7,
        description: 'Sacred riverfront shrine where Guru Nanak Dev Ji sanctified the residence of devout disciple Bhai Jetha Ji on his First Udasi in the early 16th century.',
        queries: ['Gurdwara Gai Ghat Patna', 'Gai Ghat Gurudwara', 'Gurdwara Gai Ghat Bihar', 'Ganga ghat gurdwara Patna']
      },
      {
        name: 'Bihar Museum (World-Class Heritage Galleries)',
        category: 'cultural',
        distance: '14 km',
        entryFee: '₹100',
        timings: '10:00 AM – 5:00 PM (Closed Monday)',
        duration: '3 hrs',
        rating: 4.8,
        description: 'State-of-the-art international museum designed by Maki & Associates, showcasing the Didarganj Yakshi (3rd century BCE), Mauryan relics, and 3,000 years of Bihar history.',
        queries: ['Bihar Museum Patna', 'Didarganj Yakshi Bihar Museum', 'Bihar Museum galleries', 'Patna Bihar Museum interior']
      },
      {
        name: 'Golghar Granary & Ganga Viewpoint',
        category: 'heritage',
        distance: '13 km',
        entryFee: '₹20',
        timings: '9:30 AM – 6:00 PM',
        duration: '1 hr',
        rating: 4.6,
        description: 'Iconic beehive-shaped stupa-style granary built in 1786 by Captain John Garstin, featuring twin spiraling staircases offering panoramic views of Patna and the River Ganga.',
        queries: ['Golghar Patna', 'Golghar granary Bihar', 'Golghar staircase Patna', 'Historic Golghar Patna']
      },
      {
        name: 'Buddha Smriti Park & Karuna Stupa',
        category: 'cultural',
        distance: '12 km',
        entryFee: '₹20',
        timings: '9:00 AM – 7:00 PM (Closed Monday)',
        duration: '1.5 hrs',
        rating: 4.7,
        description: 'Serene 22-acre urban memorial park housing the 200-foot Patliputra Karuna Stupa with authentic holy Buddha relics and sapling planted by the Dalai Lama.',
        queries: ['Buddha Smriti Park Patna', 'Karuna Stupa Patna', 'Buddha park Patna', 'Patliputra Karuna Stupa']
      },
      {
        name: 'Sabhyata Dwar & Ganga Path Marine Drive',
        category: 'cultural',
        distance: '10 km',
        entryFee: 'Free',
        timings: 'Open 24 Hours',
        duration: '1 hr',
        rating: 4.7,
        description: 'Monumental 32-meter red and white sandstone archway celebrating ancient Mauryan civilizational glory along the vibrant Ganga riverfront promenade.',
        queries: ['Sabhyata Dwar Patna', 'Patna Marine Drive Ganga Path', 'Sabhyata Dwar monument', 'Ganga riverfront promenade Patna']
      }
    ],
    itinerary: [
      { day: 1, title: 'Day 1 — Takht Sri Patna Sahib Darshan & Historic Gurdwaras Circuit', items: [
        { time: 'Morning (6:00 AM)', activity: 'Takht Sri Harmandir Ji Darbar & Relic Darshan', note: 'Witness morning Hukamnama and sacred weapons darshan.' },
        { time: 'Midday (11:30 AM)', activity: 'Langar Seva & Bal Lila Gurdwara Walk', note: 'Partake in traditional community langar and visit Bal Lila Maini Sangat.' },
        { time: 'Afternoon (3:00 PM)', activity: 'Guru Ka Bagh & Gurdwara Gai Ghat', note: 'Explore historic garden and riverside gurdwaras along the Ganga.' }
      ]},
      { day: 2, title: 'Day 2 — Bihar Museum, Golghar & Ganga Marine Drive', items: [
        { time: 'Morning (10:00 AM)', activity: 'Bihar Museum World Heritage Gallery', note: 'Explore 3,000 years of Bihar history and the Didarganj Yakshi.' },
        { time: 'Afternoon (2:30 PM)', activity: 'Golghar Granary & Buddha Smriti Park', note: 'Climb the iconic granary and visit the Karuna Stupa.' },
        { time: 'Evening (5:30 PM)', activity: 'Sabhyata Dwar & Riverfront Sunset', note: 'Enjoy cool evening river breezes on Patna Marine Drive.' }
      ]}
    ],
    hotels: [
      { name: 'Hotel Maurya Patna', type: 'hotel', tier: 'luxury', priceMin: 6500, priceMax: 13000, rating: 4.6, reviews: 2400, amenities: ['Pool', 'Gym', 'Fine Dining', 'Bar', 'Spa'], tags: ['5 Star', 'City Center'], url: 'https://www.google.com/search?q=Hotel%20Maurya%20Patna' },
      { name: 'Hotel Gargee Grand Patna', type: 'hotel', tier: 'luxury', priceMin: 4500, priceMax: 9000, rating: 4.5, reviews: 1800, amenities: ['Rooftop Pool', 'Multi-cuisine Restaurant', 'Free WiFi'], tags: ['Premium', 'Business'], url: 'https://www.google.com/search?q=Hotel%20Gargee%20Grand%20Patna' },
      { name: 'Patliputra Exotica', type: 'hotel', tier: 'better', priceMin: 3500, priceMax: 6500, rating: 4.3, reviews: 1500, amenities: ['Restaurant', 'Conference Facilities', 'AC'], tags: ['Popular', 'Comfort'], url: 'https://www.google.com/search?q=Hotel%20Patliputra%20Exotica%20Patna' }
    ],
    faq: [
      { q: 'Is accommodation available at Takht Sri Patna Sahib for pilgrims?', a: 'Yes, Guru Gobind Singh Ji Niwas and several large Yatri Niwas complexes provide clean, modern rooms and dormitories for pilgrims.' },
      { q: 'What is the dress code for entering Takht Sri Patna Sahib?', a: 'Heads must be covered with a scarf or turban (provided at the entrance), shoes deposited at the shoe counter, and feet washed at the water trough.' },
      { q: 'How can visitors view the sacred weapons and relics of Guru Gobind Singh Ji?', a: 'The sacred relics (weapons, cradle, and manuscripts) are displayed for public darshan twice daily during the special relic display ceremony.' }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 1 (5 Destinations)');
  console.log('====================================================\n');

  for (const config of BATCH_CONFIGS) {
    console.log(`\n----------------------------------------------------`);
    console.log(`Processing: "${config.title}" (${config.slug})`);
    console.log(`----------------------------------------------------`);

    // 1. Gallery
    console.log(`Fetching 5 unique gallery images...`);
    const galleryItems = await collectUniqueImages(config.galleryQueries, 5);
    if (galleryItems.length < 5) {
      const extra = await collectUniqueImages([`${config.title} Bihar`, `Bihar heritage monument`, `Bihar landmark`], 5 - galleryItems.length);
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

    // 2. Top Places
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
          `${config.title} Bihar tourism`,
          `${config.title} sightseeing`
        ]
      }
    };

    const outPath = path.join(DEST_DIR, `${config.slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(destinationData, null, 2));
    console.log(`  💾 Saved destination to ${outPath}`);

    // Update index.json
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

  console.log('\n🎉 Finished Batch 1 successfully!');
}

run().catch(console.error);
