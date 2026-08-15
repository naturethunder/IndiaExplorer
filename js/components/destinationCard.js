/**
 * destinationCard.js — reusable destination card templates.
 * All take a SUMMARY record from data/destinations/index.json:
 *   { slug, title, state, region, type, badge, short, bestTime:{label,months},
 *     rating, reviewCount, minPrice, distanceFromDelhi, image:{src,alt},
 *     heroImage:{src,alt}, features, tiers }
 */
import { esc, inr, typeLabel } from '../utils/format.js';
import { icon } from './icons.js';

export function destUrl(slug) {
  return 'destination.html?slug=' + encodeURIComponent(slug);
}

/**
 * Best available real card image for a summary. Broken sources are handled by
 * the card's unavailable-photo state instead of an unrelated random fallback.
 */
export function cardImg(d) {
  if (!d) return '';
  function resolve(val) {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val.src === 'string') return val.src;
    if (val.src && typeof val.src.src === 'string') return val.src.src;
    return '';
  }
  return resolve(d.heroImage) || resolve(d.image) || '';
}

export function cardThumb(d) {
  const url = cardImg(d);
  if (!url) return '';
  return url
    .replace(/\/(\d{3,4})px-([^/]+)$/, '/400px-$2')
    .replace(/\/\d+\/\d+$/, '/200/200');
}

/**
 * Premium overlay card (portrait 3/4) — used by the Trending carousel and the
 * "Best in <month>" grid. Image with amber ★ rating badge top-left, gradient
 * overlay bottom carrying name + "Best Time" green pill + ₹price chip.
 */
export function trendCardHTML(d) {
  const image = cardImg(d);
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="trend-card group' + (image ? '' : ' image-unavailable') + '">' +
    (image ? '<img src="' + esc(image) + '" alt="' + esc((d.image && d.image.alt) || d.title) + '" loading="lazy" ' +
    'onerror="this.onerror=null;this.hidden=true;this.parentElement.classList.add(\'image-unavailable\')" />' : '') +
    '<div class="trend-card-overlay"></div>' +
    '<div class="absolute top-3 left-3">' +
    '<span class="rating-badge">' + icon('star', { size: 13, fill: true }) + esc(d.rating) + '</span>' +
    '</div>' +
    '<div class="absolute top-3 right-3">' +
    '<span class="pill-glass">' + esc(d.badge) + '</span>' +
    '</div>' +
    '<div class="absolute bottom-0 left-0 right-0 p-4">' +
    '<p class="text-white font-bold text-lg leading-tight">' + esc(d.title) + '</p>' +
    '<p class="text-white/80 text-xs mb-2.5">' + esc(d.state) + '</p>' +
    '<div class="flex items-center gap-2 flex-wrap">' +
    '<span class="pill-green">' + icon('calendar', { size: 12 }) + esc(d.bestTime.label) + '</span>' +
    '<span class="pill-glass">From ₹' + inr(d.minPrice) + '</span>' +
    '</div>' +
    '</div>' +
    '</a>';
}

/** Standard grid card. opts: { delay (s), typeIcon, variant: 'trending' | 'explore' } */
export function destCardHTML(d, opts = {}) {
  const image = cardImg(d);
  const style = opts.delay != null ? ' style="animation-delay:' + opts.delay + 's"' : '';
  const anim = opts.delay != null ? ' animate-fade-up' : '';
  const typeBadge = opts.variant === 'explore'
    ? '<div class="absolute top-3 right-3"><span class="badge text-xs px-2 py-0.5 rounded-full font-medium">' +
    (opts.typeIcon || '') + ' ' + esc(typeLabel(d.type)) + '</span></div>'
    : '';
  const feats = opts.variant === 'explore'
    ? '<div class="flex flex-wrap gap-1.5 mb-3">' +
    (d.features || []).slice(0, 3).map((f) => '<span class="amenity-chip">' + esc(f) + '</span>').join('') +
    '</div>'
    : '';
  const midRight = opts.variant === 'explore'
    ? '<span class="text-xs text-white/60 font-medium bg-white/6 px-2 py-0.5 rounded-md border border-white/8">' + esc(d.bestTime.label) + '</span>'
    : '<span class="text-xs font-medium text-white/60">' + (d.distanceFromDelhi || 0) + ' km from Delhi</span>';
  const footLeft = opts.variant === 'explore'
    ? '<span class="text-xs text-white/50 font-medium">' + (d.distanceFromDelhi || 0) + ' km from Delhi</span>'
    : '<span class="text-xs text-white/50 font-medium">Best: ' + esc(d.bestTime.label) + '</span>';
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="card dest-card block group' + anim + '"' + style + '>' +
    '<div class="dest-card-img-wrap relative overflow-hidden' + (image ? '' : ' image-unavailable') + '" style="aspect-ratio:16/10">' +
    (image ? '<img src="' + esc(image) + '" alt="' + esc((d.image && d.image.alt) || d.title) + '" class="card-img w-full h-full object-cover" loading="lazy" ' +
    'onerror="this.onerror=null;this.hidden=true;this.parentElement.classList.add(\'image-unavailable\')" />' : '') +
    '<div class="dest-card-overlay absolute inset-0"></div>' +
    (d.badge ? '<div class="absolute top-3 left-3"><span class="badge bg-emerald-500/90 backdrop-blur text-white border border-emerald-300/30 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">' + esc(d.badge) + '</span></div>' : '') +
    typeBadge +
    '<div class="absolute bottom-3 left-4 right-4">' +
    '<h3 class="text-white font-bold text-lg leading-snug tracking-tight drop-shadow-lg">' + esc(d.title) + '</h3>' +
    '<p class="text-white/70 text-xs font-medium tracking-wide mt-0.5">' + esc(d.state) + '</p>' +
    '</div>' +
    '</div>' +
    '<div class="p-4 flex flex-col justify-between flex-1">' +
    '<div class="flex items-center justify-between mb-2">' +
    '<div class="flex items-center gap-1.5">' +
    '<span class="text-amber-400 flex items-center">' + icon('star', { size: 14, fill: true }) + '</span>' +
    '<span class="font-bold text-sm text-white">' + esc(d.rating) + '</span>' +
    '<span class="text-white/40 text-xs">(' + inr(d.reviewCount) + ')</span>' +
    '</div>' +
    midRight +
    '</div>' +
    '<p class="text-white/60 text-xs leading-relaxed line-clamp-2' + (opts.variant === 'explore' ? ' mb-3' : '') + '">' + esc(d.short) + '</p>' +
    feats +
    '<div class="flex items-center justify-between ' + (opts.variant === 'explore' ? 'pt-3' : 'mt-3 pt-3') + ' border-t border-white/8">' +
    footLeft +
    '<span class="text-sm font-bold text-emerald-400 tracking-tight">From ₹' + inr(d.minPrice) + '</span>' +
    '</div>' +
    '</div>' +
    '</a>';
}

/** Large 16/9 hero card (home "Best Hill Stations"). */
export function heroCardHTML(d) {
  const image = cardImg(d);
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="card dest-card block group">' +
    '<div class="card-image-frame relative overflow-hidden' + (image ? '' : ' image-unavailable') + '" style="aspect-ratio:16/9; border-radius: var(--radius) var(--radius) 0 0;">' +
    (image ? '<img src="' + esc(image) + '" alt="' + esc((d.heroImage && d.heroImage.alt) || d.title) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" ' +
    'onerror="this.onerror=null;this.hidden=true;this.parentElement.classList.add(\'image-unavailable\')" />' : '') +
    '<div class="absolute top-3 left-3"><span class="badge bg-primary text-white text-[10px] sm:text-xs">' + esc(d.badge) + '</span></div>' +
    '</div>' +
    '<div class="p-3 bg-white flex flex-col gap-1">' +
    '<h3 class="text-gray-900 font-bold text-sm sm:text-base truncate leading-tight">' + esc(d.title) + ', ' + esc(d.state) + '</h3>' +
    '<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">' +
    '<span class="flex items-center gap-0.5">' +
    '<span class="text-amber-500">' + icon('star', { size: 12, fill: true }) + '</span>' +
    '<strong class="text-gray-900">' + esc(d.rating) + '</strong></span>' +
    '<span>(' + inr(d.reviewCount) + ')</span>' +
    '<span class="text-gray-300">|</span>' +
    '<span>' + esc(d.bestTime.label) + '</span>' +
    '</div>' +
    '<p class="text-gray-500 text-xs line-clamp-1 sm:line-clamp-2 leading-relaxed mt-0.5">' + esc(d.short) + '</p>' +
    '<div class="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1">' +
    '<span class="text-gray-400 text-[10px] uppercase font-semibold tracking-wider">' + (d.distanceFromDelhi || 0) + ' km from Delhi</span>' +
    '<span class="text-primary font-bold text-sm">₹' + inr(d.minPrice) + '</span>' +
    '</div>' +
    '</div>' +
    '</a>';
}

/** Small square card (home "Explore More" grid). */
export function miniCardHTML(d) {
  const image = cardImg(d);
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="group block">' +
    '<div class="card-image-frame rounded-xl overflow-hidden aspect-square relative mb-2' + (image ? '' : ' image-unavailable') + '">' +
    (image ? '<img src="' + esc(image) + '" alt="' + esc((d.image && d.image.alt) || d.title) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" ' +
    'onerror="this.onerror=null;this.hidden=true;this.parentElement.classList.add(\'image-unavailable\')" />' : '') +
    '<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>' +
    '<div class="absolute bottom-2 left-2 right-2">' +
    '<p class="text-white text-xs font-semibold truncate">' + esc(d.title) + '</p>' +
    '<p class="text-white/70 text-xs">' + esc(d.state) + '</p>' +
    '</div>' +
    '</div>' +
    '</a>';
}
