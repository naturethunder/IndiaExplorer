/**
 * explore.js — page logic for destinations.html (browse/filter/sort).
 * Loads lightweight manifest, manages filter state, renders cards with GSAP motion.
 * Automatically synchronizes filter state with URL query parameters and sessionStorage
 * so that back button navigation, refreshes, and bookmarks preserve active filters.
 */
import { fetchIndex } from '../data/api.js';
import { initLayout, setActiveNav } from '../components/layout.js';
import { destCardHTML } from '../components/destinationCard.js';
import { applySEO, injectJsonLd, breadcrumbJsonLd, collectionPageJsonLd } from '../components/seo.js';
import { zoneOf, seasonsOf, ZONES, SEASONS, CUSTOM_TYPE_MATCHERS } from '../data/taxonomy.js';
import { esc, inr } from '../utils/format.js';
import { icon } from '../components/icons.js';

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

initLayout({ active: 'destinations' });

const idx = await fetchIndex();
const SUMMARIES = idx.destinations;
SUMMARIES.forEach((d, i) => { d._index = i; d._addedAt = d.addedAt || i; });
const { priceTiers: PRICE_TIERS, types: DESTINATION_TYPES, states: INDIA_STATES, months: MONTHS } = idx.meta;
const TYPE_SEO_LABELS = {
  hill_station: 'Hill Stations',
  beach: 'Beaches',
  heritage: 'Heritage Places',
  wildlife: 'Wildlife Destinations',
  spiritual: 'Spiritual Places',
  adventure: 'Adventure Destinations',
};
const INDEXABLE_TYPES = new Map(DESTINATION_TYPES.map(function (type) {
  return [type.id, TYPE_SEO_LABELS[type.id] || type.label];
}));

const CATEGORY_FILTERS = [
  { id: '', label: 'All Destinations', iconName: 'compass' },
  { id: 'hill_station', label: 'Hill Stations', iconName: 'mountain' },
  { id: 'beach', label: 'Beaches', iconName: 'waves' },
  { id: 'heritage', label: 'Heritage', iconName: 'landmark' },
  { id: 'wildlife', label: 'Wildlife', iconName: 'paw-print' },
  { id: 'spiritual', label: 'Spiritual', iconName: 'temple' },
  { id: 'adventure', label: 'Adventure', iconName: 'tent' },
  { id: 'road_trips', label: 'Road Trips', iconName: 'car' },
  { id: 'camping', label: 'Camping', iconName: 'tent' },
  { id: 'forts', label: 'Forts & Palaces', iconName: 'gem' },
  { id: 'ecotourism', label: 'Ecotourism', iconName: 'flower' },
];

const categoryIconMap = new Map(
  CATEGORY_FILTERS.filter((c) => c.id).map((c) => [c.id, icon(c.iconName, { size: 14 })])
);

// ─── Filter state ──────────────────────────────────────
let filters = { search: '', type: '', state: '', tier: '', month: null, region: '', season: '' };
let sortBy = 'rating';
let initialRestoredScrollY = 0;

const grid = document.getElementById('grid');
const noResults = document.getElementById('noResults');
const resultCount = document.getElementById('resultCount');
const toolbarCount = document.getElementById('toolbarCount');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const stateSel = document.getElementById('stateFilter');
const sortSel = document.getElementById('sortBy');
const tierSel = document.getElementById('tierFilter');
const regionSel = document.getElementById('regionFilter');
const seasonSel = document.getElementById('seasonFilter');
const monthSel = document.getElementById('monthFilter');
const typeWrap = document.getElementById('typeFilter');
const heroTitle = document.getElementById('explore-hero-title');
const heroDescription = document.getElementById('exploreHeroDescription');
const heroEyebrowText = document.querySelector('#heroEyebrow .eyebrow-txt');
const discoveryHeading = document.querySelector('.discovery-heading');

const BASE_SEO = {
  title: 'Places to Visit in India | ExploreDesh',
  description: 'Browse 2,388 places to visit across all 36 states and union territories of India, with seasonal guidance, stays and practical routes.',
  canonicalPath: 'destinations.html',
  heading: 'Places to Visit in India',
  subheading: 'Across 36 States & UTs',
};

function fullMonthName(monthNumber) {
  return new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date(2026, monthNumber - 1, 1));
}

function activeFilterCount() {
  return ['search', 'type', 'state', 'tier', 'month', 'region', 'season']
    .filter(function (key) { return Boolean(filters[key]); }).length + (sortBy !== 'rating' ? 1 : 0);
}

function landingSeo(resultLength) {
  const count = inr(resultLength);
  const activeCount = activeFilterCount();
  if (activeCount === 0) return { ...BASE_SEO, breadcrumb: 'Destinations' };

  if (activeCount === 1 && filters.state) {
    const state = filters.state;
    const stateSeo = {
      title: 'Places to Visit in ' + state + ' | ExploreDesh',
      description: 'Explore ' + count + ' places to visit in ' + state + ', with top attractions, best travel months, stays across budgets and practical route guides.',
      canonicalPath: 'destinations.html?state=' + encodeURIComponent(state),
      heading: 'Places to Visit in ' + state,
      subheading: count + ' Destination Guides',
      breadcrumb: state,
    };
    if (resultLength < 3) {
      stateSeo.canonicalPath = BASE_SEO.canonicalPath;
      stateSeo.robots = 'noindex, follow, max-image-preview:large';
      stateSeo.noSchema = true;
    }
    return stateSeo;
  }

  if (activeCount === 1 && filters.type && INDEXABLE_TYPES.has(filters.type)) {
    const label = INDEXABLE_TYPES.get(filters.type);
    return {
      title: 'Best ' + label + ' in India | ExploreDesh',
      description: 'Discover ' + count + ' of the best ' + label.toLowerCase() + ' in India, with destination guides, ideal travel months, stays and practical routes.',
      canonicalPath: 'destinations.html?type=' + encodeURIComponent(filters.type),
      heading: 'Best ' + label + ' in India',
      subheading: count + ' Destination Guides',
      breadcrumb: label,
    };
  }

  if (activeCount === 1 && filters.month) {
    const monthName = fullMonthName(filters.month);
    return {
      title: 'Best Places to Visit in ' + monthName + ' | ExploreDesh',
      description: 'Plan an India trip in ' + monthName + ' with ' + count + ' recommended destinations, seasonal highlights, stays across budgets and practical travel guides.',
      canonicalPath: 'destinations.html?month=' + filters.month,
      heading: 'Best Places to Visit in ' + monthName,
      subheading: count + ' Seasonal Picks Across India',
      breadcrumb: monthName + ' Travel',
    };
  }

  return {
    title: 'Filtered India Destinations | ExploreDesh',
    description: 'Refine destinations in India by state, category, travel month, season and budget.',
    canonicalPath: BASE_SEO.canonicalPath,
    heading: count + ' Matching Destinations',
    subheading: 'Refine Your India Trip',
    robots: 'noindex, follow, max-image-preview:large',
    noSchema: true,
  };
}

function applyLandingSeo(resultLength) {
  const seo = landingSeo(resultLength);
  applySEO({
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.canonicalPath,
    robots: seo.robots,
  });

  if (heroTitle) {
    heroTitle.innerHTML = '<span class="hero-line-1">' + esc(seo.heading) + '</span>' +
      '<span class="hero-line-2">' + esc(seo.subheading) + '</span>';
  }
  if (heroDescription) heroDescription.textContent = seo.description;
  if (heroEyebrowText) heroEyebrowText.textContent = seo.breadcrumb || 'Explore India by State, Style or Season';
  if (discoveryHeading) discoveryHeading.textContent = seo.heading;

  if (seo.noSchema) {
    injectJsonLd(null, 'explore-collection');
    injectJsonLd(null, 'explore-breadcrumb');
    return;
  }

  injectJsonLd(collectionPageJsonLd({
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.canonicalPath,
  }), 'explore-collection');
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Destinations', path: 'destinations.html' },
  ];
  if (seo.breadcrumb !== 'Destinations') crumbs.push({ name: seo.breadcrumb, path: seo.canonicalPath });
  injectJsonLd(breadcrumbJsonLd(crumbs), 'explore-breadcrumb');
}

// ─── Render Category Pill Buttons ──────────────────────
function renderTypeButtons() {
  if (!typeWrap) return;
  typeWrap.innerHTML = '';
  CATEGORY_FILTERS.forEach(function (t) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'category-pill-btn' + (filters.type === t.id ? ' active' : '');
    b.innerHTML = icon(t.iconName, { size: 14 }) + '<span>' + esc(t.label) + '</span>';
    b.dataset.type = t.id;
    b.setAttribute('aria-pressed', filters.type === t.id ? 'true' : 'false');
    b.addEventListener('click', function () {
      filters.type = t.id;
      apply();
      syncFilterActive();
    });
    typeWrap.appendChild(b);
  });
}

function syncFilterActive() {
  if (!typeWrap) return;
  Array.prototype.forEach.call(typeWrap.children, function (b) {
    const isAct = filters.type === (b.dataset.type || '');
    b.classList.toggle('active', isAct);
    b.setAttribute('aria-pressed', isAct ? 'true' : 'false');
  });
}

// ─── Hero Quick Tag Buttons ────────────────────────────
const quickTagsWrap = document.getElementById('heroQuickTags');
if (quickTagsWrap) {
  quickTagsWrap.querySelectorAll('button').forEach((btn) => {
    const category = CATEGORY_FILTERS.find((item) => item.id === btn.dataset.type);
    if (category) {
      btn.innerHTML = icon(category.iconName, { size: 16 }) + '<span>' + esc(category.label) + '</span>';
    }
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      if (type) {
        filters.type = type;
        apply();
        syncFilterActive();
        const discBar = document.getElementById('destDiscoveryBar');
        if (discBar) discBar.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ─── Populate Select Options ───────────────────────────
function addOptions(sel, items) {
  if (!sel) return;
  items.forEach(function (it) {
    const o = document.createElement('option');
    o.value = it.value;
    o.textContent = it.label;
    sel.appendChild(o);
  });
}

addOptions(tierSel, Object.entries(PRICE_TIERS).map(function (e) {
  return { value: e[0], label: e[1].label + (e[1].range ? ' (' + e[1].range + ')' : '') };
}));
addOptions(regionSel, ZONES.map(function (z) { return { value: z, label: z }; }));
addOptions(seasonSel, SEASONS.map(function (s) { return { value: s, label: s }; }));
addOptions(monthSel, MONTHS.map(function (m) { return { value: String(m.num), label: m.name }; }));

if (stateSel) {
  INDIA_STATES.forEach(function (s) {
    const o = document.createElement('option');
    o.value = s;
    o.textContent = s;
    stateSel.appendChild(o);
  });
}

if (tierSel) tierSel.addEventListener('change', function () { filters.tier = tierSel.value; apply(); });
if (regionSel) regionSel.addEventListener('change', function () { filters.region = regionSel.value; apply(); });
if (seasonSel) seasonSel.addEventListener('change', function () { filters.season = seasonSel.value; apply(); });
if (monthSel) monthSel.addEventListener('change', function () {
  filters.month = monthSel.value ? parseInt(monthSel.value, 10) : null;
  apply();
});

// ─── GSAP ScrollTrigger Card Reveal Engine ─────────────
const PAGE_SIZE = 60;
let shown = PAGE_SIZE;
let lastResults = [];
let _cardScrollTriggers = [];

function killCardTriggers() {
  _cardScrollTriggers.forEach((st) => { try { st.kill(); } catch (_) { } });
  _cardScrollTriggers = [];
}

function animateCardsIn(startIndex) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !window.gsap) return;

  const cardItems = Array.from(grid.querySelectorAll('.dest-card-item'));
  const items = cardItems.slice(startIndex, startIndex + PAGE_SIZE);
  if (!items.length) return;

  // Chunk into rows of 3 for row-by-row stagger reveal
  const chunkSize = 3;
  for (let i = 0; i < items.length; i += chunkSize) {
    const row = items.slice(i, i + chunkSize);

    // Set initial hidden state
    window.gsap.set(row, { opacity: 0, y: 32, scale: 0.97 });

    const st = window.ScrollTrigger
      ? window.gsap.to(row, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.055,
        ease: 'expo.out',
        clearProps: 'transform,scale,opacity',
        scrollTrigger: {
          trigger: row[0],
          start: 'top 92%',
          toggleActions: 'play none none none',
          once: true,
        },
      })
      : window.gsap.to(row, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.055,
        ease: 'expo.out',
        delay: (i / chunkSize) * 0.07,
        clearProps: 'transform,scale,opacity',
      });

    if (st && st.scrollTrigger) _cardScrollTriggers.push(st.scrollTrigger);
  }
}

function renderBatch(isAppend = false) {
  const previousShown = isAppend ? shown - PAGE_SIZE : 0;
  const slice = lastResults.slice(0, shown);

  // Kill stale scroll triggers before re-render
  if (!isAppend) killCardTriggers();

  grid.innerHTML = slice.map(function (d) {
    return destCardHTML(d, { variant: 'explore', typeIcon: categoryIconMap.get(d.type) || '' });
  }).join('');

  const moreWrap = document.getElementById('loadMoreWrap');
  if (moreWrap) moreWrap.style.display = shown < lastResults.length ? 'flex' : 'none';
  const moreCount = document.getElementById('loadMoreCount');
  if (moreCount) moreCount.textContent = Math.min(PAGE_SIZE, lastResults.length - shown);

  animateCardsIn(previousShown);
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
}

// ─── URL & State Synchronization ───────────────────────
function syncUrlAndState() {
  const p = new URLSearchParams();
  if (filters.search) p.set('search', filters.search);
  if (filters.type) p.set('type', filters.type);
  if (filters.state) p.set('state', filters.state);
  if (filters.region) p.set('region', filters.region);
  if (filters.tier) p.set('tier', filters.tier);
  if (filters.season) p.set('season', filters.season);
  if (filters.month) p.set('month', String(filters.month));
  if (sortBy && sortBy !== 'rating') p.set('sort', sortBy);

  const qs = p.toString();
  const currentQs = window.location.search.replace(/^\?/, '');
  const targetUrl = window.location.pathname + (qs ? '?' + qs : '');

  // Keep browser address bar synchronized with current active filters
  try {
    if (currentQs !== qs) {
      window.history.replaceState({ filters: { ...filters }, sortBy, shown, scrollY: window.scrollY }, '', targetUrl);
    }
  } catch (_) { }

  // Keep state in sessionStorage for instant restoration on Back button navigation
  try {
    sessionStorage.setItem('exploredesh_explore_state', JSON.stringify({
      filters: { ...filters },
      sortBy,
      shown,
      scrollY: window.scrollY,
      url: targetUrl,
      timestamp: Date.now()
    }));
  } catch (_) { }

  setActiveNav(filters.type ? 'destinations.html?type=' + filters.type : 'destinations.html');
}

function syncControlsFromFilters() {
  if (searchInput) {
    searchInput.value = filters.search || '';
    toggleSearchClear();
  }
  if (stateSel) stateSel.value = filters.state || '';
  if (regionSel) regionSel.value = filters.region || '';
  if (tierSel) tierSel.value = filters.tier || '';
  if (seasonSel) seasonSel.value = filters.season || '';
  if (monthSel) monthSel.value = filters.month ? String(filters.month) : '';
  if (sortSel) sortSel.value = sortBy || 'rating';
  syncFilterActive();
}

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  let hasUrlParams = false;

  const newFilters = { search: '', type: '', state: '', tier: '', month: null, region: '', season: '' };
  let newSortBy = 'rating';

  if (params.get('search') || params.get('q')) {
    newFilters.search = (params.get('search') || params.get('q') || '').trim();
    hasUrlParams = true;
  }
  if (params.get('type') || params.get('category')) {
    const wantType = params.get('type') || params.get('category');
    if (CATEGORY_FILTERS.some(function (t) { return t.id === wantType; })) {
      newFilters.type = wantType;
      hasUrlParams = true;
    }
  }
  if (params.get('state') && INDIA_STATES.indexOf(params.get('state')) >= 0) {
    newFilters.state = params.get('state');
    hasUrlParams = true;
  }
  if (params.get('region') && ZONES.indexOf(params.get('region')) >= 0) {
    newFilters.region = params.get('region');
    hasUrlParams = true;
  }
  if (params.get('season') && SEASONS.indexOf(params.get('season')) >= 0) {
    newFilters.season = params.get('season');
    hasUrlParams = true;
  }
  if (params.get('month')) {
    const mo = parseInt(params.get('month'), 10);
    if (mo >= 1 && mo <= 12) {
      newFilters.month = mo;
      hasUrlParams = true;
    }
  }
  if (params.get('tier') && PRICE_TIERS[params.get('tier')]) {
    newFilters.tier = params.get('tier');
    hasUrlParams = true;
  } else if (params.get('maxPrice')) {
    const max = parseInt(params.get('maxPrice'), 10);
    if (!isNaN(max)) {
      const entry = Object.entries(PRICE_TIERS).find(function (e) { return e[1].min <= max && max <= e[1].max; }) ||
        Object.entries(PRICE_TIERS).sort(function (a, b) { return b[1].max - a[1].max; })[0];
      if (entry) {
        newFilters.tier = entry[0];
        hasUrlParams = true;
      }
    }
  }
  if (params.get('sort') || params.get('sortBy')) {
    const s = params.get('sort') || params.get('sortBy');
    const validSorts = ['rating', 'latest', 'price_asc', 'price_desc', 'distance'];
    if (validSorts.indexOf(s) >= 0) {
      newSortBy = s;
      hasUrlParams = true;
    }
  }

  // If no params in URL, start with fresh clean filters and clear any stale session state
  if (!hasUrlParams) {
    try {
      sessionStorage.removeItem('exploredesh_explore_state');
    } catch (_) { }
  } else {
    // If URL has params, restore shown count and scroll position if available from the same active query
    try {
      const saved = sessionStorage.getItem('exploredesh_explore_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (Date.now() - (parsed.timestamp || 0) < 7200000)) {
          if (parsed.shown && parsed.shown > PAGE_SIZE) shown = parsed.shown;
          if (parsed.scrollY && parsed.scrollY > 0) initialRestoredScrollY = parsed.scrollY;
        }
      }
    } catch (_) { }
  }

  filters = newFilters;
  sortBy = newSortBy;
  syncControlsFromFilters();
}

function apply(options = {}) {
  const { skipUrlSync = false, preserveShown = false } = options;
  if (!preserveShown) shown = PAGE_SIZE;
  let results = SUMMARIES.slice();

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(function (d) {
      return d.title.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q) ||
        (d.region && d.region.toLowerCase().includes(q)) ||
        d.type.toLowerCase().includes(q) ||
        d.short.toLowerCase().includes(q) ||
        (d.features && d.features.some(function (f) { return f.toLowerCase().includes(q); }));
    });
  }

  if (filters.type) {
    if (CUSTOM_TYPE_MATCHERS[filters.type]) {
      results = results.filter(CUSTOM_TYPE_MATCHERS[filters.type]);
    } else {
      results = results.filter(function (d) { return d.type === filters.type; });
    }
  }

  if (filters.state) {
    results = results.filter(function (d) { return d.state === filters.state; });
  }
  if (filters.region) {
    results = results.filter(function (d) { return zoneOf(d.state) === filters.region; });
  }
  if (filters.season) {
    results = results.filter(function (d) {
      return (d.bestTime && d.bestTime.months) ? seasonsOf(d.bestTime.months).indexOf(filters.season) >= 0 : false;
    });
  }
  if (filters.month) {
    results = results.filter(function (d) {
      return (d.bestTime && d.bestTime.months) ? d.bestTime.months.includes(filters.month) : false;
    });
  }
  if (filters.tier) {
    results = results.filter(function (d) {
      return d.tiers && d.tiers.includes(filters.tier);
    });
  }

  if (sortBy === 'rating') results.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
  else if (sortBy === 'latest') results.sort(function (a, b) { return (b._addedAt || 0) - (a._addedAt || 0); });
  else if (sortBy === 'price_asc') results.sort(function (a, b) { return (a.minPrice || 0) - (b.minPrice || 0); });
  else if (sortBy === 'price_desc') results.sort(function (a, b) { return (b.minPrice || 0) - (a.minPrice || 0); });
  else if (sortBy === 'distance') results.sort(function (a, b) { return (a.distanceFromDelhi || 0) - (b.distanceFromDelhi || 0); });

  const countStr = inr(results.length);
  if (resultCount) resultCount.textContent = countStr;
  if (toolbarCount) toolbarCount.textContent = countStr;
  if (noResults) noResults.style.display = results.length === 0 ? 'block' : 'none';
  syncMobileFilterUI(results.length);

  lastResults = results;

  renderBatch(false);

  syncFilterActive();
  renderActiveFilterChips();

  if (!skipUrlSync) {
    syncUrlAndState();
  }
  applyLandingSeo(results.length);

  // Restore scroll position after initial rendering if requested
  if (initialRestoredScrollY > 0) {
    const targetY = initialRestoredScrollY;
    initialRestoredScrollY = 0;
    requestAnimationFrame(function () {
      setTimeout(function () {
        window.scrollTo({ top: targetY, behavior: 'instant' });
      }, 60);
    });
  }
}

function renderActiveFilterChips() {
  const container = document.getElementById('activeFiltersContainer');
  const chipsWrap = document.getElementById('activeFilterChips');
  if (!container || !chipsWrap) return;

  const activeItems = [];

  if (filters.search) {
    activeItems.push({ key: 'search', label: 'Search: "' + filters.search + '"' });
  }
  if (filters.type) {
    const cat = CATEGORY_FILTERS.find((c) => c.id === filters.type);
    activeItems.push({ key: 'type', label: 'Category: ' + (cat ? cat.label : filters.type) });
  }
  if (filters.state) {
    activeItems.push({ key: 'state', label: 'State: ' + filters.state });
  }
  if (filters.region) {
    activeItems.push({ key: 'region', label: 'Region: ' + filters.region });
  }
  if (filters.tier) {
    const tier = PRICE_TIERS[filters.tier];
    activeItems.push({ key: 'tier', label: 'Price: ' + (tier ? tier.label : filters.tier) });
  }
  if (filters.season) {
    activeItems.push({ key: 'season', label: 'Season: ' + filters.season });
  }
  if (filters.month) {
    const m = MONTHS.find((x) => x.num === filters.month);
    activeItems.push({ key: 'month', label: 'Travel Month: ' + (m ? m.name : 'Month ' + filters.month) });
  }

  if (!activeItems.length) {
    container.style.display = 'none';
    container.classList.add('hidden');
    chipsWrap.innerHTML = '';
    return;
  }

  container.style.display = '';
  container.classList.remove('hidden');

  chipsWrap.innerHTML = activeItems.map((item) =>
    '<span class="active-filter-chip">' +
    '<span>' + esc(item.label) + '</span>' +
    '<button type="button" data-key="' + item.key + '" aria-label="Remove filter: ' + esc(item.label) + '">✕</button>' +
    '</span>'
  ).join('');

  chipsWrap.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      if (key === 'search') { filters.search = ''; if (searchInput) searchInput.value = ''; toggleSearchClear(); }
      else if (key === 'type') { filters.type = ''; }
      else if (key === 'state') { filters.state = ''; if (stateSel) stateSel.value = ''; }
      else if (key === 'region') { filters.region = ''; if (regionSel) regionSel.value = ''; }
      else if (key === 'tier') { filters.tier = ''; if (tierSel) tierSel.value = ''; }
      else if (key === 'season') { filters.season = ''; if (seasonSel) seasonSel.value = ''; }
      else if (key === 'month') { filters.month = null; if (monthSel) monthSel.value = ''; }
      apply();
    });
  });
}

function toggleSearchClear() {
  if (!searchClear) return;
  searchClear.classList.toggle('hidden', !filters.search);
}

// Debounce free-text search
let searchTimer = null;
function applyDebounced() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(function () { apply(); }, 150);
}

function resetFilters() {
  filters = { search: '', type: '', state: '', tier: '', month: null, region: '', season: '' };
  sortBy = 'rating';
  shown = PAGE_SIZE;
  initialRestoredScrollY = 0;
  try {
    sessionStorage.removeItem('exploredesh_explore_state');
  } catch (_) { }
  if (searchInput) searchInput.value = '';
  toggleSearchClear();
  if (stateSel) stateSel.value = '';
  if (sortSel) sortSel.value = 'rating';
  if (tierSel) tierSel.value = '';
  if (regionSel) regionSel.value = '';
  if (seasonSel) seasonSel.value = '';
  if (monthSel) monthSel.value = '';
  apply();
}

// ─── Mobile filter drawer ──────────────────────────────
const sidebar = document.getElementById('filterSidebar');
const filterCountBadge = document.getElementById('filterCount');
const filterApplyCount = document.getElementById('filterApplyCount');
const filterOpenBtn = document.getElementById('filterOpen');

const quickIcon = document.querySelector('.quick-icon');
if (quickIcon) quickIcon.innerHTML = icon('sparkles', { size: 24 });

function setDrawer(open) {
  if (!sidebar) return;
  sidebar.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (filterOpenBtn) filterOpenBtn.setAttribute('aria-expanded', open ? 'true' : 'false');

  // a11y: hide background content from screen readers while the filter dialog is open
  const resultsSection = document.querySelector('.explore-results-section');
  const footer = document.getElementById('siteFooter');
  if (open) {
    if (resultsSection) resultsSection.setAttribute('aria-hidden', 'true');
    if (footer) footer.setAttribute('aria-hidden', 'true');
  } else {
    if (resultsSection) resultsSection.removeAttribute('aria-hidden');
    if (footer) footer.removeAttribute('aria-hidden');
  }

  if (open) {
    requestAnimationFrame(() => filterCloseBtn?.focus());
  } else {
    filterOpenBtn?.focus();
  }
}

function activeSidebarFilters() {
  return ['tier', 'state', 'region', 'season'].filter(function (k) { return filters[k]; }).length +
    (filters.month ? 1 : 0);
}

function syncMobileFilterUI(resultLen) {
  const n = activeSidebarFilters();
  if (filterCountBadge) {
    filterCountBadge.textContent = n;
    filterCountBadge.classList.toggle('hidden', n === 0);
  }
  if (filterApplyCount) filterApplyCount.textContent = inr(resultLen);
}

if (filterOpenBtn) filterOpenBtn.addEventListener('click', function () { setDrawer(true); });
const filterCloseBtn = document.getElementById('filterClose');
if (filterCloseBtn) filterCloseBtn.addEventListener('click', function () { setDrawer(false); });
const filterApplyBtn = document.getElementById('filterApply');
if (filterApplyBtn) filterApplyBtn.addEventListener('click', function () { setDrawer(false); });
if (sidebar) {
  sidebar.addEventListener('click', function (e) { if (e.target === sidebar) setDrawer(false); });
}
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) setDrawer(false);
  if (e.key === 'Tab' && sidebar && sidebar.classList.contains('open')) {
    const focusable = Array.from(sidebar.querySelectorAll('button, select, input, [href], [tabindex]:not([tabindex="-1"])'))
      .filter((el) => !el.disabled && el.getClientRects().length);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
  // Keyboard shortcut '/' to search
  if (e.key === '/' && document.activeElement !== searchInput && !['input', 'textarea', 'select'].includes(document.activeElement.tagName.toLowerCase())) {
    e.preventDefault();
    if (searchInput) searchInput.focus();
  }
});

// ─── Wire Controls ─────────────────────────────────────
if (searchInput) {
  searchInput.addEventListener('input', function () {
    filters.search = searchInput.value;
    toggleSearchClear();
    applyDebounced();
  });
}
if (searchClear) {
  searchClear.addEventListener('click', function () {
    filters.search = '';
    if (searchInput) searchInput.value = '';
    toggleSearchClear();
    apply();
    if (searchInput) searchInput.focus();
  });
}
if (stateSel) stateSel.addEventListener('change', function () { filters.state = stateSel.value; apply(); });
if (sortSel) sortSel.addEventListener('change', function () { sortBy = sortSel.value; apply(); });

const resetTop = document.getElementById('resetTop');
if (resetTop) resetTop.addEventListener('click', resetFilters);
const resetEmpty = document.getElementById('resetEmpty');
if (resetEmpty) resetEmpty.addEventListener('click', resetFilters);
const clearAllBtn = document.getElementById('clearAllFilters');
if (clearAllBtn) clearAllBtn.addEventListener('click', resetFilters);

const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', function () {
    shown += PAGE_SIZE;
    renderBatch(true);
    syncUrlAndState();
  });
}

// Preserve state and scroll position when clicking any destination card
if (grid) {
  grid.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (link) {
      try {
        sessionStorage.setItem('exploredesh_explore_state', JSON.stringify({
          filters: { ...filters },
          sortBy,
          shown,
          scrollY: window.scrollY,
          url: window.location.pathname + window.location.search,
          timestamp: Date.now()
        }));
      } catch (_) { }
    }
  });
}

window.addEventListener('beforeunload', function () {
  try {
    sessionStorage.setItem('exploredesh_explore_state', JSON.stringify({
      filters: { ...filters },
      sortBy,
      shown,
      scrollY: window.scrollY,
      url: window.location.pathname + window.location.search,
      timestamp: Date.now()
    }));
  } catch (_) { }
});

// Handle browser Back / Forward buttons without full reload
window.addEventListener('popstate', function () {
  readFiltersFromUrl();
  apply({ skipUrlSync: true, preserveShown: true });
});

// ─── Initial Load & Render ─────────────────────────────
readFiltersFromUrl();
renderTypeButtons();
apply({ preserveShown: true });

// ─── GSAP Motion Engine ────────────────────────────────
// Register ScrollTrigger immediately so card reveal works on first render
if (window.gsap && window.ScrollTrigger) {
  window.gsap.registerPlugin(window.ScrollTrigger);
}

function initGSAPAnimations() {
  if (!window.gsap) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  if (window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  // Hero entrance timeline
  const tl = window.gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('#heroEyebrow', { opacity: 0, y: -16, duration: 0.6 })
    .from('.explore-hero-display .hero-line-1', { opacity: 0, y: 30, duration: 0.8 }, '-=0.3')
    .from('.explore-hero-display .hero-line-2', { opacity: 0, y: 30, duration: 0.8 }, '-=0.6')
    .from('.explore-hero-desc', { opacity: 0, y: 20, duration: 0.7 }, '-=0.5')
    .from('.stat-metric-card', { opacity: 0, y: 20, stagger: 0.08, duration: 0.6 }, '-=0.5')
    .from('.hero-quick-card', { opacity: 0, x: 30, duration: 0.8 }, '-=0.7')
    .from('.explore-scroll-indicator', { opacity: 0, duration: 0.8 }, '-=0.4');

  // Animated number counter for hero statistics
  ['stat-destinations', 'stat-places', 'stat-stays', 'stat-states'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const targetVal = parseFloat(el.getAttribute('data-val') || el.textContent.replace(/,/g, ''));
    if (isNaN(targetVal)) return;

    const counterObj = { val: 0 };
    window.gsap.to(counterObj, {
      val: targetVal,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(counterObj.val).toLocaleString('en-IN');
      },
    });
  });

  // Parallax background scrolling
  if (window.ScrollTrigger && document.getElementById('exploreBg')) {
    window.gsap.to('#exploreBg', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
      },
    });
  }
}

// Run GSAP setup after initial DOM execution
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGSAPAnimations);
} else {
  setTimeout(initGSAPAnimations, 50);
}
