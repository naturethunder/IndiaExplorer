/**
 * indiaMap.js — Interactive Luxury "Explore India" Atlas.
 * Renders state outlines as a vibrant, clean political SVG map with distinct
 * regional pastel and jewel color palettes, crisp borders, ocean styling,
 * and a compact, attractive floating destination card matching the exact design.
 *
 * Keyboard, screen-reader, and mobile touch accessible.
 */
import { INDIA_MAP } from '../../data/india-map.js';
import { esc } from '../utils/format.js';

// Curated regional color palette: harmonious pastel tones in light mode, luminous jewel tones in dark mode
export const STATE_THEME_COLORS = {
  // Northern India
  "Jammu & Kashmir": { light: "#DDD6FE", dark: "#6366F1" },
  "Ladakh": { light: "#D9F99D", dark: "#65A30D" },
  "Himachal Pradesh": { light: "#FBCFE8", dark: "#9D174D" },
  "Punjab": { light: "#FEF08A", dark: "#CA8A04" },
  "Chandigarh": { light: "#FDE047", dark: "#EAB308" },
  "Uttarakhand": { light: "#C4B5FD", dark: "#7C3AED" },
  "Haryana": { light: "#FED7AA", dark: "#EA580C" },
  "Delhi": { light: "#FECDD3", dark: "#E11D48" },

  // Western India
  "Rajasthan": { light: "#FBCFE8", dark: "#DB2777" },
  "Gujarat": { light: "#FED7AA", dark: "#D97706" },
  "Goa": { light: "#67E8F9", dark: "#0891B2" },
  "Dadra & Nagar Haveli": { light: "#A7F3D0", dark: "#059669" },
  "Daman & Diu": { light: "#FDBA74", dark: "#C2410C" },

  // Central India
  "Madhya Pradesh": { light: "#FEF08A", dark: "#CA8A04" },
  "Chhattisgarh": { light: "#E0E7FF", dark: "#4F46E5" },

  // Eastern India
  "Uttar Pradesh": { light: "#BBF7D0", dark: "#16A34A" },
  "Bihar": { light: "#FDE68A", dark: "#B45309" },
  "Jharkhand": { light: "#FBCFE8", dark: "#BE185D" },
  "Odisha": { light: "#FDE047", dark: "#D97706" },
  "West Bengal": { light: "#A7F3D0", dark: "#059669" },

  // Southern India
  "Maharashtra": { light: "#BBF7D0", dark: "#15803D" },
  "Karnataka": { light: "#FEF08A", dark: "#A16207" },
  "Telangana": { light: "#FBCFE8", dark: "#BE185D" },
  "Andhra Pradesh": { light: "#FED7AA", dark: "#EA580C" },
  "Kerala": { light: "#DDD6FE", dark: "#7C3AED" },
  "Tamil Nadu": { light: "#A7F3D0", dark: "#047857" },
  "Puducherry": { light: "#F472B6", dark: "#DB2777" },

  // North-East India
  "Sikkim": { light: "#FBCFE8", dark: "#C026D3" },
  "Assam": { light: "#FEF08A", dark: "#B45309" },
  "Arunachal Pradesh": { light: "#E0E7FF", dark: "#6D28D9" },
  "Nagaland": { light: "#FBCFE8", dark: "#9D174D" },
  "Manipur": { light: "#BBF7D0", dark: "#15803D" },
  "Mizoram": { light: "#FDA4AF", dark: "#9F1239" },
  "Tripura": { light: "#FED7AA", dark: "#C2410C" },
  "Meghalaya": { light: "#FDE68A", dark: "#D97706" },

  // Islands - vivid turquoise & cyan for high visibility in open waters
  "Andaman & Nicobar": { light: "#0284C7", dark: "#38BDF8" },
  "Lakshadweep": { light: "#0284C7", dark: "#38BDF8" }
};

// Ocean and sea body labels positioned in open water
const WATER_BODIES = [
  { name: "ARABIAN SEA", x: 60, y: 440, rotate: -25 },
  { name: "BAY OF BENGAL", x: 360, y: 390, rotate: 20 },
  { name: "INDIAN OCEAN", x: 205, y: 610, rotate: 0 }
];

export function initIndiaMap(opts) {
  const { svgEl, countByState, destsByState, stateUrl } = opts;
  if (!svgEl) return;

  const has = (name) => (countByState && countByState.get(name) || 0) > 0;

  // 1. Defs: Gradients and glow
  const defs = `
    <defs>
      <linearGradient id="compass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E5C07B" />
        <stop offset="100%" stop-color="#9A7B38" />
      </linearGradient>
    </defs>
  `;

  // 2. Neighboring lands (Sri Lanka island silhouette)
  const neighborLands = `
    <g class="map-neighbor-lands" pointer-events="none">
      <ellipse cx="254" cy="565" rx="13" ry="18" transform="rotate(15 254 565)" class="map-neighbor-land" />
      <text x="254" y="598" class="map-neighbor-text">SRI LANKA</text>
    </g>
  `;

  // 3. Water body typography layer (open waters only)
  const waterLabels = `
    <g class="map-water-layer" pointer-events="none">
      ${WATER_BODIES.map((w) =>
        `<text class="map-sea-text" x="${w.x}" y="${w.y}" transform="rotate(${w.rotate} ${w.x} ${w.y})">${w.name}</text>`
      ).join('')}
    </g>
  `;

  // 4. Prominent Island Territory Locator Tags (Andaman & Nicobar and Lakshadweep)
  const islandTags = `
    <g class="map-islands-labels" role="group" aria-label="Union Territory Island Groups">
      <g class="map-island-tag" data-state="Andaman & Nicobar" tabindex="0" role="button" aria-label="Andaman & Nicobar Islands, ${countByState ? (countByState.get('Andaman & Nicobar') || 0) : 0} destinations" style="cursor:pointer;">
        <rect x="390" y="402" width="164" height="20" rx="6" class="map-island-badge-bg" />
        <text x="472" y="416" text-anchor="middle" class="map-island-text">✦ ANDAMAN &amp; NICOBAR ✦</text>
        <line x1="472" y1="422" x2="470" y2="435" class="map-island-line" />
      </g>
      <g class="map-island-tag" data-state="Lakshadweep" tabindex="0" role="button" aria-label="Lakshadweep Islands, ${countByState ? (countByState.get('Lakshadweep') || 0) : 0} destinations" style="cursor:pointer;">
        <rect x="25" y="462" width="100" height="20" rx="6" class="map-island-badge-bg" />
        <text x="75" y="476" text-anchor="middle" class="map-island-text">✦ LAKSHADWEEP ✦</text>
        <line x1="88" y1="482" x2="96" y2="495" class="map-island-line" />
      </g>
    </g>
  `;

  // 5. State polygons: clean, uncluttered, vibrant regional colors
  const statePaths = INDIA_MAP.states.map((st) => {
    const active = has(st.name);
    const cls = 'india-state' + (active ? '' : ' is-empty');
    const colors = STATE_THEME_COLORS[st.name] || { light: '#BBF7D0', dark: '#CA8A04' };
    const styleAttr = `style="--state-light: ${colors.light}; --state-dark: ${colors.dark};"`;
    const count = countByState ? (countByState.get(st.name) || 0) : 0;
    const attrs = active
      ? ` tabindex="0" role="button" aria-label="${esc(st.name)}, ${count} destinations"`
      : ' aria-hidden="true"';
    return `<path class="${cls}" d="${st.path}" data-state="${esc(st.name)}" ${styleAttr}${attrs}><title>${esc(st.name)} (${count} destinations)</title></path>`;
  }).join('');

  // 6. Compass Rose Indicator in top-right
  const compassRose = `
    <g class="map-compass" transform="translate(485, 20)" pointer-events="none">
      <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.4" stroke-dasharray="2 2" />
      <polygon points="20,6 23,20 20,18" fill="url(#compass-grad)" />
      <polygon points="20,6 17,20 20,18" fill="#B38628" />
      <polygon points="20,34 23,20 20,22" fill="#B38628" opacity="0.6" />
      <polygon points="20,34 17,20 20,22" fill="#9A7B38" opacity="0.6" />
      <polygon points="34,20 20,23 22,20" fill="#B38628" opacity="0.6" />
      <polygon points="34,20 20,17 22,20" fill="#9A7B38" opacity="0.6" />
      <polygon points="6,20 20,23 18,20" fill="#B38628" opacity="0.6" />
      <polygon points="6,20 20,17 18,20" fill="#9A7B38" opacity="0.6" />
      <text x="20" y="2" text-anchor="middle" font-family="'Cinzel', serif" font-size="8" font-weight="800" fill="currentColor">N</text>
    </g>
  `;

  // Assemble full clean SVG content without visual clutter
  svgEl.setAttribute('viewBox', INDIA_MAP.viewBox);
  svgEl.setAttribute('role', 'group');
  svgEl.setAttribute('aria-label', 'Interactive Political Map of India — select any state to view its top destinations');
  svgEl.innerHTML = defs + neighborLands + waterLabels + islandTags +
                    `<g class="map-states-layer">${statePaths}</g>` +
                    compassRose;

  const host = svgEl.parentElement;

  // ── Small, Attractive State Popover Card ────────────────
  let card = host.querySelector('.india-map-card');
  if (!card) {
    card = document.createElement('div');
    card.className = 'india-map-card';
    host.appendChild(card);
  }

  function getCategoryIcon(type) {
    switch (type) {
      case 'hill_station': return '🏔️';
      case 'beach': return '🏖️';
      case 'heritage': return '🏰';
      case 'wildlife': return '🐅';
      case 'spiritual': return '🛕';
      case 'adventure': return '🧗';
      default: return '📍';
    }
  }

  function updateMapCard(stateName) {
    const list = destsByState && destsByState.get(stateName) ? destsByState.get(stateName) : [];
    const topDests = list.slice(0, 5);
    const href = stateUrl ? stateUrl(stateName) : 'destinations.html?state=' + encodeURIComponent(stateName);

    // Clean, small, and attractive card exactly matching user's reference
    let html = `<h3 class="map-card-title">${esc(stateName)}</h3>`;

    if (topDests.length > 0) {
      html += '<ul class="map-card-list">' +
        topDests.map((d) => `
          <li>
            <a href="destination.html?slug=${encodeURIComponent(d.slug)}">
              <span class="map-card-icon">${getCategoryIcon(d.type)}</span>
              <span class="truncate">${esc(d.title)}</span>
            </a>
          </li>
        `).join('') +
        '</ul>';
    } else {
      const count = (countByState && countByState.get(stateName)) || 0;
      html += `<p class="text-xs text-gray-500 my-2">${count} destinations available</p>`;
    }

    html += `<a href="${href}" class="map-card-all">View all destinations &rarr;</a>`;

    card.innerHTML = html;
  }

  function activateState(name) {
    if (!name) return;
    const allPaths = svgEl.querySelectorAll('.india-state');
    allPaths.forEach((p) => {
      const isTarget = p.getAttribute('data-state') === name;
      p.classList.toggle('is-active', isTarget);
    });
    updateMapCard(name);
  }

  // Initial state: Uttar Pradesh if present (matching user reference), else Rajasthan or first active
  const initialState = has('Uttar Pradesh') ? 'Uttar Pradesh' : (has('Rajasthan') ? 'Rajasthan' : (INDIA_MAP.states.find((s) => has(s.name))?.name || ''));
  if (initialState) {
    activateState(initialState);
  }

  // ── Hover & Mouse Events ────────────────────────────────
  svgEl.addEventListener('mousemove', (e) => {
    const el = e.target.closest('.india-state, .map-island-tag');
    if (!el || el.classList.contains('is-empty')) return;
    const name = el.getAttribute('data-state');
    activateState(name);
  });

  svgEl.addEventListener('focusin', (e) => {
    const el = e.target.closest('.india-state, .map-island-tag');
    if (!el || el.classList.contains('is-empty')) return;
    activateState(el.getAttribute('data-state'));
  });

  function go(state) {
    if (!has(state)) return;
    window.location.href = stateUrl ? stateUrl(state) : 'destinations.html?state=' + encodeURIComponent(state);
  }

  // On touch / click: activate first; if already active, navigate
  let lastClickedState = initialState;
  svgEl.addEventListener('click', (e) => {
    const el = e.target.closest('.india-state, .map-island-tag');
    if (!el || el.classList.contains('is-empty')) return;
    const name = el.getAttribute('data-state');
    if (name === lastClickedState) {
      go(name);
    } else {
      lastClickedState = name;
      activateState(name);
    }
  });

  svgEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const p = e.target.closest('.india-state');
    if (p && !p.classList.contains('is-empty')) {
      e.preventDefault();
      go(p.getAttribute('data-state'));
    }
  });
}
