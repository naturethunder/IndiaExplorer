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
 * Best available card image for a summary: the real baked Wikimedia hero
 * photo when present, else the picsum placeholder in image.src. (Every
 * summary's image.src is a picsum seed; real photos live in heroImage.)
 */
export function cardImg(d) {
  return (d.heroImage && d.heroImage.src) || (d.image && d.image.src) || '';
}

/**
 * Small-thumb variant of cardImg: downsizes Wikimedia thumb URLs
 * (/1280px-… → /320px-…) and picsum seeds (…/W/H → /160/160).
 */
export function cardThumb(d) {
  return cardImg(d)
    .replace(/\/(\d{3,4})px-([^/]+)$/, '/320px-$2')
    .replace(/\/\d+\/\d+$/, '/160/160');
}

/**
 * Premium overlay card (portrait 3/4) — used by the Trending carousel and the
 * "Best in <month>" grid. Image with amber ★ rating badge top-left, gradient
 * overlay bottom carrying name + "Best Time" green pill + ₹price chip.
 */
export function trendCardHTML(d) {
  const slug = encodeURIComponent(d.slug);
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="trend-card group">' +
    '<img src="' + esc(cardImg(d)) + '" alt="' + esc(d.image.alt) + '" loading="lazy" ' +
    'onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + slug + '2/400/540\'" />' +
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
  const slug = encodeURIComponent(d.slug);
  const style = opts.delay != null ? ' style="animation-delay:' + opts.delay + 's"' : '';
  const anim = opts.delay != null ? ' animate-fade-up' : '';
  const typeBadge = opts.variant === 'explore'
    ? '<div class="absolute top-3 right-3"><span class="badge bg-gray-900/50 backdrop-blur-sm text-white text-xs">' +
    (opts.typeIcon || '') + ' ' + esc(typeLabel(d.type)) + '</span></div>'
    : '';
  const feats = opts.variant === 'explore'
    ? '<div class="flex flex-wrap gap-1 mb-3">' +
    (d.features || []).slice(0, 3).map((f) => '<span class="amenity-chip">' + esc(f) + '</span>').join('') +
    '</div>'
    : '';
  const midRight = opts.variant === 'explore'
    ? '<span class="text-xs text-gray-500">' + esc(d.bestTime.label) + '</span>'
    : '<span class="text-xs font-medium text-gray-500">' + (d.distanceFromDelhi || 0) + ' km from Delhi</span>';
  const footLeft = opts.variant === 'explore'
    ? '<span class="text-xs text-gray-500">' + (d.distanceFromDelhi || 0) + ' km from Delhi</span>'
    : '<span class="text-xs text-gray-500">Best: ' + esc(d.bestTime.label) + '</span>';
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="card dest-card block' + anim + '"' + style + '>' +
    '<div class="dest-card-img-wrap">' +
    '<img src="' + esc(cardImg(d)) + '" alt="' + esc(d.image.alt) + '" class="card-img" loading="lazy" ' +
    'onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + slug + '2/400/280\'" />' +
    '<div class="dest-card-overlay"></div>' +
    '<div class="absolute top-3 left-3"><span class="badge bg-white/20 backdrop-blur-sm text-white border border-white/30 text-xs">' + esc(d.badge) + '</span></div>' +
    typeBadge +
    '<div class="absolute bottom-3 left-3 right-3">' +
    '<p class="text-white font-bold text-lg leading-tight">' + esc(d.title) + '</p>' +
    '<p class="text-white/80 text-xs">' + esc(d.state) + '</p>' +
    '</div>' +
    '</div>' +
    '<div class="p-4">' +
    '<div class="flex items-center justify-between mb-2">' +
    '<div class="flex items-center gap-1">' +
    '<span class="text-amber-400">' + icon('star', { size: 14, fill: true }) + '</span>' +
    '<span class="font-semibold text-sm">' + esc(d.rating) + '</span>' +
    '<span class="text-gray-500 text-xs">(' + inr(d.reviewCount) + ')</span>' +
    '</div>' +
    midRight +
    '</div>' +
    '<p class="text-gray-600 text-xs leading-relaxed line-clamp-2' + (opts.variant === 'explore' ? ' mb-3' : '') + '">' + esc(d.short) + '</p>' +
    feats +
    '<div class="flex items-center justify-between ' + (opts.variant === 'explore' ? 'pt-3' : 'mt-3 pt-3') + ' border-t border-gray-100">' +
    footLeft +
    '<span class="text-sm font-bold text-primary">From ₹' + inr(d.minPrice) + '</span>' +
    '</div>' +
    '</div>' +
    '</a>';
}

/** Large 16/9 hero card (home "Best Hill Stations"). */
export function heroCardHTML(d) {
  const slug = encodeURIComponent(d.slug);
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="card dest-card block group">' +
      '<div class="relative overflow-hidden" style="aspect-ratio:16/9; border-radius: var(--radius) var(--radius) 0 0;">' +
        '<img src="' + esc(d.heroImage.src) + '" alt="' + esc(d.heroImage.alt) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" ' +
             'onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + slug + '2/800/450\'" />' +
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
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="group block">' +
    '<div class="rounded-xl overflow-hidden aspect-square relative mb-2">' +
    '<img src="' + esc(cardImg(d)) + '" alt="' + esc(d.image.alt) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" ' +
    'onerror="this.onerror=null;this.src=\'https://picsum.photos/seed/' + encodeURIComponent(d.slug) + '2/400/400\'" />' +
    '<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>' +
    '<div class="absolute bottom-2 left-2 right-2">' +
    '<p class="text-white text-xs font-semibold truncate">' + esc(d.title) + '</p>' +
    '<p class="text-white/70 text-xs">' + esc(d.state) + '</p>' +
    '</div>' +
    '</div>' +
    '</a>';
}
