/**
 * explore.js — page logic for destinations.html (browse/filter/sort).
 * Loads lightweight manifest, manages filter state, renders cards with GSAP motion.
 */
import { fetchIndex } from '../data/api.js';
import { initLayout, setActiveNav } from '../components/layout.js';
import { destCardHTML } from '../components/destinationCard.js';
import { applySEO, injectJsonLd, breadcrumbJsonLd } from '../components/seo.js';
import { zoneOf, seasonsOf, ZONES, SEASONS } from '../data/taxonomy.js';
import { esc, inr } from '../utils/format.js';
import { icon } from '../components/icons.js';

initLayout({ active: 'destinations' });

applySEO({
  title: 'All Destinations — IndiaExplore | Complete Catalogue of Bharat',
  description: 'Browse 2,389 travel destinations across all 36 states & UTs of India. Filter by type, state, budget and travel month.',
  canonicalPath: 'destinations.html',
  keywords: ['india destinations', 'places to visit in india', 'india travel by budget', 'best travel months india'],
});

injectJsonLd(breadcrumbJsonLd([
  { name: 'Home', path: 'index.html' },
  { name: 'Destinations', path: 'destinations.html' },
]));

const idx = await fetchIndex();
const SUMMARIES = idx.destinations;
SUMMARIES.forEach((d, i) => { d._index = i; d._addedAt = d.addedAt || i; });
const { priceTiers: PRICE_TIERS, types: DESTINATION_TYPES, states: INDIA_STATES, months: MONTHS } = idx.meta;

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
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', filters.type === t.id ? 'true' : 'false');
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
    b.setAttribute('aria-selected', isAct ? 'true' : 'false');
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
  _cardScrollTriggers.forEach((st) => { try { st.kill(); } catch (_) {} });
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
}


function apply() {
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
    if (filters.type === 'road_trips') {
      results = results.filter(function (d) {
        return (d.type === 'adventure' || d.type === 'hill_station' || (d.features && d.features.some((f) => f.toLowerCase() === 'ghats'))) && d.type !== 'spiritual';
      });
    } else if (filters.type === 'camping') {
      results = results.filter(function (d) {
        return (d.features && d.features.some((f) => f.toLowerCase().includes('camp') || f.toLowerCase().includes('trek'))) || d.type === 'adventure';
      });
    } else if (filters.type === 'forts') {
      results = results.filter(function (d) {
        return d.features && d.features.some((f) => f.toLowerCase().includes('fort') || f.toLowerCase().includes('palace'));
      });
    } else if (filters.type === 'ecotourism') {
      results = results.filter(function (d) {
        return d.features && d.features.some((f) => f.toLowerCase().includes('nature') || f.toLowerCase().includes('birding') || f.toLowerCase().includes('eco'));
      });
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
  shown = PAGE_SIZE;
  renderBatch(false);

  syncFilterActive();
  renderActiveFilterChips();
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
    '<button type="button" data-key="' + item.key + '" aria-label="Remove filter">✕</button>' +
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
  searchTimer = setTimeout(apply, 150);
}

function resetFilters() {
  filters = { search: '', type: '', state: '', tier: '', month: null, region: '', season: '' };
  sortBy = 'rating';
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
  });
}

// ─── URL Parameters Handling ───────────────────────────
const params = new URLSearchParams(window.location.search);
if (params.get('search')) {
  filters.search = params.get('search');
  if (searchInput) searchInput.value = filters.search;
  toggleSearchClear();
}
if (params.get('type')) {
  const wantType = params.get('type');
  if (CATEGORY_FILTERS.some(function (t) { return t.id === wantType; })) filters.type = wantType;
}
if (params.get('state') && INDIA_STATES.indexOf(params.get('state')) >= 0) {
  filters.state = params.get('state');
  if (stateSel) stateSel.value = filters.state;
}
if (params.get('region') && ZONES.indexOf(params.get('region')) >= 0) filters.region = params.get('region');
if (params.get('season') && SEASONS.indexOf(params.get('season')) >= 0) filters.season = params.get('season');
if (params.get('month')) {
  const mo = parseInt(params.get('month'), 10);
  if (mo >= 1 && mo <= 12) { filters.month = mo; if (monthSel) monthSel.value = String(mo); }
}
if (params.get('maxPrice')) {
  const max = parseInt(params.get('maxPrice'), 10);
  if (!isNaN(max)) {
    const entry = Object.entries(PRICE_TIERS).find(function (e) { return e[1].min <= max && max <= e[1].max; }) ||
      Object.entries(PRICE_TIERS).sort(function (a, b) { return b[1].max - a[1].max; })[0];
    if (entry) filters.tier = entry[0];
  }
}

if (tierSel) tierSel.value = filters.tier;
if (regionSel) regionSel.value = filters.region;
if (seasonSel) seasonSel.value = filters.season;
if (monthSel) monthSel.value = filters.month ? String(filters.month) : '';

// Render category pill buttons with active state from URL / defaults
renderTypeButtons();

setActiveNav(filters.type ? 'destinations.html?type=' + filters.type : 'destinations.html');

// ─── Initial Render ────────────────────────────────────
apply();


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
