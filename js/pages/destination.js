/**
 * destination.js — page logic for destination.html (the ONE reusable detail
 * template for every destination). Resolves the slug from ?slug= (canonical),
 * ?id= or #hash (legacy stubs), loads ONLY that destination's JSON via
 * fetchDestination(slug) plus the light manifest (for similar destinations +
 * price-tier meta), and renders every tab. Leaflet (js/leaflet.js) is a classic
 * script loaded before this module — window.L.
 */
import { fetchDestination, fetchIndex } from '../data/api.js';
import { initLayout } from '../components/layout.js';
import { destUrl, cardImg } from '../components/destinationCard.js';
import { applySEO, injectJsonLd, breadcrumbJsonLd, faqJsonLd, destinationJsonLd } from '../components/seo.js';
import { esc, inr, typeLabel } from '../utils/format.js';

// This page keeps its own breadcrumb navbar + mobile tab bar (Stays/Route);
// only the footer comes from the shared layout component.
initLayout({});

const TIER_ORDER = ['cheapest', 'budget', 'good', 'better', 'best', 'luxury', 'extra_luxury'];
function tierColor(tier) {
  const map = {
    cheapest: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    budget: 'bg-blue-100 text-blue-800 border-blue-200',
    good: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    better: 'bg-violet-100 text-violet-800 border-violet-200',
    best: 'bg-orange-100 text-orange-800 border-orange-200',
    luxury: 'bg-rose-100 text-rose-800 border-rose-200',
    extra_luxury: 'bg-amber-100 text-amber-800 border-amber-200',
  };
  return map[tier] || 'bg-gray-100 text-gray-800 border-gray-200';
}

// Map a WMO weather code to a human label + emoji
function weatherInfo(code) {
  const m = {
    0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
    45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
    51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Dense drizzle', '🌦️'],
    56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'],
    61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
    66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
    71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '🌨️'],
    80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌦️'], 82: ['Violent showers', '⛈️'],
    85: ['Snow showers', '🌨️'], 86: ['Snow showers', '❄️'],
    95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm + hail', '⛈️'], 99: ['Thunderstorm + hail', '⛈️'],
  };
  return m[code] || ['—', '🌡️'];
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }

// ─── Resolve destination ───────────────────────────────
const params = new URLSearchParams(window.location.search);
let rawSlug = params.get('slug') || params.get('id') || window.location.hash.slice(1) || null;
let slug = rawSlug ? String(rawSlug).trim().toLowerCase().replace(/^\/+|\/+$/g, '').replace(/\.html$/i, '').replace(/\.json$/i, '') : null;

// Fallback to recently visited destination if no parameter is provided
if (!slug) {
  slug = localStorage.getItem('indiaexplore_last_destination') || 'kanatal';
}

let dest = null;
let idx = null;
if (slug) {
  try {
    [dest, idx] = await Promise.all([fetchDestination(slug), fetchIndex()]);
    if (dest && dest.slug) {
      localStorage.setItem('indiaexplore_last_destination', dest.slug);
    }
  } catch (e) {
    dest = null;
  }
}

if (!dest) {
  document.getElementById('notFound').style.display = 'flex';
} else {
  main(dest, idx);
}

function main(dest, idx) {
  const PRICE_TIERS = (idx && idx.meta && idx.meta.priceTiers) ? idx.meta.priceTiers : {
    cheapest: { label: 'Cheapest', range: '₹0 – ₹800' },
    budget: { label: 'Budget', range: '₹800 – ₹2,000' },
    good: { label: 'Good', range: '₹2,000 – ₹4,000' },
    better: { label: 'Better', range: '₹4,000 – ₹7,000' },
    best: { label: 'Best', range: '₹7,000 – ₹12,000' },
    luxury: { label: 'Luxury', range: '₹12,000 – ₹25,000' },
    extra_luxury: { label: 'Ultra Luxury', range: '₹25,000+' },
  };
  const DESTINATION_TYPES = (idx && idx.meta && idx.meta.types) ? idx.meta.types : [
    { id: 'heritage', label: 'Heritage', icon: '🏛️' },
    { id: 'city', label: 'City', icon: '🏙️' },
    { id: 'lakes', label: 'Lakes', icon: '🏞️' },
    { id: 'spiritual', label: 'Spiritual', icon: '🕌' },
    { id: 'hill_station', label: 'Hill Stations', icon: '🏔️' },
    { id: 'beach', label: 'Beaches', icon: '🏖️' },
    { id: 'wildlife', label: 'Wildlife', icon: '🐯' },
    { id: 'adventure', label: 'Adventure', icon: '⛺' },
  ];

  // Resolve heroImage regardless of whether it's a string URL or {src,alt} object
  const heroSrc = typeof dest.heroImage === 'string' ? dest.heroImage
    : (dest.heroImage && dest.heroImage.src ? dest.heroImage.src
      : (dest.image && dest.image.src ? dest.image.src
        : (dest.gallery && dest.gallery[0] ? (typeof dest.gallery[0] === 'string' ? dest.gallery[0] : dest.gallery[0].src) : '')));
  const heroAlt = typeof dest.heroImage === 'object' && dest.heroImage
    ? (dest.heroImage.alt || dest.title) : dest.title;

  // Build a safe seo object even when dest.seo is missing
  const seoObj = dest.seo || {
    title: (dest.title || 'Destination') + ' Travel Guide 2026 — Places, Hotels | IndiaExplore',
    description: dest.short || dest.description || 'Explore top places to visit and best hotels.',
    canonical: 'destination.html?slug=' + encodeURIComponent(dest.slug || ''),
    ogImage: heroSrc,
    keywords: [dest.title || '', dest.state || '', dest.type || ''].filter(Boolean),
  };

  const ov = dest.overview || { about: dest.description || dest.short || '' };
  const reach = dest.howToReach || dest.reachability || {};
  const coords = (dest.weather && dest.weather.lat != null)
    ? [dest.weather.lat, dest.weather.lng]
    : (dest.coordinates ? [dest.coordinates.lat, dest.coordinates.lng] : null);
  const places = dest.topPlaces || [];
  const hotels = dest.hotels || [];

  // ─── SEO ───────────────────────────────────────────────
  applySEO({
    title: seoObj.title,
    description: seoObj.description,
    canonicalPath: seoObj.canonical,
    ogImage: seoObj.ogImage,
    keywords: seoObj.keywords,
    type: 'article',
  });
  injectJsonLd(destinationJsonLd(dest));
  if (dest.faq) injectJsonLd(faqJsonLd(dest.faq));
  injectJsonLd(breadcrumbJsonLd([
    { name: 'Home', path: 'index.html' },
    { name: 'Destinations', path: 'destinations.html' },
    { name: dest.title, path: seoObj.canonical },
  ]));

  const mainEl = document.getElementById('main') || document.getElementById('content');
  if (mainEl) mainEl.style.display = 'block';
  const notFoundEl = document.getElementById('notFound');
  if (notFoundEl) notFoundEl.style.display = 'none';
  const crumbEl = document.getElementById('crumbName');
  if (crumbEl) crumbEl.textContent = dest.title;

  // ─── Dynamic per-destination fixed background ────────────
  const immBg = document.querySelector('.dest-immersive-bg');
  if (immBg && heroSrc) {
    immBg.style.backgroundImage = "url('" + heroSrc.replace(/'/g, "\\'") + "')";
  }

  // ─── Hero ───────────────────────────────────────────────
  const heroImg = document.getElementById('heroImg');
  if (heroImg) {
    if (heroSrc) {
      heroImg.src = heroSrc;
      heroImg.alt = heroAlt;
      heroImg.style.display = 'block';
    } else {
      heroImg.removeAttribute('src');
      heroImg.hidden = true;
    }
    heroImg.onerror = function () { this.onerror = null; };
  }
  const typeObj = DESTINATION_TYPES.find(function (t) { return t.id === dest.type; }) || {};
  const heroType = document.getElementById('heroType');
  if (heroType) {
    heroType.href = 'destinations.html?type=' + dest.type;
    heroType.textContent = (typeObj.icon || '') + ' ' + typeLabel(dest.type);
  }
  const heroBadgeEl = document.getElementById('heroBadge');
  if (heroBadgeEl) heroBadgeEl.textContent = dest.badge || typeLabel(dest.type);
  const heroTitleEl = document.getElementById('heroTitle');
  if (heroTitleEl) heroTitleEl.textContent = dest.title;
  const heroTaglineEl = document.getElementById('heroTagline');
  if (heroTaglineEl) heroTaglineEl.textContent = dest.tagline || dest.short || '';


  // ─── Stats bar ──────────────────────────────────────────
  let stats = '';
  if (ov && ov.altitude) stats += '<div class="flex items-center gap-2"><span>🏔️</span><span class="text-gray-300">Altitude:</span><span class="font-semibold">' + inr(ov.altitude) + 'm</span></div>';
  const bestLabel = (dest.bestTime && dest.bestTime.label) ? dest.bestTime.label : 'Oct – Mar';
  stats += '<div class="flex items-center gap-2"><span>📅</span><span class="text-gray-300">Best Time:</span><span class="font-semibold">' + esc(bestLabel) + '</span></div>';
  const tempSummer = (dest.weather && dest.weather.tempSummer) ? dest.weather.tempSummer : '25°C – 40°C';
  const tempWinter = (dest.weather && dest.weather.tempWinter) ? dest.weather.tempWinter : '5°C – 20°C';
  stats += '<div class="flex items-center gap-2"><span>🌡️</span><span class="text-gray-300">Summer:</span><span class="font-semibold">' + esc(tempSummer) + '</span></div>';
  stats += '<div class="flex items-center gap-2"><span>❄️</span><span class="text-gray-300">Winter:</span><span class="font-semibold">' + esc(tempWinter) + '</span></div>';
  if (ov && !dest.hideRating && !ov.hideRating && dest.slug !== 'ladakh' && ov.rating) {
    stats += '<div class="flex items-center gap-2 ml-auto"><span class="text-amber-400">★</span><span class="font-bold text-lg">' + esc(ov.rating) + '</span>' +
      '<a href="https://www.google.com/search?q=' + encodeURIComponent(dest.title + ' ' + dest.state + ' reviews') + '#lrd" target="_blank" rel="noopener noreferrer" class="text-gray-300 hover:text-white underline text-xs" title="Read ' + esc(dest.title) + ' reviews">(' + inr(ov.reviewCount) + ' reviews)</a></div>';
  }
  const statsEl = document.getElementById('statsBar');
  if (statsEl) statsEl.innerHTML = stats;

  const tabP = document.getElementById('tabPlacesCount'); if (tabP) tabP.textContent = places.length;
  const tabS = document.getElementById('tabStaysCount'); if (tabS) tabS.textContent = hotels.length;

  // ─── "Underrated gems nearby" heuristic ────────────────
  // Surfaces lesser-known but high-quality spots near the destination:
  // good rating + offbeat wording, minus tourist-magnet signals, with a
  // nudge toward places featured lower down the list. Pure client-side —
  // no extra data, works for every destination.
  const OFFBEAT_RE = /hidden|secret|off-?beat|less[ -]?crowded|lesser[ -]known|underrated|quiet|serene|seclud|peaceful|tranquil|untouched|pristine|unspoil|tucked|hamlet|village|meadow|trail|viewpoint|sunrise|sunset|offbeat|local|escape|solitude|away from|hidden gem/i;
  const FAMOUS_RE = /most (popular|visited|famous)|world[ -]famous|iconic|must[ -]visit|renowned|landmark|top attraction|bustling|touristy|crowded|lively|commercial|hub/i;
  function underratedScore(p, pIdx, total) {
    const text = (p.description || '') + ' ' + (p.name || '');
    let score = (typeof p.rating === 'number' ? p.rating : 4);
    if (OFFBEAT_RE.test(text)) score += 0.7;
    if (/free/i.test(p.entryFee || '')) score += 0.2;
    if (FAMOUS_RE.test(text)) score -= 0.9;
    score += (total > 1 ? pIdx / (total - 1) : 0) * 0.6; // lesser-featured = more likely a gem
    return score;
  }
  function pickUnderrated(list) {
    let pool = list.map(function (p, i) { return { p: p, idx: i }; });
    // never call the headline attraction "underrated"; on content-rich
    // destinations skip the whole Top-Places set so the gems are distinct.
    const skip = list.length >= 8 ? 4 : 1;
    pool = pool.filter(function (c) { return c.idx >= skip; });
    return pool
      .map(function (c) { return { p: c.p, idx: c.idx, s: underratedScore(c.p, c.idx, list.length) }; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 4);
  }

  // ─── OVERVIEW panel ─────────────────────────────────────
  function renderOverview() {
    const features = (ov && ov.features ? ov.features : (dest.features || [])).map(function (f) {
      return '<span class="inline-flex items-center px-3 py-1.5 bg-orange-50 text-orange-800 text-sm font-medium rounded-full border border-orange-200">' + esc(f) + '</span>';
    }).join('');

    const topPlaces = places.slice(0, 4).map(function (p, i) {
      const pImgSrc = (typeof p.image === 'string' ? p.image : (p.image && p.image.src ? p.image.src : '')) || '';
      const pImgAlt = (p.image && p.image.alt) ? p.image.alt : (p.name || '');
      const desc = (p.description || '');
      return '<div class="card p-0 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all bg-white rounded-2xl border border-gray-100 group shadow-sm" data-topidx="' + i + '" role="button" tabindex="0">' +
        '<div class="relative h-32 overflow-hidden bg-gray-100">' +
        (pImgSrc ? '<img src="' + esc(pImgSrc) + '" alt="' + esc(pImgAlt) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';" />' : '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No image</div>') +
        '<span class="absolute top-2.5 right-2.5 text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-white/20 shadow-sm flex items-center gap-1">★ ' + esc(String(p.rating || '4.5')) + '</span>' +
        '</div>' +
        '<div class="p-3.5">' +
        '<div class="flex items-center justify-between gap-2 mb-1">' +
        '<h4 class="font-bold text-sm text-gray-900 truncate leading-snug">' + esc(p.name) + '</h4>' +
        '</div>' +
        '<p class="text-xs text-gray-500 capitalize mb-1.5 font-medium flex items-center gap-1.5 truncate">' +
        '<span class="inline-block px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-semibold">' + esc(p.category || 'attraction') + '</span> · <span>📍 ' + esc(p.distance || 'Nearby') + '</span>' +
        '</p>' +
        '<p class="text-xs text-gray-600 line-clamp-2 leading-relaxed">' + esc(desc.slice(0, 90)) + (desc.length > 90 ? '…' : '') + '</p>' +
        '</div></div>';
    }).join('');

    const staysFrom = TIER_ORDER.filter(function (tier) {
      return hotels.some(function (s) { return s.tier === tier; });
    }).map(function (tier) {
      const min = (hotels.filter(function (s) { return s.tier === tier; })[0] || {}).priceMin || 0;
      return '<div class="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">' +
        '<span class="capitalize text-xs px-2 py-0.5 rounded-full font-medium ' + tierColor(tier) + '">' + (PRICE_TIERS[tier] ? PRICE_TIERS[tier].label : tier) + '</span>' +
        '<span class="font-semibold text-gray-900 text-sm">₹' + inr(min) + '+</span></div>';
    }).join('');

    const altRow = (ov && ov.altitude) ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Altitude</span><span class="font-medium">' + inr(ov.altitude) + ' m</span></div>' : '';

    // ─── 5 Real Images Carousel for Overview Panel ──────
    function get5RealPhotos() {
      const photos = [];
      const seen = new Set();
      function addPhoto(photo) {
        if (!photo || !photo.src || seen.has(photo.src)) return;
        seen.add(photo.src);
        photos.push(photo);
      }
      if (typeof dest.heroImage === 'string' && dest.heroImage) {
        addPhoto({ src: dest.heroImage, title: dest.title + ' — ' + (dest.tagline || dest.state), subtitle: dest.state + ' · Main View', category: dest.type });
      } else if (dest.heroImage && dest.heroImage.src) {
        addPhoto({
          src: dest.heroImage.src,
          title: dest.title + ' — ' + (dest.tagline || dest.state),
          subtitle: dest.state + ' · Main View',
          category: dest.type
        });
      } else if (dest.image && dest.image.src) {
        addPhoto({
          src: dest.image.src,
          title: dest.title,
          subtitle: dest.state,
          category: dest.type
        });
      }

      (places || []).forEach(function (p) {
        if (photos.length < 5 && p.image && p.image.src) {
          addPhoto({
            src: p.image.src,
            title: p.name,
            subtitle: (p.category || 'Attraction') + ' · ' + (p.distance || ''),
            category: p.category || 'attraction'
          });
        }
      });

      (dest.gallery || []).forEach(function (g) {
        const srcUrl = typeof g === 'string' ? g : g.src;
        if (photos.length < 5 && srcUrl) {
          addPhoto({
            src: srcUrl,
            title: (typeof g === 'object' && g.title) || dest.title,
            subtitle: (typeof g === 'object' && g.caption) || dest.state,
            category: 'gallery'
          });
        }
      });

      if (photos.length === 0 && dest.image && dest.image.src) {
        addPhoto({
          src: dest.image.src,
          title: dest.title,
          subtitle: dest.state,
          category: 'scenic'
        });
      }
      return photos;
    }

    const real5Photos = get5RealPhotos();

    const ovCarouselHTML =
      '<div class="dest-ov-carousel group" id="destOvCarouselWrap">' +
      '<div id="destOvTrack" class="relative w-full h-full">' +
      real5Photos.map(function (ph, idx) {
        return '<div class="dest-ov-slide ' + (idx === 0 ? 'is-active' : '') + '" data-ovslide="' + idx + '">' +
          '<img src="' + esc(ph.src) + '" alt="' + esc(ph.title) + '" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';" />' +
          '<div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"></div>' +
          '<!-- Counter -->' +
          '<div class="absolute top-4 left-4 z-20 pointer-events-none">' +
          '<span class="px-3.5 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg flex items-center gap-1.5">' +
          '📸 Real Photo ' + (idx + 1) + ' of 5 · ' + esc(dest.title) +
          '</span>' +
          '</div>' +
          '<!-- Slide Caption -->' +
          '<div class="absolute bottom-5 left-5 right-5 z-20 text-left pointer-events-auto">' +
          '<span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500 text-white uppercase tracking-wider mb-1 inline-block capitalize">' +
          esc((ph.category || 'scenic').replace('_', ' ')) +
          '</span>' +
          '<h3 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">' + esc(ph.title) + '</h3>' +
          '<p class="text-white/80 text-xs sm:text-sm max-w-lg mt-0.5">' + esc(ph.subtitle) + '</p>' +
          '</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<!-- Arrows -->' +
      '<button type="button" id="destOvPrev" class="dest-ov-btn dest-ov-prev" aria-label="Previous photo">‹</button>' +
      '<button type="button" id="destOvNext" class="dest-ov-btn dest-ov-next" aria-label="Next photo">›</button>' +
      '<!-- 5 Dots -->' +
      '<div id="destOvDots" class="dest-ov-dots">' +
      real5Photos.map(function (_, i) {
        return '<span class="dest-ov-dot ' + (i === 0 ? 'is-active' : '') + '" data-ovdot="' + i + '"></span>';
      }).join('') +
      '</div>' +
      '</div>';

    const bestTimeVal = dest.bestTime && dest.bestTime.label ? esc(dest.bestTime.label) : 'Oct – Mar';
    const summerVal = dest.weather && dest.weather.tempSummer ? esc(dest.weather.tempSummer) : (dest.weather && dest.weather.temp ? esc(dest.weather.temp) : '20°C – 30°C');
    const winterVal = dest.weather && dest.weather.tempWinter ? esc(dest.weather.tempWinter) : '10°C – 20°C';
    let altitudeVal = 'Sea level';
    if (typeof ov.altitude === 'number') {
      altitudeVal = ov.altitude > 0 ? inr(ov.altitude) + 'm' : 'Sea level';
    } else if (ov.altitude) {
      altitudeVal = esc(ov.altitude);
    }

    const summaryHighlightsHTML =
      '<div class="dest-summary-grid">' +
      '<div class="dest-summary-card dest-card-altitude">' +
      '<div class="dest-summary-icon icon-altitude">🏔️</div>' +
      '<div class="min-w-0 flex-1"><div class="dest-summary-label">Altitude</div><div class="dest-summary-val" title="' + altitudeVal + '">' + altitudeVal + '</div></div>' +
      '</div>' +
      '<div class="dest-summary-card dest-card-time">' +
      '<div class="dest-summary-icon icon-time">📅</div>' +
      '<div class="min-w-0 flex-1"><div class="dest-summary-label">Best Time</div><div class="dest-summary-val" title="' + bestTimeVal + '">' + bestTimeVal + '</div></div>' +
      '</div>' +
      '<div class="dest-summary-card dest-card-summer">' +
      '<div class="dest-summary-icon icon-summer">🌡️</div>' +
      '<div class="min-w-0 flex-1"><div class="dest-summary-label">Summer Temp</div><div class="dest-summary-val" title="' + summerVal + '">' + summerVal + '</div></div>' +
      '</div>' +
      '<div class="dest-summary-card dest-card-winter">' +
      '<div class="dest-summary-icon icon-winter">❄️</div>' +
      '<div class="min-w-0 flex-1"><div class="dest-summary-label">Winter Temp</div><div class="dest-summary-val" title="' + winterVal + '">' + winterVal + '</div></div>' +
      '</div>' +
      '</div>';

    document.getElementById('panel-overview').innerHTML =
      ovCarouselHTML +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +
      '<div class="lg:col-span-2 space-y-6">' +
      summaryHighlightsHTML +
      '<div><h2 class="text-xl font-bold text-gray-900 mb-3">About ' + esc(dest.title) + '</h2>' +
      '<p class="text-gray-600 leading-relaxed">' + esc(ov.description) + '</p></div>' +
      '<div><h3 class="font-semibold text-gray-900 mb-3">Known For</h3><div class="flex flex-wrap gap-2">' + features + '</div></div>' +
      '<div><div class="flex items-center justify-between mb-3.5"><h3 class="font-bold text-gray-900 text-lg">Top Places to Visit</h3>' +
      '<button class="text-sm text-primary font-semibold hover:underline flex items-center gap-1" data-goto="places">See all places →</button></div>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' + topPlaces + '</div></div>' +
      '</div>' +
      '<div class="space-y-4">' +
      '<div class="info-card" id="liveWeather">' +
      '<div class="flex items-center justify-between mb-3">' +
      '<h3 class="font-bold text-gray-900 text-sm uppercase tracking-wider">Live Weather</h3>' +
      '<span class="flex items-center gap-1.5 text-xs font-medium text-emerald-600">' +
      '<span class="live-dot"></span>LIVE</span>' +
      '</div>' +
      '<div id="liveWeatherBody" class="text-sm text-gray-500">Loading current conditions…</div>' +
      '</div>' +
      '<div class="info-card"><h3 class="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Quick Facts</h3>' +
      '<div class="space-y-3">' +
      '<div class="flex justify-between text-sm"><span class="text-gray-500">Region</span><span class="font-medium">' + esc(dest.region) + '</span></div>' +
      '<div class="flex justify-between text-sm"><span class="text-gray-500">State</span><span class="font-medium">' + esc(dest.state) + '</span></div>' +
      altRow +
      (reach && reach.nearestAirport && reach.nearestAirport.name ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Nearest Airport</span><span class="font-medium text-right text-xs max-w-36">' + esc(reach.nearestAirport.name) + ' (' + (reach.nearestAirport.distance || '—') + ' km)</span></div>' : '') +
      (reach && reach.nearestRailway && reach.nearestRailway.name ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Nearest Station</span><span class="font-medium text-right text-xs max-w-36">' + esc(reach.nearestRailway.name) + ' (' + (reach.nearestRailway.distance || '—') + ' km)</span></div>' : '') +
      (ov && ov.distanceFromDelhi ? '<div class="flex justify-between text-sm"><span class="text-gray-500">From Delhi</span><span class="font-medium">' + ov.distanceFromDelhi + ' km</span></div>' : (dest.distanceFromDelhi ? '<div class="flex justify-between text-sm"><span class="text-gray-500">From Delhi</span><span class="font-medium">' + dest.distanceFromDelhi + ' km</span></div>' : '')) +
      '</div></div>' +
      '<div class="info-card"><div class="flex items-center justify-between mb-3"><h3 class="font-bold text-gray-900 text-sm uppercase tracking-wider">Stays From</h3>' +
      '<button class="text-xs text-primary font-semibold" data-goto="stays">View all</button></div>' +
      '<div class="space-y-2">' + staysFrom + '</div></div>' +
      (reach && reach.roadNote ? '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4"><div class="flex items-start gap-2"><span class="text-lg shrink-0">⚠️</span>' +
      '<div><p class="font-semibold text-amber-900 text-sm mb-1">Road Note</p><p class="text-amber-800 text-xs leading-relaxed">' + esc(reach.roadNote) + '</p></div></div></div>' : '') +
      '</div>' +
      '</div>';

    // Wire overview 5-real-image photo carousel controls
    (function wireOvCarousel() {
      const wrap = document.getElementById('destOvCarouselWrap');
      const prev = document.getElementById('destOvPrev');
      const next = document.getElementById('destOvNext');
      const dots = document.querySelectorAll('#destOvDots .dest-ov-dot');
      const slides = document.querySelectorAll('#destOvTrack .dest-ov-slide');
      if (!wrap || !slides.length) return;

      let cur = 0;
      let timer = null;

      function go(idx) {
        cur = (idx + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle('is-active', i === cur));
        dots.forEach((d, i) => d.classList.toggle('is-active', i === cur));
      }

      function start() { stop(); timer = setInterval(() => go(cur + 1), 4000); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }

      if (prev) prev.addEventListener('click', () => { go(cur - 1); start(); });
      if (next) next.addEventListener('click', () => { go(cur + 1); start(); });

      dots.forEach((d) => {
        d.addEventListener('click', () => {
          const i = parseInt(d.getAttribute('data-ovdot'), 10);
          if (!isNaN(i)) { go(i); start(); }
        });
      });

      wrap.addEventListener('mouseenter', stop);
      wrap.addEventListener('mouseleave', start);

      start();
    })();

    // wire the "Underrated Gems" cards: open the place modal
    document.querySelectorAll('#panel-overview [data-uridx]').forEach(function (card) {
      const p = places[parseInt(card.getAttribute('data-uridx'), 10)];
      if (!p) return;
      card.addEventListener('click', function () { openPlaceModal(p); });
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlaceModal(p); } });
    });
    // "All places →" — wire directly so it works regardless of delegation
    const gemsAll = document.querySelector('#panel-overview [data-gems-all]');
    if (gemsAll) gemsAll.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); setTab('places'); });

    // Wire subnav pills inside Overview header
    document.querySelectorAll('#panel-overview [data-navtab]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const targetTab = btn.getAttribute('data-navtab');
        if (targetTab) setTab(targetTab);
      });
    });
  }

  // ─── PLACES panel (with category filter) ────────────────
  let placeFilter = 'all';
  function renderPlaces() {
    const cats = [];
    places.forEach(function (p) { if (cats.indexOf(p.category) === -1) cats.push(p.category); });
    let btns = '<button class="shrink-0 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ' +
      (placeFilter === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200') + '" data-place="all">All</button>';
    btns += cats.map(function (c) {
      return '<button class="shrink-0 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all capitalize ' +
        (placeFilter === c ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary') + '" data-place="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');

    const list = places.filter(function (p) { return placeFilter === 'all' || p.category === placeFilter; });
    const cards = list.map(function (p, i) {
      const fee = p.entryFee === 'Free'
        ? '<span class="text-green-600 font-medium">Free Entry</span>'
        : '<span class="text-gray-400">Entry: ' + esc(p.entryFee) + '</span>';
      return '<div class="card p-0 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all" data-pidx="' + i + '" role="button" tabindex="0"><div class="flex">' +
        '<div class="shrink-0 w-28 h-24 overflow-hidden">' +
        '<img src="' + esc(p.image.src) + '" alt="' + esc(p.image.alt || p.name) + '" class="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';" /></div>' +
        '<div class="p-3 flex-1 min-w-0">' +
        '<div class="flex items-start justify-between gap-2 mb-1"><h3 class="font-bold text-sm text-gray-900 leading-tight">' + esc(p.name) + '</h3>' +
        '<span class="text-amber-400 text-xs font-semibold shrink-0">★ ' + esc(p.rating) + '</span></div>' +
        '<p class="text-xs text-gray-500 mb-1.5 capitalize">' + esc(p.category) + ' · ' + esc(p.distance) + ' · ' + esc(p.duration) + '</p>' +
        '<p class="text-xs text-gray-600 leading-relaxed line-clamp-2">' + esc(p.description) + '</p>' +
        '<div class="flex items-center justify-between mt-2 text-xs"><div class="flex gap-3">' + fee + '<span class="text-gray-400">' + esc(p.timings) + '</span></div>' +
        '<span class="text-primary font-semibold shrink-0">View details →</span></div>' +
        '</div></div></div>';
    }).join('');

    document.getElementById('panel-places').innerHTML =
      '<div class="flex items-center justify-between mb-6"><h2 class="text-xl font-bold text-gray-900">Places to Visit in ' + esc(dest.title) + '</h2></div>' +
      '<div class="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">' + btns + '</div>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' + cards + '</div>';

    document.querySelectorAll('#panel-places [data-place]').forEach(function (b) {
      b.addEventListener('click', function () { placeFilter = b.getAttribute('data-place'); renderPlaces(); });
    });
    document.querySelectorAll('#panel-places [data-pidx]').forEach(function (card) {
      const p = list[parseInt(card.getAttribute('data-pidx'), 10)];
      card.addEventListener('click', function () { openPlaceModal(p); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlaceModal(p); }
      });
    });
  }

  // ─── STAYS panel (with tier filter) ─────────────────────
  let stayTier = 'all';
  function renderStays() {
    const allBtn = '<button class="px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ' +
      (stayTier === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border-gray-200') + '" data-tier="all">All Stays</button>';
    const tierBtns = Object.keys(PRICE_TIERS).filter(function (key) {
      return hotels.some(function (s) { return s.tier === key; });
    }).map(function (key) {
      const active = stayTier === key ? ' ring-2 ring-offset-1 ring-current' : '';
      return '<button class="px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ' + tierColor(key) + active + '" data-tier="' + key + '">' + PRICE_TIERS[key].label + '</button>';
    }).join('');

    const list = hotels.filter(function (s) { return stayTier === 'all' || s.tier === stayTier; });
    let cards;
    if (list.length === 0) {
      cards = '<div class="text-center py-16"><div class="text-4xl mb-3">🏨</div>' +
        '<p class="text-gray-600 font-medium">No stays in this price category</p>' +
        '<button class="mt-3 text-primary text-sm font-semibold" data-tier="all">Show all stays</button></div>';
    } else {
      cards = list.map(function (s) {
        const tags = (s.tags || []).map(function (t) { return '<span class="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">' + esc(t) + '</span>'; }).join('');
        const ams = (s.amenities || []).map(function (a) { return '<span class="amenity-chip text-xs bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-lg text-gray-700 dark:text-gray-300 font-medium">' + esc(a) + '</span>'; }).join('');
        const googleUrl = s.url || ('https://www.google.com/search?q=' + encodeURIComponent(s.name + ' ' + dest.title + ' ' + (dest.state || '') + ' hotel'));
        return '<div class="card p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-emerald-500/40 hover:shadow-xl transition-all group">' +
          '<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">' +
          '<div class="min-w-0 flex-1">' +
          '<div class="flex items-center gap-2.5 flex-wrap mb-2">' +
          '<a href="' + googleUrl + '" target="_blank" rel="noopener noreferrer" class="font-bold text-lg text-gray-900 dark:text-white hover:text-emerald-500 transition-colors flex items-center gap-1.5" title="View ' + esc(s.name) + ' on Google">' +
          '🏨 ' + esc(s.name) + ' <span class="text-xs text-emerald-500 font-bold">↗</span></a>' +
          '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full ' + tierColor(s.tier) + '">' + (PRICE_TIERS[s.tier] ? PRICE_TIERS[s.tier].label : s.tier) + '</span>' +
          '<span class="text-xs text-gray-500 capitalize bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md font-medium">' + esc(s.type) + '</span>' +
          '</div>' +
          '<div class="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">' +
          '<span><span class="text-amber-400">★</span> <strong class="text-gray-800 dark:text-gray-200">' + esc(s.rating) + '</strong> <a href="' + googleUrl + '" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-emerald-500 underline">(' + esc(s.reviews) + ' reviews)</a></span>' +
          (tags ? '<span class="flex gap-1.5">' + tags + '</span>' : '') +
          '</div>' +
          '<div class="flex flex-wrap gap-1.5">' + ams + '</div>' +
          '</div>' +
          '<div class="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-white/10 gap-2">' +
          '<div class="text-right">' +
          '<span class="text-2xl font-extrabold text-gray-900 dark:text-white">₹' + inr(s.priceMin) + '</span>' +
          '<span class="text-gray-400 text-xs block">to ₹' + inr(s.priceMax) + ' / night</span>' +
          '</div>' +
          '<a href="' + googleUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-emerald-500/20">Search on Google ↗</a>' +
          '</div>' +
          '</div></div>';
      }).join('');
      cards = '<div class="space-y-4">' + cards + '</div>';
    }

    document.getElementById('panel-stays').innerHTML =
      '<div class="flex items-center justify-between mb-4"><h2 class="text-xl font-bold text-gray-900">Where to Stay in ' + esc(dest.title) + '</h2></div>' +
      '<div class="flex gap-2 flex-wrap mb-6">' + allBtn + tierBtns + '</div>' + cards;

    document.querySelectorAll('#panel-stays [data-tier]').forEach(function (b) {
      b.addEventListener('click', function () { stayTier = b.getAttribute('data-tier'); renderStays(); });
    });
  }

  // ─── REACH panel ────────────────────────────────────────
  let reachCity = 'all';
  function renderReach() {
    const routes = reach.routes || [];
    const delhiRoute = routes.find(function (r) { return r.from && r.from.indexOf('Delhi') >= 0; }) || {};
    const delhiCar = delhiRoute.byCar || 'Via road';

    const cityOpts = '<option value="all">All States & UTs (' + routes.length + ' Origins)</option>' + routes.map(function (r) {
      return '<option value="' + esc(r.from) + '"' + (reachCity === r.from ? ' selected' : '') + '>' + esc(r.from) + ' · ' + r.distance + ' km</option>';
    }).join('');

    const shown = routes.filter(function (r) { return reachCity === 'all' || r.from === reachCity; });
    const rows = shown.map(function (r) {
      return '<tr><td><span class="font-semibold text-gray-900">' + esc(r.from) + '</span></td>' +
        '<td><span class="font-medium text-primary">' + r.distance + ' km</span></td>' +
        '<td>' + esc(r.byCar) + '</td><td class="text-xs">' + esc(r.byTrain) + '</td>' +
        '<td class="text-xs">' + esc(r.byAir) + '</td><td class="text-xs text-gray-500">' + esc(r.via) + '</td></tr>';
    }).join('');

    let selectedBanner = '';
    if (reachCity !== 'all') {
      const target = routes.find(function (r) { return r.from === reachCity; });
      if (target) {
        let recMode = '🚗 Direct Drive / Bus';
        let recBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              if (target.distance > 700 && reach.nearestAirport && reach.nearestAirport.name) {
          recMode = '✈️ Flight to ' + esc(reach.nearestAirport.name) + ' (' + reach.nearestAirport.distance + ' km away) + Taxi';
          recBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
        } else if (target.distance > 300 && reach.nearestRailway && reach.nearestRailway.name) {
          recMode = '🚂 Express Train to ' + esc(reach.nearestRailway.name) + ' (' + reach.nearestRailway.distance + ' km away) or 🚗 Drive';
          recBadge = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
        } else if (target.distance > 700) {
          recMode = '✈️ Flight + Taxi';
          recBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
        } else if (target.distance > 300) {
          recMode = '🚂 Express Train or 🚗 Drive';
          recBadge = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
        }
        selectedBanner = '<div class="card p-4 mb-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-2xl text-slate-100 shadow-xl">' +
          '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">' +
          '<div>' +
          '<div class="text-xs text-emerald-400 font-semibold tracking-wider uppercase mb-1">📍 Selected Origin Route</div>' +
          '<h4 class="text-base font-bold text-white">From ' + esc(target.from) + ' to ' + esc(dest.title) + '</h4>' +
          '<p class="text-xs text-slate-300 mt-1">Road Distance: <strong class="text-white">' + target.distance + ' km</strong> · Drive Time: <strong class="text-white">' + esc(target.byCar) + '</strong></p>' +
          '</div>' +
          '<div class="shrink-0">' +
          '<span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold ' + recBadge + '">' +
          recMode +
          '</span>' +
          '</div>' +
          '</div>' +
          '</div>';
      }
    }

    document.getElementById('panel-reach').innerHTML =
      '<h2 class="text-xl font-bold text-gray-900 mb-2">How to Reach ' + esc(dest.title) + '</h2>' +
            '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">' +
      (reach && reach.nearestAirport && reach.nearestAirport.name ? '<div class="info-card text-center"><div class="info-card-icon mx-auto">✈️</div><h3 class="font-bold text-sm mb-1">Nearest Airport</h3>' +
      '<p class="text-gray-600 text-sm">' + esc(reach.nearestAirport.name) + '</p><p class="text-primary font-semibold text-sm mt-1">' + (reach.nearestAirport.distance || '—') + ' km away</p></div>' : '') +
      (reach && reach.nearestRailway && reach.nearestRailway.name ? '<div class="info-card text-center"><div class="info-card-icon mx-auto">🚂</div><h3 class="font-bold text-sm mb-1">Nearest Railway</h3>' +
      '<p class="text-gray-600 text-sm">' + esc(reach.nearestRailway.name) + '</p><p class="text-primary font-semibold text-sm mt-1">' + (reach.nearestRailway.distance || '—') + ' km away</p></div>' : '') +
      '<div class="info-card text-center"><div class="info-card-icon mx-auto">🚗</div><h3 class="font-bold text-sm mb-1">From Delhi</h3>' +
      '<p class="text-gray-600 text-sm">' + (delhiRoute.distance ? delhiRoute.distance + ' km' : (ov && ov.distanceFromDelhi ? ov.distanceFromDelhi + ' km' : (dest.distanceFromDelhi ? dest.distanceFromDelhi + ' km' : 'N/A'))) + '</p><p class="text-primary font-semibold text-sm mt-1">' + esc(delhiCar) + '</p></div>' +
      '</div>' +
      selectedBanner +
      '<div class="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">' +
      '<div class="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">' +
      '<h3 class="font-bold text-gray-900 text-sm">Distance & Routes from All States & UTs (' + routes.length + ' Origins)</h3>' +
      '<label class="flex items-center gap-2 text-xs text-gray-500">Filter Origin: ' +
      '<select id="reachCity" class="form-input !py-1 !px-2 !text-xs rounded-lg border-gray-200" style="width:auto;display:inline-block">' + cityOpts + '</select>' +
      '</label>' +
      '</div>' +
      '<div class="overflow-x-auto"><table class="route-table"><thead><tr><th>From (City & State)</th><th>Distance</th><th>By Road</th><th>By Train</th><th>By Air</th><th>Via</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>' +
            (reach && reach.roadNote ? '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"><span class="text-xl shrink-0">⚠️</span>' +
      '<div><p class="font-semibold text-amber-900 text-sm mb-1">Road Advisory</p><p class="text-amber-800 text-sm">' + esc(reach.roadNote) + '</p></div></div>' : '');

    const sel = document.getElementById('reachCity');
    if (sel) sel.addEventListener('change', function () { reachCity = sel.value; renderReach(); });
  }

  // ─── MAP ────────────────────────────────────────────────
  let mapReady = false;
  let activeMapInstance = null;
  const mapNameEl = document.getElementById('mapName');
  if (mapNameEl) mapNameEl.textContent = dest.title;

  function initMap() {
    if (typeof L === 'undefined') {
      setTimeout(initMap, 100);
      return;
    }

    if (mapReady && activeMapInstance) {
      setTimeout(function () { activeMapInstance.invalidateSize(); }, 100);
      return;
    }

    const mapContainer = document.getElementById('leaflet-map');
    if (!mapContainer) return;

    const c = coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])
      ? coords
      : [20.5937, 78.9629];

    const map = L.map('leaflet-map', {
      scrollWheelZoom: false
    }).setView(c, 11);

    activeMapInstance = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Main Destination Marker
    const mainIcon = L.divIcon({
      html: '<div style="background:#10b981;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(16,185,129,0.6)"></div>',
      className: '',
      iconAnchor: [9, 9]
    });
    L.marker(c, { icon: mainIcon })
      .addTo(map)
      .bindPopup('<div style="color:#0f172a"><b>' + esc(dest.title) + '</b><br><span style="color:#64748b;font-size:12px">' + esc(dest.state) + '</span></div>')
      .openPopup();

    // Plot Places to Visit Markers
    if (places && places.length) {
      places.forEach((p, idx) => {
        let pLat = p.lat || p.latitude;
        let pLng = p.lng || p.longitude;
        if (!pLat || !pLng || isNaN(pLat) || isNaN(pLng)) {
          const angle = (idx / places.length) * 2 * Math.PI;
          const radius = 0.02 + (idx * 0.005);
          pLat = c[0] + Math.sin(angle) * radius;
          pLng = c[1] + Math.cos(angle) * radius;
        }
        const placeIcon = L.divIcon({
          html: '<div style="background:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          className: '',
          iconAnchor: [6, 6]
        });
        L.marker([pLat, pLng], { icon: placeIcon })
          .addTo(map)
          .bindPopup('<div style="color:#0f172a"><strong style="color:#1e40af">📍 ' + esc(p.name || p.title) + '</strong><br><span style="font-size:11px;color:#64748b">' + esc(p.type || 'Attraction') + '</span></div>');
      });
    }

    // Plot Hotel Stays Markers
    if (hotels && hotels.length) {
      hotels.forEach((h, idx) => {
        let hLat = h.lat || h.latitude;
        let hLng = h.lng || h.longitude;
        if (!hLat || !hLng || isNaN(hLat) || isNaN(hLng)) {
          const angle = ((idx + 0.5) / hotels.length) * 2 * Math.PI;
          const radius = 0.015 + (idx * 0.004);
          hLat = c[0] + Math.cos(angle) * radius;
          hLng = c[1] + Math.sin(angle) * radius;
        }
        const hotelIcon = L.divIcon({
          html: '<div style="background:#f59e0b;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
          className: '',
          iconAnchor: [6, 6]
        });
        L.marker([hLat, hLng], { icon: hotelIcon })
          .addTo(map)
          .bindPopup('<div style="color:#0f172a"><strong style="color:#b45309">🏨 ' + esc(h.name) + '</strong><br><span style="font-size:11px;color:#047857;font-weight:600">From ₹' + inr(h.pricePerNight || h.minPrice || 1000) + '/night</span></div>');
      });
    }

    mapReady = true;
    setTimeout(function () { map.invalidateSize(); }, 150);
  }

  // ─── Persistent Nav Bar Render ─────────────────────────
  function renderNav() {
    const container = document.getElementById('destNavContainer');
    if (!container) return;

    var pc = places.length;
    var sc = hotels.length;

    // Full ARIA tab pattern: role=tab, id, aria-controls, aria-selected
    container.setAttribute('role', 'tablist');
    container.setAttribute('aria-label', 'Destination sections');

    container.innerHTML =
      '<div class="dest-subnav-bar">' +
      '<button type="button" role="tab" id="tab-overview" class="dest-quick-pill active" data-navtab="overview" aria-controls="panel-overview" aria-selected="true">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' +
      '<span>Overview</span>' +
      '</button>' +
      '<button type="button" role="tab" id="tab-places" class="dest-quick-pill" data-navtab="places" aria-controls="panel-places" aria-selected="false">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
      '<span>Places</span>' +
      '<span class="tab-badge" aria-label="' + pc + ' places">' + pc + '</span>' +
      '</button>' +
      '<button type="button" role="tab" id="tab-stays" class="dest-quick-pill" data-navtab="stays" aria-controls="panel-stays" aria-selected="false">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
      '<span>Stays</span>' +
      '<span class="tab-badge" aria-label="' + sc + ' stays">' + sc + '</span>' +
      '</button>' +
      '<button type="button" role="tab" id="tab-reach" class="dest-quick-pill" data-navtab="reach" aria-controls="panel-reach" aria-selected="false">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' +
      '<span>How to Reach</span>' +
      '</button>' +
      '<button type="button" role="tab" id="tab-map" class="dest-quick-pill" data-navtab="map" aria-controls="panel-map" aria-selected="false">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>' +
      '<span>Map</span>' +
      '</button>' +
      '</div>';
  }


  // ─── Tab Navigation ────────────────────────────────────
  function setTab(name) {
    var tabs = ['overview', 'places', 'stays', 'reach', 'map'];

    // Update tab buttons: active class + aria-selected
    document.querySelectorAll('[data-navtab]').forEach(function (b) {
      var on = b.getAttribute('data-navtab') === name;
      b.className = 'dest-quick-pill' + (on ? ' active' : '');
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.setAttribute('tabindex', on ? '0' : '-1');
    });

    // Update panels: display + aria-hidden
    tabs.forEach(function (n) {
      var panel = document.getElementById('panel-' + n);
      if (panel) {
        var visible = n === name;
        panel.style.display = visible ? 'block' : 'none';
        panel.setAttribute('aria-hidden', visible ? 'false' : 'true');
      }
    });

    // Move focus to panel for screen reader users
    var activePanel = document.getElementById('panel-' + name);
    if (activePanel && name !== 'overview') activePanel.setAttribute('tabindex', '-1');

    // Smooth-scroll to just below the sticky nav bar
    if (name !== 'overview') {
      var navContainer = document.getElementById('destNavContainer');
      if (navContainer) {
        var navBottom = navContainer.getBoundingClientRect().bottom + window.pageYOffset;
        window.scrollTo({ top: navBottom - 16, behavior: 'smooth' });
      }
    }

    if (name === 'map') initMap();
  }

  // Global event delegation for all subnav pill buttons
  document.addEventListener('click', function (e) {
    const navBtn = e.target.closest('[data-navtab]');
    if (navBtn) {
      e.preventDefault();
      e.stopPropagation();
      const target = navBtn.getAttribute('data-navtab');
      if (target) setTab(target);
    }
  });

  // Always initialize map on page load
  initMap();

  // ─── Render nav & all panels ───────────────────────────
  renderNav();
  renderOverview();
  renderPlaces();
  renderStays();
  renderReach();

  // ─── Live weather (auto-updating) ───────────────────────
  let latestWeather = null;
  (function liveWeather() {
    const body = document.getElementById('liveWeatherBody');
    if (!body) return;
    if (!coords) { body.innerHTML = '<span class="text-gray-400">Live weather unavailable for this location.</span>'; return; }

    let offsetSeconds = 0;   // destination UTC offset, filled from API
    let haveData = false;

    function fmtClock() {
      if (!haveData) return '';
      const d = new Date(Date.now() + offsetSeconds * 1000);
      return pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ':' + pad2(d.getUTCSeconds());
    }

    function paint(cur) {
      const info = weatherInfo(cur.weather_code);
      const temp = Math.round(cur.temperature_2m);
      const feels = (cur.apparent_temperature != null) ? Math.round(cur.apparent_temperature) : temp;
      offsetSeconds = cur._offset || 0;
      haveData = true;
      latestWeather = {
        temp: temp, feels: feels, label: info[0], emoji: info[1],
        humidity: cur.relative_humidity_2m, wind: Math.round(cur.wind_speed_10m)
      };
      refreshPlaceWeather();
      body.innerHTML =
        '<div class="flex items-center gap-3 mb-3">' +
        '<span class="text-4xl leading-none">' + info[1] + '</span>' +
        '<div><div class="text-3xl font-bold text-gray-900 leading-none">' + temp + '°C</div>' +
        '<div class="text-xs text-gray-500 mt-1">' + info[0] + '</div></div>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">' +
        '<div class="flex justify-between"><span class="text-gray-500">Feels like</span><span class="font-medium">' + feels + '°C</span></div>' +
        '<div class="flex justify-between"><span class="text-gray-500">Humidity</span><span class="font-medium">' + cur.relative_humidity_2m + '%</span></div>' +
        '<div class="flex justify-between"><span class="text-gray-500">Wind</span><span class="font-medium">' + Math.round(cur.wind_speed_10m) + ' km/h</span></div>' +
        '<div class="flex justify-between"><span class="text-gray-500">Local time</span><span class="font-medium" id="liveClock">' + fmtClock() + '</span></div>' +
        '</div>' +
        '<p class="text-[11px] text-gray-400 mt-3" id="liveUpdated">Updated just now · refreshes every 10 min</p>';
    }

    function fetchNow(force) {
      const cacheKey = 'weather_' + dest.slug;
      if (!force) {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;
            if (age < 600000) { // 10 minutes cache
              paint(parsed.data);
              return;
            }
          }
        } catch (e) {
          // ignore storage access errors
        }
      }

      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + coords[0] + '&longitude=' + coords[1] +
        '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto';
      fetch(url)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (data) {
          const cur = data.current || {};
          cur._offset = data.utc_offset_seconds || 0;
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: cur }));
          } catch (e) {
            // ignore storage access errors
          }
          paint(cur);
        })
        .catch(function () {
          if (!haveData) {
            body.innerHTML = '<span class="text-gray-400">Couldn\'t load live weather (offline or blocked). ' +
              'Best season: ' + esc(dest.bestTime.label) + '.</span>';
          }
        });
    }

    fetchNow(false);
    setInterval(function () { fetchNow(true); }, 600000);         // refresh every 10 min (Open-Meteo free-tier friendly)
    setInterval(function () {              // tick the local clock every second
      const el = document.getElementById('liveClock');
      if (el && haveData) el.textContent = fmtClock();
    }, 1000);
  })();

  // delegated clicks inside overview: "See all / View all" tabs + Top Places cards
  document.getElementById('panel-overview').addEventListener('click', function (e) {
    const goto = e.target.closest('[data-goto]');
    if (goto) { setTab(goto.getAttribute('data-goto')); return; }
    const top = e.target.closest('[data-topidx]');
    if (top) openPlaceModal(places[parseInt(top.getAttribute('data-topidx'), 10)]);
  });
  document.getElementById('panel-overview').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const top = e.target.closest('[data-topidx]');
    if (top) { e.preventDefault(); openPlaceModal(places[parseInt(top.getAttribute('data-topidx'), 10)]); }
  });

  // ─── Similar destinations (from the light manifest) ────
  const TYPE_TITLES = {
    hill_station: 'Hill Station',
    beach: 'Beach & Coastal',
    heritage: 'Heritage',
    spiritual: 'Spiritual',
    lakes: 'Lakes & Backwaters',
    wildlife: 'Wildlife & Nature',
    adventure: 'Adventure',
    city: 'City & Culture',
  };
  const similarHeadingTypeName = document.getElementById('similarTypeName');
  if (similarHeadingTypeName) {
    const rawType = TYPE_TITLES[dest.type] || (dest.type ? dest.type.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }) : '');
    similarHeadingTypeName.textContent = rawType ? rawType + ' ' : '';
  }

  const allDestList = (idx && Array.isArray(idx.destinations)) ? idx.destinations : [];
  
  function getSimilarDestinations() {
    if (!allDestList.length) return [];
    // 1. Same state and same type
    const sameStateAndType = allDestList.filter(function (d) {
      return d && d.slug !== dest.slug && d.type === dest.type && d.state === dest.state;
    });
    // 2. Same state other types
    const sameStateOther = allDestList.filter(function (d) {
      return d && d.slug !== dest.slug && d.state === dest.state && d.type !== dest.type;
    });
    // 3. Same type other states (top rated)
    const sameTypeOther = allDestList.filter(function (d) {
      return d && d.slug !== dest.slug && d.type === dest.type && d.state !== dest.state;
    });
    // 4. Any other popular destinations
    const others = allDestList.filter(function (d) {
      return d && d.slug !== dest.slug;
    });

    const pool = [].concat(sameStateAndType, sameStateOther, sameTypeOther, others);
    const uniqueMap = new Map();
    pool.forEach(function (d) {
      if (d && d.slug && !uniqueMap.has(d.slug)) {
        uniqueMap.set(d.slug, d);
      }
    });

    return Array.from(uniqueMap.values()).slice(0, 4);
  }

  const similar = getSimilarDestinations();

  function resolveCardPhoto(d) {
    if (!d) return '';
    if (typeof cardImg === 'function') {
      const res = cardImg(d);
      if (res) return res;
    }
    const val = d.heroImage || d.image;
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val.src === 'string') return val.src;
    return '';
  }

  const similarGrid = document.getElementById('similar-grid');
  if (similarGrid && similar.length > 0) {
    similarGrid.innerHTML = similar.map(function (d) {
      const img = resolveCardPhoto(d);
      return '' +
        '<a href="' + destUrl(d.slug) + '" class="group block rounded-2xl p-3 border border-white/15 bg-slate-900/85 backdrop-blur-xl shadow-2xl hover:border-emerald-400/60 hover:-translate-y-1.5 transition-all duration-300">' +
        '<div class="rounded-xl overflow-hidden aspect-video relative mb-3 bg-slate-800' + (img ? '' : ' image-unavailable') + '">' +
        (img ? '<img src="' + esc(img) + '" alt="' + esc((d.image && d.image.alt) || d.title) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';" />' : '') +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>' +
        '<div class="absolute top-2 right-2">' +
        '<span class="badge bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full border border-white/15">' + esc(typeLabel(d.type)) + '</span>' +
        '</div>' +
        '<div class="absolute bottom-2 left-2.5 right-2.5">' +
        '<p class="text-white text-sm font-bold truncate leading-tight drop-shadow">' + esc(d.title) + '</p>' +
        '<p class="text-white/70 text-[11px] font-medium">' + esc(d.state) + '</p>' +
        '</div>' +
        '</div>' +
        '<div class="flex items-center justify-between px-1">' +
        '<div class="flex items-center gap-1 text-amber-400 text-xs font-bold">' +
        '<span>★</span><span>' + esc(d.rating || '4.5') + '</span>' +
        '</div>' +
        '<p class="text-xs font-bold text-emerald-400">From ₹' + inr(d.minPrice || 1500) + '</p>' +
        '</div>' +
        '</a>';
    }).join('');
  }

  // ─── Nav buttons ────────────────────────────────────────
  const navBookBtn = document.getElementById('navBook');
  if (navBookBtn) {
    navBookBtn.addEventListener('click', function () { setTab('stays'); });
  }
  const saveBtn = document.getElementById('navSave');
  let saved = localStorage.getItem('saved_' + dest.slug) === 'true';
  function updateSaveUI() {
    saveBtn.textContent = saved ? '✓ Saved' : '💾 Save';
    saveBtn.classList.toggle('!bg-primary', saved);
    saveBtn.classList.toggle('!text-white', saved);
    saveBtn.classList.toggle('!border-primary', saved);
  }
  if (saveBtn) {
    updateSaveUI();
    saveBtn.addEventListener('click', function () {
      saved = !saved;
      localStorage.setItem('saved_' + dest.slug, saved ? 'true' : 'false');
      updateSaveUI();
    });
  }
  document.getElementById('mStays').addEventListener('click', function (e) { e.preventDefault(); setTab('stays'); });
  document.getElementById('mReach').addEventListener('click', function (e) { e.preventDefault(); setTab('reach'); });

  // ─── Place details modal (with live weather) ───────────
  const pModal = document.getElementById('placeModal');
  let modalReturnFocus = null;   // element to restore focus to when the modal closes

  function trapModalTab(e) {
    if (e.key !== 'Tab' || pModal.style.display === 'none') return;
    const focusable = pModal.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])');
    const list = Array.prototype.filter.call(focusable, function (el) { return el.offsetParent !== null; });
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function setInitialFocus() {
    const closeBtn = document.getElementById('placeClose');
    if (closeBtn) closeBtn.focus();
  }

  function refreshPlaceWeather() {
    const el = document.getElementById('placeWeather');
    if (!el || pModal.style.display === 'none') return;
    if (!latestWeather) { el.textContent = 'Loading…'; return; }
    const w = latestWeather;
    el.innerHTML = '<span class="text-xl mr-1">' + w.emoji + '</span>' +
      '<span class="font-bold text-gray-900">' + w.temp + '°C</span> · ' + w.label +
      ' · feels ' + w.feels + '°C · humidity ' + w.humidity + '% · wind ' + w.wind + ' km/h';
  }

  // ─── Place photos: baked p.photos first ─────────────────
  function fetchPlacePhotos(p, cb) {
    if (Array.isArray(p.photos) && p.photos.length) {
      const valid = [...new Set(p.photos.filter(u => u && typeof u === 'string' && !u.includes('picsum.photos')))];
      if (valid.length > 0) {
        cb(valid);
        return;
      }
    }
    if (p.image && p.image.src && typeof p.image.src === 'string' && !p.image.src.includes('picsum.photos')) {
      cb([p.image.src]);
      return;
    }
    if (dest.heroImage && dest.heroImage.src) {
      cb([dest.heroImage.src]);
      return;
    }
    if (dest.image && dest.image.src) {
      cb([dest.image.src]);
      return;
    }
    cb([]);
  }

  // ─── Carousel ──────────────────────────────────────────
  const carTrack = document.getElementById('placeTrack');
  const carDots = document.getElementById('carDots');
  const carCount = document.getElementById('carCount');
  let carIdx = 0, carLen = 0, carTimer = null, carToken = 0;

  function carGo(i) {
    if (!carLen) return;
    carIdx = (i + carLen) % carLen;
    carTrack.style.transform = 'translateX(-' + (carIdx * 100) + '%)';
    carCount.textContent = (carIdx + 1) + ' / ' + carLen;
    const dots = carDots.children;
    for (let d = 0; d < dots.length; d++) dots[d].className = 'dot' + (d === carIdx ? ' active' : '');
  }
  function carRender(urls, name) {
    carLen = urls.length; carIdx = 0;
    carTrack.innerHTML = urls.map(function (u, i) {
      return '<div class="carousel-slide"><img src="' + esc(u) + '" alt="' + esc(name) + ' photo ' + (i + 1) +
        '" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';" /></div>';
    }).join('');
    carDots.innerHTML = urls.map(function (u, i) { return '<span class="dot' + (i === 0 ? ' active' : '') + '" data-i="' + i + '"></span>'; }).join('');
    carCount.textContent = '1 / ' + carLen;
    carTrack.style.transform = 'translateX(0)';
  }
  function carStartAuto() { carStopAuto(); carTimer = setInterval(function () { carGo(carIdx + 1); }, 4000); }
  function carStopAuto() { if (carTimer) { clearInterval(carTimer); carTimer = null; } }

  document.getElementById('carPrev').addEventListener('click', function () { carGo(carIdx - 1); carStartAuto(); });
  document.getElementById('carNext').addEventListener('click', function () { carGo(carIdx + 1); carStartAuto(); });
  carDots.addEventListener('click', function (e) {
    const d = e.target.closest('.dot'); if (d) { carGo(parseInt(d.getAttribute('data-i'), 10)); carStartAuto(); }
  });

  function openPlaceModal(p) {
    document.getElementById('placeName').textContent = p.name;
    document.getElementById('placeRating').textContent = '★ ' + p.rating;
    document.getElementById('placeCategory').textContent = p.category;
    document.getElementById('placeDesc').textContent = p.description;
    document.getElementById('placeDistance').textContent = p.distance + ' from ' + dest.title;
    document.getElementById('placeDuration').textContent = p.duration;
    document.getElementById('placeFee').textContent = p.entryFee;
    document.getElementById('placeTimings').textContent = p.timings;
    document.getElementById('placeMapLink').href =
      'https://www.google.com/maps/search/' + encodeURIComponent(p.name + ', ' + dest.title + ', ' + dest.state);
    // show loading then real photos. Reset carousel state + stop any running
    // autoplay so arrow/dot input during the "Loading…" window can't act on the
    // previous place's slides, and bump a token so a slow fetch for a place the
    // user has since navigated away from can't overwrite the current carousel.
    carStopAuto();
    carLen = 0; carIdx = 0;
    const myToken = ++carToken;
    carTrack.innerHTML = '<div class="carousel-slide"><div class="carousel-loading">Loading photos…</div></div>';
    carDots.innerHTML = ''; carCount.textContent = '';
    pModal.style.display = 'flex';
    pModal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    // a11y: hide background content from screen readers while modal is open
    const nav = document.getElementById('siteNav');
    const mainContent = document.getElementById('content');
    const footer = document.getElementById('siteFooter');
    if (nav) nav.setAttribute('aria-hidden', 'true');
    if (mainContent) mainContent.setAttribute('aria-hidden', 'true');
    if (footer) footer.setAttribute('aria-hidden', 'true');
    // a11y: remember what to return focus to, move focus into the dialog, trap Tab
    modalReturnFocus = document.activeElement;
    const closeBtn = document.getElementById('placeClose');
    if (closeBtn) closeBtn.focus();
    document.addEventListener('keydown', trapModalTab);
    refreshPlaceWeather();
    fetchPlacePhotos(p, function (urls) {
      if (pModal.style.display === 'none' || myToken !== carToken) return;   // modal closed or place switched
      carRender(urls, p.name);
      carGo(0);
      carStartAuto();
    });
  }
  function closePlaceModal() {
    pModal.style.display = 'none';
    pModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    carStopAuto();
    document.removeEventListener('keydown', trapModalTab);
    // a11y: restore background visibility for screen readers
    const nav = document.getElementById('siteNav');
    const mainContent = document.getElementById('content');
    const footer = document.getElementById('siteFooter');
    if (nav) nav.removeAttribute('aria-hidden');
    if (mainContent) mainContent.removeAttribute('aria-hidden');
    if (footer) footer.removeAttribute('aria-hidden');
    if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') modalReturnFocus.focus();
    modalReturnFocus = null;
  }
  document.getElementById('placeClose').addEventListener('click', closePlaceModal);
  document.getElementById('placeBackdrop').addEventListener('click', closePlaceModal);
  document.addEventListener('keydown', function (e) {
    if (pModal.style.display === 'none') return;
    if (e.key === 'Escape') closePlaceModal();
    else if (e.key === 'ArrowLeft') { carGo(carIdx - 1); carStartAuto(); }
    else if (e.key === 'ArrowRight') { carGo(carIdx + 1); carStartAuto(); }
  });

  // ─── GSAP ScrollTrigger Motion ─────────────────────────
  function initDestinationGSAP() {
    if (!window.gsap) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }

    // Hero content entrance
    window.gsap.from('#heroTitle', { opacity: 0, y: 25, duration: 0.9, ease: 'power3.out' });
    window.gsap.from('#heroTagline', { opacity: 0, y: 20, duration: 0.8, delay: 0.2, ease: 'power3.out' });
    window.gsap.from('#heroType, #heroBadge', { opacity: 0, scale: 0.85, stagger: 0.1, duration: 0.6, ease: 'back.out(1.7)' });

    // Parallax background scroll
    if (window.ScrollTrigger && document.querySelector('.dest-immersive-bg')) {
      window.gsap.to('.dest-immersive-bg', {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      });
    }

    // Similar destinations scroll reveal
    if (window.ScrollTrigger && document.getElementById('similarSection')) {
      window.gsap.from('#similarSection .dest-similar-header', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: '#similarSection',
          start: 'top 98%',
          toggleActions: 'play none none none',
        },
      });

      window.gsap.from('#similar-grid a', {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power2.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: '#similarSection',
          start: 'top 98%',
          toggleActions: 'play none none none',
        },
      });

      setTimeout(function () {
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        const cards = document.querySelectorAll('#similar-grid a');
        cards.forEach(function (c) { c.style.opacity = '1'; });
      }, 500);
    }
  }

  setTimeout(initDestinationGSAP, 100);
}
