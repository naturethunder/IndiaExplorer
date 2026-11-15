/**
 * js/pages/restaurants.js
 * ============================================================
 * Restaurants & Dining Discovery Page Engine for ExploreDesh
 * Interactive Leaflet Mapping, Cuisine Filters, Pure Veg Toggle, & Luxury Cards
 *
 * Invariant: 100% Free, Zero Paid APIs, Zero Fabricated Data
 */

import { initLayout } from '../components/layout.js';
import { icon } from '../components/icons.js';
import { esc } from '../utils/format.js';

let allRestaurants = [];
let filteredRestaurants = [];
let activeCategory = 'all';
let activeCuisine = 'all';
let pureVegOnly = false;
let searchQuery = '';
let activeDestination = null;
let mapInstance = null;
let currentTileLayer = null;
let markersLayer = null;
let currentViewMode = 'split'; // 'list' | 'split' | 'map'

// Category Icons lookup
function getCategoryIcon(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('cafe')) return icon('coffee', { size: 14 });
  if (c.includes('dhaba')) return icon('flame', { size: 14 }) || icon('utensils', { size: 14 });
  if (c.includes('bakery')) return icon('cake', { size: 14 }) || icon('utensils', { size: 14 });
  return icon('utensils', { size: 14 });
}

// Clean placeholder SVG card for dining without photo
function renderCategoryPlaceholder(category) {
  const cat = esc(category || 'Restaurant');
  return `
    <div class="w-full h-36 rounded-xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-white/5 flex flex-col items-center justify-center gap-2 mb-3 select-none">
      <div class="w-12 h-12 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
        ${getCategoryIcon(category)}
      </div>
      <span class="text-xs font-semibold text-orange-300/80 tracking-wide uppercase">${cat}</span>
    </div>
  `;
}

// Extract slug from query param or pathname
function getRequestedSlug() {
  const params = new URLSearchParams(window.location.search);
  const qSlug = params.get('destination') || params.get('slug') || params.get('id');
  if (qSlug) return qSlug.toLowerCase().trim();

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const last = pathParts[pathParts.length - 1];
  if (pathParts.length >= 2 && pathParts[0] === 'restaurants' && last && !last.endsWith('.html')) {
    return last.toLowerCase().trim();
  }
  return null;
}

// Pure OpenStreetMap Standard & Humanitarian Tiles (100% Free, Zero API Key Required)
function applyMapTiles() {
  if (!mapInstance || typeof L === 'undefined') return;
  if (currentTileLayer) {
    try {
      mapInstance.removeLayer(currentTileLayer);
    } catch (_) { }
  }

  // Primary: Official OpenStreetMap Standard Tiles
  // Note: referrerPolicy: 'origin-when-cross-origin' is required by OSM Tile Usage Policy
  // to pass legitimate origin headers and prevent volunteer server 403 blocks.
  currentTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    crossOrigin: true,
    referrerPolicy: 'origin-when-cross-origin',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  });

  // Resilient fallback: If standard OSM volunteer server encounters high load or rate limits,
  // automatically failover to Humanitarian OpenStreetMap Team (HOT OSM) — also 100% Free, Zero API Key.
  currentTileLayer.on('tileerror', function () {
    if (!this._hasFallenBack) {
      this._hasFallenBack = true;
      try {
        mapInstance.removeLayer(this);
      } catch (_) { }
      currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        subdomains: 'abc',
        maxZoom: 19,
        crossOrigin: true,
        referrerPolicy: 'origin-when-cross-origin',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank" rel="noopener">Humanitarian OpenStreetMap Team</a>'
      }).addTo(mapInstance);
    }
  });

  currentTileLayer.addTo(mapInstance);
}

// Initialize Leaflet Map
function initLeafletMap(centerLat, centerLng) {
  if (typeof L === 'undefined') return;

  const mapContainer = document.getElementById('placesMap');
  if (!mapContainer) return;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    currentTileLayer = null;
  }

  mapInstance = L.map('placesMap', {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([centerLat, centerLng], 13);

  applyMapTiles();

  markersLayer = L.layerGroup().addTo(mapInstance);

  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 250);
}

// Update Map Markers for current filtered venues
function updateMapMarkers() {
  if (!mapInstance || !markersLayer || typeof L === 'undefined') return;

  markersLayer.clearLayers();
  const bounds = [];

  filteredRestaurants.forEach(venue => {
    if (venue.latitude == null || venue.longitude == null) return;

    const latLng = [venue.latitude, venue.longitude];
    bounds.push(latLng);

    const customIcon = L.divIcon({
      className: 'custom-pin-wrapper',
      html: `<div class="custom-pin-restro" title="${esc(venue.name)}">${icon('utensils', { size: 14 })}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });

    const googleDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`;

    const popupHtml = `
      <div style="min-width: 200px; padding: 4px;">
        <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #F97316; letter-spacing: 0.05em;">${esc(venue.category)}</span>
        <h4 style="margin: 4px 0 6px; font-size: 14px; font-weight: bold;">${esc(venue.name)}</h4>
        <p style="font-size: 12px; opacity: 0.8; margin-bottom: 8px;">${venue.distance_km ? `${venue.distance_km} km from destination center` : ''}</p>
        <a href="${googleDirUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-size: 11px; font-weight: bold; color: #FFFFFF; background: #EA580C; padding: 4px 10px; border-radius: 6px; text-decoration: none;">Get Directions ↗</a>
      </div>
    `;

    const marker = L.marker(latLng, { icon: customIcon })
      .bindPopup(popupHtml);

    markersLayer.addLayer(marker);
  });

  if (bounds.length > 0) {
    mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }
}

// Render venue cards
function renderCards() {
  const container = document.getElementById('venueCardList');
  const countEl = document.getElementById('resultsCount');
  if (!container) return;

  if (countEl) {
    countEl.textContent = `${filteredRestaurants.length} ${filteredRestaurants.length === 1 ? 'Eatery' : 'Eateries'} Available`;
  }

  if (filteredRestaurants.length === 0) {
    container.innerHTML = `
      <div class="place-venue-card text-center py-12">
        <div class="w-16 h-16 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3">
          ${icon('search', { size: 28 })}
        </div>
        <h3 class="text-lg font-bold text-white mb-1">No dining options match your criteria</h3>
        <p class="text-sm text-gray-400 mb-4">Try clearing the vegetarian filter or broadening search terms.</p>
        <button type="button" id="resetFiltersBtn" class="btn btn-primary text-xs px-4 py-2 font-bold">Reset Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        activeCategory = 'all';
        activeCuisine = 'all';
        pureVegOnly = false;
        searchQuery = '';
        const searchInput = document.getElementById('placesSearchInput');
        if (searchInput) searchInput.value = '';
        const vegToggle = document.getElementById('vegToggle');
        if (vegToggle) vegToggle.checked = false;
        applyFilters();
      });
    }
    return;
  }

  container.innerHTML = filteredRestaurants.map(r => {
    const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`;
    const callBtn = r.phone ? `
      <a href="tel:${esc(r.phone)}" class="venue-btn venue-btn-call" title="Call ${esc(r.name)}">
        ${icon('phone-call', { size: 14 })}
        <span>${esc(r.phone)}</span>
      </a>
    ` : '';
    const webBtn = r.website ? `
      <a href="${esc(r.website)}" target="_blank" rel="noopener noreferrer" class="venue-btn venue-btn-call" title="Visit website">
        ${icon('globe', { size: 14 })}
        <span>Website ↗</span>
      </a>
    ` : '';

    const cuisineHtml = (r.cuisine || []).slice(0, 3).map(c => `
      <span class="venue-tag-chip capitalize">${esc(c)}</span>
    `).join('');

    const vegBadge = r.is_pure_veg ? `
      <span class="venue-veg-badge">
        <span class="w-2 h-2 rounded-full bg-green-500"></span> Pure Veg
      </span>
    ` : '';

    return `
      <article class="place-venue-card" data-id="${esc(r.id)}">
        ${renderCategoryPlaceholder(r.category)}
        <div class="venue-card-header">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="venue-name">${esc(r.name)}</h3>
              ${vegBadge}
            </div>
            <p class="text-xs text-gray-400 mt-1">${esc(r.address || `${r.destination}, ${r.state}`)}</p>
          </div>
          <span class="venue-category-badge" style="color: #F97316; border-color: rgba(249, 115, 22, 0.3); background: rgba(249, 115, 22, 0.15);">${esc(r.category)}</span>
        </div>

        <div class="venue-meta-row">
          <span class="venue-distance">
            ${icon('map-pin', { size: 14 })}
            ${r.distance_km ? `${r.distance_km} km from center` : 'Central location'}
          </span>
          ${r.opening_hours ? `<span class="text-xs text-gray-400">${esc(r.opening_hours)}</span>` : ''}
        </div>

        ${cuisineHtml ? `<div class="venue-tags-row">${cuisineHtml}</div>` : ''}

        <div class="venue-actions-row">
          <div class="flex items-center gap-2 flex-wrap">
            ${callBtn}
            ${webBtn}
          </div>
          <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" class="venue-btn venue-btn-directions" style="border-color: rgba(249, 115, 22, 0.4); color: #F97316; background: rgba(249, 115, 22, 0.12);">
            <span>Get Directions</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </article>
    `;
  }).join('');

  // Add click to pan map
  container.querySelectorAll('.place-venue-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const id = card.getAttribute('data-id');
      const venue = filteredRestaurants.find(x => x.id === id);
      if (venue && mapInstance && venue.latitude && venue.longitude) {
        mapInstance.flyTo([venue.latitude, venue.longitude], 15, { duration: 1 });
      }
    });
  });
}

// Apply active filters
function applyFilters() {
  filteredRestaurants = allRestaurants.filter(r => {
    if (activeCategory !== 'all' && r.category.toLowerCase() !== activeCategory.toLowerCase()) {
      return false;
    }
    if (activeCuisine !== 'all') {
      if (!r.cuisine || !r.cuisine.includes(activeCuisine.toLowerCase())) return false;
    }
    if (pureVegOnly && !r.is_pure_veg) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchAddr = r.address && r.address.toLowerCase().includes(q);
      const matchCuisine = r.cuisine && r.cuisine.some(c => c.toLowerCase().includes(q));
      if (!matchName && !matchAddr && !matchCuisine) return false;
    }
    return true;
  });

  renderCards();
  updateMapMarkers();
}

// Render Destination Directory Picker when no single destination is requested
async function renderDirectoryView() {
  const container = document.getElementById('placesApp');
  if (!container) return;

  container.setAttribute('data-portal', 'restaurants');

  try {
    const res = await fetch('/data/restaurants/directory-index.json');
    if (!res.ok) throw new Error('Directory index not found');
    const indexData = await res.json();
    const destinations = indexData.destinations || [];

    // Dynamically compute unique states and destination counts per state
    const stateCounts = {};
    destinations.forEach(d => {
      if (d.state) {
        stateCounts[d.state] = (stateCounts[d.state] || 0) + 1;
      }
    });

    // Sorted states by destination count descending, then alphabetical
    const sortedStates = Object.keys(stateCounts).sort((a, b) => {
      if (stateCounts[b] !== stateCounts[a]) return stateCounts[b] - stateCounts[a];
      return a.localeCompare(b);
    });

    // Alphabetical states for select dropdown
    const alphaStates = [...sortedStates].sort((a, b) => a.localeCompare(b));

    let activeState = 'all';
    let searchQuery = '';
    let activeSort = 'count-desc';

    container.innerHTML = `
      <section class="places-hero">
        <h1 class="places-hero-title">
          <span class="gold-gradient-text" style="background: linear-gradient(135deg, #FFEDD5 0%, #FB923C 50%, #EA580C 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Dining &amp; Gastronomy</span>
        </h1>
        <p class="places-hero-subtitle">
          Discover regional dining rooms, artisanal cafes, traditional dhabas, and curated gastronomic experiences across India.
        </p>

        <!-- Directory Controls & Filters -->
        <div class="dir-controls-container">
          <!-- Top bar: Search + State Dropdown + Sort Toggle -->
          <div class="dir-controls-bar">
            <div class="dir-search-wrap">
              <span class="dir-search-icon">${icon('search', { size: 18 })}</span>
              <input type="text" id="dirSearchInput" class="dir-search-input" placeholder="Search destination or state (e.g. Manali, Goa, Jaipur, Varanasi)..." aria-label="Search destinations" />
              <button type="button" id="dirClearSearch" class="dir-clear-btn" aria-label="Clear search" style="display: none;">
                ${icon('x', { size: 16 })}
              </button>
            </div>

            <div class="dir-filter-group">
              <div class="dir-select-wrap">
                <label for="dirStateSelect" class="sr-only">Filter by State</label>
                <select id="dirStateSelect" class="dir-select dir-state-select" aria-label="Filter by state">
                  <option value="all">All States (${destinations.length})</option>
                  ${alphaStates.map(st => `<option value="${esc(st)}">${esc(st)} (${stateCounts[st]})</option>`).join('')}
                </select>
              </div>

              <div class="dir-select-wrap">
                <label for="dirSortSelect" class="sr-only">Sort Destinations</label>
                <select id="dirSortSelect" class="dir-select dir-sort-select" aria-label="Sort destinations">
                  <option value="count-desc">Sort: Most Venues</option>
                  <option value="name-asc">Sort: Alphabetical A-Z</option>
                  <option value="count-asc">Sort: Least Venues</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Luxury State Pills (Horizontal scrollable track) -->
          <div class="dir-state-pills-wrap" id="dirStatePills" role="tablist" aria-label="Filter by state">
            <button type="button" class="dir-state-pill active" data-state="all" role="tab" aria-selected="true">
              <span>All States</span>
              <span class="dir-pill-badge">${destinations.length}</span>
            </button>
            ${sortedStates.map(st => `
              <button type="button" class="dir-state-pill" data-state="${esc(st)}" role="tab" aria-selected="false">
                <span>${esc(st)}</span>
                <span class="dir-pill-badge">${stateCounts[st]}</span>
              </button>
            `).join('')}
          </div>

          <!-- Live Status Counter & Reset -->
          <div class="dir-status-bar">
            <span class="dir-counter" id="dirCounter" aria-live="polite">
              Showing <strong>${destinations.length}</strong> destinations across <strong>All States</strong>
            </span>
            <button type="button" id="dirResetBtn" class="dir-reset-btn" style="display: none;">
              ${icon('refresh', { size: 14 })} Reset Filters
            </button>
          </div>
        </div>

        <!-- Destination Cards Grid -->
        <div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left" id="dirGrid"></div>
      </section>
    `;

    function getFilteredList() {
      let list = destinations.filter(d => {
        if (activeState !== 'all' && d.state.toLowerCase() !== activeState.toLowerCase()) {
          return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = d.title.toLowerCase().includes(q);
          const matchState = d.state.toLowerCase().includes(q);
          if (!matchTitle && !matchState) return false;
        }
        return true;
      });

      if (activeSort === 'name-asc') {
        list.sort((a, b) => a.title.localeCompare(b.title));
      } else if (activeSort === 'count-asc') {
        list.sort((a, b) => a.count - b.count);
      } else {
        list.sort((a, b) => b.count - a.count);
      }
      return list;
    }

    function renderGrid() {
      const grid = document.getElementById('dirGrid');
      const counter = document.getElementById('dirCounter');
      const resetBtn = document.getElementById('dirResetBtn');
      const clearSearchBtn = document.getElementById('dirClearSearch');
      if (!grid) return;

      const filtered = getFilteredList();

      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'inline-flex' : 'none';
      }

      const isFiltered = activeState !== 'all' || searchQuery !== '' || activeSort !== 'count-desc';
      if (resetBtn) {
        resetBtn.style.display = isFiltered ? 'inline-flex' : 'none';
      }

      if (counter) {
        const stateLabel = activeState === 'all' ? 'All States' : activeState;
        if (searchQuery) {
          counter.innerHTML = `Showing <strong>${filtered.length}</strong> ${filtered.length === 1 ? 'destination' : 'destinations'} matching "<strong>${esc(searchQuery)}</strong>" across <strong>${esc(stateLabel)}</strong>`;
        } else {
          counter.innerHTML = `Showing <strong>${filtered.length}</strong> ${filtered.length === 1 ? 'destination' : 'destinations'} across <strong>${esc(stateLabel)}</strong>`;
        }
      }

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full text-center py-16 px-4">
            <div class="w-16 h-16 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4">
              ${icon('search', { size: 28 })}
            </div>
            <h3 class="text-xl font-bold text-white mb-2">No destinations found</h3>
            <p class="text-sm text-gray-400 max-w-md mx-auto mb-6">
              No destinations match your criteria in ${esc(activeState === 'all' ? 'any state' : activeState)}. Try selecting another state or clearing search filters.
            </p>
            <button type="button" class="btn btn-primary text-xs px-5 py-2.5 font-bold" id="dirEmptyResetBtn">
              Reset All Filters
            </button>
          </div>
        `;
        const emptyReset = document.getElementById('dirEmptyResetBtn');
        if (emptyReset) emptyReset.addEventListener('click', resetAll);
        return;
      }

      grid.innerHTML = filtered.map(d => `
        <a href="/restaurants?destination=${encodeURIComponent(d.slug)}" class="place-venue-card flex items-center justify-between group hover:border-orange-400/50">
          <div>
            <span class="text-xs uppercase tracking-wider text-orange-400/90 font-semibold">${esc(d.state)}</span>
            <h3 class="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">${esc(d.title)}</h3>
            <span class="text-xs text-gray-400 mt-1 inline-block">${d.count} Verified Dining Venues</span>
          </div>
          <span class="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 group-hover:translate-x-1 transition-all">
            ${icon('chevron-right', { size: 18 })}
          </span>
        </a>
      `).join('');
    }

    function setActiveState(st) {
      activeState = st;
      const stateSelect = document.getElementById('dirStateSelect');
      if (stateSelect) stateSelect.value = activeState;

      const pills = document.querySelectorAll('.dir-state-pill');
      pills.forEach(p => {
        const isMatch = p.getAttribute('data-state').toLowerCase() === activeState.toLowerCase();
        p.classList.toggle('active', isMatch);
        p.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        if (isMatch) {
          p.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        }
      });
      renderGrid();
    }

    function resetAll() {
      activeState = 'all';
      searchQuery = '';
      activeSort = 'count-desc';

      const searchInput = document.getElementById('dirSearchInput');
      if (searchInput) searchInput.value = '';

      const stateSelect = document.getElementById('dirStateSelect');
      if (stateSelect) stateSelect.value = 'all';

      const sortSelect = document.getElementById('dirSortSelect');
      if (sortSelect) sortSelect.value = 'count-desc';

      const pills = document.querySelectorAll('.dir-state-pill');
      pills.forEach(p => {
        const isAll = p.getAttribute('data-state') === 'all';
        p.classList.toggle('active', isAll);
        p.setAttribute('aria-selected', isAll ? 'true' : 'false');
      });

      renderGrid();
    }

    // Event Listeners
    const searchInput = document.getElementById('dirSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderGrid();
      });
    }

    const clearSearchBtn = document.getElementById('dirClearSearch');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        searchQuery = '';
        renderGrid();
      });
    }

    const stateSelect = document.getElementById('dirStateSelect');
    if (stateSelect) {
      stateSelect.addEventListener('change', (e) => {
        setActiveState(e.target.value);
      });
    }

    const sortSelect = document.getElementById('dirSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        activeSort = e.target.value;
        renderGrid();
      });
    }

    const pillsContainer = document.getElementById('dirStatePills');
    if (pillsContainer) {
      pillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.dir-state-pill');
        if (!pill) return;
        const targetState = pill.getAttribute('data-state') || 'all';
        setActiveState(targetState);
      });
    }

    const resetBtn = document.getElementById('dirResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetAll);
    }

    // Initial render
    renderGrid();

  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-20">
        <h2 class="text-xl font-bold text-white mb-2">Unable to load dining directory</h2>
        <p class="text-sm text-gray-400">${esc(err.message)}</p>
      </div>
    `;
  }
}

// Load specific destination restaurants
async function loadDestinationRestaurants(slug) {
  const container = document.getElementById('placesApp');
  if (!container) return;

  try {
    const res = await fetch(`/data/restaurants/${encodeURIComponent(slug)}.json`);
    if (!res.ok) throw new Error(`Restaurant data for ${slug} is currently being indexed.`);
    const data = await res.json();

    allRestaurants = (data.items || []).map(r => ({
      ...r,
      cuisine: Array.isArray(r.cuisine)
        ? r.cuisine
        : (typeof r.cuisine === 'string' ? r.cuisine.split(',').map(s => s.trim()).filter(Boolean) : [])
    }));
    filteredRestaurants = [...allRestaurants];
    activeDestination = data;

    // Get unique categories and cuisines
    const categories = Array.from(new Set(allRestaurants.map(r => r.category).filter(Boolean)));
    const allCuisinesList = Array.from(new Set(allRestaurants.flatMap(r => r.cuisine || []).filter(Boolean)));
    const hasPureVegVenues = allRestaurants.some(r => r.is_pure_veg);

    // Calculate center coords with destination-level fallback
    const avgLat = allRestaurants.length > 0
      ? (allRestaurants.reduce((s, r) => s + r.latitude, 0) / allRestaurants.length)
      : (data.coordinates?.lat ?? data.latitude ?? 20.5937);
    const avgLng = allRestaurants.length > 0
      ? (allRestaurants.reduce((s, r) => s + r.longitude, 0) / allRestaurants.length)
      : (data.coordinates?.lng ?? data.longitude ?? 78.9629);

    container.innerHTML = `
      <section class="places-hero">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs text-orange-400 font-semibold mb-3">
          <a href="/restaurants" class="hover:underline">Dining Directory</a> &middot; <span>${esc(data.state)}</span> &middot; <a href="/destination?slug=${esc(slug)}" class="hover:underline text-amber-300">View Destination Guide ↗</a>
        </div>
        <h1 class="places-hero-title">
          <span>Restaurants &amp; Cafes in</span> <span class="gold-gradient-text" style="background: linear-gradient(135deg, #FFEDD5 0%, #FB923C 50%, #EA580C 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${esc(data.destination)}</span>
        </h1>
        <p class="places-hero-subtitle">
          Discover ${allRestaurants.length} verified dining spots in ${esc(data.destination)}: dhabas, local specialties, artisanal cafes, and pure vegetarian options.
        </p>
      </section>

      <!-- Discovery Toolbar -->
      <div class="places-toolbar">
        <div class="places-toolbar-inner">
          <div class="places-search-box">
            <span class="places-search-icon">${icon('search', { size: 18 })}</span>
            <input type="text" id="placesSearchInput" class="places-search-input" placeholder="Search by restaurant name or cuisine..." />
          </div>

          <div class="flex items-center gap-3">
            ${hasPureVegVenues ? `
              <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-green-400 bg-green-500/10 px-3 py-2 rounded-full border border-green-500/30">
                <input type="checkbox" id="vegToggle" class="accent-green-500" />
                <span>Pure Veg Only</span>
              </label>
            ` : ''}
            <span id="resultsCount" class="text-xs font-semibold text-gray-400 hidden sm:inline">${allRestaurants.length} Venues Available</span>
            <div class="view-mode-toggle" role="group" aria-label="View layout switch">
              <button type="button" class="view-mode-btn" data-mode="list">${icon('book-open', { size: 14 })} List</button>
              <button type="button" class="view-mode-btn active" data-mode="split">${icon('map', { size: 14 })} Split</button>
              <button type="button" class="view-mode-btn" data-mode="map">${icon('compass', { size: 14 })} Map</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Category & Cuisine Filter Chips -->
      <div class="places-category-chips" id="categoryChips">
        <button type="button" class="chip-btn active" data-cat="all">All Eateries (${allRestaurants.length})</button>
        ${categories.map(c => {
      const count = allRestaurants.filter(r => r.category === c).length;
      return `<button type="button" class="chip-btn" data-cat="${esc(c)}">${esc(c)} (${count})</button>`;
    }).join('')}
        ${allCuisinesList.slice(0, 8).map(c => `
          <button type="button" class="chip-btn" data-cuisine="${esc(c)}">${esc(c)}</button>
        `).join('')}
      </div>

      <!-- Workspace Area -->
      <section class="places-workspace view-split" id="placesWorkspace" aria-label="Dining directory and interactive map">
        <div class="places-card-list" id="venueCardList"></div>
        <div class="places-map-sticky" id="mapWrapper">
          <div id="placesMap" role="region" aria-label="Interactive map showing restaurants and dining near selected destination"></div>
        </div>
      </section>
    `;

    // Initialize Map
    initLeafletMap(avgLat, avgLng);
    renderCards();
    updateMapMarkers();

    // Event listeners
    const searchInput = document.getElementById('placesSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        applyFilters();
      });
    }

    const vegToggle = document.getElementById('vegToggle');
    if (vegToggle) {
      vegToggle.addEventListener('change', (e) => {
        pureVegOnly = e.target.checked;
        applyFilters();
      });
    }

    const catChips = document.getElementById('categoryChips');
    if (catChips) {
      catChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip-btn');
        if (!btn) return;
        catChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (btn.hasAttribute('data-cuisine')) {
          activeCuisine = btn.getAttribute('data-cuisine') || 'all';
          activeCategory = 'all';
        } else {
          activeCategory = btn.getAttribute('data-cat') || 'all';
          activeCuisine = 'all';
        }
        applyFilters();
      });
    }

    // View Mode toggles
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        const workspace = document.getElementById('placesWorkspace');
        if (!workspace) return;

        workspace.classList.remove('view-list', 'view-split', 'view-map');
        workspace.classList.add(`view-${mode}`);
        currentViewMode = mode;

        if (mapInstance) {
          setTimeout(() => mapInstance.invalidateSize(), 200);
        }
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-20 px-4">
        <h2 class="text-2xl font-bold text-white mb-2">No restaurant records found for "${esc(slug)}"</h2>
        <p class="text-sm text-gray-400 max-w-md mx-auto mb-6">${esc(err.message)}</p>
        <a href="/restaurants" class="btn btn-primary text-xs px-5 py-2.5 font-bold">Back to Dining Directory</a>
      </div>
    `;
  }
}

// Main Page Initialization
export function initRestaurantsPage() {
  initLayout('restaurants');

  const slug = getRequestedSlug();
  if (slug) {
    loadDestinationRestaurants(slug);
  } else {
    renderDirectoryView();
  }
}

// Auto init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRestaurantsPage);
} else {
  initRestaurantsPage();
}

