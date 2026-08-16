const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, 'data', 'destinations');
const INDEX_PATH = path.join(DEST_DIR, 'index.json');
const SEARCH_INDEX_PATH = path.join(ROOT, 'data', 'search-index.json');

const newDestinations = [
  {
    slug: 'bangaram-island',
    title: 'Bangaram Island',
    state: 'Lakshadweep',
    region: 'Lakshadweep Archipelago',
    type: 'beach',
    badge: 'Pristine Island',
    short: 'Teal turquoise lagoons, coral reefs and untouched white sand beaches in the Arabian Sea.',
    bestTime: { label: 'Oct – May', months: [1, 2, 3, 4, 5, 10, 11, 12] },
    rating: 4.9,
    reviewCount: 1420,
    minPrice: 6500,
    distanceFromDelhi: 2150,
    lat: 10.9388,
    lng: 72.2858,
    image: {
      src: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=800&q=80',
      alt: 'Bangaram Island Lagoon, Lakshadweep'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=1600&q=80',
      alt: 'Bangaram Island Beach and Coral Reef'
    },
    features: ['Lagoon Snorkeling', 'Scuba Diving', 'Bioluminescent Plankton', 'Coral Reefs'],
    tiers: ['good', 'better', 'best', 'luxury'],
    detail: {
      overview: {
        short: 'Bangaram is a teardrop-shaped uninhabited island surrounded by a shallow turquoise lagoon and coral reefs.',
        long: 'Located in the Lakshadweep archipelago, Bangaram offers calm crystal-clear waters, vibrant marine life, wreck diving, and bioluminescent beach strolls at night. Accessible by speedboat from Agatti airfield.'
      },
      placesToVisit: [
        { name: 'Bangaram Lagoon & Reef', type: 'Attraction', rating: 4.9, desc: 'Calm glass-like lagoon ideal for kayaking and coral snorkeling.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Shipwreck Dive Site', type: 'Diving Spot', rating: 4.8, desc: 'Sunken cargo vessel teeming with sea turtles, rays and tropical fish.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Tinnekara Island Sandbar', type: 'Island', rating: 4.9, desc: 'Neighboring uninhabited island reached by kayak or boat.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Bangaram Island Resort', type: 'Resort', priceMin: 8500, priceMax: 16000, rating: 4.8, desc: 'Eco-friendly beach cottages on the water edge.' },
        { name: 'Lakshadweep Beach Huts', type: 'Cottages', priceMin: 6500, priceMax: 9500, rating: 4.6, desc: 'Traditional coconut-wood cottages with lagoon views.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Agatti Airport (AGX)', distKm: 12 },
        nearestRailway: { name: 'Kochi Central Railway Station', distKm: 450 },
        cityRoutes: [
          { from: 'Kochi (Cochin)', distKm: 450, mode: 'Flight to Agatti + Speedboat (1.5 hrs)', duration: '2 hrs total' },
          { from: 'Bengaluru', distKm: 800, mode: 'Flight via Kochi', duration: '4 hrs' },
          { from: 'Mumbai', distKm: 1200, mode: 'Flight via Kochi', duration: '5 hrs' }
        ]
      },
      weather: {
        tempMin: 24, tempMax: 32, bestMonths: 'Oct to May', lat: 10.9388, lng: 72.2858
      }
    }
  },
  {
    slug: 'agatti-island',
    title: 'Agatti Island',
    state: 'Lakshadweep',
    region: 'Lakshadweep Archipelago',
    type: 'beach',
    badge: 'Island Gateway',
    short: 'The gateway airfield island of Lakshadweep with dramatic sea runway and blue lagoons.',
    bestTime: { label: 'Oct – May', months: [1, 2, 3, 4, 5, 10, 11, 12] },
    rating: 4.8,
    reviewCount: 1850,
    minPrice: 5500,
    distanceFromDelhi: 2130,
    lat: 10.8533,
    lng: 72.1946,
    image: {
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      alt: 'Agatti Island Beach, Lakshadweep'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
      alt: 'Agatti Aerial View and Runway Lagoon'
    },
    features: ['Lagoon Kayaking', 'Island Hopping', 'Airport Runway View', 'Deep Sea Fishing'],
    tiers: ['budget', 'good', 'better', 'best'],
    detail: {
      overview: {
        short: 'Agatti is a 7km long narrow island featuring one of the world\'s most scenic airstrips.',
        long: 'Serving as the entry point to Lakshadweep, Agatti features coral reefs, calm swimming waters, glass-bottom boat tours, and water sports hubs.'
      },
      placesToVisit: [
        { name: 'Agatti Lagoon', type: 'Lagoon', rating: 4.8, desc: 'Turquoise waters ideal for windsurfing and snorkeling.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
        { name: 'South Point Coral Garden', type: 'Snorkeling Spot', rating: 4.7, desc: 'Vibrant coral formations and colorful reef fish.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Agatti Island Beach Resort', type: 'Resort', priceMin: 7000, priceMax: 12000, rating: 4.7, desc: ' beachfront resort with diving center.' },
        { name: 'Sea Shells Homestay', type: 'Homestay', priceMin: 5500, priceMax: 8000, rating: 4.5, desc: 'Cozy local homestay with authentic island meals.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Agatti Airport (AGX)', distKm: 2 },
        nearestRailway: { name: 'Kochi Central Railway Station', distKm: 460 },
        cityRoutes: [
          { from: 'Kochi', distKm: 460, mode: 'Direct Flight', duration: '1 hr 15 mins' },
          { from: 'Bengaluru', distKm: 810, mode: 'Connecting Flight via Kochi', duration: '3.5 hrs' }
        ]
      },
      weather: { tempMin: 25, tempMax: 33, bestMonths: 'Oct to May', lat: 10.8533, lng: 72.1946 }
    }
  },
  {
    slug: 'havelock-island',
    title: 'Havelock Island (Swaraj Dweep)',
    state: 'Andaman & Nicobar',
    region: 'Ritchie\'s Archipelago',
    type: 'beach',
    badge: 'Top Asian Beach',
    short: 'Home to Asia\'s world-famous Radhanagar Beach, turquoise diving spots and mahua forests.',
    bestTime: { label: 'Oct – Apr', months: [1, 2, 3, 4, 10, 11, 12] },
    rating: 4.9,
    reviewCount: 6890,
    minPrice: 3500,
    distanceFromDelhi: 2480,
    lat: 11.9761,
    lng: 92.9876,
    image: {
      src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
      alt: 'Radhanagar Beach Havelock'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1600&q=80',
      alt: 'Havelock Island Turquoise Coast'
    },
    features: ['Radhanagar Sunset', 'Elephant Beach Snorkeling', 'Scuba Diving', 'Mangrove Kayaking'],
    tiers: ['budget', 'good', 'better', 'best', 'luxury'],
    detail: {
      overview: {
        short: 'Havelock Island is the jewel of the Andaman archipelago, famous for soft white sand and lush forest borders.',
        long: 'Consistently ranked among Asia\'s finest beaches, Radhanagar Beach offers dramatic sunsets, while Elephant Beach provides pristine coral gardens for sea-walking and diving.'
      },
      placesToVisit: [
        { name: 'Radhanagar Beach (Beach No. 7)', type: 'Beach', rating: 4.9, desc: 'World-renowned pristine white sand beach backed by ancient trees.', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Elephant Beach', type: 'Water Sports', rating: 4.8, desc: 'Submerged coral reef ideal for sea walking, snorkeling and boat tours.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Kalapathar Beach', type: 'Scenic View', rating: 4.7, desc: 'Black rocks contrasting against turquoise waters and tranquil woods.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Barefoot at Havelock', type: 'Luxury Resort', priceMin: 12000, priceMax: 24000, rating: 4.9, desc: 'Thatch cottages in rainforest near Radhanagar.' },
        { name: 'Symphony Palms Beach Resort', type: 'Resort', priceMin: 4500, priceMax: 8500, rating: 4.6, desc: 'Private beach cottages on Govind Nagar beach.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Veer Savarkar Airport, Port Blair (IXZ)', distKm: 57 },
        nearestRailway: { name: 'Chennai Central (via ferry from Chennai port)', distKm: 1350 },
        cityRoutes: [
          { from: 'Port Blair', distKm: 57, mode: 'Catamaran Ferry (Makruzz / Nautika)', duration: '1.5 hrs' },
          { from: 'Chennai / Kolkata', distKm: 1350, mode: 'Flight to Port Blair + Ferry', duration: '4 hrs total' }
        ]
      },
      weather: { tempMin: 23, tempMax: 31, bestMonths: 'Oct to Apr', lat: 11.9761, lng: 92.9876 }
    }
  },
  {
    slug: 'dawki',
    title: 'Dawki',
    state: 'Meghalaya',
    region: 'West Jaintia Hills',
    type: 'nature',
    badge: 'Crystal River',
    short: 'Boating on the transparent Umngot River where boats float as if suspended in air.',
    bestTime: { label: 'Nov – Apr', months: [1, 2, 3, 4, 11, 12] },
    rating: 4.8,
    reviewCount: 3120,
    minPrice: 2000,
    distanceFromDelhi: 1980,
    lat: 25.1878,
    lng: 92.0163,
    image: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      alt: 'Transparent Umngot River Dawki'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
      alt: 'Dawki Suspension Bridge & Clear Waters'
    },
    features: ['Transparent River Boating', 'India-Bangladesh Border', 'Dawki Suspension Bridge', 'Shnongpdeng Camping'],
    tiers: ['cheapest', 'budget', 'good'],
    detail: {
      overview: {
        short: 'Dawki is a border town in Meghalaya world-famous for the glass-like transparency of the Umngot River.',
        long: 'Nestled between the Jaintia and Khasi hills, Dawki features clear emerald waters where pebbles on the riverbed are visible meters below. Shnongpdeng village nearby offers riverside camping, kayaking, and cliff jumping.'
      },
      placesToVisit: [
        { name: 'Umngot River', type: 'River', rating: 4.9, desc: 'Crystal clear river ideal for wooden boat rides and underwater photos.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Shnongpdeng Adventure Hub', type: 'Camping', rating: 4.8, desc: 'Riverside village offering tents, ziplining and scuba diving.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
        { name: 'Dawki Tamabil Border Point', type: 'Landmark', rating: 4.5, desc: 'Friendly border crossing point between India and Bangladesh.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Pioneer Adventure Camp Shnongpdeng', type: 'Camp', priceMin: 2000, priceMax: 4000, rating: 4.7, desc: 'Riverside tent stay with campfire and kayaking.' },
        { name: 'Betelnut Resort Dawki', type: 'Homestay', priceMin: 2500, priceMax: 4500, rating: 4.5, desc: 'Cozy rooms with valley views.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Shillong Airport (SHL)', distKm: 95 },
        nearestRailway: { name: 'Guwahati Railway Station (GHY)', distKm: 170 },
        cityRoutes: [
          { from: 'Shillong', distKm: 82, mode: 'Taxi / Cab via Cherrapunji road', duration: '2.5 hrs' },
          { from: 'Guwahati', distKm: 170, mode: 'Taxi via Shillong', duration: '4.5 hrs' }
        ]
      },
      weather: { tempMin: 12, tempMax: 26, bestMonths: 'Nov to Apr', lat: 25.1878, lng: 92.0163 }
    }
  },
  {
    slug: 'gurudongmar-lake',
    title: 'Gurudongmar Lake',
    state: 'Sikkim',
    region: 'North Sikkim',
    type: 'adventure',
    badge: 'Sacred High Altitude',
    short: 'One of the highest lakes in the world at 5,430m, sacred to Buddhists, Sikhs and Hindus.',
    bestTime: { label: 'Apr – Jun, Oct – Nov', months: [4, 5, 6, 10, 11] },
    rating: 4.9,
    reviewCount: 2150,
    minPrice: 3500,
    distanceFromDelhi: 1650,
    lat: 27.9708,
    lng: 88.7061,
    image: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      alt: 'Gurudongmar Sacred Lake Sikkim'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
      alt: 'Gurudongmar Turquoise Glacial Lake and Snow Peaks'
    },
    features: ['High Altitude Glacial Lake', 'Snow Peaks Panorama', 'Lachen Base Camp', 'Chopta Valley'],
    tiers: ['budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Gurudongmar Lake sits at an altitude of 17,800 feet (5,430 meters) near the Indo-China border in North Sikkim.',
        long: 'Surrounded by snow-clad peaks, a part of the lake remains unfrozen even during harsh winter. Blessed by Guru Padmasambhava and Guru Nanak, it offers breathtaking high-altitude Himalayan wilderness.'
      },
      placesToVisit: [
        { name: 'Gurudongmar Lake Shore', type: 'Glacial Lake', rating: 4.9, desc: 'Vast turquoise lake bounded by snow mountains.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { name: 'Lachen Village', type: 'Himalayan Village', rating: 4.7, desc: 'Picturesque overnight stopover village with traditional wooden houses.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
        { name: 'Chopta Valley', type: 'Valley', rating: 4.8, desc: 'Alpine valley covered in alpine flowers during summer.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Lachen View Hotel', type: 'Hotel', priceMin: 3500, priceMax: 6500, rating: 4.6, desc: 'Heated mountain rooms in Lachen.' },
        { name: 'Wooden Alpine Homestay Lachen', type: 'Homestay', priceMin: 2800, priceMax: 4800, rating: 4.5, desc: 'Warm local hospitality with traditional Sikkimese food.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Pakyong Airport (PYG) / Bagdogra (IXB)', distKm: 180 },
        nearestRailway: { name: 'New Jalpaiguri (NJP)', distKm: 210 },
        cityRoutes: [
          { from: 'Gangtok', distKm: 170, mode: '4WD SUV via Lachen (Overnight stay required)', duration: '6 hrs' },
          { from: 'Siliguri / NJP', distKm: 210, mode: 'Taxi via Gangtok', duration: '8 hrs' }
        ]
      },
      weather: { tempMin: -15, tempMax: 10, bestMonths: 'Apr to Jun, Oct to Nov', lat: 27.9708, lng: 88.7061 }
    }
  },
  {
    slug: 'hanle',
    title: 'Hanle',
    state: 'Ladakh (UT)',
    region: 'Changthang Plateau',
    type: 'adventure',
    badge: 'Dark Sky Reserve',
    short: 'India\'s 1st Dark Sky Reserve with crystal clear Milky Way views and Indian Astronomical Observatory.',
    bestTime: { label: 'May – Sep', months: [5, 6, 7, 8, 9] },
    rating: 4.9,
    reviewCount: 1680,
    minPrice: 2500,
    distanceFromDelhi: 1080,
    lat: 32.7758,
    lng: 78.9667,
    image: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      alt: 'Hanle Dark Sky Reserve Ladakh'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
      alt: 'Hanle Observatory and Star-lit Night Sky'
    },
    features: ['Stargazing & Astrophotography', 'Indian Astronomical Observatory', 'Hanle Gompa', 'Tibetan Wild Ass (Kiang)'],
    tiers: ['budget', 'good'],
    detail: {
      overview: {
        short: 'Hanle is a remote high-altitude village at 4,500m on the Changthang plateau of Ladakh.',
        long: 'Designated as India\'s first Dark Sky Reserve, Hanle offers zero light pollution, crisp dry air, and unobstructed views of the Milky Way galaxy alongside the world\'s highest optical telescope.'
      },
      placesToVisit: [
        { name: 'Indian Astronomical Observatory (IAO)', type: 'Observatory', rating: 4.9, desc: 'World\'s 10th highest optical telescope perched atop Digpa-Ratsa Ri.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
        { name: 'Hanle Monastery (Gompa)', type: 'Monastery', rating: 4.8, desc: '17th-century Drukpa Lineage monastery offering panoramic valley views.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { name: 'Umling La Pass (Nearby)', type: 'Mountain Pass', rating: 4.9, desc: 'World\'s highest motorable pass at 19,024 feet.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Hanle Astro Homestay', type: 'Homestay', priceMin: 2500, priceMax: 4500, rating: 4.8, desc: 'Warm local family homestay equipped with stargazing telescopes.' },
        { name: 'Starlight Ladakh Haven', type: 'Homestay', priceMin: 3000, priceMax: 5000, rating: 4.7, desc: 'Cozy solar-heated rooms with traditional Ladakhi butter tea.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Kushok Bakula Rimpoche Airport, Leh (IXL)', distKm: 255 },
        nearestRailway: { name: 'Jammu Tawi', distKm: 700 },
        cityRoutes: [
          { from: 'Leh', distKm: 255, mode: '4WD SUV via Chumathang or Pangong Lake route', duration: '6.5 hrs' },
          { from: 'Pangong Tso', distKm: 160, mode: 'SUV via Chushul & Tsaga La pass', duration: '4.5 hrs' }
        ]
      },
      weather: { tempMin: -20, tempMax: 18, bestMonths: 'May to Sep', lat: 32.7758, lng: 78.9667 }
    }
  },
  {
    slug: 'chopta',
    title: 'Chopta',
    state: 'Uttarakhand',
    region: 'Garhwal Himalayas',
    type: 'hill_station',
    badge: 'Mini Switzerland',
    short: 'Lush alpine bugyals (meadows), Tungnath Shiva temple trek and snow peaks panorama.',
    bestTime: { label: 'Mar – Jun, Oct – Dec', months: [3, 4, 5, 6, 10, 11, 12] },
    rating: 4.8,
    reviewCount: 4230,
    minPrice: 1500,
    distanceFromDelhi: 410,
    lat: 30.4859,
    lng: 79.1844,
    image: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      alt: 'Chopta Meadows Tungnath Trek'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
      alt: 'Chopta Snow Peaks and Himalayan Bugyal'
    },
    features: ['Tungnath Temple Trek', 'Chandrashila Summit View', 'Deoriatal Lake', 'Snow Camping'],
    tiers: ['cheapest', 'budget', 'good'],
    detail: {
      overview: {
        short: 'Chopta is a pristine hamlet in Uttarakhand known as the Mini Switzerland of Garhwal.',
        long: 'Surrounded by dense pine and rhododendron forests, Chopta serves as the base for the trek to Tungnath — the highest Shiva temple in the world — and the majestic 360-degree Chandrashila summit.'
      },
      placesToVisit: [
        { name: 'Tungnath Temple', type: 'Temple & Trek', rating: 4.9, desc: 'World\'s highest Shiva temple located at 3,680m (3.5 km trek from Chopta).', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { name: 'Chandrashila Peak', type: 'Summit View', rating: 4.9, desc: 'Summit above Tungnath offering views of Nanda Devi, Trishul and Kedar peaks.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { name: 'Deoriatal Lake', type: 'High Lake', rating: 4.8, desc: 'Emerald lake reflecting the Chaukhamba peaks, reached via Sari village.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Chopta Meadows Eco Resort', type: 'Camps', priceMin: 2200, priceMax: 4500, rating: 4.7, desc: 'Alpine swiss tents facing Chaukhamba peaks.' },
        { name: 'Monal Himalayan Homestay Sari', type: 'Homestay', priceMin: 1500, priceMax: 3000, rating: 4.6, desc: 'Cozy village stay near Deoriatal trek trailhead.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Jolly Grant Airport, Dehradun (DED)', distKm: 215 },
        nearestRailway: { name: 'Rishikesh / Haridwar Railway Station', distKm: 200 },
        cityRoutes: [
          { from: 'Rishikesh', distKm: 200, mode: 'Taxi / Bus via Devprayag & Rudraprayag', duration: '6.5 hrs' },
          { from: 'Delhi', distKm: 410, mode: 'Drive / Bus to Rishikesh + Taxi', duration: '9 hrs' }
        ]
      },
      weather: { tempMin: -5, tempMax: 20, bestMonths: 'Mar to Jun, Oct to Dec', lat: 30.4859, lng: 79.1844 }
    }
  },
  {
    slug: 'gandikota',
    title: 'Gandikota',
    state: 'Andhra Pradesh',
    region: 'Kadapa District',
    type: 'nature',
    badge: 'Grand Canyon of India',
    short: 'Spectacular red granite gorge over the Pennar River with 13th-century fort ruins.',
    bestTime: { label: 'Sep – Mar', months: [1, 2, 3, 9, 10, 11, 12] },
    rating: 4.8,
    reviewCount: 1940,
    minPrice: 2200,
    distanceFromDelhi: 1850,
    lat: 14.8153,
    lng: 78.2863,
    image: {
      src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80',
      alt: 'Gandikota Fort and Canyon Gorge'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=1600&q=80',
      alt: 'Gandikota Grand Canyon Pennar River View'
    },
    features: ['Pennar River Gorge', 'Gandikota Fort', 'Raghunathaswamy Temple', 'Cliffside Sunset Point'],
    tiers: ['budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Gandikota is a small village in Kadapa known as the Grand Canyon of India due to its breathtaking gorge.',
        long: 'Carved out by the Pennar river cutting through the Erramala hills, the massive red granite gorge and the 13th-century Gandikota fort offer unreal views and cliff camping experiences.'
      },
      placesToVisit: [
        { name: 'Gandikota Gorge & Sunset Point', type: 'Canyon View', rating: 4.9, desc: 'Breathtaking canyon cliff view over Pennar River.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' },
        { name: 'Gandikota Fort Complex', type: 'Historical Fort', rating: 4.7, desc: 'Ancient stone fort with granary, palace ruins and watchtowers.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' },
        { name: 'Madhavaraya Temple', type: 'Temple', rating: 4.8, desc: 'Vijayanagara-style temple with carved gopuram pillars.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'APTDC Haritha Resort Gandikota', type: 'Resort', priceMin: 2200, priceMax: 4500, rating: 4.5, desc: 'Government resort right outside the fort walls.' },
        { name: 'Gandikota Cliff Adventure Tents', type: 'Camping', priceMin: 1800, priceMax: 3500, rating: 4.7, desc: 'Riverside cliff camping with bonfire and barbecue.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Kadapa Airport (CDP)', distKm: 77 },
        nearestRailway: { name: 'Jammalamadugu / Muddanuru Railway Station', distKm: 18 },
        cityRoutes: [
          { from: 'Bengaluru', distKm: 280, mode: 'Drive via NH44', duration: '5.5 hrs' },
          { from: 'Hyderabad', distKm: 380, mode: 'Drive / Train to Muddanuru', duration: '7 hrs' }
        ]
      },
      weather: { tempMin: 18, tempMax: 34, bestMonths: 'Sep to Mar', lat: 14.8153, lng: 78.2863 }
    }
  },
  {
    slug: 'dhanushkodi',
    title: 'Dhanushkodi',
    state: 'Tamil Nadu',
    region: 'Pamban Island',
    type: 'beach',
    badge: 'Ghost Town Edge',
    short: 'Mysterious ghost town at India\'s tip where the Indian Ocean meets the Bay of Bengal.',
    bestTime: { label: 'Oct – Apr', months: [1, 2, 3, 4, 10, 11, 12] },
    rating: 4.9,
    reviewCount: 3410,
    minPrice: 2500,
    distanceFromDelhi: 2750,
    lat: 9.1761,
    lng: 79.4143,
    image: {
      src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
      alt: 'Dhanushkodi Beach Edge'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1600&q=80',
      alt: 'Dhanushkodi Ocean Meeting Point'
    },
    features: ['Arichal Munai Confluence', 'Ruined Church & Railway Station', 'Ram Setu Point', 'End of India Road Drive'],
    tiers: ['budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Dhanushkodi is an abandoned ghost town located at the southeastern tip of Pamban Island in Tamil Nadu.',
        long: 'Destroyed in the 1964 cyclone, Dhanushkodi features evocative ruins of a church and railway station surrounded by vast blue seas where the calm Bay of Bengal meets the roaring Indian Ocean.'
      },
      placesToVisit: [
        { name: 'Arichal Munai (Tip of India)', type: 'Confluence View', rating: 4.9, desc: 'Point where the two oceans meet with views of Sri Lanka sea borders.', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Dhanushkodi Ruins & Church', type: 'Historical Ruins', rating: 4.8, desc: 'Haunting coral stone ruins of church and station buried in sand.', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Pamban Sea Bridge', type: 'Engineering Marvel', rating: 4.9, desc: 'Famous railway sea bridge connecting Rameswaram island.', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Daiwik Hotels Rameswaram', type: 'Hotel', priceMin: 3500, priceMax: 7000, rating: 4.7, desc: 'Comfortable hotel near Dhanushkodi highway entrance.' },
        { name: 'Hotel Jiwan Residency', type: 'Hotel', priceMin: 2500, priceMax: 5000, rating: 4.5, desc: 'Beachfront rooms on Rameswaram island.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Madurai Airport (IXM)', distKm: 175 },
        nearestRailway: { name: 'Rameswaram Railway Station (RMM)', distKm: 18 },
        cityRoutes: [
          { from: 'Madurai', distKm: 175, mode: 'Drive / Bus via Pamban Bridge', duration: '3.5 hrs' },
          { from: 'Chennai', distKm: 580, mode: 'Overnight Train to Rameswaram', duration: '10 hrs' }
        ]
      },
      weather: { tempMin: 22, tempMax: 32, bestMonths: 'Oct to Apr', lat: 9.1761, lng: 79.4143 }
    }
  },
  {
    slug: 'mawlynnong',
    title: 'Mawlynnong',
    state: 'Meghalaya',
    region: 'East Khasi Hills',
    type: 'nature',
    badge: 'Asia\'s Cleanest Village',
    short: 'Awarded Asia\'s cleanest village featuring living root bridges, flower gardens and bamboo skywalks.',
    bestTime: { label: 'Oct – May', months: [1, 2, 3, 4, 5, 10, 11, 12] },
    rating: 4.8,
    reviewCount: 2890,
    minPrice: 1800,
    distanceFromDelhi: 1950,
    lat: 25.2017,
    lng: 91.9163,
    image: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      alt: 'Living Root Bridge near Mawlynnong'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
      alt: 'Mawlynnong Village Flower Gardens'
    },
    features: ['Nohwet Living Root Bridge', 'Sky View Bamboo Tower', 'Balancing Rock', 'Cleanest Village Walk'],
    tiers: ['cheapest', 'budget', 'good'],
    detail: {
      overview: {
        short: 'Mawlynnong is a picturesque village in Meghalaya famous for its eco-friendly practices and spotlessly clean streets.',
        long: 'Referred to as God\'s Own Garden, Mawlynnong is maintained by local Khasi villagers who collect garbage in bamboo dustbins. Nearby Nohwet features an ancient single-decker living root bridge woven across a pristine river stream.'
      },
      placesToVisit: [
        { name: 'Nohwet Living Root Bridge', type: 'Bio-Engineering Marvel', rating: 4.9, desc: '180-year-old living root bridge woven over mountain stream.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Sky View Point Bamboo Tower', type: 'Viewpoint', rating: 4.7, desc: '85ft high bamboo treehouse offering views of Bangladesh plains.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
        { name: 'Balancing Rock of Mawlynnong', type: 'Natural Wonder', rating: 4.6, desc: 'Massive boulder balancing precariously on a tiny rock base.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Mawlynnong Village Homestay', type: 'Homestay', priceMin: 1800, priceMax: 3200, rating: 4.7, desc: 'Traditional bamboo stay hosted by Khasi families.' },
        { name: 'Areca Cottages Mawlynnong', type: 'Cottage', priceMin: 2500, priceMax: 4500, rating: 4.6, desc: 'Garden cottages amidst betel nut palms.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Shillong Airport (SHL)', distKm: 90 },
        nearestRailway: { name: 'Guwahati Railway Station (GHY)', distKm: 170 },
        cityRoutes: [
          { from: 'Shillong', distKm: 78, mode: 'Taxi / Cab via Pynursla', duration: '2.5 hrs' },
          { from: 'Guwahati', distKm: 170, mode: 'Taxi via Shillong', duration: '4.5 hrs' }
        ]
      },
      weather: { tempMin: 12, tempMax: 26, bestMonths: 'Oct to May', lat: 25.2017, lng: 91.9163 }
    }
  },
  {
    slug: 'lonar-crater',
    title: 'Lonar Crater Lake',
    state: 'Maharashtra',
    region: 'Buldhana District',
    type: 'nature',
    badge: '50,000-Year Meteorite Lake',
    short: 'Ancient saline and alkaline crater lake formed by a hyper-velocity meteor impact.',
    bestTime: { label: 'Nov – Mar', months: [1, 2, 3, 11, 12] },
    rating: 4.7,
    reviewCount: 1650,
    minPrice: 1800,
    distanceFromDelhi: 1200,
    lat: 19.9757,
    lng: 76.5080,
    image: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      alt: 'Lonar Meteorite Crater Lake'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
      alt: 'Lonar Crater Rim Panorama'
    },
    features: ['Meteor Impact Crater', 'Daitya Sudhan Temple', 'Gomukh Temple Springs', 'Alkaline Lake Trek'],
    tiers: ['cheapest', 'budget', 'good'],
    detail: {
      overview: {
        short: 'Lonar Lake is a Geo-heritage monument and unique impact crater lake created by a meteor impact during the Pleistocene Epoch.',
        long: 'Surrounded by dense teak forests and 1,000-year-old temples, Lonar is the world\'s only high-velocity impact crater formed in basaltic rock. Its dual saline and alkaline water hosts rare micro-flora and migratory birds.'
      },
      placesToVisit: [
        { name: 'Lonar Crater Lake Rim', type: 'Crater Trail', rating: 4.8, desc: '1.2 km wide impact crater rim with panoramic views.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
        { name: 'Daitya Sudhan Temple', type: 'Ancient Temple', rating: 4.8, desc: 'Intricately carved 10th-century Chalukyan temple in Lonar town.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' },
        { name: 'Gomukh Temple', type: 'Spring Temple', rating: 4.6, desc: 'Perennial fresh water spring flowing into the crater basin.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'MTDC Resort Lonar', type: 'Resort', priceMin: 1800, priceMax: 3500, rating: 4.4, desc: 'Government resort located right on the crater rim.' },
        { name: 'Melghat / Lonar Heritage Lodge', type: 'Lodge', priceMin: 2200, priceMax: 4000, rating: 4.3, desc: 'Clean stay with crater trekking guides.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Aurangabad Chhatrapati Sambhajinagar Airport (IXU)', distKm: 140 },
        nearestRailway: { name: 'Malkapur / Jalna Railway Station', distKm: 90 },
        cityRoutes: [
          { from: 'Aurangabad', distKm: 140, mode: 'Taxi / Bus via Jalna', duration: '3 hrs' },
          { from: 'Mumbai', distKm: 490, mode: 'Overnight Train to Jalna + Taxi', duration: '8.5 hrs' }
        ]
      },
      weather: { tempMin: 14, tempMax: 32, bestMonths: 'Nov to Mar', lat: 19.9757, lng: 76.5080 }
    }
  },
  {
    slug: 'daringbadi',
    title: 'Daringbadi',
    state: 'Odisha',
    region: 'Kandhamal District',
    type: 'hillstation',
    badge: 'Kashmir of Odisha',
    short: 'Picturesque hill station with pine forests, coffee gardens, and winter frost.',
    bestTime: { label: 'Sep – May', months: [1, 2, 3, 4, 5, 9, 10, 11, 12] },
    rating: 4.6,
    reviewCount: 1420,
    minPrice: 2000,
    distanceFromDelhi: 1450,
    lat: 19.9125,
    lng: 84.1332,
    image: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      alt: 'Daringbadi Pine Forests'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
      alt: 'Daringbadi Coffee Estates and Hills'
    },
    features: ['Pine Forest Walk', 'Hill View Point', 'Doluri River Waterfalls', 'Coffee Plantations'],
    tiers: ['budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Daringbadi is a serene hill station at 3,000 feet in Odisha surrounded by dense pine forests and coffee plantations.',
        long: 'Known for sub-zero winter mornings where dew drops freeze into thin ice, Daringbadi features gushing waterfalls, tribal heritage, organic pepper gardens, and cool mountain air.'
      },
      placesToVisit: [
        { name: 'Daringbadi Pine Jungle', type: 'Pine Forest', rating: 4.7, desc: 'Towering pine forests ideal for peaceful nature walks.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { name: 'Coffee & Black Pepper Garden', type: 'Plantation', rating: 4.7, desc: 'Lush coffee estates with guided plantation tours.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
        { name: 'Midubanda Waterfall', type: 'Waterfall', rating: 4.8, desc: 'Cascading waterfall hidden deep inside forest reserves.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Deomali Eco Cottage Daringbadi', type: 'Eco Resort', priceMin: 2500, priceMax: 5000, rating: 4.6, desc: 'Forest eco-cottages surrounded by pine trees.' },
        { name: 'OTDC Panthanivas Daringbadi', type: 'Hotel', priceMin: 2000, priceMax: 3800, rating: 4.4, desc: 'Government hotel close to nature viewpoints.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Bhubaneswar Biju Patnaik Airport (BBI)', distKm: 245 },
        nearestRailway: { name: 'Berhampur Railway Station (BAM)', distKm: 120 },
        cityRoutes: [
          { from: 'Berhampur', distKm: 120, mode: 'Taxi / Bus via Bhanjanagar', duration: '3 hrs' },
          { from: 'Bhubaneswar', distKm: 245, mode: 'Drive / Bus via Phulbani', duration: '5.5 hrs' }
        ]
      },
      weather: { tempMin: 5, tempMax: 28, bestMonths: 'Sep to May', lat: 19.9125, lng: 84.1332 }
    }
  },
  {
    slug: 'chembra-peak',
    title: 'Chembra Peak',
    state: 'Kerala',
    region: 'Wayanad',
    type: 'adventure',
    badge: 'Natural Heart Lake',
    short: 'The highest peak in Wayanad famous for a natural heart-shaped lake nestled in misty hills.',
    bestTime: { label: 'Sep – May', months: [1, 2, 3, 4, 5, 9, 10, 11, 12] },
    rating: 4.9,
    reviewCount: 3820,
    minPrice: 2800,
    distanceFromDelhi: 2100,
    lat: 11.5472,
    lng: 76.0898,
    image: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      alt: 'Heart Shaped Lake Chembra Peak'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
      alt: 'Chembra Peak Misty Trek Trail'
    },
    features: ['Hradayathadakam (Heart Lake)', 'Chembra Peak Trek', 'Tea Estate Views', 'Meenmutty Falls nearby'],
    tiers: ['budget', 'good', 'better', 'best'],
    detail: {
      overview: {
        short: 'Chembra Peak stands at 2,100 meters in Wayanad, offering one of Kerala\'s most scenic trekking routes.',
        long: 'En route to the summit lies \'Hradayathadakam\', a natural heart-shaped mountain lake that is believed to have never dried up. The trek winds through emerald tea gardens and mist-shrouded shola grasslands.'
      },
      placesToVisit: [
        { name: 'Heart Shaped Lake (Hradayathadakam)', type: 'Natural Lake', rating: 4.9, desc: 'Perennial heart-shaped lake halfway up Chembra peak.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
        { name: 'Chembra Summit Viewpoint', type: 'Peak Trek', rating: 4.8, desc: 'Highest altitude viewpoint looking over Wayanad district.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { name: 'Banantara Tea Estate', type: 'Tea Garden', rating: 4.7, desc: 'Lush tea plantations framing the base of the trek trail.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Chembra Peak Resort Meppadi', type: 'Resort', priceMin: 3800, priceMax: 7500, rating: 4.7, desc: 'Resort nested inside tea plantations near trek start point.' },
        { name: 'Wayanad Tea Nest Homestay', type: 'Homestay', priceMin: 2800, priceMax: 4800, rating: 4.6, desc: 'Cozy planter homestay with home-cooked Kerala cuisine.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Calicut International Airport (CCJ)', distKm: 92 },
        nearestRailway: { name: 'Kozhikode Railway Station (CLT)', distKm: 85 },
        cityRoutes: [
          { from: 'Kozhikode (Calicut)', distKm: 85, mode: 'Drive / Bus to Kalpetta / Meppadi', duration: '2.5 hrs' },
          { from: 'Bengaluru', distKm: 290, mode: 'Drive via Mysore & Sulthan Bathery', duration: '6 hrs' }
        ]
      },
      weather: { tempMin: 14, tempMax: 27, bestMonths: 'Sep to May', lat: 11.5472, lng: 76.0898 }
    }
  },
  {
    slug: 'gurez-valley',
    title: 'Gurez Valley',
    state: 'Jammu & Kashmir',
    region: 'BandiPora District',
    type: 'hillstation',
    badge: 'Untouched Border Eden',
    short: 'A hidden emerald valley in the High Himalayas surrounded by snow peaks and Kishanganga river.',
    bestTime: { label: 'May – Oct', months: [5, 6, 7, 8, 9, 10] },
    rating: 4.9,
    reviewCount: 1580,
    minPrice: 3000,
    distanceFromDelhi: 890,
    lat: 34.6366,
    lng: 74.8383,
    image: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      alt: 'Gurez Valley Habba Khatoon Peak'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
      alt: 'Kishanganga River in Gurez Valley'
    },
    features: ['Habba Khatoon Mountain Peak', 'Kishanganga River Rafting', 'Log Cabin Villages', 'Dawar Valley Market'],
    tiers: ['budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Gurez is a pristine Himalayan valley located at 8,000 feet in northern Kashmir along the ancient Silk Route.',
        long: 'Dominated by the pyramid-shaped Habba Khatoon peak, Gurez features crystal turquoise Kishanganga river waters, wooden log homes of the Dard-Shin tribe, and carpeted alpine meadows untouched by commercial tourism.'
      },
      placesToVisit: [
        { name: 'Habba Khatoon Peak & Spring', type: 'Pyramid Mountain', rating: 4.9, desc: 'Iconic pyramid mountain peak rising above Dawar town.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { name: 'Kishanganga River Banks', type: 'River Trail', rating: 4.9, desc: 'Pristine mountain river popular for trout fishing and camping.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Tulail Valley', type: 'High Meadow Valley', rating: 4.8, desc: 'Remote wooden log-cabin village valley deeper inside Gurez.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Kaka Palace Homestay Dawar', type: 'Homestay', priceMin: 3000, priceMax: 5500, rating: 4.8, desc: 'Pioneer homestay in Dawar with warm Kashmiri hospitality.' },
        { name: 'JKTDC Tourist Bungalow Gurez', type: 'Lodge', priceMin: 2500, priceMax: 4500, rating: 4.5, desc: 'Government wooden lodge facing Habba Khatoon peak.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Srinagar Sheikh ul-Alam Airport (SXR)', distKm: 125 },
        nearestRailway: { name: 'Jammu Tawi / Srinagar Railway Station', distKm: 130 },
        cityRoutes: [
          { from: 'Srinagar', distKm: 125, mode: 'Shared Taxi / SUV via Razdan Pass (11,600ft)', duration: '5 hrs' },
          { from: 'Bandipora', distKm: 65, mode: 'Mountain SUV Drive', duration: '3 hrs' }
        ]
      },
      weather: { tempMin: -2, tempMax: 22, bestMonths: 'May to Oct', lat: 34.6366, lng: 74.8383 }
    }
  },
  {
    slug: 'unakoti',
    title: 'Unakoti',
    state: 'Tripura',
    region: 'Unakoti District',
    type: 'heritage',
    badge: 'Mysterious Rock Carvings',
    short: 'Ancient 7th-9th century rock-cut bas-relief Shiva sculptures carved directly into rainforest hillsides.',
    bestTime: { label: 'Oct – Apr', months: [1, 2, 3, 4, 10, 11, 12] },
    rating: 4.8,
    reviewCount: 1240,
    minPrice: 1600,
    distanceFromDelhi: 2300,
    lat: 24.3183,
    lng: 92.0722,
    image: {
      src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80',
      alt: 'Unakoti Rock Cut Shiva Head'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=1600&q=80',
      alt: 'Unakoti Ancient Sculptures Hillside'
    },
    features: ['Unakotiswara Kal Bhairav Head', 'Ganesha Rock Reliefs', 'Rainforest Waterfall Trail', 'Ashokastami Mela Fair'],
    tiers: ['cheapest', 'budget', 'good'],
    detail: {
      overview: {
        short: 'Unakoti, meaning \'one less than a crore\', is an ancient pilgrimage site hidden in the green hills of Tripura.',
        long: 'Featuring colossal 30-foot rock carvings of Lord Shiva, Ganesha, and Durga carved into vertical rock walls, Unakoti combines mysterious Hindu mythology with lush sub-tropical rainforest streams.'
      },
      placesToVisit: [
        { name: 'Unakotiswara Kal Bhairav Head', type: 'Colossal Carving', rating: 4.9, desc: '30ft tall rock-cut face sculpture of Lord Shiva.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' },
        { name: 'Ganesha Rock Relief Panel', type: 'Ancient Relief', rating: 4.8, desc: 'Four-armed Ganesha figures carved onto cliff faces.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' },
        { name: 'Kailashahar Heritage Park', type: 'Park', rating: 4.5, desc: 'Serene town park with tea estate views nearby.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Unakoti Tourist Lodge Kailashahar', type: 'Lodge', priceMin: 1600, priceMax: 3000, rating: 4.3, desc: 'Government stay 8 km from Unakoti rock site.' },
        { name: 'Hotel Royal Palace Dharmanagar', type: 'Hotel', priceMin: 2200, priceMax: 4000, rating: 4.4, desc: 'Comfortable city hotel near railway connectivity.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Agartala Maharaja Bir Bikram Airport (IXA)', distKm: 160 },
        nearestRailway: { name: 'Kumarghat / Dharmanagar Railway Station', distKm: 20 },
        cityRoutes: [
          { from: 'Agartala', distKm: 160, mode: 'Train / Taxi via Kailashahar', duration: '4 hrs' },
          { from: 'Silchar', distKm: 120, mode: 'Drive via NH8', duration: '3.5 hrs' }
        ]
      },
      weather: { tempMin: 12, tempMax: 30, bestMonths: 'Oct to Apr', lat: 24.3183, lng: 92.0722 }
    }
  },
  {
    slug: 'sandakphu',
    title: 'Sandakphu',
    state: 'West Bengal',
    region: 'Darjeeling District',
    type: 'adventure',
    badge: 'Everest & Kanchenjunga View',
    short: 'The highest peak in West Bengal offering panoramic views of Everest, Kanchenjunga, and Lhotse.',
    bestTime: { label: 'Oct – May', months: [1, 2, 3, 4, 5, 10, 11, 12] },
    rating: 4.9,
    reviewCount: 2450,
    minPrice: 2200,
    distanceFromDelhi: 1480,
    lat: 27.1062,
    lng: 88.0016,
    image: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      alt: 'Sandakphu Kanchenjunga Sleeping Buddha View'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
      alt: 'Sandakphu Himalayan Sunset'
    },
    features: ['Sleeping Buddha Mountain Range', 'Singalila Ridge Trek', 'Land Rover Vintage Ride', 'Tumling & Kalipokhri Lakes'],
    tiers: ['budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Sandakphu at 11,930 feet is the highest point in West Bengal, located on the Singalila Ridge along the Nepal border.',
        long: ' famous for offering an unmatched vista of four of the world\'s five highest peaks — Everest, Kanchenjunga, Lhotse, and Makalu — forming the legendary \'Sleeping Buddha\' snow range.'
      },
      placesToVisit: [
        { name: 'Sandakphu Peak Summit', type: 'Peak Viewpoint', rating: 4.9, desc: 'Summit point looking directly over Kanchenjunga & Everest.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { name: 'Kalipokhri Black Lake', type: 'Sacred Lake', rating: 4.7, desc: 'High altitude dark water lake surrounded by prayer flags.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
        { name: 'Tumling Viewpoint', type: 'Ridge Stopover', rating: 4.8, desc: 'Nepal border village offering sunrise mountain views.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Sherpa Chalet Sandakphu', type: 'Lodge', priceMin: 2200, priceMax: 4500, rating: 4.6, desc: 'Himalayan lodge right on the summit ridge.' },
        { name: 'Shikhar Homestay Manebhanjan', type: 'Homestay', priceMin: 1800, priceMax: 3200, rating: 4.5, desc: 'Base town stay for vintage Land Rover rides.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Bagdogra Airport (IXB)', distKm: 95 },
        nearestRailway: { name: 'New Jalpaiguri Railway Station (NJP)', distKm: 90 },
        cityRoutes: [
          { from: 'Darjeeling', distKm: 32, mode: 'Drive to Manebhanjan + Vintage Land Rover / Trek', duration: '4 hrs' },
          { from: 'Siliguri', distKm: 90, mode: 'Taxi to Manebhanjan', duration: '3.5 hrs' }
        ]
      },
      weather: { tempMin: -8, tempMax: 15, bestMonths: 'Oct to May', lat: 27.1062, lng: 88.0016 }
    }
  },
  {
    slug: 'chitrakote-falls',
    title: 'Chitrakote Falls',
    state: 'Chhattisgarh',
    region: 'Bastar District',
    type: 'nature',
    badge: 'Niagara Falls of India',
    short: 'India\'s widest waterfall over the Indravati river, plunging 90 feet in a horseshoe shape.',
    bestTime: { label: 'Jul – Feb', months: [1, 2, 7, 8, 9, 10, 11, 12] },
    rating: 4.8,
    reviewCount: 2150,
    minPrice: 2000,
    distanceFromDelhi: 1350,
    lat: 19.2023,
    lng: 81.7058,
    image: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      alt: 'Chitrakote Horseshoe Waterfall'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
      alt: 'Chitrakote Falls Indravati River Spray'
    },
    features: ['Horseshoe Waterfall Boat Ride', 'Sunset View Point', 'Teerathgarh Falls nearby', 'Bastar Tribal Crafts'],
    tiers: ['cheapest', 'budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Chitrakote Falls is a magnificent 300-meter wide waterfall on the Indravati river in Bastar, Chhattisgarh.',
        long: 'Known as the Niagara Falls of India, Chitrakote expands to over 300 meters during the monsoon season. Visitors can take wooden boat rides close to the thunderous spray mist and explore ancient Bastar art and temples.'
      },
      placesToVisit: [
        { name: 'Chitrakote Waterfall Outlook', type: 'Waterfall', rating: 4.9, desc: 'Panoramic cliff outlook over the 300m wide falls.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Indravati River Boat Safari', type: 'Boat Ride', rating: 4.8, desc: 'Wooden boat ride near the waterfall mist spray.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
        { name: 'Teerathgarh Falls & Kanger Valley', type: 'National Park', rating: 4.8, desc: 'Block waterfall plunging in steps inside Kanger Valley National Park.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Dandami Luxury Resort Chitrakote', type: 'Resort', priceMin: 3200, priceMax: 6500, rating: 4.7, desc: 'Chhattisgarh tourism resort overlooking the waterfall.' },
        { name: 'Bastar Jungle Homestay Jagdalpur', type: 'Homestay', priceMin: 2000, priceMax: 3800, rating: 4.5, desc: 'Tribal art homestay with traditional Bastar cuisine.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Swami Vivekananda Airport Raipur (RPR)', distKm: 275 },
        nearestRailway: { name: 'Jagdalpur Railway Station (JDB)', distKm: 38 },
        cityRoutes: [
          { from: 'Jagdalpur', distKm: 38, mode: 'Taxi / Bus via Geedam road', duration: '45 mins' },
          { from: 'Raipur', distKm: 275, mode: 'Drive / Train to Jagdalpur', duration: '5.5 hrs' }
        ]
      },
      weather: { tempMin: 15, tempMax: 34, bestMonths: 'Jul to Feb', lat: 19.2023, lng: 81.7058 }
    }
  },
  {
    slug: 'shekhawati',
    title: 'Shekhawati',
    state: 'Rajasthan',
    region: 'Jhunjhunu & Sikar',
    type: 'heritage',
    badge: 'Open-Air Art Gallery',
    short: 'Historic region renowned for grand merchant havelis adorned with vibrant fresco murals.',
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    rating: 4.7,
    reviewCount: 1840,
    minPrice: 2500,
    distanceFromDelhi: 230,
    lat: 28.1289,
    lng: 75.3994,
    image: {
      src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80',
      alt: 'Shekhawati Painted Haveli Fresco'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=1600&q=80',
      alt: 'Mandawa Haveli Courtyard'
    },
    features: ['Fresco Painted Haveli Walk', 'Mandawa Fort', 'Nawalgarh Heritage Mansions', 'Camel Safari'],
    tiers: ['budget', 'good', 'better', 'best'],
    detail: {
      overview: {
        short: 'Shekhawati is a semi-arid region in Rajasthan famed as the world\'s largest open-air art gallery.',
        long: 'Built by wealthy Marwari merchants during the 18th-19th centuries, thousands of grand havelis in Mandawa, Nawalgarh, and Fatehpur are decorated with intricate wall frescoes depicting Indian folklore, mythology, and early steam trains.'
      },
      placesToVisit: [
        { name: 'Mandawa Haveli Trail', type: 'Fresco Mansion Walk', rating: 4.8, desc: 'Cobblestone streets lined with painted Marwari mansions.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' },
        { name: 'Nawalgarh Poddar Haveli Museum', type: 'Museum Haveli', rating: 4.8, desc: 'Restored 1902 haveli museum showcasing restored fresco murals.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' },
        { name: 'Castle Mandawa', type: 'Heritage Fort', rating: 4.7, desc: '18th-century fortress turned heritage hotel overlooking the desert town.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Castle Mandawa Heritage Hotel', type: 'Palace Hotel', priceMin: 5500, priceMax: 12000, rating: 4.8, desc: 'Historic desert castle stay with royal dining.' },
        { name: 'Vivaana Culture Hotel Nawalgarh', type: 'Haveli Resort', priceMin: 3500, priceMax: 7000, rating: 4.7, desc: 'Restored twin havelis with painted courtyards.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Jaipur International Airport (JAI)', distKm: 165 },
        nearestRailway: { name: 'Jhunjhunu / Nawalgarh Railway Station', distKm: 15 },
        cityRoutes: [
          { from: 'Delhi', distKm: 230, mode: 'Drive via NH48 / Gurgaon-Rewari highway', duration: '4.5 hrs' },
          { from: 'Jaipur', distKm: 165, mode: 'Drive / Bus via Churu highway', duration: '3.5 hrs' }
        ]
      },
      weather: { tempMin: 9, tempMax: 30, bestMonths: 'Oct to Mar', lat: 28.1289, lng: 75.3994 }
    }
  },
  {
    slug: 'dholavira',
    title: 'Dholavira',
    state: 'Gujarat',
    region: 'Kutch District',
    type: 'heritage',
    badge: '4500-Year Harappan City',
    short: 'UNESCO World Heritage ancient Indus Valley Harappan metropolis in the middle of Rann of Kutch.',
    bestTime: { label: 'Nov – Mar', months: [1, 2, 3, 11, 12] },
    rating: 4.8,
    reviewCount: 1560,
    minPrice: 2400,
    distanceFromDelhi: 1050,
    lat: 23.8863,
    lng: 70.2131,
    image: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      alt: 'Dholavira Harappan Excavation Ruins'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
      alt: 'Dholavira Ancient Citadel & White Rann Road'
    },
    features: ['UNESCO Harappan Citadel', 'Ancient Water Reservoirs', 'Fossil Park', 'Road to Heaven Rann Drive'],
    tiers: ['budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Dholavira on Khadir Bet island in Kutch is one of the most prominent archaeological sites of the Indus Valley Civilization.',
        long: 'Dating back to 2600 BCE, Dholavira features world-first stone water reservoirs, a planned grid citadel, ancient stadiums, and the famous \'Road to Heaven\' highway cutting straight across the salt desert of Rann of Kutch.'
      },
      placesToVisit: [
        { name: 'Dholavira Harappan Excavation Site', type: 'Archaeological Ruins', rating: 4.9, desc: 'Ancient stone citadel, Bailey, and market streets.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
        { name: 'Great Water Reservoirs of Dholavira', type: 'Ancient Engineering', rating: 4.9, desc: 'Massive stone-cut rainwater harvesting reservoirs.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
        { name: 'Road to Heaven (Khadir Bet Drive)', type: 'Scenic Highway', rating: 4.9, desc: 'Breathtaking 30km highway cutting through white salt waters.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Dholavira Tourism Resort & Tents', type: 'Resort', priceMin: 3200, priceMax: 6000, rating: 4.6, desc: 'Eco-resort with Kutchi Bhunga huts near Harappan site.' },
        { name: 'Khadir Homestay Dholavira', type: 'Homestay', priceMin: 2400, priceMax: 4000, rating: 4.5, desc: 'Authentic local village stay with Kutchi meals.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Bhuj Airport (BHJ)', distKm: 215 },
        nearestRailway: { name: 'Samakhiali / Bhuj Railway Station', distKm: 135 },
        cityRoutes: [
          { from: 'Bhuj', distKm: 215, mode: 'Drive via Road to Heaven highway', duration: '3.5 hrs' },
          { from: 'Ahmedabad', distKm: 360, mode: 'Drive / SUV via Radhanpur', duration: '6 hrs' }
        ]
      },
      weather: { tempMin: 12, tempMax: 30, bestMonths: 'Nov to Mar', lat: 23.8863, lng: 70.2131 }
    }
  },
  {
    slug: 'zanskar-valley',
    title: 'Zanskar Valley',
    state: 'Ladakh',
    region: 'Kargil District',
    type: 'adventure',
    badge: 'Remote Himalayan Haven',
    short: 'Isolated high-altitude valley famous for Phugtal cave monastery and Chadar frozen river trek.',
    bestTime: { label: 'Jun – Sep, Jan – Feb', months: [1, 2, 6, 7, 8, 9] },
    rating: 4.9,
    reviewCount: 1890,
    minPrice: 3500,
    distanceFromDelhi: 1050,
    lat: 33.4986,
    lng: 76.8407,
    image: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      alt: 'Zanskar Valley Peaks'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
      alt: 'Phugtal Cave Monastery Zanskar'
    },
    features: ['Phugtal Cave Monastery', 'Chadar Frozen River Trek', 'Drang Drung Glacier', 'Padum Town'],
    tiers: ['budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Zanskar Valley is a semi-arid high altitude desert valley in Ladakh surrounded by snow-capped peaks.',
        long: 'Renowned for the honeycomb-like Phugtal Gompa built into a cliff cave entrance and the winter Chadar trek over the frozen Zanskar river, Zanskar offers unforgettable Himalayan wilderness.'
      },
      placesToVisit: [
        { name: 'Phugtal Monastery', type: 'Cave Monastery', rating: 4.9, desc: 'Cliffside cave monastery built into a natural limestone cliff face.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
        { name: 'Drang Drung Glacier', type: 'Glacier', rating: 4.9, desc: 'Massive winding ice river glacier viewed from Pensi La pass.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { name: 'Karsha Monastery', type: 'Monastery', rating: 4.8, desc: 'Largest Gelugpa monastery in Zanskar overlooking the Padum valley.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Padum Himalayan Homestay', type: 'Homestay', priceMin: 3500, priceMax: 6500, rating: 4.7, desc: 'Warm Ladakhi homestay in Padum with traditional stove heating.' },
        { name: 'Zanskar Eco Resort', type: 'Camp', priceMin: 4000, priceMax: 7500, rating: 4.6, desc: 'Alpine swiss tents facing Zanskar river.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Kushok Bakula Rimpoche Airport Leh (IXL)', distKm: 230 },
        nearestRailway: { name: 'Jammu Tawi Railway Station', distKm: 550 },
        cityRoutes: [
          { from: 'Leh', distKm: 230, mode: 'SUV / 4x4 via Shinku La / Pensi La', duration: '6 hrs' },
          { from: 'Kargil', distKm: 240, mode: 'SUV via Padum highway', duration: '7 hrs' }
        ]
      },
      weather: { tempMin: -20, tempMax: 20, bestMonths: 'Jun to Sep', lat: 33.4986, lng: 76.8407 }
    }
  },
  {
    slug: 'polo-forest',
    title: 'Polo Forest',
    state: 'Gujarat',
    region: 'Sabarkantha District',
    type: 'nature',
    badge: 'Ancient Forest Ruins',
    short: 'Ancient 15th-century Jain and Hindu temple ruins hidden deep inside dense teak forests.',
    bestTime: { label: 'Aug – Feb', months: [1, 2, 8, 9, 10, 11, 12] },
    rating: 4.7,
    reviewCount: 2120,
    minPrice: 2200,
    distanceFromDelhi: 850,
    lat: 23.9575,
    lng: 73.2842,
    image: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      alt: 'Polo Forest Temple Ruins'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
      alt: 'Harnav River and Polo Forest'
    },
    features: ['Sharaneshwar Temple Ruins', 'Harnav Dam & River Walk', 'Vireshwar Temple', 'Teak Jungle Trekking'],
    tiers: ['cheapest', 'budget', 'good'],
    detail: {
      overview: {
        short: 'Polo Forest (Vijaynagar) is a dense green forest surrounding ancient 15th-century ruined temples.',
        long: 'Flanked by the Aravalli hills and bisected by the Harnav river, Polo Forest features stone carved Jain and Shiva temple ruins overgrown with moss and jungle flora.'
      },
      placesToVisit: [
        { name: 'Sharaneshwar Shiva Temple Ruins', type: 'Ruined Temple', rating: 4.8, desc: 'Detailed 15th-century stone temple with carved pillars in the forest.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Harnav River Walk', type: 'River Trail', rating: 4.7, desc: 'Shallow jungle river stream ideal for wading and nature walks.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Polo Retreat Resort', type: 'Resort', priceMin: 3200, priceMax: 5500, rating: 4.6, desc: 'Jungle eco-resort near Harnav dam.' },
        { name: 'Gujarat Tourism Polo Camps', type: 'Camps', priceMin: 2200, priceMax: 4000, rating: 4.5, desc: 'Forest tents managed by Gujarat Tourism.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Sardar Vallabhbhai Patel Airport Ahmedabad (AMD)', distKm: 150 },
        nearestRailway: { name: 'Himmatnagar / Idar Railway Station', distKm: 40 },
        cityRoutes: [
          { from: 'Ahmedabad', distKm: 150, mode: 'Drive via Himmatnagar & Idar', duration: '3 hrs' },
          { from: 'Udaipur', distKm: 120, mode: 'Drive via NH48', duration: '2.5 hrs' }
        ]
      },
      weather: { tempMin: 14, tempMax: 35, bestMonths: 'Aug to Feb', lat: 23.9575, lng: 73.2842 }
    }
  },
  {
    slug: 'tranquebar',
    title: 'Tranquebar (Tharangambadi)',
    state: 'Tamil Nadu',
    region: 'Mayiladuthurai District',
    type: 'beach',
    badge: 'Danish Colonial Haven',
    short: 'Historic 17th-century Danish seaside colony with Fort Dansborg and ozone-rich sea breeze.',
    bestTime: { label: 'Oct – Mar', months: [1, 2, 3, 10, 11, 12] },
    rating: 4.8,
    reviewCount: 1750,
    minPrice: 3200,
    distanceFromDelhi: 2350,
    lat: 11.0267,
    lng: 79.8544,
    image: {
      src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
      alt: 'Fort Dansborg Tranquebar'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1600&q=80',
      alt: 'Tranquebar Danish Coast Fort'
    },
    features: ['Fort Dansborg', 'Zion Church & Danish Museum', 'Town Gate (Landporten)', 'Quiet Ozone Coast Walk'],
    tiers: ['budget', 'good', 'better', 'best'],
    detail: {
      overview: {
        short: 'Tharangambadi (Tranquebar) means \'land of the singing waves\' and served as a Danish trading colony from 1620 to 1845.',
        long: 'Dominating the shoreline is Fort Dansborg, a yellow-painted sea fort. The quiet cobblestone streets feature 17th-century Danish colonial bungalows, maritime museums, and serene beaches.'
      },
      placesToVisit: [
        { name: 'Fort Dansborg', type: 'Seaside Fort', rating: 4.8, desc: 'Danish sea fortress built in 1620 housing maritime artifacts.', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Zion Church & Danish Museum', type: 'Colonial Heritage', rating: 4.6, desc: 'Oldest Protestant church in India dating back to 1701.', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Bungalow on the Beach - Neemrana', type: 'Heritage Hotel', priceMin: 5500, priceMax: 11000, rating: 4.8, desc: 'Restored 18th-century Danish Governor bungalow on the beach.' },
        { name: 'Gate House Tranquebar', type: 'Heritage Hotel', priceMin: 3200, priceMax: 6500, rating: 4.6, desc: 'Cozy colonial home near the town entry gate.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Tiruchirappalli Airport (TRZ)', distKm: 155 },
        nearestRailway: { name: 'Mayiladuthurai Railway Station', distKm: 30 },
        cityRoutes: [
          { from: 'Chennai', distKm: 275, mode: 'Drive via ECR / NH32', duration: '5.5 hrs' },
          { from: 'Puducherry', distKm: 120, mode: 'Drive along East Coast Road', duration: '2.5 hrs' }
        ]
      },
      weather: { tempMin: 22, tempMax: 33, bestMonths: 'Oct to Mar', lat: 11.0267, lng: 79.8544 }
    }
  },
  {
    slug: 'jibhi',
    title: 'Jibhi',
    state: 'Himachal Pradesh',
    region: 'Banjar Valley / Kullu',
    type: 'hillstation',
    badge: 'Untouched Pine Valley',
    short: 'Charming alpine hamlet with wooden treehouses, freshwater streams, and Jalori Pass.',
    bestTime: { label: 'Mar – Jun, Sep – Nov', months: [3, 4, 5, 6, 9, 10, 11] },
    rating: 4.9,
    reviewCount: 3120,
    minPrice: 1800,
    distanceFromDelhi: 490,
    lat: 31.6373,
    lng: 77.4728,
    image: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      alt: 'Jibhi Wooden Cottage Stream'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
      alt: 'Jibhi Waterfall and Pine Forest'
    },
    features: ['Jibhi Waterfall', 'Jalori Pass Trek (3,125m)', 'Serolsar Lake Trek', 'Wooden Treehouse Stays'],
    tiers: ['cheapest', 'budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Jibhi is a serene village in Tirthan valley surrounded by dense pine, deodar, and apple orchards.',
        long: 'Famous for wooden bridges crossing gushing mountain streams, Jibhi is the base for trekking to Jalori Pass (3,125m) and the sacred Serolsar Lake.'
      },
      placesToVisit: [
        { name: 'Jibhi Waterfall', type: 'Waterfall', rating: 4.8, desc: 'Picturesque waterfall reached via wooden bridges in pine forest.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Jalori Pass & Serolsar Lake', type: 'Mountain Pass Trek', rating: 4.9, desc: 'High mountain pass (3,125m) leading to a pristine ridge lake.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Jibhi Treehouse Eco Resort', type: 'Treehouse', priceMin: 3200, priceMax: 6500, rating: 4.8, desc: 'Handcrafted wooden treehouses over stream.' },
        { name: 'Pine Shade Homestay Jibhi', type: 'Homestay', priceMin: 1800, priceMax: 3500, rating: 4.6, desc: 'Cozy Himachali wood stay with home meals.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Kullu Manali Airport Bhuntar (KUU)', distKm: 50 },
        nearestRailway: { name: 'Chandigarh Railway Station', distKm: 250 },
        cityRoutes: [
          { from: 'Delhi', distKm: 490, mode: 'Overnight Volvo Bus to Aut Tunnel + Taxi (1.5 hrs)', duration: '11 hrs' },
          { from: 'Chandigarh', distKm: 250, mode: 'Drive via Mandi & Aut', duration: '6.5 hrs' }
        ]
      },
      weather: { tempMin: -2, tempMax: 24, bestMonths: 'Mar to Nov', lat: 31.6373, lng: 77.4728 }
    }
  },
  {
    slug: 'bhedaghat',
    title: 'Bhedaghat',
    state: 'Madhya Pradesh',
    region: 'Jabalpur District',
    type: 'nature',
    badge: '100ft Marble Rocks Gorge',
    short: 'Soaring 100ft white marble cliffs lining the Narmada river with moonlight boat rides.',
    bestTime: { label: 'Nov – May', months: [1, 2, 3, 4, 5, 11, 12] },
    rating: 4.8,
    reviewCount: 2850,
    minPrice: 2000,
    distanceFromDelhi: 820,
    lat: 23.1311,
    lng: 79.8005,
    image: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      alt: 'Bhedaghat Marble Rocks Narmada'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
      alt: 'Dhuandhar Waterfall Bhedaghat'
    },
    features: ['Marble Rocks Boat Safari', 'Dhuandhar Waterfall', 'Chausath Yogini Temple', 'Ropeway Sky Ride'],
    tiers: ['cheapest', 'budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Bhedaghat is famous for its 100-foot towering marble rock gorge carved by the Narmada river near Jabalpur.',
        long: 'Boating between the glowing white marble rocks — especially on full moon nights — is a magical experience. Nearby, the river plunges into the smoky mist of Dhuandhar Falls.'
      },
      placesToVisit: [
        { name: 'Marble Rocks Gorge', type: 'River Canyon', rating: 4.9, desc: 'Boating between 100ft high white and colored marble cliffs.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Dhuandhar Waterfalls', type: 'Waterfall', rating: 4.8, desc: 'Thunderous waterfall creating a permanent cloud of mist spray.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'MPT Rockwoods Bhedaghat', type: 'Resort', priceMin: 3000, priceMax: 5500, rating: 4.6, desc: 'MP Tourism hotel overlooking the Narmada valley.' },
        { name: 'Hotel Marble Palace Bhedaghat', type: 'Hotel', priceMin: 2000, priceMax: 3800, rating: 4.4, desc: 'Clean hotel near Dhuandhar entrance.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Jabalpur Dumna Airport (JLR)', distKm: 35 },
        nearestRailway: { name: 'Jabalpur Junction Railway Station', distKm: 22 },
        cityRoutes: [
          { from: 'Jabalpur', distKm: 22, mode: 'Taxi / City Bus', duration: '35 mins' },
          { from: 'Bhopal', distKm: 310, mode: 'Train / Drive via NH45', duration: '5.5 hrs' }
        ]
      },
      weather: { tempMin: 10, tempMax: 38, bestMonths: 'Nov to May', lat: 23.1311, lng: 79.8005 }
    }
  },
  {
    slug: 'valparai',
    title: 'Valparai',
    state: 'Tamil Nadu',
    region: 'Coimbatore District',
    type: 'hillstation',
    badge: 'Misty Rainforest Plateau',
    short: 'Serene hill station at 3,500 feet with 40 hairpin bends, lush tea estates, and wildlife.',
    bestTime: { label: 'Sep – May', months: [1, 2, 3, 4, 5, 9, 10, 11, 12] },
    rating: 4.8,
    reviewCount: 2410,
    minPrice: 2500,
    distanceFromDelhi: 2450,
    lat: 10.3262,
    lng: 76.9554,
    image: {
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      alt: 'Valparai Tea Gardens'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
      alt: 'Valparai Sholayar Dam View'
    },
    features: ['Sholayar Dam Viewpoint', 'Aliyar Dam Hairpin Bends', 'Niramai Tea Estates', 'Chinnakallar Waterfalls'],
    tiers: ['budget', 'good', 'better', 'best'],
    detail: {
      overview: {
        short: 'Valparai is a pristine hill station in the Anaimalai Hills surrounded by tea plantations and rainforest reserves.',
        long: 'Drive up via 40 thrilling hairpin bends starting from Aliyar dam. Valparai remains uncrowded and is home to wild elephants, Nilgiri Tahr, and lion-tailed macaques.'
      },
      placesToVisit: [
        { name: 'Sholayar Dam', type: 'Dam & Reservoir', rating: 4.8, desc: 'Second deepest dam in Asia offering vast reservoir views.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
        { name: 'Chinnakallar Waterfalls', type: 'Waterfall', rating: 4.7, desc: 'One of the highest rainfall spots in South India with cascading falls.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Briar Tea Bungalows Valparai', type: 'Heritage Bungalow', priceMin: 4500, priceMax: 9000, rating: 4.8, desc: 'Colonial tea planter bungalows set in private estates.' },
        { name: 'Valparai Green Hill Hotel', type: 'Hotel', priceMin: 2500, priceMax: 4500, rating: 4.5, desc: 'Comfortable hotel in Valparai town center.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Coimbatore International Airport (CJB)', distKm: 120 },
        nearestRailway: { name: 'Pollachi Junction Railway Station', distKm: 65 },
        cityRoutes: [
          { from: 'Coimbatore', distKm: 110, mode: 'Drive via Pollachi & 40 Hairpin Bends', duration: '3.5 hrs' },
          { from: 'Kochi', distKm: 150, mode: 'Drive via Chalakudy & Athirappilly', duration: '4.5 hrs' }
        ]
      },
      weather: { tempMin: 15, tempMax: 26, bestMonths: 'Sep to May', lat: 10.3262, lng: 76.9554 }
    }
  },
  {
    slug: 'tamhini-ghat',
    title: 'Tamhini Ghat',
    state: 'Maharashtra',
    region: 'Pune & Raigad District',
    type: 'nature',
    badge: 'Monsoon Waterfall Pass',
    short: 'Scenic mountain pass renowned for lush green valleys, cascading waterfalls, and monsoon mist.',
    bestTime: { label: 'Jul – Nov', months: [7, 8, 9, 10, 11] },
    rating: 4.8,
    reviewCount: 3560,
    minPrice: 2200,
    distanceFromDelhi: 1420,
    lat: 18.4735,
    lng: 73.4150,
    image: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      alt: 'Tamhini Ghat Monsoon Waterfalls'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
      alt: 'Tamhini Ghat Mist and Green Valleys'
    },
    features: ['Mulshi Dam Lake View', 'Plus Valley Trek', 'Tamhini Waterfalls', 'Kolad White Water Rafting nearby'],
    tiers: ['budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Tamhini Ghat is a mountain pass located between Mulshi and Kolad in the Western Ghats of Maharashtra.',
        long: 'During the monsoon season, Tamhini Ghat transforms into a green paradise with hundreds of temporary waterfalls cascading down mossy cliffs into deep valleys.'
      },
      placesToVisit: [
        { name: 'Mulshi Dam Backwaters', type: 'Lake View', rating: 4.8, desc: 'Vast calm lake backwaters framed by green Sahyadri hills.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
        { name: 'Plus Valley Viewpoint', type: 'Valley View', rating: 4.8, desc: 'Plus-shaped canyon valley offering spectacular monsoon mist views.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Mulshi Lake Resort Tamhini', type: 'Resort', priceMin: 3500, priceMax: 7000, rating: 4.6, desc: 'Lakeside resort with monsoon infinity pool.' },
        { name: 'Tamhini Forest Farmstay', type: 'Farmstay', priceMin: 2200, priceMax: 4200, rating: 4.5, desc: 'Eco farmstay serving rustic Maharashtrian meals.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Pune International Airport (PNQ)', distKm: 70 },
        nearestRailway: { name: 'Pune Junction Railway Station', distKm: 65 },
        cityRoutes: [
          { from: 'Pune', distKm: 65, mode: 'Drive via Paud road & Mulshi', duration: '2 hrs' },
          { from: 'Mumbai', distKm: 140, mode: 'Drive via Expressway & Lonavala', duration: '3.5 hrs' }
        ]
      },
      weather: { tempMin: 16, tempMax: 30, bestMonths: 'Jul to Nov', lat: 18.4735, lng: 73.4150 }
    }
  },
  {
    slug: 'loktak-lake',
    title: 'Loktak Lake',
    state: 'Manipur',
    region: 'Bishnupur District',
    type: 'nature',
    badge: 'World\'s Only Floating Park',
    short: 'Northeast India\'s largest freshwater lake famous for floating phumdi rings and Sangai deer.',
    bestTime: { label: 'Oct – Apr', months: [1, 2, 3, 4, 10, 11, 12] },
    rating: 4.9,
    reviewCount: 1680,
    minPrice: 2400,
    distanceFromDelhi: 2400,
    lat: 24.5557,
    lng: 93.8052,
    image: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      alt: 'Loktak Lake Floating Phumdis'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
      alt: 'Keibul Lamjao National Park Floating Rings'
    },
    features: ['Keibul Lamjao Floating National Park', 'Sangai Brow-Antlered Deer', 'Sendra Island Homestays', 'Phumdi Boating'],
    tiers: ['budget', 'good', 'better'],
    detail: {
      overview: {
        short: 'Loktak Lake is the largest freshwater lake in Northeast India, famous for its unique circular floating biomass islands called \'phumdis\'.',
        long: 'On the largest phumdi lies Keibul Lamjao National Park — the world\'s only floating national park and the last natural sanctuary of the endangered Sangai dancing deer.'
      },
      placesToVisit: [
        { name: 'Keibul Lamjao Floating National Park', type: 'National Park', rating: 4.9, desc: 'World\'s only floating national park home to the Sangai deer.', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
        { name: 'Sendra Island Viewpoint', type: 'Island View', rating: 4.8, desc: 'Elevated island inside the lake offering views of circular phumdi rings.', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Sendra Cottages Loktak', type: 'Resort', priceMin: 3500, priceMax: 6500, rating: 4.7, desc: 'Hilltop cottages on Sendra island with 360-degree lake views.' },
        { name: 'Loktak Floating Homestay', type: 'Homestay', priceMin: 2400, priceMax: 4200, rating: 4.6, desc: 'Unique homestay built directly on a floating phumdi.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Imphal Bir Tikendrajit Airport (IMF)', distKm: 45 },
        nearestRailway: { name: 'Dimapur / Jiribam Railway Station', distKm: 210 },
        cityRoutes: [
          { from: 'Imphal', distKm: 45, mode: 'Taxi / SUV via Tiddim road', duration: '1 hr' }
        ]
      },
      weather: { tempMin: 8, tempMax: 28, bestMonths: 'Oct to Apr', lat: 24.5557, lng: 93.8052 }
    }
  },
  {
    slug: 'dhanaulti',
    title: 'Dhanaulti',
    state: 'Uttarakhand',
    region: 'Tehri Garhwal',
    type: 'hillstation',
    badge: 'Tranquil Deodar Forests',
    short: 'Quiet, serene hill town surrounded by deodar, oak and rhododendron forests.',
    bestTime: { label: 'Year Round', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    rating: 4.7,
    reviewCount: 2980,
    minPrice: 2200,
    distanceFromDelhi: 290,
    lat: 30.4500,
    lng: 78.2300,
    image: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      alt: 'Dhanaulti Eco Park Deodar Trees'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
      alt: 'Dhanaulti Snow Peaks View'
    },
    features: ['Amber & Dhara Eco Parks', 'Surkanda Devi Temple Cable Car', 'Potato Farm Viewpoint', 'Adventure Camps'],
    tiers: ['budget', 'good', 'better', 'best'],
    detail: {
      overview: {
        short: 'Dhanaulti is a quiet hill station at 7,500 feet located 24 km beyond Mussoorie in Uttarakhand.',
        long: 'Unlike crowded tourist towns, Dhanaulti offers quiet forest walks inside Eco Parks, panoramic Himalayan snow peak views, and the sacred Surkanda Devi temple reachable via cable car.'
      },
      placesToVisit: [
        { name: 'Eco Park Dhanaulti', type: 'Deodar Park', rating: 4.8, desc: 'Protected deodar forest park with walking trails and adventure rides.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
        { name: 'Surkanda Devi Temple', type: 'Temple & Cable Car', rating: 4.9, desc: 'High altitude hilltop temple (2,757m) with 360-degree Himalayan snow views.', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'Glamwood Resort Dhanaulti', type: 'Resort', priceMin: 3500, priceMax: 7000, rating: 4.6, desc: 'Hillside resort surrounded by deodar trees.' },
        { name: 'Camp O Royale Dhanaulti', type: 'Camps', priceMin: 2200, priceMax: 4500, rating: 4.5, desc: 'Alpine tents with bonfire and zip-lining.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Jolly Grant Airport Dehradun (DED)', distKm: 82 },
        nearestRailway: { name: 'Dehradun Railway Station', distKm: 65 },
        cityRoutes: [
          { from: 'Delhi', distKm: 290, mode: 'Drive via Dehradun & Mussoorie', duration: '6.5 hrs' },
          { from: 'Dehradun', distKm: 65, mode: 'Drive via Mussoorie / Suwakholi', duration: '2.5 hrs' }
        ]
      },
      weather: { tempMin: -2, tempMax: 24, bestMonths: 'Year Round', lat: 30.4500, lng: 78.2300 }
    }
  },
  {
    slug: 'mandu',
    title: 'Mandu (Mandav)',
    state: 'Madhya Pradesh',
    region: 'Dhar District',
    type: 'heritage',
    badge: 'Romantic Afghan Fortress',
    short: 'Ancient ruined Afghan fortress city famed for Jahaz Mahal (Ship Palace) and Rani Roopmati Pavilion.',
    bestTime: { label: 'Jul – Mar', months: [1, 2, 3, 7, 8, 9, 10, 11, 12] },
    rating: 4.8,
    reviewCount: 2240,
    minPrice: 2000,
    distanceFromDelhi: 880,
    lat: 22.3664,
    lng: 75.3941,
    image: {
      src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=800&q=80',
      alt: 'Jahaz Mahal Mandu'
    },
    heroImage: {
      src: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=1600&q=80',
      alt: 'Rani Roopmati Pavilion Sunset Mandu'
    },
    features: ['Jahaz Mahal (Ship Palace)', 'Rani Roopmati Pavilion', 'Hindola Mahal (Swinging Palace)', 'Baz Bahadur Palace'],
    tiers: ['budget', 'good', 'better', 'best'],
    detail: {
      overview: {
        short: 'Mandu is a ruined fortress city in Madhya Pradesh set on a plateau perched over the Narmada valley.',
        long: 'Famed for its Afghan architecture, Jahaz Mahal appears to float between two lakes like a ship, while Rani Roopmati\'s Pavilion commands breathtaking views over the Narmada river plains.'
      },
      placesToVisit: [
        { name: 'Jahaz Mahal (Ship Palace)', type: 'Palace', rating: 4.9, desc: '15th-century palace built between two artificial lakes.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' },
        { name: 'Rani Roopmati Pavilion', type: 'Fortress Viewpoint', rating: 4.8, desc: 'Hilltop pavilion offering panoramic sunset vistas over Narmada valley.', image: 'https://images.unsplash.com/photo-1626014903708-662886f3db5a?auto=format&fit=crop&w=600&q=80' }
      ],
      whereToStay: [
        { name: 'MPT Malwa Resort Mandu', type: 'Resort', priceMin: 2800, priceMax: 5500, rating: 4.6, desc: 'Lakeside MP Tourism resort near Jahaz Mahal.' },
        { name: 'Mandu Heritage Lodge', type: 'Hotel', priceMin: 2000, priceMax: 3800, rating: 4.4, desc: 'Cozy hotel near local markets.' }
      ],
      howToReach: {
        nearestAirport: { name: 'Indore Devi Ahilya Bai Holkar Airport (IDR)', distKm: 98 },
        nearestRailway: { name: 'Indore Junction Railway Station', distKm: 98 },
        cityRoutes: [
          { from: 'Indore', distKm: 98, mode: 'Drive via Dhar highway', duration: '2 hrs' },
          { from: 'Bhopal', distKm: 280, mode: 'Drive via Indore', duration: '5 hrs' }
        ]
      },
      weather: { tempMin: 12, tempMax: 38, bestMonths: 'Jul to Mar', lat: 22.3664, lng: 75.3941 }
    }
  }
];

// Read existing index
const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));

let addedCount = 0;
newDestinations.forEach(d => {
  const exists = indexData.destinations.some(existing => existing.slug === d.slug);
  if (!exists) {
    // 1. Add summary to index
    const summary = {
      slug: d.slug,
      title: d.title,
      state: d.state,
      region: d.region,
      type: d.type,
      badge: d.badge,
      short: d.short,
      bestTime: d.bestTime,
      rating: d.rating,
      reviewCount: d.reviewCount,
      minPrice: d.minPrice,
      distanceFromDelhi: d.distanceFromDelhi,
      lat: d.lat,
      lng: d.lng,
      image: d.image,
      heroImage: d.heroImage,
      features: d.features,
      tiers: d.tiers
    };
    indexData.destinations.push(summary);

    // 2. Write individual full JSON file
    const fullData = {
      ...summary,
      overview: d.detail.overview,
      placesToVisit: d.detail.placesToVisit,
      whereToStay: d.detail.whereToStay,
      howToReach: d.detail.howToReach,
      weather: d.detail.weather
    };
    fs.writeFileSync(path.join(DEST_DIR, `${d.slug}.json`), JSON.stringify(fullData, null, 2), 'utf8');
    addedCount++;
    console.log(`Created new destination: ${d.title} (${d.state}) -> data/destinations/${d.slug}.json`);
  }
});

// Write updated index.json
fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf8');
console.log(`Successfully updated index.json with ${addedCount} new destinations! Total now: ${indexData.destinations.length}`);

// Rebuild search-index.json preserving the full schema expected by finder.js
let existingEntries = [];
if (fs.existsSync(SEARCH_INDEX_PATH)) {
  try {
    const raw = JSON.parse(fs.readFileSync(SEARCH_INDEX_PATH, 'utf8'));
    existingEntries = Array.isArray(raw) ? raw : (raw.entries || []);
  } catch (e) {
    existingEntries = [];
  }
}

const existingMap = new Map(existingEntries.map(e => [e.slug, e]));

const searchEntries = indexData.destinations.map(d => {
  const existing = existingMap.get(d.slug);
  const detailPath = path.join(DEST_DIR, `${d.slug}.json`);
  let places = [];
  let hotels = [];
  let overview = {};

  if (fs.existsSync(detailPath)) {
    try {
      const detail = JSON.parse(fs.readFileSync(detailPath, 'utf8'));
      places = detail.topPlaces || [];
      hotels = detail.hotels || [];
      overview = detail.overview || {};
    } catch (e) {}
  }

  const hay = (' ' + [
    d.title, d.state, d.region, d.type, d.badge, d.short,
    (d.features || []).join(' '),
    places.map(p => `${p.name} ${p.description || ''}`).join(' '),
    hotels.map(h => `${h.name} ${(h.amenities || []).join(' ')} ${(h.tags || []).join(' ')}`).join(' ')
  ].filter(Boolean).join(' ') + ' ').toLowerCase().replace(/\s+/g, ' ');

  return {
    slug: d.slug,
    placeNames: places.map(p => p.name).filter(Boolean),
    hotelNames: hotels.map(h => h.name).filter(Boolean),
    tiers: d.tiers || existing?.tiers || ['good'],
    hotelMinPrices: hotels.length > 0 ? hotels.map(h => h.priceMin != null ? h.priceMin : (d.minPrice || 0)) : [d.minPrice || 0],
    hay: hay || existing?.hay || ''
  };
});

fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify({ entries: searchEntries }), 'utf8');
console.log(`Rebuilt search-index.json (${searchEntries.length} items) in { entries: [...] } format.`);

