/**
 * indiaMap.js — Interactive Luxury "Explore India" Atlas.
 * Renders state outlines as a vibrant, clean political SVG map with distinct
 * regional pastel and jewel color palettes, crisp borders, ocean styling,
 * and a compact, attractive floating destination card matching the exact design.
 *
 * Keyboard, screen-reader, and mobile touch accessible.
 */
import { INDIA_MAP } from '../../data/india-map.js?v=20260930_phase80';
import { esc } from '../utils/format.js';

// Curated regional color palette: vibrant, high-contrast, cartographic tones where no adjacent states share the same color
export const STATE_THEME_COLORS = {
  // Northern India
  "Jammu & Kashmir": { light: "#BAE6FD", dark: "#0284C7" },
  "Ladakh": { light: "#FEF08A", dark: "#B45309" },
  "Himachal Pradesh": { light: "#FECDD3", dark: "#E11D48" },
  "Punjab": { light: "#FDE047", dark: "#CA8A04" },
  "Chandigarh": { light: "#FCD34D", dark: "#D97706" },
  "Uttarakhand": { light: "#E9D5FF", dark: "#9333EA" },
  "Haryana": { light: "#FDBA74", dark: "#EA580C" },
  "Delhi": { light: "#FDA4AF", dark: "#BE123C" },

  // Western India
  "Rajasthan": { light: "#FDE68A", dark: "#D97706" },
  "Gujarat": { light: "#FED7AA", dark: "#C2410C" },
  "Goa": { light: "#67E8F9", dark: "#0891B2" },
  "Dadra & Nagar Haveli": { light: "#A7F3D0", dark: "#059669" },
  "Daman & Diu": { light: "#FDBA74", dark: "#C2410C" },

  // Central India
  "Madhya Pradesh": { light: "#DDD6FE", dark: "#7C3AED" },
  "Chhattisgarh": { light: "#BFDBFE", dark: "#2563EB" },

  // Eastern India
  "Uttar Pradesh": { light: "#BBF7D0", dark: "#16A34A" },
  "Bihar": { light: "#FED7AA", dark: "#EA580C" },
  "Jharkhand": { light: "#FBCFE8", dark: "#BE185D" },
  "Odisha": { light: "#FDE68A", dark: "#D97706" },
  "West Bengal": { light: "#99F6E4", dark: "#0D9488" },

  // Southern India
  "Maharashtra": { light: "#A7F3D0", dark: "#059669" },
  "Karnataka": { light: "#FEF08A", dark: "#CA8A04" },
  "Telangana": { light: "#F5D0FE", dark: "#C026D3" },
  "Andhra Pradesh": { light: "#FED7AA", dark: "#EA580C" },
  "Kerala": { light: "#A7F3D0", dark: "#059669" },
  "Tamil Nadu": { light: "#DDD6FE", dark: "#7C3AED" },
  "Puducherry": { light: "#F472B6", dark: "#DB2777" },

  // North-East India
  "Sikkim": { light: "#FBCFE8", dark: "#C026D3" },
  "Assam": { light: "#FDE68A", dark: "#D97706" },
  "Arunachal Pradesh": { light: "#E9D5FF", dark: "#7C3AED" },
  "Nagaland": { light: "#FECDD3", dark: "#E11D48" },
  "Manipur": { light: "#BBF7D0", dark: "#16A34A" },
  "Mizoram": { light: "#FDA4AF", dark: "#BE123C" },
  "Tripura": { light: "#FED7AA", dark: "#EA580C" },
  "Meghalaya": { light: "#99F6E4", dark: "#0D9488" },

  // Islands
  "Andaman & Nicobar": { light: "#0284C7", dark: "#38BDF8" },
  "Lakshadweep": { light: "#0284C7", dark: "#38BDF8" }
};

// Ocean and sea body labels positioned in open water
const WATER_BODIES = [
  { name: "ARABIAN SEA", x: 60, y: 470, rotate: -25 },
  { name: "BAY OF BENGAL", x: 360, y: 390, rotate: 20 },
  { name: "INDIAN OCEAN", x: 205, y: 595, rotate: 0 }
];

// Verified interior label coordinates for prominent cartographic state visibility
export const STATE_LABELS = [
  { name: "Ladakh", label: "LADAKH", x: 171, y: 88, size: 8.5 },
  { name: "Jammu & Kashmir", label: "JAMMU & KASHMIR", x: 136, y: 112, size: 6.5 },
  { name: "Himachal Pradesh", label: "HIMACHAL", x: 180, y: 142, size: 6.5 },
  { name: "Punjab", label: "PUNJAB", x: 146, y: 162, size: 7 },
  { name: "Haryana", label: "HARYANA", x: 161, y: 191, size: 6.5 },
  { name: "Uttarakhand", label: "UTTARAKHAND", x: 215, y: 174, size: 6.5 },
  { name: "Rajasthan", label: "RAJASTHAN", x: 118, y: 240, size: 9.5 },
  { name: "Gujarat", label: "GUJARAT", x: 76, y: 310, size: 8.5 },
  { name: "Madhya Pradesh", label: "MADHYA PRADESH", x: 198, y: 285, size: 9 },
  { name: "Uttar Pradesh", label: "UTTAR PRADESH", x: 240, y: 234, size: 9 },
  { name: "Bihar", label: "BIHAR", x: 332, y: 256, size: 8 },
  { name: "Jharkhand", label: "JHARKHAND", x: 332, y: 293, size: 7.5 },
  { name: "West Bengal", label: "WEST BENGAL", x: 376, y: 290, size: 6.5 },
  { name: "Odisha", label: "ODISHA", x: 310, y: 350, size: 8.5 },
  { name: "Chhattisgarh", label: "CHHATTISGARH", x: 267, y: 338, size: 7.5 },
  { name: "Maharashtra", label: "MAHARASHTRA", x: 158, y: 368, size: 9.5 },
  { name: "Telangana", label: "TELANGANA", x: 212, y: 400, size: 7.5 },
  { name: "Andhra Pradesh", label: "ANDHRA PRADESH", x: 229, y: 437, size: 8 },
  { name: "Karnataka", label: "KARNATAKA", x: 160, y: 456, size: 8.5 },
  { name: "Tamil Nadu", label: "TAMIL NADU", x: 201, y: 524, size: 8.5 },
  { name: "Kerala", label: "KERALA", x: 164, y: 535, size: 6.5 },
  { name: "Assam", label: "ASSAM", x: 462, y: 244, size: 8 },
  { name: "Arunachal Pradesh", label: "ARUNACHAL", x: 498, y: 213, size: 6.5 },
  { name: "Sikkim", label: "SIKKIM", x: 384, y: 221, size: 5.5 },
  { name: "Meghalaya", label: "MEGHALAYA", x: 436, y: 259, size: 5.5 },
  { name: "Nagaland", label: "NAGALAND", x: 495, y: 249, size: 5.5 },
  { name: "Manipur", label: "MANIPUR", x: 484, y: 273, size: 5.5 },
  { name: "Mizoram", label: "MIZORAM", x: 464, y: 300, size: 5.5 },
  { name: "Tripura", label: "TRIPURA", x: 442, y: 292, size: 5.5 },
  { name: "Delhi", label: "DELHI", x: 175.6, y: 201.7, size: 5.5 },
  { name: "Goa", label: "GOA", x: 120.9, y: 444.9, size: 5.5 }
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
      <text x="254" y="588" class="map-neighbor-text">SRI LANKA</text>
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

  // 4. Prominent Island Territory Locator Tags (Offshore groups: Andaman & Nicobar and Lakshadweep)
  const islandTags = `
    <g class="map-islands-labels" role="group" aria-label="Union Territory Island Groups">
      <g class="map-island-tag" data-state="Andaman & Nicobar" tabindex="0" role="button" aria-label="Andaman &amp; Nicobar Islands, ${countByState ? (countByState.get('Andaman & Nicobar') || 0) : 0} destinations" style="cursor:pointer;">
        <rect x="382" y="444" width="156" height="22" rx="6" class="map-island-badge-bg" />
        <text x="460" y="458.5" text-anchor="middle" class="map-island-text">✦ ANDAMAN &amp; NICOBAR ✦</text>
        <line x1="466" y1="466" x2="466" y2="475" class="map-island-line" />
        <rect x="445" y="473" width="45" height="133" rx="8" class="map-archipelago-frame" />
      </g>
      <g class="map-island-tag" data-state="Lakshadweep" tabindex="0" role="button" aria-label="Lakshadweep Islands, ${countByState ? (countByState.get('Lakshadweep') || 0) : 0} destinations" style="cursor:pointer;">
        <rect x="25" y="492" width="100" height="20" rx="6" class="map-island-badge-bg" />
        <text x="75" y="506" text-anchor="middle" class="map-island-text">✦ LAKSHADWEEP ✦</text>
        <line x1="88" y1="512" x2="97" y2="520" class="map-island-line" />
        <rect x="86" y="515" width="24" height="52" rx="6" class="map-archipelago-frame" />
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

  // 6. State Names Typography Layer: Crisp, high-contrast labels on every state
  const stateLabels = `
    <g class="map-labels-layer" pointer-events="none" aria-hidden="true">
      ${STATE_LABELS.map((lbl) => `
        <text class="map-state-label" x="${lbl.x}" y="${lbl.y}" font-size="${lbl.size}" text-anchor="middle" dominant-baseline="central">${esc(lbl.label)}</text>
      `).join('')}
    </g>
  `;

  // 7. Compass Rose Indicator in top-right
  const compassRose = `
    <g class="map-compass" transform="translate(480, 52)" pointer-events="none">
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

  // Assemble full clean SVG content: states layer, state typography layer, locator tags, compass
  svgEl.setAttribute('viewBox', INDIA_MAP.viewBox);
  svgEl.setAttribute('role', 'group');
  svgEl.setAttribute('aria-label', 'Interactive Political Map of India — select any state to view its top destinations');
  svgEl.innerHTML = defs + neighborLands + waterLabels + islandTags +
                    `<g class="map-states-layer">${statePaths}</g>` +
                    stateLabels +
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
    const allTargets = svgEl.querySelectorAll('.india-state, .map-island-tag');
    allTargets.forEach((p) => {
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
