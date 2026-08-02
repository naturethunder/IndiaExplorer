// IndiaExplore — extra places & hotels (OYO / Airbnb / famous chains)
// Loaded AFTER data.js. Merges additional places and stays into DESTINATIONS.
// Schema is kept identical to data.js so the vanilla renderers work unchanged.
// Names here are chosen to NOT collide with data.js; the merge also dedupes by name.
(function () {
  function img(name, w, h) {
    return 'https://picsum.photos/seed/' + encodeURIComponent(name) + '/' + w + '/' + h;
  }
  function P(name, category, distance, entryFee, timings, duration, rating, desc) {
    return { name: name, category: category, distance: distance, entryFee: entryFee,
             timings: timings, duration: duration, rating: rating, desc: desc, image: img(name, 400, 300) };
  }
  function S(name, type, tier, priceMin, priceMax, rating, reviews, amenities, tags) {
    return { name: name, type: type, tier: tier, priceMin: priceMin, priceMax: priceMax,
             rating: rating, reviews: reviews, amenities: amenities, tags: tags,
             image: img(name, 400, 280), bookingUrl: '#' };
  }

  var EXTRA_PLACES = {
    kanatal: [
      P('Eco Park Dhanaulti','nature','25 km','₹50','9 AM – 6 PM','2 hrs',4.4,'Amber & Deodar eco-parks with zip-lines, swings and dense cedar walks.'),
      P('Nag Tibba Trek','trekking','35 km','Free','Day trek','1–2 days',4.7,'The Serpent Peak at 3,022m — the most popular weekend Himalayan trek near Delhi.'),
      P('Tehri Dam Viewpoint','scenic','55 km','Free','All day','1 hr',4.5,'Asia’s tallest dam; sweeping views over the turquoise Tehri reservoir.'),
      P('Kaudia Forest Zipline','adventure','3 km','₹300','9 AM – 5 PM','2 hrs',4.3,'Valley-crossing zipline and rope courses inside Kaudia reserve forest.'),
      P('Pantwari Village','town','30 km','Free','All day','2 hrs',4.1,'Base village for Nag Tibba; apple orchards and rustic Garhwali homestays.'),
      P('Apple Orchard Walk','nature','2 km','Free','Daytime','1–2 hrs',4.2,'Guided seasonal walks through Kanatal’s apple and pear orchards.')
    ],
    manali: [
      P('Jogini Waterfall','nature','3 km','Free','7 AM – 6 PM','2–3 hrs',4.5,'Forest trail from Vashisht to a sacred multi-tier waterfall.'),
      P('Vashisht Hot Springs','spiritual','3 km','Free','5 AM – 9 PM','1 hr',4.3,'Natural sulphur hot-water baths beside the ancient Vashisht temple.'),
      P('Great Himalayan National Park','wildlife','60 km','₹100','6 AM – 5 PM','Full day',4.7,'UNESCO biodiversity hotspot with trekking and rare Himalayan fauna.'),
      P('Gulaba Snow Point','scenic','25 km','Free','Day','Half day',4.4,'Snow-point before Rohtang; sledging and snow play in winter.'),
      P('Nehru Kund','nature','6 km','Free','All day','30 min',4.0,'Cold spring fed by Bhrigu Lake, named after Jawaharlal Nehru.'),
      P('Van Vihar Manali','nature','2 km','₹20','9 AM – 6 PM','1 hr',4.1,'Deodar park and boating lake in the heart of Manali town.')
    ],
    goa: [
      P('Fort Aguada','heritage','18 km','Free','9:30 AM – 6 PM','1–2 hrs',4.5,'17th-century Portuguese fort and lighthouse overlooking the Arabian Sea.'),
      P('Vagator Beach','beach','22 km','Free','All day','Half day',4.4,'Red-cliff beach with Chapora views, sunset parties and cafes.'),
      P('Arambol Beach','beach','50 km','Free','All day','Full day',4.5,'Bohemian north-Goa beach with drum circles and a sweet-water lagoon.'),
      P('Se Cathedral','heritage','10 km','Free','9 AM – 6 PM','1 hr',4.6,'One of Asia’s largest churches, part of Old Goa’s UNESCO ensemble.'),
      P('Mapusa Friday Market','cultural','13 km','Free','Fri, 8 AM – 6 PM','2 hrs',4.2,'Bustling local market for spices, produce and Goan sausages.'),
      P('Divar Island','town','12 km','Free','All day','3 hrs',4.3,'Sleepy ferry-only island of Portuguese villas and paddy fields.')
    ],
    coorg: [
      P('Namdroling Monastery','spiritual','34 km','Free','9 AM – 6 PM','2 hrs',4.7,'The Golden Temple at Bylakuppe, India’s largest Tibetan settlement.'),
      P('Tadiandamol Peak','trekking','35 km','Free','Day trek','5–6 hrs',4.6,'Coorg’s highest peak (1,748m) with shola forests and grasslands.'),
      P('Honnamana Kere Lake','scenic','25 km','₹10','8 AM – 6 PM','1 hr',4.2,'Serene sacred lake surrounded by coffee estates near Sulimalthe.'),
      P('Chelavara Falls','nature','38 km','₹15','8 AM – 5 PM','1–2 hrs',4.3,'Cascade tumbling over a cliff face, framed by the Western Ghats.'),
      P('Barapole River Rafting','adventure','40 km','₹1,500','Jun–Sep','3 hrs',4.6,'Grade III–IV white-water rafting through Kithu-Kakkattu rapids.'),
      P('Cauvery Nisargadhama','nature','30 km','₹20','9 AM – 5:30 PM','2 hrs',4.2,'River island reached by hanging bridge; bamboo groves and deer park.')
    ],
    udaipur: [
      P('Jagdish Temple','spiritual','1 km','Free','5 AM – 10 PM','45 min',4.5,'1651 Indo-Aryan temple to Lord Vishnu in the heart of the old city.'),
      P('Vintage Car Museum','cultural','2 km','₹350','9 AM – 9 PM','1 hr',4.3,'Royal Mewar collection of Rolls-Royces, Cadillacs and a 1939 Mercedes.'),
      P('Shilpgram Crafts Village','cultural','5 km','₹50','11 AM – 7 PM','2 hrs',4.2,'Living rural-arts complex of Rajasthani, Gujarati and Goan huts.'),
      P('Ahar Cenotaphs','heritage','3 km','Free','9 AM – 6 PM','1 hr',4.1,'Cluster of royal Mewar memorials and an archaeological museum.'),
      P('Karni Mata Ropeway','scenic','2 km','₹120','9 AM – 8 PM','1 hr',4.4,'Cable car to Machla Magra hill for sunset views over Lake Pichola.'),
      P('Eklingji & Nagda Temples','spiritual','22 km','Free','4:30 AM – 7 PM','2–3 hrs',4.5,'8th-century Shiva temple complex of the Mewar rulers.')
    ],
    rishikesh: [
      P('Neelkanth Mahadev Temple','spiritual','32 km','Free','5 AM – 7 PM','3 hrs',4.5,'Hilltop Shiva temple amid dense forest, a major pilgrimage site.'),
      P('Kunjapuri Devi Sunrise','scenic','25 km','Free','5 AM – 8 PM','2 hrs',4.5,'Sunrise Shakti-peeth with Himalayan and Doon valley panoramas.'),
      P('Vashishta Gufa','spiritual','22 km','Free','7 AM – 6 PM','2 hrs',4.4,'Ancient meditation cave of sage Vashishta on the Ganga’s banks.'),
      P('Patna Waterfall','nature','5 km','₹30','8 AM – 5 PM','2–3 hrs',4.2,'Forest-trail waterfall with limestone caves above Laxman Jhula.'),
      P('Trayambakeshwar Temple','spiritual','2 km','Free','6 AM – 8 PM','1 hr',4.3,'13-storey riverside temple (Tera Manzil) with valley views.'),
      P('Parmarth Niketan Ashram','spiritual','3 km','Free','Aarti 6 PM','1–2 hrs',4.6,'Largest Rishikesh ashram, famed for its riverbank Ganga Aarti.')
    ],
    darjeeling: [
      P('Japanese Peace Pagoda','spiritual','3 km','Free','4:30 AM – 6 PM','1 hr',4.5,'White Buddhist stupa with drumming prayers and ridge views.'),
      P('Himalayan Mountaineering Institute','cultural','3 km','₹100','8:30 AM – 4:30 PM','2 hrs',4.4,'Tenzing Norgay’s institute with an Everest museum and gear.'),
      P('Tenzing & Gombu Rock','adventure','5 km','₹20','8 AM – 4 PM','1 hr',4.1,'Natural rock-climbing crag named after the Everest pioneers.'),
      P('Observatory Hill (Mahakal)','spiritual','1 km','Free','5 AM – 7 PM','1 hr',4.3,'Hilltop Mahakal temple sacred to both Hindus and Buddhists.'),
      P('Tinchuley Village','town','32 km','Free','All day','Half day',4.4,'Organic-farming hamlet with orange orchards and Kanchenjunga views.'),
      P('Lamahatta Eco Park','nature','23 km','₹20','8 AM – 5 PM','1–2 hrs',4.3,'Forested terraced garden and a sacred pond on the Darjeeling–Kalimpong road.')
    ],
    munnar: [
      P('Kundala Lake','scenic','20 km','₹25','9 AM – 5 PM','1–2 hrs',4.3,'Star-shaped reservoir with pedal and shikara boating.'),
      P('Anamudi Peak Trek','trekking','20 km','₹200','7 AM – 4 PM','Half day',4.6,'South India’s highest peak (2,695m) inside Eravikulam NP.'),
      P('Echo Point','scenic','15 km','₹20','8 AM – 5 PM','1 hr',4.2,'Lakeside spot where shouts echo across the surrounding hills.'),
      P('Marayoor Sandalwood Forest','nature','40 km','₹50','9 AM – 5 PM','3 hrs',4.4,'India’s only natural sandalwood forest with dolmens and sugarcane jaggery.'),
      P('Blossom Hydel Park','nature','3 km','₹20','9 AM – 6 PM','1–2 hrs',4.1,'Riverside park with cycling tracks below the Munnar–Pallivasal dam.'),
      P('Kolukkumalai Tea Estate','scenic','32 km','₹500','6 AM – 4 PM','Half day',4.6,'World’s highest organic tea estate, reached by rugged jeep ride.')
    ],
    ladakh: [
      P('Diskit Monastery','spiritual','115 km','₹30','7 AM – 7 PM','1–2 hrs',4.7,'Nubra’s oldest gompa with a 32m Maitreya Buddha facing the valley.'),
      P('Lamayuru Moonland','scenic','125 km','Free','All day','2 hrs',4.6,'Lunar-like eroded landscape around Ladakh’s oldest monastery.'),
      P('Spituk Monastery','spiritual','8 km','Free','7 AM – 6 PM','1 hr',4.4,'Hilltop gompa over the Indus with a Kali shrine and Leh airport views.'),
      P('Sangam Confluence','scenic','35 km','Free','All day','1 hr',4.5,'Where the green Indus meets the muddy Zanskar near Nimmu.'),
      P('Hall of Fame Museum','cultural','4 km','₹50','9 AM – 6 PM','1–2 hrs',4.5,'Army museum honouring soldiers of the Indo-Pak wars and Siachen.'),
      P('Alchi Monastery','heritage','70 km','₹50','8 AM – 6 PM','1–2 hrs',4.6,'1,000-year-old monastery famed for its Kashmiri-style wall paintings.')
    ],
    hampi: [
      P('Hampi Bazaar','heritage','0.5 km','Free','All day','1–2 hrs',4.5,'Ancient market street stretching from Virupaksha to the monolithic Nandi.'),
      P('Tungabhadra Dam','scenic','18 km','₹20','10 AM – 6 PM','2 hrs',4.3,'Vast reservoir with musical-fountain gardens near Hospet.'),
      P('Achyutaraya Temple','heritage','2 km','Free','8:30 AM – 5:30 PM','1 hr',4.4,'Atmospheric ruined temple at the foot of Matanga Hill.'),
      P('Royal Enclosure','heritage','3 km','₹40','8:30 AM – 5:30 PM','1–2 hrs',4.5,'Mahanavami Dibba platform, stepped tank and palace foundations.'),
      P('Hazara Rama Temple','heritage','3 km','Free','8:30 AM – 5:30 PM','45 min',4.4,'Royal chapel walled with thousands of Ramayana relief carvings.'),
      P('Anjanadri Hill','spiritual','5 km','Free','6 AM – 6 PM','2 hrs',4.5,'575-step climb to the believed birthplace of Lord Hanuman.')
    ],
    ooty: [
      P('Pykara Falls & Lake','nature','19 km','₹50','9 AM – 5:30 PM','2 hrs',4.4,'Forest-fed falls and a boating lake amid Toda settlements.'),
      P('Emerald Lake','scenic','25 km','Free','All day','1–2 hrs',4.5,'Tranquil, less-crowded lake surrounded by tea estates and prairies.'),
      P('Sims Park Coonoor','nature','19 km','₹30','9 AM – 6:30 PM','1–2 hrs',4.3,'Half-natural botanical park on a Coonoor slope with rare conifers.'),
      P('Dolphin’s Nose','scenic','22 km','₹10','9 AM – 5 PM','1 hr',4.4,'Coonoor cliff viewpoint over Catherine Falls and the Coonoor valley.'),
      P('Tea Factory & Museum','cultural','5 km','₹20','9 AM – 6 PM','1 hr',4.2,'Working factory showing the journey from leaf to cup, with tastings.'),
      P('Wax World Ooty','cultural','3 km','₹110','9:30 AM – 7:30 PM','1 hr',4.0,'Heritage bungalow of life-size wax figures of Indian icons.')
    ],
    varanasi: [
      P('New Vishwanath Temple (BHU)','spiritual','7 km','Free','4 AM – 12, 1 – 9 PM','1–2 hrs',4.5,'Marble Birla temple inside the leafy Banaras Hindu University campus.'),
      P('Tulsi Manas Temple','spiritual','5 km','Free','5:30 AM – 12, 3:30 – 9 PM','1 hr',4.4,'Marble temple where Tulsidas wrote the Ramcharitmanas, its verses on the walls.'),
      P('Durga Kund Temple','spiritual','5 km','Free','5 AM – 12, 2 – 8 PM','1 hr',4.3,'18th-century red “Monkey Temple” beside a sacred tank.'),
      P('Bharat Mata Temple','cultural','4 km','Free','9:30 AM – 6 PM','45 min',4.2,'Temple housing a giant marble relief map of undivided India.'),
      P('Chunar Fort','heritage','40 km','₹25','9 AM – 5 PM','2–3 hrs',4.1,'Strategic Ganga-side fort linked to Sher Shah Suri and the Mughals.'),
      P('Man Mandir Observatory','heritage','1 km','₹25','9 AM – 5 PM','1 hr',4.3,'Jantar Mantar-style stone observatory built by Jai Singh II on the ghat.')
    ],
    spiti: [
      P('Tabo Monastery','spiritual','47 km','Free','6 AM – 7 PM','1–2 hrs',4.7,'1,000-year-old “Ajanta of the Himalayas” with priceless murals.'),
      P('Langza Buddha Statue','scenic','14 km','Free','All day','1–2 hrs',4.6,'Giant Buddha overlooking a fossil-rich valley below Chau Chau Kang Nilda.'),
      P('Mudh Village (Pin Valley)','town','55 km','Free','All day','Half day',4.5,'Last motorable village of the Pin valley and a trekking trailhead.'),
      P('Chicham Bridge','scenic','22 km','Free','All day','30 min',4.5,'Asia’s highest suspension bridge spanning a deep gorge near Kibber.'),
      P('Gette Village Viewpoint','scenic','20 km','Free','All day','1 hr',4.3,'Tiny hamlet above Kibber with sweeping Spiti valley vistas.'),
      P('Nako Lake','scenic','110 km','Free','All day','1–2 hrs',4.4,'High village lake ringed by willows on the Spiti–Kinnaur road.')
    ],
    jaisalmer: [
      P('Bada Bagh Cenotaphs','heritage','6 km','₹100','8 AM – 6 PM','1 hr',4.3,'Royal garden of golden chhatris, magical at sunset.'),
      P('Salim Singh Ki Haveli','heritage','1.5 km','₹50','8 AM – 7 PM','1 hr',4.2,'Peacock-arched mansion of a once-powerful Jaisalmer prime minister.'),
      P('Nathmal Ki Haveli','heritage','1 km','Free','8 AM – 7 PM','45 min',4.3,'Asymmetric 19th-century haveli carved by two rival brothers.'),
      P('Jain Temples (Fort)','spiritual','1 km','₹200','7 AM – 12 PM','1–2 hrs',4.6,'Seven interconnected Dilwara-style temples inside the living fort.'),
      P('Tanot Mata Temple','spiritual','120 km','Free','6 AM – 7 PM','Half day',4.5,'Border temple famed for surviving unexploded 1965/71 war shells.'),
      P('Vyas Chhatri','scenic','2 km','₹50','7 AM – 7 PM','1 hr',4.4,'Sandstone cenotaphs and Jaisalmer’s premier sunset viewpoint.')
    ],
    mcleodganj: [
      P('Bhagsunag Temple','spiritual','2 km','Free','6 AM – 8 PM','1 hr',4.3,'Ancient Shiva temple with spring-fed pools below Bhagsu falls.'),
      P('St. John in the Wilderness','heritage','3 km','Free','9 AM – 5 PM','45 min',4.3,'Neo-Gothic stone church of 1852 set amid deodar forest.'),
      P('Naddi Sunset Point','scenic','4 km','Free','All day','1 hr',4.4,'Viewpoint over the Kangra valley and the snow-clad Dhauladhars.'),
      P('Masroor Rock Temples','heritage','40 km','₹25','8 AM – 6 PM','2 hrs',4.4,'8th-century monolithic rock-cut temples, the “Himalayan Ellora.”'),
      P('War Memorial Dharamsala','cultural','9 km','₹10','9 AM – 6 PM','1 hr',4.2,'Pine-shaded memorial to Himachali soldiers, with a café and museum.'),
      P('Dharamshala Cricket Stadium','cultural','10 km','₹50','Match days','1 hr',4.5,'The world’s most scenic cricket ground, framed by the Dhauladhars.')
    ],
    varkala: [
      P('Varkala North Cliff','scenic','0.5 km','Free','All day','2 hrs',4.6,'Iconic red-laterite cliff promenade lined with cafes above the sea.'),
      P('Edava Beach','beach','8 km','Free','All day','Half day',4.3,'Quiet cliff-and-sand beach north of Varkala, great for sunsets.'),
      P('Ponnumthuruthu Island','scenic','12 km','₹100','9 AM – 5 PM','2 hrs',4.4,'“Golden Island” temple reached by a backwater boat ride.'),
      P('Kaduvayil Thangal Dargah','spiritual','9 km','Free','All day','1 hr',4.2,'Revered hilltop shrine drawing pilgrims of all faiths.'),
      P('Sarkara Devi Temple','spiritual','10 km','Free','4 AM – 8 PM','1 hr',4.3,'Famous Bhadrakali temple known for its Kaliyoot festival.'),
      P('Thiruvambadi (Black) Beach','beach','1 km','Free','All day','Half day',4.4,'Secluded black-sand cove tucked below the northern cliff.')
    ],
    kaziranga: [
      P('Eastern Range (Agoratoli)','wildlife','40 km','₹800','7 AM – 3 PM','Half day',4.5,'Birding paradise around the Sohola Beel wetlands.'),
      P('Burapahar Range (Ghorakati)','wildlife','45 km','₹800','7 AM – 3 PM','Half day',4.3,'Hilly western range with elephants and rich forest cover.'),
      P('Panbari Reserve Forest','nature','30 km','₹200','7 AM – 4 PM','Half day',4.2,'Hoolock-gibbon and orchid trail just east of Kaziranga.'),
      P('Kakochang Waterfall','nature','60 km','₹20','8 AM – 5 PM','2 hrs',4.1,'Forest waterfall near Numaligarh ruins amid coffee and rubber estates.'),
      P('Deopahar Ruins','heritage','55 km','₹20','8 AM – 5 PM','1–2 hrs',4.0,'Ancient stone temple ruins on a forested hill near Numaligarh.'),
      P('Numaligarh Tea Estates','nature','50 km','Free','Daytime','2 hrs',4.2,'Rolling Assam tea gardens ideal for plantation walks and photos.')
    ],
    'rann-of-kutch': [
      P('Road to Heaven (Khadir Bet)','scenic','85 km','Free','All day','2 hrs',4.7,'Causeway slicing through the white salt desert toward Dholavira.'),
      P('Vijay Vilas Palace','heritage','64 km','₹40','9 AM – 6 PM','1–2 hrs',4.4,'1920s royal summer palace at Mandvi, a Bollywood favourite.'),
      P('Lakhpat Fort','heritage','135 km','Free','All day','2 hrs',4.2,'Ghost-town fort with 7-km walls where the Indus once met the sea.'),
      P('Narayan Sarovar','spiritual','120 km','Free','6 AM – 8 PM','1–2 hrs',4.3,'One of Hinduism’s five holy lakes, beside a chinkara sanctuary.'),
      P('Hodka Village','cultural','63 km','Free','All day','2 hrs',4.5,'Banni-grassland village famed for mud-mirror Bhunga huts and crafts.'),
      P('Aina Mahal Bhuj','heritage','0 km','₹20','9 AM – 12, 3 – 6 PM','1 hr',4.2,'18th-century “Hall of Mirrors” palace museum in old Bhuj.')
    ]
  };

  var EXTRA_STAYS = {
    kanatal: [
      S('OYO Home Pinewood Retreat','oyo','budget',1100,1700,4.0,212,['WiFi','Parking','Breakfast','Mountain View'],['OYO Verified','Couple Friendly']),
      S('Airbnb: Cedar Wood Cottage','airbnb homestay','good',2400,3300,4.7,96,['Full Kitchen','Fireplace','Valley View','Self Check-in'],['Airbnb Superhost','Entire Home']),
      S('Club Mahindra Kanatal','resort','best',8000,12000,4.5,540,['Pool','Spa','Kids Club','Multi-cuisine','Bonfire'],['Family Resort','All Amenities']),
      S('Sterling Kanatal','resort','better',5000,7500,4.4,388,['Restaurant','Activity Centre','Mountain View','WiFi'],['Trusted Chain','Scenic'])
    ],
    manali: [
      S('OYO Townhouse Mall Road','oyo','good',1800,2800,4.1,640,['WiFi','Room Service','Heater','Central'],['OYO Verified','Prime Location']),
      S('Airbnb: Riverside Wooden Chalet','airbnb cottage','better',4500,6500,4.8,154,['Full Kitchen','Beas River View','Fireplace','Balcony'],['Airbnb Superhost','Entire Home']),
      S('Radisson Blu Manali','5-star hotel','luxury',13000,19000,4.6,872,['Pool','Spa','Multiple Restaurants','Gym','WiFi'],['Radisson','River Facing']),
      S('The Himalayan Manali','castle resort','best',9000,14000,4.7,512,['Gothic Architecture','Spa','Orchard','Fine Dining'],['Iconic Property','Mughal Style'])
    ],
    goa: [
      S('OYO Flagship Calangute Stay','oyo','good',1900,3000,4.0,1120,['Pool','WiFi','AC','Near Beach'],['OYO Verified','Beach Belt']),
      S('Airbnb: Portuguese Villa Assagao','airbnb villa','best',9000,14000,4.9,208,['Private Pool','Full Kitchen','Garden','Staff'],['Airbnb Luxe','Entire Villa']),
      S('Taj Fort Aguada Resort & Spa','5-star resort','extra_luxury',26000,45000,4.8,1640,['Private Beach','Spa','Sea-facing Pool','5 Restaurants'],['Taj','Clifftop Fort']),
      S('W Goa','5-star resort','extra_luxury',24000,42000,4.7,980,['Beachfront','Rooftop Bar','Spa','DJ Nights'],['Marriott','Vagator Beach'])
    ],
    coorg: [
      S('OYO Home Madikeri Mist','oyo','budget',1300,2000,4.0,184,['WiFi','Breakfast','Parking','Estate View'],['OYO Verified','Budget']),
      S('Airbnb: Coffee Estate Bungalow','airbnb estate stay','better',5000,7500,4.8,132,['Plantation Walk','Full Kitchen','Bonfire','Pet Friendly'],['Airbnb Superhost','Entire Home']),
      S('Taj Madikeri Resort & Spa','5-star resort','extra_luxury',22000,38000,4.8,760,['Rainforest Setting','Infinity Pool','Spa','Fine Dining'],['Taj','Rainforest']),
      S('Club Mahindra Madikeri','resort','best',8500,12500,4.4,610,['Pool','Activity Centre','Multi-cuisine','Kids Club'],['Family Resort','Hilltop'])
    ],
    udaipur: [
      S('OYO Townhouse Lake District','oyo','good',2000,3200,4.1,540,['WiFi','Rooftop','AC','Lake Walk'],['OYO Verified','Old City']),
      S('Airbnb: Lake-view Haveli Room','airbnb haveli','better',4500,6800,4.8,176,['Pichola View','Rooftop Cafe','Heritage Decor'],['Airbnb Superhost','Lake Facing']),
      S('The Oberoi Udaivilas','5-star resort','extra_luxury',55000,120000,4.9,1480,['Private Pools','Spa','Lake Views','Gourmet'],['Oberoi','Worlds Best']),
      S('Radisson Blu Udaipur Palace Resort','5-star resort','luxury',12000,18000,4.5,690,['Lakeview Pool','Spa','Multi-cuisine','Gym'],['Radisson','Fateh Sagar'])
    ],
    rishikesh: [
      S('OYO Rooms Tapovan','oyo','budget',900,1600,3.9,720,['WiFi','Cafe','Yoga Nearby','Parking'],['OYO Verified','Backpacker']),
      S('Airbnb: Ganga-view Studio','airbnb apartment','good',2600,3800,4.7,138,['River View','Kitchenette','Balcony','Self Check-in'],['Airbnb Superhost','Entire Place']),
      S('Aloha on the Ganges','resort','best',9000,14000,4.5,624,['River Beach','Pool','Spa','Multi-cuisine'],['Riverside','Wellness']),
      S('Ananda in the Himalayas','luxury spa resort','extra_luxury',38000,70000,4.9,560,['Destination Spa','Yoga','Palace Estate','Gourmet'],['World-Class Spa','Maharaja Estate'])
    ],
    darjeeling: [
      S('OYO Mall Road Darjeeling','oyo','budget',1200,2000,4.0,430,['WiFi','Heater','Tea','Central'],['OYO Verified','Mall Road']),
      S('Airbnb: Colonial Heritage Bungalow','airbnb homestay','better',4200,6000,4.8,108,['Kanchenjunga View','Fireplace','Full Kitchen','Garden'],['Airbnb Superhost','Entire Home']),
      S('Mayfair Darjeeling','heritage resort','best',9500,15000,4.6,540,['Spa','Tea Lounge','Heritage Decor','Gourmet'],['Mayfair','Maharaja Villa']),
      S('Windamere Hotel','heritage hotel','better',7000,11000,4.5,360,['Raj-era Charm','Log Fires','High Tea','Observatory Hill'],['Iconic','Colonial'])
    ],
    munnar: [
      S('OYO Munnar Town Stay','oyo','budget',1200,1900,3.9,360,['WiFi','Breakfast','Parking','Hill View'],['OYO Verified','Town Centre']),
      S('Airbnb: Tea Estate Cottage','airbnb cottage','good',2800,4200,4.8,142,['Plantation View','Full Kitchen','Bonfire','Trek Guide'],['Airbnb Superhost','Entire Home']),
      S('Tea County Munnar (KTDC)','resort','better',5500,8000,4.4,488,['Garden Cottages','Restaurant','Plantation Walk'],['Govt Resort','Tea Gardens']),
      S('Fragrant Nature Munnar','5-star resort','best',9000,14000,4.5,372,['Infinity Pool','Spa','Valley View','Fine Dining'],['Luxury','Hilltop'])
    ],
    ladakh: [
      S('OYO Leh Market','oyo','good',1800,2800,3.9,290,['WiFi','Heater','Oxygen on Call','Central'],['OYO Verified','Leh Bazaar']),
      S('Airbnb: Ladakhi Family Homestay','airbnb homestay','budget',1600,2600,4.8,124,['Home Meals','Mountain View','Cultural Stay','Self Check-in'],['Airbnb Superhost','Authentic']),
      S('The Grand Dragon Ladakh','5-star hotel','luxury',14000,22000,4.7,640,['Oxygen-enriched','Spa','Restaurant','Mountain View'],['All-season','Luxury']),
      S('Nubra Ecolodge','eco resort','better',6000,9000,4.5,210,['Organic Garden','Dunes Nearby','Solar Powered','Local Cuisine'],['Eco Stay','Nubra Valley'])
    ],
    hampi: [
      S('OYO Hospet Stay','oyo','budget',1100,1800,3.9,260,['WiFi','AC','Restaurant','Parking'],['OYO Verified','Near Ruins']),
      S('Airbnb: Riverside Hut Hippie Island','airbnb hut','good',2200,3400,4.7,180,['Paddy View','Hammock','Cafe','Cycle Rental'],['Airbnb Superhost','Bohemian']),
      S('Evolve Back Hampi','heritage resort','extra_luxury',28000,46000,4.9,520,['Vijayanagara Architecture','Private Pools','Spa','Gourmet'],['Award Winning','Luxury Heritage']),
      S('Heritage Resort Hampi','resort','best',8000,12000,4.4,340,['Pool','Hut Cottages','Restaurant','Ruins Tour'],['Comfort','Near Vittala'])
    ],
    ooty: [
      S('OYO Charing Cross Ooty','oyo','budget',1300,2100,4.0,410,['WiFi','Heater','Breakfast','Central'],['OYO Verified','Town Centre']),
      S('Airbnb: Colonial Cottage Coonoor','airbnb cottage','better',4000,6000,4.8,126,['Tea Garden View','Fireplace','Full Kitchen','Garden'],['Airbnb Superhost','Entire Home']),
      S('Savoy Hotel Ooty (IHCL)','heritage hotel','best',9000,14000,4.6,560,['Colonial Cottages','Log Fires','Spa','Fine Dining'],['Taj SeleQtions','1829 Heritage']),
      S('Sterling Ooty Fern Hill','resort','better',5500,8500,4.3,470,['Heritage Block','Restaurant','Activities','Gardens'],['Trusted Chain','Hilltop'])
    ],
    varanasi: [
      S('OYO Townhouse Cantt','oyo','good',1700,2700,4.1,690,['WiFi','AC','Restaurant','Near Station'],['OYO Verified','Cantonment']),
      S('Airbnb: Ghat-facing Haveli Room','airbnb haveli','better',3800,5600,4.7,150,['Ganga View','Rooftop','Heritage Decor','Aarti Access'],['Airbnb Superhost','Riverfront']),
      S('Taj Ganges Varanasi','5-star hotel','luxury',12000,18000,4.5,820,['Pool','Spa','Multi-cuisine','Garden'],['Taj','City Luxury']),
      S('BrijRama Palace','heritage hotel','extra_luxury',24000,42000,4.8,540,['On Darbhanga Ghat','Boat Access','Heritage Suites','Fine Dining'],['Riverfront Palace','1812 Heritage'])
    ],
    spiti: [
      S('OYO Kaza Valley Stay','oyo','budget',1300,2100,3.8,140,['WiFi','Heater','Breakfast','Valley View'],['OYO Verified','Kaza']),
      S('Airbnb: Langza Mud-house Homestay','airbnb homestay','budget',1500,2400,4.8,98,['Home Meals','Buddha View','Cultural Stay','Stargazing'],['Airbnb Superhost','Authentic']),
      S('Spiti Sarai Kaza','boutique hotel','better',6000,9000,4.6,210,['Mountain View','Local Cuisine','Solar Heated','Library'],['Boutique','Eco Friendly']),
      S('The Himalayan Brothers Homestay','homestay','good',2500,3800,4.7,176,['Guided Treks','Home Meals','Bonfire','Cultural Immersion'],['Local Hosts','Adventure'])
    ],
    jaisalmer: [
      S('OYO Fort View Jaisalmer','oyo','budget',1200,2000,4.0,380,['WiFi','Rooftop','AC','Fort View'],['OYO Verified','Near Fort']),
      S('Airbnb: Heritage Haveli inside Fort','airbnb haveli','good',2800,4400,4.7,164,['Living Fort Stay','Carved Rooms','Rooftop Cafe','Heritage'],['Airbnb Superhost','Inside Sonar Quila']),
      S('Suryagarh Jaisalmer','heritage resort','extra_luxury',24000,40000,4.8,610,['Fortress Architecture','Spa','Pool','Desert Excursions'],['Luxury Heritage','Award Winning']),
      S('Mirvana Desert Camp (Sam)','luxury tent','better',6000,9500,4.5,290,['Swiss Tents','Cultural Shows','Camel Safari','All Meals'],['Desert Camp','Sam Dunes'])
    ],
    mcleodganj: [
      S('OYO Temple Road McLeodganj','oyo','budget',1100,1800,4.0,330,['WiFi','Heater','Cafe','Near Temple'],['OYO Verified','Central']),
      S('Airbnb: Dhauladhar-view Studio','airbnb apartment','good',2600,3900,4.8,140,['Mountain View','Kitchenette','Balcony','Self Check-in'],['Airbnb Superhost','Entire Place']),
      S('Fortune Park Moksha (ITC)','4-star hotel','best',8000,12000,4.5,520,['Valley View','Restaurant','Spa','WiFi'],['ITC Fortune','Reliable']),
      S('Hotel Bhagsu (HPTDC)','hotel','better',4500,6500,4.2,360,['Lawns','Restaurant','Central','Parking'],['Govt Hotel','Value'])
    ],
    varkala: [
      S('OYO North Cliff Varkala','oyo','budget',1300,2200,4.0,410,['WiFi','Cliff Walk','AC','Cafe'],['OYO Verified','North Cliff']),
      S('Airbnb: Cliffside Cottage','airbnb cottage','good',2800,4200,4.8,158,['Sea View','Hammock','Full Kitchen','Sunset Deck'],['Airbnb Superhost','Entire Home']),
      S('Hindustan Beach Retreat','resort','best',8000,12000,4.4,560,['Sea-facing Pool','Spa','Multi-cuisine','Cliff Access'],['Beachfront','Popular']),
      S('Kadaltheeram Ayurvedic Resort','ayurveda resort','better',5500,8500,4.5,320,['Ayurveda Spa','Yoga','Beach Access','Organic Food'],['Wellness','Ayurvedic'])
    ],
    kaziranga: [
      S('OYO Kohora Gateway','oyo','budget',1200,2000,3.9,190,['WiFi','Restaurant','Safari Desk','Parking'],['OYO Verified','Park Gate']),
      S('Airbnb: Bamboo Eco Cottage','airbnb cottage','good',2600,3900,4.7,112,['Tea Garden View','Local Meals','Birding','Self Check-in'],['Airbnb Superhost','Eco Stay']),
      S('IORA - The Retreat Kaziranga','resort','best',9000,14000,4.6,540,['Pool','Spa','Safari Desk','Multi-cuisine'],['Best in Kaziranga','Luxury']),
      S('Diphlu River Lodge','eco lodge','luxury',16000,26000,4.8,310,['Riverfront Cottages','Naturalist Guides','All Meals','Royal-stayed'],['Eco Luxury','Iconic'])
    ],
    'rann-of-kutch': [
      S('OYO Bhuj City Stay','oyo','budget',1100,1900,3.9,260,['WiFi','AC','Restaurant','Travel Desk'],['OYO Verified','Bhuj']),
      S('Airbnb: Bhunga Mud-hut Hodka','airbnb hut','good',2600,4000,4.8,134,['Traditional Bhunga','Mirror Work','Local Meals','Stargazing'],['Airbnb Superhost','Cultural']),
      S('Toran Rann Resort (Dhordo)','resort','better',6000,9000,4.4,420,['Near White Rann','AC Cottages','Cultural Shows','All Meals'],['Gateway to Rann','Comfort']),
      S('Infinity Rann of Kutch','luxury tent','best',9000,14000,4.6,360,['Premium Tents','Pool','Spa','Desert Excursions'],['Luxury Camp','White Desert'])
    ]
  };

  if (typeof DESTINATIONS === 'undefined') return;
  DESTINATIONS.forEach(function (d) {
    if (EXTRA_PLACES[d.id]) {
      var havePlace = {};
      d.places.forEach(function (p) { havePlace[p.name] = true; });
      d.places = d.places.concat(EXTRA_PLACES[d.id].filter(function (p) { return !havePlace[p.name]; }));
    }
    if (EXTRA_STAYS[d.id]) {
      var haveStay = {};
      d.stays.forEach(function (s) { haveStay[s.name] = true; });
      d.stays = d.stays.concat(EXTRA_STAYS[d.id].filter(function (s) { return !haveStay[s.name]; }));
    }
  });
})();
