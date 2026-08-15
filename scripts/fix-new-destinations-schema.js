const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');

const targets = [
  {
    slug: 'bangaram-island',
    title: 'Bangaram Island',
    state: 'Lakshadweep',
    country: 'India',
    region: 'Lakshadweep Archipelago',
    type: 'beach',
    badge: 'Pristine Island',
    tagline: 'Uninhabited teardrop island with turquoise lagoons and coral reefs',
    image: { src: 'images/destinations/bangaram_island_lagoon_1785085303615.png', alt: 'Bangaram Island Lagoon, Lakshadweep' },
    heroImage: { src: 'images/destinations/bangaram_island_lagoon_1785085303615.png', alt: 'Bangaram Island Beach and Coral Reef' },
    overview: {
      short: 'Teal turquoise lagoons, coral reefs and untouched white sand beaches in the Arabian Sea.',
      description: 'Bangaram is a teardrop-shaped uninhabited island in Lakshadweep surrounded by a shallow turquoise lagoon and protective coral reefs. Famous for calm glass-like waters, wreck diving, and bioluminescent plankton strolls at night.',
      features: ['Lagoon Snorkeling', 'Scuba Diving', 'Bioluminescent Plankton', 'Coral Reefs'],
      rating: 4.9,
      reviewCount: 1420,
      minPrice: 6500,
      distanceFromDelhi: 2150
    },
    bestTime: { label: 'Oct – May', months: [1, 2, 3, 4, 5, 10, 11, 12] },
    weather: { lat: 10.9388, lng: 72.2858, tempSummer: '26–34°C', tempWinter: '24–30°C' },
    howToReach: {
      routes: [
        { from: 'Kochi (Cochin)', distance: 450, byCar: 'N/A (Sea/Air)', byTrain: 'N/A', byAir: 'Flight to Agatti + 1.5 hr Speedboat', via: 'Air India / Alliance Air to Agatti' },
        { from: 'Bengaluru', distance: 800, byCar: 'N/A', byTrain: 'N/A', byAir: 'Connecting flight via Kochi', via: 'Via Kochi (COK) → Agatti (AGX)' },
        { from: 'Mumbai', distance: 1200, byCar: 'N/A', byTrain: 'N/A', byAir: 'Connecting flight via Kochi', via: 'Via Kochi → Agatti' }
      ],
      nearestAirport: { name: 'Agatti Airport (AGX)', distance: 12 },
      nearestRailway: { name: 'Ernakulam Junction (Kochi)', distance: 450 },
      roadNote: 'Reachable only by boat/catamaran from Agatti airfield. Entry permit required.'
    },
    topPlaces: [
      {
        name: 'Bangaram Lagoon & Coral Reef',
        category: 'beach',
        distance: '0 km',
        entryFee: 'Included in Permit',
        timings: 'All Day',
        duration: '3–4 hrs',
        rating: 4.9,
        description: 'Crystal-clear glass-like lagoon ideal for kayaking, paddleboarding, and snorkeling.',
        image: { src: 'images/destinations/bangaram_island_lagoon_1785085303615.png', alt: 'Bangaram Lagoon' },
        photos: ['images/destinations/bangaram_island_lagoon_1785085303615.png']
      },
      {
        name: 'Shipwreck Wreck Dive Site',
        category: 'adventure',
        distance: '2 km by boat',
        entryFee: '₹3,500/dive',
        timings: '7 AM – 3 PM',
        duration: '2–3 hrs',
        rating: 4.8,
        description: 'Sunken cargo vessel teeming with sea turtles, stingrays, and vibrant tropical reef fish.',
        image: { src: 'images/destinations/bangaram_island_lagoon_1785085303615.png', alt: 'Shipwreck Dive Site' },
        photos: ['images/destinations/bangaram_island_lagoon_1785085303615.png']
      },
      {
        name: 'Tinnekara Island Sandbar',
        category: 'nature',
        distance: '3 km',
        entryFee: 'Free',
        timings: 'Daytime',
        duration: '2 hrs',
        rating: 4.9,
        description: 'Neighboring uninhabited islet accessible by kayak or glass-bottom boat.',
        image: { src: 'images/destinations/bangaram_island_lagoon_1785085303615.png', alt: 'Tinnekara Island' },
        photos: ['images/destinations/bangaram_island_lagoon_1785085303615.png']
      }
    ],
    hotels: [
      {
        name: 'Bangaram Island Resort',
        type: 'resort',
        tier: 'best',
        priceMin: 8500,
        priceMax: 16000,
        rating: 4.8,
        reviews: 320,
        amenities: ['Water Sports', 'All Meals Included', 'Beachfront', 'Diving Center'],
        tags: ['Eco Luxury', 'Beachfront'],
        image: { src: 'images/destinations/bangaram_island_lagoon_1785085303615.png', alt: 'Bangaram Island Resort' }
      },
      {
        name: 'Lakshadweep Beach Huts',
        type: 'cottage',
        tier: 'good',
        priceMin: 6500,
        priceMax: 9500,
        rating: 4.6,
        reviews: 210,
        amenities: ['Lagoon View', 'Seafood Dining', 'Kayaking'],
        tags: ['Island Stay', 'Waterfront'],
        image: { src: 'images/destinations/bangaram_island_lagoon_1785085303615.png', alt: 'Lakshadweep Beach Huts' }
      }
    ],
    gallery: [
      { src: 'images/destinations/bangaram_island_lagoon_1785085303615.png', alt: 'Bangaram Lagoon' }
    ],
    faq: [
      { q: 'How to reach Bangaram Island?', a: 'Fly to Agatti Airport (AGX) from Kochi, then take a 1.5-hour speedboat or helicopter transfer.' },
      { q: 'Is a permit required to visit Bangaram?', a: 'Yes, an official Lakshadweep entry permit is mandatory for all visitors.' }
    ],
    seo: {
      title: 'Bangaram Island Travel Guide 2026 — Places, Hotels, Permit | IndiaExplore',
      description: 'Explore Bangaram Island in Lakshadweep: turquoise lagoon, coral reef snorkeling, luxury eco resorts, and how to reach via Agatti.',
      canonical: 'destination.html?slug=bangaram-island',
      ogImage: 'images/destinations/bangaram_island_lagoon_1785085303615.png',
      keywords: ['Bangaram Island Lakshadweep', 'Bangaram resort', 'Lakshadweep tourism', 'Agatti to Bangaram']
    }
  },
  {
    slug: 'agatti-island',
    title: 'Agatti Island',
    state: 'Lakshadweep',
    country: 'India',
    region: 'Lakshadweep Archipelago',
    type: 'beach',
    badge: 'Island Gateway',
    tagline: 'Gateway airfield island of Lakshadweep with scenic ocean runway',
    image: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Agatti Island Beach' },
    heroImage: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80', alt: 'Agatti Airfield Lagoon' },
    overview: {
      short: 'Gateway island with dramatic ocean airstrip runway and clear blue lagoons.',
      description: 'Agatti Island features a 7km narrow strip of land surrounded by a deep blue ocean and calm shallow lagoons. It serves as the primary airfield entrance to the Lakshadweep archipelago.',
      features: ['Lagoon Kayaking', 'Island Hopping', 'Airport Runway View', 'Deep Sea Fishing'],
      rating: 4.8,
      reviewCount: 1850,
      minPrice: 5500,
      distanceFromDelhi: 2130
    },
    bestTime: { label: 'Oct – May', months: [1, 2, 3, 4, 5, 10, 11, 12] },
    weather: { lat: 10.8533, lng: 72.1946, tempSummer: '26–33°C', tempWinter: '25–31°C' },
    howToReach: {
      routes: [
        { from: 'Kochi', distance: 460, byCar: 'N/A', byTrain: 'N/A', byAir: '1.25 hr direct flight', via: 'Alliance Air / Air India' }
      ],
      nearestAirport: { name: 'Agatti Airport (AGX)', distance: 2 },
      nearestRailway: { name: 'Ernakulam Junction', distance: 460 },
      roadNote: 'Island transport via bicycle, auto-rickshaw or electric buggy.'
    },
    topPlaces: [
      {
        name: 'Agatti Lagoon',
        category: 'beach',
        distance: '1 km',
        entryFee: 'Free',
        timings: 'All day',
        duration: '2–3 hrs',
        rating: 4.8,
        description: 'Shallow calm waters perfect for swimming, windsurfing and glass-bottom boat rides.',
        image: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', alt: 'Agatti Lagoon' },
        photos: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80']
      }
    ],
    hotels: [
      {
        name: 'Agatti Island Beach Resort',
        type: 'resort',
        tier: 'better',
        priceMin: 7000,
        priceMax: 12000,
        rating: 4.7,
        reviews: 410,
        amenities: ['Diving Center', 'Airport Transfers', 'Restaurant'],
        tags: ['Beachfront', 'Diving'],
        image: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', alt: 'Agatti Resort' }
      }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Agatti' }],
    faq: [{ q: 'How to get an entry permit for Agatti?', a: 'Permits are arranged through approved travel agents or resort bookings prior to travel.' }],
    seo: {
      title: 'Agatti Island Travel Guide 2026 — Airport, Hotels, Water Sports | IndiaExplore',
      description: 'Plan your trip to Agatti Island in Lakshadweep: ocean runway, lagoon kayaking, resorts and permit requirements.',
      canonical: 'destination.html?slug=agatti-island',
      ogImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      keywords: ['Agatti Island', 'Agatti airport', 'Lakshadweep beaches']
    }
  },
  {
    slug: 'havelock-island',
    title: 'Havelock Island (Swaraj Dweep)',
    state: 'Andaman & Nicobar',
    country: 'India',
    region: 'Ritchie\'s Archipelago',
    type: 'beach',
    badge: 'Top Asian Beach',
    tagline: 'Home to world-renowned Radhanagar Beach and coral reefs',
    image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80', alt: 'Radhanagar Beach Havelock' },
    heroImage: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1600&q=80', alt: 'Havelock Island Coast' },
    overview: {
      short: 'Home to Asia\'s world-famous Radhanagar Beach, turquoise diving spots and mahua forests.',
      description: 'Havelock Island (Swaraj Dweep) is the premier destination in the Andaman Islands, celebrated for Radhanagar Beach, scuba diving spots, elephant beach sea-walking, and mangrove kayaking.',
      features: ['Radhanagar Sunset', 'Elephant Beach Snorkeling', 'Scuba Diving', 'Mangrove Kayaking'],
      rating: 4.9,
      reviewCount: 6890,
      minPrice: 3500,
      distanceFromDelhi: 2480
    },
    bestTime: { label: 'Oct – Apr', months: [1, 2, 3, 4, 10, 11, 12] },
    weather: { lat: 11.9761, lng: 92.9876, tempSummer: '24–32°C', tempWinter: '22–30°C' },
    howToReach: {
      routes: [
        { from: 'Port Blair', distance: 57, byCar: 'N/A', byTrain: 'N/A', byAir: 'Catamaran Ferry (Makruzz / Nautika)', via: '1.5 hr AC Ferry' }
      ],
      nearestAirport: { name: 'Veer Savarkar Airport, Port Blair (IXZ)', distance: 57 },
      nearestRailway: { name: 'Chennai Central (via Sea Route)', distance: 1350 },
      roadNote: 'Inter-island movement via high-speed ferries. Rent scooty on the island.'
    },
    topPlaces: [
      {
        name: 'Radhanagar Beach (Beach No. 7)',
        category: 'beach',
        distance: '10 km',
        entryFee: 'Free',
        timings: '6 AM – 6 PM',
        duration: '3–4 hrs',
        rating: 4.9,
        description: 'Voted among Asia\'s best beaches, famous for soft white sand and breathtaking sunsets.',
        image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80', alt: 'Radhanagar Beach' },
        photos: ['https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80']
      }
    ],
    hotels: [
      {
        name: 'Barefoot at Havelock',
        type: 'resort',
        tier: 'luxury',
        priceMin: 12000,
        priceMax: 24000,
        rating: 4.9,
        reviews: 820,
        amenities: ['Rainforest Setting', 'Spa', 'Restaurant'],
        tags: ['Eco Luxury', 'Near Radhanagar'],
        image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=400&q=80', alt: 'Barefoot Resort' }
      }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80', alt: 'Havelock' }],
    faq: [{ q: 'How to reach Havelock Island?', a: 'Take a flight to Port Blair, then a 1.5-hour high-speed ferry (Makruzz or Green Ocean) to Havelock.' }],
    seo: {
      title: 'Havelock Island Travel Guide 2026 — Radhanagar Beach, Hotels, Ferries | IndiaExplore',
      description: 'Complete Havelock Island guide: Radhanagar Beach, scuba diving spots, luxury resorts and ferry timings from Port Blair.',
      canonical: 'destination.html?slug=havelock-island',
      ogImage: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
      keywords: ['Havelock Island Andaman', 'Radhanagar Beach', 'Port Blair to Havelock ferry']
    }
  },
  {
    slug: 'dawki',
    title: 'Dawki',
    state: 'Meghalaya',
    country: 'India',
    region: 'West Jaintia Hills',
    type: 'nature',
    badge: 'Crystal River',
    tagline: 'Home to the glass-like transparent Umngot River',
    image: { src: 'images/destinations/dawki_umngot_river_1785085316445.png', alt: 'Umngot River Dawki' },
    heroImage: { src: 'images/destinations/dawki_umngot_river_1785085316445.png', alt: 'Dawki River & Suspension Bridge' },
    overview: {
      short: 'Boating on the transparent Umngot River where boats float as if suspended in air.',
      description: 'Dawki is a scenic border town in Meghalaya world-famous for the incredible transparency of the Umngot River. Visitors can enjoy wooden boat rides, riverside camping at Shnongpdeng, and views of the Bangladesh border.',
      features: ['Transparent River Boating', 'India-Bangladesh Border', 'Dawki Suspension Bridge', 'Shnongpdeng Camping'],
      rating: 4.8,
      reviewCount: 3120,
      minPrice: 2000,
      distanceFromDelhi: 1980
    },
    bestTime: { label: 'Nov – Apr', months: [1, 2, 3, 4, 11, 12] },
    weather: { lat: 25.1878, lng: 92.0163, tempSummer: '18–28°C', tempWinter: '10–22°C' },
    howToReach: {
      routes: [
        { from: 'Shillong', distance: 82, byCar: '2.5 hrs via Pynursla', byTrain: 'N/A', byAir: 'Flight to Shillong/Guwahati + taxi', via: 'NH440' },
        { from: 'Guwahati', distance: 170, byCar: '4.5 hrs', byTrain: 'Train to Guwahati station + taxi', byAir: 'Flight to Guwahati + taxi', via: 'Via Shillong bypass' }
      ],
      nearestAirport: { name: 'Shillong Airport (SHL) / Guwahati (GAU)', distance: 95 },
      nearestRailway: { name: 'Guwahati Railway Station', distance: 170 },
      roadNote: 'Paved winding mountain roads. Clear water visibility is best from November to April.'
    },
    topPlaces: [
      {
        name: 'Umngot River',
        category: 'river',
        distance: '0 km',
        entryFee: 'Boating ₹500–₹800/boat',
        timings: '6 AM – 5 PM',
        duration: '2–3 hrs',
        rating: 4.9,
        description: 'Crystal-clear river where boats appear to float in mid-air over visible riverbed pebbles.',
        image: { src: 'images/destinations/dawki_umngot_river_1785085316445.png', alt: 'Umngot River' },
        photos: ['images/destinations/dawki_umngot_river_1785085316445.png']
      }
    ],
    hotels: [
      {
        name: 'Pioneer Adventure Camp Shnongpdeng',
        type: 'camp',
        tier: 'budget',
        priceMin: 2000,
        priceMax: 4000,
        rating: 4.7,
        reviews: 350,
        amenities: ['Riverside Tents', 'Campfire', 'Kayaking'],
        tags: ['Riverside', 'Camping'],
        image: { src: 'images/destinations/dawki_umngot_river_1785085316445.png', alt: 'Shnongpdeng Camp' }
      }
    ],
    gallery: [{ src: 'images/destinations/dawki_umngot_river_1785085316445.png', alt: 'Dawki' }],
    faq: [{ q: 'When is the river clearest in Dawki?', a: 'The Umngot River is clearest between November and April after the monsoon rains subside.' }],
    seo: {
      title: 'Dawki Travel Guide 2026 — Umngot River Boating, Camping, Road Route | IndiaExplore',
      description: 'Plan your visit to Dawki Meghalaya: crystal clear Umngot River boating, Shnongpdeng camping, best months and route from Shillong.',
      canonical: 'destination.html?slug=dawki',
      ogImage: 'images/destinations/dawki_umngot_river_1785085316445.png',
      keywords: ['Dawki Meghalaya', 'Umngot River', 'Dawki boating', 'Shillong to Dawki']
    }
  },
  {
    slug: 'gurudongmar-lake',
    title: 'Gurudongmar Lake',
    state: 'Sikkim',
    country: 'India',
    region: 'North Sikkim',
    type: 'adventure',
    badge: 'Sacred High Altitude',
    tagline: 'Sacred glacial lake at 17,800 feet surrounded by Himalayan snow peaks',
    image: { src: 'images/destinations/gurudongmar_sacred_lake_1785085332045.png', alt: 'Gurudongmar Lake Sikkim' },
    heroImage: { src: 'images/destinations/gurudongmar_sacred_lake_1785085332045.png', alt: 'Gurudongmar Turquoise Glacial Lake' },
    overview: {
      short: 'One of the highest lakes in the world at 5,430m, sacred to Buddhists, Sikhs and Hindus.',
      description: 'Gurudongmar Lake is a magnificent high-altitude sacred lake situated at 17,800ft in North Sikkim near the Tibetan border. Surrounded by perpetual snow peaks, its turquoise waters remain partly unfrozen even in freezing winter.',
      features: ['High Altitude Glacial Lake', 'Snow Peaks Panorama', 'Lachen Base Camp', 'Chopta Valley'],
      rating: 4.9,
      reviewCount: 2150,
      minPrice: 3500,
      distanceFromDelhi: 1650
    },
    bestTime: { label: 'Apr – Jun, Oct – Nov', months: [4, 5, 6, 10, 11] },
    weather: { lat: 27.9708, lng: 88.7061, tempSummer: '2–12°C', tempWinter: '-20 to -5°C' },
    howToReach: {
      routes: [
        { from: 'Gangtok', distance: 170, byCar: '6 hrs (Overnight stay in Lachen required)', byTrain: 'N/A', byAir: 'Fly to Pakyong/Bagdogra + taxi to Gangtok', via: 'North Sikkim Highway via Mangan & Lachen' }
      ],
      nearestAirport: { name: 'Pakyong Airport (PYG) / Bagdogra (IXB)', distance: 180 },
      nearestRailway: { name: 'New Jalpaiguri (NJP)', distance: 210 },
      roadNote: 'Protected Area Permit (PAP) required. Early morning start from Lachen (4 AM).'
    },
    topPlaces: [
      {
        name: 'Gurudongmar Lake Shore',
        category: 'lake',
        distance: '0 km',
        entryFee: 'Permit Required',
        timings: '6 AM – 12 PM',
        duration: '1–2 hrs',
        rating: 4.9,
        description: 'Vast sacred turquoise glacial lake surrounded by snow-covered Himalayan peaks.',
        image: { src: 'images/destinations/gurudongmar_sacred_lake_1785085332045.png', alt: 'Gurudongmar Lake' },
        photos: ['images/destinations/gurudongmar_sacred_lake_1785085332045.png']
      }
    ],
    hotels: [
      {
        name: 'Lachen View Hotel',
        type: 'hotel',
        tier: 'good',
        priceMin: 3500,
        priceMax: 6500,
        rating: 4.6,
        reviews: 280,
        amenities: ['Heated Rooms', 'Meals Included', 'Mountain View'],
        tags: ['Overnight Stop', 'Lachen Base'],
        image: { src: 'images/destinations/gurudongmar_sacred_lake_1785085332045.png', alt: 'Lachen Hotel' }
      }
    ],
    gallery: [{ src: 'images/destinations/gurudongmar_sacred_lake_1785085332045.png', alt: 'Gurudongmar' }],
    faq: [{ q: 'Do I need a permit for Gurudongmar Lake?', a: 'Yes, an Inner Line Permit (ILP) or Protected Area Permit (PAP) is mandatory for North Sikkim.' }],
    seo: {
      title: 'Gurudongmar Lake Travel Guide 2026 — Permit, Altitude, Lachen Route | IndiaExplore',
      description: 'Plan your journey to Gurudongmar Lake in North Sikkim at 17,800ft: permits, oxygen tips, Lachen hotel stays and best months.',
      canonical: 'destination.html?slug=gurudongmar-lake',
      ogImage: 'images/destinations/gurudongmar_sacred_lake_1785085332045.png',
      keywords: ['Gurudongmar Lake Sikkim', 'Lachen to Gurudongmar', 'North Sikkim tour']
    }
  },
  {
    slug: 'hanle',
    title: 'Hanle',
    state: 'Ladakh (UT)',
    country: 'India',
    region: 'Changthang Plateau',
    type: 'adventure',
    badge: 'Dark Sky Reserve',
    tagline: 'India\'s 1st Dark Sky Reserve with high-altitude astronomical observatory',
    image: { src: 'images/destinations/hanle_dark_sky_1785085345472.png', alt: 'Hanle Dark Sky Reserve Ladakh' },
    heroImage: { src: 'images/destinations/hanle_dark_sky_1785085345472.png', alt: 'Hanle Observatory and Star-lit Sky' },
    overview: {
      short: 'India\'s 1st Dark Sky Reserve with crystal clear Milky Way views and Indian Astronomical Observatory.',
      description: 'Hanle is a serene high-altitude village at 4,500m on the Changthang plateau of Ladakh. Home to India\'s 1st Dark Sky Reserve, it features world-class stargazing, astrophotography, the 17th-century Hanle Gompa, and wild Tibetan kiangs.',
      features: ['Stargazing & Astrophotography', 'Indian Astronomical Observatory', 'Hanle Gompa', 'Tibetan Wild Ass (Kiang)'],
      rating: 4.9,
      reviewCount: 1680,
      minPrice: 2500,
      distanceFromDelhi: 1080
    },
    bestTime: { label: 'May – Sep', months: [5, 6, 7, 8, 9] },
    weather: { lat: 32.7758, lng: 78.9667, tempSummer: '5–18°C', tempWinter: '-25 to -10°C' },
    howToReach: {
      routes: [
        { from: 'Leh', distance: 255, byCar: '6.5 hrs via Chumathang', byTrain: 'N/A', byAir: 'Fly to Leh (IXL) + 4WD SUV', via: 'Leh → Upshi → Chumathang → Nyoma → Hanle' }
      ],
      nearestAirport: { name: 'Kushok Bakula Rimpoche Airport, Leh (IXL)', distance: 255 },
      nearestRailway: { name: 'Jammu Tawi', distance: 700 },
      roadNote: 'Inner Line Permit (ILP) required. Acclimatization in Leh (2 days) is strictly necessary.'
    },
    topPlaces: [
      {
        name: 'Indian Astronomical Observatory (IAO)',
        category: 'observatory',
        distance: '2 km',
        entryFee: 'Free (Prior permission)',
        timings: '10 AM – 5 PM',
        duration: '1–2 hrs',
        rating: 4.9,
        description: 'World\'s 10th highest optical telescope perched atop Digpa-Ratsa Ri mountain.',
        image: { src: 'images/destinations/hanle_dark_sky_1785085345472.png', alt: 'Hanle Observatory' },
        photos: ['images/destinations/hanle_dark_sky_1785085345472.png']
      }
    ],
    hotels: [
      {
        name: 'Hanle Astro Homestay',
        type: 'homestay',
        tier: 'budget',
        priceMin: 2500,
        priceMax: 4500,
        rating: 4.8,
        reviews: 190,
        amenities: ['Telescope Stargazing', 'Home Cooked Meals', 'Solar Heating'],
        tags: ['Stargazing', 'Local Homestay'],
        image: { src: 'images/destinations/hanle_dark_sky_1785085345472.png', alt: 'Hanle Homestay' }
      }
    ],
    gallery: [{ src: 'images/destinations/hanle_dark_sky_1785085345472.png', alt: 'Hanle' }],
    faq: [{ q: 'Why is Hanle famous?', a: 'Hanle is famous as India\'s 1st Dark Sky Reserve with zero light pollution for stargazing and astrophotography.' }],
    seo: {
      title: 'Hanle Travel Guide 2026 — Dark Sky Reserve, Observatory, Homestays | IndiaExplore',
      description: 'Explore Hanle in Ladakh: Dark Sky Reserve stargazing, Indian Astronomical Observatory, Leh road route and permits.',
      canonical: 'destination.html?slug=hanle',
      ogImage: 'images/destinations/hanle_dark_sky_1785085345472.png',
      keywords: ['Hanle Ladakh', 'Dark sky reserve India', 'Hanle observatory', 'Leh to Hanle']
    }
  },
  {
    slug: 'chopta',
    title: 'Chopta',
    state: 'Uttarakhand',
    country: 'India',
    region: 'Garhwal Himalayas',
    type: 'hill_station',
    badge: 'Mini Switzerland',
    tagline: 'Alpine bugyal meadows and gateway to world\'s highest Shiva temple',
    image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Chopta Meadows' },
    heroImage: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80', alt: 'Chopta Himalayan Panorama' },
    overview: {
      short: 'Lush alpine bugyals (meadows), Tungnath Shiva temple trek and snow peaks panorama.',
      description: 'Chopta is a picturesque village in Garhwal Uttarakhand known as the Mini Switzerland of India. Surrounded by evergreen pine and rhododendron forests, it is the starting point for treks to Tungnath Temple and Chandrashila Peak.',
      features: ['Tungnath Temple Trek', 'Chandrashila Summit View', 'Deoriatal Lake', 'Snow Camping'],
      rating: 4.8,
      reviewCount: 4230,
      minPrice: 1500,
      distanceFromDelhi: 410
    },
    bestTime: { label: 'Mar – Jun, Oct – Dec', months: [3, 4, 5, 6, 10, 11, 12] },
    weather: { lat: 30.4859, lng: 79.1844, tempSummer: '10–22°C', tempWinter: '-5 to 10°C' },
    howToReach: {
      routes: [
        { from: 'Rishikesh', distance: 200, byCar: '6.5 hrs', byTrain: 'Train to Rishikesh + taxi', byAir: 'Fly to Dehradun + taxi', via: 'Rishikesh → Devprayag → Rudraprayag → Ukhimath → Chopta' }
      ],
      nearestAirport: { name: 'Jolly Grant Airport, Dehradun (DED)', distance: 215 },
      nearestRailway: { name: 'Rishikesh / Haridwar Railway Station', distance: 200 },
      roadNote: 'Well-paved hill roads. Heavy snow in Jan–Feb may close final 10km stretch.'
    },
    topPlaces: [
      {
        name: 'Tungnath Temple',
        category: 'temple',
        distance: '3.5 km trek',
        entryFee: 'Free',
        timings: '6 AM – 7 PM',
        duration: '3–4 hrs',
        rating: 4.9,
        description: 'World\'s highest Shiva temple perched at 3,680m altitude.',
        image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', alt: 'Tungnath Temple' },
        photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80']
      }
    ],
    hotels: [
      {
        name: 'Chopta Meadows Eco Camp',
        type: 'camp',
        tier: 'budget',
        priceMin: 2200,
        priceMax: 4500,
        rating: 4.7,
        reviews: 290,
        amenities: ['Alpine Tents', 'Meals Included', 'Bonfire'],
        tags: ['Snow View', 'Camping'],
        image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', alt: 'Chopta Camp' }
      }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Chopta' }],
    faq: [{ q: 'How long is the Tungnath trek from Chopta?', a: 'The Tungnath trek is a well-paved 3.5 km uphill trek taking about 2 to 3 hours.' }],
    seo: {
      title: 'Chopta Travel Guide 2026 — Tungnath Trek, Chandrashila, Hotels | IndiaExplore',
      description: 'Plan your trip to Chopta Uttarakhand: Tungnath temple trek, Chandrashila peak, Deoriatal lake, camps and Rishikesh road route.',
      canonical: 'destination.html?slug=chopta',
      ogImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      keywords: ['Chopta Uttarakhand', 'Tungnath temple trek', 'Chandrashila peak', 'Chopta hotels']
    }
  },
  {
    slug: 'gandikota',
    title: 'Gandikota',
    state: 'Andhra Pradesh',
    country: 'India',
    region: 'Kadapa District',
    type: 'nature',
    badge: 'Grand Canyon of India',
    tagline: 'Spectacular red granite gorge over Pennar River with ancient 13th-century fort ruins',
    image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80', alt: 'Gandikota Fort and Canyon Gorge' },
    heroImage: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=1600&q=80', alt: 'Gandikota Grand Canyon Pennar River View' },
    overview: {
      short: 'Spectacular red granite gorge over the Pennar River with 13th-century fort ruins.',
      description: 'Gandikota is a small village in Kadapa known as the Grand Canyon of India due to its breathtaking gorge. Carved out by the Pennar river cutting through the Erramala hills, the massive red granite gorge and the 13th-century Gandikota fort offer unreal views and cliff camping experiences.',
      features: ['Pennar River Gorge', 'Gandikota Fort', 'Raghunathaswamy Temple', 'Cliffside Sunset Point'],
      rating: 4.8,
      reviewCount: 1940,
      minPrice: 2200,
      distanceFromDelhi: 1850
    },
    bestTime: { label: 'Sep – Mar', months: [1, 2, 3, 9, 10, 11, 12] },
    weather: { lat: 14.8153, lng: 78.2863, tempSummer: '24–38°C', tempWinter: '18–30°C' },
    howToReach: {
      routes: [
        { from: 'Bengaluru', distance: 280, byCar: '5.5 hrs (NH44)', byTrain: '5 hrs to Muddanuru', byAir: 'N/A', via: 'NH44 → Anantapur → Jammalamadugu' },
        { from: 'Hyderabad', distance: 380, byCar: '7 hrs', byTrain: '6 hrs', byAir: 'N/A', via: 'Kurnool → Muddanuru' }
      ],
      nearestAirport: { name: 'Kadapa Airport (CDP)', distance: 77 },
      nearestRailway: { name: 'Jammalamadugu / Muddanuru Railway Station', distance: 18 },
      roadNote: 'Well connected by road from Bengaluru and Hyderabad.'
    },
    topPlaces: [
      { name: 'Gandikota Gorge & Sunset Point', category: 'nature', distance: '0 km', entryFee: 'Free', timings: 'Sunrise – Sunset', duration: '2–3 hrs', rating: 4.9, description: 'Breathtaking canyon cliff view over Pennar River.', image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80', alt: 'Gandikota Gorge' }, photos: ['https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Gandikota Fort Complex', category: 'heritage', distance: '0.5 km', entryFee: 'Free', timings: '6 AM – 6 PM', duration: '2 hrs', rating: 4.7, description: 'Ancient stone fort with granary, palace ruins and watchtowers.', image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80', alt: 'Gandikota Fort' }, photos: ['https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Madhavaraya Temple', category: 'heritage', distance: '0.8 km', entryFee: 'Free', timings: '6 AM – 6 PM', duration: '1 hr', rating: 4.8, description: 'Vijayanagara-style temple with carved gopuram pillars.', image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80', alt: 'Madhavaraya Temple' }, photos: ['https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'APTDC Haritha Resort Gandikota', type: 'resort', tier: 'good', priceMin: 2200, priceMax: 4500, rating: 4.5, reviews: 410, amenities: ['AC Rooms', 'Restaurant', 'Parking'], tags: ['Fort View', 'Resort'], image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=400&q=80', alt: 'APTDC Haritha Resort' } },
      { name: 'Gandikota Cliff Adventure Tents', type: 'camp', tier: 'budget', priceMin: 1800, priceMax: 3500, rating: 4.7, reviews: 310, amenities: ['Tents', 'Bonfire', 'Barbecue'], tags: ['Cliff Camping', 'Adventure'], image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=400&q=80', alt: 'Cliff Camping Tents' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80', alt: 'Gandikota Canyon' }],
    faq: [{ q: 'Why is Gandikota called the Grand Canyon of India?', a: 'Because the Pennar River has carved out a massive red granite gorge cutting through the Erramala hills similar to the Grand Canyon in Arizona.' }],
    seo: {
      title: 'Gandikota Travel Guide 2026 — Grand Canyon of India, Fort, Camping | IndiaExplore',
      description: 'Explore Gandikota in Andhra Pradesh: Grand Canyon gorge over Pennar river, 13th-century fort, cliff camping and route from Bengaluru.',
      canonical: 'destination.html?slug=gandikota',
      ogImage: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80',
      keywords: ['Gandikota Grand Canyon', 'Gandikota fort', 'Pennar river gorge', 'Gandikota camping']
    }
  },
  {
    slug: 'dhanushkodi',
    title: 'Dhanushkodi',
    state: 'Tamil Nadu',
    country: 'India',
    region: 'Pamban Island',
    type: 'beach',
    badge: 'Ghost Town Edge',
    tagline: 'Mysterious ghost town at India\'s tip where the Indian Ocean meets Bay of Bengal',
    image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80', alt: 'Dhanushkodi Beach Edge' },
    heroImage: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1600&q=80', alt: 'Dhanushkodi Ocean Meeting Point' },
    overview: {
      short: 'Mysterious ghost town at India\'s tip where the Indian Ocean meets the Bay of Bengal.',
      description: 'Dhanushkodi is an abandoned ghost town located at the southeastern tip of Pamban Island in Tamil Nadu. Destroyed in the 1964 cyclone, Dhanushkodi features evocative ruins of a church and railway station surrounded by vast blue seas where the calm Bay of Bengal meets the roaring Indian Ocean.',
      features: ['Arichal Munai Confluence', 'Ruined Church & Railway Station', 'Ram Setu Point', 'End of India Road Drive'],
      rating: 4.9,
      reviewCount: 3410,
      minPrice: 2500,
      distanceFromDelhi: 2750
    },
    bestTime: { label: 'Oct – Apr', months: [1, 2, 3, 4, 10, 11, 12] },
    weather: { lat: 9.1761, lng: 79.4143, tempSummer: '26–35°C', tempWinter: '22–30°C' },
    howToReach: {
      routes: [
        { from: 'Madurai', distance: 175, byCar: '3.5 hrs via Pamban Bridge', byTrain: '3.5 hrs to Rameswaram', byAir: 'Flight to Madurai + Taxi', via: 'NH87 → Rameswaram → Dhanushkodi Road' },
        { from: 'Chennai', distance: 580, byCar: '10 hrs', byTrain: 'Overnight Express (RMM Exp)', byAir: 'Flight to Madurai', via: 'Chennai → Trichy → Rameswaram' }
      ],
      nearestAirport: { name: 'Madurai Airport (IXM)', distance: 175 },
      nearestRailway: { name: 'Rameswaram Railway Station (RMM)', distance: 18 },
      roadNote: 'A beautiful 18km sea highway connects Rameswaram to Arichal Munai (Dhanushkodi tip).'
    },
    topPlaces: [
      { name: 'Arichal Munai (Tip of India)', category: 'beach', distance: '0 km', entryFee: 'Free', timings: '6 AM – 6 PM', duration: '2 hrs', rating: 4.9, description: 'Point where the two oceans meet with views of Sri Lanka sea borders.', image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80', alt: 'Arichal Munai' }, photos: ['https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Dhanushkodi Ruins & Church', category: 'heritage', distance: '3 km', entryFee: 'Free', timings: '6 AM – 6 PM', duration: '1.5 hrs', rating: 4.8, description: 'Haunting coral stone ruins of church and station buried in sand.', image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80', alt: 'Dhanushkodi Ruins' }, photos: ['https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Pamban Sea Bridge', category: 'engineering', distance: '18 km', entryFee: 'Free', timings: '24 Hours', duration: '1 hr', rating: 4.9, description: 'Famous railway sea bridge connecting Rameswaram island.', image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80', alt: 'Pamban Bridge' }, photos: ['https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Daiwik Hotels Rameswaram', type: 'hotel', tier: 'best', priceMin: 3500, priceMax: 7000, rating: 4.7, reviews: 620, amenities: ['AC', 'Restaurant', 'Spa'], tags: ['Luxury', 'Rameswaram'], image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=400&q=80', alt: 'Daiwik Hotel' } },
      { name: 'Hotel Jiwan Residency', type: 'hotel', tier: 'good', priceMin: 2500, priceMax: 5000, rating: 4.5, reviews: 380, amenities: ['Sea View', 'Dining', 'WiFi'], tags: ['Beachfront'], image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=400&q=80', alt: 'Jiwan Residency' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80', alt: 'Dhanushkodi Coast' }],
    faq: [{ q: 'Can tourists visit Dhanushkodi ghost town?', a: 'Yes, a paved sea highway allows private vehicles and taxis to travel up to Arichal Munai between 6 AM and 6 PM daily.' }],
    seo: {
      title: 'Dhanushkodi Travel Guide 2026 — Ghost Town, Arichal Munai, Pamban Bridge | IndiaExplore',
      description: 'Discover Dhanushkodi in Tamil Nadu: Ghost town ruins, Arichal Munai ocean confluence, Pamban bridge and Rameswaram stays.',
      canonical: 'destination.html?slug=dhanushkodi',
      ogImage: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
      keywords: ['Dhanushkodi ghost town', 'Arichal Munai', 'Pamban bridge', 'Dhanushkodi Tamil Nadu']
    }
  },
  {
    slug: 'mawlynnong',
    title: 'Mawlynnong',
    state: 'Meghalaya',
    country: 'India',
    region: 'East Khasi Hills',
    type: 'nature',
    badge: 'Asia\'s Cleanest Village',
    tagline: 'Awarded Asia\'s cleanest village with living root bridges and flower gardens',
    image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', alt: 'Living Root Bridge near Mawlynnong' },
    heroImage: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80', alt: 'Mawlynnong Village Flower Gardens' },
    overview: {
      short: 'Awarded Asia\'s cleanest village featuring living root bridges, flower gardens and bamboo skywalks.',
      description: 'Mawlynnong is a picturesque village in Meghalaya famous for its eco-friendly practices and spotlessly clean streets. Referred to as God\'s Own Garden, Mawlynnong is maintained by local Khasi villagers who collect garbage in bamboo dustbins. Nearby Nohwet features an ancient single-decker living root bridge woven across a pristine river stream.',
      features: ['Nohwet Living Root Bridge', 'Sky View Bamboo Tower', 'Balancing Rock', 'Cleanest Village Walk'],
      rating: 4.8,
      reviewCount: 2890,
      minPrice: 1800,
      distanceFromDelhi: 1950
    },
    bestTime: { label: 'Oct – May', months: [1, 2, 3, 4, 5, 10, 11, 12] },
    weather: { lat: 25.2017, lng: 91.9163, tempSummer: '18–28°C', tempWinter: '10–20°C' },
    howToReach: {
      routes: [
        { from: 'Shillong', distance: 78, byCar: '2.5 hrs via Pynursla', byTrain: 'N/A', byAir: 'N/A', via: 'Shillong → Pynursla → Mawlynnong' },
        { from: 'Guwahati', distance: 170, byCar: '4.5 hrs', byTrain: 'Train to Guwahati + Taxi', byAir: 'Flight to Guwahati + Taxi', via: 'Guwahati → Shillong → Mawlynnong' }
      ],
      nearestAirport: { name: 'Shillong Airport (SHL)', distance: 90 },
      nearestRailway: { name: 'Guwahati Railway Station (GHY)', distance: 170 },
      roadNote: 'Paved mountain roads from Shillong passing lush tea gardens and pine forests.'
    },
    topPlaces: [
      { name: 'Nohwet Living Root Bridge', category: 'nature', distance: '1.5 km', entryFee: '₹40', timings: '7 AM – 5 PM', duration: '1.5 hrs', rating: 4.9, description: '180-year-old living root bridge woven over mountain stream.', image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', alt: 'Living Root Bridge' }, photos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Sky View Point Bamboo Tower', category: 'nature', distance: '0.3 km', entryFee: '₹20', timings: '8 AM – 5 PM', duration: '45 mins', rating: 4.7, description: '85ft high bamboo treehouse offering views of Bangladesh plains.', image: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', alt: 'Bamboo Tower' }, photos: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Balancing Rock of Mawlynnong', category: 'nature', distance: '0.5 km', entryFee: 'Free', timings: 'All Day', duration: '30 mins', rating: 4.6, description: 'Massive boulder balancing precariously on a tiny rock base.', image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', alt: 'Balancing Rock' }, photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Mawlynnong Village Homestay', type: 'homestay', tier: 'budget', priceMin: 1800, priceMax: 3200, rating: 4.7, reviews: 290, amenities: ['Bamboo Rooms', 'Local Food', 'Garden'], tags: ['Homestay', 'Village'], image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80', alt: 'Mawlynnong Homestay' } },
      { name: 'Areca Cottages Mawlynnong', type: 'cottage', tier: 'good', priceMin: 2500, priceMax: 4500, rating: 4.6, reviews: 180, amenities: ['Cottages', 'Breakfast', 'Hot Shower'], tags: ['Eco Stay'], image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80', alt: 'Areca Cottages' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', alt: 'Mawlynnong Village' }],
    faq: [{ q: 'Why is Mawlynnong famous as Asia\'s cleanest village?', a: 'In 2003, Discover India magazine awarded it the title of Cleanest Village in Asia due to 100% literacy, community cleaning drives, and hand-woven bamboo dustbins placed outside every home.' }],
    seo: {
      title: 'Mawlynnong Travel Guide 2026 — Asia\'s Cleanest Village, Living Root Bridge | IndiaExplore',
      description: 'Plan your visit to Mawlynnong Meghalaya: Asia\'s cleanest village, Nohwet living root bridge, bamboo sky tower and homestays.',
      canonical: 'destination.html?slug=mawlynnong',
      ogImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      keywords: ['Mawlynnong Meghalaya', 'Asia cleanest village', 'Nohwet living root bridge', 'Mawlynnong homestays']
    }
  },
  {
    slug: 'lonar-crater',
    title: 'Lonar Crater Lake',
    state: 'Maharashtra',
    country: 'India',
    region: 'Buldhana District',
    type: 'nature',
    badge: '50,000-Year Meteorite Lake',
    tagline: 'Ancient saline and alkaline crater lake formed by a hyper-velocity meteor impact',
    image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', alt: 'Lonar Meteorite Crater Lake' },
    heroImage: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80', alt: 'Lonar Crater Rim Panorama' },
    overview: {
      short: 'Ancient saline and alkaline crater lake formed by a hyper-velocity meteor impact.',
      description: 'Lonar Lake is a Geo-heritage monument and unique impact crater lake created by a meteor impact during the Pleistocene Epoch. Surrounded by dense teak forests and 1,000-year-old temples, Lonar is the world\'s only high-velocity impact crater formed in basaltic rock.',
      features: ['Meteor Impact Crater', 'Daitya Sudhan Temple', 'Gomukh Temple Springs', 'Alkaline Lake Trek'],
      rating: 4.7,
      reviewCount: 1650,
      minPrice: 1800,
      distanceFromDelhi: 1200
    },
    bestTime: { label: 'Nov – Mar', months: [1, 2, 3, 11, 12] },
    weather: { lat: 19.9757, lng: 76.5080, tempSummer: '26–40°C', tempWinter: '14–28°C' },
    howToReach: {
      routes: [
        { from: 'Aurangabad', distance: 140, byCar: '3 hrs via Jalna', byTrain: 'Train to Jalna + 2 hr Taxi', byAir: 'Flight to Aurangabad + Taxi', via: 'Aurangabad → Jalna → Lonar' },
        { from: 'Mumbai', distance: 490, byCar: '9 hrs', byTrain: 'Overnight train to Jalna', byAir: 'N/A', via: 'Mumbai → Samruddhi Mahamarg → Jalna → Lonar' }
      ],
      nearestAirport: { name: 'Aurangabad Chhatrapati Sambhajinagar Airport (IXU)', distance: 140 },
      nearestRailway: { name: 'Malkapur / Jalna Railway Station', distance: 90 },
      roadNote: 'Smooth road access via Jalna and Samruddhi Mahamarg expressway.'
    },
    topPlaces: [
      { name: 'Lonar Crater Lake Rim', category: 'nature', distance: '0 km', entryFee: 'Free', timings: '6 AM – 6 PM', duration: '3 hrs', rating: 4.8, description: '1.2 km wide impact crater rim with panoramic views.', image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', alt: 'Crater Lake' }, photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Daitya Sudhan Temple', category: 'heritage', distance: '1.5 km', entryFee: 'Free', timings: '6 AM – 8 PM', duration: '1 hr', rating: 4.8, description: 'Intricately carved 10th-century Chalukyan temple in Lonar town.', image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80', alt: 'Daitya Sudhan Temple' }, photos: ['https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Gomukh Temple Springs', category: 'heritage', distance: '0.8 km', entryFee: 'Free', timings: '6 AM – 6 PM', duration: '1 hr', rating: 4.6, description: 'Perennial fresh water spring flowing into the crater basin.', image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', alt: 'Gomukh Temple' }, photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'MTDC Resort Lonar', type: 'resort', tier: 'budget', priceMin: 1800, priceMax: 3500, rating: 4.4, reviews: 310, amenities: ['Crater View', 'Restaurant', 'Parking'], tags: ['MTDC', 'Crater View'], image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', alt: 'MTDC Resort' } },
      { name: 'Melghat Heritage Lodge', type: 'lodge', tier: 'good', priceMin: 2200, priceMax: 4000, rating: 4.3, reviews: 190, amenities: ['Trek Guides', 'AC Rooms'], tags: ['Heritage'], image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', alt: 'Melghat Lodge' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', alt: 'Lonar Crater' }],
    faq: [{ q: 'How was Lonar Crater Lake formed?', a: 'Lonar Lake was formed by a hyper-velocity meteorite impact about 50,000 years ago into the Deccan basalt rock.' }],
    seo: {
      title: 'Lonar Crater Lake Guide 2026 — Meteor Impact Lake, Temples, MTDC | IndiaExplore',
      description: 'Explore Lonar Crater Lake in Maharashtra: 50,000-year-old meteorite impact lake, Daitya Sudhan temple and Aurangabad road route.',
      canonical: 'destination.html?slug=lonar-crater',
      ogImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      keywords: ['Lonar crater lake', 'Lonar meteorite lake', 'Lonar Maharashtra', 'Daitya Sudhan temple']
    }
  },
  {
    slug: 'daringbadi',
    title: 'Daringbadi',
    state: 'Odisha',
    country: 'India',
    region: 'Kandhamal District',
    type: 'hillstation',
    badge: 'Kashmir of Odisha',
    tagline: 'Picturesque hill station with pine forests, coffee gardens, and winter frost',
    image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Daringbadi Pine Forests' },
    heroImage: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80', alt: 'Daringbadi Coffee Estates and Hills' },
    overview: {
      short: 'Picturesque hill station with pine forests, coffee gardens, and winter frost.',
      description: 'Daringbadi is a serene hill station at 3,000 feet in Odisha surrounded by dense pine forests and coffee plantations. Known for sub-zero winter mornings where dew drops freeze into thin ice, Daringbadi features gushing waterfalls, tribal heritage, organic pepper gardens, and cool mountain air.',
      features: ['Pine Forest Walk', 'Hill View Point', 'Doluri River Waterfalls', 'Coffee Plantations'],
      rating: 4.6,
      reviewCount: 1420,
      minPrice: 2000,
      distanceFromDelhi: 1450
    },
    bestTime: { label: 'Sep – May', months: [1, 2, 3, 4, 5, 9, 10, 11, 12] },
    weather: { lat: 19.9125, lng: 84.1332, tempSummer: '18–32°C', tempWinter: '5–20°C' },
    howToReach: {
      routes: [
        { from: 'Berhampur', distance: 120, byCar: '3 hrs via Bhanjanagar', byTrain: 'Train to Berhampur + Taxi', byAir: 'N/A', via: 'Berhampur → Surada → Daringbadi' },
        { from: 'Bhubaneswar', distance: 245, byCar: '5.5 hrs', byTrain: 'Train to Berhampur', byAir: 'Flight to Bhubaneswar + Taxi', via: 'Bhubaneswar → Phulbani → Daringbadi' }
      ],
      nearestAirport: { name: 'Bhubaneswar Biju Patnaik Airport (BBI)', distance: 245 },
      nearestRailway: { name: 'Berhampur Railway Station (BAM)', distance: 120 },
      roadNote: 'Picturesque ghat road winding through tribal hills and forests.'
    },
    topPlaces: [
      { name: 'Daringbadi Pine Jungle', category: 'nature', distance: '2 km', entryFee: 'Free', timings: 'All Day', duration: '2 hrs', rating: 4.7, description: 'Towering pine forests ideal for peaceful nature walks.', image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', alt: 'Pine Jungle' }, photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Coffee & Black Pepper Garden', category: 'nature', distance: '3 km', entryFee: '₹20', timings: '8 AM – 5 PM', duration: '1.5 hrs', rating: 4.7, description: 'Lush coffee estates with guided plantation tours.', image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', alt: 'Coffee Estate' }, photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Midubanda Waterfall', category: 'nature', distance: '15 km', entryFee: 'Free', timings: '7 AM – 5 PM', duration: '2 hrs', rating: 4.8, description: 'Cascading waterfall hidden deep inside forest reserves.', image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', alt: 'Midubanda Waterfall' }, photos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Deomali Eco Cottage Daringbadi', type: 'resort', tier: 'good', priceMin: 2500, priceMax: 5000, rating: 4.6, reviews: 210, amenities: ['Eco Cottages', 'Dining', 'Campfire'], tags: ['Pine View', 'Eco Resort'], image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', alt: 'Deomali Cottage' } },
      { name: 'OTDC Panthanivas Daringbadi', type: 'hotel', tier: 'budget', priceMin: 2000, priceMax: 3800, rating: 4.4, reviews: 340, amenities: ['AC Rooms', 'Restaurant'], tags: ['OTDC Hotel'], image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', alt: 'OTDC Hotel' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Daringbadi Pine' }],
    faq: [{ q: 'Why is Daringbadi called the Kashmir of Odisha?', a: 'Daringbadi receives winter temperatures below zero degrees Celsius with morning frost covering pine trees and grassy hillsides.' }],
    seo: {
      title: 'Daringbadi Travel Guide 2026 — Kashmir of Odisha, Pine Forests, Waterfalls | IndiaExplore',
      description: 'Plan your trip to Daringbadi Odisha: Kashmir of Odisha pine jungles, coffee plantations, Midubanda falls and OTDC hotels.',
      canonical: 'destination.html?slug=daringbadi',
      ogImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      keywords: ['Daringbadi Odisha', 'Kashmir of Odisha', 'Daringbadi pine forest', 'OTDC Daringbadi']
    }
  },
  {
    slug: 'chembra-peak',
    title: 'Chembra Peak',
    state: 'Kerala',
    country: 'India',
    region: 'Wayanad',
    type: 'adventure',
    badge: 'Natural Heart Lake',
    tagline: 'The highest peak in Wayanad famous for a natural heart-shaped mountain lake',
    image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', alt: 'Heart Shaped Lake Chembra Peak' },
    heroImage: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80', alt: 'Chembra Peak Misty Trek Trail' },
    overview: {
      short: 'The highest peak in Wayanad famous for a natural heart-shaped lake nestled in misty hills.',
      description: 'Chembra Peak stands at 2,100 meters in Wayanad, offering one of Kerala\'s most scenic trekking routes. En route to the summit lies \'Hradayathadakam\', a natural heart-shaped mountain lake that is believed to have never dried up.',
      features: ['Hradayathadakam (Heart Lake)', 'Chembra Peak Trek', 'Tea Estate Views', 'Meenmutty Falls nearby'],
      rating: 4.9,
      reviewCount: 3820,
      minPrice: 2800,
      distanceFromDelhi: 2100
    },
    bestTime: { label: 'Sep – May', months: [1, 2, 3, 4, 5, 9, 10, 11, 12] },
    weather: { lat: 11.5472, lng: 76.0898, tempSummer: '20–30°C', tempWinter: '14–24°C' },
    howToReach: {
      routes: [
        { from: 'Kozhikode (Calicut)', distance: 85, byCar: '2.5 hrs via Thamarassery Ghat', byTrain: 'Train to Kozhikode + Taxi', byAir: 'Flight to Calicut + Taxi', via: 'Calicut → Kalpetta → Meppadi' },
        { from: 'Bengaluru', distance: 290, byCar: '6 hrs via Mysore', byTrain: 'N/A', byAir: 'N/A', via: 'Bengaluru → Mysore → Sulthan Bathery → Meppadi' }
      ],
      nearestAirport: { name: 'Calicut International Airport (CCJ)', distance: 92 },
      nearestRailway: { name: 'Kozhikode Railway Station (CLT)', distance: 85 },
      roadNote: 'Trek start point is at Vellarimala in Meppadi (Wayanad).'
    },
    topPlaces: [
      { name: 'Heart Shaped Lake (Hradayathadakam)', category: 'nature', distance: '3.5 km trek', entryFee: '₹750/group permit', timings: '7 AM – 2 PM', duration: '3 hrs', rating: 4.9, description: 'Perennial heart-shaped lake halfway up Chembra peak.', image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', alt: 'Heart Lake' }, photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Chembra Summit Viewpoint', category: 'adventure', distance: '4.5 km trek', entryFee: 'Included in Permit', timings: '7 AM – 2 PM', duration: '4 hrs', rating: 4.8, description: 'Highest altitude viewpoint looking over Wayanad district.', image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', alt: 'Summit' }, photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Banantara Tea Estate', category: 'nature', distance: '1 km', entryFee: 'Free', timings: 'All Day', duration: '1 hr', rating: 4.7, description: 'Lush tea plantations framing the base of the trek trail.', image: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', alt: 'Tea Estate' }, photos: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Chembra Peak Resort Meppadi', type: 'resort', tier: 'best', priceMin: 3800, priceMax: 7500, rating: 4.7, reviews: 450, amenities: ['Pool', 'Tea Garden View', 'Restaurant'], tags: ['Luxury', 'Resort'], image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', alt: 'Chembra Resort' } },
      { name: 'Wayanad Tea Nest Homestay', type: 'homestay', tier: 'good', priceMin: 2800, priceMax: 4800, rating: 4.6, reviews: 290, amenities: ['Home Meals', 'Garden View'], tags: ['Homestay'], image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', alt: 'Tea Nest Stay' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', alt: 'Chembra Lake' }],
    faq: [{ q: 'Is a permit required for Chembra Peak trek?', a: 'Yes, trek permits are issued by the VSS Meppadi Forest Office at the trailhead (capped per day to protect the ecology).' }],
    seo: {
      title: 'Chembra Peak Guide 2026 — Heart Lake Trek, Wayanad Resorts | IndiaExplore',
      description: 'Plan Chembra Peak Wayanad trek: natural heart-shaped lake, forest permits, tea estate resorts and route from Kozhikode.',
      canonical: 'destination.html?slug=chembra-peak',
      ogImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      keywords: ['Chembra Peak Wayanad', 'heart shaped lake Kerala', 'Chembra trek permit', 'Meppadi resorts']
    }
  },
  {
    slug: 'gurez-valley',
    title: 'Gurez Valley',
    state: 'Jammu & Kashmir',
    country: 'India',
    region: 'BandiPora District',
    type: 'hillstation',
    badge: 'Untouched Border Eden',
    tagline: 'A hidden emerald valley in the High Himalayas along the Kishanganga river',
    image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Gurez Valley Habba Khatoon Peak' },
    heroImage: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80', alt: 'Kishanganga River in Gurez Valley' },
    overview: {
      short: 'A hidden emerald valley in the High Himalayas surrounded by snow peaks and Kishanganga river.',
      description: 'Gurez is a pristine Himalayan valley located at 8,000 feet in northern Kashmir along the ancient Silk Route. Dominated by the pyramid-shaped Habba Khatoon peak, Gurez features crystal turquoise Kishanganga river waters and log cabin villages.',
      features: ['Habba Khatoon Mountain Peak', 'Kishanganga River Rafting', 'Log Cabin Villages', 'Dawar Valley Market'],
      rating: 4.9,
      reviewCount: 1580,
      minPrice: 3000,
      distanceFromDelhi: 890
    },
    bestTime: { label: 'May – Oct', months: [5, 6, 7, 8, 9, 10] },
    weather: { lat: 34.6366, lng: 74.8383, tempSummer: '12–24°C', tempWinter: '-10–5°C' },
    howToReach: {
      routes: [
        { from: 'Srinagar', distance: 125, byCar: '5 hrs via Razdan Pass (11,600ft)', byTrain: 'N/A', byAir: 'Flight to Srinagar + SUV', via: 'Srinagar → Bandipora → Razdan Pass → Dawar Gurez' }
      ],
      nearestAirport: { name: 'Srinagar Sheikh ul-Alam Airport (SXR)', distance: 125 },
      nearestRailway: { name: 'Jammu Tawi / Srinagar Railway Station', distance: 130 },
      roadNote: 'Reachable via Razdan Pass highway (open May to November).'
    },
    topPlaces: [
      { name: 'Habba Khatoon Peak & Spring', category: 'nature', distance: '2 km', entryFee: 'Free', timings: 'All Day', duration: '2 hrs', rating: 4.9, description: 'Iconic pyramid mountain peak rising above Dawar town.', image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', alt: 'Habba Khatoon' }, photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Kishanganga River Banks', category: 'nature', distance: '0.5 km', entryFee: 'Free', timings: 'All Day', duration: '2 hrs', rating: 4.9, description: 'Pristine mountain river popular for trout fishing and camping.', image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', alt: 'Kishanganga River' }, photos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Tulail Valley', category: 'nature', distance: '25 km', entryFee: 'Free', timings: 'Daytime', duration: '3 hrs', rating: 4.8, description: 'Remote wooden log-cabin village valley deeper inside Gurez.', image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', alt: 'Tulail Valley' }, photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Kaka Palace Homestay Dawar', type: 'homestay', tier: 'good', priceMin: 3000, priceMax: 5500, rating: 4.8, reviews: 290, amenities: ['Heated Rooms', 'Kashmiri Meals'], tags: ['Homestay', 'Dawar'], image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', alt: 'Kaka Palace' } },
      { name: 'JKTDC Tourist Bungalow Gurez', type: 'lodge', tier: 'budget', priceMin: 2500, priceMax: 4500, rating: 4.5, reviews: 210, amenities: ['Wooden Rooms', 'Peak View'], tags: ['JKTDC'], image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', alt: 'JKTDC Bungalow' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Gurez Valley' }],
    faq: [{ q: 'Is Gurez Valley open for tourists year-round?', a: 'No, Gurez Valley is accessible by road from May to November; winter snow closes Razdan Pass.' }],
    seo: {
      title: 'Gurez Valley Travel Guide 2026 — Habba Khatoon, Dawar, Srinagar Route | IndiaExplore',
      description: 'Explore Gurez Valley Kashmir: Habba Khatoon peak, Kishanganga river rafting, Tulail valley and Srinagar Razdan pass route.',
      canonical: 'destination.html?slug=gurez-valley',
      ogImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      keywords: ['Gurez Valley Kashmir', 'Habba Khatoon peak', 'Dawar Gurez', 'Razdan pass']
    }
  },
  {
    slug: 'unakoti',
    title: 'Unakoti',
    state: 'Tripura',
    country: 'India',
    region: 'Unakoti District',
    type: 'heritage',
    badge: 'Mysterious Rock Carvings',
    tagline: 'Ancient 7th-9th century rock-cut Shiva sculptures carved directly into rainforest hillsides',
    image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80', alt: 'Unakoti Rock Cut Shiva Head' },
    heroImage: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=1600&q=80', alt: 'Unakoti Ancient Sculptures Hillside' },
    overview: {
      short: 'Ancient 7th-9th century rock-cut bas-relief Shiva sculptures carved directly into rainforest hillsides.',
      description: 'Unakoti, meaning \'one less than a crore\', is an ancient pilgrimage site hidden in the green hills of Tripura. Featuring colossal 30-foot rock carvings of Lord Shiva, Ganesha, and Durga carved into vertical rock walls.',
      features: ['Unakotiswara Kal Bhairav Head', 'Ganesha Rock Reliefs', 'Rainforest Waterfall Trail', 'Ashokastami Mela Fair'],
      rating: 4.8,
      reviewCount: 1240,
      minPrice: 1600,
      distanceFromDelhi: 2300
    },
    bestTime: { label: 'Oct – Apr', months: [1, 2, 3, 4, 10, 11, 12] },
    weather: { lat: 24.3183, lng: 92.0722, tempSummer: '22–34°C', tempWinter: '12–25°C' },
    howToReach: {
      routes: [
        { from: 'Agartala', distance: 160, byCar: '4 hrs via Kailashahar', byTrain: 'Train to Dharmanagar (3 hrs)', byAir: 'Flight to Agartala + Taxi', via: 'Agartala → Teliamura → Dharmanagar → Unakoti' }
      ],
      nearestAirport: { name: 'Agartala Maharaja Bir Bikram Airport (IXA)', distance: 160 },
      nearestRailway: { name: 'Kumarghat / Dharmanagar Railway Station', distance: 20 },
      roadNote: 'Paved highway connectivity from Agartala and Dharmanagar.'
    },
    topPlaces: [
      { name: 'Unakotiswara Kal Bhairav Head', category: 'heritage', distance: '0 km', entryFee: 'Free', timings: '6 AM – 6 PM', duration: '2 hrs', rating: 4.9, description: '30ft tall rock-cut face sculpture of Lord Shiva.', image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80', alt: 'Shiva Head' }, photos: ['https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Ganesha Rock Relief Panel', category: 'heritage', distance: '0.2 km', entryFee: 'Free', timings: '6 AM – 6 PM', duration: '1 hr', rating: 4.8, description: 'Four-armed Ganesha figures carved onto cliff faces.', image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80', alt: 'Ganesha Panel' }, photos: ['https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Unakoti Tourist Lodge Kailashahar', type: 'lodge', tier: 'budget', priceMin: 1600, priceMax: 3000, rating: 4.3, reviews: 180, amenities: ['AC', 'Dining'], tags: ['Government Lodge'], image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=400&q=80', alt: 'Tourist Lodge' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80', alt: 'Unakoti Carvings' }],
    faq: [{ q: 'What does Unakoti mean?', a: 'Unakoti means "one less than a crore" (99,99,999) in Bengali, referring to the legend of Shiva\'s rock carvings.' }],
    seo: {
      title: 'Unakoti Tripura Guide 2026 — Ancient Rock Carvings, Agartala Route | IndiaExplore',
      description: 'Explore Unakoti rock carvings in Tripura: colossal Shiva heads, Ganesha bas-relief panels and Kailashahar lodges.',
      canonical: 'destination.html?slug=unakoti',
      ogImage: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80',
      keywords: ['Unakoti Tripura', 'Unakoti rock carvings', 'Kailashahar Tripura', 'Agartala to Unakoti']
    }
  },
  {
    slug: 'sandakphu',
    title: 'Sandakphu',
    state: 'West Bengal',
    country: 'India',
    region: 'Darjeeling District',
    type: 'adventure',
    badge: 'Everest & Kanchenjunga View',
    tagline: 'Highest peak in West Bengal offering views of Everest, Kanchenjunga, and Lhotse',
    image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Sandakphu Kanchenjunga View' },
    heroImage: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80', alt: 'Sandakphu Sunset' },
    overview: {
      short: 'The highest peak in West Bengal offering panoramic views of Everest, Kanchenjunga, and Lhotse.',
      description: 'Sandakphu at 11,930 feet is the highest point in West Bengal, located on the Singalila Ridge along the Nepal border. It is famous for offering an unmatched vista of four of the world\'s five highest peaks — Everest, Kanchenjunga, Lhotse, and Makalu.',
      features: ['Sleeping Buddha Mountain Range', 'Singalila Ridge Trek', 'Land Rover Vintage Ride', 'Tumling & Kalipokhri Lakes'],
      rating: 4.9,
      reviewCount: 2450,
      minPrice: 2200,
      distanceFromDelhi: 1480
    },
    bestTime: { label: 'Oct – May', months: [1, 2, 3, 4, 5, 10, 11, 12] },
    weather: { lat: 27.1062, lng: 88.0016, tempSummer: '5–15°C', tempWinter: '-8–5°C' },
    howToReach: {
      routes: [
        { from: 'Darjeeling', distance: 32, byCar: '4 hrs via Manebhanjan + Land Rover', byTrain: 'N/A', byAir: 'N/A', via: 'Darjeeling → Manebhanjan → Tumling → Sandakphu' },
        { from: 'Siliguri / NJP', distance: 90, byCar: '3.5 hrs to Manebhanjan base', byTrain: 'Train to NJP + Taxi', byAir: 'Flight to Bagdogra + Taxi', via: 'NJP → Mirik → Manebhanjan' }
      ],
      nearestAirport: { name: 'Bagdogra Airport (IXB)', distance: 95 },
      nearestRailway: { name: 'New Jalpaiguri Railway Station (NJP)', distance: 90 },
      roadNote: 'Base village is Manebhanjan; ascent to summit via vintage 1950s Series Land Rovers or trek.'
    },
    topPlaces: [
      { name: 'Sandakphu Peak Summit', category: 'adventure', distance: '0 km', entryFee: 'Free', timings: 'All Day', duration: '3 hrs', rating: 4.9, description: 'Summit point looking directly over Kanchenjunga & Everest.', image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', alt: 'Summit View' }, photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Kalipokhri Black Lake', category: 'nature', distance: '6 km', entryFee: 'Free', timings: 'All Day', duration: '1 hr', rating: 4.7, description: 'High altitude dark water lake surrounded by prayer flags.', image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', alt: 'Kalipokhri' }, photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Sherpa Chalet Sandakphu', type: 'lodge', tier: 'budget', priceMin: 2200, priceMax: 4500, rating: 4.6, reviews: 310, amenities: ['Heating', 'Himalayan Meals'], tags: ['Summit Lodge'], image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', alt: 'Sherpa Chalet' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Sandakphu' }],
    faq: [{ q: 'Can you see Mount Everest from Sandakphu?', a: 'Yes! Sandakphu is one of the few places in India offering clear vistas of Mount Everest, Kanchenjunga, Lhotse and Makalu simultaneously.' }],
    seo: {
      title: 'Sandakphu Trek Guide 2026 — Everest View, Singalila, Manebhanjan | IndiaExplore',
      description: 'Plan Sandakphu West Bengal trek: view Mount Everest and Kanchenjunga Sleeping Buddha, vintage Land Rover rides and Sherpa chalets.',
      canonical: 'destination.html?slug=sandakphu',
      ogImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      keywords: ['Sandakphu trek', 'Sandakphu Everest view', 'Singalila ridge', 'Manebhanjan Land Rover']
    }
  },
  {
    slug: 'chitrakote-falls',
    title: 'Chitrakote Falls',
    state: 'Chhattisgarh',
    country: 'India',
    region: 'Bastar District',
    type: 'nature',
    badge: 'Niagara Falls of India',
    tagline: 'India\'s widest waterfall plunging 90 feet over Indravati River in horseshoe shape',
    image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', alt: 'Chitrakote Horseshoe Waterfall' },
    heroImage: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80', alt: 'Chitrakote Falls Indravati River Spray' },
    overview: {
      short: 'India\'s widest waterfall over the Indravati river, plunging 90 feet in a horseshoe shape.',
      description: 'Chitrakote Falls is a magnificent 300-meter wide waterfall on the Indravati river in Bastar, Chhattisgarh. Known as the Niagara Falls of India, Chitrakote expands to over 300 meters during the monsoon season.',
      features: ['Horseshoe Waterfall Boat Ride', 'Sunset View Point', 'Teerathgarh Falls nearby', 'Bastar Tribal Crafts'],
      rating: 4.8,
      reviewCount: 2150,
      minPrice: 2000,
      distanceFromDelhi: 1350
    },
    bestTime: { label: 'Jul – Feb', months: [1, 2, 7, 8, 9, 10, 11, 12] },
    weather: { lat: 19.2023, lng: 81.7058, tempSummer: '24–38°C', tempWinter: '14–28°C' },
    howToReach: {
      routes: [
        { from: 'Jagdalpur', distance: 38, byCar: '45 mins via Geedam road', byTrain: 'Train to Jagdalpur + Taxi', byAir: 'N/A', via: 'Jagdalpur → Chitrakote Road' },
        { from: 'Raipur', distance: 275, byCar: '5.5 hrs (NH30)', byTrain: 'Train to Jagdalpur', byAir: 'Flight to Raipur + Taxi', via: 'Raipur → Kanker → Jagdalpur → Chitrakote' }
      ],
      nearestAirport: { name: 'Swami Vivekananda Airport Raipur (RPR)', distance: 275 },
      nearestRailway: { name: 'Jagdalpur Railway Station (JDB)', distance: 38 },
      roadNote: 'Smooth asphalt highway from Jagdalpur town.'
    },
    topPlaces: [
      { name: 'Chitrakote Waterfall Outlook', category: 'nature', distance: '0 km', entryFee: 'Free', timings: 'Sunrise – Sunset', duration: '2 hrs', rating: 4.9, description: 'Panoramic cliff outlook over the 300m wide falls.', image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', alt: 'Waterfall View' }, photos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Indravati River Boat Safari', category: 'adventure', distance: '0.5 km', entryFee: '₹100', timings: '7 AM – 5 PM', duration: '1 hr', rating: 4.8, description: 'Wooden boat ride near the waterfall mist spray.', image: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', alt: 'Boat Ride' }, photos: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Dandami Luxury Resort Chitrakote', type: 'resort', tier: 'good', priceMin: 3200, priceMax: 6500, rating: 4.7, reviews: 380, amenities: ['Waterfall View Cottages', 'Restaurant'], tags: ['Resort', 'Waterfall View'], image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80', alt: 'Dandami Resort' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', alt: 'Chitrakote Falls' }],
    faq: [{ q: 'Why is Chitrakote Falls called the Niagara of India?', a: 'During monsoon months, the waterfall expands to over 300 meters wide across the Indravati river forming a massive horseshoe shape.' }],
    seo: {
      title: 'Chitrakote Falls Guide 2026 — Niagara Falls of India, Bastar | IndiaExplore',
      description: 'Explore Chitrakote Falls in Bastar Chhattisgarh: Niagara of India horseshoe waterfall, Indravati boat safari and Dandami resort.',
      canonical: 'destination.html?slug=chitrakote-falls',
      ogImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      keywords: ['Chitrakote Falls Chhattisgarh', 'Niagara Falls of India', 'Bastar tourist places', 'Indravati river waterfall']
    }
  },
  {
    slug: 'shekhawati',
    title: 'Shekhawati',
    state: 'Rajasthan',
    country: 'India',
    region: 'Jhunjhunu & Sikar',
    type: 'heritage',
    badge: 'Open-Air Art Gallery',
    tagline: 'Historic region renowned for grand merchant havelis adorned with vibrant fresco murals',
    image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80', alt: 'Shekhawati Painted Haveli Fresco' },
    heroImage: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=1600&q=80', alt: 'Mandawa Haveli Courtyard' },
    overview: {
      short: 'Historic region renowned for grand merchant havelis adorned with vibrant fresco murals.',
      description: 'Shekhawati is a semi-arid region in Rajasthan famed as the world\'s largest open-air art gallery. Built by wealthy Marwari merchants during the 18th-19th centuries, thousands of grand havelis in Mandawa, Nawalgarh, and Fatehpur are decorated with intricate wall frescoes.',
      features: ['Fresco Painted Haveli Walk', 'Mandawa Fort', 'Nawalgarh Heritage Mansions', 'Camel Safari'],
      rating: 4.7,
      reviewCount: 1840,
      minPrice: 2500,
      distanceFromDelhi: 230
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 28.1289, lng: 75.3994, tempSummer: '24–42°C', tempWinter: '8–24°C' },
    howToReach: {
      routes: [
        { from: 'Delhi', distance: 230, byCar: '4.5 hrs via Gurgaon-Rewari', byTrain: '4 hrs to Jhunjhunu', byAir: 'N/A', via: 'Delhi → Rewari → Narnaul → Jhunjhunu → Mandawa' },
        { from: 'Jaipur', distance: 165, byCar: '3.5 hrs', byTrain: 'Train to Sikar / Nawalgarh', byAir: 'Flight to Jaipur + Taxi', via: 'Jaipur → Sikar → Nawalgarh' }
      ],
      nearestAirport: { name: 'Jaipur International Airport (JAI)', distance: 165 },
      nearestRailway: { name: 'Jhunjhunu / Nawalgarh Railway Station', distance: 15 },
      roadNote: 'Easy highway access from Delhi and Jaipur.'
    },
    topPlaces: [
      { name: 'Mandawa Haveli Trail', category: 'heritage', distance: '0 km', entryFee: 'Free', timings: 'All Day', duration: '3 hrs', rating: 4.8, description: 'Cobblestone streets lined with painted Marwari mansions.', image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80', alt: 'Mandawa Haveli' }, photos: ['https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Nawalgarh Poddar Haveli Museum', category: 'heritage', distance: '25 km', entryFee: '₹100', timings: '8 AM – 6 PM', duration: '2 hrs', rating: 4.8, description: 'Restored 1902 haveli museum showcasing restored fresco murals.', image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80', alt: 'Poddar Haveli' }, photos: ['https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Castle Mandawa Heritage Hotel', type: 'resort', tier: 'best', priceMin: 5500, priceMax: 12000, rating: 4.8, reviews: 510, amenities: ['Heritage Rooms', 'Pool', 'Royal Dining'], tags: ['Heritage Castle'], image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=400&q=80', alt: 'Castle Mandawa' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80', alt: 'Shekhawati Haveli' }],
    faq: [{ q: 'What is unique about Shekhawati havelis?', a: 'Shekhawati havelis feature grand outdoor and indoor fresco murals painted with natural mineral dyes illustrating folklore, gods, and historical events.' }],
    seo: {
      title: 'Shekhawati Travel Guide 2026 — Painted Havelis, Mandawa, Castle Hotels | IndiaExplore',
      description: 'Explore Shekhawati in Rajasthan: open-air art gallery of painted Marwari havelis in Mandawa & Nawalgarh, castle hotels and Delhi road route.',
      canonical: 'destination.html?slug=shekhawati',
      ogImage: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80',
      keywords: ['Shekhawati Rajasthan', 'Mandawa haveli', 'Nawalgarh haveli', 'Castle Mandawa']
    }
  },
  {
    slug: 'dholavira',
    title: 'Dholavira',
    state: 'Gujarat',
    country: 'India',
    region: 'Kutch District',
    type: 'heritage',
    badge: '4500-Year Harappan City',
    tagline: 'UNESCO World Heritage ancient Indus Valley Harappan metropolis in Rann of Kutch',
    image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', alt: 'Dholavira Harappan Excavation Ruins' },
    heroImage: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80', alt: 'Dholavira Ancient Citadel & White Rann Road' },
    overview: {
      short: 'UNESCO World Heritage ancient Indus Valley Harappan metropolis in the middle of Rann of Kutch.',
      description: 'Dholavira on Khadir Bet island in Kutch is one of the most prominent archaeological sites of the Indus Valley Civilization. Dating back to 2600 BCE, Dholavira features world-first stone water reservoirs, a planned grid citadel, and the famous \'Road to Heaven\' highway.',
      features: ['UNESCO Harappan Citadel', 'Ancient Water Reservoirs', 'Fossil Park', 'Road to Heaven Rann Drive'],
      rating: 4.8,
      reviewCount: 1560,
      minPrice: 2400,
      distanceFromDelhi: 1050
    },
    bestTime: { label: 'Nov – Mar', months: [1, 2, 3, 11, 12] },
    weather: { lat: 23.8863, lng: 70.2131, tempSummer: '26–42°C', tempWinter: '12–28°C' },
    howToReach: {
      routes: [
        { from: 'Bhuj', distance: 215, byCar: '3.5 hrs via Road to Heaven', byTrain: 'Train to Bhuj + SUV', byAir: 'Flight to Bhuj + SUV', via: 'Bhuj → Bhachau → Khadir Bet Road to Heaven' }
      ],
      nearestAirport: { name: 'Bhuj Airport (BHJ)', distance: 215 },
      nearestRailway: { name: 'Samakhiali / Bhuj Railway Station', distance: 135 },
      roadNote: 'Sensational 30km "Road to Heaven" highway cutting across the white salt flats.'
    },
    topPlaces: [
      { name: 'Dholavira Harappan Excavation Site', category: 'heritage', distance: '0 km', entryFee: '₹25', timings: '8 AM – 6 PM', duration: '3 hrs', rating: 4.9, description: 'Ancient stone citadel, Bailey, and market streets.', image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', alt: 'Excavation Site' }, photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Road to Heaven (Khadir Bet Drive)', category: 'nature', distance: '10 km', entryFee: 'Free', timings: 'All Day', duration: '1 hr', rating: 4.9, description: 'Breathtaking 30km highway cutting through white salt waters.', image: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', alt: 'Road to Heaven' }, photos: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Dholavira Tourism Resort & Tents', type: 'resort', tier: 'good', priceMin: 3200, priceMax: 6000, rating: 4.6, reviews: 240, amenities: ['Kutchi Huts', 'Buffet Meals'], tags: ['Resort', 'Bhunga Stay'], image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', alt: 'Dholavira Resort' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', alt: 'Dholavira' }],
    faq: [{ q: 'Why is Dholavira famous?', a: 'Dholavira is a UNESCO World Heritage Indus Valley site famous for sophisticated urban water management, grand stone citadel, and ancient Harappan signboards.' }],
    seo: {
      title: 'Dholavira Travel Guide 2026 — UNESCO Harappan Site, Road to Heaven | IndiaExplore',
      description: 'Discover Dholavira in Kutch Gujarat: UNESCO Indus Valley Harappan excavation ruins, Road to Heaven Rann drive and Kutchi resorts.',
      canonical: 'destination.html?slug=dholavira',
      ogImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      keywords: ['Dholavira Gujarat', 'Road to Heaven Kutch', 'Dholavira Harappan site', 'Dholavira resort']
    }
  },
  {
    slug: 'zanskar-valley',
    title: 'Zanskar Valley',
    state: 'Ladakh',
    country: 'India',
    region: 'Kargil District',
    type: 'adventure',
    badge: 'Remote Himalayan Haven',
    tagline: 'Isolated high-altitude valley famous for Phugtal cave monastery and Chadar frozen river trek',
    image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', alt: 'Zanskar Valley Peaks' },
    heroImage: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80', alt: 'Phugtal Cave Monastery Zanskar' },
    overview: {
      short: 'Isolated high-altitude valley famous for Phugtal cave monastery and Chadar frozen river trek.',
      description: 'Zanskar Valley is a semi-arid high altitude desert valley in Ladakh surrounded by snow-capped peaks. Renowned for the honeycomb-like Phugtal Gompa built into a cliff cave entrance and the winter Chadar trek over the frozen Zanskar river.',
      features: ['Phugtal Cave Monastery', 'Chadar Frozen River Trek', 'Drang Drung Glacier', 'Padum Town'],
      rating: 4.9,
      reviewCount: 1890,
      minPrice: 3500,
      distanceFromDelhi: 1050
    },
    bestTime: { label: 'Jun – Sep, Jan – Feb', months: [1, 2, 6, 7, 8, 9] },
    weather: { lat: 33.4986, lng: 76.8407, tempSummer: '10–22°C', tempWinter: '-25–0°C' },
    howToReach: {
      routes: [
        { from: 'Leh', distance: 230, byCar: '6 hrs via Shinku La / Pensi La', byTrain: 'N/A', byAir: 'Flight to Leh + 4x4', via: 'Leh → Kargil → Padum' }
      ],
      nearestAirport: { name: 'Kushok Bakula Rimpoche Airport Leh (IXL)', distance: 230 },
      nearestRailway: { name: 'Jammu Tawi Railway Station', distance: 550 },
      roadNote: '4x4 SUV recommended due to mountain passes.'
    },
    topPlaces: [
      { name: 'Phugtal Monastery', category: 'heritage', distance: '0 km', entryFee: 'Free', timings: 'All Day', duration: '3 hrs', rating: 4.9, description: 'Cliffside cave monastery built into a natural limestone cliff face.', image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', alt: 'Phugtal Monastery' }, photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Drang Drung Glacier', category: 'nature', distance: '40 km', entryFee: 'Free', timings: 'Daytime', duration: '2 hrs', rating: 4.9, description: 'Massive winding ice river glacier viewed from Pensi La pass.', image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', alt: 'Drang Drung Glacier' }, photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Padum Himalayan Homestay', type: 'homestay', tier: 'good', priceMin: 3500, priceMax: 6500, rating: 4.7, reviews: 190, amenities: ['Heated Rooms', 'Ladakhi Meals'], tags: ['Homestay', 'Padum'], image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', alt: 'Padum Homestay' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', alt: 'Zanskar' }],
    faq: [{ q: 'What is the Chadar Trek in Zanskar?', a: 'The Chadar Trek is a legendary winter trek over the frozen Zanskar River when temperatures drop to -20°C.' }],
    seo: {
      title: 'Zanskar Valley Guide 2026 — Phugtal Monastery, Chadar Trek | IndiaExplore',
      description: 'Explore Zanskar Valley in Ladakh: Phugtal cave monastery, Chadar frozen river trek, Drang Drung glacier and Padum homestays.',
      canonical: 'destination.html?slug=zanskar-valley',
      ogImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      keywords: ['Zanskar Valley Ladakh', 'Phugtal monastery', 'Chadar trek', 'Padum Zanskar']
    }
  },
  {
    slug: 'polo-forest',
    title: 'Polo Forest',
    state: 'Gujarat',
    country: 'India',
    region: 'Sabarkantha District',
    type: 'nature',
    badge: 'Ancient Forest Ruins',
    tagline: 'Ancient 15th-century Jain and Hindu temple ruins hidden deep inside dense teak forests',
    image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', alt: 'Polo Forest Temple Ruins' },
    heroImage: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80', alt: 'Harnav River and Polo Forest' },
    overview: {
      short: 'Ancient 15th-century Jain and Hindu temple ruins hidden deep inside dense teak forests.',
      description: 'Polo Forest (Vijaynagar) is a dense green forest surrounding ancient 15th-century ruined temples. Flanked by the Aravalli hills and bisected by the Harnav river, Polo Forest features stone carved Jain and Shiva temple ruins overgrown with moss.',
      features: ['Sharaneshwar Temple Ruins', 'Harnav Dam & River Walk', 'Vireshwar Temple', 'Teak Jungle Trekking'],
      rating: 4.7,
      reviewCount: 2120,
      minPrice: 2200,
      distanceFromDelhi: 850
    },
    bestTime: { label: 'Aug – Feb', months: [1, 2, 8, 9, 10, 11, 12] },
    weather: { lat: 23.9575, lng: 73.2842, tempSummer: '24–40°C', tempWinter: '14–28°C' },
    howToReach: {
      routes: [
        { from: 'Ahmedabad', distance: 150, byCar: '3 hrs via Himmatnagar & Idar', byTrain: 'Train to Himmatnagar', byAir: 'Flight to Ahmedabad + Taxi', via: 'Ahmedabad → Idar → Vijaynagar → Polo Forest' }
      ],
      nearestAirport: { name: 'Sardar Vallabhbhai Patel Airport Ahmedabad (AMD)', distance: 150 },
      nearestRailway: { name: 'Himmatnagar / Idar Railway Station', distance: 40 },
      roadNote: 'Smooth road route through Idar rock formations.'
    },
    topPlaces: [
      { name: 'Sharaneshwar Shiva Temple Ruins', category: 'heritage', distance: '0 km', entryFee: 'Free', timings: '7 AM – 6 PM', duration: '2 hrs', rating: 4.8, description: 'Detailed 15th-century stone temple with carved pillars in the forest.', image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', alt: 'Sharaneshwar Temple' }, photos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Polo Retreat Resort', type: 'resort', tier: 'good', priceMin: 3200, priceMax: 5500, rating: 4.6, reviews: 210, amenities: ['AC Rooms', 'Restaurant', 'Jungle View'], tags: ['Eco Resort'], image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80', alt: 'Polo Retreat' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', alt: 'Polo Forest' }],
    faq: [{ q: 'Where is Polo Forest located?', a: 'Polo Forest is located near Vijaynagar town in Sabarkantha district, Gujarat, about 150 km from Ahmedabad.' }],
    seo: {
      title: 'Polo Forest Gujarat Guide 2026 — Ancient Temple Ruins, Camps | IndiaExplore',
      description: 'Discover Polo Forest in Gujarat: 15th-century ruined temples in teak jungle, Harnav dam and eco-resorts near Ahmedabad.',
      canonical: 'destination.html?slug=polo-forest',
      ogImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      keywords: ['Polo Forest Gujarat', 'Polo forest temple ruins', 'Vijaynagar forest', 'Ahmedabad weekend trip']
    }
  },
  {
    slug: 'tranquebar',
    title: 'Tranquebar (Tharangambadi)',
    state: 'Tamil Nadu',
    country: 'India',
    region: 'Mayiladuthurai District',
    type: 'beach',
    badge: 'Danish Colonial Haven',
    tagline: 'Historic 17th-century Danish seaside colony with Fort Dansborg and ozone sea breeze',
    image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80', alt: 'Fort Dansborg Tranquebar' },
    heroImage: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1600&q=80', alt: 'Tranquebar Danish Coast Fort' },
    overview: {
      short: 'Historic 17th-century Danish seaside colony with Fort Dansborg and ozone-rich sea breeze.',
      description: 'Tharangambadi (Tranquebar) served as a Danish trading colony from 1620 to 1845. Dominating the shoreline is Fort Dansborg, a yellow-painted sea fort. The quiet cobblestone streets feature Danish colonial bungalows.',
      features: ['Fort Dansborg', 'Zion Church & Danish Museum', 'Town Gate (Landporten)', 'Quiet Ozone Coast Walk'],
      rating: 4.8,
      reviewCount: 1750,
      minPrice: 3200,
      distanceFromDelhi: 2350
    },
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    weather: { lat: 11.0267, lng: 79.8544, tempSummer: '26–36°C', tempWinter: '22–30°C' },
    howToReach: {
      routes: [
        { from: 'Chennai', distance: 275, byCar: '5.5 hrs via East Coast Road', byTrain: 'Train to Mayiladuthurai', byAir: 'Flight to Trichy + Taxi', via: 'Chennai → Puducherry → Karaikal → Tranquebar' }
      ],
      nearestAirport: { name: 'Tiruchirappalli Airport (TRZ)', distance: 155 },
      nearestRailway: { name: 'Mayiladuthurai Railway Station', distance: 30 },
      roadNote: 'Scenic seaside drive along the East Coast Road.'
    },
    topPlaces: [
      { name: 'Fort Dansborg', category: 'heritage', distance: '0 km', entryFee: '₹10', timings: '9 AM – 5 PM', duration: '2 hrs', rating: 4.8, description: 'Danish sea fortress built in 1620 housing maritime artifacts.', image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80', alt: 'Fort Dansborg' }, photos: ['https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Bungalow on the Beach - Neemrana', type: 'resort', tier: 'best', priceMin: 5500, priceMax: 11000, rating: 4.8, reviews: 310, amenities: ['Sea View', 'Dining', 'Pool'], tags: ['Neemrana', 'Heritage'], image: { src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=400&q=80', alt: 'Bungalow on the Beach' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80', alt: 'Tranquebar' }],
    faq: [{ q: 'What is Tranquebar known for?', a: 'Tranquebar is known for Fort Dansborg, its Danish colonial history, and being the land of singing waves with high natural ozone content.' }],
    seo: {
      title: 'Tranquebar Travel Guide 2026 — Fort Dansborg, Danish Colony | IndiaExplore',
      description: 'Explore Tranquebar (Tharangambadi) Tamil Nadu: Fort Dansborg, Danish colonial beach bungalows and Neemrana sea resorts.',
      canonical: 'destination.html?slug=tranquebar',
      ogImage: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
      keywords: ['Tranquebar Tamil Nadu', 'Fort Dansborg', 'Tharangambadi', 'Neemrana Tranquebar']
    }
  },
  {
    slug: 'jibhi',
    title: 'Jibhi',
    state: 'Himachal Pradesh',
    country: 'India',
    region: 'Banjar Valley / Kullu',
    type: 'hillstation',
    badge: 'Untouched Pine Valley',
    tagline: 'Charming alpine hamlet with wooden treehouses, freshwater streams, and Jalori Pass',
    image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Jibhi Wooden Cottage Stream' },
    heroImage: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80', alt: 'Jibhi Waterfall and Pine Forest' },
    overview: {
      short: 'Charming alpine hamlet with wooden treehouses, freshwater streams, and Jalori Pass.',
      description: 'Jibhi is a serene village in Tirthan valley surrounded by dense pine, deodar, and apple orchards. Famous for wooden bridges crossing gushing mountain streams, Jibhi is the base for trekking to Jalori Pass (3,125m).',
      features: ['Jibhi Waterfall', 'Jalori Pass Trek (3,125m)', 'Serolsar Lake Trek', 'Wooden Treehouse Stays'],
      rating: 4.9,
      reviewCount: 3120,
      minPrice: 1800,
      distanceFromDelhi: 490
    },
    bestTime: { label: 'Mar – Jun, Sep – Nov', months: [3, 4, 5, 6, 9, 10, 11] },
    weather: { lat: 31.6373, lng: 77.4728, tempSummer: '12–25°C', tempWinter: '-2–15°C' },
    howToReach: {
      routes: [
        { from: 'Delhi', distance: 490, byCar: '10 hrs via Chandigarh-Mandi', byTrain: 'Train to Chandigarh + Bus/Taxi', byAir: 'Flight to Kullu + Taxi', via: 'Delhi → Chandigarh → Mandi → Aut → Jibhi' }
      ],
      nearestAirport: { name: 'Kullu Manali Airport Bhuntar (KUU)', distance: 50 },
      nearestRailway: { name: 'Chandigarh Railway Station', distance: 250 },
      roadNote: 'Turn right after Aut tunnel towards Banjar / Jibhi.'
    },
    topPlaces: [
      { name: 'Jibhi Waterfall', category: 'nature', distance: '1.5 km', entryFee: 'Free', timings: 'All Day', duration: '1.5 hrs', rating: 4.8, description: 'Picturesque waterfall reached via wooden bridges in pine forest.', image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', alt: 'Jibhi Waterfall' }, photos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Jibhi Treehouse Eco Resort', type: 'resort', tier: 'good', priceMin: 3200, priceMax: 6500, rating: 4.8, reviews: 410, amenities: ['Treehouses', 'Bonfire', 'Stream View'], tags: ['Treehouse', 'Nature'], image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', alt: 'Treehouse' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Jibhi' }],
    faq: [{ q: 'What is Jibhi famous for?', a: 'Jibhi is famous for wooden treehouses, freshwater trout streams, pine forests, and Jalori Pass trekking.' }],
    seo: {
      title: 'Jibhi Travel Guide 2026 — Treehouses, Jalori Pass, Waterfalls | IndiaExplore',
      description: 'Plan your trip to Jibhi Himachal Pradesh: wooden treehouses, Jalori Pass trek, Serolsar lake and Delhi Volvo route.',
      canonical: 'destination.html?slug=jibhi',
      ogImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      keywords: ['Jibhi Himachal Pradesh', 'Jibhi treehouses', 'Jalori pass trek', 'Tirthan valley Jibhi']
    }
  },
  {
    slug: 'bhedaghat',
    title: 'Bhedaghat',
    state: 'Madhya Pradesh',
    country: 'India',
    region: 'Jabalpur District',
    type: 'nature',
    badge: '100ft Marble Rocks Gorge',
    tagline: 'Soaring 100ft white marble cliffs lining Narmada river with moonlight boat rides',
    image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', alt: 'Bhedaghat Marble Rocks Narmada' },
    heroImage: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80', alt: 'Dhuandhar Waterfall Bhedaghat' },
    overview: {
      short: 'Soaring 100ft white marble cliffs lining the Narmada river with moonlight boat rides.',
      description: 'Bhedaghat is famous for its 100-foot towering marble rock gorge carved by the Narmada river near Jabalpur. Boating between the glowing white marble rocks — especially on full moon nights — is a magical experience.',
      features: ['Marble Rocks Boat Safari', 'Dhuandhar Waterfall', 'Chausath Yogini Temple', 'Ropeway Sky Ride'],
      rating: 4.8,
      reviewCount: 2850,
      minPrice: 2000,
      distanceFromDelhi: 820
    },
    bestTime: { label: 'Nov – May', months: [1, 2, 3, 4, 5, 11, 12] },
    weather: { lat: 23.1311, lng: 79.8005, tempSummer: '24–42°C', tempWinter: '10–26°C' },
    howToReach: {
      routes: [
        { from: 'Jabalpur', distance: 22, byCar: '35 mins via Tilwara Ghat', byTrain: 'Train to Jabalpur + Taxi', byAir: 'Flight to Jabalpur + Taxi', via: 'Jabalpur → Bhedaghat Road' }
      ],
      nearestAirport: { name: 'Jabalpur Dumna Airport (JLR)', distance: 35 },
      nearestRailway: { name: 'Jabalpur Junction Railway Station', distance: 22 },
      roadNote: 'Smooth city highway from Jabalpur town.'
    },
    topPlaces: [
      { name: 'Marble Rocks Gorge', category: 'nature', distance: '0 km', entryFee: '₹100/boat', timings: '7 AM – 6 PM', duration: '1.5 hrs', rating: 4.9, description: 'Boating between 100ft high white and colored marble cliffs.', image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', alt: 'Marble Rocks' }, photos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'] },
      { name: 'Dhuandhar Waterfalls', category: 'nature', distance: '2 km', entryFee: 'Free', timings: '6 AM – 8 PM', duration: '1.5 hrs', rating: 4.8, description: 'Thunderous waterfall creating a permanent cloud of mist spray.', image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', alt: 'Dhuandhar Waterfall' }, photos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'MPT Rockwoods Bhedaghat', type: 'resort', tier: 'good', priceMin: 3000, priceMax: 5500, rating: 4.6, reviews: 320, amenities: ['Restaurant', 'River View', 'AC'], tags: ['MP Tourism'], image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80', alt: 'MPT Rockwoods' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', alt: 'Bhedaghat' }],
    faq: [{ q: 'What is full moon boating at Bhedaghat?', a: 'During full moon nights, special boat rides operate along the Narmada marble rocks gorge as the white marble shines under moonlight.' }],
    seo: {
      title: 'Bhedaghat Marble Rocks Guide 2026 — Dhuandhar Falls, Jabalpur | IndiaExplore',
      description: 'Explore Bhedaghat in Madhya Pradesh: Marble rocks gorge boat ride, Dhuandhar waterfall and Jabalpur hotels.',
      canonical: 'destination.html?slug=bhedaghat',
      ogImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      keywords: ['Bhedaghat marble rocks', 'Dhuandhar falls', 'Bhedaghat Jabalpur', 'Narmada marble gorge']
    }
  },
  {
    slug: 'valparai',
    title: 'Valparai',
    state: 'Tamil Nadu',
    country: 'India',
    region: 'Coimbatore District',
    type: 'hillstation',
    badge: 'Misty Rainforest Plateau',
    tagline: 'Serene hill station at 3,500 feet with 40 hairpin bends and tea estates',
    image: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Valparai Tea Gardens' },
    heroImage: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80', alt: 'Valparai Sholayar Dam View' },
    overview: {
      short: 'Serene hill station at 3,500 feet with 40 hairpin bends, lush tea estates, and wildlife.',
      description: 'Valparai is a pristine hill station in the Anaimalai Hills surrounded by tea plantations and rainforest reserves. Drive up via 40 thrilling hairpin bends starting from Aliyar dam.',
      features: ['Sholayar Dam Viewpoint', 'Aliyar Dam Hairpin Bends', 'Niramai Tea Estates', 'Chinnakallar Waterfalls'],
      rating: 4.8,
      reviewCount: 2410,
      minPrice: 2500,
      distanceFromDelhi: 2450
    },
    bestTime: { label: 'Sep – May', months: [1, 2, 3, 4, 5, 9, 10, 11, 12] },
    weather: { lat: 10.3262, lng: 76.9554, tempSummer: '18–28°C', tempWinter: '12–22°C' },
    howToReach: {
      routes: [
        { from: 'Coimbatore', distance: 110, byCar: '3.5 hrs via Pollachi & 40 Hairpins', byTrain: 'Train to Pollachi', byAir: 'Flight to Coimbatore + Taxi', via: 'Coimbatore → Pollachi → Aliyar Dam → Valparai' }
      ],
      nearestAirport: { name: 'Coimbatore International Airport (CJB)', distance: 120 },
      nearestRailway: { name: 'Pollachi Junction Railway Station', distance: 65 },
      roadNote: 'Scenic mountain climb featuring 40 numbered hairpin curves.'
    },
    topPlaces: [
      { name: 'Sholayar Dam', category: 'nature', distance: '20 km', entryFee: 'Free', timings: '8 AM – 5 PM', duration: '2 hrs', rating: 4.8, description: 'Second deepest dam in Asia offering vast reservoir views.', image: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', alt: 'Sholayar Dam' }, photos: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Briar Tea Bungalows Valparai', type: 'resort', tier: 'best', priceMin: 4500, priceMax: 9000, rating: 4.8, reviews: 290, amenities: ['Colonial Bungalows', 'Tea Estate View'], tags: ['Heritage', 'Tea Estate'], image: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', alt: 'Briar Bungalow' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Valparai' }],
    faq: [{ q: 'How many hairpin bends are there to Valparai?', a: 'There are 40 numbered hairpin bends on the scenic ghat road from Aliyar dam up to Valparai.' }],
    seo: {
      title: 'Valparai Travel Guide 2026 — Tea Estates, Sholayar Dam | IndiaExplore',
      description: 'Explore Valparai in Tamil Nadu: 40 hairpin bends ghat road, tea estate planter bungalows, Sholayar dam and Pollachi route.',
      canonical: 'destination.html?slug=valparai',
      ogImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      keywords: ['Valparai Tamil Nadu', 'Valparai tea estates', 'Sholayar dam', 'Valparai 40 hairpin bends']
    }
  },
  {
    slug: 'tamhini-ghat',
    title: 'Tamhini Ghat',
    state: 'Maharashtra',
    country: 'India',
    region: 'Pune & Raigad District',
    type: 'nature',
    badge: 'Monsoon Waterfall Pass',
    tagline: 'Scenic mountain pass renowned for green valleys and cascading monsoon waterfalls',
    image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', alt: 'Tamhini Ghat Monsoon Waterfalls' },
    heroImage: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80', alt: 'Tamhini Ghat Mist and Green Valleys' },
    overview: {
      short: 'Scenic mountain pass renowned for lush green valleys, cascading waterfalls, and monsoon mist.',
      description: 'Tamhini Ghat is a mountain pass located between Mulshi and Kolad in the Western Ghats of Maharashtra.',
      features: ['Mulshi Dam Lake View', 'Plus Valley Trek', 'Tamhini Waterfalls', 'Kolad White Water Rafting nearby'],
      rating: 4.8,
      reviewCount: 3560,
      minPrice: 2200,
      distanceFromDelhi: 1420
    },
    bestTime: { label: 'Jul – Nov', months: [7, 8, 9, 10, 11] },
    weather: { lat: 18.4735, lng: 73.4150, tempSummer: '20–34°C', tempWinter: '15–26°C' },
    howToReach: {
      routes: [
        { from: 'Pune', distance: 65, byCar: '2 hrs via Paud & Mulshi', byTrain: 'Train to Pune', byAir: 'Flight to Pune + Car', via: 'Pune → Pirangut → Paud → Mulshi → Tamhini' }
      ],
      nearestAirport: { name: 'Pune International Airport (PNQ)', distance: 70 },
      nearestRailway: { name: 'Pune Junction Railway Station', distance: 65 },
      roadNote: 'Sensational monsoon drive along scenic ghat roads.'
    },
    topPlaces: [
      { name: 'Mulshi Dam Backwaters', category: 'nature', distance: '10 km', entryFee: 'Free', timings: 'All Day', duration: '2 hrs', rating: 4.8, description: 'Vast calm lake backwaters framed by green Sahyadri hills.', image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', alt: 'Mulshi Dam' }, photos: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Mulshi Lake Resort Tamhini', type: 'resort', tier: 'good', priceMin: 3500, priceMax: 7000, rating: 4.6, reviews: 310, amenities: ['Infinity Pool', 'Lake View', 'Restaurant'], tags: ['Monsoon Resort'], image: { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', alt: 'Mulshi Resort' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', alt: 'Tamhini Ghat' }],
    faq: [{ q: 'When is the best time to visit Tamhini Ghat?', a: 'During the monsoon months from July to September when waterfalls and mist cover the mountains.' }],
    seo: {
      title: 'Tamhini Ghat Guide 2026 — Monsoon Waterfalls, Mulshi Lake | IndiaExplore',
      description: 'Plan your trip to Tamhini Ghat Maharashtra: monsoon waterfalls, Mulshi dam backwaters, Plus valley trek and Pune road drive.',
      canonical: 'destination.html?slug=tamhini-ghat',
      ogImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      keywords: ['Tamhini Ghat monsoon', 'Mulshi dam backwaters', 'Tamhini waterfalls', 'Pune to Tamhini ghat']
    }
  },
  {
    slug: 'loktak-lake',
    title: 'Loktak Lake',
    state: 'Manipur',
    country: 'India',
    region: 'Bishnupur District',
    type: 'nature',
    badge: 'World\'s Only Floating Park',
    tagline: 'Northeast India\'s largest freshwater lake famous for floating phumdi rings',
    image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', alt: 'Loktak Lake Floating Phumdis' },
    heroImage: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80', alt: 'Keibul Lamjao National Park Floating Rings' },
    overview: {
      short: 'Northeast India\'s largest freshwater lake famous for floating phumdi rings and Sangai deer.',
      description: 'Loktak Lake is the largest freshwater lake in Northeast India, famous for its unique circular floating biomass islands called \'phumdis\'. On the largest phumdi lies Keibul Lamjao National Park.',
      features: ['Keibul Lamjao Floating National Park', 'Sangai Brow-Antlered Deer', 'Sendra Island Homestays', 'Phumdi Boating'],
      rating: 4.9,
      reviewCount: 1680,
      minPrice: 2400,
      distanceFromDelhi: 2400
    },
    bestTime: { label: 'Oct – Apr', months: [1, 2, 3, 4, 10, 11, 12] },
    weather: { lat: 24.5557, lng: 93.8052, tempSummer: '18–30°C', tempWinter: '8–22°C' },
    howToReach: {
      routes: [
        { from: 'Imphal', distance: 45, byCar: '1 hr via Tiddim Road', byTrain: 'N/A', byAir: 'Flight to Imphal + Taxi', via: 'Imphal → Moirang → Sendra Loktak' }
      ],
      nearestAirport: { name: 'Imphal Bir Tikendrajit Airport (IMF)', distance: 45 },
      nearestRailway: { name: 'Dimapur / Jiribam Railway Station', distance: 210 },
      roadNote: 'Paved state highway from Imphal city.'
    },
    topPlaces: [
      { name: 'Keibul Lamjao Floating National Park', category: 'nature', distance: '5 km', entryFee: '₹50', timings: '6 AM – 5 PM', duration: '2 hrs', rating: 4.9, description: 'World\'s only floating national park home to the Sangai deer.', image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80', alt: 'Keibul Lamjao' }, photos: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Sendra Cottages Loktak', type: 'resort', tier: 'good', priceMin: 3500, priceMax: 6500, rating: 4.7, reviews: 290, amenities: ['Lake View', 'Restaurant'], tags: ['Island Resort'], image: { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80', alt: 'Sendra Cottages' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', alt: 'Loktak Lake' }],
    faq: [{ q: 'What are phumdis in Loktak Lake?', a: 'Phumdis are floating heterogeneous masses of vegetation, soil, and organic matter forming natural circular islands over Loktak lake.' }],
    seo: {
      title: 'Loktak Lake Manipur Guide 2026 — Floating Park, Sangai Deer | IndiaExplore',
      description: 'Explore Loktak Lake in Manipur: Keibul Lamjao world\'s only floating national park, Sangai dancing deer and Sendra island cottages.',
      canonical: 'destination.html?slug=loktak-lake',
      ogImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      keywords: ['Loktak Lake Manipur', 'Keibul Lamjao floating park', 'Sangai deer Manipur', 'Sendra Loktak']
    }
  },
  {
    slug: 'dhanaulti',
    title: 'Dhanaulti',
    state: 'Uttarakhand',
    country: 'India',
    region: 'Tehri Garhwal',
    type: 'hillstation',
    badge: 'Tranquil Deodar Forests',
    tagline: 'Quiet, serene hill town surrounded by deodar, oak and rhododendron forests',
    image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Dhanaulti Eco Park Deodar Trees' },
    heroImage: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80', alt: 'Dhanaulti Snow Peaks View' },
    overview: {
      short: 'Quiet, serene hill town surrounded by deodar, oak and rhododendron forests.',
      description: 'Dhanaulti is a quiet hill station at 7,500 feet located 24 km beyond Mussoorie in Uttarakhand. Offers quiet forest walks inside Eco Parks and panoramic Himalayan snow views.',
      features: ['Amber & Dhara Eco Parks', 'Surkanda Devi Temple Cable Car', 'Potato Farm Viewpoint', 'Adventure Camps'],
      rating: 4.7,
      reviewCount: 2980,
      minPrice: 2200,
      distanceFromDelhi: 290
    },
    bestTime: { label: 'Year Round', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    weather: { lat: 30.4500, lng: 78.2300, tempSummer: '14–25°C', tempWinter: '-2–14°C' },
    howToReach: {
      routes: [
        { from: 'Delhi', distance: 290, byCar: '6.5 hrs via Dehradun & Mussoorie', byTrain: 'Train to Dehradun (5 hrs)', byAir: 'Flight to Dehradun + Taxi', via: 'Delhi → Dehradun → Mussoorie → Dhanaulti' }
      ],
      nearestAirport: { name: 'Jolly Grant Airport Dehradun (DED)', distance: 82 },
      nearestRailway: { name: 'Dehradun Railway Station', distance: 65 },
      roadNote: 'Pleasant mountain drive past Mussoorie.'
    },
    topPlaces: [
      { name: 'Eco Park Dhanaulti', category: 'nature', distance: '0 km', entryFee: '₹50', timings: '8 AM – 6 PM', duration: '2 hrs', rating: 4.8, description: 'Protected deodar forest park with walking trails and adventure rides.', image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', alt: 'Eco Park' }, photos: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'Glamwood Resort Dhanaulti', type: 'resort', tier: 'good', priceMin: 3500, priceMax: 7000, rating: 4.6, reviews: 310, amenities: ['Deodar View', 'Restaurant'], tags: ['Hillside Resort'], image: { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', alt: 'Glamwood Resort' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', alt: 'Dhanaulti' }],
    faq: [{ q: 'How far is Dhanaulti from Mussoorie?', a: 'Dhanaulti is located just 24 km (about 1 hour drive) beyond Mussoorie.' }],
    seo: {
      title: 'Dhanaulti Travel Guide 2026 — Eco Parks, Surkanda Devi | IndiaExplore',
      description: 'Discover Dhanaulti in Uttarakhand: Deodar eco-parks, Surkanda Devi cable car temple, adventure camps and Delhi road route.',
      canonical: 'destination.html?slug=dhanaulti',
      ogImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      keywords: ['Dhanaulti Uttarakhand', 'Dhanaulti eco park', 'Surkanda Devi cable car', 'Dhanaulti hotels']
    }
  },
  {
    slug: 'mandu',
    title: 'Mandu (Mandav)',
    state: 'Madhya Pradesh',
    country: 'India',
    region: 'Dhar District',
    type: 'heritage',
    badge: 'Romantic Afghan Fortress',
    tagline: 'Ancient ruined Afghan fortress city famed for Jahaz Mahal (Ship Palace)',
    image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80', alt: 'Jahaz Mahal Mandu' },
    heroImage: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=1600&q=80', alt: 'Rani Roopmati Pavilion Sunset Mandu' },
    overview: {
      short: 'Ancient ruined Afghan fortress city famed for Jahaz Mahal (Ship Palace) and Rani Roopmati Pavilion.',
      description: 'Mandu is a ruined fortress city in Madhya Pradesh set on a plateau perched over the Narmada valley. Famed for its Afghan architecture, Jahaz Mahal appears to float between two lakes.',
      features: ['Jahaz Mahal (Ship Palace)', 'Rani Roopmati Pavilion', 'Hindola Mahal (Swinging Palace)', 'Baz Bahadur Palace'],
      rating: 4.8,
      reviewCount: 2240,
      minPrice: 2000,
      distanceFromDelhi: 880
    },
    bestTime: { label: 'Jul – Mar', months: [1, 2, 3, 7, 8, 9, 10, 11, 12] },
    weather: { lat: 22.3664, lng: 75.3941, tempSummer: '24–38°C', tempWinter: '12–26°C' },
    howToReach: {
      routes: [
        { from: 'Indore', distance: 98, byCar: '2 hrs via Dhar', byTrain: 'Train to Indore + Taxi', byAir: 'Flight to Indore + Taxi', via: 'Indore → Dhar → Mandu' }
      ],
      nearestAirport: { name: 'Indore Devi Ahilya Bai Holkar Airport (IDR)', distance: 98 },
      nearestRailway: { name: 'Indore Junction Railway Station', distance: 98 },
      roadNote: 'Smooth state highway drive from Indore.'
    },
    topPlaces: [
      { name: 'Jahaz Mahal (Ship Palace)', category: 'heritage', distance: '0 km', entryFee: '₹25', timings: '6 AM – 6 PM', duration: '2 hrs', rating: 4.9, description: '15th-century palace built between two artificial lakes.', image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80', alt: 'Jahaz Mahal' }, photos: ['https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80'] }
    ],
    hotels: [
      { name: 'MPT Malwa Resort Mandu', type: 'resort', tier: 'good', priceMin: 2800, priceMax: 5500, rating: 4.6, reviews: 310, amenities: ['Lake View', 'Restaurant'], tags: ['MP Tourism'], image: { src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=400&q=80', alt: 'MPT Malwa Resort' } }
    ],
    gallery: [{ src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80', alt: 'Mandu' }],
    faq: [{ q: 'Why is Mandu called the City of Joy?', a: 'Under Shadiabad (City of Joy) named by Sultan Hoshang Shah, Mandu became legendary for Afghan architectural monuments and royal love stories.' }],
    seo: {
      title: 'Mandu Travel Guide 2026 — Jahaz Mahal, Rani Roopmati Pavilion | IndiaExplore',
      description: 'Explore Mandu (Mandav) in Madhya Pradesh: Jahaz Mahal ship palace, Rani Roopmati pavilion, Hindola mahal and Indore road route.',
      canonical: 'destination.html?slug=mandu',
      ogImage: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80',
      keywords: ['Mandu Madhya Pradesh', 'Jahaz Mahal Mandu', 'Rani Roopmati pavilion', 'Mandu Indore road']
    }
  }
];

const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

targets.forEach(t => {
  const file = path.join(DEST_DIR, `${t.slug}.json`);
  fs.writeFileSync(file, JSON.stringify(t, null, 2), 'utf8');

  // Update index
  const entry = idx.destinations.find(d => d.slug === t.slug);
  if (entry) {
    entry.title = t.title;
    entry.state = t.state;
    entry.region = t.region;
    entry.type = t.type;
    entry.badge = t.badge;
    entry.short = t.overview.short;
    entry.image = t.image;
    entry.heroImage = t.heroImage;
    entry.features = t.overview.features;
  }
  console.log(`Updated schema for ${t.title} (${t.slug})`);
});

fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2), 'utf8');
console.log('Fixed index.json references!');
