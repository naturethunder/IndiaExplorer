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

export function cardThumb(d, width = 600) {
  const url = cardImg(d);
  if (!url) return '';
  // 1. Raw Wikimedia Commons DSLR photo (often 8MB - 10MB): convert to official thumb.php endpoint
  if (url.includes('upload.wikimedia.org/wikipedia/commons/') && !url.includes('/thumb/') && !url.endsWith('.svg')) {
    const filename = url.split('/').pop().split('?')[0];
    return 'https://commons.wikimedia.org/w/thumb.php?f=' + filename + '&w=' + width;
  }
  // 2. Existing Wikimedia Commons thumb: resize to target width
  if (url.includes('/thumb/') && /\/\d+px-[^/]+$/.test(url)) {
    return url.replace(/\/(\d+)px-([^/]+)$/, '/' + width + 'px-$2');
  }
  // 3. Pexels photo: compress & set size to max 800 or width
  if (url.includes('images.pexels.com/photos/')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'compress');
      u.searchParams.set('cs', 'tinysrgb');
      u.searchParams.set('w', String(Math.min(width, 800)));
      return u.toString();
    } catch (_) {
      return url;
    }
  }
  return url;
}

/**
 * Premium overlay card (portrait 3/4) — used by the Trending carousel and the
 * "Best in <month>" grid. Image with amber ★ rating badge top-left, gradient
 * overlay bottom carrying name + "Best Time" green pill + ₹price chip.
 */
export function trendCardHTML(d) {
  const rawImage = cardImg(d);
  const image = cardThumb(d, 600);
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="trend-card group' + (image ? '' : ' image-unavailable') + '">' +
    (image ? '<img src="' + esc(image) + '" alt="' + esc((d.image && d.image.alt) || d.title) + '" loading="lazy" decoding="async" referrerpolicy="origin" ' +
      'onerror="if(this.dataset.fallback){this.onerror=null;this.hidden=true;this.parentElement.classList.add(\'image-unavailable\');}else{this.dataset.fallback=\'1\';this.src=\'' + esc(rawImage) + '\';}" />' : '') +
    '<div class="trend-card-overlay"></div>' +
    '<div class="absolute top-3 left-3">' +
    '<span class="rating-badge">' + icon('star', { size: 13, fill: true }) + esc(d.rating) + '</span>' +
    '</div>' +
    (d.badge ? '<div class="absolute top-3 right-3"><span class="pill-glass">' + esc(d.badge) + '</span></div>' : '') +
    '<div class="absolute bottom-0 left-0 right-0 p-4">' +
    '<span class="card-calligraphy-accent">~ ' + esc(d.state) + ' ~</span>' +
    '<p class="text-white font-bold text-lg leading-tight drop-shadow-md trend-card-title">' + esc(d.title) + '</p>' +
    '<div class="flex items-center gap-2 flex-wrap mt-2.5">' +
    '<span class="pill-green">' + icon('calendar', { size: 12 }) + esc(d.bestTime.label) + '</span>' +
    '<span class="pill-glass">Stay starts from ₹' + inr(d.minPrice) + '</span>' +
    '</div>' +
    '</div>' +
    '</a>';
}

/** Standard grid card. opts: { delay (s), typeIcon, variant: 'trending' | 'explore' } */
export function destCardHTML(d, opts = {}) {
  const rawImage = cardImg(d);
  const image = cardThumb(d, 600);
  const typeBadge = opts.variant === 'explore'
    ? '<span class="dest-badge-type">' + (opts.typeIcon || '') + ' ' + esc(typeLabel(d.type)) + '</span>'
    : '';
  const badgeHtml = d.badge
    ? '<span class="dest-badge-featured">' + esc(d.badge) + '</span>'
    : '';

  const feats = (d.features || []).slice(0, 3).map(function (f) {
    return '<span class="dest-feat-pill">' + esc(f) + '</span>';
  }).join('');

  const distText = (d.distanceFromDelhi || 0) + ' km from Delhi';

  return '' +
    '<article class="dest-card-item">' +
    '<a href="' + destUrl(d.slug) + '" class="dest-card-link group" aria-label="' + esc(d.title) + ', ' + esc(d.state) + '">' +
    '<div class="dest-card-media' + (image ? '' : ' image-unavailable') + '">' +
    (image ? '<img src="' + esc(image) + '" alt="' + esc((d.image && d.image.alt) || d.title) + '" class="dest-card-img" loading="lazy" decoding="async" referrerpolicy="origin" ' +
      'onerror="if(this.dataset.fallback){this.onerror=null;this.hidden=true;this.parentElement.classList.add(\'image-unavailable\');}else{this.dataset.fallback=\'1\';this.src=\'' + esc(rawImage) + '\';}" />' : '') +
    '<div class="dest-card-scrim"></div>' +
    '<div class="dest-card-badges-top">' +
    (badgeHtml || '') +
    (typeBadge || '') +
    '</div>' +
    '<div class="dest-card-header-overlay">' +
    '<span class="dest-card-calligraphy-state">~ ' + esc(d.state) + ' ~</span>' +
    '<h3 class="dest-card-title">' + esc(d.title) + '</h3>' +
    '<p class="dest-card-location">' + icon('map-pin', { size: 12 }) + esc(d.state) + (d.region ? ' · ' + esc(d.region) : '') + '</p>' +
    '</div>' +
    '</div>' +
    '<div class="dest-card-body">' +
    '<div class="dest-card-meta-row">' +
    '<div class="dest-card-rating">' +
    '<span class="star-icon">' + icon('star', { size: 14, fill: true }) + '</span>' +
    '<span class="rating-num">' + esc(d.rating) + '</span>' +
    '<span class="review-cnt">(' + inr(d.reviewCount) + ')</span>' +
    '</div>' +
    '<span class="dest-best-season">' + icon('calendar', { size: 12 }) + esc(d.bestTime.label) + '</span>' +
    '</div>' +
    '<p class="dest-card-desc">' + esc(d.short) + '</p>' +
    (feats ? '<div class="dest-card-tags">' + feats + '</div>' : '') +
    '<div class="dest-card-footer">' +
    '<span class="dest-dist-hint">' + icon('compass', { size: 12 }) + distText + '</span>' +
    '<div class="dest-price-box">' +
    '<span class="price-prefix">Stay starts from</span>' +
    '<span class="price-val">₹' + inr(d.minPrice) + '</span>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</a>' +
    '</article>';
}

/** Large 16/9 hero card (home "Best Hill Stations"). */
export function heroCardHTML(d) {
  const rawImage = cardImg(d);
  const image = cardThumb(d, 800);
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="card dest-card block group">' +
    '<div class="card-image-frame relative overflow-hidden' + (image ? '' : ' image-unavailable') + '" style="aspect-ratio:16/9; border-radius: var(--radius) var(--radius) 0 0;">' +
    (image ? '<img src="' + esc(image) + '" alt="' + esc((d.heroImage && d.heroImage.alt) || d.title) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" referrerpolicy="origin" ' +
      'onerror="if(this.dataset.fallback){this.onerror=null;this.hidden=true;this.parentElement.classList.add(\'image-unavailable\');}else{this.dataset.fallback=\'1\';this.src=\'' + esc(rawImage) + '\';}" />' : '') +
    (d.badge ? '<div class="absolute top-3 left-3"><span class="dest-badge-featured">' + esc(d.badge) + '</span></div>' : '') +
    '</div>' +
    '<div class="p-3 bg-slate-900/90 flex flex-col gap-1">' +
    '<span class="dest-card-calligraphy-state text-xs">~ ' + esc(d.state) + ' ~</span>' +
    '<h3 class="dest-card-title text-white font-bold text-sm sm:text-base truncate leading-tight">' + esc(d.title) + '</h3>' +
    '<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-300">' +
    '<span class="flex items-center gap-0.5">' +
    '<span class="text-amber-400">' + icon('star', { size: 12, fill: true }) + '</span>' +
    '<strong class="text-white">' + esc(d.rating) + '</strong></span>' +
    '<span>(' + inr(d.reviewCount) + ')</span>' +
    '<span class="text-slate-500">|</span>' +
    '<span>' + esc(d.bestTime.label) + '</span>' +
    '</div>' +
    '<p class="text-slate-400 text-xs line-clamp-1 sm:line-clamp-2 leading-relaxed mt-0.5">' + esc(d.short) + '</p>' +
    '<div class="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1">' +
    '<span class="text-slate-400 text-[10px] uppercase font-semibold tracking-wider">' + (d.distanceFromDelhi || 0) + ' km from Delhi</span>' +
    '<div class="flex items-baseline gap-1.5">' +
    '<span class="text-slate-400 text-[11px]">Stay starts from</span>' +
    '<span class="text-amber-400 font-bold text-sm">₹' + inr(d.minPrice) + '</span>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</a>';
}

/** Small square card (home "Explore More" grid). */
export function miniCardHTML(d) {
  const rawImage = cardImg(d);
  const image = cardThumb(d, 400);
  return '' +
    '<a href="' + destUrl(d.slug) + '" class="group block">' +
    '<div class="card-image-frame rounded-xl overflow-hidden aspect-square relative mb-2' + (image ? '' : ' image-unavailable') + '">' +
    (image ? '<img src="' + esc(image) + '" alt="' + esc((d.image && d.image.alt) || d.title) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" referrerpolicy="origin" ' +
      'onerror="if(this.dataset.fallback){this.onerror=null;this.hidden=true;this.parentElement.classList.add(\'image-unavailable\');}else{this.dataset.fallback=\'1\';this.src=\'' + esc(rawImage) + '\';}" />' : '') +
    '<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>' +
    '<div class="absolute bottom-2 left-2 right-2">' +
    '<span class="dest-card-calligraphy-state text-[11px] mb-0.5">~ ' + esc(d.state) + ' ~</span>' +
    '<p class="text-white text-xs font-semibold truncate">' + esc(d.title) + '</p>' +
    '</div>' +
    '</div>' +
    '</a>';
}
