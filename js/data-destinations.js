// IndiaExplore — 85+ additional travel destinations.
// Loaded AFTER data.js (and data-extra.js). Each destination carries real lat/lng so the
// live-weather widget and the map work automatically. Stays are generated per destination
// from OYO / Airbnb / famous-chain templates. Schema matches data.js exactly.
(function () {
  if (typeof DESTINATIONS === 'undefined') return;

  function img(name, w, h) { return 'https://picsum.photos/seed/' + encodeURIComponent(name) + '/' + w + '/' + h; }

  // Compact place factory (timings default; rating optional)
  function pl(name, cat, dist, fee, dur, rating, desc) {
    return { name: name, category: cat, distance: dist, entryFee: fee, timings: 'Varies by season',
             duration: dur, rating: rating, desc: desc, image: img(name, 400, 300) };
  }
  function stay(name, type, tier, lo, hi, rating, reviews, amenities, tags) {
    return { name: name, type: type, tier: tier, priceMin: lo, priceMax: hi, rating: rating,
             reviews: reviews, amenities: amenities, tags: tags, image: img(name, 400, 280), bookingUrl: '#' };
  }

  // Generate a realistic spread of 4 stays (OYO + Airbnb + mid + famous-by-type)
  function stdStays(name, base, type) {
    var b = Math.max(900, base);
    var famous, ftier;
    if (type === 'heritage' || type === 'beach') { famous = 'Marriott ' + name; ftier = 'luxury'; }
    else if (type === 'hill_station') { famous = 'Sterling ' + name; ftier = 'best'; }
    else if (type === 'wildlife') { famous = 'Jungle Lodges ' + name; ftier = 'best'; }
    else if (type === 'spiritual') { famous = 'Fortune Park ' + name; ftier = 'best'; }
    else { famous = 'Radisson ' + name; ftier = 'best'; }
    var r = function (x) { return Math.round(x / 50) * 50; };
    return [
      stay('OYO ' + name + ' Stay', 'oyo', 'budget', r(b), r(b * 1.6), 4.0, 320,
        ['WiFi', 'AC', 'Parking', 'Breakfast'], ['OYO Verified', 'Value']),
      stay('Airbnb: Stay in ' + name, 'airbnb apartment', 'good', r(b * 1.9), r(b * 2.7), 4.7, 130,
        ['Full Kitchen', 'Self Check-in', 'Local Host', 'WiFi'], ['Airbnb Superhost', 'Entire Place']),
      stay(name + ' Grand Hotel', 'hotel', 'better', r(b * 3), r(b * 4.5), 4.4, 430,
        ['Pool', 'Restaurant', 'Room Service', 'Gym'], ['Popular', 'Central']),
      stay(famous, 'resort', ftier, r(b * 6), r(b * 10), 4.7, 560,
        ['Pool', 'Spa', 'Fine Dining', 'Concierge'], ['Famous Chain', 'Premium'])
    ];
  }

  var TYPE_LABEL = { hill_station: 'hill station', beach: 'beach town', heritage: 'heritage city',
    wildlife: 'wildlife reserve', spiritual: 'spiritual town', adventure: 'adventure base' };

  // D(id,name,state,region,type,lat,lng,fromDelhi,bestMonths,months,tSummer,tWinter,minPrice,rating,reviews,alt,features,places,extra)
  function D(id, name, state, region, type, lat, lng, fromDelhi, bestMonths, months, tSummer, tWinter, minPrice, rating, reviews, alt, features, places, extra) {
    extra = extra || {};
    // Generate stays first, then derive the displayed "From ₹" price from the
    // cheapest actual stay so the card price always matches a real listing.
    var stays = stdStays(name, minPrice, type);
    var cheapest = stays.reduce(function (m, s) { return Math.min(m, s.priceMin); }, Infinity);
    minPrice = cheapest;   // card "From ₹" must equal a real, bookable stay
    return {
      id: id, name: name, state: state, region: region, type: type,
      badge: extra.badge || 'Popular', tagline: extra.tagline || (name + ' — ' + (TYPE_LABEL[type] || 'getaway') + ' of ' + state),
      shortDesc: extra.short || (name + ' is a much-loved ' + (TYPE_LABEL[type] || 'destination') + ' in ' + state + ', known for ' + features.slice(0, 2).join(' and ').toLowerCase() + '.'),
      description: extra.desc || (name + ', in ' + region + ', ' + state + ', is one of India’s favourite ' + (TYPE_LABEL[type] || 'destinations') + '. Visitors come for its ' + features.join(', ').toLowerCase() + ', with the best months being ' + bestMonths + '.'),
      altitude: alt || null,
      bestMonths: bestMonths, bestMonthsList: months,
      tempSummer: tSummer, tempWinter: tWinter,
      rating: rating, reviewCount: reviews, minPrice: minPrice, distanceFromDelhi: fromDelhi,
      image: img(id, 800, 500), heroImage: img(id + '-hero', 1400, 700),
      features: features,
      lat: lat, lng: lng,
      places: places,
      stays: stays,
      routes: [
        { from: 'Delhi', distance: fromDelhi, byCar: Math.max(1, Math.round(fromDelhi / 60)) + '–' + Math.round(fromDelhi / 45) + ' hrs', byTrain: 'Rail to ' + name + ' / nearest junction', byAir: 'Fly to nearest airport + taxi', via: extra.via || 'National highway network' },
        { from: (extra.hub || 'State capital'), distance: extra.hubKm || Math.round(fromDelhi / 3), byCar: Math.max(1, Math.round((extra.hubKm || fromDelhi / 3) / 50)) + ' hrs', byTrain: 'Direct/connecting trains', byAir: 'Nearest airport', via: 'Regional roads' }
      ],
      nearestAirport: extra.airport || { name: (extra.airportName || (name + ' / nearest airport')), distance: extra.airportKm || 30 },
      nearestRailway: extra.railway || { name: (extra.railwayName || (name + ' Railway Station')), distance: extra.railwayKm || 5 },
      roadNote: extra.road || 'Roads are generally good; check seasonal/monsoon conditions before high-altitude or remote stretches.'
    };
  }

  var NEW = [
    // ───────── Rajasthan ─────────
    D('jaipur','Jaipur','Rajasthan','Aravalli Plains','heritage',26.9124,75.7873,268,'Oct – Mar',[10,11,12,1,2,3],'25–40°C','8–25°C',900,4.6,52000,431,['Forts','Palaces','Pink City','Bazaars'],[
      pl('Hawa Mahal','heritage','City Centre','₹50','1 hr',4.5,'The five-storey Palace of Winds with 953 honeycomb windows.'),
      pl('Amber Fort','heritage','11 km','₹100','2–3 hrs',4.7,'Hilltop Rajput fort with the dazzling Sheesh Mahal mirror palace.'),
      pl('City Palace','heritage','City Centre','₹200','2 hrs',4.5,'Royal residence of courtyards, museums and the Chandra Mahal.'),
      pl('Jantar Mantar','heritage','City Centre','₹50','1 hr',4.4,'UNESCO 18th-century observatory with the world’s largest stone sundial.')]),
    D('jodhpur','Jodhpur','Rajasthan','Marwar','heritage',26.2389,73.0243,597,'Oct – Mar',[10,11,12,1,2,3],'26–42°C','10–27°C',900,4.6,31000,231,['Blue City','Mehrangarh','Forts','Markets'],[
      pl('Mehrangarh Fort','heritage','City Centre','₹100','2–3 hrs',4.8,'One of India’s largest forts, towering 122m over the blue city.'),
      pl('Jaswant Thada','heritage','1 km','₹30','45 min',4.4,'Marble royal cenotaph beside a lake, the “Taj of Marwar”.'),
      pl('Umaid Bhawan Palace','heritage','3 km','₹60','1 hr',4.5,'Art-deco royal palace, part museum and part Taj hotel.')]),
    D('pushkar','Pushkar','Rajasthan','Ajmer','spiritual',26.4899,74.5511,398,'Oct – Mar',[10,11,12,1,2,3],'25–38°C','8–24°C',900,4.4,18000,510,['Holy Lake','Camel Fair','Brahma Temple','Cafes'],[
      pl('Pushkar Lake','spiritual','Town Centre','Free','1 hr',4.5,'Sacred lake ringed by 52 bathing ghats and temples.'),
      pl('Brahma Temple','spiritual','Town Centre','Free','1 hr',4.5,'One of the very few temples in the world dedicated to Lord Brahma.'),
      pl('Savitri Mata Temple','scenic','2 km','₹140','2 hrs',4.4,'Hilltop temple reached by ropeway with sweeping desert views.')]),
    D('mount-abu','Mount Abu','Rajasthan','Aravalli Range','hill_station',24.5926,72.7156,747,'Oct – Mar',[10,11,12,1,2,3],'23–34°C','5–20°C',1000,4.4,21000,1220,['Only Hill Station','Dilwara Temples','Nakki Lake'],[
      pl('Dilwara Jain Temples','heritage','3 km','Free','1–2 hrs',4.7,'Exquisite 11th-13th century marble Jain temples.'),
      pl('Nakki Lake','scenic','Town Centre','Free','1 hr',4.3,'Sacred boating lake said to be dug by gods with their nails.'),
      pl('Guru Shikhar','scenic','15 km','Free','1 hr',4.4,'Highest peak of the Aravallis at 1,722m.')]),
    D('ranthambore','Ranthambore','Rajasthan','Sawai Madhopur','wildlife',26.0173,76.5026,381,'Oct – Jun',[10,11,12,1,2,3,4,5,6],'28–44°C','10–28°C',2500,4.6,24000,null,['Tigers','Safari','Fort','Lakes'],[
      pl('Tiger Safari (Zone 1-6)','wildlife','Park','₹1,500','3 hrs',4.7,'Premier reserve to spot Royal Bengal tigers in the wild.'),
      pl('Ranthambore Fort','heritage','12 km','₹25','2 hrs',4.5,'10th-century UNESCO hill fort inside the tiger reserve.'),
      pl('Padam Talao','scenic','Park','Included','1 hr',4.4,'Largest lake in the park, famed for the Jogi Mahal backdrop.')]),
    D('bikaner','Bikaner','Rajasthan','Thar Desert','heritage',28.0229,73.3119,449,'Oct – Mar',[10,11,12,1,2,3],'27–42°C','8–25°C',900,4.3,12000,242,['Junagarh Fort','Camels','Bhujia','Havelis'],[
      pl('Junagarh Fort','heritage','City Centre','₹100','2 hrs',4.6,'Unconquered 16th-century fort with opulent painted palaces.'),
      pl('Karni Mata Temple','spiritual','30 km','Free','1 hr',4.3,'The famous “Rat Temple” of Deshnoke with 25,000 holy rats.'),
      pl('National Research Centre on Camel','wildlife','8 km','₹50','1 hr',4.1,'India’s premier camel breeding farm and museum.')]),
    // ───────── Uttarakhand ─────────
    D('nainital','Nainital','Uttarakhand','Kumaon','hill_station',29.3919,79.4542,300,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'14–27°C','2–16°C',1200,4.4,38000,2084,['Naini Lake','Boating','Mall Road','Snow Views'],[
      pl('Naini Lake','scenic','Town Centre','₹210','1 hr',4.5,'Emerald crescent lake at the heart of town, perfect for boating.'),
      pl('Naina Devi Temple','spiritual','Town Centre','Free','30 min',4.4,'Lakeside Shakti-peeth temple, the soul of Nainital.'),
      pl('Snow View Point','scenic','3 km','₹300','1 hr',4.4,'Cable-car ride to Himalayan panoramas of Nanda Devi.')]),
    D('mussoorie','Mussoorie','Uttarakhand','Garhwal','hill_station',30.4598,78.0644,290,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'14–30°C','1–15°C',1300,4.4,41000,2005,['Queen of Hills','Kempty Falls','Mall Road'],[
      pl('Kempty Falls','nature','15 km','₹50','1–2 hrs',4.2,'Mussoorie’s most popular tiered waterfall with bathing pools.'),
      pl('Gun Hill','scenic','2 km','₹150','1 hr',4.3,'Second-highest point, reached by ropeway, with Doon valley views.'),
      pl('Camel’s Back Road','scenic','Town Centre','Free','1 hr',4.4,'3-km scenic promenade ending at a sunset point over the hills.')]),
    D('auli','Auli','Uttarakhand','Garhwal','adventure',30.5300,79.5660,500,'Nov – Mar (ski)',[11,12,1,2,3],'8–18°C','-5–10°C',2000,4.6,9000,2800,['Skiing','Cable Car','Nanda Devi Views'],[
      pl('Auli Ski Slopes','adventure','Resort','₹1,500','Half day',4.7,'India’s premier ski destination with groomed snow runs.'),
      pl('Auli Ropeway','scenic','Joshimath','₹1,000','1 hr',4.6,'One of Asia’s longest-highest cable cars from Joshimath.'),
      pl('Gurso Bugyal','trekking','3 km','Free','Half day',4.5,'Alpine meadow trek with Nanda Devi and Trishul views.')]),
    D('jim-corbett','Jim Corbett','Uttarakhand','Nainital','wildlife',29.5300,78.7747,245,'Nov – Jun',[11,12,1,2,3,4,5,6],'25–40°C','7–24°C',2500,4.5,29000,null,['Tigers','Jeep Safari','Ramganga','Elephants'],[
      pl('Dhikala Zone Safari','wildlife','Park','₹4,500','Half day',4.7,'India’s oldest national park core zone, prime tiger territory.'),
      pl('Corbett Falls','nature','25 km','₹100','1 hr',4.2,'A 20m forest waterfall surrounded by dense sal woods.'),
      pl('Garjia Devi Temple','spiritual','15 km','Free','1 hr',4.3,'Riverside temple set atop a rock in the Kosi river.')]),
    D('haridwar','Haridwar','Uttarakhand','Ganga Plains','spiritual',29.9457,78.1642,222,'Sep – Mar',[9,10,11,12,1,2,3],'25–40°C','8–22°C',800,4.5,40000,314,['Ganga Aarti','Har Ki Pauri','Kumbh','Temples'],[
      pl('Har Ki Pauri','spiritual','City Centre','Free','1 hr',4.7,'The most sacred ghat, host to the spectacular evening Ganga Aarti.'),
      pl('Mansa Devi Temple','spiritual','3 km','₹120','1–2 hrs',4.4,'Hilltop Shakti temple reached by a cable car.'),
      pl('Chandi Devi Temple','spiritual','4 km','₹120','1–2 hrs',4.4,'Ropeway temple atop Neel Parvat, a revered Siddh Peeth.')]),
    D('lansdowne','Lansdowne','Uttarakhand','Garhwal','hill_station',29.8377,78.6810,260,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'15–28°C','3–18°C',1500,4.3,9000,1700,['Quiet','Cantonment','Pine Forests'],[
      pl('Tip in Top (Tiffin Top)','scenic','2 km','Free','1 hr',4.4,'Viewpoint over the Shivalik range and the Garhwal Himalayas.'),
      pl('Bhulla Tal','scenic','1 km','₹50','1 hr',4.2,'Tranquil army-built lake with paddle boating.'),
      pl('St. Mary’s Church','heritage','1 km','₹20','30 min',4.1,'1896 colonial church now a small museum of Lansdowne’s history.')]),
    D('ranikhet','Ranikhet','Uttarakhand','Kumaon','hill_station',29.6434,79.4322,350,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'13–27°C','2–16°C',1400,4.3,8000,1869,['Golf','Pine Forests','Himalayan Views'],[
      pl('Jhula Devi Temple','spiritual','7 km','Free','45 min',4.4,'Temple of thousands of bells offered for wishes fulfilled.'),
      pl('Chaubatia Gardens','nature','10 km','₹30','1–2 hrs',4.3,'Apple and apricot orchards with a Himalayan viewpoint.'),
      pl('Upat Golf Course','scenic','5 km','₹200','1 hr',4.4,'One of Asia’s highest 9-hole golf courses amid pines.')]),
    D('chopta','Chopta','Uttarakhand','Garhwal','hill_station',30.4900,79.1500,420,'Apr – Jun, Sep – Nov',[4,5,6,9,10,11],'10–20°C','-2–12°C',1200,4.6,7000,2680,['Mini Switzerland','Tungnath','Meadows'],[
      pl('Tungnath Temple','spiritual','4 km','Free','Half day',4.7,'Highest Shiva temple in the world at 3,680m.'),
      pl('Chandrashila Summit','trekking','5 km','Free','Half day',4.7,'Trek peak with 360° Himalayan views incl. Nanda Devi.'),
      pl('Deoria Tal','trekking','15 km','Free','Half day',4.5,'Emerald lake reflecting the Chaukhamba peaks.')]),
    D('munsiyari','Munsiyari','Uttarakhand','Pithoragarh','hill_station',30.0670,80.2380,580,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'10–22°C','-4–12°C',1300,4.5,4000,2200,['Panchachuli Views','Trekking Base','Glaciers'],[
      pl('Panchachuli Viewpoint','scenic','Town','Free','1 hr',4.7,'Front-row views of the five snow peaks of Panchachuli.'),
      pl('Khaliya Top','trekking','8 km','Free','Half day',4.6,'Alpine meadow trek with sweeping Himalayan vistas.'),
      pl('Birthi Falls','nature','35 km','Free','1 hr',4.3,'126m waterfall on the road to Munsiyari.')]),
    // ───────── Himachal ─────────
    D('shimla','Shimla','Himachal Pradesh','Lower Himalayas','hill_station',31.1048,77.1734,343,'Mar – Jun, Dec – Jan',[3,4,5,6,12,1],'15–28°C','-2–15°C',1300,4.4,55000,2276,['Mall Road','Toy Train','Ridge','Colonial'],[
      pl('The Ridge & Mall Road','town','Centre','Free','2 hrs',4.4,'Open promenade with colonial buildings, cafes and Christ Church.'),
      pl('Jakhoo Temple','spiritual','2 km','Free','1 hr',4.4,'Hilltop Hanuman temple with a 33m statue and resident monkeys.'),
      pl('Kalka–Shimla Toy Train','heritage','Centre','₹300','5 hrs',4.6,'UNESCO narrow-gauge railway through 102 tunnels.')]),
    D('dalhousie','Dalhousie','Himachal Pradesh','Chamba','hill_station',32.5387,75.9707,560,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'13–26°C','1–15°C',1300,4.3,17000,1970,['Colonial','Khajjiar','Pines'],[
      pl('Khajjiar','scenic','22 km','Free','Half day',4.5,'“Mini Switzerland” — a saucer-shaped meadow ringed by deodars.'),
      pl('Panchpula','nature','3 km','₹20','1 hr',4.2,'Stream and waterfall picnic spot with a memorial to Sardar Ajit Singh.'),
      pl('St. John’s Church','heritage','1 km','Free','30 min',4.2,'1863 stone church, the oldest in Dalhousie.')]),
    D('khajjiar','Khajjiar','Himachal Pradesh','Chamba','hill_station',32.5489,76.0636,565,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'12–25°C','0–14°C',1400,4.4,11000,1920,['Mini Switzerland','Meadow','Lake'],[
      pl('Khajjiar Lake & Meadow','scenic','Centre','Free','2 hrs',4.5,'Grassy plateau with a floating-island lake and zorbing.'),
      pl('Khajji Nag Temple','spiritual','Centre','Free','30 min',4.2,'12th-century temple blending Hindu and Buddhist styles.'),
      pl('Kalatop Wildlife Sanctuary','wildlife','6 km','₹100','Half day',4.4,'Deodar forest sanctuary with easy nature trails.')]),
    D('kasol','Kasol','Himachal Pradesh','Parvati Valley','adventure',32.0099,77.3152,520,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'15–28°C','0–14°C',800,4.5,22000,1640,['Parvati River','Trekking','Israeli Cafes'],[
      pl('Kheerganga Trek','trekking','22 km','Free','2 days',4.7,'Forest trek to a natural hot spring at 3,050m.'),
      pl('Tosh Village','town','20 km','Free','Half day',4.5,'Hippie hamlet at the valley’s end with snow-peak views.'),
      pl('Manikaran Sahib','spiritual','4 km','Free','1–2 hrs',4.5,'Gurudwara and hot springs sacred to Sikhs and Hindus.')]),
    D('bir-billing','Bir Billing','Himachal Pradesh','Kangra','adventure',32.0420,76.7180,500,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'15–28°C','2–16°C',1000,4.6,12000,1525,['Paragliding','Monasteries','Tea Gardens'],[
      pl('Billing Take-off','adventure','14 km','₹2,500','1 hr',4.7,'World-class paragliding launch site at 2,400m.'),
      pl('Bir Landing Site','adventure','Centre','Free','1 hr',4.4,'Famous paragliding landing meadow with cafes.'),
      pl('Sherab Ling Monastery','spiritual','8 km','Free','1 hr',4.5,'Serene Tibetan monastery set among pine and tea slopes.')]),
    D('chitkul','Chitkul','Himachal Pradesh','Kinnaur','hill_station',31.3520,78.4360,580,'Apr – Jun, Sep – Oct',[4,5,6,9,10],'10–20°C','-4–10°C',1200,4.6,5000,3450,['Last Indian Village','Baspa River','Apple Orchards'],[
      pl('Last Village of India','town','Centre','Free','2 hrs',4.6,'India’s last inhabited village before the Tibet border.'),
      pl('Baspa Riverside','scenic','Centre','Free','1 hr',4.5,'Pristine river meadows framed by snow peaks.'),
      pl('Mathi Temple','spiritual','Centre','Free','30 min',4.3,'Ancient wooden village temple of local goddess Mathi.')]),
    D('kalpa','Kalpa','Himachal Pradesh','Kinnaur','hill_station',31.5360,78.2570,565,'Apr – Jun, Sep – Oct',[4,5,6,9,10],'12–22°C','-3–12°C',1200,4.5,4500,2960,['Kinnaur Kailash','Apple Orchards','Suicide Point'],[
      pl('Kinnaur Kailash View','scenic','Centre','Free','1 hr',4.7,'Front view of the sacred 6,050m Kinnaur Kailash range.'),
      pl('Suicide Point','scenic','7 km','Free','1 hr',4.4,'Sheer cliff viewpoint over the Sutlej valley.'),
      pl('Roghi Village','town','4 km','Free','1 hr',4.3,'Traditional Kinnauri village amid apple orchards.')]),
    // ───────── J&K ─────────
    D('srinagar','Srinagar','Jammu & Kashmir','Kashmir Valley','hill_station',34.0837,74.7973,810,'Apr – Oct',[4,5,6,7,8,9,10],'12–30°C','-2–10°C',1500,4.6,46000,1585,['Dal Lake','Shikara','Mughal Gardens','Houseboats'],[
      pl('Dal Lake Shikara Ride','scenic','Centre','₹800','1–2 hrs',4.7,'Iconic shikara ride past floating gardens and houseboats.'),
      pl('Mughal Gardens (Nishat & Shalimar)','heritage','9 km','₹50','2 hrs',4.6,'Terraced Mughal-era gardens overlooking Dal Lake.'),
      pl('Shankaracharya Temple','spiritual','6 km','Free','1 hr',4.5,'Hilltop Shiva temple with panoramic city views.')]),
    D('gulmarg','Gulmarg','Jammu & Kashmir','Kashmir Valley','adventure',34.0484,74.3805,860,'Dec – Mar (ski), Apr – Jun',[12,1,2,3,4,5,6],'10–21°C','-8–6°C',2000,4.7,28000,2650,['Gondola','Skiing','Meadows','Golf'],[
      pl('Gulmarg Gondola','scenic','Centre','₹1,700','2 hrs',4.7,'One of the world’s highest cable cars to Apharwat Peak (3,980m).'),
      pl('Apharwat Peak','adventure','Gondola','Included','Half day',4.7,'Snow bowl for skiing, snowboarding and sledging.'),
      pl('Gulmarg Golf Course','scenic','Centre','₹500','2 hrs',4.4,'One of the world’s highest green golf courses.')]),
    D('pahalgam','Pahalgam','Jammu & Kashmir','Anantnag','hill_station',34.0161,75.3150,870,'Apr – Oct',[4,5,6,7,8,9,10],'12–25°C','-4–11°C',1800,4.6,21000,2740,['Lidder River','Betaab Valley','Amarnath Base'],[
      pl('Betaab Valley','scenic','15 km','₹100','2 hrs',4.6,'Lush river valley named after the Bollywood film shot here.'),
      pl('Aru Valley','scenic','12 km','Free','Half day',4.6,'Meadow hamlet and trekking base by the Lidder river.'),
      pl('Chandanwari','scenic','16 km','Free','Half day',4.5,'Snow-bridge point and starting base of the Amarnath yatra.')]),
    D('sonamarg','Sonamarg','Jammu & Kashmir','Ganderbal','hill_station',34.3000,75.2900,900,'May – Oct',[5,6,7,8,9,10],'10–24°C','-6–8°C',1800,4.5,14000,2800,['Meadow of Gold','Thajiwas Glacier','Sindh River'],[
      pl('Thajiwas Glacier','scenic','3 km','₹600','Half day',4.6,'Pony ride to a glacier with year-round snow.'),
      pl('Zoji La Pass','scenic','15 km','Free','Half day',4.4,'Dramatic high pass gateway to Ladakh.'),
      pl('Sindh River Banks','scenic','Centre','Free','1 hr',4.4,'Trout-rich river meadows ideal for picnics.')]),
    D('patnitop','Patnitop','Jammu & Kashmir','Udhampur','hill_station',33.0850,75.3318,650,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'14–26°C','-2–14°C',1300,4.2,9000,2024,['Meadows','Paragliding','Pine Forests'],[
      pl('Patnitop Meadows','scenic','Centre','Free','2 hrs',4.3,'Rolling alpine meadows with paragliding and horse rides.'),
      pl('Naag Mandir','spiritual','2 km','Free','30 min',4.1,'Ancient snake-deity temple amid deodar forest.'),
      pl('Kud Viewpoint','scenic','7 km','Free','1 hr',4.2,'Sunset point overlooking the Chenab valley.')]),
    // ───────── Sikkim / NE ─────────
    D('gangtok','Gangtok','Sikkim','East Sikkim','hill_station',27.3389,88.6065,1550,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'13–24°C','4–15°C',1500,4.6,33000,1650,['MG Marg','Monasteries','Tsomgo Lake','Cable Car'],[
      pl('Tsomgo (Changu) Lake','scenic','38 km','₹50','Half day',4.6,'Glacial lake at 3,753m, frozen in winter, with yak rides.'),
      pl('Rumtek Monastery','spiritual','24 km','₹10','1–2 hrs',4.5,'Largest monastery in Sikkim, seat of the Karmapa.'),
      pl('MG Marg','town','Centre','Free','2 hrs',4.5,'Litter-free pedestrian boulevard of cafes and shops.')]),
    D('pelling','Pelling','Sikkim','West Sikkim','hill_station',27.2900,88.2400,1600,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'12–22°C','3–14°C',1400,4.5,12000,2150,['Kanchenjunga Views','Skywalk','Monasteries'],[
      pl('Pemayangtse Monastery','spiritual','2 km','₹20','1 hr',4.6,'One of Sikkim’s oldest monasteries with a 7-tier wooden sculpture.'),
      pl('Skywalk & Chenrezig Statue','scenic','3 km','₹50','1 hr',4.5,'Glass skywalk leading to a 137-ft Buddha statue.'),
      pl('Khecheopalri Lake','spiritual','24 km','Free','2 hrs',4.5,'Sacred wish-fulfilling lake where leaves never settle on water.')]),
    D('lachung','Lachung','Sikkim','North Sikkim','hill_station',27.6900,88.7400,1700,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'8–18°C','-4–10°C',2000,4.6,7000,2700,['Yumthang Valley','Zero Point','Rhododendrons'],[
      pl('Yumthang Valley','scenic','24 km','₹100','Half day',4.7,'“Valley of Flowers” carpeted with rhododendrons in spring.'),
      pl('Zero Point','scenic','40 km','₹100','Half day',4.6,'Snow-covered last-civilian point at 4,700m.'),
      pl('Lachung Monastery','spiritual','2 km','Free','1 hr',4.4,'18th-century Nyingma monastery amid apple orchards.')]),
    D('shillong','Shillong','Meghalaya','Khasi Hills','hill_station',25.5788,91.8933,1900,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'15–24°C','4–16°C',1300,4.5,27000,1496,['Scotland of East','Waterfalls','Living Roots'],[
      pl('Elephant Falls','nature','12 km','₹20','1 hr',4.3,'Three-tiered waterfall on the city outskirts.'),
      pl('Umiam Lake','scenic','15 km','₹30','1–2 hrs',4.4,'Vast reservoir with kayaking and scenic viewpoints.'),
      pl('Shillong Peak','scenic','10 km','₹30','1 hr',4.4,'Highest point with panoramic views of the city and hills.')]),
    D('cherrapunji','Cherrapunji','Meghalaya','Khasi Hills','hill_station',25.2841,91.7216,1930,'Sep – May',[9,10,11,12,1,2,3,4,5],'12–22°C','6–16°C',1300,4.5,16000,1430,['Living Root Bridges','Waterfalls','Caves'],[
      pl('Nohkalikai Falls','nature','5 km','₹20','1 hr',4.6,'India’s tallest plunge waterfall at 340m.'),
      pl('Double Decker Living Root Bridge','nature','12 km','₹30','Half day',4.7,'Hand-grown root bridge reached by a 3,500-step trek.'),
      pl('Mawsmai Cave','nature','6 km','₹30','1 hr',4.3,'Easy-to-walk limestone cave with lit formations.')]),
    D('ziro','Ziro','Arunachal Pradesh','Lower Subansiri','hill_station',27.5447,93.8200,2100,'Mar – Oct',[3,4,5,6,7,8,9,10],'15–26°C','3–16°C',1400,4.5,5000,1500,['Apatani Tribe','Rice Fields','Music Festival'],[
      pl('Apatani Plateau','cultural','Centre','Free','Half day',4.6,'UNESCO-tentative valley of paddy-cum-fish cultivation.'),
      pl('Talley Valley Sanctuary','wildlife','32 km','₹100','Half day',4.5,'Pine and bamboo wildlife sanctuary with rare flora.'),
      pl('Ziro Music Festival Grounds','cultural','Centre','Varies','Half day',4.5,'Host site of India’s most scenic outdoor music festival.')]),
    D('tawang','Tawang','Arunachal Pradesh','West Kameng','hill_station',27.5860,91.8590,2200,'Apr – Oct',[4,5,6,7,8,9,10],'5–18°C','-5–10°C',1600,4.6,6000,3048,['Largest Monastery','Sela Pass','War Memorial'],[
      pl('Tawang Monastery','spiritual','Centre','Free','2 hrs',4.7,'India’s largest monastery, birthplace of the 6th Dalai Lama.'),
      pl('Sela Pass','scenic','78 km','Free','Half day',4.7,'High mountain pass at 4,170m with a sacred frozen lake.'),
      pl('Tawang War Memorial','cultural','2 km','₹20','1 hr',4.5,'Memorial to soldiers of the 1962 Indo-China war.')]),
    D('kohima','Kohima','Nagaland','Naga Hills','hill_station',25.6751,94.1086,2350,'Oct – May',[10,11,12,1,2,3,4,5],'16–28°C','4–18°C',1400,4.4,7000,1444,['Hornbill Festival','WWII History','Tribes'],[
      pl('Kohima War Cemetery','heritage','Centre','Free','1 hr',4.6,'Moving WWII memorial to the Battle of Kohima.'),
      pl('Kisama Heritage Village','cultural','12 km','₹30','2 hrs',4.6,'Host of the Hornbill Festival showcasing all Naga tribes.'),
      pl('Dzukou Valley','trekking','25 km','₹100','2 days',4.7,'Valley of seasonal flowers and rolling green hills.')]),
    D('majuli','Majuli','Assam','Brahmaputra','heritage',26.9500,94.1700,2000,'Oct – Mar',[10,11,12,1,2,3],'22–32°C','10–22°C',1000,4.4,5000,85,['River Island','Satras','Mask Making'],[
      pl('Kamalabari Satra','cultural','Centre','Free','1 hr',4.5,'Neo-Vaishnavite monastery of dance, music and manuscripts.'),
      pl('Mask Making at Samaguri','cultural','5 km','₹50','1 hr',4.5,'Traditional workshop crafting expressive bamboo-and-clay masks.'),
      pl('Brahmaputra Sunset Point','scenic','Centre','Free','1 hr',4.4,'Sweeping sunset views over the world’s largest river island.')]),
    // ───────── Karnataka ─────────
    D('mysore','Mysore','Karnataka','Deccan Plateau','heritage',12.2958,76.6394,2150,'Oct – Mar',[10,11,12,1,2,3],'25–34°C','16–28°C',1000,4.6,38000,763,['Palace','Dasara','Chamundi Hill','Silk'],[
      pl('Mysore Palace','heritage','Centre','₹70','2 hrs',4.8,'Indo-Saracenic royal palace, dazzling when lit by 100,000 bulbs.'),
      pl('Chamundi Hill Temple','spiritual','13 km','Free','2 hrs',4.5,'Hilltop temple of the city’s patron goddess, reached by 1,000 steps.'),
      pl('Brindavan Gardens','nature','21 km','₹15','2 hrs',4.3,'Terraced gardens with a musical fountain below the KRS dam.')]),
    D('chikmagalur','Chikmagalur','Karnataka','Western Ghats','hill_station',13.3161,75.7720,2200,'Sep – Mar',[9,10,11,12,1,2,3],'20–30°C','11–24°C',1200,4.5,16000,1090,['Coffee','Mullayanagiri','Waterfalls'],[
      pl('Mullayanagiri Peak','trekking','22 km','Free','Half day',4.6,'Highest peak in Karnataka at 1,930m.'),
      pl('Baba Budangiri','scenic','30 km','Free','Half day',4.5,'Sacred cave-shrine range famed for the first Indian coffee beans.'),
      pl('Hebbe Falls','nature','55 km','₹500','Half day',4.4,'Two-tier waterfall reached by a jeep ride through coffee estates.')]),
    D('gokarna','Gokarna','Karnataka','Konkan Coast','beach',14.5479,74.3188,2050,'Oct – Mar',[10,11,12,1,2,3],'26–34°C','20–30°C',800,4.5,19000,null,['Beaches','Temples','Backpacker'],[
      pl('Om Beach','beach','6 km','Free','Half day',4.6,'Om-shaped twin-cove beach, the most famous in Gokarna.'),
      pl('Mahabaleshwar Temple','spiritual','Centre','Free','1 hr',4.5,'Ancient temple housing the revered Atmalinga.'),
      pl('Kudle Beach','beach','3 km','Free','Half day',4.5,'Laid-back crescent beach with cafes and yoga shacks.')]),
    D('badami','Badami','Karnataka','Bagalkot','heritage',15.9149,75.6770,1850,'Oct – Mar',[10,11,12,1,2,3],'26–38°C','15–30°C',900,4.4,7000,null,['Cave Temples','Chalukya','Sandstone'],[
      pl('Badami Cave Temples','heritage','Centre','₹25','2 hrs',4.7,'6th-century rock-cut Hindu and Jain caves above Agastya lake.'),
      pl('Bhutanatha Temples','heritage','1 km','Free','1 hr',4.4,'Sandstone temple group on the edge of the lake.'),
      pl('Pattadakal','heritage','22 km','₹40','1–2 hrs',4.6,'UNESCO complex of Chalukyan temples, a cradle of Indian architecture.')]),
    D('bandipur','Bandipur','Karnataka','Chamarajanagar','wildlife',11.6700,76.6300,2200,'Oct – May',[10,11,12,1,2,3,4,5],'24–36°C','15–28°C',2500,4.5,11000,null,['Tigers','Elephants','Safari'],[
      pl('Bandipur Jeep Safari','wildlife','Park','₹1,200','3 hrs',4.6,'Tiger reserve safari through teak and bamboo forest.'),
      pl('Himavad Gopalaswamy Betta','scenic','30 km','₹50','Half day',4.5,'Misty hilltop temple, highest point in the Bandipur range.'),
      pl('Moyar River Gorge','scenic','25 km','Free','2 hrs',4.3,'Dramatic gorge teeming with raptors and crocodiles.')]),
    // ───────── Kerala ─────────
    D('wayanad','Wayanad','Kerala','Western Ghats','hill_station',11.6854,76.1320,2400,'Oct – May',[10,11,12,1,2,3,4,5],'20–32°C','15–25°C',1200,4.5,21000,780,['Caves','Waterfalls','Wildlife','Plantations'],[
      pl('Edakkal Caves','heritage','25 km','₹40','Half day',4.5,'Prehistoric petroglyph caves from 6,000 BCE.'),
      pl('Chembra Peak','trekking','15 km','₹750','Half day',4.6,'Trek to a heart-shaped lake and Wayanad’s highest point.'),
      pl('Banasura Sagar Dam','scenic','21 km','₹50','2 hrs',4.4,'India’s largest earthen dam with island-dotted boating.')]),
    D('alleppey','Alleppey','Kerala','Backwaters','beach',9.4981,76.3388,2700,'Sep – Mar',[9,10,11,12,1,2,3],'26–34°C','23–32°C',1500,4.6,33000,null,['Houseboats','Backwaters','Beach'],[
      pl('Backwater Houseboat Cruise','scenic','Centre','₹7,000','Overnight',4.7,'Overnight cruise through palm-fringed canals and paddy fields.'),
      pl('Alleppey Beach','beach','3 km','Free','Half day',4.3,'Long beach with a 137-year-old pier and lighthouse.'),
      pl('Marari Beach','beach','11 km','Free','Half day',4.5,'Quiet fishing-village beach lined with coconut palms.')]),
    D('kochi','Kochi','Kerala','Malabar Coast','heritage',9.9312,76.2673,2580,'Oct – Mar',[10,11,12,1,2,3],'26–34°C','23–32°C',1200,4.5,41000,null,['Fort Kochi','Chinese Nets','Spice Trade'],[
      pl('Chinese Fishing Nets','heritage','Fort Kochi','Free','1 hr',4.4,'Iconic cantilevered nets lining the Fort Kochi shore.'),
      pl('Mattancherry Palace','heritage','3 km','₹15','1 hr',4.4,'Portuguese-built palace with vivid Hindu mythological murals.'),
      pl('Jew Town & Synagogue','heritage','3 km','₹10','1–2 hrs',4.4,'Antique-lined lane and the 1568 Paradesi Synagogue.')]),
    D('thekkady','Thekkady','Kerala','Idukki','wildlife',9.5916,77.1603,2650,'Sep – Mar',[9,10,11,12,1,2,3],'21–32°C','15–25°C',1500,4.5,18000,900,['Periyar Tiger Reserve','Spice Gardens','Boating'],[
      pl('Periyar Lake Boat Safari','wildlife','Park','₹300','2 hrs',4.5,'Boat cruise to spot elephants, bison and birds at the waterline.'),
      pl('Spice Plantation Tour','nature','5 km','₹300','2 hrs',4.4,'Guided walk through cardamom, pepper and clove gardens.'),
      pl('Periyar Nature Walk','wildlife','Park','₹500','3 hrs',4.5,'Guided forest trek with armed naturalist in the reserve.')]),
    D('kovalam','Kovalam','Kerala','Thiruvananthapuram','beach',8.4004,76.9787,2800,'Sep – Mar',[9,10,11,12,1,2,3],'27–34°C','24–32°C',1200,4.4,24000,null,['Lighthouse Beach','Ayurveda','Surfing'],[
      pl('Lighthouse Beach','beach','Centre','Free','Half day',4.5,'Crescent beach watched over by a candy-striped lighthouse.'),
      pl('Hawa Beach','beach','1 km','Free','Half day',4.3,'Palm-lined cove popular for sunrise and fishing boats.'),
      pl('Vizhinjam Marine Aquarium','wildlife','3 km','₹30','1 hr',4.0,'Small aquarium near the historic Vizhinjam fishing harbour.')]),
    D('kumarakom','Kumarakom','Kerala','Backwaters','beach',9.6175,76.4300,2720,'Sep – Mar',[9,10,11,12,1,2,3],'26–34°C','23–32°C',1800,4.5,15000,null,['Bird Sanctuary','Backwaters','Houseboats'],[
      pl('Kumarakom Bird Sanctuary','wildlife','3 km','₹50','2 hrs',4.4,'Vembanad-side sanctuary for egrets, herons and Siberian migrants.'),
      pl('Vembanad Lake Cruise','scenic','Centre','₹1,500','2 hrs',4.6,'Cruise on Kerala’s largest lake among floating vegetation.'),
      pl('Pathiramanal Island','nature','Lake','₹500','2 hrs',4.3,'Tiny migratory-bird island reachable only by boat.')]),
    // ───────── Tamil Nadu ─────────
    D('pondicherry','Pondicherry','Puducherry','Coromandel Coast','beach',11.9416,79.8083,2400,'Oct – Mar',[10,11,12,1,2,3],'28–36°C','20–30°C',1200,4.5,35000,null,['French Quarter','Beaches','Auroville','Cafes'],[
      pl('Promenade Beach','beach','Centre','Free','2 hrs',4.5,'1.5-km seafront promenade with the Gandhi statue and old pier.'),
      pl('Auroville Matrimandir','spiritual','12 km','Free','Half day',4.5,'Golden meditation sphere at the heart of the experimental township.'),
      pl('French Quarter (White Town)','heritage','Centre','Free','2 hrs',4.6,'Mustard-yellow colonial villas, boutiques and cafes.')]),
    D('kodaikanal','Kodaikanal','Tamil Nadu','Palani Hills','hill_station',10.2381,77.4892,2450,'Sep – May',[9,10,11,12,1,2,3,4,5],'17–25°C','8–20°C',1300,4.5,29000,2133,['Star Lake','Pillar Rocks','Forests'],[
      pl('Kodai Lake','scenic','Centre','₹30','1–2 hrs',4.5,'Star-shaped lake with pedal boating and cycle paths.'),
      pl('Pillar Rocks','scenic','7 km','₹30','1 hr',4.5,'Three giant granite pillars rising 120m, often cloud-wrapped.'),
      pl('Coaker’s Walk','scenic','1 km','₹10','1 hr',4.3,'Cliff-edge promenade with valley views and a telescope house.')]),
    D('mahabalipuram','Mahabalipuram','Tamil Nadu','Coromandel Coast','heritage',12.6269,80.1927,2300,'Nov – Feb',[11,12,1,2],'28–36°C','22–30°C',1000,4.6,22000,null,['Shore Temple','Rock Carvings','Beach'],[
      pl('Shore Temple','heritage','Centre','₹40','1 hr',4.7,'8th-century granite temple standing against the Bay of Bengal.'),
      pl('Pancha Rathas','heritage','1 km','₹40','1 hr',4.6,'Five monolithic chariot-shaped temples, each a single rock.'),
      pl('Arjuna’s Penance','heritage','Centre','Free','45 min',4.6,'One of the world’s largest open-air bas-relief rock carvings.')]),
    D('madurai','Madurai','Tamil Nadu','Vaigai Plains','spiritual',9.9252,78.1198,2450,'Oct – Mar',[10,11,12,1,2,3],'28–38°C','20–30°C',900,4.6,28000,null,['Meenakshi Temple','Temple City','Markets'],[
      pl('Meenakshi Amman Temple','spiritual','Centre','Free','2–3 hrs',4.8,'Towering 14-gopuram temple complex, a marvel of Dravidian art.'),
      pl('Thirumalai Nayakkar Palace','heritage','2 km','₹50','1 hr',4.4,'17th-century Indo-Saracenic palace with a nightly light show.'),
      pl('Gandhi Memorial Museum','cultural','3 km','Free','1 hr',4.4,'Museum in a Nayak palace holding the cloth Gandhi wore when shot.')]),
    D('rameshwaram','Rameshwaram','Tamil Nadu','Pamban Island','spiritual',9.2876,79.3129,2700,'Oct – Apr',[10,11,12,1,2,3,4],'27–35°C','22–30°C',900,4.6,21000,null,['Ramanathaswamy','Pamban Bridge','Dhanushkodi'],[
      pl('Ramanathaswamy Temple','spiritual','Centre','Free','2 hrs',4.7,'Char Dham temple with India’s longest pillared corridor.'),
      pl('Dhanushkodi','scenic','18 km','Free','Half day',4.6,'Ghost town at land’s end where two seas meet.'),
      pl('Pamban Bridge','scenic','12 km','Free','1 hr',4.6,'India’s first sea bridge, with a scenic train crossing.')]),
    D('kanyakumari','Kanyakumari','Tamil Nadu','Cape Comorin','beach',8.0883,77.5385,2900,'Oct – Mar',[10,11,12,1,2,3],'27–34°C','22–30°C',900,4.4,26000,null,['Land’s End','Sunrise & Sunset','Memorials'],[
      pl('Vivekananda Rock Memorial','spiritual','Sea','₹50','2 hrs',4.6,'Island memorial reached by ferry where Vivekananda meditated.'),
      pl('Thiruvalluvar Statue','heritage','Sea','₹50','1 hr',4.5,'133-ft stone statue of the Tamil poet-saint on a rock islet.'),
      pl('Sunrise & Sunset Point','scenic','Centre','Free','1 hr',4.5,'Rare spot to watch both sunrise and sunset over three seas.')]),
    // ───────── Andhra / Telangana ─────────
    D('tirupati','Tirupati','Andhra Pradesh','Tirumala Hills','spiritual',13.6288,79.4192,2150,'Sep – Mar',[9,10,11,12,1,2,3],'28–38°C','18–28°C',900,4.6,60000,853,['Balaji Temple','Pilgrimage','Hills'],[
      pl('Sri Venkateswara Temple','spiritual','Tirumala','Free','3–4 hrs',4.8,'World’s most-visited temple atop the seven Tirumala hills.'),
      pl('Sri Kalahasti Temple','spiritual','36 km','Free','2 hrs',4.5,'Ancient Vayu (wind) element Shiva temple.'),
      pl('Chandragiri Fort','heritage','12 km','₹15','1–2 hrs',4.2,'11th-century fort and palace of the Vijayanagara kings.')]),
    D('visakhapatnam','Visakhapatnam','Andhra Pradesh','Eastern Ghats','beach',17.6868,83.2185,1800,'Oct – Mar',[10,11,12,1,2,3],'27–35°C','18–28°C',1200,4.4,31000,null,['Beaches','Submarine','Araku Nearby'],[
      pl('RK Beach','beach','Centre','Free','2 hrs',4.4,'Lively city beachfront with the INS Kursura submarine museum.'),
      pl('Kailasagiri','scenic','8 km','₹40','2 hrs',4.5,'Hilltop park with ropeway and giant Shiva-Parvati statues.'),
      pl('Borra Caves','nature','90 km','₹60','2 hrs',4.4,'Million-year-old limestone caves with dramatic stalactites.')]),
    D('araku-valley','Araku Valley','Andhra Pradesh','Eastern Ghats','hill_station',18.3273,82.8765,1900,'Oct – Mar',[10,11,12,1,2,3],'20–30°C','12–22°C',1100,4.4,12000,910,['Coffee','Tribal Culture','Train Ride'],[
      pl('Araku Coffee Museum','cultural','Centre','₹50','1 hr',4.3,'Museum tracing the valley’s celebrated tribal coffee.'),
      pl('Tribal Museum','cultural','2 km','₹30','1 hr',4.3,'Dioramas of the Eastern Ghats’ indigenous Adivasi life.'),
      pl('Vizag–Araku Train Ride','scenic','Route','₹500','5 hrs',4.6,'Scenic ride through 58 tunnels and the Borra hills.')]),
    D('hyderabad','Hyderabad','Telangana','Deccan Plateau','heritage',17.3850,78.4867,1500,'Oct – Mar',[10,11,12,1,2,3],'28–39°C','15–28°C',1200,4.5,58000,542,['Charminar','Biryani','Golconda','Lakes'],[
      pl('Charminar','heritage','Old City','₹25','1 hr',4.5,'1591 four-minaret monument at the heart of the bazaar.'),
      pl('Golconda Fort','heritage','11 km','₹25','2–3 hrs',4.6,'Hilltop fort famed for acoustics and the Koh-i-Noor’s origins.'),
      pl('Ramoji Film City','cultural','30 km','₹1,200','Full day',4.4,'World’s largest film studio complex and theme park.')]),
    // ───────── Maharashtra ─────────
    D('mumbai','Mumbai','Maharashtra','Konkan Coast','heritage',19.0760,72.8777,1400,'Oct – Mar',[10,11,12,1,2,3],'27–34°C','18–32°C',1500,4.4,72000,null,['Gateway','Marine Drive','Bollywood','Street Food'],[
      pl('Gateway of India','heritage','Colaba','Free','1 hr',4.5,'1924 basalt arch on the harbour, Mumbai’s defining landmark.'),
      pl('Marine Drive','scenic','Centre','Free','1–2 hrs',4.5,'3.6-km seafront promenade called the “Queen’s Necklace” at night.'),
      pl('Elephanta Caves','heritage','Sea','₹40','Half day',4.5,'UNESCO island rock-cut Shiva caves reached by ferry.')]),
    D('lonavala','Lonavala','Maharashtra','Sahyadri','hill_station',18.7546,73.4062,1450,'Jun – Sep, Oct – Feb',[6,7,8,9,10,11,12,1,2],'22–32°C','12–25°C',1200,4.3,34000,622,['Waterfalls','Forts','Chikki','Caves'],[
      pl('Bhushi Dam','nature','6 km','Free','1–2 hrs',4.2,'Stepped dam where monsoon water cascades over the steps.'),
      pl('Tiger’s Leap','scenic','12 km','Free','1 hr',4.4,'Cliff viewpoint with a sheer 650m drop over the valley.'),
      pl('Karla & Bhaja Caves','heritage','11 km','₹25','2 hrs',4.4,'2,000-year-old Buddhist rock-cut chaityas and viharas.')]),
    D('mahabaleshwar','Mahabaleshwar','Maharashtra','Sahyadri','hill_station',17.9237,73.6582,1550,'Oct – Jun',[10,11,12,1,2,3,4,5,6],'18–30°C','10–22°C',1300,4.4,27000,1353,['Strawberries','Viewpoints','Lake'],[
      pl('Venna Lake','scenic','Centre','₹150','1 hr',4.3,'Boating lake ringed by strawberry stalls and horse rides.'),
      pl('Arthur’s Seat','scenic','12 km','Free','1 hr',4.5,'“Queen of Points” overlooking the Savitri valley gorge.'),
      pl('Pratapgad Fort','heritage','24 km','₹20','2 hrs',4.4,'Shivaji’s hill fort with sweeping Sahyadri views.')]),
    D('ajanta-ellora','Ajanta & Ellora','Maharashtra','Aurangabad','heritage',20.5519,75.7033,1100,'Oct – Mar',[10,11,12,1,2,3],'28–38°C','14–28°C',1000,4.7,19000,null,['Rock-cut Caves','UNESCO','Murals'],[
      pl('Ajanta Caves','heritage','100 km','₹40','Half day',4.8,'30 Buddhist rock-cut caves with 2,000-year-old murals.'),
      pl('Ellora Caves','heritage','30 km','₹40','Half day',4.8,'34 Hindu, Buddhist and Jain caves incl. the monolithic Kailasa temple.'),
      pl('Bibi Ka Maqbara','heritage','Aurangabad','₹25','1 hr',4.4,'“Mini Taj” built by Aurangzeb’s son for his mother.')]),
    D('matheran','Matheran','Maharashtra','Sahyadri','hill_station',18.9866,73.2707,1420,'Oct – May',[10,11,12,1,2,3,4,5],'20–32°C','12–24°C',1300,4.3,15000,800,['Vehicle-free','Toy Train','Viewpoints'],[
      pl('Panorama Point','scenic','4 km','Free','1 hr',4.4,'360° viewpoint famed for sunrise over the Sahyadris.'),
      pl('Matheran Toy Train','heritage','Centre','₹300','2 hrs',4.4,'Narrow-gauge heritage train winding up from Neral.'),
      pl('Charlotte Lake','scenic','2 km','Free','1 hr',4.2,'Quiet lake supplying the town, with a lakeside Shiva temple.')]),
    // ───────── Gujarat ─────────
    D('ahmedabad','Ahmedabad','Gujarat','Sabarmati','heritage',23.0225,72.5714,950,'Nov – Feb',[11,12,1,2],'30–42°C','14–30°C',1000,4.4,33000,53,['Heritage City','Sabarmati Ashram','Textiles'],[
      pl('Sabarmati Ashram','heritage','6 km','Free','1–2 hrs',4.6,'Gandhi’s riverside ashram and museum of the freedom struggle.'),
      pl('Adalaj Stepwell','heritage','18 km','₹25','1 hr',4.5,'Intricately carved five-storey 1498 stepwell.'),
      pl('Sidi Saiyyed Mosque','heritage','Centre','Free','30 min',4.4,'Famous for its delicate tree-of-life jali stone lattice.')]),
    D('gir','Gir National Park','Gujarat','Saurashtra','wildlife',21.1240,70.8240,1250,'Dec – Mar',[12,1,2,3],'28–40°C','12–28°C',2500,4.6,17000,null,['Asiatic Lions','Safari','Forest'],[
      pl('Gir Lion Safari','wildlife','Sasan Gir','₹800','3 hrs',4.7,'The only place on earth to see Asiatic lions in the wild.'),
      pl('Devalia Safari Park','wildlife','12 km','₹190','1 hr',4.4,'Fenced interpretation zone with near-guaranteed sightings.'),
      pl('Kankai Mata Temple','spiritual','Core','Free','1 hr',4.2,'Forest temple deep inside the Gir sanctuary.')]),
    D('dwarka','Dwarka','Gujarat','Saurashtra','spiritual',22.2403,68.9686,1450,'Oct – Mar',[10,11,12,1,2,3],'28–36°C','14–28°C',900,4.5,19000,null,['Char Dham','Krishna','Coast'],[
      pl('Dwarkadhish Temple','spiritual','Centre','Free','1–2 hrs',4.7,'5-storey Char Dham temple to Lord Krishna on the Gomti.'),
      pl('Bet Dwarka','spiritual','30 km','₹20','Half day',4.4,'Island shrine reached by ferry, Krishna’s legendary residence.'),
      pl('Nageshwar Jyotirlinga','spiritual','16 km','Free','1 hr',4.5,'One of the twelve sacred Jyotirlinga Shiva shrines.')]),
    D('somnath','Somnath','Gujarat','Saurashtra','spiritual',20.8880,70.4010,1350,'Oct – Mar',[10,11,12,1,2,3],'28–36°C','15–29°C',900,4.6,18000,null,['First Jyotirlinga','Coast','Light Show'],[
      pl('Somnath Temple','spiritual','Centre','Free','1–2 hrs',4.8,'The first of the twelve Jyotirlingas, rebuilt on the Arabian Sea.'),
      pl('Somnath Light & Sound Show','cultural','Centre','₹100','1 hr',4.5,'Evening show narrating the temple’s legendary history.'),
      pl('Bhalka Tirth','spiritual','5 km','Free','30 min',4.3,'Spot where Lord Krishna is believed to have left his mortal body.')]),
    D('saputara','Saputara','Gujarat','Dang','hill_station',20.5740,73.7517,1150,'Oct – Jun',[10,11,12,1,2,3,4,5,6],'22–32°C','12–24°C',1100,4.2,9000,1000,['Only Hill Station','Lake','Tribal'],[
      pl('Saputara Lake','scenic','Centre','₹50','1 hr',4.3,'Central boating lake ringed by the Sahyadri hills.'),
      pl('Sunset Point','scenic','3 km','₹20','1 hr',4.3,'Ropeway-accessed point for valley sunsets.'),
      pl('Gira Waterfalls','nature','52 km','Free','2 hrs',4.2,'Wide seasonal falls on the Ambika river, best in monsoon.')]),
    D('statue-of-unity','Statue of Unity','Gujarat','Narmada','heritage',21.8380,73.7191,950,'Oct – Mar',[10,11,12,1,2,3],'28–40°C','14–30°C',1500,4.5,26000,null,['World’s Tallest Statue','Sardar Patel','Valley of Flowers'],[
      pl('Statue of Unity','heritage','Centre','₹150','2 hrs',4.6,'World’s tallest statue (182m) of Sardar Vallabhbhai Patel.'),
      pl('Viewing Gallery','scenic','Statue','₹350','1 hr',4.5,'Gallery at 153m inside the statue’s chest with Narmada views.'),
      pl('Valley of Flowers','nature','2 km','Free','1 hr',4.4,'17-km riverside floral landscape around the monument.')]),
    // ───────── Madhya Pradesh ─────────
    D('khajuraho','Khajuraho','Madhya Pradesh','Bundelkhand','heritage',24.8318,79.9199,620,'Oct – Mar',[10,11,12,1,2,3],'28–40°C','8–26°C',900,4.6,21000,null,['Temples','Sculptures','UNESCO'],[
      pl('Western Group of Temples','heritage','Centre','₹40','2–3 hrs',4.8,'UNESCO Chandela temples famed for intricate erotic sculpture.'),
      pl('Kandariya Mahadev','heritage','Centre','Included','1 hr',4.7,'The largest and most ornate of the Khajuraho temples.'),
      pl('Light & Sound Show','cultural','Centre','₹250','1 hr',4.5,'Evening show on the temples’ history, narrated by Amitabh Bachchan.')]),
    D('gwalior','Gwalior','Madhya Pradesh','Chambal','heritage',26.2183,78.1828,320,'Oct – Mar',[10,11,12,1,2,3],'28–42°C','9–27°C',900,4.4,17000,null,['Hill Fort','Palaces','Music'],[
      pl('Gwalior Fort','heritage','Centre','₹75','2–3 hrs',4.7,'Magnificent hill fort called “the pearl among fortresses”.'),
      pl('Jai Vilas Palace','heritage','4 km','₹150','1–2 hrs',4.5,'Scindia palace with the world’s largest pair of chandeliers.'),
      pl('Sas-Bahu Temples','heritage','Fort','Included','45 min',4.4,'Ornate 11th-century twin temples inside the fort.')]),
    D('orchha','Orchha','Madhya Pradesh','Bundelkhand','heritage',25.3518,78.6420,460,'Oct – Mar',[10,11,12,1,2,3],'28–40°C','9–26°C',900,4.6,12000,null,['Cenotaphs','Palaces','Betwa River'],[
      pl('Orchha Fort Complex','heritage','Centre','₹40','2 hrs',4.7,'Jahangir Mahal and Raj Mahal palaces on a Betwa island.'),
      pl('Chhatris (Cenotaphs)','heritage','1 km','Free','1 hr',4.6,'14 riverside royal memorials, stunning at sunset.'),
      pl('Ram Raja Temple','spiritual','Centre','Free','1 hr',4.5,'Unique temple where Lord Rama is worshipped as a king.')]),
    D('pachmarhi','Pachmarhi','Madhya Pradesh','Satpura','hill_station',22.4675,78.4336,690,'Oct – Jun',[10,11,12,1,2,3,4,5,6],'22–33°C','10–24°C',1100,4.4,12000,1067,['Only Hill Station of MP','Caves','Waterfalls'],[
      pl('Bee Falls','nature','3 km','₹20','1–2 hrs',4.4,'Popular bathing waterfall reached by a short forest descent.'),
      pl('Pandav Caves','heritage','2 km','₹20','1 hr',4.3,'Five ancient rock-cut caves set in a garden.'),
      pl('Dhupgarh','scenic','9 km','₹20','1 hr',4.5,'Highest point of the Satpura range, famed for sunsets.')]),
    D('bandhavgarh','Bandhavgarh','Madhya Pradesh','Umaria','wildlife',23.7000,81.0000,800,'Oct – Jun',[10,11,12,1,2,3,4,5,6],'28–42°C','8–28°C',3000,4.6,14000,null,['Highest Tiger Density','Fort','Safari'],[
      pl('Tala Zone Safari','wildlife','Park','₹3,000','Half day',4.7,'Core zone with India’s highest density of Bengal tigers.'),
      pl('Bandhavgarh Fort','heritage','Park','Included','2 hrs',4.4,'2,000-year-old hill fort with ancient Vishnu statues.'),
      pl('Three Cave Point','wildlife','Park','Included','1 hr',4.3,'Prime spot to glimpse tigers resting in rock shelters.')]),
    D('kanha','Kanha','Madhya Pradesh','Maikal Hills','wildlife',22.3345,80.6115,900,'Oct – Jun',[10,11,12,1,2,3,4,5,6],'28–42°C','8–27°C',3000,4.6,13000,null,['Jungle Book','Barasingha','Sal Forests'],[
      pl('Kanha Jeep Safari','wildlife','Park','₹2,500','Half day',4.7,'Sprawling reserve that inspired Kipling’s Jungle Book.'),
      pl('Bamni Dadar','scenic','Park','Included','1 hr',4.4,'“Sunset Point” overlooking the meadows and sal forest.'),
      pl('Kanha Museum','cultural','Gate','₹20','30 min',4.2,'Interpretation centre on the park’s flora and fauna.')]),
    D('ujjain','Ujjain','Madhya Pradesh','Malwa','spiritual',23.1765,75.7885,770,'Oct – Mar',[10,11,12,1,2,3],'28–40°C','10–28°C',800,4.6,30000,null,['Mahakaleshwar','Kumbh','Shipra'],[
      pl('Mahakaleshwar Temple','spiritual','Centre','Free','2 hrs',4.8,'Jyotirlinga temple famed for its dawn Bhasma Aarti.'),
      pl('Ram Ghat','spiritual','2 km','Free','1 hr',4.4,'Sacred Shipra-river ghat, a focal point of the Simhastha Kumbh.'),
      pl('Kal Bhairav Temple','spiritual','3 km','Free','1 hr',4.4,'Unusual temple where liquor is offered to the deity.')]),
    // ───────── East India ─────────
    D('kolkata','Kolkata','West Bengal','Hooghly Delta','heritage',22.5726,88.3639,1500,'Oct – Mar',[10,11,12,1,2,3],'28–36°C','14–28°C',1200,4.5,49000,null,['Victoria Memorial','Trams','Durga Puja','Sweets'],[
      pl('Victoria Memorial','heritage','Centre','₹30','2 hrs',4.7,'Grand white-marble museum of the British Raj era.'),
      pl('Howrah Bridge','heritage','3 km','Free','1 hr',4.5,'Iconic cantilever bridge over the Hooghly river.'),
      pl('Dakshineswar Kali Temple','spiritual','12 km','Free','1–2 hrs',4.6,'Riverside temple linked to the saint Ramakrishna.')]),
    D('sundarbans','Sundarbans','West Bengal','Ganges Delta','wildlife',21.9497,88.4297,1600,'Sep – Mar',[9,10,11,12,1,2,3],'28–36°C','15–28°C',2500,4.4,11000,null,['Mangroves','Royal Bengal Tiger','Boat Safari'],[
      pl('Sundarbans Boat Safari','wildlife','Core','₹2,000','Full day',4.5,'Cruise the world’s largest mangrove delta seeking tigers.'),
      pl('Sajnekhali Watchtower','wildlife','Core','₹100','2 hrs',4.3,'Birding and crocodile watchpoint with a mangrove centre.'),
      pl('Dobanki Canopy Walk','wildlife','Core','₹100','1 hr',4.3,'Elevated canopy walkway above tiger territory.')]),
    D('puri','Puri','Odisha','Coromandel Coast','spiritual',19.8135,85.8312,1700,'Oct – Mar',[10,11,12,1,2,3],'28–36°C','18–28°C',900,4.5,32000,null,['Jagannath','Beach','Rath Yatra'],[
      pl('Jagannath Temple','spiritual','Centre','Free','2 hrs',4.7,'One of the Char Dham, home of the famous Rath Yatra chariots.'),
      pl('Puri Beach','beach','2 km','Free','2 hrs',4.4,'Wide golden beach famed for sunrise and sand art.'),
      pl('Chilika Lake','nature','50 km','₹1,200','Half day',4.5,'Asia’s largest brackish lagoon with dolphins and migratory birds.')]),
    D('konark','Konark','Odisha','Coromandel Coast','heritage',19.8876,86.0945,1730,'Oct – Mar',[10,11,12,1,2,3],'28–36°C','18–28°C',900,4.6,15000,null,['Sun Temple','Chariot','UNESCO'],[
      pl('Konark Sun Temple','heritage','Centre','₹40','2 hrs',4.8,'13th-century UNESCO temple shaped as the Sun God’s chariot.'),
      pl('Chandrabhaga Beach','beach','3 km','Free','1–2 hrs',4.3,'Tranquil beach with a sunrise viewpoint near the temple.'),
      pl('ASI Konark Museum','cultural','Centre','₹20','1 hr',4.2,'Sculpture fragments recovered from the Sun Temple.')]),
    D('bhubaneswar','Bhubaneswar','Odisha','Mahanadi','heritage',20.2961,85.8245,1680,'Oct – Mar',[10,11,12,1,2,3],'28–38°C','15–28°C',1000,4.4,18000,null,['Temple City','Lingaraj','Caves'],[
      pl('Lingaraj Temple','spiritual','Centre','Free','1–2 hrs',4.6,'11th-century Kalinga-style temple, the city’s grandest.'),
      pl('Udayagiri & Khandagiri Caves','heritage','7 km','₹25','2 hrs',4.4,'Ancient Jain rock-cut monastic caves on twin hills.'),
      pl('Dhauli Peace Pagoda','spiritual','8 km','Free','1 hr',4.4,'Hilltop white stupa marking Ashoka’s post-Kalinga conversion.')]),
    // ───────── Bihar ─────────
    D('bodh-gaya','Bodh Gaya','Bihar','Gaya','spiritual',24.6961,84.9870,1000,'Oct – Mar',[10,11,12,1,2,3],'28–40°C','10–26°C',900,4.7,24000,null,['Mahabodhi','Bodhi Tree','Buddhism'],[
      pl('Mahabodhi Temple','spiritual','Centre','Free','2 hrs',4.8,'UNESCO temple beside the Bodhi tree where Buddha attained enlightenment.'),
      pl('Great Buddha Statue','spiritual','2 km','₹25','1 hr',4.5,'25m sandstone-and-granite seated Buddha unveiled in 1989.'),
      pl('Monastery Circuit','cultural','Centre','Free','Half day',4.5,'Temples built by Thailand, Japan, Bhutan, Tibet and more.')]),
    D('nalanda','Nalanda','Bihar','Magadh','heritage',25.1357,85.4436,1050,'Oct – Mar',[10,11,12,1,2,3],'28–40°C','10–26°C',900,4.5,9000,null,['Ancient University','Ruins','UNESCO'],[
      pl('Nalanda University Ruins','heritage','Centre','₹40','2 hrs',4.6,'UNESCO ruins of the world’s oldest residential university.'),
      pl('Nalanda Archaeological Museum','cultural','Centre','₹20','1 hr',4.3,'Buddhist bronzes and stuccos excavated from the site.'),
      pl('Xuanzang Memorial Hall','cultural','2 km','₹20','1 hr',4.2,'Memorial to the Chinese pilgrim-scholar who studied here.')]),
    // ───────── More HP / hidden ─────────
    D('kufri','Kufri','Himachal Pradesh','Shimla','hill_station',31.0980,77.2670,360,'Mar – Jun, Dec – Feb',[3,4,5,6,12,1,2],'12–24°C','-3–12°C',1300,4.1,14000,2720,['Snow','Skiing','Himalayan Zoo'],[
      pl('Kufri Fun World','adventure','Centre','₹300','2 hrs',4.1,'Amusement park with the world’s highest go-kart track.'),
      pl('Himalayan Nature Park','wildlife','1 km','₹50','1–2 hrs',4.3,'Zoo of snow leopards, musk deer and Himalayan monals.'),
      pl('Mahasu Peak','scenic','3 km','Free','1 hr',4.4,'Pony-ride viewpoint over snow ranges, top sledging spot.')]),
    // ───────── More Uttarakhand ─────────
    D('binsar','Binsar','Uttarakhand','Kumaon','wildlife',29.7000,79.7600,400,'Mar – Jun, Sep – Nov',[3,4,5,6,9,10,11],'13–25°C','2–16°C',1500,4.5,6000,2412,['Wildlife Sanctuary','Zero Point','Himalayan Views'],[
      pl('Zero Point','scenic','3 km','₹50','1–2 hrs',4.6,'300-degree views of Kedarnath, Nanda Devi and Panchachuli peaks.'),
      pl('Binsar Wildlife Sanctuary','wildlife','Gate','₹150','Half day',4.4,'Oak-and-rhododendron sanctuary rich in birds and leopards.'),
      pl('Bineshwar Mahadev Temple','spiritual','5 km','Free','45 min',4.3,'16th-century Shiva temple deep in the forest.')]),
    D('dehradun','Dehradun','Uttarakhand','Doon Valley','hill_station',30.3165,78.0322,250,'Sep – Apr',[9,10,11,12,1,2,3,4],'18–36°C','5–22°C',1100,4.2,28000,640,['Robbers Cave','Forest Research','Gateway'],[
      pl('Robber’s Cave (Gucchupani)','nature','8 km','₹25','1–2 hrs',4.3,'River cave where the stream vanishes and re-emerges underground.'),
      pl('Forest Research Institute','heritage','7 km','₹40','1–2 hrs',4.5,'Grand Greco-Roman colonial campus and forestry museums.'),
      pl('Sahastradhara','nature','11 km','₹100','2 hrs',4.2,'“Thousand-fold spring” of sulphur water and limestone terraces.')]),
    // ───────── More South ─────────
    D('yelagiri','Yelagiri','Tamil Nadu','Vellore','hill_station',12.5800,78.6400,2200,'Oct – Jun',[10,11,12,1,2,3,4,5,6],'18–30°C','12–22°C',1100,4.1,7000,1110,['Quiet Hills','Paragliding','Trekking'],[
      pl('Swamimalai Hills Trek','trekking','5 km','Free','Half day',4.4,'Trek to Yelagiri’s highest peak through shola forest.'),
      pl('Punganoor Lake','scenic','Centre','₹15','1 hr',4.2,'Man-made boating lake with a musical fountain.'),
      pl('Jalagamparai Waterfalls','nature','8 km','Free','2 hrs',4.3,'Seasonal falls on the Attaru river below the hills.')]),
    D('netarhat','Netarhat','Jharkhand','Chota Nagpur','hill_station',23.4667,84.2667,1150,'Oct – Mar',[10,11,12,1,2,3],'20–32°C','8–22°C',1000,4.2,4000,1128,['Queen of Chotanagpur','Sunrise','Forests'],[
      pl('Magnolia Sunset Point','scenic','10 km','Free','1 hr',4.4,'Famous viewpoint for sunset over the Palamu hills.'),
      pl('Netarhat Sunrise Point','scenic','2 km','Free','1 hr',4.4,'Dawn views across rolling sal forests and plateaus.'),
      pl('Upper Ghaghri Falls','nature','5 km','Free','1–2 hrs',4.2,'Forest waterfall on the way down the plateau.')]),
    // ───────── Goa-adjacent / West coast ─────────
    D('diu','Diu','Daman & Diu','Kathiawar Coast','beach',20.7197,70.9904,1300,'Oct – May',[10,11,12,1,2,3,4,5],'27–34°C','18–30°C',1200,4.3,12000,null,['Portuguese Fort','Quiet Beaches','Seafood'],[
      pl('Diu Fort','heritage','Centre','Free','1–2 hrs',4.4,'Sprawling 1535 Portuguese sea fort with a lighthouse.'),
      pl('Nagoa Beach','beach','7 km','Free','Half day',4.4,'Horseshoe palm-fringed beach, the island’s best for swimming.'),
      pl('St. Paul’s Church','heritage','Centre','Free','30 min',4.2,'Baroque 1610 church, one of the oldest in the region.')]),
    D('tarkarli','Tarkarli','Maharashtra','Konkan Coast','beach',16.0500,73.4900,1700,'Oct – May',[10,11,12,1,2,3,4,5],'27–34°C','20–30°C',1100,4.4,9000,null,['Scuba','Backwaters','White Sand'],[
      pl('Tarkarli Beach','beach','Centre','Free','Half day',4.5,'Clear-water white-sand beach ideal for scuba and snorkelling.'),
      pl('Sindhudurg Fort','heritage','6 km','₹100','2 hrs',4.5,'Shivaji’s island sea fort off the Malvan coast.'),
      pl('Devbagh Sangam','scenic','5 km','Free','1–2 hrs',4.3,'Sandbar where the Karli river meets the Arabian Sea.')]),
    D('digha','Digha','West Bengal','Bay of Bengal','beach',21.6270,87.5079,1550,'Oct – Mar',[10,11,12,1,2,3],'28–36°C','16–28°C',900,4.0,14000,null,['Beach','Marine Aquarium','Weekend Getaway'],[
      pl('New Digha Beach','beach','Centre','Free','Half day',4.1,'Bengal’s most popular seaside escape with a long promenade.'),
      pl('Marine Aquarium & Research Centre','wildlife','2 km','₹20','1 hr',4.0,'India’s largest marine aquarium of the eastern coast.'),
      pl('Udaipur Beach','beach','3 km','Free','2 hrs',4.0,'Quieter beach near the Odisha border, good for sunsets.')])
  ];

  NEW.forEach(function (d) { DESTINATIONS.push(d); });

  // ─── Travel-month coverage normalisation ─────────────────────────────────
  // The "Travel Month" filter is "when can I sensibly go", not just the single
  // peak window. Without this, summer (Apr–Jun) and monsoon (Jul–Aug) returned
  // almost nothing because most records were tagged winter-only. We add months
  // that are genuinely good per India's real travel seasons:
  //   • Hill stations & mountain adventure  → Apr–Jun  (peak summer-escape season)
  //   • Rain-shadow Himalaya & Kashmir vale → Jun–Sep  (roads open, clear, monsoon-safe)
  //   • Western-Ghats & NE green belts      → Jul–Sep  (lush, waterfalls, monsoon draw)
  (function normaliseMonths() {
    // Rain-shadow / high-Himalaya & Kashmir valley: best Jun–Sep, monsoon-safe.
    var MONSOON_OK = ['ladakh','spiti','kalpa','chitkul','srinagar','gulmarg',
                      'pahalgam','sonamarg','auli'];
    // Western-Ghats & North-East green belts: lush and popular through the monsoon.
    var GHATS_NE = ['munnar','coorg','wayanad','chikmagalur','lonavala','mahabaleshwar',
                    'matheran','saputara','ooty','kodaikanal','yelagiri','netarhat',
                    'cherrapunji','shillong','ziro','gokarna'];
    // Heritage that is genuinely atmospheric in the rains (lakes brim, ruins turn green,
    // cave temples stay cool): worth a monsoon visit.
    var MONSOON_HERITAGE = ['udaipur','hampi','ajanta-ellora','orchha','khajuraho',
                            'gwalior','badami','mahabalipuram'];
    // Wildlife parks whose season is NOT summer (rhino/coastal/hill parks shut or
    // peak earlier) — keep them out of the Apr–Jun big-cat rule.
    var TIGER_EXCLUDE = { kaziranga: 1, gir: 1, sundarbans: 1, thekkady: 1, binsar: 1 };

    // Per-destination corrections: months where a place is genuinely *perfect* but was
    // left out, creating an interior gap (a month missing between two present months).
    // These are the single best month to add for each, by India's real travel calendar.
    var MONTH_FIXES = {
      shimla: [2],            // February = peak snow season on the Ridge
      cherrapunji: [6],       // June = peak monsoon, the wettest-place-on-earth draw
      hampi: [10],            // October = clear, green post-monsoon (Hampi Utsav season)
      auli: [10],             // October = crisp autumn views before the ski season
      lonavala: [3],          // March = pleasant pre-monsoon Sahyadri weather
      mahabalipuram: [3, 10], // March & October shoulders on the Coromandel coast
      ahmedabad: [3, 10]      // October = Navratri season; March before peak heat
    };

    DESTINATIONS.forEach(function (d) {
      var L = d.bestMonthsList;
      if (!Array.isArray(L)) return;
      function add(months) { months.forEach(function (m) { if (L.indexOf(m) < 0) L.push(m); }); }

      // Hill stations & mountain adventure are India's classic Apr–Jun summer escapes.
      // (Skip desert "adventure" like the Rann, which is strictly a winter destination.)
      if ((d.type === 'hill_station' || d.type === 'adventure') &&
          (d.altitude == null || d.altitude >= 400)) {
        add([4, 5, 6]);
      }
      if (MONSOON_OK.indexOf(d.id) >= 0) add([6, 7, 8, 9]);
      if (GHATS_NE.indexOf(d.id) >= 0) add([7, 8, 9]);

      // Forts, palaces & temples are bearable year-round (summer is just hotter):
      // give every month a heritage/spiritual option instead of leaving Apr–Sep empty.
      // Heritage → add the spring (Apr) and post-monsoon (Sep) shoulders.
      if (d.type === 'heritage') add([4, 9]);
      // A handful of heritage sites are genuinely iconic *in* the monsoon.
      if (MONSOON_HERITAGE.indexOf(d.id) >= 0) add([7, 8]);
      // Pilgrimage is a year-round activity — spiritual towns stay worth visiting.
      if (d.type === 'spiritual') add([4, 5, 6, 7, 8, 9]);
      // Big-cat reserves: summer (Apr–Jun) gives the best sightings before the
      // monsoon closure. (Jul–Sep core-zone closures are left intact on purpose.)
      if (d.type === 'wildlife' && !TIGER_EXCLUDE[d.id]) add([4, 5, 6]);

      // Fill the per-destination "perfect month" gaps identified above.
      if (MONTH_FIXES[d.id]) add(MONTH_FIXES[d.id]);

      L.sort(function (a, b) { return a - b; });
    });
  })();

  // Recompute the state list so destinations.html’s filter includes new states.
  if (typeof INDIA_STATES !== 'undefined' && Array.isArray(INDIA_STATES)) {
    var states = [];
    DESTINATIONS.forEach(function (d) { if (states.indexOf(d.state) < 0) states.push(d.state); });
    states.sort();
    INDIA_STATES.length = 0;
    Array.prototype.push.apply(INDIA_STATES, states);
  }
})();
