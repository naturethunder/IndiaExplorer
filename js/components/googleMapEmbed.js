/**
 * googleMapEmbed.js — Reusable Google Maps Embed component for ExploreDesh.
 *
 * Responsibilities:
 * - Generates Google Maps Embed iframe URL using known static coordinates.
 * - Supports official Maps Embed API v1 (when an API key is configured via param or window).
 * - Gracefully defaults to standard zero-key Google Maps embed URL when no key is present.
 * - Validates coordinates: never renders broken iframes for missing/NaN/0,0 coordinates.
 * - Provides an accessible, responsive, zero-layout-shift container (aspect-ratio 16:9).
 * - Enforces native iframe lazy loading (`loading="lazy"`).
 */
import { esc } from '../utils/format.js';

/**
 * Validates geographic coordinates.
 * @param {number|string} lat - Latitude
 * @param {number|string} lng - Longitude
 * @returns {boolean} True if coordinates are valid numbers and within valid bounds.
 */
export function isValidCoordinate(lat, lng) {
  if (lat == null || lng == null) return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return false;
  // Exclude null island (0, 0)
  if (Math.abs(numLat) < 0.0001 && Math.abs(numLng) < 0.0001) return false;
  // Standard latitude/longitude bounds
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) return false;
  return true;
}

/**
 * Retrieves the configured Google Maps Embed API key if one is defined in the runtime environment.
 * @returns {string} API key string or empty string.
 */
export function getGoogleMapsApiKey() {
  if (typeof window !== 'undefined') {
    if (window.GOOGLE_MAPS_EMBED_API_KEY) {
      return String(window.GOOGLE_MAPS_EMBED_API_KEY).trim();
    }
    if (window.__ENV__ && window.__ENV__.GOOGLE_MAPS_EMBED_API_KEY) {
      return String(window.__ENV__.GOOGLE_MAPS_EMBED_API_KEY).trim();
    }
  }
  return '';
}

/**
 * Builds the Google Maps Embed URL.
 *
 * @param {Object} opts
 * @param {string} opts.name - Destination name
 * @param {string} [opts.state] - State name
 * @param {number} opts.latitude - Destination latitude
 * @param {number} opts.longitude - Destination longitude
 * @param {number} [opts.zoom=12] - Optional zoom level (1-20)
 * @param {string} [opts.apiKey] - Optional explicit API key
 * @returns {string|null} The embed URL, or null if coordinates are invalid.
 */
export function buildGoogleMapEmbedUrl(opts) {
  const { name = '', state = '', latitude, longitude, zoom = 12, apiKey } = opts || {};
  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  const lat = Number(latitude).toFixed(6);
  const lng = Number(longitude).toFixed(6);
  const key = (apiKey || getGoogleMapsApiKey() || '').trim();

  // If a valid Google Cloud API key is configured, use the official Maps Embed API v1 (Place mode)
  if (key && key !== 'your_google_maps_embed_api_key_here') {
    const query = name ? `${name}, ${lat},${lng}` : `${lat},${lng}`;
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&zoom=${encodeURIComponent(zoom)}`;
  }

  // Zero-cost / zero-key standard Google Maps Embed URL:
  // Points directly to exact coordinates with search pin
  return `https://maps.google.com/maps?q=${encodeURIComponent(lat + ',' + lng)}&hl=en&z=${encodeURIComponent(zoom)}&output=embed`;
}

/**
 * Generates the accessible HTML string for the Google Maps Embed or a graceful fallback card.
 *
 * @param {Object} opts
 * @param {string} opts.name - Destination title
 * @param {string} [opts.state] - State title
 * @param {number} opts.latitude - Latitude
 * @param {number} opts.longitude - Longitude
 * @param {number} [opts.zoom=12] - Zoom level
 * @param {string} [opts.apiKey] - Optional API key
 * @param {string} [opts.className] - Optional custom CSS classes for the container
 * @returns {string} HTML string
 */
export function renderGoogleMapEmbed(opts) {
  const { name = 'Destination', state = '', latitude, longitude, zoom = 12, apiKey, className = '' } = opts || {};
  const embedUrl = buildGoogleMapEmbedUrl({ name, state, latitude, longitude, zoom, apiKey });

  const labelLocation = [name, state, 'India'].filter(Boolean).join(', ');
  const iframeTitle = `Map showing location of ${esc(labelLocation)}`;

  // Safe fallback UI when coordinates are not available
  if (!embedUrl) {
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(labelLocation)}`;
    return (
      '<div class="google-map-embed-fallback flex flex-col items-center justify-center p-8 rounded-2xl bg-white/5 border border-white/10 text-center ' + esc(className) + '" style="min-height: 360px">' +
        '<div class="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>' +
            '<circle cx="12" cy="10" r="3"></circle>' +
          '</svg>' +
        '</div>' +
        '<h3 class="text-lg font-bold text-white mb-1">' + esc(name) + ' Location</h3>' +
        '<p class="text-sm text-slate-400 max-w-md mb-4">Location coordinates are currently being updated for ' + esc(name) + (state ? ' (' + esc(state) + ')' : '') + '. You can view this destination directly on Google Maps.</p>' +
        '<a href="' + esc(searchUrl) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors">' +
          '<span>Search ' + esc(name) + ' on Google Maps</span>' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7"></path><path d="M7 7h10v10"></path></svg>' +
        '</a>' +
      '</div>'
    );
  }

  return (
    '<div class="google-map-embed-container relative w-full overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-slate-900 ' + esc(className) + '" style="aspect-ratio: 16 / 9; min-height: 480px; max-height: 600px;">' +
      '<iframe ' +
        'class="w-full h-full border-0 absolute inset-0" ' +
        'src="' + esc(embedUrl) + '" ' +
        'title="' + iframeTitle + '" ' +
        'aria-label="' + iframeTitle + '" ' +
        'width="100%" ' +
        'height="100%" ' +
        'style="border:0;" ' +
        'allowfullscreen="" ' +
        'loading="lazy" ' +
        'referrerpolicy="no-referrer-when-downgrade">' +
      '</iframe>' +
    '</div>'
  );
}

/**
 * Mounts the Google Maps Embed into a DOM container element.
 * Idempotent: will not mount repeatedly if already mounted.
 *
 * @param {HTMLElement|string} target - DOM element or selector
 * @param {Object} opts - Component options
 * @returns {HTMLElement|null} The mounted container
 */
export function mountGoogleMapEmbed(target, opts) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return null;

  // Prevent repeated re-initializations
  if (el.dataset.mapMounted === 'true') {
    return el;
  }

  el.innerHTML = renderGoogleMapEmbed(opts);
  el.dataset.mapMounted = 'true';
  return el;
}
