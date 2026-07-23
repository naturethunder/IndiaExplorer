/**
 * home.js — page logic for index.html.
 * Loads ONLY the lightweight manifest (data/destinations/index.json).
 */
import { fetchIndex } from '../data/api.js';
import { initLayout } from '../components/layout.js';
import { heroCardHTML, miniCardHTML, trendCardHTML, destUrl, cardThumb } from '../components/destinationCard.js';
import { applySEO, injectJsonLd, breadcrumbJsonLd } from '../components/seo.js';
import { esc, inr, typeLabel } from '../utils/format.js';
import { icon } from '../components/icons.js';
import { resolveState, MONTH_PICKS } from '../data/taxonomy.js';

initLayout({ active: 'home' });

applySEO({
  title: 'IndiaExplore — Discover Incredible India',
  description: "Discover India's most beautiful destinations. Search hotels by budget, explore places to visit, and plan your perfect India trip.",
  canonicalPath: 'index.html',
  keywords: ['india travel', 'india destinations', 'hill stations', 'beaches in india', 'india trip planner'],
});
injectJsonLd({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'IndiaExplore',
  url: new URL('index.html', window.location.href).href,
  potentialAction: {
    '@type': 'SearchAction',
    target: new URL('destinations.html', window.location.href).href + '?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
});
injectJsonLd(breadcrumbJsonLd([{ name: 'Home', path: 'index.html' }]));

// ─── Hero background ──────────────────────────────────────
// Runs BEFORE the manifest await so the LCP image starts downloading
// immediately instead of waiting behind the 2 MB JSON fetch+parse.
// Only backgroundImage is set on load — setting the `background` shorthand
// would reset background-size/repeat from the stylesheet and make an
// undersized photo tile.
(function () {
  const bg = document.getElementById('heroBg');
  if (!bg) return;
  const HERO_SRC = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2400&q=80';
  const img = new Image();
  img.onload = () => { bg.style.backgroundImage = 'url("' + HERO_SRC + '")'; };
  img.onerror = () => { bg.style.backgroundImage = 'linear-gradient(135deg,#0f3460,#16213e)'; };
  img.src = HERO_SRC;
  // instant fallback tone until the photo decodes (backgroundColor keeps cover/no-repeat intact)
  bg.style.backgroundColor = '#0f3460';
})();

let idx;
try {
  idx = await fetchIndex();
} catch (err) {
  // Chrome (navbar/footer) already mounted; show a minimal failure note
  // instead of a silently empty page.
  console.warn('[home] manifest failed to load:', err);
  const main = document.getElementById('main');
  if (main) main.insertAdjacentHTML('beforeend',
    '<p class="text-center text-gray-500 py-16">Couldn’t load destinations. Please refresh the page.</p>');
  throw err;
}
const summaries = idx.destinations;
const STATES = idx.meta.states;
const MONTHS = idx.meta.months || [];
const bySlug = new Map(summaries.map((d) => [d.slug, d]));

// Count destinations in a state (for the "view all in <state>" suggestion).
function stateCount(state) { return summaries.reduce((n, d) => n + (d.state === state ? 1 : 0), 0); }
function stateUrl(state) { return 'destinations.html?state=' + encodeURIComponent(state); }
function monthCount(m) { return summaries.reduce((n, d) => n + (d.bestTime.months.includes(m) ? 1 : 0), 0); }

function search(q) {
  q = q.toLowerCase();
  return summaries.filter((d) =>
    d.title.toLowerCase().includes(q) ||
    d.state.toLowerCase().includes(q) ||
    d.region.toLowerCase().includes(q) ||
    d.type.toLowerCase().includes(q) ||
    d.short.toLowerCase().includes(q) ||
    d.features.some((f) => f.toLowerCase().includes(q))
  );
}

// ─── Hero inline stats ────────────────────────────────────
(function () {
  const el = document.getElementById('hero-stats');
  if (!el) return;
  const stats = [
    { ic: 'map-pin', num: inr(idx.count || 2355) + '+', label: 'Destinations' },
    { ic: 'landmark', num: (STATES ? STATES.length : 35), label: 'States' },
    { ic: 'mountain', num: '13,800+', label: 'Places' },
    { ic: 'bed', num: '9,500+', label: 'Stays' },
  ];
  el.innerHTML = stats.map((s) =>
    '<span class="hero-stat">' +
    '<span class="hero-stat-icon">' + icon(s.ic, { size: 22 }) + '</span>' +
    '<span class="hero-stat-body"><strong>' + s.num + '</strong><span class="hero-stat-label">' + esc(s.label) + '</span></span>' +
    '</span>'
  ).join('');
})();

// ─── Popular searches chips ───────────────────────────────
(function () {
  const el = document.getElementById('popular-searches');
  if (!el) return;
  const picks = ['Manali', 'Goa', 'Kerala', 'Ladakh', 'Rajasthan', 'Darjeeling'];
  el.insertAdjacentHTML('beforeend', picks.map((p) => {
    const state = resolveState(p, STATES);
    const href = state ? stateUrl(state) : 'destinations.html?search=' + encodeURIComponent(p);
    return '<a href="' + href + '" class="popular-chip">' + esc(p) + '</a>';
  }).join(''));
})();


// ─── Category chips ───────────────────────────────────────
(function () {
  const el = document.getElementById('category-strip');
  if (!el) return;
  const cats = [
    { type: 'hill_station', ic: 'mountain', tint: 'tint-green', label: 'Mountains', badge: 'popular' },
    { type: 'beach', ic: 'waves', tint: 'tint-blue', label: 'Beaches', badge: 'popular' },
    { type: 'heritage', ic: 'landmark', tint: 'tint-orange', label: 'Heritage', badge: 'popular' },
    { type: 'wildlife', ic: 'paw-print', tint: 'tint-amber', label: 'Wildlife' },
    { type: 'adventure', ic: 'car', tint: 'tint-purple', label: 'Road Trips', badge: 'new', search: 'scenic', countKey: 'road_trips' },
    { type: 'spiritual', ic: 'temple', tint: 'tint-rose', label: 'Temples', badge: 'popular' },
    { type: 'adventure', ic: 'compass', tint: 'tint-teal', label: 'Adventure' },
    { type: 'adventure', ic: 'tent', tint: 'tint-slate', label: 'Camping', badge: 'new', search: 'camp', countKey: 'camping' },
  ];
  // Live per-type counts from the manifest.
  const counts = {};
  idx.destinations.forEach((d) => { counts[d.type] = (counts[d.type] || 0) + 1; });
  const customCounts = idx.meta.customCounts || { road_trips: 42, camping: 76 };
  el.innerHTML = cats.map((c) => {
    const n = c.countKey ? customCounts[c.countKey] : (counts[c.type] || 0);
    const badge = c.badge
      ? '<span class="category-chip-badge badge-' + c.badge + '">' + (c.badge === 'new' ? 'New' : 'Popular') + '</span>'
      : '';
    const href = c.search
      ? 'destinations.html?search=' + encodeURIComponent(c.search)
      : 'destinations.html?type=' + encodeURIComponent(c.type);
    return '<a href="' + href + '" class="category-chip">' +
      '<span class="category-chip-icon ' + c.tint + '">' + icon(c.ic, { size: 26 }) + badge + '</span>' +
      '<span class="category-chip-label">' + esc(c.label) + '</span>' +
      '<span class="category-chip-count">' + n + ' places</span>' +
      '</a>';
  }).join('');
})();

// ─── Search + autocomplete (combobox pattern) ─────────────
(function () {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');
  const drop = document.getElementById('autocomplete');
  if (!input || !btn || !drop) return;

  // ARIA combobox wiring + polite result announcements for screen readers.
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', 'autocomplete');
  input.setAttribute('aria-autocomplete', 'list');
  drop.setAttribute('role', 'listbox');
  const live = document.createElement('span');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  drop.parentElement.appendChild(live);

  let activeIdx = -1; // keyboard-highlighted option
  let searchTimer = null; // input debounce timer

  function close() {
    if (searchTimer) { clearTimeout(searchTimer); searchTimer = null; }
    drop.style.display = 'none';
    drop.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIdx = -1;
  }

  function options() { return Array.from(drop.querySelectorAll('a')); }

  function setActive(i) {
    const opts = options();
    if (!opts.length) return;
    activeIdx = (i + opts.length) % opts.length;
    opts.forEach((a, j) => {
      const active = j === activeIdx;
      a.classList.toggle('is-active', active);
      if (active) {
        input.setAttribute('aria-activedescendant', a.id);
      }
    });
    opts[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  function render(results) {
    const q = input.value.trim();
    const state = resolveState(q, STATES);
    let head = '';
    let optId = 0;
    // Typing a state name (even partial/misspelled) surfaces its whole listing first.
    if (state) {
      head = '<a href="' + stateUrl(state) + '" id="ac-opt-' + (optId++) + '" class="autocomplete-item font-semibold" role="option">' +
        '<span class="autocomplete-img flex items-center justify-center bg-emerald-50 text-primary">' + icon('map-pin', { size: 18 }) + '</span>' +
        '<div class="text-left flex-1 min-w-0">' +
        '<div class="font-bold text-gray-900 text-sm">All destinations in ' + esc(state) + '</div>' +
        '<div class="text-xs text-gray-500">' + stateCount(state) + ' places · view listing</div>' +
        '</div><span class="text-xs text-primary shrink-0">→</span></a>';
    }
    if (!results.length && !head) { close(); live.textContent = q ? 'No results' : ''; return; }
    let items = head + results.slice(0, 7).map(function (d) {
      const thumb = cardThumb(d);
      const currentId = optId++;
      return '<a href="' + destUrl(d.slug) + '" id="ac-opt-' + currentId + '" class="autocomplete-item" role="option">' +
        '<img src="' + esc(thumb) + '" alt="" class="autocomplete-img" loading="lazy" ' +
        'onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(d.slug) + '/80/60\'" />' +
        '<div class="text-left flex-1 min-w-0">' +
        '<div class="font-semibold text-gray-900 text-sm">' + esc(d.title) + '</div>' +
        '<div class="text-xs text-gray-500 truncate">' + esc(d.state) + ' · ' + esc((d.short || '').slice(0, 50)) + '...</div>' +
        '</div>' +
        '<span class="text-xs text-gray-500 shrink-0">From ₹' + esc(d.minPrice || 0) + '</span>' +
        '</a>';
    }).join('');
    items += '<a href="destinations.html" id="ac-opt-' + (optId++) + '" role="option" class="autocomplete-item justify-center text-sm font-semibold text-primary hover:bg-emerald-50 transition-colors">View all destinations →</a>';
    drop.innerHTML = items;
    drop.style.display = 'block';
    input.setAttribute('aria-expanded', 'true');
    activeIdx = -1;
    const n = results.length + (head ? 1 : 0);
    live.textContent = n + (n === 1 ? ' result' : ' results');
  }

  function onInput() {
    const q = input.value.trim();
    if (q.length < 1) { close(); return; }
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      render(search(q));
    }, 150);
  }
  function goToFirst() {
    const q = input.value.trim();
    const errorEl = document.getElementById('searchError');

    if (errorEl) {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    }

    if (!q) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a destination, state, or theme to search.';
        errorEl.classList.remove('hidden');
      }
      return;
    }

    // A state name routes straight to that state's listing (spec: "Goa" → all Goa).
    const state = resolveState(q, STATES);
    if (state) {
      window.location.href = stateUrl(state);
      return;
    }
    const match = search(q);
    if (match.length > 0) {
      window.location.href = destUrl(match[0].slug);
    } else {
      window.location.href = 'destinations.html?search=' + encodeURIComponent(q);
    }
  }

  input.addEventListener('input', onInput);
  input.addEventListener('focus', onInput);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === 'Enter') {
      const opts = options();
      if (activeIdx >= 0 && opts[activeIdx]) window.location.href = opts[activeIdx].href;
      else goToFirst();
    } else if (e.key === 'Escape') close();
  });
  btn.addEventListener('click', goToFirst);
  document.addEventListener('click', function (e) {
    if (!drop.contains(e.target) && e.target !== input && e.target !== btn) close();
  });
})();

// ─── Best this month — interactive monthly highlight section ──────
(function () {
  const railEl = document.getElementById('month-rail');
  const pillsEl = document.getElementById('monthPills');
  if (!railEl) return;

  const currentRealMonth = new Date().getMonth() + 1;
  let activeMonth = currentRealMonth;

  function renderMonthPills() {
    if (!pillsEl) return;
    pillsEl.innerHTML = MONTHS.map((m) => {
      const isActive = m.num === activeMonth;
      const isCurrent = m.num === currentRealMonth;
      const badge = isCurrent ? '<span class="pill-current-badge">NOW</span>' : '';
      return '<button type="button" class="month-pill ' + (isActive ? 'is-active' : '') + '" data-month="' + m.num + '">' +
        '<span>' + esc(m.name) + '</span>' + badge +
        '</button>';
    }).join('');

    pillsEl.querySelectorAll('.month-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const selected = parseInt(btn.dataset.month, 10);
        if (selected && selected !== activeMonth) {
          activeMonth = selected;
          renderMonthRail(activeMonth);
          renderMonthPills();
        }
      });
    });
  }

  function renderMonthRail(monthNum) {
    const m = MONTHS.find((x) => x.num === monthNum);
    const monthName = m ? m.name : 'This Month';
    const isCurrent = monthNum === currentRealMonth;

    const nameEl = document.getElementById('railMonthName');
    if (nameEl) nameEl.textContent = monthName;

    const btnNameEl = document.getElementById('railMonthBtnName');
    if (btnNameEl) btnNameEl.textContent = monthName;

    const subEl = document.getElementById('railMonthSub');
    if (subEl) {
      subEl.textContent = isCurrent
        ? 'Top recommended places to travel right now'
        : 'Top recommended places to travel in ' + monthName;
    }

    const allEl = document.getElementById('railMonthAll');
    if (allEl) allEl.href = 'destinations.html?month=' + monthNum;

    const featuredSlug = MONTH_PICKS[monthNum];
    const featured = featuredSlug ? bySlug.get(featuredSlug) : null;
    const rest = summaries
      .filter((d) => d.bestTime.months.includes(monthNum) && (!featured || d.slug !== featured.slug))
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || (b.rating || 0) - (a.rating || 0))
      .slice(0, featured ? 3 : 4);

    const picks = (featured ? [featured].concat(rest) : rest).slice(0, 4);

    railEl.style.opacity = '0.4';
    setTimeout(() => {
      railEl.innerHTML = picks.map((d) => trendCardHTML(d)).join('');
      railEl.style.opacity = '1';
    }, 120);

    renderMonthCarousel(monthNum);
  }

  let monthCarTimer = null;
  let currentCarIndex = 0;

  function renderMonthCarousel(monthNum) {
    const wrap = document.getElementById('month-carousel-wrap');
    const slidesEl = document.getElementById('month-carousel-slides');
    const dotsEl = document.getElementById('monthCarDots');
    if (!wrap || !slidesEl) return;

    const m = MONTHS.find((x) => x.num === monthNum);
    const monthName = m ? m.name : 'This Month';

    const top5 = summaries
      .filter((d) => d.bestTime.months.includes(monthNum))
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    if (!top5.length) {
      wrap.style.display = 'none';
      return;
    }
    wrap.style.display = 'block';

    slidesEl.innerHTML = top5.map((d, i) => {
      const src = (d.heroImage && d.heroImage.src) || (d.image && d.image.src) || '';
      return '<div class="month-car-slide ' + (i === 0 ? 'is-active' : '') + '" data-slide="' + i + '">' +
        '<img src="' + esc(src) + '" alt="' + esc(d.title) + '" loading="lazy" ' +
        'onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(d.slug) + '/1200/600\'" />' +
        '<div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"></div>' +
        '<div class="absolute top-4 left-4 z-20 pointer-events-none">' +
        '<span class="px-3.5 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg flex items-center gap-1.5">' +
        '🌟 Best in ' + esc(monthName) + ' · Photo ' + (i + 1) + ' of ' + top5.length +
        '</span>' +
        '</div>' +
        '<div class="absolute bottom-5 left-5 right-5 z-20 text-left pointer-events-auto">' +
        '<div class="flex items-center gap-2 mb-1.5">' +
        '<span class="px-2.5 py-0.5 rounded text-[11px] font-bold bg-primary text-white uppercase tracking-wider capitalize">' + esc(typeLabel(d.type)) + '</span>' +
        '<span class="text-amber-400 font-bold text-xs flex items-center gap-1">★ ' + esc(d.rating) + '</span>' +
        '</div>' +
        '<h3 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">' + esc(d.title) + ', ' + esc(d.state) + '</h3>' +
        '<p class="text-white/80 text-xs sm:text-sm max-w-xl mt-1 line-clamp-2">' + esc(d.short) + '</p>' +
        '<div class="mt-3 flex items-center gap-3">' +
        '<a href="destination.html?slug=' + encodeURIComponent(d.slug) + '" class="btn btn-primary btn-sm rounded-full px-5">Explore Destination →</a>' +
        '<a href="destinations.html?month=' + monthNum + '" class="btn btn-outline text-white border-white/40 hover:bg-white/20 btn-sm rounded-full">View All ' + esc(monthName) + ' Picks</a>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    if (dotsEl) {
      dotsEl.innerHTML = top5.map((_, i) => {
        return '<span class="month-car-dot ' + (i === 0 ? 'is-active' : '') + '" data-dot="' + i + '"></span>';
      }).join('');
    }

    currentCarIndex = 0;

    function goSlide(idx) {
      currentCarIndex = (idx + top5.length) % top5.length;
      const slides = slidesEl.querySelectorAll('.month-car-slide');
      const dots = dotsEl ? dotsEl.querySelectorAll('.month-car-dot') : [];
      slides.forEach((s, i) => s.classList.toggle('is-active', i === currentCarIndex));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === currentCarIndex));
    }

    function startCarTimer() {
      stopCarTimer();
      if (top5.length > 1) {
        monthCarTimer = setInterval(() => goSlide(currentCarIndex + 1), 4000);
      }
    }

    function stopCarTimer() {
      if (monthCarTimer) {
        clearInterval(monthCarTimer);
        monthCarTimer = null;
      }
    }

    const prevBtn = document.getElementById('monthCarPrev');
    const nextBtn = document.getElementById('monthCarNext');
    if (prevBtn) prevBtn.onclick = () => { goSlide(currentCarIndex - 1); startCarTimer(); };
    if (nextBtn) nextBtn.onclick = () => { goSlide(currentCarIndex + 1); startCarTimer(); };

    if (dotsEl) {
      dotsEl.querySelectorAll('.month-car-dot').forEach((dot) => {
        dot.onclick = () => {
          const idx = parseInt(dot.dataset.dot, 10);
          if (!isNaN(idx)) { goSlide(idx); startCarTimer(); }
        };
      });
    }

    wrap.onmouseenter = stopCarTimer;
    wrap.onmouseleave = startCarTimer;

    startCarTimer();
  }

  renderMonthPills();
  renderMonthRail(activeMonth);
})();


// ─── Explore India interactive map ────────────────────────
(async function () {
  const svgEl = document.getElementById('india-map');
  if (!svgEl) return;
  try {
    const { initIndiaMap } = await import('../components/indiaMap.js');
    const countByState = new Map();
    const destsByState = new Map();
    summaries.forEach((d) => {
      countByState.set(d.state, (countByState.get(d.state) || 0) + 1);
      if (!destsByState.has(d.state)) destsByState.set(d.state, []);
      destsByState.get(d.state).push(d);
    });
    destsByState.forEach((list) => {
      list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || (b.rating || 0) - (a.rating || 0));
    });
    initIndiaMap({ svgEl, countByState, destsByState, stateUrl });
  } catch (err) {
    // Map is progressive enhancement; hide its column cleanly if it fails.
    console.warn('[india-map] failed to init:', err);
    const wrap = svgEl.closest('.discover-map');
    if (wrap) wrap.style.display = 'none';
  }
})();

// ─── Trending carousel ────────────────────────────────────
(function () {
  const row = document.getElementById('trending-grid');
  if (!row) return;
  const trending = ['kanatal', 'manali', 'goa', 'coorg', 'udaipur', 'rishikesh', 'darjeeling', 'ladakh'];
  row.innerHTML = trending
    .map((slug) => { const d = bySlug.get(slug); return d ? trendCardHTML(d) : ''; })
    .join('');
  wireCarousel(row, document.getElementById('trend-prev'), document.getElementById('trend-next'));
})();

// ─── Travel this season ───────────────────────────────────
(function () {
  const el = document.getElementById('season-grid');
  if (!el) return;
  // Season → representative months, a fitting lead destination, and label.
  const seasons = [
    { name: 'Summer Escapes', range: 'March – June', ic: 'sun', months: [4, 5, 6], lead: ['goa', 'manali', 'ladakh'] },
    { name: 'Monsoon Magic', range: 'July – September', ic: 'cloud-rain', months: [7, 8, 9], lead: ['munnar', 'coorg', 'goa'] },
    { name: 'Winter Wonderland', range: 'October – February', ic: 'snowflake', months: [12, 1, 2], lead: ['manali', 'jaisalmer', 'udaipur'] },
    { name: 'Spring Blooms', range: 'February – March', ic: 'flower', months: [3, 4], lead: ['darjeeling', 'coorg', 'kanatal'] },
  ];
  el.innerHTML = seasons.map((s) => {
    const lead = s.lead.map((sl) => bySlug.get(sl)).find(Boolean) || summaries[0];
    const src = (lead && (lead.heroImage && lead.heroImage.src || lead.image && lead.image.src)) || '';
    const primaryMonth = s.months[0];
    return '<a href="destinations.html?month=' + primaryMonth + '" class="season-card group">' +
      '<img src="' + esc(src) + '" alt="' + esc(s.name) + ' in India" loading="lazy" ' +
      'onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(s.name) + '/480/320\'" />' +
      '<div class="season-card-overlay"></div>' +
      '<div class="absolute inset-0 p-5 flex flex-col justify-end">' +
      '<p class="text-white font-bold text-lg leading-tight">' + esc(s.name) + '</p>' +
      '<p class="text-white/80 text-sm mb-2">' + esc(s.range) + '</p>' +
      '<span class="season-explore">Explore ' +
      icon('arrow-right', { size: 15 }) + '</span>' +
      '</div>' +
      '</a>';
  }).join('');
})();

// ─── Browse by budget ─────────────────────────────────────
(function () {
  const el = document.getElementById('budget-grid');
  if (!el) return;
  const tiers = [
    { ic: 'tent', tint: 'tint-green', label: 'Budget', sub: 'under ₹2k', max: 2000 },
    { ic: 'bed', tint: 'tint-blue', label: 'Mid-Range', sub: '₹2k–5k', max: 5000 },
    { ic: 'wallet', tint: 'tint-amber', label: 'Premium', sub: '₹5k–12k', max: 12000 },
    { ic: 'gem', tint: 'tint-rose', label: 'Luxury', sub: '₹12k–25k', max: 25000 },
    { ic: 'crown', tint: 'tint-purple', label: 'Ultra Luxury', sub: '₹25k+', max: 30000 },
  ];
  el.innerHTML = tiers.map((t) =>
    '<a href="destinations.html?maxPrice=' + t.max + '" class="budget-card group">' +
    '<span class="w-11 h-11 rounded-full ' + t.tint + ' flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">' +
    icon(t.ic, { size: 22 }) + '</span>' +
    '<div class="font-bold text-sm text-gray-900">' + esc(t.label) + '</div>' +
    '<div class="text-xs text-gray-500 mt-1">' + esc(t.sub) + '</div>' +
    '</a>'
  ).join('');
})();

// ─── Hills grid (large cards) ─────────────────────────────
(function () {
  const el = document.getElementById('hills-grid');
  if (!el) return;
  el.innerHTML = ['kanatal', 'manali', 'darjeeling', 'munnar']
    .map((slug) => { const d = bySlug.get(slug); return d ? heroCardHTML(d) : ''; })
    .join('');
})();

// ─── Popular grid (large cards) ───────────────────────────
(function () {
  const el = document.getElementById('popular-grid');
  if (!el) return;
  el.innerHTML = ['goa', 'udaipur', 'rishikesh', 'coorg']
    .map((slug) => { const d = bySlug.get(slug); return d ? heroCardHTML(d) : ''; })
    .join('');
})();

// ─── Explore grid (small cards) ───────────────────────────
(function () {
  const el = document.getElementById('explore-grid');
  if (!el) return;
  el.innerHTML = ['goa', 'hampi', 'spiti', 'varanasi', 'munnar', 'jaisalmer']
    .map((slug) => { const d = bySlug.get(slug); return d ? miniCardHTML(d) : ''; })
    .join('');
})();

// ─── Hero social-proof avatars ────────────────────────────
(function () {
  const el = document.getElementById('heroAvatars');
  if (!el) return;
  const seeds = ['traveler1', 'traveler2', 'traveler3', 'traveler4'];
  el.innerHTML = seeds.map((s) =>
    '<img src="https://picsum.photos/seed/' + s + '/48/48" alt="" class="avatar-cluster-img" loading="lazy" />'
  ).join('');
})();

// ─── Snap-scroll carousel wiring (arrows + disabled state) ─
function wireCarousel(row, prevBtn, nextBtn) {
  if (!row || !prevBtn || !nextBtn) return;
  function pageWidth() {
    const first = row.firstElementChild;
    const cardW = first ? first.getBoundingClientRect().width : row.clientWidth * 0.8;
    return Math.max(cardW * 2, cardW + 24);
  }
  function update() {
    const maxScroll = row.scrollWidth - row.clientWidth - 2;
    prevBtn.disabled = row.scrollLeft <= 2;
    nextBtn.disabled = row.scrollLeft >= maxScroll;
  }
  prevBtn.addEventListener('click', () => row.scrollBy({ left: -pageWidth(), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => row.scrollBy({ left: pageWidth(), behavior: 'smooth' }));
  row.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// ─── Scroll-reveal (fade-up with 50ms stagger) ────────────
(function () {
  const els = Array.from(document.querySelectorAll('.reveal'));
  if (!els.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    let i = 0;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        setTimeout(() => el.classList.add('in-view'), (i++) * 50);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach((el) => io.observe(el));
})();
