const fs = require('fs');
const path = require('path');
const { DEST_DIR, INDEX_PATH, collectUniqueImages, sleep } = require('./bihar-curate-core.js');

const BATCH_CONFIGS = [
  // 25. Kapileshwar Temple (Madhubani)
  {
    slug: 'kapileshwar-temple',
    title: 'Kapileshwar Temple',
    state: 'Bihar',
    region: 'Mithila / Madhubani (Northern Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Kapileshwar Dham — The Sacred Lingam of Sage Kapila & Mithila Art Heartlands',
    overview: {
      short: 'Kapileshwar Temple in Madhubani is an ancient Shiva temple established by Sage Kapila (founder of Samkhya philosophy), situated in the epicenter of world-famous Mithila art.',
      description: 'Located in Rahika block near Madhubani, Kapileshwar Sthan is one of Mithila’s most revered Shaivite pilgrimage shrines. Surrounded by sacred lotus ponds, historic mango orchards, and the vibrant Mithila painting villages of Jitwarpur and Ranti, the temple hosts massive gatherings during Shravan and Maha Shivratri.',
      features: ['Swayambhu Shiva Lingam Established by Sage Kapila', 'Ancient Mithila Painting Artisan Villages (Jitwarpur & Ranti)', 'Saurath Sabha Historic Genealogist Village', 'Rajnagar Palace Ruins & Heritage Temples'],
      altitude: '56 m', rating: 4.7, reviewCount: 13500, minPrice: 1300, distanceFromDelhi: 1120,
      about: 'A culturally vibrant pilgrimage haven where Vedic philosophy, sacred Shiva waters, and UNESCO-recognized Madhubani folk paintings flourish.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 26.3500, lng: 86.0800, tempSummer: '25–41°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Darbhanga Airport (DBR)', distance: 35 },
      nearestRailway: { name: 'Madhubani Railway Station (MBI)', distance: 8 },
      roadNote: 'Located 8 km from Madhubani town, accessible via NH-527B and SH-50 from Darbhanga.',
      routes: [{ from: 'Darbhanga', city: 'Darbhanga', state: 'Bihar', distance: 35, byCar: '1 hr', byTrain: 'Local train to Madhubani (45 mins)', byAir: 'Via Darbhanga Airport', via: 'NH-527B Northbound' }]
    },
    galleryQueries: ['Kapileshwar temple Madhubani', 'Madhubani Bihar temple', 'Madhubani painting village', 'Rajnagar palace Madhubani', 'Mithila painting Bihar'],
    places: [
      { name: 'Kapileshwar Nath Mahadev Main Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.8, description: 'Ancient stone temple housing the sacred Shiva Lingam established by Sage Kapila.', queries: ['Kapileshwar temple Madhubani', 'Kapileshwar Sthan Bihar', 'Kapileshwar Mahadev', 'Madhubani Shiva temple'] },
      { name: 'Jitwarpur National Awardee Mithila Art Village', category: 'cultural', distance: '12 km', entryFee: 'Free', timings: '9:00 AM – 6:00 PM', duration: '2.5 hrs', rating: 4.9, description: 'Famous artisan hamlet with Padma Shri artists painting traditional Kohbar, Bharni, and Godna murals.', queries: ['Jitwarpur Madhubani art', 'Madhubani painting village Jitwarpur', 'Mithila painting artisan', 'Bihar traditional painting village'] },
      { name: 'Ranti Village Mithila Painting Studios', category: 'cultural', distance: '9 km', entryFee: 'Free', timings: '9:00 AM – 6:00 PM', duration: '2 hrs', rating: 4.8, description: 'Renowned women artists’ cooperative creating handmade natural pigment canvas art and paper scrolls.', queries: ['Ranti village Madhubani', 'Ranti Mithila art', 'Madhubani painting studios', 'Mithila painting woman artist'] },
      { name: 'Rajnagar Royal Palace Complex & Kali Temple', category: 'heritage', distance: '16 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '2 hrs', rating: 4.7, description: 'Picturesque ruins of Maharaja Rameshwar Singh’s marble palace, Kamakhya temple, and grand tank.', queries: ['Rajnagar palace Madhubani', 'Rajnagar Bihar palace ruins', 'Rajnagar Kali temple', 'Darbhanga Raj Rajnagar'] },
      { name: 'Saurath Sabha Historic Genealogist Village', category: 'cultural', distance: '6 km', entryFee: 'Free', timings: '6:00 AM – 7:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Centuries-old village under sacred banyan trees where Panjikars maintain handwritten Maithil genealogies.', queries: ['Saurath Sabha Madhubani', 'Saurath village Bihar', 'Saurath Sabha Mithila', 'Somnath Mahadev Saurath'] },
      { name: 'Uchaitha Bhagwati Temple (Kalidasa Hermitage)', category: 'spiritual', distance: '28 km', entryFee: 'Free', timings: '5:30 AM – 8:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Sacred riverbank temple on the Thumne river where poet Kalidasa attained divine knowledge from Goddess Durga.', queries: ['Uchaitha Bhagwati temple', 'Uchaitha temple Madhubani', 'Kalidasa temple Uchaitha', 'Uchaitha Bihar'] },
      { name: 'Bhawanipur Ugranath Mahadev Mandir', category: 'spiritual', distance: '22 km', entryFee: 'Free', timings: '5:30 AM – 8:00 PM', duration: '1 hr', rating: 4.6, description: 'Sacred temple where Lord Shiva served the great poet Vidyapati as a loyal servant named Ugna.', queries: ['Ugranath temple Bhawanipur', 'Ugna Mahadev Madhubani', 'Vidyapati Ugna temple', 'Bhawanipur temple Bihar'] },
      { name: 'Kapileshwar Sacred Lake & Lotus Ghats', category: 'nature', distance: 'Temple Front', entryFee: 'Free', timings: '5:00 AM – 8:00 PM', duration: '45 mins', rating: 4.5, description: 'Tranquil freshwater tank covered in seasonal pink lotus blossoms with broad stone bathing steps.', queries: ['Kapileshwar lake Madhubani', 'Mithila temple pond', 'Madhubani sacred tank', 'Kapileshwar pond ghat'] }
    ]
  },

  // 26. Khudneshwar Asthan Morwa (Samastipur)
  {
    slug: 'khudneshwar-asthan-morwa',
    title: 'Khudneshwar Asthan Morwa',
    state: 'Bihar',
    region: 'Mithila / Samastipur (Central Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Khudneshwar Dham — The Sacred Symbol of Hindu-Muslim Unity & Ancient Shiva Sanctorum',
    overview: {
      short: 'Khudneshwar Asthan in Morwa, Samastipur, is a unique 14th-century temple where a Hindu Shiva Lingam and the Mazar of Muslim devotee Khudno Bibi are worshipped together under a single dome.',
      description: 'Located in Morwa block of Samastipur district, Khudneshwar Dham stands as an inspiring monument to communal brotherhood. In the 14th century, a Muslim milkmaid named Khudno Bibi discovered a Swayambhu Shiva Lingam when her cow shed milk upon a mound. Today, the sacred Shiva Lingam and the Mazar of Khudno Bibi stand side by side under one sacred roof, revered by thousands of Hindu and Muslim devotees.',
      features: ['Unique Shared Shiva Lingam & Mazar Under One Roof', 'Inspirational 14th-Century Communal Harmony Shrine', 'Historic Pusa Agricultural University Heritage', 'Morwa Lake & Wetland Eco Reserve'],
      altitude: '52 m', rating: 4.7, reviewCount: 8900, minPrice: 1200, distanceFromDelhi: 1060,
      about: 'A deeply moving sacred sanctuary of shared faith, peaceful lotus lakes, and rich colonial agricultural research heritage.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.8600, lng: 85.7800, tempSummer: '25–41°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT) / Darbhanga Airport (DBR)', distance: 75 },
      nearestRailway: { name: 'Samastipur Junction (SPJ)', distance: 16 },
      roadNote: 'Located 16 km southwest of Samastipur town via SH-49 through Morwa.',
      routes: [{ from: 'Samastipur', city: 'Samastipur', state: 'Bihar', distance: 16, byCar: '30 mins', byTrain: 'Local auto / taxi', byAir: 'Via Patna/Darbhanga Airport', via: 'SH-49 to Morwa' }]
    },
    galleryQueries: ['Khudneshwar Asthan Morwa', 'Khudneshwar temple Samastipur', 'Khudneshwar Dham Bihar', 'Pusa University Samastipur', 'Samastipur landmark Bihar'],
    places: [
      { name: 'Khudneshwar Mahadev & Khudno Bibi Shared Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.9, description: 'Unique sanctum housing the sacred Shiva Lingam and Mazar of Khudno Bibi side by side under one dome.', queries: ['Khudneshwar Asthan Morwa', 'Khudneshwar temple Samastipur', 'Khudneshwar Dham Bihar', 'Khudneshwar sanctum'] },
      { name: 'Morwa Lake & Wetland Lotus Marsh', category: 'nature', distance: '1.5 km', entryFee: 'Free', timings: '5:30 AM – 7:30 PM', duration: '1.5 hrs', rating: 4.5, description: 'Natural freshwater lake rich in aquatic birds, pink lotus flowers, and village farming views.', queries: ['Morwa lake Samastipur', 'Morwa wetland Bihar', 'Samastipur lake', 'Morwa pond nature'] },
      { name: 'Dr. Rajendra Prasad Central Agricultural University (Pusa)', category: 'heritage', distance: '22 km', entryFee: 'Free', timings: '9:30 AM – 5:00 PM', duration: '2 hrs', rating: 4.7, description: 'Historic 1905 heritage campus founded by Lord Curzon with majestic colonial red-brick buildings and research farms.', queries: ['Pusa University Samastipur', 'Pusa Agricultural University Bihar', 'RPCAU Pusa campus', 'Pusa Institute Bihar heritage'] },
      { name: 'Vidyapati Dham (Vidyapatinagar)', category: 'spiritual', distance: '28 km', entryFee: 'Free', timings: '5:30 AM – 8:00 PM', duration: '1.5 hrs', rating: 4.7, description: 'Sacred spot on the banks of the Ganga where the revered 14th-century Maithili poet-saint Vidyapati took Mahasamadhi.', queries: ['Vidyapati Dham Samastipur', 'Vidyapatinagar Bihar', 'Vidyapati temple', 'Poet Vidyapati memorial'] },
      { name: 'Thaneshwar Mahadev Temple (Samastipur City)', category: 'spiritual', distance: '16 km', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1 hr', rating: 4.6, description: 'Popular city Shiva temple featuring ancient stone idols, large prayer courtyards, and bustling bazaars.', queries: ['Thaneshwar temple Samastipur', 'Thaneshwar Mahadev Bihar', 'Samastipur Shiva temple', 'Thaneshwar mandir'] },
      { name: 'Karihayan Wildlife Wetland & Bird Sanctuary', category: 'nature', distance: '18 km', entryFee: 'Free', timings: '6:00 AM – 5:30 PM', duration: '1.5 hrs', rating: 4.5, description: 'Sprawling seasonal waterlogged lake attracting winter migratory teals, pintails, and local egrets.', queries: ['Karihayan wetland Samastipur', 'Samastipur bird wetland', 'Karihayan lake Bihar', 'Samastipur nature bird'] },
      { name: 'Rosera Heritage River Ghats & Trading Town', category: 'heritage', distance: '32 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.4, description: 'Historic river port on the Burhi Gandak River known for antique wooden riverboats and traditional grain markets.', queries: ['Rosera Samastipur', 'Rosera river ghat Bihar', 'Burhi Gandak Rosera', 'Historic Rosera town'] },
      { name: 'Samastipur Railway Heritage Museum', category: 'cultural', distance: '17 km', entryFee: '₹10', timings: '10:00 AM – 5:00 PM (Closed Mon)', duration: '1 hr', rating: 4.5, description: 'Heritage gallery showcasing vintage steam locomotives, brass signals, and colonial Oudh-Tirhut railway memorabilia.', queries: ['Samastipur Railway Museum', 'Samastipur rail museum Bihar', 'Steam locomotive Samastipur', 'Railway heritage Bihar'] }
    ]
  },

  // 27. Lal Keshwar Shiv Temple (Hajipur / Vaishali)
  {
    slug: 'lal-keshwar-shiv-temple',
    title: 'Lal Keshwar Shiv Temple',
    state: 'Bihar',
    region: 'Tirhut / Vaishali (Central Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Lal Keshwar Shiv Temple — Historic Baghmali Shiva Sanctorum & Vaishali Democracy Heritage',
    overview: {
      short: 'Lal Keshwar Shiv Temple in Baghmali, Hajipur, is an ancient Shiva temple situated in the heart of historic Vaishali district, where the world’s first democratic republic was born in the 6th century BCE.',
      description: 'Located in the Baghmali quarter of Hajipur in Vaishali district, Lal Keshwar Shiv Temple is a revered pilgrimage center known for its serene pond courtyards and powerful Shiva Lingam. It serves as the gateway to the world-famous Buddhist and Jain heritage circuit of Vaishali, including the Ashokan Lion Pillar, the Buddha Relic Stupa, and the birthplace of Lord Mahavira at Kundalpur.',
      features: ['Ancient Baghmali Shiva Lingam Sanctum', 'Vaishali Ancient Lichchhavi Republic Capital', 'Ashokan Lion Pillar & Ananda Stupa at Kolhua', 'Lord Mahavira Birthplace at Kundalpur'],
      altitude: '52 m', rating: 4.7, reviewCount: 10400, minPrice: 1200, distanceFromDelhi: 1010,
      about: 'A serene spiritual sanctuary connecting ancient Shaivite worship with the world’s oldest democratic heritage and Buddhist relic stupas.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.6900, lng: 85.2200, tempSummer: '26–42°C', tempWinter: '9–24°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 22 },
      nearestRailway: { name: 'Hajipur Junction (HJP)', distance: 2.5 },
      roadNote: 'Located in Baghmali, Hajipur, just 18 km north of Patna across JP Ganga Setu / Gandhi Setu.',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 18, byCar: '35 mins', byTrain: 'Train to Hajipur (20 mins)', byAir: 'Via Patna Airport', via: 'JP Ganga Setu' }]
    },
    galleryQueries: ['Lal Keshwar Shiv temple Hajipur', 'Vaishali Ashokan pillar', 'Vaishali Buddha stupa', 'Hajipur temple Bihar', 'Lal Keshwar temple Baghmali'],
    places: [
      { name: 'Lal Keshwar Mahadev Main Sanctum', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:00 AM – 9:00 PM', duration: '1.5 hrs', rating: 4.8, description: 'Ancient stone temple housing the revered Lal Keshwar Shiva Lingam and holy pond.', queries: ['Lal Keshwar Shiv temple Hajipur', 'Lal Keshwar temple Baghmali', 'Lal Keshwar Mandir Bihar', 'Hajipur Shiva mandir'] },
      { name: 'Kolhua Ashokan Pillar & Monkey Tank (Markata-Hrada)', category: 'heritage', distance: '36 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '2 hrs', rating: 4.9, description: 'Intact 3rd-century BCE Ashokan pillar with a grand seated lion capital beside the historic tank where monkeys offered honey to Buddha.', queries: ['Kolhua Ashokan Pillar Vaishali', 'Ashoka pillar Kolhua', 'Kolhua lion pillar Bihar', 'Vaishali Ashokan pillar'] },
      { name: 'Vaishali Buddha Relic Stupa Site', category: 'heritage', distance: '34 km', entryFee: '₹25', timings: '9:00 AM – 5:00 PM', duration: '1.5 hrs', rating: 4.8, description: 'Excavated 5th-century BCE Lichchhavi mud stupa that contained one-eighth of Buddha’s holy ash relics.', queries: ['Vaishali Relic Stupa', 'Buddha relic stupa Vaishali', 'Vaishali excavation Bihar', 'Ancient Buddha stupa Vaishali'] },
      { name: 'Vishwa Shanti Stupa Vaishali (Peace Pagoda)', category: 'spiritual', distance: '35 km', entryFee: 'Free', timings: '9:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.8, description: 'Towering white marble Peace Pagoda erected in 1996 by Nipponzan Myohoji on the bank of Abhishek Pushkarini lake.', queries: ['Vishwa Shanti Stupa Vaishali', 'Vaishali Peace Pagoda', 'Shanti Stupa Vaishali Bihar', 'Vaishali Japanese temple'] },
      { name: 'Abhishek Pushkarini (Sacred Coronation Tank)', category: 'heritage', distance: '34 km', entryFee: 'Free', timings: '6:00 AM – 7:00 PM', duration: '1 hr', rating: 4.7, description: 'Historic sacred reservoir where the elected 7,707 Lichchhavi republican representatives were consecrated.', queries: ['Abhishek Pushkarini Vaishali', 'Vaishali coronation tank', 'Pushkarini lake Vaishali', 'Sacred tank Vaishali'] },
      { name: 'Kundalpur Mahavira Birthplace Memorial', category: 'spiritual', distance: '38 km', entryFee: 'Free', timings: '6:00 AM – 8:00 PM', duration: '1.5 hrs', rating: 4.8, description: 'Revered white marble Jain pilgrimage shrine commemorating the birth of 24th Tirthankar Lord Mahavira.', queries: ['Kundalpur Vaishali Jain temple', 'Mahavira birthplace Vaishali', 'Kundalpur Digambar Vaishali', 'Kundalpur Jain shrine Bihar'] },
      { name: 'Raja Vishal Ka Garh (Ancient Parliament Mound)', category: 'heritage', distance: '35 km', entryFee: 'Free', timings: '8:00 AM – 5:30 PM', duration: '1 hr', rating: 4.6, description: 'Huge excavated 1-kilometer earthen rampart representing the ancient assembly hall of the Lichchhavi Republic.', queries: ['Raja Vishal Ka Garh', 'Vaishali parliament mound', 'Raja Vishal fort Bihar', 'Ancient republic assembly Vaishali'] },
      { name: 'Ramchaura Mandir (Footprints of Lord Rama)', category: 'spiritual', distance: '3 km', entryFee: 'Free', timings: '5:30 AM – 8:30 PM', duration: '1 hr', rating: 4.7, description: 'Ancient temple preserving the stone footprint of Lord Rama on his journey to Janakpur.', queries: ['Ramchaura Mandir Hajipur', 'Ramchaura temple Bihar', 'Lord Rama footprint Hajipur', 'Ramchaura mandir'] }
    ]
  },

  // 28. Basilica of Our Lady of Divine Grace (Mokama)
  {
    slug: 'basilica-of-our-lady-of-divine-grace',
    title: 'Basilica of Our Lady of Divine Grace',
    state: 'Bihar',
    region: 'Patna / Mokama (Central Bihar)',
    type: 'spiritual',
    badge: 'Spiritual',
    tagline: 'Shrine Basilica of Our Lady of Divine Grace — Mokama’s Historic Catholic Pilgrimage Sanctuary',
    overview: {
      short: 'The Shrine of Our Lady of Divine Grace in Mokama, Patna district, is Bihar’s most famous Marian Catholic pilgrimage shrine, established in 1947 by the Sisters of Charity of Nazareth.',
      description: 'Situated on the southern bank of the River Ganga in Mokama, this renowned shrine attracts over 100,000 pilgrims of all faiths annually for the historic Feast of Our Lady of Divine Grace in February. The peaceful riverside sanctuary features a soaring church bell tower, lush gardens, the historic Nazareth Hospital, and proximity to the iconic Rajendra Setu bridge.',
      features: ['Bihar’s Foremost Marian Catholic Pilgrimage Shrine', 'Historic 1947 Sisters of Charity of Nazareth Foundation', 'Annual February Feast of Our Lady of Divine Grace', 'Panoramic Views of the Sacred Ganga & Rajendra Setu'],
      altitude: '54 m', rating: 4.8, reviewCount: 11800, minPrice: 1300, distanceFromDelhi: 1060,
      about: 'A peaceful riverfront oasis of healing, compassion, and divine intercession along the sacred Ganga in Mokama.'
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 25.4000, lng: 85.9200, tempSummer: '26–42°C', tempWinter: '8–23°C' },
    howToReach: {
      nearestAirport: { name: 'Patna Airport (PAT)', distance: 95 },
      nearestRailway: { name: 'Mokama Junction (MKA)', distance: 3 },
      roadNote: 'Located 90 km east of Patna, connected via NH-31 (Bakhtiyarpur-Mokama Four-Lane Highway).',
      routes: [{ from: 'Patna', city: 'Patna', state: 'Bihar', distance: 90, byCar: '2 hrs', byTrain: 'Express train (1.5 hrs)', byAir: 'Via Patna Airport', via: 'NH-31 Eastbound' }]
    },
    galleryQueries: ['Mokama church Bihar', 'Our Lady of Divine Grace Mokama', 'Mokama shrine Bihar', 'Rajendra Setu Mokama', 'Mokama Ganga riverfront'],
    places: [
      { name: 'Shrine Basilica of Our Lady of Divine Grace', category: 'spiritual', distance: 'Centre', entryFee: 'Free', timings: '5:30 AM – 8:30 PM', duration: '2 hrs', rating: 4.9, description: 'Grand white church and Marian shrine housing the miraculous statue of Mother Mary holding infant Jesus.', queries: ['Mokama church Bihar', 'Our Lady of Divine Grace Mokama', 'Mokama shrine Bihar', 'Mokama Catholic church'] },
      { name: 'Mokama Ganga Ghat & River Promenade', category: 'nature', distance: '1.2 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.6, description: 'Serene riverbank promenade offering sunset views over the broad Ganga river and traditional country boats.', queries: ['Mokama Ganga ghat', 'Mokama riverfront Bihar', 'Ganga ghat Mokama', 'Mokama river view'] },
      { name: 'Rajendra Setu (India’s First Rail-Road Ganga Bridge)', category: 'heritage', distance: '5 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1 hr', rating: 4.7, description: 'Historic 2-kilometer steel truss bridge opened in 1959 by Prime Minister Jawaharlal Nehru connecting Mokama and Begusarai.', queries: ['Rajendra Setu Mokama', 'Rajendra Setu bridge Bihar', 'Mokama Ganga bridge', 'First rail road bridge Ganga'] },
      { name: 'Simaria Ghat & Kalpwas Sangam (Across Ganga)', category: 'spiritual', distance: '8 km', entryFee: 'Free', timings: 'Open 24 Hours', duration: '1.5 hrs', rating: 4.7, description: 'Sacred northern riverfront ghat famous for holy bathing and the annual month-long Kartik Kalpwas Mela.', queries: ['Simaria Ghat Begusarai', 'Simaria Ganga Ghat Bihar', 'Simaria Ghat Ganga', 'Begusarai Ganga riverfront'] },
      { name: 'Nazareth Hospital & SCN Heritage Grounds', category: 'cultural', distance: 'Adjacent', entryFee: 'Free', timings: '8:00 AM – 5:00 PM', duration: '1 hr', rating: 4.6, description: 'Pioneering healthcare and nursing institution founded in 1948 by American missionary sisters of SCN.', queries: ['Nazareth Hospital Mokama', 'SCN Mokama heritage', 'Mokama convent Bihar', 'Mokama Sisters of Charity'] },
      { name: 'Aunta Nature Promenade & Oxbow Marshes', category: 'nature', distance: '4 km', entryFee: 'Free', timings: '6:00 AM – 6:00 PM', duration: '1 hr', rating: 4.4, description: 'Lush agricultural wetland fields and floodplain wetlands hosting kingfishers and winter migratory ducks.', queries: ['Aunta Mokama', 'Aunta wetland Bihar', 'Mokama countryside nature', 'Mokama rural landscape'] },
      { name: 'Jayamangalgarh Island & Wetland Mound', category: 'heritage', distance: '28 km', entryFee: 'Free', timings: '7:00 AM – 5:30 PM', duration: '2 hrs', rating: 4.6, description: 'Ancient fortified island mound in the Kabar Taal wetland housing the historic Maa Chandi shrine.', queries: ['Jaimangalgarh temple Begusarai', 'Jaimangalgarh Begusarai', 'Jaimangalgarh island Bihar', 'Mangla Chandi temple Begusarai'] },
      { name: 'Barauni Heritage Thermal Eco Park', category: 'nature', distance: '16 km', entryFee: '₹20', timings: '9:00 AM – 6:00 PM', duration: '1.5 hrs', rating: 4.4, description: 'Landscaped botanical park with musical fountains, walking paths, and green lawns.', queries: ['Barauni eco park', 'Barauni Begusarai park', 'Begusarai eco garden', 'Barauni lake park'] }
    ]
  }
];

async function run() {
  console.log('====================================================');
  console.log('CURATING BIHAR BATCH 9 (Destinations 25–28)');
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

  console.log('\n🎉 Finished Batch 9 successfully!');
}

run().catch(console.error);
