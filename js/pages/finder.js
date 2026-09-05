/**
 * finder.js — page logic for ai-finder.html (AI Trip Finder / universal search).
 * Fully local & keyless: a vanilla-JS parser turns free text into structured
 * intent, then scores all destinations. Loads the lightweight manifest plus
 * data/search-index.json (precomputed haystack + place/hotel names per
 * destination) — never the full destination JSONs.
 */
import { fetchIndex, fetchSearchIndex, fetchDestination } from '../data/api.js';
import { initLayout } from '../components/layout.js';
import { destUrl, cardImg } from '../components/destinationCard.js';
import { applySEO, injectJsonLd, breadcrumbJsonLd } from '../components/seo.js';
import { esc, inr, typeLabel } from '../utils/format.js';
import { MONTH_PICKS } from '../data/taxonomy.js';
import { icon } from '../components/icons.js';

initLayout({ active: 'finder' });

applySEO({
  title: 'AI Trip Finder — ExploreDesh',
  description: 'Describe your ideal trip in plain English and let the AI Trip Finder match you to the perfect Indian destinations — by type, budget, month, region and vibe. No signup, works instantly.',
  canonicalPath: 'ai-finder.html',
  keywords: ['ai trip planner india', 'india trip finder', 'where to travel in india', 'india destination search'],
});
injectJsonLd(breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'AI Trip Finder', path: 'ai-finder.html' },
]));

const [idx, searchIdx] = await Promise.all([fetchIndex(), fetchSearchIndex()]);
const SUMMARIES = idx.destinations;
const { types: DESTINATION_TYPES, states: INDIA_STATES, months: MONTHS } = idx.meta;
const SEARCH = new Map(searchIdx.entries.map((e) => [e.slug, e]));
const bySlug = new Map(SUMMARIES.map((d) => [d.slug, d]));

let currentUserCoords = null;

function monthNameOf(n) { const m = MONTHS.find((x) => x.num === n); return m ? m.name : ''; }
function inList(v, arr) { return arr.indexOf(v) >= 0; }
function entryOf(d) { return SEARCH.get(d.slug) || { placeNames: [], hotelNames: [], tiers: [], hotelMinPrices: [], hay: '' }; }

// ─── Vocabulary ─────────────────────────────────────────
const TYPE_KEYWORDS = {
  beach: ['beach', 'beaches', 'sea ', 'seaside', 'coast', 'coastal', 'ocean', 'sand', 'shore', 'island', 'sun and sand'],
  hill_station: ['hill', 'hills', 'hill station', 'mountain', 'mountains', 'snow', 'snowfall', 'valley', 'alpine', 'cold', 'cool weather', 'misty', 'scenic'],
  heritage: ['heritage', 'historic', 'historical', 'history', 'fort', 'forts', 'palace', 'palaces', 'monument', 'monuments', 'architecture', 'cultural', 'culture', 'old city', 'ruins', 'museum'],
  wildlife: ['wildlife', 'safari', 'tiger', 'tigers', 'national park', 'jungle', 'forest', 'sanctuary', 'bird', 'birds', 'birding', 'elephant', 'leopard', 'animals'],
  spiritual: ['spiritual', 'temple', 'temples', 'pilgrimage', 'holy', 'sacred', 'religious', 'meditation', 'yoga', 'ashram', 'ghat', 'ghats', 'divine', 'monastery'],
  adventure: ['adventure', 'trek', 'trekking', 'hike', 'hiking', 'rafting', 'ski', 'skiing', 'camping', 'paraglid', 'climbing', 'thrill', 'biking', 'rappel', 'bungee'],
};

const MONTH_WORDS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
};
const SEASONS = { summer: [4, 5, 6], winter: [12, 1, 2], monsoon: [7, 8, 9], rainy: [7, 8, 9], rains: [7, 8, 9], spring: [3, 4], autumn: [10, 11], fall: [10, 11] };

// Directional / macro-region words → candidate states (filtered to real INDIA_STATES).
const DIRECTION_STATES = {
  south: ['Kerala', 'Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Puducherry'],
  north: ['Uttarakhand', 'Uttar Pradesh', 'Himachal Pradesh', 'Jammu & Kashmir', 'Ladakh', 'Rajasthan', 'Delhi'],
  east: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'],
  west: ['Goa', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Daman & Diu'],
  central: ['Madhya Pradesh', 'Chhattisgarh'],
  northeast: ['Assam', 'Meghalaya', 'Nagaland', 'Arunachal Pradesh', 'Sikkim', 'Manipur', 'Mizoram', 'Tripura'],
  himalaya: ['Himachal Pradesh', 'Uttarakhand', 'Jammu & Kashmir', 'Ladakh', 'Sikkim', 'Arunachal Pradesh'],
  coastal: ['Goa', 'Kerala', 'Tamil Nadu', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Odisha', 'West Bengal', 'Gujarat', 'Puducherry', 'Daman & Diu'],
};
const STATE_ALIASES = { 'kashmir': 'Jammu & Kashmir', 'j&k': 'Jammu & Kashmir', 'ladakh': 'Ladakh', 'pondicherry': 'Puducherry' };

const VIBES = ['romantic', 'honeymoon', 'couple', 'couples', 'family', 'families', 'kids', 'children', 'friends', 'solo',
  'peaceful', 'quiet', 'serene', 'calm', 'relaxing', 'relax', 'offbeat', 'hidden', 'secluded', 'party', 'nightlife',
  'waterfall', 'waterfalls', 'lake', 'lakes', 'river', 'desert', 'backwater', 'backwaters', 'tea', 'plantation',
  'snow', 'trek', 'wildlife', 'safari', 'sunset', 'sunrise', 'photography', 'food', 'foodie', 'shopping', 'yoga',
  'meditation', 'fort', 'palace', 'temple', 'monastery', 'camping', 'skiing', 'rafting', 'nature', 'greenery',
  'pool', 'spa', 'wifi', 'pet', 'pool villa', 'houseboat', 'homestay', 'resort', 'campsite'];

// User-language vibes that (almost) never appear literally in the wiki-derived hay —
// e.g. no Wikipedia extract says "honeymoon" — expand to related words that DO exist
// in the data. Each synonym's coverage was measured against data/search-index.json;
// near-universal words (park/spa/village) are deliberately excluded.
const VIBE_SYNONYMS = {
  honeymoon: ['romantic', 'scenic', 'beach', 'hill station', 'lake', 'island', 'sunset', 'houseboat'],
  romantic: ['scenic', 'beach', 'hill station', 'lake', 'island', 'sunset', 'houseboat'],
  couple: ['romantic', 'scenic', 'beach', 'hill station', 'lake', 'sunset'],
  couples: ['romantic', 'scenic', 'beach', 'hill station', 'lake', 'sunset'],
  kids: ['zoo', 'museum', 'garden', 'beach', 'lake'],
  children: ['zoo', 'museum', 'garden', 'beach', 'lake'],
  friends: ['trek', 'beach', 'camping', 'waterfall', 'fort'],
  solo: ['trek', 'monastery', 'homestay', 'cafe'],
  peaceful: ['serene', 'quiet', 'monastery', 'backwater', 'garden', 'lake'],
  calm: ['serene', 'quiet', 'monastery', 'backwater', 'lake'],
  relaxing: ['serene', 'beach', 'backwater', 'resort', 'lake'],
  relax: ['serene', 'beach', 'backwater', 'resort', 'lake'],
  offbeat: ['remote', 'valley', 'viewpoint'],
  hidden: ['remote', 'valley', 'viewpoint'],
  secluded: ['remote', 'valley', 'viewpoint'],
  party: ['nightlife', 'club', 'beach', 'cafe'],
  nightlife: ['party', 'club', 'cafe', 'market'],
  photography: ['scenic', 'sunset', 'sunrise', 'viewpoint', 'valley'],
  foodie: ['food', 'cuisine', 'market', 'cafe'],
  camping: ['campsite', 'trek', 'valley', 'lake'],
  skiing: ['snow'],
  rafting: ['river', 'trek'],
};

// Hotel / stay brands present in the data
const HOTEL_BRANDS = ['taj', 'oberoi', 'jw marriott', 'marriott', 'radisson', 'itc', 'oyo', 'airbnb',
  'club mahindra', 'sterling', 'evolve back', 'ananda', 'brijrama', 'leela', 'hyatt', 'fairmont',
  'w hotel', 'novotel', 'lemon tree', 'fortune', 'vivanta', 'trident'];

// Website info topics — so anyone can search the site itself, not just destinations.
const SITE_INFO = [
  { keys: ['contact', 'email address', 'phone number', 'get in touch', 'reach the team', 'reach you', 'helpline', 'customer support', 'support team'], icon: 'mail', title: 'Contact us', body: 'Reach the ExploreDesh team — send a message and we reply within 1–2 business days.', link: 'contact.html', cta: 'Open contact page' },
  { keys: ['about exploredesh', 'about indiaexplore', 'about the site', 'about us', 'who made', 'who runs', 'who are you', 'your company', 'about you', 'the team'], icon: 'globe', title: 'About ExploreDesh', body: 'A guide to 2,392 destinations across all 36 states & UTs of India.', link: 'about.html', cta: 'About us' },
  { keys: ['privacy', 'cookie', 'my data', 'personal data', 'personal information'], icon: 'shield-check', title: 'Privacy policy', body: 'How ExploreDesh handles your data.', link: 'privacy.html', cta: 'Read privacy policy' },
  { keys: ['terms', 'conditions', 'disclaimer', 'liability'], icon: 'book-open', title: 'Terms & conditions', body: 'The terms of using ExploreDesh.', link: 'terms.html', cta: 'Read terms' },
  { keys: ['weather', 'temperature', 'climate', 'forecast'], icon: 'cloud-rain', title: 'Live weather', body: 'Every destination page shows live, real-time weather for that location.', link: 'destinations.html', cta: 'Browse destinations' },
  { keys: ['how to reach', 'how do i reach', 'how to get to', 'nearest airport', 'nearest railway', 'directions to'], icon: 'compass', title: 'How to reach', body: 'Each destination page has a “Reach” tab with nearest airport/railway, road notes and an interactive map.', link: 'destinations.html', cta: 'Browse destinations' },
  { keys: ['how to book', 'booking', 'reserve a', 'make a reservation', 'book a hotel', 'book a stay'], icon: 'bed', title: 'Stays & booking', body: 'Open any destination and check the “Stays” tab — hotels for every budget with booking links.', link: 'destinations.html', cta: 'Browse destinations' },
  { keys: ['how many destinations', 'how many places', 'total destinations', 'number of destinations', 'how many states'], icon: 'trending-up', title: '2,392 destinations', body: 'ExploreDesh covers 2,392 destinations across all 36 states & union territories.', link: 'destinations.html', cta: 'See all destinations' },
];

// ─── Parser: natural language → structured intent ───────
function parsePrompt(raw) {
  const text = ' ' + String(raw || '').toLowerCase().replace(/[.,;!?]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const out = {
    types: [], months: [], maxPrice: null, budget: false, luxury: false,
    states: [], directions: [], near: null, nearDelhi: false, vibes: [], names: [],
    places: [], brands: [], text: text
  };

  // Direct destination-name match (people often just type a place name)
  SUMMARIES.forEach(function (d) {
    if (text.indexOf(' ' + d.title.toLowerCase() + ' ') >= 0) out.names.push(d.slug);
  });

  // Attraction / place match — search the precomputed place-name index
  SUMMARIES.forEach(function (d) {
    entryOf(d).placeNames.forEach(function (name) {
      if (name && name.length > 3 && text.indexOf(' ' + name.toLowerCase() + ' ') >= 0) out.places.push({ dest: d.slug, name: name });
    });
  });

  // Hotel / stay brand match
  HOTEL_BRANDS.forEach(function (b) { if (text.indexOf(' ' + b) >= 0 && out.brands.indexOf(b) < 0) out.brands.push(b); });

  // Types
  Object.keys(TYPE_KEYWORDS).forEach(function (t) {
    if (TYPE_KEYWORDS[t].some(function (kw) { return text.indexOf(kw) >= 0; })) out.types.push(t);
  });

  // Months (explicit words) — word-boundary match so "may"≠"maybe", "mar"≠"market"
  Object.keys(MONTH_WORDS).forEach(function (w) {
    if (new RegExp('\\b' + w + '\\b').test(text) && out.months.indexOf(MONTH_WORDS[w]) < 0) out.months.push(MONTH_WORDS[w]);
  });
  // Seasons — word-boundary so "waterfall" doesn't trigger "fall" (autumn)
  Object.keys(SEASONS).forEach(function (s) {
    if (new RegExp('\\b' + s + '\\b').test(text)) SEASONS[s].forEach(function (n) { if (out.months.indexOf(n) < 0) out.months.push(n); });
  });
  // "now / this month / currently"
  if (/(right now|this month|currently|these days|nowadays| now )/.test(text)) {
    const cm = new Date().getMonth() + 1;
    if (out.months.indexOf(cm) < 0) out.months.push(cm);
  }

  // Budget & luxury
  if (/\b(luxury|luxurious|premium|5[\s-]?star|five[\s-]?star|high[\s-]?end|lavish|deluxe|posh|opulent)\b/.test(text)) out.luxury = true;
  if (/\b(budget|cheap|cheapest|affordable|economical|low[\s-]?cost|backpack\w*|inexpensive|shoestring)\b/.test(text)) out.budget = true;
  const priceCue = /₹|\brs\b|rupees?|\binr\b|under|below|less than|within|upto|up to|max |per night|\/night|a night|budget|around|about/.test(text);
  const re = /([0-9][0-9,]{1,7})\s*(k|thousand)?/g;
  let m;
  while ((m = re.exec(text))) {
    let n = parseInt(m[1].replace(/,/g, ''), 10);
    if (m[2]) n *= 1000;
    if (isNaN(n)) continue;
    if (m[2] || (priceCue && n >= 300)) out.maxPrice = out.maxPrice == null ? n : Math.min(out.maxPrice, n);
  }

  // States (direct name + aliases)
  INDIA_STATES.forEach(function (s) { if (text.indexOf(s.toLowerCase()) >= 0 && out.states.indexOf(s) < 0) out.states.push(s); });
  Object.keys(STATE_ALIASES).forEach(function (a) {
    if (text.indexOf(a) >= 0) { const s = STATE_ALIASES[a]; if (inList(s, INDIA_STATES) && out.states.indexOf(s) < 0) out.states.push(s); }
  });
  // Directions / macro-regions
  const dirTests = {
    south: 'south', north: 'north', east: ' east', west: ' west', central: 'central',
    northeast: 'north east|northeast|north-east|ne india', himalaya: 'himalaya', coastal: 'coastal|coast'
  };
  Object.keys(dirTests).forEach(function (d) {
    if (new RegExp(dirTests[d]).test(text)) out.directions.push(d);
  });

  // Near <destination> — and a special case for Delhi (not a destination, but every
  // record carries distanceFromDelhi), plus "weekend/day trip" which implies near Delhi.
  const proxCue = /\b(near|nearby|around|close to|closest|next to|beside|from|day trip|weekend)\b/.test(text);
  if (proxCue) {
    SUMMARIES.forEach(function (d) {
      if (text.indexOf(' ' + d.title.toLowerCase() + ' ') >= 0 && (!out.near || d.title.length > out.near.title.length)) out.near = d;
    });
    if (/\b(delhi|ncr|gurgaon|gurugram|noida)\b/.test(text) || /\b(weekend getaway|day trip)\b/.test(text)) out.nearDelhi = true;
  }

  // Vibes / keywords
  VIBES.forEach(function (v) { if (text.indexOf(v) >= 0 && out.vibes.indexOf(v) < 0) out.vibes.push(v); });

  return out;
}

// Expand directions to a state set (only real states)
function directionStates(dirs) {
  const set = {};
  dirs.forEach(function (d) { (DIRECTION_STATES[d] || []).forEach(function (s) { if (inList(s, INDIA_STATES)) set[s] = 1; }); });
  return Object.keys(set);
}

function haversine(a, b) {
  if (!a || !b || a[0] == null || b[0] == null) return null;
  const R = 6371, dLat = (b[0] - a[0]) * Math.PI / 180, dLon = (b[1] - a[1]) * Math.PI / 180;
  const s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Every summary carries lat/lng (baked at build time).
function destCoords(d) { return d.lat != null ? [d.lat, d.lng] : null; }

// ─── Scorer: intent + destination → {score, reasons} ────
function scoreDest(d, p) {
  let score = 0;
  const reasons = [];
  const entry = entryOf(d);
  const hay = entry.hay || '';

  // Type
  if (p.types.length && inList(d.type, p.types)) {
    score += 4;
    const t = DESTINATION_TYPES.find(function (x) { return x.id === d.type; });
    reasons.push((t ? t.icon + ' ' + t.label : d.type));
  }

  // Month
  if (p.months.length) {
    const hit = p.months.filter(function (n) { return d.bestTime.months.indexOf(n) >= 0; });
    if (hit.length) { score += 3; reasons.push('Great in ' + hit.slice(0, 3).map(monthNameOf).join(', ')); }
    else { score -= 1.5; } // in season matters — softly penalise off-season
  }

  // Budget / price ceiling
  if (p.maxPrice != null) {
    const fits = entry.hotelMinPrices.some(function (n) { return n <= p.maxPrice; });
    if (fits || (d.minPrice || 0) <= p.maxPrice) { score += 3; reasons.push('Stays under ₹' + p.maxPrice.toLocaleString()); }
    else { score -= 3; }
  }
  if (p.budget) {
    if ((d.minPrice || 99999) <= 1800) { score += 2; reasons.push('Budget-friendly'); }
  }
  if (p.luxury) {
    if (entry.tiers.indexOf('luxury') >= 0 || entry.tiers.indexOf('extra_luxury') >= 0) { score += 2; reasons.push('Luxury stays'); }
  }

  // State (explicit) — strong signal
  if (p.states.length && inList(d.state, p.states)) { score += 5; reasons.push('In ' + d.state); }

  // Direction / macro-region
  if (p.directions.length) {
    const dirStates = directionStates(p.directions);
    if (inList(d.state, dirStates)) {
      score += 3;
      const lbl = {
        south: 'South India', north: 'North India', east: 'East India', west: 'West India',
        central: 'Central India', northeast: 'Northeast India', himalaya: 'Himalayan', coastal: 'Coastal'
      };
      // find which direction matched for a nice label
      for (let i = 0; i < p.directions.length; i++) {
        if (inList(d.state, DIRECTION_STATES[p.directions[i]] || [])) { reasons.push(lbl[p.directions[i]] || p.directions[i]); break; }
      }
    }
  }

  // Near <destination>
  if (p.near && p.near.slug !== d.slug) {
    if (d.state === p.near.state) { score += 4; reasons.push('Near ' + p.near.title); }
    else if (d.region === p.near.region) { score += 2; reasons.push('Close to ' + p.near.title); }
    else {
      const dist = haversine(destCoords(p.near), destCoords(d));
      if (dist != null && dist <= 250) { score += 3; reasons.push('~' + Math.round(dist) + ' km from ' + p.near.title); }
      else if (dist != null && dist <= 500) { score += 1; }
    }
  }

  // Direct name match — the strongest possible signal
  if (p.names.length) {
    if (p.names.indexOf(d.slug) >= 0) { score += 8; reasons.unshift('Exactly what you searched'); }
    else {
      const rel = p.names.map(function (slug) { return bySlug.get(slug); }).filter(Boolean);
      if (rel.some(function (r) { return r.state === d.state; })) { score += 1.5; if (reasons.indexOf('Nearby in ' + d.state) < 0) reasons.push('Nearby in ' + d.state); }
      else if (rel.some(function (r) { return r.type === d.type; })) { score += 1; }
    }
  }

  // Attraction / place inside this destination — strong, specific signal
  if (p.places.length) {
    const mine = p.places.filter(function (x) { return x.dest === d.slug; });
    if (mine.length) { score += 6; reasons.unshift('Includes ' + mine[0].name); }
  }

  // Hotel / stay brand available at this destination
  if (p.brands.length) {
    let brandHit = null;
    entry.hotelNames.forEach(function (name) {
      const nm = (name || '').toLowerCase();
      p.brands.forEach(function (b) { if (nm.indexOf(b) >= 0 && !brandHit) brandHit = b; });
    });
    if (brandHit) { score += 4; reasons.push(brandHit.replace(/\b\w/g, function (c) { return c.toUpperCase(); }) + ' stay'); }
  }

  // Near Delhi (uses distanceFromDelhi field)
  if (p.nearDelhi) {
    const dd = d.distanceFromDelhi;
    if (dd != null && dd <= 300) { score += 4; reasons.push('~' + dd + ' km from Delhi'); }
    else if (dd != null && dd <= 600) { score += 1.5; reasons.push('Drivable from Delhi'); }
    else { score -= 1.5; }
  }

  // Vibes / keywords
  let vibeHits = 0;
  p.vibes.forEach(function (v) {
    const hit = hay.indexOf(v) >= 0 ||
      (VIBE_SYNONYMS[v] || []).some(function (s) { return hay.indexOf(s) >= 0; });
    if (hit) { vibeHits++; if (vibeHits <= 3) reasons.push(v.charAt(0).toUpperCase() + v.slice(1)); }
  });
  score += Math.min(vibeHits, 4) * 1.2;

  return { score: score, reasons: reasons };
}

// ─── Result card (destination card + "✓ reason" chips) ──
function cardHTML(d, reasons, userCoords, detailedDest) {
  const typeIcon = (DESTINATION_TYPES.find(function (t) { return t.id === d.type; }) || {}).icon || '';
  const slug = encodeURIComponent(d.slug);
  const chips = (reasons || []).slice(0, 5).map(function (r) {
    return '<span class="reason-chip">✓ ' + esc(r) + '</span>';
  }).join(' ');

  let distanceText = (d.distanceFromDelhi || 0) + ' km from Delhi';
  if (userCoords) {
    const userPoint = [userCoords.lat, userCoords.lng];
    const destPoint = destCoords(d);
    if (userPoint && destPoint) {
      const km = Math.round(haversine(userPoint, destPoint));
      if (!isNaN(km)) {
        distanceText = '🚗 ' + km + ' km from you';
      }
    }
  }

  let detailsHTML = '';
  if (detailedDest) {
    const placesList = (detailedDest.topPlaces || []).slice(0, 3).map(function (p) { return esc(p.name); }).join(', ');
    const hotelsList = (detailedDest.hotels || []).slice(0, 3).map(function (h) { return esc(h.name); }).join(', ');
    
    detailsHTML = '<div class="mt-3 pt-3 border-t border-white/10 space-y-1.5 text-left text-xs text-slate-300">' +
      (placesList ? '<div><strong class="text-slate-200">🏞️ Places:</strong> ' + placesList + '</div>' : '') +
      (hotelsList ? '<div><strong class="text-slate-200">🏨 Stays:</strong> ' + hotelsList + '</div>' : '') +
      '</div>';
  }

  return '' +
    '<a href="' + destUrl(d.slug) + '" class="card dest-card block bg-slate-900/80 border border-white/15 backdrop-blur-xl rounded-2xl shadow-xl hover:border-emerald-400/50 transition-all duration-200">' +
      '<div class="dest-card-img-wrap overflow-hidden rounded-t-2xl relative">' +
        '<img src="' + esc(cardImg(d)) + '" alt="' + esc((d.heroImage && d.heroImage.alt) || d.title) + '" class="card-img w-full h-48 object-cover" loading="lazy" referrerpolicy="origin" ' +
             'onerror="this.onerror=null;this.style.display=\'none\';" />' +
        '<div class="dest-card-overlay absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>' +
        '<div class="absolute top-3 right-3"><span class="badge bg-slate-950/70 backdrop-blur-md text-white text-xs border border-white/20 px-2.5 py-1 rounded-full">' + typeIcon + ' ' + esc(typeLabel(d.type)) + '</span></div>' +
        '<div class="absolute bottom-3 left-3 right-3">' +
          '<p class="text-white font-extrabold text-xl leading-tight drop-shadow">' + esc(d.title) + '</p>' +
          '<p class="text-slate-300 text-xs font-medium">' + esc(d.state) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="p-4 sm:p-5">' +
        '<div class="flex items-center justify-between mb-2">' +
          '<div class="flex items-center gap-1.5"><span class="text-amber-400">★</span>' +
            '<span class="font-bold text-sm text-white">' + esc(d.rating) + '</span>' +
            '<span class="text-slate-400 text-xs">(' + inr(d.reviewCount) + ')</span></div>' +
          '<span class="text-xs text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded border border-white/10">' + esc(d.bestTime.label) + '</span>' +
        '</div>' +
        '<p class="text-slate-300 text-xs leading-relaxed line-clamp-2 mb-3">' + esc(d.short) + '</p>' +
        (chips ? '<div class="flex flex-wrap gap-1.5 mb-3">' + chips + '</div>' : '') +
        detailsHTML +
        '<div class="flex items-center justify-between pt-3 border-t border-white/10 mt-3">' +
          '<span class="text-xs text-slate-400">' + distanceText + '</span>' +
          '<div class="flex items-baseline gap-1.5">' +
            '<span class="text-slate-400 text-[11px]">Stay starts from</span>' +
            '<span class="text-sm font-extrabold text-amber-400">₹' + inr(d.minPrice) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</a>';
}

// Human-readable summary of what the parser understood
function understandingHTML(p) {
  const tags = [];
  p.names.forEach(function (slug) { const d = bySlug.get(slug); if (d) tags.push('🔎 ' + d.title); });
  p.places.forEach(function (x) { tags.push('🏞️ ' + x.name); });
  p.brands.forEach(function (b) { tags.push('🏨 ' + b.replace(/\b\w/g, function (c) { return c.toUpperCase(); })); });
  p.types.forEach(function (t) { const o = DESTINATION_TYPES.find(function (x) { return x.id === t; }); tags.push((o ? o.icon + ' ' + o.label : t)); });
  if (p.months.length) tags.push('🗓️ ' + p.months.slice().sort(function (a, b) { return a - b; }).map(monthNameOf).join(', '));
  if (p.maxPrice != null) tags.push('💰 under ₹' + p.maxPrice.toLocaleString());
  if (p.budget) tags.push('💸 budget');
  if (p.luxury) tags.push('👑 luxury');
  p.states.forEach(function (s) { tags.push('📍 ' + s); });
  directionStates(p.directions).length && p.directions.forEach(function (d) { tags.push('🧭 ' + d); });
  if (p.near) tags.push('🎯 near ' + p.near.title);
  if (p.nearDelhi) tags.push('🎯 near Delhi');
  p.vibes.forEach(function (v) { if (p.text.indexOf(v) >= 0 && tags.indexOf('✨ ' + v) < 0) tags.push('✨ ' + v); });
  if (!tags.length) return '';
  return '<div class="bg-slate-900/80 border border-white/15 rounded-xl p-4 backdrop-blur-md shadow-lg">' +
    '<p class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">' +
    '<svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
    'What I understood' +
    '</p>' +
    '<div class="flex flex-wrap gap-2">' + tags.map(function (t) { return '<span class="tag-chip">' + esc(t) + '</span>'; }).join('') + '</div></div>';
}

// Website-info search
function matchSiteInfo(text) {
  return SITE_INFO.filter(function (t) { return t.keys.some(function (k) { return text.indexOf(k) >= 0; }); });
}
function infoCardHTML(t) {
  return '<a href="' + t.link + '" class="flex items-start gap-3.5 bg-slate-900/80 border border-white/15 hover:border-amber-400/60 rounded-xl p-4 backdrop-blur-md shadow-lg hover:shadow-amber-950/40 transition-all duration-200 group">' +
    '<span class="text-amber-400 leading-none p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 inline-flex items-center justify-center">' + icon(t.icon, { size: 22 }) + '</span>' +
    '<span class="min-w-0 flex-1">' +
    '<span class="block font-bold text-white group-hover:text-amber-300 text-base transition-colors">' + esc(t.title) + '</span>' +
    '<span class="block text-sm text-slate-300 mt-1 leading-snug">' + esc(t.body) + '</span>' +
    '<span class="inline-flex items-center gap-1 text-amber-400 text-sm font-semibold mt-2.5 group-hover:translate-x-1 transition-transform">' + esc(t.cta) + ' →</span>' +
    '</span></a>';
}

  // ─── Run a search ───────────────────────────────────────
  const grid = document.getElementById('grid');
  const idle = document.getElementById('idleState');
  const noMatch = document.getElementById('noMatch');
  const understanding = document.getElementById('understanding');
  const siteInfo = document.getElementById('siteInfo');
  const resultsHeader = document.getElementById('resultsHeader');
  const resultsTitle = document.getElementById('resultsTitle');

  function generateItineraryHTML(dest, days, userCoords) {
    const places = dest.topPlaces || [];
    const hotels = dest.hotels || [];
    const hiddenPlace = places[0] ? places[0].name : 'local secret spots';
    const baseItin = dest.itinerary || [];

    let distanceText = '';
    if (userCoords) {
      const userPoint = [userCoords.lat, userCoords.lng];
      const destPoint = dest.weather ? [dest.weather.lat, dest.weather.lng] : null;
      if (userPoint && destPoint) {
        const km = Math.round(haversine(userPoint, destPoint));
        if (!isNaN(km)) {
          distanceText = ' · 🚗 ' + km + ' km from you';
        }
      }
    }

    let html = '<div class="bg-slate-900/85 border border-white/15 rounded-2xl shadow-xl p-6 mb-8 backdrop-blur-xl reveal in-view">' +
      '<div class="flex items-center gap-3.5 border-b border-white/10 pb-4 mb-6">' +
      '<span class="text-3xl p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">📅</span>' +
      '<div>' +
      '<h3 class="text-xl font-bold text-white">' + esc(days) + '-Day Plan for ' + esc(dest.title) + '</h3>' +
      '<p class="text-xs text-amber-400 font-semibold uppercase tracking-wider mt-1">Featuring hidden gem: ' + esc(hiddenPlace) + esc(distanceText) + '</p>' +
      '</div>' +
      '</div>' +
      '<div class="space-y-6">';

    for (let d = 1; d <= days; d++) {
      // If within pre-baked itinerary range, use the pre-baked day data!
      if (d <= baseItin.length) {
        const dayData = baseItin[d - 1];
        const items = dayData.items || [];
        html += '<div class="relative pl-6 border-l-2 border-amber-500/40">' +
          '<div class="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-900 shadow-sm shadow-amber-400"></div>' +
          '<h4 class="text-base font-bold text-white mb-2.5 flex items-center gap-2">' + esc(dayData.title || ('Day ' + d)) + '</h4>' +
          '<div class="space-y-2.5 text-sm text-slate-300">';
        items.forEach(function (it) {
          html += '<p><strong class="text-slate-200">' + esc(it.time) + ':</strong> ' +
            '<span class="text-amber-300 font-semibold">' + esc(it.activity) + '</span>. ' +
            esc(it.note || '') + '</p>';
        });
        // Add stay from hotels list
        const hotel = hotels[d % hotels.length] || hotels[0];
        if (hotel) {
          html += '<p><strong class="text-slate-200">Stay:</strong> Relax at <span class="text-amber-400 font-semibold">' + esc(hotel.name) + '</span> (' + esc(hotel.tier || 'Mid-range') + ' stay, rated ' + esc(hotel.rating) + '⭐).</p>';
        }
        html += '</div></div>';
      } else {
        // Synthesize/extrapolate the day dynamically using places and hotels!
        const p1 = places[(d * 2 - 2) % places.length];
        const p2 = places[(d * 2 - 1) % places.length];
        const hotel = hotels[d % hotels.length] || hotels[0];

        html += '<div class="relative pl-6 border-l-2 border-amber-500/40">' +
          '<div class="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-900 shadow-sm shadow-amber-400"></div>' +
          '<h4 class="text-base font-bold text-white mb-2.5">Day ' + d + ': Deep Dive & Hidden Sights</h4>' +
          '<div class="space-y-2.5 text-sm text-slate-300">' +
          (p1 ? '<p><strong class="text-slate-200">Morning:</strong> Head to <span class="text-amber-300 font-semibold">' + esc(p1.name) + '</span>. ' + esc(p1.description || 'Spend some quiet time exploring the scenic landscape.') + '</p>' : '') +
          (p2 ? '<p><strong class="text-slate-200">Afternoon:</strong> Visit <span class="text-amber-300 font-semibold">' + esc(p2.name) + '</span>. ' + esc(p2.description || 'Enjoy local specialties, photograph local architecture and interact with locals.') + '</p>' : '') +
          (hotel ? '<p><strong class="text-slate-200">Evening & Stay:</strong> Rest and unwind at <span class="text-amber-400 font-semibold">' + esc(hotel.name) + '</span> (' + esc(hotel.tier || 'Mid-range') + ' stay, rated ' + esc(hotel.rating) + '⭐).</p>' : '') +
          '</div>' +
          '</div>';
      }
    }

    html += '</div></div>';
    return html;
  }

  async function run(raw, userCoords) {
    const p = parsePrompt(raw);
    const destIntent = p.types.length || p.months.length || p.maxPrice != null || p.budget || p.luxury ||
      p.states.length || p.directions.length || p.near || p.nearDelhi || p.vibes.length || p.names.length ||
      p.places.length || p.brands.length;

    idle.style.display = 'none';

    // Website-info answers (contact / about / weather / booking …)
    const infos = matchSiteInfo(p.text);
    siteInfo.innerHTML = infos.slice(0, 2).map(infoCardHTML).join('');
    siteInfo.style.display = infos.length ? 'grid' : 'none';

    // Understanding panel
    const uh = understandingHTML(p);
    understanding.innerHTML = uh;
    understanding.style.display = uh ? 'block' : 'none';

    const scored = SUMMARIES.map(function (d) { const r = scoreDest(d, p); return { d: d, s: r.score, reasons: r.reasons }; });

    const matched = scored.filter(function (x) { return x.s > 1.2 && x.reasons.length; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 18);

    // Check if it's an itinerary request
    const clean = raw.toLowerCase();
    const daysMatch = clean.match(/\b([1-9]|1[0-5])\s*days?\b/) || clean.match(/\bday\s*([1-9]|1[0-5])\b/) || clean.match(/\b([1-9]|1[0-5])\s*day\b/);
    const isItineraryRequest = clean.includes('itinerary') || clean.includes('iternary') || clean.includes('plan') || daysMatch;

    if (isItineraryRequest) {
      let days = 5;
      if (daysMatch) {
        days = parseInt(daysMatch[1], 10);
      }
      if (days < 1) days = 1;
      if (days > 15) days = 15;

      // Pick target destination slug
      let slug = '';
      if (p.names.length > 0) {
        slug = p.names[0];
      } else if (matched.length > 0) {
        slug = matched[0].d.slug;
      } else {
        const curatedSlugs = ['spiti', 'kanatal', 'munnar', 'coorg', 'hampi', 'goa', 'manali', 'udaipur', 'ladakh', 'rishikesh', 'darjeeling'];
        slug = curatedSlugs[Math.floor(Math.random() * curatedSlugs.length)];
      }

      // Show simulated loader sequence
      grid.innerHTML = '<div class="col-span-full bg-slate-900/90 border border-amber-500/30 rounded-2xl shadow-xl p-8 text-center text-slate-200 mb-8 backdrop-blur-xl">' +
        '<div class="flex flex-col items-center justify-center gap-3">' +
        '<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>' +
        '<div id="itineraryStatus" class="text-sm font-semibold text-amber-400">🔍 Connecting to database indexes...</div>' +
        '</div></div>';
      scrollToResults();

      const statusEl = document.getElementById('itineraryStatus');
      await new Promise(function (resolve) { setTimeout(resolve, 600); });
      if (statusEl) statusEl.textContent = '📡 Consulting Google maps coordinates & hidden sights...';
      await new Promise(function (resolve) { setTimeout(resolve, 600); });
      if (statusEl) statusEl.textContent = '🤖 Analyzing itinerary structure for ' + days + ' days...';
      await new Promise(function (resolve) { setTimeout(resolve, 400); });

      try {
        const dest = await fetchDestination(slug);
        noMatch.style.display = 'none';
        resultsHeader.style.display = 'flex';
        resultsTitle.textContent = 'Custom AI Itinerary & Matches suggested';

        const itineraryHTML = generateItineraryHTML(dest, days, userCoords);

        const pickedDest = SUMMARIES.find(function (x) { return x.slug === slug; });
        const reasons = ['Matches custom itinerary request'];
        const otherPicks = [];
        if (pickedDest) {
          otherPicks.push({ d: pickedDest, reasons: reasons });
        }
        matched.forEach(function (x) {
          if (x.d.slug !== slug) otherPicks.push(x);
        });

        // Fetch fallback destination details for stays & places list
        const detailPicks = await Promise.all(otherPicks.slice(0, 9).map(function (x) {
          return fetchDestination(x.d.slug).catch(function () { return null; });
        }));

        let gridHTML = '<div class="col-span-full">' + itineraryHTML + '</div>';
        gridHTML += otherPicks.slice(0, 9).map(function (x, i) {
          return cardHTML(x.d, x.reasons, userCoords, x.d.slug === slug ? dest : detailPicks[i]);
        }).join('');
        grid.innerHTML = gridHTML;
      } catch (err) {
        grid.innerHTML = '<div class="col-span-full text-center text-red-600 text-sm py-10">Failed to generate itinerary: ' + esc(err.message || String(err)) + '</div>';
      }
      scrollToResults();
      return;
    }

    if (destIntent && matched.length) {
      const topMatches = matched.slice(0, 9);
      // Fetch top destination details in parallel
      const detailedDests = await Promise.all(topMatches.map(function (x) {
        return fetchDestination(x.d.slug).catch(function () { return null; });
      }));

      noMatch.style.display = 'none';
      resultsHeader.style.display = 'flex';
      resultsTitle.textContent = matched.length + ' great match' + (matched.length > 1 ? 'es' : '') + ' found';
      grid.innerHTML = topMatches.map(function (x, i) {
        return cardHTML(x.d, x.reasons, userCoords, detailedDests[i]);
      }).join('');
    } else if (infos.length) {
      // Site-info-only query (e.g. "contact", "privacy policy") — no destination fallback needed
      noMatch.style.display = 'none';
      resultsHeader.style.display = 'none';
      grid.innerHTML = '';
    } else {
      // Fallback: top-rated picks
      resultsHeader.style.display = 'none';
      noMatch.style.display = 'block';
      const top = SUMMARIES.slice().sort(function (a, b) {
        return (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0);
      }).slice(0, 9);
      const detailedFallback = await Promise.all(top.map(function (d) {
        return fetchDestination(d.slug).catch(function () { return null; });
      }));
      grid.innerHTML = top.map(function (d, i) {
        return cardHTML(d, [], userCoords, detailedFallback[i]);
      }).join('');
    }
    // Scroll results into view
    scrollToResults();
  }

  function scrollToResults() {
    const anchor = document.getElementById('results');
    window.scrollTo({ top: (anchor ? anchor.offsetTop : 0) - 70, behavior: 'smooth' });
  }

  // Render a set of destinations with custom header text + per-card reason chips.
  function renderPicks(headerText, noteHTML, picks) {
    idle.style.display = 'none';
    siteInfo.style.display = 'none';
    noMatch.style.display = 'none';
    understanding.innerHTML = noteHTML || '';
    understanding.style.display = noteHTML ? 'block' : 'none';
    resultsHeader.style.display = 'flex';
    resultsTitle.textContent = headerText;
    grid.innerHTML = picks.map(function (x) { return cardHTML(x.d, x.reasons, null, x.details); }).join('');
    scrollToResults();
  }

  function noteCard(text) {
    return '<div class="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 backdrop-blur-md shadow-lg">' +
      '<span class="text-xl p-1.5 bg-emerald-500/10 rounded-lg">📍</span><span class="text-sm text-slate-200 font-medium">' + esc(text) + '</span></div>';
  }

  // Best destinations to visit THIS month (seasonality only — no location).
  async function bestThisMonth(headerNote) {
    const month = new Date().getMonth() + 1;
    const featured = bySlug.get(MONTH_PICKS[month]);
    const picks = SUMMARIES
      .filter(function (d) { return d.bestTime.months.indexOf(month) >= 0 && (!featured || d.slug !== featured.slug); })
      .sort(function (a, b) { return (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0); })
      .slice(0, featured ? 11 : 12)
      .map(function (d) { return { d: d, reasons: ['Ideal in ' + monthNameOf(month)] }; });
    // Lead with the curated marquee pick for this month.
    if (featured) picks.unshift({ d: featured, reasons: ['⭐ Our pick for ' + monthNameOf(month)] });

    const detailedDests = await Promise.all(picks.map(function (x) {
      return fetchDestination(x.d.slug).catch(function () { return null; });
    }));

    const picksWithDetails = picks.map(function (x, i) {
      x.details = detailedDests[i];
      return x;
    });

    renderPicks('Best places to visit in ' + monthNameOf(month),
      noteCard(headerNote || ('Top-rated destinations that are in season right now (' + monthNameOf(month) + ').')), picksWithDetails);
  }

  // Best destinations NEAR the visitor, weighted toward what's in season this month.
  async function nearMe(lat, lng) {
    const month = new Date().getMonth() + 1;
    const list = SUMMARIES.map(function (d) {
      const dist = haversine([lat, lng], destCoords(d));
      const inSeason = d.bestTime.months.indexOf(month) >= 0;
      return { d: d, dist: dist, inSeason: inSeason };
    }).filter(function (x) { return x.dist != null; });

    // Rank by distance, but an in-season place is worth ~400 km of head start.
    list.sort(function (a, b) { return (a.dist - (a.inSeason ? 400 : 0)) - (b.dist - (b.inSeason ? 400 : 0)); });

    const topList = list.slice(0, 12);
    const detailedDests = await Promise.all(topList.map(function (x) {
      return fetchDestination(x.d.slug).catch(function () { return null; });
    }));

    const picks = topList.map(function (x, i) {
      const reasons = ['~' + Math.round(x.dist) + ' km away'];
      if (x.inSeason) reasons.push('Perfect in ' + monthNameOf(month));
      return { d: x.d, reasons: reasons, details: detailedDests[i] };
    });

    renderPicks('Best trips near you — ' + monthNameOf(month),
      noteCard('Using your location · sorted by distance, favouring places in season this ' + monthNameOf(month) + '.'), picks);
  }

  // Ask the browser for the visitor's location, then show nearby in-season picks.
  function locateMe() {
    const btn = document.getElementById('nearMeBtn');
    if (currentUserCoords) {
      nearMe(currentUserCoords.lat, currentUserCoords.lng);
      return;
    }
    if (window.location.protocol === 'file:') {
      grid.innerHTML = '<div class="col-span-full bg-yellow-50 border border-yellow-200 rounded-2xl shadow-sm p-6 text-center text-yellow-800 mb-8">' +
        '<div class="text-3xl mb-2" aria-hidden="true">⚠️</div>' +
        '<p class="font-bold text-sm">Running via Local File (file://)</p>' +
        '<p class="text-xs mt-1 text-yellow-700">Browser security policies block location prompts on local files. Please open this site over http(s) (e.g. via the local dev server) to use location features.</p>' +
        '</div>';
      return;
    }
    if (!navigator.geolocation) {
      grid.innerHTML = '<div class="col-span-full bg-red-50 border border-red-200 rounded-2xl shadow-sm p-6 text-center text-red-700 mb-8">' +
        '<div class="text-3xl mb-2" aria-hidden="true">❌</div>' +
        '<p class="font-bold text-sm">Location access is required</p>' +
        '<p class="text-xs mt-1 text-red-600">Your browser doesn’t support geolocation. Please try another browser.</p>' +
        '</div>';
      return;
    }
    const original = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '📍 Locating…'; }
    function restore() { if (btn) { btn.disabled = false; btn.innerHTML = original; } }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        restore();
        currentUserCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        nearMe(currentUserCoords.lat, currentUserCoords.lng);
      },
      function (err) {
        restore();
        let advice = 'Please enable location access in your browser to find trips near you.';
        if (err && err.code === 1) {
          advice = 'Location permission was denied or blocked. To prompt again, click the lock/settings icon in the browser address bar, set Location permission to "Allow", and reload.';
        }
        grid.innerHTML = '<div class="col-span-full bg-red-50 border border-red-200 rounded-2xl shadow-sm p-6 text-center text-red-700 mb-8">' +
          '<div class="text-3xl mb-2" aria-hidden="true">🔒</div>' +
          '<p class="font-bold text-sm">Location access is required</p>' +
          '<p class="text-xs mt-1 text-red-600">' + advice + '</p>' +
          '</div>';
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 600000 }
    );
  }

  // Safe wrapper: search directly and attempt geolocation in background without blocking
  async function doSearch(text, skipUrlSync = false) {
    if (!text || !text.trim()) return;

    if (!skipUrlSync) {
      try {
        const targetUrl = window.location.pathname + '?q=' + encodeURIComponent(text.trim());
        window.history.replaceState({ q: text.trim() }, '', targetUrl);
      } catch (_) {}
    }

    if (currentUserCoords) {
      try { await run(text, currentUserCoords); }
      catch (err) {
        idle.style.display = 'none';
        grid.innerHTML = '<div class="col-span-full text-center text-red-600 text-sm py-10">Something went wrong: ' +
          esc(err && err.message ? err.message : String(err)) + '</div>';
        if (window.console) console.error('[ai-finder]', err);
      }
      return;
    }

    // Perform text search directly without mandatory location prompt
    try {
      await run(text, null);
    } catch (err) {
      idle.style.display = 'none';
      grid.innerHTML = '<div class="col-span-full text-center text-red-600 text-sm py-10">Something went wrong: ' +
        esc(err && err.message ? err.message : String(err)) + '</div>';
      if (window.console) console.error('[ai-finder]', err);
    }
  }

  // ─── Wire UI ────────────────────────────────────────────
  const promptEl = document.getElementById('prompt');
  document.getElementById('findBtn').addEventListener('click', function () { doSearch(promptEl.value); });
  promptEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSearch(promptEl.value); }
  });
  Array.prototype.forEach.call(document.querySelectorAll('.ex-chip'), function (b) {
    b.addEventListener('click', function () { promptEl.value = b.getAttribute('data-ex'); doSearch(promptEl.value); });
  });
  document.getElementById('nearMeBtn').addEventListener('click', function () {
    try { locateMe(); } catch (err) { if (window.console) console.error('[ai-finder]', err); bestThisMonth(); }
  });

  window.addEventListener('popstate', function () {
    const query = new URLSearchParams(location.search).get('q');
    if (query) {
      promptEl.value = query;
      doSearch(query, true);
    }
  });

  // Deep link: ai-finder.html?q=...
  const q = new URLSearchParams(location.search).get('q');
  if (q) { promptEl.value = q; doSearch(q, true); }
