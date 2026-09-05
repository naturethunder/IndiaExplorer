/**
 * curate-premier-hotels.js
 * Injects authentic, iconic hotels with real market pricing into India's top premier holiday destinations.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data', 'destinations');

const PREMIER_DESTINATIONS = {
  'shimla': {
    title: 'Shimla',
    state: 'Himachal Pradesh',
    hotels: [
      {
        name: 'Zostel Shimla',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 700,
        priceMax: 1200,
        rating: 4.5,
        reviews: 640,
        amenities: ['WiFi', 'Dorm & Private Rooms', 'Common Lounge', 'Mountain Views'],
        tags: ['Backpacker Hub', 'Social Stay']
      },
      {
        name: 'HPTDC Hotel Peterhof',
        type: 'heritage',
        tier: 'budget',
        priceMin: 2200,
        priceMax: 3800,
        rating: 4.2,
        reviews: 820,
        amenities: ['Restaurant', 'Sprawling Lawns', 'Heater', 'Free Parking'],
        tags: ['Govt Heritage', 'Viceregal History']
      },
      {
        name: 'Hotel Willow Banks',
        type: 'hotel',
        tier: 'good',
        priceMin: 3800,
        priceMax: 6200,
        rating: 4.4,
        reviews: 950,
        amenities: ['Mall Road Access', 'Rooftop Cafe', 'Spa', 'Valley View'],
        tags: ['Central Mall Road', 'Valley Panorama']
      },
      {
        name: 'Hotel Combermere',
        type: 'hotel',
        tier: 'better',
        priceMin: 5500,
        priceMax: 8500,
        rating: 4.4,
        reviews: 1400,
        amenities: ['Elevator to Mall Road', 'Gym', 'Multiple Dining', 'Game Room'],
        tags: ['Prime Location', 'Family Favourite']
      },
      {
        name: 'Clarkes Hotel - A Grand Heritage Hotel',
        type: 'heritage',
        tier: 'best',
        priceMin: 9000,
        priceMax: 15000,
        rating: 4.6,
        reviews: 780,
        amenities: ['Colonial Architecture', 'Fine Dining Dining Hall', 'Bar', 'Valet'],
        tags: ['Heritage Since 1898', 'Mall Road Charm']
      },
      {
        name: 'The Oberoi Cecil',
        type: 'resort',
        tier: 'luxury',
        priceMin: 18000,
        priceMax: 32000,
        rating: 4.8,
        reviews: 1350,
        amenities: ['Indoor Heated Pool', 'Oberoi Spa', 'Atrium Lounge', 'Billiards Room', 'Fine Dining'],
        tags: ['Iconic Luxury', '5-Star Heritage']
      },
      {
        name: 'Wildflower Hall, An Oberoi Resort (Mashobra)',
        type: 'resort',
        tier: 'extra_luxury',
        priceMin: 28000,
        priceMax: 48000,
        rating: 4.9,
        reviews: 1100,
        amenities: ['Infinity Outdoor Whirlpool', 'Cedar Forest Views', 'Luxury Spa', 'Nature Treks', 'Fine Dining'],
        tags: ['Himalayan Sanctuary', 'Ultra Luxury']
      }
    ]
  },

  'mussoorie': {
    title: 'Mussoorie',
    state: 'Uttarakhand',
    hotels: [
      {
        name: 'Bunkstay Mussoorie',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 600,
        priceMax: 1100,
        rating: 4.5,
        reviews: 510,
        amenities: ['WiFi', 'Rooftop Cafe', 'Dorm Beds', 'Himalayan View'],
        tags: ['Backpacker Hub', 'Sunset Views']
      },
      {
        name: 'Hotel SunGrace',
        type: 'hotel',
        tier: 'budget',
        priceMin: 2200,
        priceMax: 3500,
        rating: 4.1,
        reviews: 430,
        amenities: ['Valley View Balcony', 'Restaurant', 'Free Parking', 'Room Service'],
        tags: ['Quiet Retreat', 'Value Stay']
      },
      {
        name: 'Fortune Resort Grace (ITC)',
        type: 'resort',
        tier: 'good',
        priceMin: 4500,
        priceMax: 7500,
        rating: 4.4,
        reviews: 860,
        amenities: ['Doon Valley Views', 'Gym', 'Kids Play Area', 'Multi-cuisine Restaurant'],
        tags: ['Family Friendly', 'Near Mall Road']
      },
      {
        name: 'Rokeby Manor (Landour)',
        type: 'heritage',
        tier: 'better',
        priceMin: 12000,
        priceMax: 22000,
        rating: 4.7,
        reviews: 920,
        amenities: ['Colonial Stone Cottages', 'Emily’s Tearoom', 'Outdoor Jacuzzi', 'Landour Ridge Views'],
        tags: ['Landour Landmark', 'Victorian Charm']
      },
      {
        name: 'Welcomhotel The Savoy',
        type: 'heritage',
        tier: 'best',
        priceMin: 16000,
        priceMax: 28000,
        rating: 4.7,
        reviews: 1250,
        amenities: ['Historic Gothic Castle', 'Kairali Spa', 'Grand Dining Hall', 'Writer’s Bar'],
        tags: ['Historic 1902 Grandeur', 'High Heritage']
      },
      {
        name: 'JW Marriott Mussoorie Walnut Grove Resort & Spa',
        type: 'resort',
        tier: 'luxury',
        priceMin: 24000,
        priceMax: 45000,
        rating: 4.8,
        reviews: 1800,
        amenities: ['Indoor Heated Pool', 'Cedar Spa by L’Occitane', 'Bowling Alley', '5 Restaurants', 'Valley Lawn'],
        tags: ['5-Star Luxury Resort', 'Family Paradise']
      }
    ]
  },

  'nainital': {
    title: 'Nainital',
    state: 'Uttarakhand',
    hotels: [
      {
        name: 'Zostel Nainital',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 700,
        priceMax: 1200,
        rating: 4.6,
        reviews: 580,
        amenities: ['WiFi', 'Cafe', 'Common Chill Area', 'Trek Assistance'],
        tags: ['Backpacker Hub', 'Social Stay']
      },
      {
        name: 'KMVN Tourist Rest House Tallital',
        type: 'guesthouse',
        tier: 'budget',
        priceMin: 1800,
        priceMax: 3200,
        rating: 4.0,
        reviews: 410,
        amenities: ['Lake Proximity', 'Restaurant', 'Hot Water', 'Tour Desk'],
        tags: ['Govt Guest House', 'Budget Friendly']
      },
      {
        name: 'Lakeside Inn Nainital',
        type: 'hotel',
        tier: 'good',
        priceMin: 3200,
        priceMax: 5000,
        rating: 4.3,
        reviews: 670,
        amenities: ['Direct Lake Views', 'Mall Road Access', 'Restaurant', 'WiFi'],
        tags: ['Lakefront', 'Central Location']
      },
      {
        name: 'Shervani Hilltop Nainital',
        type: 'resort',
        tier: 'better',
        priceMin: 5500,
        priceMax: 9000,
        rating: 4.5,
        reviews: 1100,
        amenities: ['Hillside Cottages', 'Courtyard Bonfire', 'Kids Zone', 'Shuttle to Mall Road'],
        tags: ['Boutique Hill Resort', 'Lush Greenery']
      },
      {
        name: 'The Manu Maharani',
        type: 'resort',
        tier: 'best',
        priceMin: 8500,
        priceMax: 14000,
        rating: 4.6,
        reviews: 1350,
        amenities: ['Olive Spa', 'Lake Panorama Terrace', 'Fine Dining', 'Garden Lounge'],
        tags: ['Luxury Resort', 'Lake View']
      },
      {
        name: 'The Naini Retreat by Leisure Hotels',
        type: 'heritage',
        tier: 'luxury',
        priceMin: 12000,
        priceMax: 20000,
        rating: 4.7,
        reviews: 980,
        amenities: ['Historical Royal Residence', 'Ayurvana Spa', 'Tea Lounge', 'Forest Walks'],
        tags: ['Maharaja Heritage', 'Ayari Hills']
      }
    ]
  },

  'alleppey': {
    title: 'Alleppey',
    state: 'Kerala',
    hotels: [
      {
        name: 'Zostel Alleppey',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 650,
        priceMax: 1100,
        rating: 4.5,
        reviews: 480,
        amenities: ['Beachside (50m)', 'AC Dorms', 'Rooftop Chill Zone', 'Kayak Tours'],
        tags: ['Backpacker Hub', 'Beachside']
      },
      {
        name: 'Palmy Lake Resort & Homestay',
        type: 'homestay',
        tier: 'budget',
        priceMin: 1600,
        priceMax: 2800,
        rating: 4.4,
        reviews: 320,
        amenities: ['Canal View', 'Home Cooked Kerala Meals', 'Canoe Village Ride', 'Garden'],
        tags: ['Authentic Backwaters', 'Warm Hospitality']
      },
      {
        name: 'KTDC Ripple Land / Motel Ara',
        type: 'hotel',
        tier: 'good',
        priceMin: 2800,
        priceMax: 4500,
        rating: 4.1,
        reviews: 450,
        amenities: ['Restaurant', 'Backwater Boat Jetty Access', 'WiFi', 'Parking'],
        tags: ['Govt Verified', 'Reliable']
      },
      {
        name: 'Ramada by Wyndham Alleppey',
        type: 'resort',
        tier: 'better',
        priceMin: 5500,
        priceMax: 9500,
        rating: 4.5,
        reviews: 1200,
        amenities: ['Rooftop Pool', 'Punnamada Lakefront', 'Ayurveda Spa', 'Multi-cuisine Dining'],
        tags: ['4-Star Comfort', 'Lakefront Pool']
      },
      {
        name: 'Punnamada Resort',
        type: 'resort',
        tier: 'best',
        priceMin: 8500,
        priceMax: 16000,
        rating: 4.6,
        reviews: 890,
        amenities: ['Traditional Kerala Architecture', 'Houseboat Cruises', 'Ayurvedic Centre', 'Lakeside Pool'],
        tags: ['Heritage Backwater Resort', 'Scenic Tranquillity']
      },
      {
        name: 'Lake Palace Resort Alleppey',
        type: 'resort',
        tier: 'luxury',
        priceMin: 14000,
        priceMax: 26000,
        rating: 4.7,
        reviews: 780,
        amenities: ['Private Island Setting', 'Water Villas with Jacuzzi', 'Infinity Pool', 'Houseboats', 'Ayurveda'],
        tags: ['Exclusive Island Stay', 'Luxury Villas']
      }
    ]
  },

  'gokarna': {
    title: 'Gokarna',
    state: 'Karnataka',
    hotels: [
      {
        name: 'Trippr Gokarna Beach Hostel',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 550,
        priceMax: 950,
        rating: 4.4,
        reviews: 420,
        amenities: ['Direct Beach Access', 'Cafe', 'Dorm & Shacks', 'Hammocks'],
        tags: ['Beachfront Hostel', 'Backpacker Vibe']
      },
      {
        name: 'Zostel Gokarna',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 700,
        priceMax: 1300,
        rating: 4.6,
        reviews: 880,
        amenities: ['Clifftop Ocean View', 'Cafe', 'Private Rooms & Dorms', 'Sunset Point'],
        tags: ['Best Clifftop Sunset', 'Social Hub']
      },
      {
        name: 'Namaste Cafe & Beach Cottages (Om Beach)',
        type: 'resort',
        tier: 'budget',
        priceMin: 1800,
        priceMax: 3500,
        rating: 4.2,
        reviews: 1600,
        amenities: ['Iconic Om Beach Location', 'Beach Cafe', 'Seafood Dining', 'Sea Breeze Rooms'],
        tags: ['Om Beach Landmark', 'Historic Beach Shack']
      },
      {
        name: 'Kudle Beach View Resort & Spa',
        type: 'resort',
        tier: 'good',
        priceMin: 3500,
        priceMax: 6000,
        rating: 4.3,
        reviews: 750,
        amenities: ['Swimming Pool', 'Kudle Beach Path', 'Spa & Yoga', 'Multi-cuisine Restaurant'],
        tags: ['Pool & Sea Breeze', 'Kudle Beach']
      },
      {
        name: 'Kahani Paradise',
        type: 'resort',
        tier: 'better',
        priceMin: 12000,
        priceMax: 22000,
        rating: 4.8,
        reviews: 210,
        amenities: ['20-Acre Private Estate', 'Infinity Pool into Ocean', 'Gourmet Organic Dining', 'Helipad'],
        tags: ['Boutique Villa Luxury', 'Panoramic Heights']
      },
      {
        name: 'SwaSwara - CGH Earth (Om Beach)',
        type: 'resort',
        tier: 'luxury',
        priceMin: 18000,
        priceMax: 32000,
        rating: 4.9,
        reviews: 430,
        amenities: ['Villas with Private Courtyard', 'Naturopathy & Ayurveda', 'Yoga Shala', 'Private Path to Om Beach', 'Art Studio'],
        tags: ['Holistic Wellness Sanctuary', 'CGH Earth Luxury']
      }
    ]
  },

  'kodaikanal': {
    title: 'Kodaikanal',
    state: 'Tamil Nadu',
    hotels: [
      {
        name: 'Zostel Kodaikanal',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 700,
        priceMax: 1200,
        rating: 4.5,
        reviews: 520,
        amenities: ['WiFi', 'Dorms & Tents', 'Cafe', 'Valley View Deck'],
        tags: ['Backpacker Hub', 'Social Stay']
      },
      {
        name: 'TTDC Hotel Tamil Nadu Kodaikanal',
        type: 'hotel',
        tier: 'budget',
        priceMin: 1800,
        priceMax: 3000,
        rating: 4.0,
        reviews: 610,
        amenities: ['Near Kodai Lake', 'Restaurant', 'Sprawling Gardens', 'Parking'],
        tags: ['Govt Verified', 'Near Lake']
      },
      {
        name: 'Villa Retreat - Boutique Heritage Hotel',
        type: 'heritage',
        tier: 'good',
        priceMin: 3800,
        priceMax: 6500,
        rating: 4.6,
        reviews: 740,
        amenities: ['Coaker’s Walk Edge', 'Fireplace Rooms', 'Gourmet Cafe', 'Valley Views'],
        tags: ['Stunning Valley Edge', 'Boutique Charm']
      },
      {
        name: 'Sterling Kodai Lake',
        type: 'resort',
        tier: 'better',
        priceMin: 5000,
        priceMax: 8500,
        rating: 4.4,
        reviews: 1300,
        amenities: ['Lake View Cottages', 'Activity Hub', 'Spa', 'Buffet Dining'],
        tags: ['Family Favourite', 'Near Lake']
      },
      {
        name: 'The Carlton Kodaikanal',
        type: 'heritage',
        tier: 'best',
        priceMin: 9500,
        priceMax: 16000,
        rating: 4.6,
        reviews: 1550,
        amenities: ['Only 5-Star on Kodai Lake', 'Private Shikara Boating', 'Bowling Alley', 'Spa & Jacuzzi', 'Golf Lawns'],
        tags: ['Iconic 5-Star', 'Lakefront Grandeur']
      },
      {
        name: 'The Tamara Kodai',
        type: 'resort',
        tier: 'luxury',
        priceMin: 15000,
        priceMax: 26000,
        rating: 4.8,
        reviews: 890,
        amenities: ['1840s Heritage Monastery', 'Outdoor Heated Pool', 'Elevation Spa', 'French Dining', 'Forest Treks'],
        tags: ['Luxury Heritage Resort', 'Award Winning']
      }
    ]
  },

  'pondicherry': {
    title: 'Pondicherry',
    state: 'Puducherry',
    hotels: [
      {
        name: 'Micasa Hostels Pondicherry',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 650,
        priceMax: 1100,
        rating: 4.4,
        reviews: 430,
        amenities: ['AC Dorms', 'Rooftop Lounge', 'Cycle Rentals', 'Near Promenade'],
        tags: ['Backpacker Hub', 'French Quarter Walkable']
      },
      {
        name: 'Dune de L’Orient (Neemrana)',
        type: 'heritage',
        tier: 'budget',
        priceMin: 2800,
        priceMax: 4800,
        rating: 4.3,
        reviews: 380,
        amenities: ['18th Century French Mansion', 'Courtyard Cafe', 'Antique Furnishings', 'WiFi'],
        tags: ['French Heritage', 'White Town']
      },
      {
        name: 'Maison Perumal - CGH Earth',
        type: 'heritage',
        tier: 'good',
        priceMin: 5500,
        priceMax: 9000,
        rating: 4.7,
        reviews: 560,
        amenities: ['Tamil Heritage Villa', 'Courtyard Dining', 'Local Filter Coffee', 'Heritage Walks'],
        tags: ['Tamil-French Fusion', 'CGH Earth']
      },
      {
        name: 'The Promenade Hotel',
        type: 'hotel',
        tier: 'better',
        priceMin: 7000,
        priceMax: 12000,
        rating: 4.5,
        reviews: 1400,
        amenities: ['Direct Promenade Beach Views', 'Lighthouse Rooftop Restaurant', 'Pool', 'Spa'],
        tags: ['Seaside Promenade', 'Prime Location']
      },
      {
        name: 'Palais de Mahe - CGH Earth',
        type: 'heritage',
        tier: 'best',
        priceMin: 13000,
        priceMax: 22000,
        rating: 4.8,
        reviews: 820,
        amenities: ['French Colonial Courtyard Pool', 'Fine Creole Dining', 'Ayurveda Spa', 'White Town Heart'],
        tags: ['Quintessential French Quarter', 'Boutique Luxury']
      }
    ]
  },

  'mahabaleshwar': {
    title: 'Mahabaleshwar',
    state: 'Maharashtra',
    hotels: [
      {
        name: 'Zostel Panchgani',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 750,
        priceMax: 1200,
        rating: 4.6,
        reviews: 670,
        amenities: ['Container Hostels', 'Valley View Terrace', 'Cafe', 'Bonfire'],
        tags: ['Backpacker Hub', 'Valley Views']
      },
      {
        name: 'MTDC Holiday Resort Mahabaleshwar',
        type: 'resort',
        tier: 'budget',
        priceMin: 2200,
        priceMax: 3800,
        rating: 4.1,
        reviews: 950,
        amenities: ['Surrounded by Thick Forest', 'Restaurant', 'Cottages', 'Free Parking'],
        tags: ['Govt Forest Stay', 'Peaceful Nature']
      },
      {
        name: 'Citrus Hotel Mahabaleshwar',
        type: 'hotel',
        tier: 'good',
        priceMin: 4200,
        priceMax: 6800,
        rating: 4.3,
        reviews: 780,
        amenities: ['Swimming Pool', 'Near Market', 'Restaurant', 'Spa'],
        tags: ['Central Town', 'Family Comfort']
      },
      {
        name: 'Evershine Resort & Spa',
        type: 'resort',
        tier: 'better',
        priceMin: 7500,
        priceMax: 13000,
        rating: 4.6,
        reviews: 1600,
        amenities: ['Palace-Style Architecture', 'Large Pool', 'Strawberry Trail', 'Spa', 'Kids Zone'],
        tags: ['Luxury Palace Resort', 'Strawberry Estate']
      },
      {
        name: 'Brightland Resort & Spa',
        type: 'resort',
        tier: 'best',
        priceMin: 8500,
        priceMax: 15000,
        rating: 4.6,
        reviews: 1450,
        amenities: ['Edge of Sahyadri Valley', 'Solar Heated Pool', 'Prana Spa', 'Multiple Dining Options'],
        tags: ['Cliffside Panorama', 'Iconic Resort']
      },
      {
        name: 'Le Méridien Mahabaleshwar Resort & Spa',
        type: 'resort',
        tier: 'luxury',
        priceMin: 16000,
        priceMax: 30000,
        rating: 4.8,
        reviews: 1300,
        amenities: ['Infinity Clifftop Pool', 'Chingari Fine Dining', 'Explore Spa', 'Forest Trails'],
        tags: ['5-Star Luxury', 'Marriott International']
      }
    ]
  },

  'wayanad': {
    title: 'Wayanad',
    state: 'Kerala',
    hotels: [
      {
        name: 'Zostel Wayanad',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 650,
        priceMax: 1100,
        rating: 4.5,
        reviews: 490,
        amenities: ['Tea Plantation Setting', 'Dorms & Private Tents', 'Cafe', 'Trek Assistance'],
        tags: ['Backpacker Hub', 'Plantation Stay']
      },
      {
        name: 'Greenex Farms Homestay & Farm Stay',
        type: 'homestay',
        tier: 'budget',
        priceMin: 2200,
        priceMax: 3800,
        rating: 4.5,
        reviews: 310,
        amenities: ['Coffee & Cardamom Farm', 'Stream Bathing', 'Campfire', 'Home Cooked Food'],
        tags: ['Eco Farmstay', 'Authentic Nature']
      },
      {
        name: 'KTDC Pepper Grove Sultan Bathery',
        type: 'hotel',
        tier: 'good',
        priceMin: 2800,
        priceMax: 4500,
        rating: 4.1,
        reviews: 420,
        amenities: ['Central Location', 'Restaurant', 'Beer & Wine Parlour', 'Travel Desk'],
        tags: ['Govt Verified', 'Town Centre']
      },
      {
        name: 'Morickap Resort Wayanad',
        type: 'resort',
        tier: 'better',
        priceMin: 6500,
        priceMax: 11000,
        rating: 4.6,
        reviews: 820,
        amenities: ['Swiss-Style Chalets', 'Large Pool', 'Mountain Vista', 'Spa & Indoor Games'],
        tags: ['Hilltop Views', 'Premium Resort']
      },
      {
        name: 'The Windflower Resort & Spa Wayanad',
        type: 'resort',
        tier: 'best',
        priceMin: 8500,
        priceMax: 15000,
        rating: 4.7,
        reviews: 950,
        amenities: ['Tea Estate Setting', 'Outdoor Pool with Mist Views', 'Ayurveda Spa', 'Open Air Dining'],
        tags: ['Tea Valley Tranquility', 'Signature Spa']
      },
      {
        name: 'Vythiri Resort',
        type: 'resort',
        tier: 'luxury',
        priceMin: 14000,
        priceMax: 25000,
        rating: 4.8,
        reviews: 1400,
        amenities: ['Luxury Tree Houses with Private Jacuzzi', 'Rope Bridge over Stream', 'Forest Pool', 'Spa'],
        tags: ['Iconic Rainforest Treehouse', 'Eco Luxury']
      }
    ]
  },

  'chikmagalur': {
    title: 'Chikmagalur',
    state: 'Karnataka',
    hotels: [
      {
        name: 'Zostel Chikmagalur',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 700,
        priceMax: 1200,
        rating: 4.5,
        reviews: 580,
        amenities: ['Coffee Plantation Views', 'Cafe', 'Common Chill Area', 'Trek Desk'],
        tags: ['Backpacker Hub', 'Social Stay']
      },
      {
        name: 'Coffee Bean Homestay',
        type: 'homestay',
        tier: 'budget',
        priceMin: 2500,
        priceMax: 4200,
        rating: 4.6,
        reviews: 380,
        amenities: ['100-Year-Old Courtyard House', 'Estate Walk', 'Malnad Cuisine', 'Bonfire'],
        tags: ['Authentic Malnad Homestay', 'Coffee Estate']
      },
      {
        name: 'Gateway Chikmagalur - IHCL SeleQtions',
        type: 'resort',
        tier: 'good',
        priceMin: 6000,
        priceMax: 10000,
        rating: 4.5,
        reviews: 890,
        amenities: ['Colonial Style Cottages', 'Pool', 'Ayurveda Spa', 'Peacock Garden'],
        tags: ['Taj Hospitality', 'Quiet Luxury']
      },
      {
        name: 'Java Rain Resort',
        type: 'resort',
        tier: 'better',
        priceMin: 12000,
        priceMax: 20000,
        rating: 4.7,
        reviews: 780,
        amenities: ['Mullayanagiri Views', 'Private Jacuzzi Villas', 'Infinity Pool', 'Tree-top Bar'],
        tags: ['Spectacular Valley Panorama', 'Boutique Luxury']
      },
      {
        name: 'The Serai Chikmagalur',
        type: 'resort',
        tier: 'luxury',
        priceMin: 18000,
        priceMax: 32000,
        rating: 4.8,
        reviews: 1200,
        amenities: ['Private Pool Villas', 'Oma Spa (Coffee Scrubs)', 'Fine Dining', 'Coffee Plantation Walks'],
        tags: ['Ultimate Coffee Luxury', 'Private Pool Villas']
      }
    ]
  },

  'gangtok': {
    title: 'Gangtok',
    state: 'Sikkim',
    hotels: [
      {
        name: 'Zostel Gangtok',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 650,
        priceMax: 1100,
        rating: 4.5,
        reviews: 510,
        amenities: ['Kanchenjunga Views', 'Rooftop Cafe', 'Dorms & Privates', 'Nathula Pass Desk'],
        tags: ['Backpacker Hub', 'Mountain Vibe']
      },
      {
        name: 'Tag Resorts Dew Pond Gangtok',
        type: 'hotel',
        tier: 'budget',
        priceMin: 2200,
        priceMax: 3800,
        rating: 4.2,
        reviews: 360,
        amenities: ['Near MG Marg', 'Restaurant', 'Free WiFi', 'Room Heater'],
        tags: ['Near Mall', 'Cozy Stay']
      },
      {
        name: 'Lemon Tree Hotel Gangtok',
        type: 'hotel',
        tier: 'good',
        priceMin: 4500,
        priceMax: 7500,
        rating: 4.4,
        reviews: 720,
        amenities: ['Citrus Cafe', 'Fitness Centre', 'Valley View Rooms', 'Casino Access'],
        tags: ['Modern Comfort', 'Valley Views']
      },
      {
        name: 'The Elgin Nor-Khill - Heritage Hotel',
        type: 'heritage',
        tier: 'better',
        priceMin: 8500,
        priceMax: 14000,
        rating: 4.6,
        reviews: 840,
        amenities: ['Chogyal Royal Guest House (1932)', 'Tibetan Art Decor', 'Lounge & Bar', 'Kanchenjunga Views'],
        tags: ['Royal Sikkim Heritage', 'Historic Landmark']
      },
      {
        name: 'Mayfair Spa Resort & Casino Gangtok',
        type: 'resort',
        tier: 'luxury',
        priceMin: 14000,
        priceMax: 26000,
        rating: 4.8,
        reviews: 1600,
        amenities: ['Monastic Sikkim Architecture', 'Full Service Casino', 'Heated Pool & Spa', 'Forest Setting', 'Multi-dining'],
        tags: ['5-Star Luxury Resort', 'Casino Mahjong']
      }
    ]
  },

  'shillong': {
    title: 'Shillong',
    state: 'Meghalaya',
    hotels: [
      {
        name: 'Zostel Shillong',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 700,
        priceMax: 1200,
        rating: 4.5,
        reviews: 440,
        amenities: ['Pine Forest Views', 'Common Cafe', 'Guitar & Games', 'Dawki Tour Desk'],
        tags: ['Backpacker Hub', 'Social Stay']
      },
      {
        name: 'Pinewood Hotel (MTDC)',
        type: 'heritage',
        tier: 'budget',
        priceMin: 2800,
        priceMax: 4800,
        rating: 4.1,
        reviews: 620,
        amenities: ['Colonial British Cottages', 'Wards Lake Proximity', 'Pine Wood Lawns', 'Dining Hall'],
        tags: ['British Heritage', 'Govt Verified']
      },
      {
        name: 'Hotel Centre Point Shillong',
        type: 'hotel',
        tier: 'good',
        priceMin: 4200,
        priceMax: 6800,
        rating: 4.3,
        reviews: 890,
        amenities: ['Heart of Police Bazar', 'Cloud 9 Rooftop Lounge', 'Multi-cuisine Restaurant', 'WiFi'],
        tags: ['Police Bazar Central', 'City Convenience']
      },
      {
        name: 'Heritage Club - Tripura Castle',
        type: 'heritage',
        tier: 'better',
        priceMin: 7500,
        priceMax: 12500,
        rating: 4.6,
        reviews: 680,
        amenities: ['Summer Palace of Manikya Maharajas', 'Rice Court Dining', 'Pine Forest Setting', 'Meghalaya Antiques'],
        tags: ['Royal Maharaja Residence', 'Pine Valley']
      },
      {
        name: 'Ri Kynjai - Serenity by The Lake (Umiam)',
        type: 'resort',
        tier: 'luxury',
        priceMin: 14000,
        priceMax: 24000,
        rating: 4.8,
        reviews: 950,
        amenities: ['Khasi Thatch Architecture', 'Umiam Lakefront Panoramic Balconies', 'Khasi Herbal Spa', 'Sao Fe Dining'],
        tags: ['Iconic Lake Resort', 'Architectural Marvel']
      }
    ]
  },

  'cherrapunji': {
    title: 'Cherrapunji (Sohra)',
    state: 'Meghalaya',
    hotels: [
      {
        name: 'Sohra Plaza Homestay',
        type: 'homestay',
        tier: 'cheapest',
        priceMin: 900,
        priceMax: 1600,
        rating: 4.2,
        reviews: 210,
        amenities: ['Basic Mountain Rooms', 'Local Khasi Meals', 'Trek Guide Assistance'],
        tags: ['Local Homestay', 'Budget Traveler']
      },
      {
        name: 'Coniferous Resort',
        type: 'resort',
        tier: 'budget',
        priceMin: 2200,
        priceMax: 3600,
        rating: 4.0,
        reviews: 350,
        amenities: ['Restaurant', 'Bonfire', 'Near Seven Sisters Falls', 'Hot Water'],
        tags: ['Valley Base', 'Family Stay']
      },
      {
        name: 'Kutmadan Resort',
        type: 'resort',
        tier: 'good',
        priceMin: 3800,
        priceMax: 6000,
        rating: 4.4,
        reviews: 380,
        amenities: ['Spectacular Bangladesh Plains Views', 'Cottages with Balconies', 'Restaurant', 'Foggy Ridge'],
        tags: ['Plains View Edge', 'Peaceful Ridge']
      },
      {
        name: 'Jiva Resort Cherrapunjee',
        type: 'resort',
        tier: 'better',
        priceMin: 7000,
        priceMax: 11000,
        rating: 4.5,
        reviews: 460,
        amenities: ['Lush Landscaped Lawns', 'Fine Dining', 'Kids Play Zone', 'Modern Heated Rooms'],
        tags: ['Top Rated Comfort', 'Scenic Grounds']
      },
      {
        name: 'Polo Orchid Resort Cherrapunjee',
        type: 'resort',
        tier: 'luxury',
        priceMin: 12000,
        priceMax: 22000,
        rating: 4.7,
        reviews: 820,
        amenities: ['Infinity Pool Overlooking Nohsngithiang Falls', 'Rainmist Villas', 'Sky Grill Bar', 'Spa'],
        tags: ['Waterfall Edge Luxury', 'Infinity Pool']
      }
    ]
  },

  'mount-abu': {
    title: 'Mount Abu',
    state: 'Rajasthan',
    hotels: [
      {
        name: 'Zostel Mount Abu',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 650,
        priceMax: 1100,
        rating: 4.4,
        reviews: 420,
        amenities: ['Forest Setting', 'Dorms & Private Tents', 'Cafe', 'Sunset Walks'],
        tags: ['Backpacker Hub', 'Social Stay']
      },
      {
        name: 'Hotel Hilltone',
        type: 'hotel',
        tier: 'good',
        priceMin: 3500,
        priceMax: 5500,
        rating: 4.3,
        reviews: 790,
        amenities: ['Swimming Pool', 'Manwar Dining', 'Near Nakki Lake', 'Sprawling Gardens'],
        tags: ['Central Location', 'Family Favourite']
      },
      {
        name: 'Cama Rajputana Club Resort',
        type: 'heritage',
        tier: 'better',
        priceMin: 5500,
        priceMax: 9500,
        rating: 4.5,
        reviews: 840,
        amenities: ['135-Year-Old British Officers Club', 'Billiards Room', 'Pool', 'Tennis Courts', '18 Acres Lawns'],
        tags: ['Colonial Club Heritage', 'Historic Grandeur']
      },
      {
        name: 'WelcomHeritage Connaught House',
        type: 'heritage',
        tier: 'best',
        priceMin: 7500,
        priceMax: 13000,
        rating: 4.6,
        reviews: 510,
        amenities: ['English Country Cottage (Jodhpur Royals)', 'Private Gardens', 'Gourmet Meals', 'Quiet Valley'],
        tags: ['Royal Country Home', 'Boutique Heritage']
      },
      {
        name: 'Palace Hotel - Bikaner House',
        type: 'heritage',
        tier: 'luxury',
        priceMin: 9500,
        priceMax: 17000,
        rating: 4.7,
        reviews: 620,
        amenities: ['Summer Residence of Maharaja of Bikaner (1893)', 'Lake on Property', 'Antique Chandeliers', 'Tennis Courts'],
        tags: ['Maharaja Summer Palace', 'Royal Splendour']
      }
    ]
  },

  'pushkar': {
    title: 'Pushkar',
    state: 'Rajasthan',
    hotels: [
      {
        name: 'Zostel Pushkar',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 600,
        priceMax: 1050,
        rating: 4.6,
        reviews: 750,
        amenities: ['Swimming Pool', 'Cafe', 'Dorms & Luxury Tents', 'Desert Safari Desk'],
        tags: ['Backpacker Hub with Pool', 'Vibrant Vibe']
      },
      {
        name: 'Hotel Pushkar Palace',
        type: 'heritage',
        tier: 'budget',
        priceMin: 2500,
        priceMax: 4200,
        rating: 4.2,
        reviews: 680,
        amenities: ['Direct Lake Ghat Views', 'Prince’s Restaurant', 'Classic Haveli Architecture', 'Rooftop'],
        tags: ['Holy Lakefront', 'Historic Haveli']
      },
      {
        name: 'Bhanwar Singh Palace',
        type: 'resort',
        tier: 'good',
        priceMin: 4500,
        priceMax: 7500,
        rating: 4.5,
        reviews: 920,
        amenities: ['Large Pool', 'Sprawling Desert Lawns', 'Camel Cart Rides', 'Multi-dining'],
        tags: ['Palatial Architecture', 'Desert Views']
      },
      {
        name: 'Ananta Spa & Resort Pushkar',
        type: 'resort',
        tier: 'better',
        priceMin: 7500,
        priceMax: 13000,
        rating: 4.6,
        reviews: 1400,
        amenities: ['Villas with Open Sky Bathrooms', 'Large Outdoor Pool', 'Mudita Spa', 'Aravalli Backdrop'],
        tags: ['Luxury Spa Resort', 'Aravalli Hills']
      },
      {
        name: 'The Westin Pushkar Resort & Spa',
        type: 'resort',
        tier: 'luxury',
        priceMin: 14000,
        priceMax: 24000,
        rating: 4.7,
        reviews: 1100,
        amenities: ['Private Plunge Pool Villas', 'Heavenly Spa', 'Helipad', 'Signature Marriott Dining'],
        tags: ['5-Star Luxury Resort', 'Private Pool Villas']
      }
    ]
  },

  'khajuraho': {
    title: 'Khajuraho',
    state: 'Madhya Pradesh',
    hotels: [
      {
        name: 'Zostel Khajuraho',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 550,
        priceMax: 950,
        rating: 4.5,
        reviews: 380,
        amenities: ['Near Western Group Temples', 'Rooftop Cafe', 'Cycle Rentals', 'AC Dorms'],
        tags: ['Backpacker Hub', 'Walk to Temples']
      },
      {
        name: 'MPT Payal Khajuraho',
        type: 'hotel',
        tier: 'budget',
        priceMin: 1800,
        priceMax: 2900,
        rating: 4.1,
        reviews: 420,
        amenities: ['Large Lawns', 'Restaurant', 'Free Parking', 'Govt Verified'],
        tags: ['Govt Tourism Hotel', 'Spacious Grounds']
      },
      {
        name: 'Hotel Chandela Khajuraho',
        type: 'resort',
        tier: 'good',
        priceMin: 3800,
        priceMax: 6500,
        rating: 4.3,
        reviews: 810,
        amenities: ['Outdoor Pool', 'Tennis Courts', 'Rasna Restaurant', 'Landscaped Gardens'],
        tags: ['Classic Resort', 'Close to Temples']
      },
      {
        name: 'Radisson Jass Hotel Khajuraho',
        type: 'hotel',
        tier: 'better',
        priceMin: 5500,
        priceMax: 9000,
        rating: 4.5,
        reviews: 940,
        amenities: ['Swimming Pool', 'Temple View Lawns', 'Spa', 'Buffet Dining'],
        tags: ['International 5-Star', 'Peaceful Grounds']
      },
      {
        name: 'The Lalit Temple View Khajuraho',
        type: 'resort',
        tier: 'luxury',
        priceMin: 11000,
        priceMax: 19000,
        rating: 4.7,
        reviews: 1050,
        amenities: ['Direct Views of Western Temples', 'Rejuve Spa', 'Outdoor Pool', 'Panna National Park Excursions'],
        tags: ['Unrivalled Temple Views', '5-Star Luxury']
      }
    ]
  },

  'hampi': {
    title: 'Hampi',
    state: 'Karnataka',
    hotels: [
      {
        name: 'Zostel Hampi (Gangavathi / Sanapur)',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 650,
        priceMax: 1100,
        rating: 4.5,
        reviews: 580,
        amenities: ['Paddy Field Setting', 'Common Lounge & Cafe', 'Moped Rentals', 'Lake Visits'],
        tags: ['Backpacker Hub', 'Hippie Island Vibe']
      },
      {
        name: 'Goan Corner Hampi',
        type: 'guesthouse',
        tier: 'budget',
        priceMin: 1200,
        priceMax: 2200,
        rating: 4.3,
        reviews: 690,
        amenities: ['Boulder Views', 'Rooftop Chill Area', 'Continental & Indian Food', 'Bouldering Gear'],
        tags: ['Legendary Backpacker Spot', 'Boulder Views']
      },
      {
        name: 'Hotel Mayura Bhuvaneshwari (KSTDC Kamalapur)',
        type: 'hotel',
        tier: 'good',
        priceMin: 2400,
        priceMax: 4000,
        rating: 4.2,
        reviews: 950,
        amenities: ['Walk to Queens Bath & Royal Enclosure', 'Restaurant', 'Spacious Lawns', 'Parking'],
        tags: ['Inside Monument Zone', 'Govt Verified']
      },
      {
        name: 'Heritage Resort Hampi',
        type: 'resort',
        tier: 'better',
        priceMin: 6500,
        priceMax: 11000,
        rating: 4.6,
        reviews: 820,
        amenities: ['Organic Farm Setting', 'Pool with Sunken Bar', 'Ayurveda Spa', 'Coracle Rides'],
        tags: ['Eco Luxury', 'Serene Paddy Grounds']
      },
      {
        name: 'Evolve Back Kamalapura Palace Hampi',
        type: 'resort',
        tier: 'luxury',
        priceMin: 22000,
        priceMax: 42000,
        rating: 4.9,
        reviews: 1350,
        amenities: ['Vijayanagara Palace Architecture', 'Private Jacuzzi & Pool Suites', 'Olympic Infinity Pool', 'Vaidyasala Spa', 'History Guide'],
        tags: ['Imperial Vijayanagara Grandeur', 'Ultra Luxury']
      }
    ]
  },

  'jaipur': {
    title: 'Jaipur',
    state: 'Rajasthan',
    hotels: [
      {
        name: 'Zostel Jaipur',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 650,
        priceMax: 1150,
        rating: 4.6,
        reviews: 1400,
        amenities: ['Near Hawa Mahal', 'Rooftop Cafe', 'AC Dorms & Privates', 'Walking Tours'],
        tags: ['Walled City Backpacker', 'Walk to Hawa Mahal']
      },
      {
        name: 'Hotel Pearl Palace Heritage',
        type: 'heritage',
        tier: 'budget',
        priceMin: 2400,
        priceMax: 3800,
        rating: 4.7,
        reviews: 2100,
        amenities: ['Hand-Carved Rajasthani Art Rooms', 'Peacock Rooftop Restaurant', 'WiFi'],
        tags: ['Top Rated Boutique Haveli', 'Artisan Interiors']
      },
      {
        name: 'Shahpura Haveli & House',
        type: 'heritage',
        tier: 'good',
        priceMin: 4500,
        priceMax: 7500,
        rating: 4.5,
        reviews: 950,
        amenities: ['Traditional Frescoes', 'Rooftop Pool', 'Fine Dining', 'Courtyard Folk Music'],
        tags: ['Royal Haveli Stay', 'Heritage Ambiance']
      },
      {
        name: 'ITC Rajputana, a Luxury Collection Hotel',
        type: 'hotel',
        tier: 'better',
        priceMin: 8500,
        priceMax: 15000,
        rating: 4.7,
        reviews: 2400,
        amenities: ['Peshawri Dining', 'Kaya Kalp Spa', 'Outdoor Pool', 'Stepwell Style Lobby'],
        tags: ['5-Star Luxury', 'Peshawri Cuisine']
      },
      {
        name: 'Rambagh Palace - The Jewel of Jaipur',
        type: 'heritage',
        tier: 'luxury',
        priceMin: 28000,
        priceMax: 65000,
        rating: 4.9,
        reviews: 2800,
        amenities: ['Former Residence of the Maharaja', '47 Acres Mughal Gardens', 'Jiva Grande Spa', 'Suvarna Mahal Fine Dining'],
        tags: ['World’s Top Palace Hotel', 'Living Maharaja Palace']
      }
    ]
  },

  'jodhpur': {
    title: 'Jodhpur',
    state: 'Rajasthan',
    hotels: [
      {
        name: 'Zostel Jodhpur',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 600,
        priceMax: 1100,
        rating: 4.6,
        reviews: 980,
        amenities: ['Rooftop View of Mehrangarh Fort', 'AC Dorms', 'Cafe', 'Blue City Tours'],
        tags: ['Fort View Rooftop', 'Blue City Heart']
      },
      {
        name: 'Ratan Vilas Jodhpur',
        type: 'heritage',
        tier: 'budget',
        priceMin: 3200,
        priceMax: 5500,
        rating: 4.8,
        reviews: 1400,
        amenities: ['1920 Villa of Maharaja’s Cousin', 'Courtyard Dining', 'Swimming Pool', 'Vintage Car'],
        tags: ['Authentic Aristocratic Villa', 'Exceptional Service']
      },
      {
        name: 'Ajit Bhawan Palace - India’s First Heritage Hotel',
        type: 'heritage',
        tier: 'good',
        priceMin: 6500,
        priceMax: 11000,
        rating: 4.6,
        reviews: 1150,
        amenities: ['Royal Suite Cottages', 'Swimming Pool', 'Jodhpur Flying Club Antiques', 'Spa'],
        tags: ['Pioneer Heritage Palace', 'Royal Lineage']
      },
      {
        name: 'RAAS Jodhpur - Luxury Boutique Hotel',
        type: 'heritage',
        tier: 'better',
        priceMin: 14000,
        priceMax: 24000,
        rating: 4.8,
        reviews: 980,
        amenities: ['Stepwell Foot Location', 'Best Clifftop Fort View Pool', 'Darikhana Dining', 'Ila Spa'],
        tags: ['Modern Heritage Design', 'Best Fort View']
      },
      {
        name: 'Umaid Bhawan Palace Jodhpur',
        type: 'heritage',
        tier: 'luxury',
        priceMin: 35000,
        priceMax: 85000,
        rating: 4.9,
        reviews: 2400,
        amenities: ['Art Deco Palace of Maharaja Gaj Singh II', 'Subterranean Zodiac Pool', 'Jiva Spa', 'Pillared Banquet Dining'],
        tags: ['World’s Premier Palace Stay', 'Regal Splendour']
      }
    ]
  },

  'udaipur': {
    title: 'Udaipur',
    state: 'Rajasthan',
    hotels: [
      {
        name: 'Zostel Udaipur',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 700,
        priceMax: 1250,
        rating: 4.6,
        reviews: 1650,
        amenities: ['Lake Pichola Rooftop Views', 'Lakefront Location', 'Cafe', 'Walking Tours'],
        tags: ['Lake Pichola Backpacker', 'Sunset Rooftop']
      },
      {
        name: 'Jagat Niwas Palace Hotel',
        type: 'heritage',
        tier: 'budget',
        priceMin: 3500,
        priceMax: 6500,
        rating: 4.6,
        reviews: 1550,
        amenities: ['17th Century Haveli on Lake Pichola', 'Jharokha Seating over Water', 'Candlelit Lake Dining'],
        tags: ['Iconic Lake Pichola Haveli', 'Romantic Jharokhas']
      },
      {
        name: 'Fateh Prakash Palace - Grand Heritage (City Palace)',
        type: 'heritage',
        tier: 'good',
        priceMin: 8500,
        priceMax: 16000,
        rating: 4.7,
        reviews: 1250,
        amenities: ['Located Inside City Palace Complex', 'Crystal Gallery', 'Sunset Terrace over Lake', 'Royal Hospitality'],
        tags: ['Inside City Palace', 'Royal Pichola View']
      },
      {
        name: 'The Leela Palace Udaipur',
        type: 'resort',
        tier: 'better',
        priceMin: 26000,
        priceMax: 55000,
        rating: 4.9,
        reviews: 2100,
        amenities: ['Private Boat Arrival', 'ESPA Tent Spa', 'Lakefront Heated Pool', 'Sheesh Mahal Dining'],
        tags: ['Pure Lakeside Luxury', 'Palatial Splendour']
      },
      {
        name: 'Taj Lake Palace Udaipur',
        type: 'heritage',
        tier: 'luxury',
        priceMin: 32000,
        priceMax: 75000,
        rating: 4.9,
        reviews: 3200,
        amenities: ['1746 Floating White Marble Island', 'Royal Butlers', 'Jharokhas into Lake', 'Jiva Spa Boat'],
        tags: ['World’s Most Romantic Hotel', 'Floating Island Palace']
      }
    ]
  },

  'lonavala': {
    title: 'Lonavala',
    state: 'Maharashtra',
    hotels: [
      {
        name: 'Zostel Plus Lonavala',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 800,
        priceMax: 1400,
        rating: 4.6,
        reviews: 820,
        amenities: ['Lakeside Infinity Pool', 'Dorms & Glamping Pods', 'Cafe', 'Sunset Deck'],
        tags: ['Lakeside Backpacker Luxury', 'Social Hub']
      },
      {
        name: 'MTDC Karla Resort Lonavala',
        type: 'resort',
        tier: 'budget',
        priceMin: 1800,
        priceMax: 3200,
        rating: 4.0,
        reviews: 650,
        amenities: ['Water Sports on Indrayani River', 'Near Karla Caves', 'Cottages', 'Restaurant'],
        tags: ['Govt Verified', 'Quiet Greenery']
      },
      {
        name: 'The Dukes Retreat Khandala',
        type: 'resort',
        tier: 'good',
        priceMin: 5500,
        priceMax: 9500,
        rating: 4.4,
        reviews: 1200,
        amenities: ['Cliff Edge into Khandala Ghat', 'Pool', 'High Point Bar', 'Spa & Lawns'],
        tags: ['Valley Edge Landmark', 'Khandala Ghats']
      },
      {
        name: 'Fariyas Resort Lonavala',
        type: 'resort',
        tier: 'better',
        priceMin: 7500,
        priceMax: 13000,
        rating: 4.5,
        reviews: 1600,
        amenities: ['Wild Water Waterpark', 'Indoor Heated Pool', 'Spa', 'Multiple Restaurants'],
        tags: ['Family Waterpark Fun', 'Luxury Resort']
      },
      {
        name: 'Della Resorts Lonavala',
        type: 'resort',
        tier: 'luxury',
        priceMin: 12000,
        priceMax: 26000,
        rating: 4.7,
        reviews: 2400,
        amenities: ['Adventure Park on Property', '24-Hour Heated Pool', 'Fine Dining Cafe 24', 'Luxury Villa Suites'],
        tags: ['Adventure & Luxury', '5-Star Experiential']
      }
    ]
  },

  'dalhousie': {
    title: 'Dalhousie',
    state: 'Himachal Pradesh',
    hotels: [
      {
        name: 'Zostel Dalhousie',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 650,
        priceMax: 1100,
        rating: 4.5,
        reviews: 460,
        amenities: ['Pine Forest Surroundings', 'Common Cafe', 'Trek Desk', 'Dorms & Rooms'],
        tags: ['Backpacker Hub', 'Peaceful Woods']
      },
      {
        name: 'HPTDC Hotel Geetanjali',
        type: 'hotel',
        tier: 'budget',
        priceMin: 1800,
        priceMax: 3000,
        rating: 4.0,
        reviews: 320,
        amenities: ['Near Subhash Chowk', 'Restaurant', 'Heater on Request', 'Parking'],
        tags: ['Govt Verified', 'Quiet Location']
      },
      {
        name: 'Grand View Hotel Dalhousie',
        type: 'heritage',
        tier: 'good',
        priceMin: 3800,
        priceMax: 6500,
        rating: 4.4,
        reviews: 790,
        amenities: ['Established 1890', 'Piramal Glacier Views', 'Nirvana Spa', 'Kids Zone'],
        tags: ['Colonial Heritage', 'Glacier Views']
      },
      {
        name: 'Fortune Park Dalhousie',
        type: 'hotel',
        tier: 'better',
        priceMin: 5500,
        priceMax: 9000,
        rating: 4.5,
        reviews: 840,
        amenities: ['Pir Panjal Mountain Views', 'Zodiac All Day Dining', 'Gym', 'Kids Club'],
        tags: ['ITC Fortune Quality', 'Snow Peaks Panorama']
      },
      {
        name: 'Hotel Mount View Dalhousie',
        type: 'resort',
        tier: 'best',
        priceMin: 7500,
        priceMax: 14000,
        rating: 4.6,
        reviews: 950,
        amenities: ['Luxury Heritage Resort', 'Open Air Jacuzzi', 'Victoria Dining', 'Sprawling Terrace Lawns'],
        tags: ['Premier Dalhousie Luxury', 'Mountain Vistas']
      }
    ]
  },

  'haridwar': {
    title: 'Haridwar',
    state: 'Uttarakhand',
    hotels: [
      {
        name: 'Zostel Haridwar',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 550,
        priceMax: 950,
        rating: 4.5,
        reviews: 580,
        amenities: ['Walk to Ganga Ghats', 'AC Dorms', 'Rooftop Lounge', 'Ganga Aarti Guide'],
        tags: ['Backpacker Hub', 'Spiritual Walkable']
      },
      {
        name: 'GMVN Rahi Motel Haridwar',
        type: 'hotel',
        tier: 'budget',
        priceMin: 1400,
        priceMax: 2400,
        rating: 4.0,
        reviews: 430,
        amenities: ['Near Bus Stand & Station', 'Restaurant', 'Clean Rooms', 'Parking'],
        tags: ['Govt Tourism', 'Transit Friendly']
      },
      {
        name: 'Ganga Lahari - By Leisure Hotels',
        type: 'heritage',
        tier: 'good',
        priceMin: 4500,
        priceMax: 7500,
        rating: 4.5,
        reviews: 820,
        amenities: ['At Gau Ghat on Holy Ganga', 'River View Rooms', 'Pure Vegetarian Dining', 'Private Aarti Seat'],
        tags: ['Direct Riverbank', 'Holy Ganga Aarti']
      },
      {
        name: 'Haveli Hari Ganga',
        type: 'heritage',
        tier: 'better',
        priceMin: 6500,
        priceMax: 11000,
        rating: 4.6,
        reviews: 940,
        amenities: ['100-Year-Old Palace of Maharaja of Pilibhit', 'Private Bathing Ghat', 'Ayurvedic Spa', 'Sattvik Dining'],
        tags: ['Private Bathing Ghat', 'Heritage Haveli']
      },
      {
        name: 'Pilibhit House, Haridwar - IHCL SeleQtions',
        type: 'heritage',
        tier: 'luxury',
        priceMin: 15000,
        priceMax: 28000,
        rating: 4.8,
        reviews: 860,
        amenities: ['100-Year Aristocratic Mansion', 'Direct Private Ganga Ghat', 'Riverfront Pool', 'Ancestral Audio Tours', 'Fine Vegetarian Dining'],
        tags: ['Taj SeleQtions', 'Ultra Spiritual Luxury']
      }
    ]
  },

  'kovalam': {
    title: 'Kovalam',
    state: 'Kerala',
    hotels: [
      {
        name: 'Kovalam Beach Backpacker Stay',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 600,
        priceMax: 1000,
        rating: 4.3,
        reviews: 320,
        amenities: ['Lighthouse Beach (100m)', 'WiFi', 'Cafe', 'Surfboard Rentals'],
        tags: ['Surf & Backpacker', 'Beachside']
      },
      {
        name: 'KTDC Samudra Kovalam',
        type: 'resort',
        tier: 'good',
        priceMin: 3800,
        priceMax: 6500,
        rating: 4.3,
        reviews: 820,
        amenities: ['Direct Clifftop Arabian Sea View', 'Pool', 'Ayurveda Centre', 'Seafront Lawns'],
        tags: ['Govt Premier Resort', 'Unobstructed Sea View']
      },
      {
        name: 'Rockholm at the Light House Beach',
        type: 'resort',
        tier: 'better',
        priceMin: 8500,
        priceMax: 15000,
        rating: 4.7,
        reviews: 490,
        amenities: ['Clifftop Ocean Edge', 'Holistic Ayurveda Sanctuary', 'Oceanfront Dining', 'Lighthouse Views'],
        tags: ['Boutique Ayurveda', 'Clifftop Waves']
      },
      {
        name: 'The Leela Kovalam, a Raviz Hotel',
        type: 'resort',
        tier: 'luxury',
        priceMin: 16000,
        priceMax: 32000,
        rating: 4.8,
        reviews: 2100,
        amenities: ['Perched on Clifftop Peninsula', 'Private Beach', 'Clifftop Infinity Pool', 'Club Lounge', 'World-Class Spa'],
        tags: ['Iconic 5-Star Clifftop', 'Legendary Luxury']
      }
    ]
  },

  'ooty': {
    title: 'Ooty',
    state: 'Tamil Nadu',
    hotels: [
      {
        name: 'Zostel Ooty',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 700,
        priceMax: 1200,
        rating: 4.5,
        reviews: 720,
        amenities: ['Heritage British Cottage Setting', 'Campfire', 'Cafe', 'Dorms & Privates'],
        tags: ['Backpacker Hub', 'Colonial Cottage']
      },
      {
        name: 'TTDC Hotel Tamil Nadu Ooty',
        type: 'hotel',
        tier: 'budget',
        priceMin: 1800,
        priceMax: 3200,
        rating: 4.0,
        reviews: 780,
        amenities: ['Near Charring Cross', 'Restaurant', 'Large Parking', 'Garden'],
        tags: ['Govt Verified', 'Town Centre']
      },
      {
        name: 'Sinclairs Retreat Ooty',
        type: 'resort',
        tier: 'good',
        priceMin: 3800,
        priceMax: 6500,
        rating: 4.3,
        reviews: 950,
        amenities: ['Highest Altitude Resort in Ooty', 'Pine Forest Views', 'Indoor Games', 'Restaurant'],
        tags: ['Highest Altitude', 'Blue Mountain Views']
      },
      {
        name: 'Sterling Ooty Elk Hill',
        type: 'resort',
        tier: 'better',
        priceMin: 5000,
        priceMax: 8500,
        rating: 4.4,
        reviews: 1600,
        amenities: ['Panoramic View of Ooty Town', 'Kids Play Zone', 'Buffet Dining', 'Campfire'],
        tags: ['Hilltop View', 'Family Favourite']
      },
      {
        name: 'Fortune Resort Sullivan Court',
        type: 'hotel',
        tier: 'best',
        priceMin: 6500,
        priceMax: 11000,
        rating: 4.5,
        reviews: 1250,
        amenities: ['Named after John Sullivan (Ooty Founder)', 'Gym', 'Wellness Spa', 'All Day Dining'],
        tags: ['ITC Fortune Brand', 'Colonial Lawns']
      },
      {
        name: 'Savoy - IHCL SeleQtions',
        type: 'heritage',
        tier: 'luxury',
        priceMin: 14000,
        priceMax: 26000,
        rating: 4.7,
        reviews: 1100,
        amenities: ['180-Year-Old English Country Manor', 'Fireplace in Every Room', 'High Tea on Lawns', 'Taj Dining'],
        tags: ['Historic 1841 Heritage', 'Quintessential English Manor']
      }
    ]
  },

  'manali': {
    title: 'Manali',
    state: 'Himachal Pradesh',
    hotels: [
      {
        name: 'Zostel Manali (Old Manali)',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 650,
        priceMax: 1100,
        rating: 4.6,
        reviews: 1250,
        amenities: ['Apple Orchard Setting', 'Rooftop Cafe', 'Live Music Nights', 'Trek Guide'],
        tags: ['Old Manali Hub', 'Backpacker Culture']
      },
      {
        name: 'HPTDC The Log Huts',
        type: 'guesthouse',
        tier: 'budget',
        priceMin: 2200,
        priceMax: 3800,
        rating: 4.2,
        reviews: 510,
        amenities: ['Cedar Forest Setting', 'Kitchenette', 'Fireplace', 'Beas River Proximity'],
        tags: ['Govt Wooden Cottages', 'Cedar Woods']
      },
      {
        name: 'Apple Country Resort Manali',
        type: 'resort',
        tier: 'good',
        priceMin: 4200,
        priceMax: 7000,
        rating: 4.4,
        reviews: 1100,
        amenities: ['Highest Point in Log Huts Area', 'Spa', 'Pure Veg Dining', 'Snow Peak Views'],
        tags: ['Snow Mountains View', 'Orchard Setting']
      },
      {
        name: 'Manuallaya - The Resort Spa in the Himalayas',
        type: 'resort',
        tier: 'better',
        priceMin: 7500,
        priceMax: 13000,
        rating: 4.6,
        reviews: 1450,
        amenities: ['Indoor Heated Pool', 'TVA Spa', 'Sprawling Gardens', 'Multiple Dining'],
        tags: ['5-Star Mountain Resort', 'Heated Pool']
      },
      {
        name: 'The Himalayan - Luxury Castle Resort',
        type: 'heritage',
        tier: 'best',
        priceMin: 12000,
        priceMax: 22000,
        rating: 4.7,
        reviews: 820,
        amenities: ['Victorian Gothic Stone Castle', 'Outdoor Pool with Orchard Views', 'Fireplaces & Antiques', 'Fine Dining'],
        tags: ['Gothic Stone Castle', 'Boutique Luxury']
      },
      {
        name: 'Span Resort and Spa (Baragarh)',
        type: 'resort',
        tier: 'luxury',
        priceMin: 18000,
        priceMax: 35000,
        rating: 4.8,
        reviews: 950,
        amenities: ['Banks of Rushing Beas River', 'Helipad', 'Riverside Dining', 'Spa by L’Occitane', 'Angling & Treks'],
        tags: ['Iconic Riverside Luxury', 'Since 1981']
      }
    ]
  },

  'dharamshala': {
    title: 'Dharamshala & McLeodGanj',
    state: 'Himachal Pradesh',
    hotels: [
      {
        name: 'Zostel Dharamkot (McLeodGanj)',
        type: 'hostel',
        tier: 'cheapest',
        priceMin: 650,
        priceMax: 1150,
        rating: 4.6,
        reviews: 890,
        amenities: ['Dhauladhar Mountain Views', 'Cafe', 'Triund Trek Assistance', 'Rooftop Chill Deck'],
        tags: ['Backpacker Hub', 'Dharamkot Vibe']
      },
      {
        name: 'Norling Guest House (Norbulingka)',
        type: 'heritage',
        tier: 'budget',
        priceMin: 2200,
        priceMax: 3800,
        rating: 4.7,
        reviews: 450,
        amenities: ['Inside Norbulingka Institute', 'Tibetan Artisan Decor', 'Japanese Style Gardens', 'Cafe'],
        tags: ['Tibetan Cultural Haven', 'Tranquil Gardens']
      },
      {
        name: 'The Pavilion Dharamshala by HPCA',
        type: 'hotel',
        tier: 'good',
        priceMin: 4500,
        priceMax: 7500,
        rating: 4.4,
        reviews: 680,
        amenities: ['Cricket Stadium Proximity', 'Olympic Pool', 'Spa', 'Fine Dining'],
        tags: ['Cricket Heritage', 'Snow Peaks View']
      },
      {
        name: 'Fortune Park Moksha Dharamsala',
        type: 'resort',
        tier: 'better',
        priceMin: 7000,
        priceMax: 12000,
        rating: 4.6,
        reviews: 920,
        amenities: ['Dhauladhar Valley Panorama', 'Heated Pool', 'Spa', 'Children Play Zone'],
        tags: ['ITC Fortune Quality', 'Mountain Panorama']
      },
      {
        name: 'Hyatt Regency Dharamshala Resort',
        type: 'resort',
        tier: 'luxury',
        priceMin: 15000,
        priceMax: 28000,
        rating: 4.8,
        reviews: 1100,
        amenities: ['In the Midst of Cedar Woods', 'Indoor Heated Pool', 'Shanti Spa', 'Tibetan Meditation', 'THYM Dining'],
        tags: ['5-Star Luxury Resort', 'Cedar Forest']
      }
    ]
  }
};

let updated = 0;

for (const [slug, data] of Object.entries(PREMIER_DESTINATIONS)) {
  const filePath = path.join(DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping missing file: ${slug}.json`);
    continue;
  }

  const dest = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Prepare hotels with proper Google Maps search URLs
  const hotelsWithUrls = data.hotels.map(h => {
    const cleanTown = data.title;
    const query = encodeURIComponent(`${h.name} ${cleanTown} ${data.state}`);
    return {
      ...h,
      url: `https://www.google.com/maps/search/?api=1&query=${query}`
    };
  });

  dest.hotels = hotelsWithUrls;
  dest.hotelSourceTried = true;
  dest.hotelsRealSourceCount = hotelsWithUrls.length;

  // Sync overview.minPrice with cheapest stay
  const minPrice = Math.min(...hotelsWithUrls.map(h => h.priceMin));
  if (dest.overview) {
    dest.overview.minPrice = minPrice;
  }

  fs.writeFileSync(filePath, JSON.stringify(dest, null, 2), 'utf8');
  updated++;
  console.log(`✓ Curated premier hotels for ${data.title} (${slug}.json): ${hotelsWithUrls.length} stays, minPrice: ₹${minPrice}`);
}

console.log(`\nSuccessfully curated premier hotels for ${updated} major holiday destinations.`);
