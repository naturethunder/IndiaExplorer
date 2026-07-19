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
import { destUrl } from '../components/destinationCard.js';
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
const slug = params.get('slug') || params.get('id') || window.location.hash.slice(1) || null;

let dest = null;
let idx = null;
if (slug) {
  try {
    [dest, idx] = await Promise.all([fetchDestination(slug), fetchIndex()]);
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
  const PRICE_TIERS = idx.meta.priceTiers;
  const DESTINATION_TYPES = idx.meta.types;
  const ov = dest.overview;
  const reach = dest.howToReach;
  const coords = dest.weather && dest.weather.lat != null ? [dest.weather.lat, dest.weather.lng] : null;
  const places = dest.topPlaces || [];
  const hotels = dest.hotels || [];

  // ─── SEO (from the destination's own seo record) ───────
  applySEO({
    title: dest.seo.title,
    description: dest.seo.description,
    canonicalPath: dest.seo.canonical,
    ogImage: dest.seo.ogImage,
    keywords: dest.seo.keywords,
    type: 'article',
  });
  injectJsonLd(destinationJsonLd(dest));
  injectJsonLd(faqJsonLd(dest.faq));
  injectJsonLd(breadcrumbJsonLd([
    { name: 'Home', path: 'index.html' },
    { name: 'Destinations', path: 'destinations.html' },
    { name: dest.title, path: dest.seo.canonical },
  ]));

  document.getElementById('content').style.display = 'block';
  document.getElementById('crumbName').textContent = dest.title;

  // ─── Hero ───────────────────────────────────────────────
  const heroImg = document.getElementById('heroImg');
  heroImg.src = dest.heroImage.src;
  heroImg.alt = dest.heroImage.alt || dest.title;
  heroImg.onerror = function () { this.onerror = null; this.src = 'https://picsum.photos/seed/' + dest.slug + 'x/1400/700'; };
  const typeObj = DESTINATION_TYPES.find(function (t) { return t.id === dest.type; }) || {};
  const heroType = document.getElementById('heroType');
  heroType.href = 'destinations.html?type=' + dest.type;
  heroType.textContent = (typeObj.icon || '') + ' ' + typeLabel(dest.type);
  document.getElementById('heroBadge').textContent = dest.badge || '';
  document.getElementById('heroTitle').textContent = dest.title + ', ' + dest.state;
  document.getElementById('heroTagline').textContent = dest.tagline || '';

  // ─── Hero photo carousel (baked gallery — instant, no live call) ──
  (function heroCarousel() {
    const slidesEl = document.getElementById('heroSlides');
    const dotsEl = document.getElementById('heroDots');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    if (!slidesEl) return;
    let hIdx = 0, len = 0, timer = null;

    function go(i) {
      if (!len) return;
      hIdx = (i + len) % len;
      const imgs = slidesEl.children, dots = dotsEl.children;
      for (let k = 0; k < imgs.length; k++) imgs[k].classList.toggle('active', k === hIdx);
      for (let d = 0; d < dots.length; d++) dots[d].classList.toggle('active', d === hIdx);
    }
    function startAuto() { stopAuto(); if (len > 1) timer = setInterval(function () { go(hIdx + 1); }, 5000); }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

    function build(urls) {
      slidesEl.innerHTML = urls.map(function (u, i) {
        return '<img src="' + esc(u) + '" alt="' + esc(dest.title) + ' photo ' + (i + 1) +
          '"' + (i === 0 ? ' class="active"' : '') +
          ' onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(dest.slug) + i + '/1400/700\'" />';
      }).join('');
      dotsEl.innerHTML = urls.map(function (u, i) {
        return '<span class="dot' + (i === 0 ? ' active' : '') + '" data-i="' + i + '"></span>';
      }).join('');
      len = urls.length; hIdx = 0;
      // once real photos are in, the single fallback <img> underneath isn't needed
      if (heroImg) heroImg.style.display = 'none';
      startAuto();
    }

    prevBtn.addEventListener('click', function () { go(hIdx - 1); startAuto(); });
    nextBtn.addEventListener('click', function () { go(hIdx + 1); startAuto(); });
    dotsEl.addEventListener('click', function (e) {
      const d = e.target.closest('.dot'); if (d) { go(parseInt(d.getAttribute('data-i'), 10)); startAuto(); }
    });

    // gallery is baked at build time (≥5 real photos); top up with wide picsum if sparse
    let urls = (dest.gallery || []).map(function (g) { return g.src; }).slice(0, 6);
    if (urls.length < 5) {
      for (let i = urls.length; i < 5; i++) urls.push('https://picsum.photos/seed/' + encodeURIComponent(dest.slug) + (i ? '-' + i : '') + '/1400/700');
    }
    build(urls);
  })();

  // ─── Stats bar ──────────────────────────────────────────
  let stats = '';
  if (ov.altitude) stats += '<div class="flex items-center gap-2"><span>🏔️</span><span class="text-gray-300">Altitude:</span><span class="font-semibold">' + inr(ov.altitude) + 'm</span></div>';
  stats += '<div class="flex items-center gap-2"><span>📅</span><span class="text-gray-300">Best Time:</span><span class="font-semibold">' + esc(dest.bestTime.label) + '</span></div>';
  stats += '<div class="flex items-center gap-2"><span>🌡️</span><span class="text-gray-300">Summer:</span><span class="font-semibold">' + esc(dest.weather.tempSummer) + '</span></div>';
  stats += '<div class="flex items-center gap-2"><span>❄️</span><span class="text-gray-300">Winter:</span><span class="font-semibold">' + esc(dest.weather.tempWinter) + '</span></div>';
  stats += '<div class="flex items-center gap-2 ml-auto"><span class="text-amber-400">★</span><span class="font-bold text-lg">' + esc(ov.rating) + '</span>' +
    '<a href="https://www.google.com/search?q=' + encodeURIComponent(dest.title + ' ' + dest.state + ' reviews') + '#lrd" target="_blank" rel="noopener noreferrer" class="text-gray-300 hover:text-white underline text-xs" title="Read ' + esc(dest.title) + ' reviews">(' + inr(ov.reviewCount) + ' reviews)</a></div>';
  document.getElementById('statsBar').innerHTML = stats;

  // ─── Tab counts ─────────────────────────────────────────
  document.getElementById('tabPlacesCount').textContent = places.length;
  document.getElementById('tabStaysCount').textContent = hotels.length;

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
    const features = (ov.features || []).map(function (f) {
      return '<span class="inline-flex items-center px-3 py-1.5 bg-orange-50 text-orange-800 text-sm font-medium rounded-full border border-orange-200">' + esc(f) + '</span>';
    }).join('');

    const topPlaces = places.slice(0, 4).map(function (p, i) {
      return '<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-all" data-topidx="' + i + '" role="button" tabindex="0">' +
        '<img src="' + esc(p.image.src) + '" alt="' + esc(p.image.alt || p.name) + '" class="w-14 h-12 rounded-lg object-cover shrink-0" loading="lazy" onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(p.name) + '/100/80\'" />' +
        '<div class="min-w-0">' +
          '<p class="font-semibold text-sm text-gray-900 truncate">' + esc(p.name) + '</p>' +
          '<p class="text-xs text-gray-500 capitalize">' + esc(p.category) + ' · ' + esc(p.distance) + '</p>' +
          '<p class="text-xs text-amber-600 font-medium">★ ' + esc(p.rating) + '</p>' +
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

    const altRow = ov.altitude ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Altitude</span><span class="font-medium">' + inr(ov.altitude) + ' m</span></div>' : '';

    const gems = pickUnderrated(places);
    const gemCards = gems.map(function (g) {
      const p = g.p, d = (p.description || '');
      return '<div class="card p-0 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all" data-uridx="' + g.idx + '" role="button" tabindex="0">' +
        '<div class="relative">' +
          '<img src="' + esc(p.image.src) + '" alt="' + esc(p.image.alt || p.name) + '" class="w-full h-28 object-cover" loading="lazy" onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(p.name) + '/400/300\'" />' +
          '<span class="absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-purple-700 shadow-sm">💎 Hidden gem</span>' +
        '</div>' +
        '<div class="p-3">' +
          '<div class="flex items-start justify-between gap-2"><p class="font-semibold text-sm text-gray-900 leading-snug">' + esc(p.name) + '</p>' +
            '<span class="text-xs text-amber-600 font-medium shrink-0">★ ' + esc(p.rating) + '</span></div>' +
          '<p class="text-xs text-gray-500 capitalize mb-1">' + esc(p.category) + ' · ' + esc(p.distance) + '</p>' +
          '<p class="text-xs text-gray-600 leading-relaxed">' + esc(d.slice(0, 88)) + (d.length > 88 ? '…' : '') + '</p>' +
        '</div></div>';
    }).join('');
    const gemsSection = gems.length ? (
      '<div class="mt-8">' +
        '<div class="flex items-center justify-between mb-1">' +
          '<h3 class="font-semibold text-gray-900 flex items-center gap-2">💎 Underrated Gems Nearby</h3>' +
          '<button type="button" class="text-sm text-primary font-semibold hover:underline" data-goto="places" data-gems-all="1">All places →</button>' +
        '</div>' +
        '<p class="text-sm text-gray-500 mb-4">Lesser-known spots around ' + esc(dest.title) + ' that most visitors miss — worth the detour.</p>' +
        '<div class="grid grid-cols-2 md:grid-cols-4 gap-3">' + gemCards + '</div>' +
      '</div>'
    ) : '';

    document.getElementById('panel-overview').innerHTML =
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +
        '<div class="lg:col-span-2 space-y-6">' +
          '<div><h2 class="text-xl font-bold text-gray-900 mb-3">About ' + esc(dest.title) + '</h2>' +
            '<p class="text-gray-600 leading-relaxed">' + esc(ov.description) + '</p></div>' +
          '<div><h3 class="font-semibold text-gray-900 mb-3">Known For</h3><div class="flex flex-wrap gap-2">' + features + '</div></div>' +
          '<div><div class="flex items-center justify-between mb-3"><h3 class="font-semibold text-gray-900">Top Places to Visit</h3>' +
            '<button class="text-sm text-primary font-semibold hover:underline" data-goto="places">See all →</button></div>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' + topPlaces + '</div></div>' +
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
              '<div class="flex justify-between text-sm"><span class="text-gray-500">Nearest Airport</span><span class="font-medium text-right text-xs max-w-36">' + esc(reach.nearestAirport.name) + ' (' + reach.nearestAirport.distance + ' km)</span></div>' +
              '<div class="flex justify-between text-sm"><span class="text-gray-500">Nearest Station</span><span class="font-medium text-right text-xs max-w-36">' + esc(reach.nearestRailway.name) + ' (' + reach.nearestRailway.distance + ' km)</span></div>' +
              '<div class="flex justify-between text-sm"><span class="text-gray-500">From Delhi</span><span class="font-medium">' + ov.distanceFromDelhi + ' km</span></div>' +
            '</div></div>' +
          '<div class="info-card"><div class="flex items-center justify-between mb-3"><h3 class="font-bold text-gray-900 text-sm uppercase tracking-wider">Stays From</h3>' +
            '<button class="text-xs text-primary font-semibold" data-goto="stays">View all</button></div>' +
            '<div class="space-y-2">' + staysFrom + '</div></div>' +
          '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4"><div class="flex items-start gap-2"><span class="text-lg shrink-0">⚠️</span>' +
            '<div><p class="font-semibold text-amber-900 text-sm mb-1">Road Note</p><p class="text-amber-800 text-xs leading-relaxed">' + esc(reach.roadNote) + '</p></div></div></div>' +
        '</div>' +
      '</div>' + gemsSection;

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
          '<img src="' + esc(p.image.src) + '" alt="' + esc(p.image.alt || p.name) + '" class="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(p.name) + '/200/150\'" /></div>' +
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
        const tags = (s.tags || []).map(function (t) { return '<span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">' + esc(t) + '</span>'; }).join('');
        const ams = (s.amenities || []).map(function (a) { return '<span class="amenity-chip">' + esc(a) + '</span>'; }).join('');
        const bookUrl = 'https://www.google.com/search?q=' + encodeURIComponent(s.name + ' ' + dest.title + ' hotel booking');
        return '<div class="card p-0"><div class="flex flex-col sm:flex-row">' +
          '<div class="sm:w-52 shrink-0 overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none relative">' +
            '<img src="' + esc(s.image.src) + '" alt="' + esc(s.image.alt || s.name) + '" class="w-full h-44 sm:h-full object-cover hover:scale-105 transition-transform" loading="lazy" onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(s.name) + '/300/200\'" />' +
            '<div class="absolute top-3 left-3"><span class="text-xs font-bold px-2.5 py-1 rounded-full ' + tierColor(s.tier) + '">' + (PRICE_TIERS[s.tier] ? PRICE_TIERS[s.tier].label : s.tier) + '</span></div>' +
          '</div>' +
          '<div class="flex-1 p-4 flex flex-col justify-between min-w-0"><div>' +
            '<div class="flex items-start justify-between gap-3 mb-2"><div><h3 class="font-bold text-gray-900">' + esc(s.name) + '</h3>' +
              '<p class="text-gray-500 text-xs capitalize mt-0.5">' + esc(s.type) + '</p></div>' +
              '<div class="text-right shrink-0"><span class="text-amber-400">★</span> <span class="font-bold text-sm">' + esc(s.rating) + '</span> <a href="https://www.google.com/search?q=' + encodeURIComponent(s.name + ' ' + dest.title + ' reviews') + '#lrd" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-primary text-xs underline" title="Read reviews of ' + esc(s.name) + '">(' + esc(s.reviews) + ')</a></div></div>' +
            '<div class="flex flex-wrap gap-1.5 mb-3">' + tags + '</div>' +
            '<div class="flex flex-wrap gap-1.5">' + ams + '</div></div>' +
            '<div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">' +
              '<div><span class="text-xl font-bold text-gray-900">₹' + inr(s.priceMin) + '</span><span class="text-gray-400 text-sm"> – ₹' + inr(s.priceMax) + '/night</span></div>' +
              '<a href="' + bookUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary text-sm px-5">Check Availability →</a>' +
            '</div></div></div></div>';
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
    const delhiCar = (routes.find(function (r) { return r.from === 'Delhi'; }) || {}).byCar || 'Via road';

    const cityOpts = '<option value="all">All cities</option>' + routes.map(function (r) {
      return '<option value="' + esc(r.from) + '"' + (reachCity === r.from ? ' selected' : '') + '>' + esc(r.from) + ' · ' + r.distance + ' km</option>';
    }).join('');

    const shown = routes.filter(function (r) { return reachCity === 'all' || r.from === reachCity; });
    const rows = shown.map(function (r) {
      return '<tr><td><span class="font-semibold text-gray-900">' + esc(r.from) + '</span></td>' +
        '<td><span class="font-medium text-primary">' + r.distance + ' km</span></td>' +
        '<td>' + esc(r.byCar) + '</td><td class="text-xs">' + esc(r.byTrain) + '</td>' +
        '<td class="text-xs">' + esc(r.byAir) + '</td><td class="text-xs text-gray-500">' + esc(r.via) + '</td></tr>';
    }).join('');

    document.getElementById('panel-reach').innerHTML =
      '<h2 class="text-xl font-bold text-gray-900 mb-2">How to Reach ' + esc(dest.title) + '</h2>' +
      '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">' +
        '<div class="info-card text-center"><div class="info-card-icon mx-auto">✈️</div><h3 class="font-bold text-sm mb-1">Nearest Airport</h3>' +
          '<p class="text-gray-600 text-sm">' + esc(reach.nearestAirport.name) + '</p><p class="text-primary font-semibold text-sm mt-1">' + reach.nearestAirport.distance + ' km away</p></div>' +
        '<div class="info-card text-center"><div class="info-card-icon mx-auto">🚂</div><h3 class="font-bold text-sm mb-1">Nearest Railway</h3>' +
          '<p class="text-gray-600 text-sm">' + esc(reach.nearestRailway.name) + '</p><p class="text-primary font-semibold text-sm mt-1">' + reach.nearestRailway.distance + ' km away</p></div>' +
        '<div class="info-card text-center"><div class="info-card-icon mx-auto">🚗</div><h3 class="font-bold text-sm mb-1">From Delhi</h3>' +
          '<p class="text-gray-600 text-sm">' + ov.distanceFromDelhi + ' km</p><p class="text-primary font-semibold text-sm mt-1">' + esc(delhiCar) + '</p></div>' +
      '</div>' +
      '<div class="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">' +
        '<div class="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">' +
          '<h3 class="font-bold text-gray-900 text-sm">Distance from Major Cities</h3>' +
          '<label class="flex items-center gap-2 text-xs text-gray-500">Show ' +
            '<select id="reachCity" class="form-input !py-1 !px-2 !text-xs rounded-lg border-gray-200" style="width:auto;display:inline-block">' + cityOpts + '</select>' +
          '</label>' +
        '</div>' +
        '<div class="overflow-x-auto"><table class="route-table"><thead><tr><th>From</th><th>Distance</th><th>By Road</th><th>By Train</th><th>By Air</th><th>Via</th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"><span class="text-xl shrink-0">⚠️</span>' +
        '<div><p class="font-semibold text-amber-900 text-sm mb-1">Road Advisory</p><p class="text-amber-800 text-sm">' + esc(reach.roadNote) + '</p></div></div>';

    const sel = document.getElementById('reachCity');
    if (sel) sel.addEventListener('change', function () { reachCity = sel.value; renderReach(); });
  }

  // ─── MAP ────────────────────────────────────────────────
  let mapReady = false;
  document.getElementById('mapName').textContent = dest.title;
  function initMap() {
    if (mapReady || typeof L === 'undefined') return;
    const c = coords || [20.5937, 78.9629];
    const map = L.map('leaflet-map').setView(c, 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    const icon = L.divIcon({ html: '<div style="background:#F97316;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>', className: '', iconAnchor: [7, 7] });
    L.marker(c, { icon }).addTo(map).bindPopup('<b>' + esc(dest.title) + '</b><br>' + esc(dest.state)).openPopup();
    mapReady = true;
    setTimeout(function () { map.invalidateSize(); }, 50);
  }

  // ─── Tab switching ──────────────────────────────────────
  function setTab(name) {
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      const on = b.getAttribute('data-tab') === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    ['overview', 'places', 'stays', 'reach', 'map'].forEach(function (n) {
      const panel = document.getElementById('panel-' + n);
      if (panel) panel.style.display = (n === name) ? 'block' : 'none';
    });
    const nav = document.querySelector('.sticky-dest-nav');
    window.scrollTo({ top: nav ? nav.offsetTop : 0, behavior: 'smooth' });
    if (name === 'map') initMap();
  }
  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); });
  });

  // ─── Render all panels ──────────────────────────────────
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
      latestWeather = { temp: temp, feels: feels, label: info[0], emoji: info[1],
                        humidity: cur.relative_humidity_2m, wind: Math.round(cur.wind_speed_10m) };
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
  const similar = idx.destinations.filter(function (d) { return d.slug !== dest.slug && d.type === dest.type; }).slice(0, 4);
  document.getElementById('similar-grid').innerHTML = similar.map(function (d) {
    return '<a href="' + destUrl(d.slug) + '" class="group block">' +
      '<div class="rounded-xl overflow-hidden aspect-video relative mb-2">' +
        '<img src="' + esc(d.image.src) + '" alt="' + esc(d.image.alt) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(d.slug) + '2/400/280\'" />' +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>' +
        '<div class="absolute bottom-2 left-2 right-2"><p class="text-white text-xs font-bold truncate">' + esc(d.title) + '</p><p class="text-white/70 text-xs">' + esc(d.state) + '</p></div>' +
      '</div>' +
      '<p class="font-semibold text-sm text-gray-900">' + esc(d.title) + '</p>' +
      '<p class="text-xs text-gray-500">From ₹' + inr(d.minPrice) + '/night</p></a>';
  }).join('');

  // ─── Nav buttons ────────────────────────────────────────
  document.getElementById('navBook').addEventListener('click', function () { setTab('stays'); });
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

  function refreshPlaceWeather() {
    const el = document.getElementById('placeWeather');
    if (!el || pModal.style.display === 'none') return;
    if (!latestWeather) { el.textContent = 'Loading…'; return; }
    const w = latestWeather;
    el.innerHTML = '<span class="text-xl mr-1">' + w.emoji + '</span>' +
      '<span class="font-bold text-gray-900">' + w.temp + '°C</span> · ' + w.label +
      ' · feels ' + w.feels + '°C · humidity ' + w.humidity + '% · wind ' + w.wind + ' km/h';
  }

  // ─── Place photos: baked p.photos first, live Wikimedia fallback ──
  function picsumSet(seed, n) {
    const a = [];
    for (let i = 0; i < n; i++) a.push('https://picsum.photos/seed/' + encodeURIComponent(seed) + (i || '') + '/800/520');
    return a;
  }
  function fetchPlacePhotos(p, cb) {
    // Prefer the real photos baked into the destination JSON — instant, accurate,
    // no live API call. Top up to 5 with picsum only if a place is sparse.
    if (Array.isArray(p.photos) && p.photos.length) {
      let pre = p.photos.slice(0, 8);
      if (pre.length < 5) pre = pre.concat(picsumSet(p.name, 5 - pre.length));
      cb(pre);
      return;
    }
    if (!fetchPlacePhotos._cache) fetchPlacePhotos._cache = {};
    const cache = fetchPlacePhotos._cache;
    const q = p.name + ' ' + dest.title;
    if (cache[q]) { cb(cache[q]); return; }
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search' +
      '&gsrsearch=' + encodeURIComponent(q) + '&gsrnamespace=6&gsrlimit=10' +
      '&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*';
    let done = false;
    const finish = function (arr) { if (done) return; done = true; cache[q] = arr; cb(arr); };
    // safety timeout -> fallback
    const t = setTimeout(function () { finish(picsumSet(p.name, 5)); }, 6000);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        clearTimeout(t);
        let urls = [];
        const pages = data && data.query && data.query.pages;
        if (pages) {
          Object.keys(pages).forEach(function (k) {
            const ii = pages[k].imageinfo && pages[k].imageinfo[0];
            if (!ii) return;
            const u = ii.thumburl || ii.url;
            if (u && /\.(jpg|jpeg|png)$/i.test(u)) urls.push(u);
          });
        }
        // always guarantee at least 5 by topping up with picsum
        if (urls.length < 5) urls = urls.concat(picsumSet(p.name, 5 - urls.length));
        finish(urls.slice(0, 8));
      })
      .catch(function () { clearTimeout(t); finish(picsumSet(p.name, 5)); });
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
        '" loading="lazy" onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(name) + i + '/800/520\'" /></div>';
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
}
