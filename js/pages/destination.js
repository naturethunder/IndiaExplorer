/**
 * destination.js — page logic for destination.html (the ONE reusable detail
 * template for every destination). Resolves the slug from ?slug= (canonical),
 * ?id= or #hash (legacy stubs), loads ONLY that destination's JSON via
 * fetchDestination(slug) plus the light manifest (for similar destinations +
 * price-tier meta), and renders every tab. Google Maps Embed is mounted
 * lazily via GoogleMapEmbed component when opening the Map tab.
 */
import { fetchDestination, fetchIndex } from '../data/api.js';
import { initLayout } from '../components/layout.js';
import { destUrl, cardImg, optimizeImageUrl } from '../components/destinationCard.js';
import { applySEO, injectJsonLd, breadcrumbJsonLd, destinationJsonLd, faqPageJsonLd } from '../components/seo.js';
import { mountGoogleMapEmbed } from '../components/googleMapEmbed.js';
import { esc, inr, typeLabel } from '../utils/format.js';
import { initThemeToggle } from '../utils/theme.js';
import { saveDestinationOffline, removeDestinationOffline, isDestinationOffline, formatBytes } from '../utils/offlineStorage.js';
import { openOfflineHub, initOfflineHub } from '../components/offlineHub.js';
import { icon } from '../components/icons.js';

// This page keeps its own breadcrumb navbar + mobile tab bar (Stays/Route);
// only the footer comes from the shared layout component.
initLayout({});
initThemeToggle();
initOfflineHub();

const navOfflineBtn = document.getElementById('navOfflineBtn');
if (navOfflineBtn) {
  navOfflineBtn.addEventListener('click', () => openOfflineHub('saved'));
}

const HIMALAYAN_STATES = new Set([
  'Ladakh', 'Jammu and Kashmir', 'Himachal Pradesh', 'Uttarakhand',
  'Sikkim', 'Arunachal Pradesh', 'Meghalaya', 'Mizoram', 'Nagaland', 'Manipur'
]);

const TIER_ORDER = ['cheapest', 'budget', 'good', 'better', 'best', 'luxury', 'extra_luxury'];
function tierColor(tier) {
  const map = {
    cheapest: 'tier-pill-cheapest',
    budget: 'tier-pill-budget',
    good: 'tier-pill-good',
    better: 'tier-pill-better',
    best: 'tier-pill-best',
    luxury: 'tier-pill-luxury',
    extra_luxury: 'tier-pill-extra-luxury',
  };
  return map[tier] || 'tier-pill-default';
}

// Map a WMO weather code to a human label + emoji
function weatherInfo(code) {
  const m = {
    0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
    45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
    51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Dense drizzle', '🌦️'],
    56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'],
    61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
    66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
    71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '🌨️'],
    80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌦️'], 82: ['Violent showers', '⛈️'],
    85: ['Snow showers', '🌨️'], 86: ['Snow showers', '❄️'],
    95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm + hail', '⛈️'], 99: ['Thunderstorm + hail', '⛈️'],
  };
  return m[code] || ['—', '🌡️'];
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }

function truncateMeta(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength - 1);
  const boundary = clipped.lastIndexOf(' ');
  return clipped.slice(0, boundary > maxLength * 0.7 ? boundary : maxLength - 1)
    .replace(/[,:;.!?\-–—]+$/g, '') + '…';
}

function middleTruncate(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  const available = maxLength - 1;
  const headLength = Math.ceil(available * 0.58);
  const tailLength = available - headLength;
  return text.slice(0, headLength).trimEnd() + '…' + text.slice(-tailLength).trimStart();
}

function destinationMetaTitle(dest, seoObj) {
  if (seoObj && seoObj.title && seoObj.title.trim().length > 15) {
    return seoObj.title.trim();
  }
  const destName = String(dest && dest.title ? dest.title : 'Destination').trim();
  const stateStr = dest && dest.state ? `, ${dest.state}` : '';
  const suffix = ` Travel Guide 2026 — Places, Hotels, How to Reach | ExploreDesh`;
  const candidate = `${destName}${stateStr}${suffix}`;
  return candidate.length <= 70 ? candidate : `${destName}${suffix}`;
}

function destinationMetaDescription(dest, seoObj) {
  if (seoObj && seoObj.description && seoObj.description.trim().length > 30) {
    return seoObj.description.trim();
  }
  const destName = dest && dest.title ? dest.title : 'Destination';
  const ov = (dest && dest.overview && dest.overview.short) ? dest.overview.short : (dest && dest.short ? dest.short : '');
  const body = ov || (dest && dest.description ? dest.description : 'Explore top attractions, hotels, weather, and how to reach.');
  const lead = `${destName} Travel Guide: `;
  return truncateMeta(`${lead}${body}`, 160);
}

function markDestinationNotFound() {
  const robots = document.head.querySelector('meta[name="robots"]');
  if (robots) robots.setAttribute('content', 'noindex, follow, max-image-preview:large');
  const canonical = document.head.querySelector('link[rel="canonical"]');
  if (canonical) canonical.remove();
}

// ─── Resolve destination ───────────────────────────────
const params = new URLSearchParams(window.location.search);
let rawSlug = params.get('slug') || params.get('id') || window.location.hash.slice(1) || null;
let slug = rawSlug ? String(rawSlug).trim().toLowerCase().replace(/^\/+|\/+$/g, '').replace(/\.html$/i, '').replace(/\.json$/i, '') : null;
if (slug) {
  if (slug.includes('bangla') && slug.includes('sahib')) {
    slug = 'gurudwara-bangla-sahib';
  } else {
    slug = slug.replace(/['".,]/g, '').trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
}

let dest = null;
if (slug) {
  try {
    dest = await fetchDestination(slug);
    if (dest && dest.slug) {
      localStorage.setItem('exploredesh_last_destination', dest.slug);
    }
  } catch (e) {
    dest = null;
  }
}

if (!dest) {
  markDestinationNotFound();
  document.getElementById('notFound').style.display = 'flex';
} else {
  // Instant render: show hero photo, overview, places & stays in <50ms without waiting for 4.15MB index
  main(dest, null);

  // Background manifest load for bottom Similar Destinations rail
  fetchIndex()
    .then((loadedIdx) => {
      if (loadedIdx && typeof window.__renderSimilarDestinations === 'function') {
        window.__renderSimilarDestinations(loadedIdx);
      }
    })
    .catch(() => { });
}

function main(dest, idx) {
  const PRICE_TIERS = (idx && idx.meta && idx.meta.priceTiers) ? idx.meta.priceTiers : {
    cheapest: { label: 'Cheapest', range: '₹0 – ₹800' },
    budget: { label: 'Budget', range: '₹800 – ₹2,000' },
    good: { label: 'Good', range: '₹2,000 – ₹4,000' },
    better: { label: 'Better', range: '₹4,000 – ₹7,000' },
    best: { label: 'Best', range: '₹7,000 – ₹12,000' },
    luxury: { label: 'Luxury', range: '₹12,000 – ₹25,000' },
    extra_luxury: { label: 'Ultra Luxury', range: '₹25,000+' },
  };
  const DESTINATION_TYPES = (idx && idx.meta && idx.meta.types) ? idx.meta.types : [
    { id: 'heritage', label: 'Heritage', icon: '🏛️' },
    { id: 'city', label: 'City', icon: '🏙️' },
    { id: 'lakes', label: 'Lakes', icon: '🏞️' },
    { id: 'spiritual', label: 'Spiritual', icon: '🕌' },
    { id: 'hill_station', label: 'Hill Stations', icon: '🏔️' },
    { id: 'beach', label: 'Beaches', icon: '🏖️' },
    { id: 'wildlife', label: 'Wildlife', icon: '🐯' },
    { id: 'adventure', label: 'Adventure', icon: '⛺' },
  ];

  function cleanAltText(str) {
    if (!str || typeof str !== 'string') return '';
    let clean = str;
    // Step 1: Remove HTML comments
    clean = clean.replace(/<!--[\s\S]*?-->/g, ' ');
    // Step 2: Decode HTML entities FIRST (so &lt;a href= becomes <a href=)
    clean = clean
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#039;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&[a-z0-9#]+;/gi, ' ');
    // Step 3: Now strip ALL HTML tags (including those decoded from entities)
    // Use a loop to handle nested/malformed tags
    let prev = '';
    while (prev !== clean) {
      prev = clean;
      clean = clean.replace(/<[^>]*>/g, ' ');          // complete tags
      clean = clean.replace(/<[a-zA-Z\/][^<]*/g, ' '); // unclosed tags (no > found)
    }
    // Step 4: Strip remaining angle brackets as a safety net
    clean = clean.replace(/[<>]/g, ' ');
    // Step 5: Strip raw URLs
    clean = clean.replace(/(?:https?:\/\/|\/\/)\S+/gi, ' ');
    // Step 6: Remove common Wikimedia file prefix patterns
    clean = clean.replace(/^File:[^.]+\.(?:jpe?g|png|webp)/i, ' ');
    clean = clean.replace(/^This is a photo of\s*/i, ' ');
    clean = clean.replace(/^\d+px[-_\s]*/i, '');
    // Step 7: Normalise whitespace
    clean = clean.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    // Step 8: Strip trailing/leading punctuation
    clean = clean.replace(/[-—–:]\s*(?:This is a photo of|A photo of|View of)?\s*$/i, '');
    clean = clean.replace(/^[-—–:;,./|]\s*/, '').replace(/\s*[-—–:;,./|]$/, '').trim();
    return clean;
  }


  // Resolve heroImage regardless of whether it's a string URL or {src,alt} object
  const heroSrc = typeof dest.heroImage === 'string' ? dest.heroImage
    : (dest.heroImage && dest.heroImage.src ? dest.heroImage.src
      : (dest.image && dest.image.src ? dest.image.src
        : (dest.gallery && dest.gallery[0] ? (typeof dest.gallery[0] === 'string' ? dest.gallery[0] : dest.gallery[0].src) : '')));
  const rawHeroAlt = typeof dest.heroImage === 'object' && dest.heroImage ? dest.heroImage.alt : '';
  const heroAlt = cleanAltText(rawHeroAlt) || (dest.title || 'Destination');

  // Build a safe seo object even when dest.seo is missing
  const seoObj = dest.seo || {
    title: (dest.title || 'Destination') + ' Travel Guide | ExploreDesh',
    description: dest.short || dest.description || 'Explore top places to visit and best hotels.',
    canonical: 'destination.html?slug=' + encodeURIComponent(dest.slug || ''),
    ogImage: heroSrc,
    keywords: [dest.title || '', dest.state || '', dest.type || ''].filter(Boolean),
  };

  const ov = dest.overview || { about: dest.description || dest.short || '' };
  const reach = dest.howToReach || dest.reachability || {};
  const coords = (dest.weather && dest.weather.lat != null)
    ? [dest.weather.lat, dest.weather.lng]
    : (dest.coordinates ? [dest.coordinates.lat, dest.coordinates.lng] : null);
  const places = (dest.topPlaces && dest.topPlaces.length) ? dest.topPlaces : (dest.places || []);
  const hotels = (dest.hotels && dest.hotels.length) ? dest.hotels : (dest.stays || dest.accommodations || []);

  // ─── SEO ───────────────────────────────────────────────
  const canonicalPath = 'destination.html?slug=' + encodeURIComponent(dest.slug || '');
  const metaTitle = destinationMetaTitle(dest, seoObj);
  const metaDescription = destinationMetaDescription(dest, seoObj);
  applySEO({
    title: metaTitle,
    description: metaDescription,
    canonicalPath: canonicalPath,
    keywords: seoObj.keywords,
    image: heroSrc,
    type: 'article',
  });
  injectJsonLd(destinationJsonLd(dest, canonicalPath), 'destination');
  if (Array.isArray(dest.faq) && dest.faq.length > 0) {
    injectJsonLd(faqPageJsonLd(dest.faq), 'faq');
  }
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Destinations', path: 'destinations.html' },
  ];
  if (dest.state) {
    breadcrumbItems.push({
      name: dest.state,
      path: 'destinations.html?state=' + encodeURIComponent(dest.state),
    });
  }
  breadcrumbItems.push({ name: dest.title, path: canonicalPath });
  injectJsonLd(breadcrumbJsonLd(breadcrumbItems), 'breadcrumb');

  const mainEl = document.getElementById('main') || document.getElementById('content');
  if (mainEl) mainEl.style.display = 'block';
  const notFoundEl = document.getElementById('notFound');
  if (notFoundEl) notFoundEl.style.display = 'none';
  const crumbEl = document.getElementById('crumbName');
  if (crumbEl) crumbEl.textContent = dest.title;

  // Preserve explore filters in breadcrumb if user came from filtered catalogue
  try {
    const saved = sessionStorage.getItem('exploredesh_explore_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.url) {
        const destCrumbs = document.querySelectorAll('a[href="destinations.html"]');
        destCrumbs.forEach(function (a) {
          if (a.closest('[role="navigation"]') || a.closest('ol')) {
            a.href = parsed.url;
          }
        });
      }
    }
  } catch (_) { }

  // ─── Static Luxury Ambient Background ────────────────────
  // Fixed dark obsidian canvas with static CSS radial glows.
  // Never sets moving/shifting images on full-page background.

  // ─── Hero ───────────────────────────────────────────────
  const heroImg = document.getElementById('heroImg');
  if (heroImg) {
    heroImg.setAttribute('referrerpolicy', 'origin');
    if (heroSrc) {
      heroImg.src = optimizeImageUrl(heroSrc, 1600);
      heroImg.alt = heroAlt;
      heroImg.style.display = 'block';
    } else {
      heroImg.removeAttribute('src');
      heroImg.hidden = true;
    }
    heroImg.onerror = function () { this.onerror = null; };
  }
  const typeObj = DESTINATION_TYPES.find(function (t) { return t.id === dest.type; }) || {};
  const heroType = document.getElementById('heroType');
  if (heroType) {
    heroType.href = 'destinations.html?type=' + dest.type;
    // Bug 3 fix: removed emoji typeObj.icon; use plain text label only
    heroType.textContent = typeLabel(dest.type);
  }
  const heroBadgeEl = document.getElementById('heroBadge');
  if (heroBadgeEl) heroBadgeEl.textContent = dest.badge || typeLabel(dest.type);
  const heroTitleEl = document.getElementById('heroTitle');
  if (heroTitleEl) {
    heroTitleEl.textContent = dest.title;
    fitHeroTitle(dest.title);
    window.addEventListener('resize', function () {
      fitHeroTitle(dest.title);
    });
  }

  function fitHeroTitle(title) {
    const el = document.getElementById('heroTitle');
    if (!el) return;
    const text = (title || el.textContent || '').trim();
    if (!text) return;

    const len = text.length;
    const wordCount = text.split(/\s+/).length;
    const vw = window.innerWidth;

    let baseRem = 4.8;
    if (len <= 10 && wordCount <= 2) {
      baseRem = 4.8;
    } else if (len <= 16 && wordCount <= 2) {
      baseRem = 4.2;
    } else if (len <= 22) {
      baseRem = 3.6;
    } else if (len <= 30) {
      baseRem = 3.1;
    } else if (len <= 40) {
      baseRem = 2.6;
    } else if (len <= 55) {
      baseRem = 2.2;
    } else {
      baseRem = 1.9;
    }

    if (vw < 640) {
      baseRem = Math.min(baseRem, 2.4);
      baseRem = Math.max(1.5, baseRem * (vw / 600));
    } else if (vw < 1024) {
      baseRem = Math.min(baseRem, 3.5);
      baseRem = Math.max(2.0, baseRem * (vw / 1024));
    } else if (vw < 1366) {
      baseRem = Math.min(baseRem, 4.2);
      baseRem = baseRem * (vw / 1366);
    }

    el.style.setProperty('--hero-title-size', baseRem.toFixed(2) + 'rem');

    if (vw >= 640) {
      el.style.whiteSpace = 'nowrap';
      const maxAvailableWidth = vw * 0.90;
      let attempts = 0;
      while (el.scrollWidth > maxAvailableWidth && baseRem > 1.8 && attempts < 10) {
        baseRem -= 0.2;
        el.style.setProperty('--hero-title-size', baseRem.toFixed(2) + 'rem');
        attempts++;
      }
    }
  }
  const heroTaglineEl = document.getElementById('heroTagline');
  if (heroTaglineEl) {
    let rawTagline = dest.tagline || dest.short || '';
    if (dest.title) {
      const escapedTitle = dest.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prefixPattern = new RegExp('^' + escapedTitle + '\\s*[-—–:]\\s*', 'i');
      rawTagline = rawTagline.replace(prefixPattern, '').trim();
    }
    if (rawTagline) {
      rawTagline = rawTagline.charAt(0).toUpperCase() + rawTagline.slice(1);
    }
    heroTaglineEl.textContent = rawTagline;
  }


  // ─── SMART BUDGET SIMULATOR STATE & ENGINE ───────────────
  let budgetPax = 'couple';     // 'solo' | 'couple' | 'family' | 'group'
  let budgetStyle = 'moderate';  // 'backpacker' | 'moderate' | 'luxury'
  let budgetDays = 3;           // 2 to 7
  let budgetIncludeStays = true;
  let budgetSelectedHotelIdx = -1; // -1 = auto-match by tier
  let budgetIncludeTransport = true;
  let budgetIncludeFood = true;
  let budgetIncludeEntry = true;
  let budgetExcludedPlaces = new Set();
  let budgetIncludeBuffer = true;
  let budgetSightsOpen = false;

  function parseEntryFeeInfo(feeStr) {
    if (!feeStr || typeof feeStr !== 'string') return { adult: 0, kid: 0 };
    const s = feeStr.trim();
    if (/free|no entry|included|none/i.test(s)) return { adult: 0, kid: 0 };

    const adultM = s.match(/(?:₹|rs\.?\s*)(\d+)\s*(?:for\s+)?(?:adults?|person|head)?/i);
    const kidM = s.match(/(?:₹|rs\.?\s*)(\d+)\s*(?:for\s+)?(?:kids?|children|child)/i);
    if (adultM && kidM) {
      return { adult: parseInt(adultM[1], 10), kid: parseInt(kidM[1], 10) };
    }
    const singleM = s.match(/(?:₹|rs\.?\s*)(\d+)/i);
    if (singleM) {
      const val = parseInt(singleM[1], 10);
      return { adult: val, kid: Math.round(val * 0.5) };
    }
    if (/varies|nominal|donation/i.test(s)) {
      return { adult: 30, kid: 15 };
    }
    return { adult: 0, kid: 0 };
  }

  function computeBudgetState(customPax, customStyle, customDays) {
    const pKey = customPax || budgetPax;
    const sKey = customStyle || budgetStyle;
    const dVal = typeof customDays === 'number' ? customDays : budgetDays;
    const nights = Math.max(1, dVal - 1);

    const paxConfigs = {
      solo: { adults: 1, kids: 0, total: 1, label: 'Solo Traveler', desc: '1 Adult', roomFactor: 1 },
      couple: { adults: 2, kids: 0, total: 2, label: 'Couple', desc: '2 Adults', roomFactor: 1 },
      family: { adults: 2, kids: 2, total: 4, label: 'Family', desc: '2 Adults, 2 Kids', roomFactor: 1.5 },
      group: { adults: 4, kids: 0, total: 4, label: 'Group of Friends', desc: '4 Adults', roomFactor: 2 },
    };
    const pCfg = paxConfigs[pKey] || paxConfigs.couple;

    // 1. Matched Hotel & Stay Cost
    let matchedHotel = null;
    let stayTierLabel = '';

    if (!budgetIncludeStays) {
      stayTierLabel = 'Excluded / Own Accommodation';
    } else if (budgetSelectedHotelIdx >= 0 && hotels[budgetSelectedHotelIdx]) {
      matchedHotel = hotels[budgetSelectedHotelIdx];
      stayTierLabel = (matchedHotel.tier ? matchedHotel.tier.toUpperCase() : 'Selected Hotel') + ' (Custom Pick)';
    } else {
      if (sKey === 'backpacker') {
        stayTierLabel = 'Hostel / Yatri Nivas';
        matchedHotel = hotels.find(function (h) { return h.tier === 'cheapest'; });
        if (!matchedHotel && hotels.length) {
          matchedHotel = hotels.slice().sort(function (a, b) { return (a.priceMin || 0) - (b.priceMin || 0); })[0];
        }
      } else if (sKey === 'moderate') {
        stayTierLabel = 'Comfort 3-Star / Boutique';
        matchedHotel = hotels.find(function (h) { return h.tier === 'budget' || h.tier === 'good'; });
        if (!matchedHotel && hotels.length) {
          matchedHotel = hotels[Math.floor(hotels.length / 2)];
        }
      } else {
        stayTierLabel = 'Heritage Palace / 4–5 Star Luxury';
        matchedHotel = hotels.find(function (h) { return h.tier === 'luxury' || h.tier === 'best' || h.tier === 'extra_luxury' || h.tier === 'better'; });
        if (!matchedHotel && hotels.length) {
          matchedHotel = hotels.slice().sort(function (a, b) { return (b.priceMin || 0) - (a.priceMin || 0); })[0];
        }
      }
    }

    const baseMinPrice = (ov && ov.minPrice) ? ov.minPrice : (dest.minPrice || 900);
    let nightlyRate = 0;
    if (budgetIncludeStays) {
      nightlyRate = matchedHotel && matchedHotel.priceMin
        ? matchedHotel.priceMin
        : (sKey === 'backpacker' ? Math.max(500, baseMinPrice) : (sKey === 'moderate' ? Math.max(1800, Math.round(baseMinPrice * 2.2)) : Math.max(6500, Math.round(baseMinPrice * 5))));

      if (sKey === 'backpacker' && pKey === 'solo') {
        nightlyRate = Math.round(nightlyRate * 0.85); // dorm / single bed rate
      } else {
        nightlyRate = Math.round(nightlyRate * pCfg.roomFactor);
      }
    }
    const totalStay = budgetIncludeStays ? (nightlyRate * nights) : 0;

    // 2. Local Transport
    let dailyTransport = 0;
    let transportDesc = '';
    if (!budgetIncludeTransport) {
      transportDesc = 'Own Vehicle / Walking / Excluded';
    } else {
      if (sKey === 'backpacker') {
        transportDesc = 'Scooter rental / shared auto / local bus';
        if (pKey === 'solo') dailyTransport = 350;
        else if (pKey === 'couple') dailyTransport = 500;
        else if (pKey === 'family') dailyTransport = 750;
        else dailyTransport = 900;
      } else if (sKey === 'moderate') {
        transportDesc = 'Dedicated auto-rickshaw & city AC cab hops';
        if (pKey === 'solo') dailyTransport = 750;
        else if (pKey === 'couple') dailyTransport = 950;
        else if (pKey === 'family') dailyTransport = 1400;
        else dailyTransport = 1800;
      } else {
        transportDesc = 'Private chauffeur AC premium sedan / luxury SUV';
        if (pKey === 'solo') dailyTransport = 2200;
        else if (pKey === 'couple') dailyTransport = 2800;
        else if (pKey === 'family') dailyTransport = 3600;
        else dailyTransport = 4500;
      }
    }
    const totalTransport = budgetIncludeTransport ? (dailyTransport * dVal) : 0;

    // 3. Food & Dining
    let adultMealPerDay = 0;
    let kidMealPerDay = 0;
    let diningDesc = '';
    if (!budgetIncludeFood) {
      diningDesc = 'Self-Arranged / Excluded';
    } else {
      if (sKey === 'backpacker') {
        adultMealPerDay = 450;
        kidMealPerDay = 250;
        diningDesc = 'Authentic local street food, thalis & tea stalls';
      } else if (sKey === 'moderate') {
        adultMealPerDay = 950;
        kidMealPerDay = 550;
        diningDesc = 'Popular local cafes, multi-cuisine family restaurants';
      } else {
        adultMealPerDay = 2400;
        kidMealPerDay = 1200;
        diningDesc = 'Fine dining, heritage rooftop & luxury hotel dining';
      }
    }
    const dailyFood = (pCfg.adults * adultMealPerDay) + (pCfg.kids * kidMealPerDay);
    const totalFood = budgetIncludeFood ? (dailyFood * dVal) : 0;

    // 4. Entry Fees & Sightseeing
    const placesToCount = dVal <= 2 ? places.slice(0, 4) : (dVal <= 4 ? places.slice(0, 6) : places);
    let sumAdultFees = 0;
    let sumKidFees = 0;
    const includedAttractions = [];
    placesToCount.forEach(function (p) {
      const isExcluded = budgetExcludedPlaces.has(p.name);
      const fee = parseEntryFeeInfo(p.entryFee);
      if (!isExcluded) {
        sumAdultFees += fee.adult;
        sumKidFees += fee.kid;
      }
      includedAttractions.push({ name: p.name, fee: p.entryFee, isExcluded: isExcluded, isFree: (fee.adult === 0 && fee.kid === 0) });
    });
    let totalEntry = 0;
    if (budgetIncludeEntry) {
      totalEntry = (pCfg.adults * sumAdultFees) + (pCfg.kids * sumKidFees);
      const activeCount = includedAttractions.filter(function (a) { return !a.isExcluded; }).length;
      if (totalEntry === 0 && activeCount > 0) {
        totalEntry = pCfg.adults * 50; // nominal temple donation or locker charge
      }
    }

    // 5. Buffer (5%)
    const subtotal = totalStay + totalTransport + totalFood + totalEntry;
    const bufferCost = budgetIncludeBuffer ? Math.round(subtotal * 0.05) : 0;
    const grandTotal = Math.max(0, subtotal + bufferCost);
    const perPerson = Math.round(grandTotal / pCfg.total);
    const perDay = Math.round(grandTotal / dVal);

    // Visual percentage distribution
    const baseTotal = grandTotal > 0 ? grandTotal : 1;
    const pctStay = budgetIncludeStays ? Math.round((totalStay / baseTotal) * 100) : 0;
    const pctTrans = budgetIncludeTransport ? Math.round((totalTransport / baseTotal) * 100) : 0;
    const pctFood = budgetIncludeFood ? Math.round((totalFood / baseTotal) * 100) : 0;
    const pctEntry = budgetIncludeEntry ? Math.round((totalEntry / baseTotal) * 100) : 0;
    const pctBuffer = budgetIncludeBuffer ? Math.max(0, 100 - (pctStay + pctTrans + pctFood + pctEntry)) : 0;

    let checkedCount = 0;
    if (budgetIncludeStays) checkedCount++;
    if (budgetIncludeTransport) checkedCount++;
    if (budgetIncludeFood) checkedCount++;
    if (budgetIncludeEntry) checkedCount++;
    if (budgetIncludeBuffer) checkedCount++;

    // Dynamic Pro Tip
    let proTip = '';
    if (sKey === 'backpacker') {
      proTip = '💡 Backpacker Insider Tip: Opt for local shared autos or fixed whole-day auto bookings to save up to 35% compared to booking separate short rides.';
    } else if (sKey === 'moderate') {
      proTip = '💡 Moderate Saver Tip: Pre-book breakfast with your hotel stay and visit heritage attractions before 9:30 AM to skip midday lines and avoid surge taxi fares.';
    } else {
      proTip = '💡 Luxury Experience Tip: Reserve royal rooftop dinners in advance during sunset hours and pre-arrange a private AC chauffeur for effortless point-to-point sightseeing.';
    }

    return {
      pKey: pKey,
      sKey: sKey,
      dVal: dVal,
      pCfg: pCfg,
      nights: nights,
      matchedHotel: matchedHotel,
      stayTierLabel: stayTierLabel,
      nightlyRate: nightlyRate,
      totalStay: totalStay,
      dailyTransport: dailyTransport,
      transportDesc: transportDesc,
      totalTransport: totalTransport,
      adultMealPerDay: adultMealPerDay,
      kidMealPerDay: kidMealPerDay,
      diningDesc: diningDesc,
      totalFood: totalFood,
      totalEntry: totalEntry,
      includedAttractions: includedAttractions,
      placesCounted: placesToCount.length,
      bufferCost: bufferCost,
      grandTotal: grandTotal,
      perPerson: perPerson,
      perDay: perDay,
      pctStay: pctStay,
      pctTrans: pctTrans,
      pctFood: pctFood,
      pctEntry: pctEntry,
      pctBuffer: pctBuffer,
      checkedCount: checkedCount,
      proTip: proTip,
    };
  }

  function downloadBudgetBreakdownFile(b) {
    const lines = [
      '==============================================================',
      ' EXPLOREDESH — SMART TRIP BUDGET ESTIMATE & BREAKDOWN',
      ' Destination: ' + dest.title + ', ' + dest.state + ', India',
      ' Date Generated: ' + new Date().toLocaleDateString('en-IN', { dateStyle: 'full' }),
      '==============================================================',
      '',
      'TRIP CONFIGURATION:',
      '  • Traveler Group: ' + b.pCfg.label + ' (' + b.pCfg.desc + ')',
      '  • Travel Style:   ' + (b.sKey.toUpperCase()) + ' (' + (b.sKey === 'backpacker' ? 'Budget / Backpacker' : b.sKey === 'moderate' ? 'Moderate / Comfort' : 'Luxury / Premium') + ')',
      '  • Duration:       ' + b.dVal + ' Days / ' + b.nights + ' Nights',
      '',
      'ESTIMATED FINANCIAL BREAKDOWN (ALL INCLUSIVE):',
      '--------------------------------------------------------------',
      ' 1. ACCOMMODATION (STAYS):',
      '    • Tier: ' + b.stayTierLabel,
      '    • Rate: ₹' + inr(b.nightlyRate) + ' / night (' + b.nights + ' nights)',
      '    • Sample Stay: ' + (b.matchedHotel ? b.matchedHotel.name : 'Verified Local Stays'),
      '    • Total Stay Cost: ₹' + inr(b.totalStay),
      '',
      ' 2. LOCAL TRANSPORT & MOBILITY:',
      '    • Mode: ' + b.transportDesc,
      '    • Rate: ₹' + inr(b.dailyTransport) + ' / day (' + b.dVal + ' days)',
      '    • Total Transport: ₹' + inr(b.totalTransport),
      '',
      ' 3. FOOD & DINING:',
      '    • Dining Style: ' + b.diningDesc,
      '    • Rate: ₹' + inr(b.adultMealPerDay) + '/adult/day' + (b.pCfg.kids > 0 ? ', ₹' + inr(b.kidMealPerDay) + '/kid/day' : ''),
      '    • Total Dining: ₹' + inr(b.totalFood),
      '',
      ' 4. SIGHTSEEING & ENTRY FEES:',
      '    • Coverage: ' + b.placesCounted + ' top attractions & monuments',
      '    • Total Entry & Permits: ₹' + inr(b.totalEntry),
      '',
      ' 5. CONTINGENCY BUFFER (5%):',
      '    • Smart buffer for emergency hops, shoe-keeping, offerings, tips: ₹' + inr(b.bufferCost),
      '--------------------------------------------------------------',
      ' TOTAL ESTIMATED TRIP COST:  ₹' + inr(b.grandTotal),
      ' ESTIMATED COST PER PERSON:  ₹' + inr(b.perPerson),
      ' ESTIMATED DAILY EXPENSE:    ₹' + inr(b.perDay) + ' / day',
      '==============================================================',
      '',
      'TRAVEL TIP FOR THIS TRIP:',
      b.proTip,
      '',
      'VERIFIED BOOKING PARTNERS:',
      '  • Stays: Explore verified hotels on ExploreDesh & Google Travel',
      '  • Transit: IRCTC for rail, RedBus for interstate buses, local autos for daily transit',
      '--------------------------------------------------------------',
      'Plan responsibly & travel safely with ExploreDesh Go — Bharat Travel Guide.',
      'Official Link: https://exploredesh.com/destination.html?slug=' + (dest.slug || ''),
      '=============================================================='
    ];

    const content = lines.join('\r\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ExploreDesh-Budget-' + (dest.slug || 'trip') + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  // ─── OVERVIEW panel ─────────────────────────────────────
  function renderOverview() {
    let featList = (ov && ov.features ? ov.features : (dest.features || []));
    const tLower = (dest.title || '').toLowerCase();
    const isCommercialCity = /delhi|mumbai|jaipur|kolkata|lucknow|ahmedabad|bengaluru|hyderabad|chennai|bazaar|market|chowk/i.test(tLower);
    featList = featList.filter(function (f) {
      const fl = (f || '').toLowerCase().trim();
      if (fl === 'local bazaars' && !isCommercialCity) return false;
      if (fl === 'ghats' && !/ghat|varanasi|haridwar|rishikesh|ujjain|prayagraj|mathura|maheshwar/i.test(tLower)) return false;
      return true;
    });
    const features = featList.map(function (f) {
      return '<span class="inline-flex items-center px-3 py-1.5 bg-orange-50 text-orange-800 text-sm font-medium rounded-full border border-orange-200">' + esc(f) + '</span>';
    }).join('');

    const topPlaces = places.slice(0, 4).map(function (p, i) {
      const pImgRaw = (typeof p.image === 'string' ? p.image : (p.image && p.image.src ? p.image.src : '')) || '';
      const pImgSrc = pImgRaw ? optimizeImageUrl(pImgRaw, 600) : '';
      const pImgAlt = (p.image && p.image.alt) ? p.image.alt : (p.name || '');
      const desc = (p.description || '');
      return '<div class="card p-0 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all bg-white rounded-2xl border border-gray-100 group shadow-sm" data-topidx="' + i + '" role="button" tabindex="0">' +
        '<div class="relative h-32 overflow-hidden bg-gray-100">' +
        (pImgSrc ? '<img src="' + esc(pImgSrc) + '" alt="' + esc(pImgAlt) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';" />' : '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No image</div>') +
        '<span class="absolute top-2.5 right-2.5 text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-white/20 shadow-sm flex items-center gap-1">★ ' + esc(String(p.rating || '4.5')) + '</span>' +
        '</div>' +
        '<div class="p-3.5">' +
        '<div class="flex items-center justify-between gap-2 mb-1">' +
        '<h4 class="font-bold text-sm text-gray-900 truncate leading-snug">' + esc(p.name) + '</h4>' +
        '</div>' +
        '<p class="text-xs text-gray-500 capitalize mb-1.5 font-medium flex items-center gap-1.5 truncate">' +
        '<span class="inline-block px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-semibold">' + esc(p.category || 'attraction') + '</span> · ' +
        '<span title="' + esc(p.distance || '') + '">📍 ' + esc(p.distance || 'Nearby') + '</span> · ' +
        '<span class="text-emerald-700 font-semibold">🚗 ' + esc(getPlaceTravelTime(p, dest.title, dest.state)) + '</span>' +
        '</p>' +
        '<p class="text-xs text-gray-600 line-clamp-2 leading-relaxed">' + esc(desc.slice(0, 90)) + (desc.length > 90 ? '…' : '') + '</p>' +
        '</div></div>';
    }).join('');

    const staysFrom = TIER_ORDER.filter(function (tier) {
      return hotels.some(function (s) { return s.tier === tier; });
    }).map(function (tier) {
      const min = (hotels.filter(function (s) { return s.tier === tier; })[0] || {}).priceMin || 0;
      return '<div class="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">' +
        '<span class="capitalize text-xs px-2 py-0.5 rounded-full font-medium ' + tierColor(tier) + '">' + (PRICE_TIERS[tier] ? PRICE_TIERS[tier].label : tier) + '</span>' +
        '<span class="font-semibold text-gray-900 text-sm">₹' + inr(min) + '+</span></div>';
    }).join('');

    const altRow = (ov && ov.altitude) ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Altitude</span><span class="font-medium">' + (function (a) { if (typeof a === 'number') return inr(a) + ' m'; var s = String(a).trim(); return /m$/i.test(s) ? esc(s) : esc(s) + ' m'; })(ov.altitude) + '</span></div>' : '';

    const teaserBudget = computeBudgetState('couple', 'moderate', 3);
    const overviewBudgetTeaserHTML =
      '<div class="overview-budget-teaser info-card">' +
      '<div class="teaser-title-row">' +
      '<div class="flex items-center gap-2">' +
      '<svg class="text-amber-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>' +
      '<h3 class="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Trip Cost Estimator</h3>' +
      '</div>' +
      '<span class="teaser-badge">Live Simulator</span>' +
      '</div>' +
      '<p class="text-xs text-gray-500 dark:text-slate-400 mb-2.5">Estimated 3-day trip for 2 travelers (hotel, transit, food & entry tickets).</p>' +
      '<div class="flex items-baseline justify-between mb-3 bg-black/5 dark:bg-black/30 p-2.5 rounded-xl border border-gray-200 dark:border-white/10">' +
      '<div><span class="text-[11px] text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Est. Total</span><div class="text-xl font-extrabold text-amber-500 dark:text-amber-400 font-display">₹' + inr(teaserBudget.grandTotal) + '</div></div>' +
      '<div class="text-right"><span class="text-[11px] text-gray-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Per Person</span><div class="text-sm font-bold text-gray-900 dark:text-white">₹' + inr(teaserBudget.perPerson) + '</div></div>' +
      '</div>' +
      '<button type="button" class="btn btn-primary w-full text-xs font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]" data-goto="budget">' +
      '<span>Customize Group & Duration</span>' +
      '<span>→</span>' +
      '</button>' +
      '</div>';

    // ─── 5 Real Images Carousel for Overview Panel ──────
    function get5RealPhotos() {
      const photos = [];
      const seen = new Set();

      function getNormalizedKey(u) {
        if (!u || typeof u !== 'string') return '';
        try {
          const parsed = new URL(u, window.location.origin);
          if (parsed.hostname.includes('wikimedia.org')) {
            const f = parsed.searchParams.get('f');
            if (f) return decodeURIComponent(f).toLowerCase().replace(/_/g, ' ').trim();
          }
          return decodeURIComponent(parsed.pathname).toLowerCase().replace(/_/g, ' ').trim();
        } catch (_) {
          return u.split('?')[0].toLowerCase().trim();
        }
      }

      function addPhoto(photo) {
        if (!photo || !photo.src) return;
        const key = getNormalizedKey(photo.src);
        if (!key || seen.has(key)) return;
        seen.add(key);
        photos.push(photo);
      }

      // Intelligent resolver for gallery titles and subtitles avoiding generic numbers, camera codes, or foreign labels
      function isGenericLabel(text) {
        if (!text || typeof text !== 'string') return true;
        const trimmed = text.trim();
        const dTitle = (dest.title || '').trim().toLowerCase();
        const tLower = trimmed.toLowerCase();

        // Exact duplicate of destination name or repetition
        if (tLower === dTitle || tLower === `${dTitle} — ${dTitle}` || tLower === `${dTitle} — ${dTitle}, ${(dest.state || '').toLowerCase()}`) return true;

        // Generic vista/slide words
        if (/^(?:[a-zA-Z\s-]+[\s—–-])?(?:vista|highlight|photo|slide|view|scenic view|image|attraction)\s*\d*$/i.test(trimmed)) return true;
        if (/^(?:photo|slide|image|vista|highlight|landscape)\s*\d*$/i.test(trimmed)) return true;
        if (/^attraction\s*\d+/i.test(trimmed)) return true;

        // Trailing numbered suffixes (e.g. Tikona3, Addhi Khuyi1)
        if (/\b[A-Za-z\s-]+\d+$/.test(trimmed)) return true;

        // Camera filenames or timestamps (e.g. DSC08544, IMG2025..., 20190615)
        if (/\b(dsc[n0-9_]*|img[0-9_]*|p\d{4,}|\d{8,}|\d{4}_\d{2}_\d{2}|ptrqs|wikivoyage)\b/i.test(trimmed)) return true;

        // Foreign locations
        if (/\b(germany|france|italy|spain|turkey|türkiye|austria|ukraine|russia|vietnam|taiwan|indonesia|thailand|canada|usa|england|poland|kyiv|berlin|vienna|london|paris|weser|pegestorf|argentina|brazil|mexico|colombia|sri lanka|colombo|dhaka|lahore|karachi)\b/i.test(trimmed)) return true;

        return false;
      }

      function formatHeroTitle(title, tagline, alt, state) {
        if (tagline && typeof tagline === 'string') {
          const t = cleanAltText(tagline);
          if (t) {
            if (t.toLowerCase().startsWith(title.toLowerCase())) {
              return t;
            }
            return title + ' — ' + t;
          }
        }
        if (alt && typeof alt === 'string') {
          const a = cleanAltText(alt);
          if (a && a.toLowerCase() !== title.toLowerCase() && !isGenericLabel(a)) {
            if (a.toLowerCase().startsWith(title.toLowerCase())) {
              return a.slice(0, 70);
            }
            return title + ' — ' + a.slice(0, 60);
          }
        }
        return title + (state ? ' · ' + state : '');
      }

      // 1. Primary Hero Image
      if (typeof dest.heroImage === 'string' && dest.heroImage) {
        addPhoto({
          src: optimizeImageUrl(dest.heroImage, 1400),
          title: formatHeroTitle(dest.title, dest.tagline, '', dest.state),
          subtitle: dest.state + ' · Main View',
          category: dest.type || 'scenic'
        });
      } else if (dest.heroImage && dest.heroImage.src) {
        const cleanHeroSub = cleanAltText(dest.heroImage.alt);
        const heroExplicitTitle = (dest.heroImage.title && !isGenericLabel(dest.heroImage.title) ? cleanAltText(dest.heroImage.title) : null)
          || (dest.gallery && dest.gallery[0] && dest.gallery[0].title && !isGenericLabel(dest.gallery[0].title) ? cleanAltText(dest.gallery[0].title) : null);
        addPhoto({
          src: optimizeImageUrl(dest.heroImage.src, 1400),
          title: heroExplicitTitle || formatHeroTitle(dest.title, dest.tagline, cleanHeroSub, dest.state),
          subtitle: (cleanHeroSub && cleanHeroSub.toLowerCase() !== dest.title.toLowerCase()) ? cleanHeroSub : (dest.state + ' · Main View'),
          category: dest.type || 'scenic'
        });
      }

      function resolveGalleryTitle(g, idx) {
        // 1. If explicit title exists and is not generic, clean and use it
        if (g && typeof g === 'object' && g.title && !isGenericLabel(g.title)) {
          const cleanedTitle = cleanAltText(g.title);
          if (cleanedTitle && !isGenericLabel(cleanedTitle)) return cleanedTitle;
        }
        // 2. Derive from alt text if descriptive and not generic
        const gAlt = (g && typeof g === 'object' && g.alt) ? cleanAltText(g.alt) : '';
        if (gAlt && gAlt.length > 5 && !isGenericLabel(gAlt) && gAlt.toLowerCase() !== dest.title.toLowerCase()) {
          let cleanAlt = gAlt;
          if (cleanAlt.length > 60) {
            const sub = cleanAlt.slice(0, 58);
            const lastSpace = sub.lastIndexOf(' ');
            cleanAlt = (lastSpace > 25 ? sub.slice(0, lastSpace) : sub) + '…';
          }
          return cleanAlt;
        }
        // 3. Fallback to destination features if available (excluding misplaced generic tags)
        const tLower = (dest.title || '').toLowerCase();
        const isCommercialCity = /delhi|mumbai|jaipur|kolkata|lucknow|ahmedabad|bengaluru|hyderabad|chennai|bazaar|market|chowk/i.test(tLower);
        const rawFeatures = dest.features || (dest.overview && dest.overview.features) || [];
        const validFeatures = rawFeatures.filter(f => {
          const fl = (f || '').toLowerCase().trim();
          if (fl === 'local bazaars' && !isCommercialCity) return false;
          if (fl === 'ghats' && !/ghat|varanasi|haridwar|rishikesh|ujjain|prayagraj|mathura|maheshwar/i.test(tLower)) return false;
          return fl.length > 3;
        });
        if (validFeatures && validFeatures[idx]) {
          return `${dest.title} — ${validFeatures[idx]}`;
        }
        // 4. Fallback to top places names if available
        if (places && places[idx] && places[idx].name && places[idx].name.toLowerCase() !== dest.title.toLowerCase()) {
          return `${dest.title} — ${places[idx].name}`;
        }
        // 5. Category-tailored authentic architectural and nature descriptors
        const typePicks = {
          heritage: [
            'Historic Ramparts & Ancient Architecture',
            'Fort Summit & Flag Bastion',
            'Fortified Stone Gateway & Carvings',
            'Ancient Citadel Ruins & Cisterns',
            'Panoramic Mountain Ramparts'
          ],
          spiritual: [
            'Sacred Sanctum & Ancient Shikhara',
            'Carved Granite Mandapam & Pillars',
            'Sacred Theertham & Temple Waters',
            'Towering Dravidian Gopuram & Spire',
            'Spiritual Courtyard & Inner Shrines'
          ],
          wildlife: [
            'Protected Wildlife Habitat & Canopy',
            'Native Flora & Forest Trails',
            'Wetland Sanctuary Grounds & Wildlife',
            'Wilderness Scenic Vista & Watchtower',
            'Natural Habitat Reserve & Woodlands'
          ],
          beach: [
            'Serene Shoreline & Pristine Waters',
            'Coastal Horizon & Golden Sands',
            'Cascading Coastal Surf & Sands',
            'Pristine Waterfront Promenade',
            'Tranquil Water Vista & Embankment'
          ],
          lakes: [
            'Serene Lake Waters & Reflection',
            'Tranquil Shoreline & Gentle Waves',
            'Scenic Waterfront Embankment',
            'Sunset Over Lake & Mountain Ridge',
            'Emerald Waters & Nature Canopy'
          ],
          hill_station: [
            'Panoramic Mountain Peaks & Valley',
            'Misty Hill Slopes & Pine Ridge',
            'Scenic Valley Lookout & Viewpoint',
            'High Altitude Mountain Ridge',
            'Serene Alpine Horizon & Clouds'
          ]
        };
        const picks = typePicks[dest.type] || [
          'Panoramic Landscape & Horizon',
          'Historic Architecture & Spire',
          'Scenic Nature & Serene Trails',
          'Sacred Temple & Spiritual Sanctuary',
          'Majestic Sunset Vista'
        ];
        return dest.title + ' — ' + (picks[idx % picks.length] || 'Scenic Vista');
      }

      function resolveGalleryCaption(g, idx) {
        if (g && typeof g === 'object' && g.caption && !isGenericLabel(g.caption)) {
          const c = cleanAltText(g.caption);
          if (c) return c;
        }
        const gAlt = (g && typeof g === 'object' && g.alt) ? cleanAltText(g.alt) : '';
        if (gAlt && gAlt.length > 5 && !isGenericLabel(gAlt) && gAlt.toLowerCase() !== dest.title.toLowerCase()) {
          return gAlt.slice(0, 80);
        }
        return (dest.state ? dest.state + ' · ' : '') + (typeLabel(dest.type) || 'Scenic') + ' Landmark';
      }

      // 2. Curated Destination Gallery (Prioritize destination's own authentic gallery photos)
      (dest.gallery || []).forEach(function (g, idx) {
        const srcUrl = typeof g === 'string' ? g : (g && g.src ? g.src : '');
        if (photos.length < 5 && srcUrl) {
          const gTitle = resolveGalleryTitle(g, idx);
          const gCaption = resolveGalleryCaption(g, idx);

          addPhoto({
            src: optimizeImageUrl(srcUrl, 1400),
            title: gTitle,
            subtitle: gCaption,
            category: (typeof g === 'object' && g.category) ? g.category : (dest.type || 'heritage')
          });
        }
      });

      // 3. Backfill with Top Places if gallery has fewer than 5 photos
      (places || []).forEach(function (p) {
        if (photos.length < 5 && p.image && p.image.src) {
          addPhoto({
            src: optimizeImageUrl(p.image.src, 1400),
            title: p.name,
            subtitle: (p.category || 'Attraction') + ' · ' + (p.distance || 'Nearby'),
            category: p.category || 'attraction'
          });
        }
        if (Array.isArray(p.photos)) {
          p.photos.forEach(function (ph) {
            const phSrc = typeof ph === 'string' ? ph : (ph && ph.src ? ph.src : '');
            if (photos.length < 5 && phSrc) {
              addPhoto({
                src: optimizeImageUrl(phSrc, 1400),
                title: p.name,
                subtitle: (p.category || 'Attraction') + ' · ' + (p.distance || 'Nearby'),
                category: p.category || 'attraction'
              });
            }
          });
        }
      });

      if (photos.length === 0 && dest.image && dest.image.src) {
        addPhoto({
          src: optimizeImageUrl(dest.image.src, 1400),
          title: dest.title,
          subtitle: dest.state,
          category: dest.type || 'scenic'
        });
      }
      return photos;
    }

    const real5Photos = get5RealPhotos();

    const ovCarouselHTML =
      '<div class="dest-ov-carousel group" id="destOvCarouselWrap">' +
      '<div id="destOvTrack" class="relative w-full h-full">' +
      real5Photos.map(function (ph, idx) {
        return '<div class="dest-ov-slide ' + (idx === 0 ? 'is-active' : '') + '" data-ovslide="' + idx + '" data-src="' + esc(ph.src) + '">' +
          '<img src="' + esc(ph.src) + '" alt="' + esc(ph.title) + '" decoding="async" referrerpolicy="origin" onerror="this.onerror=null;" />' +
          '<div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"></div>' +
          '<!-- Counter -->' +
          '<div class="dest-ov-counter absolute top-4 left-4 z-20 pointer-events-none">' +
          '<span class="px-3.5 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg flex items-center gap-1.5">' +
          // Bug 17 fix: use real5Photos.length instead of hardcoded 5
          'Photo ' + (idx + 1) + ' of ' + real5Photos.length + ' · ' + esc(dest.title) +
          '</span>' +
          '</div>' +
          '<!-- Slide Caption -->' +
          '<div class="absolute bottom-5 left-5 right-5 z-20 text-left pointer-events-auto">' +
          '<div class="dest-ov-caption-inner">' +
          '<span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500 text-white uppercase tracking-wider mb-1 inline-block capitalize">' +
          esc((ph.category || 'scenic').replace('_', ' ')) +
          '</span>' +
          '<h3 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">' + esc(ph.title) + '</h3>' +
          '<p class="text-white/80 text-xs sm:text-sm max-w-lg mt-0.5">' + esc(ph.subtitle) + '</p>' +
          '</div>' +
          '</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<!-- Arrows -->' +
      '<button type="button" id="destOvPrev" class="dest-ov-btn dest-ov-prev" aria-label="Previous photo">‹</button>' +
      '<button type="button" id="destOvNext" class="dest-ov-btn dest-ov-next" aria-label="Next photo">›</button>' +
      '<!-- 5 Dots -->' +
      '<div id="destOvDots" class="dest-ov-dots" role="group" aria-label="Photo navigation">' +
      real5Photos.map(function (_, i) {
        return '<button type="button" class="dest-ov-dot ' + (i === 0 ? 'is-active' : '') + '" data-ovdot="' + i + '" aria-label="Go to photo ' + (i + 1) + '" aria-current="' + (i === 0 ? 'true' : 'false') + '"></button>';
      }).join('') +
      '</div>' +
      '</div>';

    const bestTimeVal = dest.bestTime && dest.bestTime.label ? esc(dest.bestTime.label) : 'Oct – Mar';
    const summerVal = dest.weather && dest.weather.tempSummer ? esc(dest.weather.tempSummer) : (dest.weather && dest.weather.temp ? esc(dest.weather.temp) : '20°C – 30°C');
    const winterVal = dest.weather && dest.weather.tempWinter ? esc(dest.weather.tempWinter) : '10°C – 20°C';
    let altitudeVal = 'Sea level';
    if (typeof ov.altitude === 'number') {
      altitudeVal = ov.altitude > 0 ? inr(ov.altitude) + ' m' : 'Sea level';
    } else if (ov.altitude) {
      // Strip trailing 'm' or 'M' duplicates then normalise
      var _altStr = String(ov.altitude).trim();
      altitudeVal = /\d\s*m$/i.test(_altStr) ? esc(_altStr) : esc(_altStr) + ' m';
    }

    // Bug 2 fix: replaced emoji icons with SVG icons in summary cards
    const SVG_MTN = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>';
    const SVG_CAL = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
    const SVG_SUN = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
    const SVG_SNW = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/></svg>';
    const summaryHighlightsHTML =
      '<div class="dest-summary-grid">' +
      '<div class="dest-summary-card dest-card-altitude">' +
      '<div class="dest-summary-icon icon-altitude">' + SVG_MTN + '</div>' +
      '<div class="min-w-0 flex-1"><div class="dest-summary-label">Altitude</div><div class="dest-summary-val" title="' + altitudeVal + '">' + altitudeVal + '</div></div>' +
      '</div>' +
      '<div class="dest-summary-card dest-card-time">' +
      '<div class="dest-summary-icon icon-time">' + SVG_CAL + '</div>' +
      '<div class="min-w-0 flex-1"><div class="dest-summary-label">Best Time</div><div class="dest-summary-val" title="' + bestTimeVal + '">' + bestTimeVal + '</div></div>' +
      '</div>' +
      '<div class="dest-summary-card dest-card-summer">' +
      '<div class="dest-summary-icon icon-summer">' + SVG_SUN + '</div>' +
      '<div class="min-w-0 flex-1"><div class="dest-summary-label">Summer Temp</div><div class="dest-summary-val" title="' + summerVal + '">' + summerVal + '</div></div>' +
      '</div>' +
      '<div class="dest-summary-card dest-card-winter">' +
      '<div class="dest-summary-icon icon-winter">' + SVG_SNW + '</div>' +
      '<div class="min-w-0 flex-1"><div class="dest-summary-label">Winter Temp</div><div class="dest-summary-val" title="' + winterVal + '">' + winterVal + '</div></div>' +
      '</div>' +
      '</div>';

    document.getElementById('panel-overview').innerHTML =
      ovCarouselHTML +
      '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +
      '<div class="lg:col-span-2 space-y-6">' +
      summaryHighlightsHTML +
      '<div><span class="tab-calligraphy-kicker">✦ The Chronicles & Heritage ✦</span><h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">About ' + esc(dest.title) + '</h2>' +
      '<p class="text-gray-600 leading-relaxed">' + esc(ov.about || ov.description || dest.short || '') + '</p></div>' +
      '<div><h3 class="font-semibold text-gray-900 mb-3">Known For</h3><div class="flex flex-wrap gap-2">' + features + '</div></div>' +
      '<div><div class="flex items-center justify-between mb-3.5"><div><span class="tab-calligraphy-kicker text-sm">✦ Must-Visit Wonders ✦</span><h3 class="font-bold text-gray-900 dark:text-white text-lg">Top Places to Visit</h3></div>' +
      '<button class="text-sm text-primary font-semibold hover:underline flex items-center gap-1" data-goto="places">See all places →</button></div>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' + topPlaces + '</div></div>' +
      '</div>' +
      '<div class="space-y-4">' +
      '<div class="info-card" id="liveWeather">' +
      '<div class="flex items-center justify-between mb-3">' +
      '<h3 class="font-bold text-gray-900 text-sm uppercase tracking-wider">Live Weather</h3>' +
      '<span class="flex items-center gap-1.5 text-xs font-medium text-emerald-600">' +
      '<span class="live-dot"></span>LIVE</span>' +
      '</div>' +
      '<div id="liveWeatherBody" class="text-sm text-gray-500">Loading current conditions…</div>' +
      '</div>' +
      '<div class="info-card"><h3 class="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Quick Facts</h3>' +
      '<div class="space-y-3">' +
      '<div class="flex justify-between text-sm"><span class="text-gray-500">Region</span><span class="font-medium">' + esc(dest.region) + '</span></div>' +
      '<div class="flex justify-between text-sm"><span class="text-gray-500">State</span><span class="font-medium">' + esc(dest.state) + '</span></div>' +
      altRow +
      (reach && reach.nearestAirport && reach.nearestAirport.name ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Nearest Airport</span><span class="font-medium text-right text-xs max-w-36">' + esc(reach.nearestAirport.name) + ' (' + (reach.nearestAirport.distance || '—') + ' km)</span></div>' : '') +
      (reach && reach.nearestRailway && reach.nearestRailway.name ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Nearest Station</span><span class="font-medium text-right text-xs max-w-36">' + esc(reach.nearestRailway.name) + ' (' + (reach.nearestRailway.distance || '—') + ' km)</span></div>' : '') +
      (reach && reach.nearestMetro && reach.nearestMetro.name ? '<div class="flex justify-between text-sm"><span class="text-gray-500">Nearest Metro</span><span class="font-medium text-right text-xs max-w-36">🚇 ' + esc(reach.nearestMetro.name) + ' (' + (reach.nearestMetro.distance || '—') + ' km)</span></div>' : '') +
      (ov && ov.distanceFromDelhi ? '<div class="flex justify-between text-sm"><span class="text-gray-500">From Delhi</span><span class="font-medium">' + ov.distanceFromDelhi + ' km</span></div>' : (dest.distanceFromDelhi ? '<div class="flex justify-between text-sm"><span class="text-gray-500">From Delhi</span><span class="font-medium">' + dest.distanceFromDelhi + ' km</span></div>' : '')) +
      '</div></div>' +
      '<div class="info-card"><div class="flex items-center justify-between mb-3"><h3 class="font-bold text-gray-900 text-sm uppercase tracking-wider">Stays From</h3>' +
      '<button class="text-xs text-primary font-semibold" data-goto="stays">View all</button></div>' +
      '<div class="space-y-2">' + staysFrom + '</div></div>' +
      overviewBudgetTeaserHTML +
      (reach && reach.roadNote ? '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4"><div class="flex items-start gap-2"><span class="text-lg shrink-0">⚠️</span>' +
        '<div><p class="font-semibold text-amber-900 text-sm mb-1">Road Note</p><p class="text-amber-800 text-xs leading-relaxed">' + esc(reach.roadNote) + '</p></div></div></div>' : '') +
      '</div>' +
      '</div>';

    // Wire overview 5-real-image photo carousel controls
    (function wireOvCarousel() {
      const wrap = document.getElementById('destOvCarouselWrap');
      const prev = document.getElementById('destOvPrev');
      const next = document.getElementById('destOvNext');
      const dots = document.querySelectorAll('#destOvDots .dest-ov-dot');
      const slides = document.querySelectorAll('#destOvTrack .dest-ov-slide');
      if (!wrap || !slides.length) return;

      let cur = 0;
      let timer = null;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function go(idx) {
        cur = (idx + slides.length) % slides.length;
        slides.forEach(function (s, i) {
          const wasActive = s.classList.contains('is-active');
          s.classList.toggle('is-active', i === cur);
          // Re-trigger caption animation: briefly remove then re-add is-active
          // so CSS animation fires again on each slide change
          if (i === cur && !wasActive) {
            s.classList.remove('is-active');
            // Force reflow then re-add to restart animation
            void s.offsetWidth;
            s.classList.add('is-active');
          }
        });
        dots.forEach(function (d, i) {
          d.classList.toggle('is-active', i === cur);
          d.setAttribute('aria-current', i === cur ? 'true' : 'false');
        });
      }

      function start() { if (reduceMotion) return; stop(); timer = setInterval(function () { go(cur + 1); }, 4000); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }

      if (prev) prev.addEventListener('click', function () { go(cur - 1); start(); });
      if (next) next.addEventListener('click', function () { go(cur + 1); start(); });

      dots.forEach(function (d) {
        d.addEventListener('click', function () {
          const i = parseInt(d.getAttribute('data-ovdot'), 10);
          if (!isNaN(i)) { go(i); start(); }
        });
      });

      wrap.addEventListener('mouseenter', stop);
      wrap.addEventListener('mouseleave', start);
      wrap.addEventListener('focusin', stop);
      wrap.addEventListener('focusout', start);

      // ─── TOUCH & DRAG SWIPE ──────────────────────────────
      // Covers: mobile touch, tablet touch, mouse drag
      // Uses Pointer Events API (single unified handler for all input types)
      var swipeStartX = 0;
      var swipeStartY = 0;
      var swipeActive = false;
      var SWIPE_THRESHOLD = 50;   // min px horizontal travel to trigger slide
      var ANGLE_THRESHOLD = 0.7;  // max tan(angle) — prevents diagonal-drag triggers

      wrap.style.touchAction = 'pan-y'; // let vertical scroll still work on mobile

      wrap.addEventListener('pointerdown', function (e) {
        // Only track primary pointer (ignore multi-touch second fingers)
        if (!e.isPrimary) return;
        // Skip swipe if the user clicked a button/dot — let those click events fire normally
        if (e.target.closest('button')) return;
        swipeStartX = e.clientX;
        swipeStartY = e.clientY;
        swipeActive = true;
        stop(); // pause autoplay while dragging
        // NOTE: No setPointerCapture — that blocks child button click events
      });

      wrap.addEventListener('pointermove', function (e) {
        if (!swipeActive || !e.isPrimary) return;
        // Prevent accidental vertical-drag triggering a swipe
        var dx = e.clientX - swipeStartX;
        var dy = e.clientY - swipeStartY;
        // If moving more vertically than horizontally, cancel swipe tracking
        if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dx) < 20) {
          swipeActive = false;
        }
      });

      wrap.addEventListener('pointerup', function (e) {
        if (!swipeActive || !e.isPrimary) return;
        swipeActive = false;
        var dx = e.clientX - swipeStartX;
        var dy = e.clientY - swipeStartY;
        // Check it's a mostly-horizontal gesture
        var isHorizontal = Math.abs(dx) > SWIPE_THRESHOLD &&
          Math.abs(dy) < Math.abs(dx) * ANGLE_THRESHOLD;
        if (isHorizontal) {
          go(dx < 0 ? cur + 1 : cur - 1); // left swipe = next, right swipe = prev
        }
        start(); // resume autoplay
      });

      wrap.addEventListener('pointercancel', function () {
        swipeActive = false;
        start();
      });

      start();
    })();
  }

  // ─── PLACES panel (with category filter) ────────────────
  let placeFilter = 'all';
  function renderPlaces() {
    const cats = [];
    places.forEach(function (p) { if (cats.indexOf(p.category) === -1) cats.push(p.category); });
    let btns = '<button class="shrink-0 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ' +
      (placeFilter === 'all' ? 'dest-filter-btn active' : 'dest-filter-btn') + '" data-place="all">All</button>';
    btns += cats.map(function (c) {
      return '<button class="shrink-0 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all capitalize ' +
        (placeFilter === c ? 'dest-filter-btn active' : 'dest-filter-btn') + '" data-place="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');

    const list = places.filter(function (p) { return placeFilter === 'all' || p.category === placeFilter; });
    const cards = list.map(function (p, i) {
      const fee = p.entryFee === 'Free'
        ? '<span class="text-amber-400 font-medium">Free Entry</span>'
        : '<span class="text-gray-400">Entry: ' + esc(p.entryFee) + '</span>';
      // Bug 14 fix: guard p.image before accessing .src to avoid null crash
      const pImg = (p.image && p.image.src) ? p.image : null;
      return '<div class="card p-0 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all" data-pidx="' + i + '" role="button" tabindex="0"><div class="flex">' +
        '<div class="shrink-0 w-28 h-24 overflow-hidden bg-gray-100">' +
        (pImg ? '<img src="' + esc(optimizeImageUrl(pImg.src, 600)) + '" alt="' + esc(pImg.alt || p.name) + '" class="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" referrerpolicy="origin" onerror="this.onerror=null;this.style.display=\'none\';" />' : '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>') + '</div>' +
        '<div class="p-3 flex-1 min-w-0">' +
        '<div class="flex items-start justify-between gap-2 mb-1"><h3 class="font-bold text-sm text-gray-900 leading-tight">' + esc(p.name) + '</h3>' +
        '<span class="text-amber-400 text-xs font-semibold shrink-0">★ ' + esc(p.rating) + '</span></div>' +
        '<p class="text-xs text-gray-500 mb-1.5 capitalize flex flex-wrap items-center gap-x-2 gap-y-1">' +
        '<span class="inline-block px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-semibold">' + esc(p.category || 'attraction') + '</span> · ' +
        '<span>📍 ' + esc(p.distance || 'Nearby') + '</span> · ' +
        '<span class="text-emerald-700 font-semibold">🚗 ' + esc(getPlaceTravelTime(p, dest.title, dest.state)) + '</span> · ' +
        '<span>⏱ ' + esc(p.duration || '1–2 hrs') + '</span>' +
        '</p>' +
        '<p class="text-xs text-gray-600 leading-relaxed line-clamp-2">' + esc(p.description) + '</p>' +
        '<div class="flex items-center justify-between mt-2 text-xs"><div class="flex gap-3">' + fee + '<span class="text-gray-400">' + esc(p.timings) + '</span></div>' +
        '<span class="text-amber-400 font-semibold shrink-0">View details →</span></div>' +
        '</div></div></div>';
    }).join('');

    document.getElementById('panel-places').innerHTML =
      '<div class="flex items-center justify-between mb-6"><div><span class="tab-calligraphy-kicker">✦ Sacred Sanctuaries & Must-Visit Wonders ✦</span><h2 class="text-2xl font-bold text-gray-900 dark:text-white">Places to Visit in ' + esc(dest.title) + '</h2></div></div>' +
      '<div class="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">' + btns + '</div>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' + cards + '</div>';

    document.querySelectorAll('#panel-places [data-place]').forEach(function (b) {
      b.addEventListener('click', function () { placeFilter = b.getAttribute('data-place'); renderPlaces(); });
    });
    document.querySelectorAll('#panel-places [data-pidx]').forEach(function (card) {
      const p = list[parseInt(card.getAttribute('data-pidx'), 10)];
      card.addEventListener('click', function () { openPlaceModal(p); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlaceModal(p); }
      });
    });
  }

  // ─── STAYS panel (with tier filter) ─────────────────────
  let stayTier = 'all';
  function renderStays() {
    const allBtn = '<button class="px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ' +
      (stayTier === 'all' ? 'dest-filter-btn active' : 'dest-filter-btn') + '" data-tier="all">All Stays</button>';
    const tierBtns = Object.keys(PRICE_TIERS).filter(function (key) {
      return hotels.some(function (s) { return s.tier === key; });
    }).map(function (key) {
      const active = stayTier === key ? ' active ring-2 ring-offset-1 ring-amber-400/80 shadow-md shadow-amber-400/25' : ' opacity-75 hover:opacity-100';
      return '<button class="px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ' + tierColor(key) + active + '" data-tier="' + key + '">' + PRICE_TIERS[key].label + '</button>';
    }).join('');

    const list = hotels.filter(function (s) { return stayTier === 'all' || s.tier === stayTier; });
    let cards;
    // Bug 2 fix: replaced 🏨 emoji with SVG hotel icon
    const SVG_HOTEL = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400" aria-hidden="true"><path d="M2 22h20"/><path d="M2 11h20"/><path d="M6 11V7a2 2 0 012-2h8a2 2 0 012 2v4"/><rect x="8" y="15" width="8" height="7" rx="1"/></svg>';
    if (list.length === 0) {
      cards = '<div class="text-center py-16"><div class="mb-3 flex justify-center">' + SVG_HOTEL + '</div>' +
        '<p class="text-gray-600 font-medium">No stays in this price category</p>' +
        '<button class="mt-3 text-amber-400 text-sm font-semibold" data-tier="all">Show all stays</button></div>';
    } else {
      cards = list.map(function (s) {
        const tags = (s.tags || []).map(function (t) { return '<span class="text-xs bg-amber-500/15 text-amber-300 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold">' + esc(t) + '</span>'; }).join('');
        const ams = (s.amenities || []).map(function (a) { return '<span class="amenity-chip text-xs bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-lg text-gray-700 dark:text-gray-300 font-medium">' + esc(a) + '</span>'; }).join('');
        const googleUrl = s.url || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.name + ' ' + dest.title + ' ' + (dest.state || '')));
        return '<div class="card p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-amber-400/50 hover:shadow-xl transition-all group">' +
          '<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">' +
          '<div class="min-w-0 flex-1">' +
          '<div class="flex items-center gap-2.5 flex-wrap mb-2">' +
          '<a href="' + esc(googleUrl) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-white hover:text-amber-400">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 22h20"/><path d="M2 11h20"/><path d="M6 11V7a2 2 0 012-2h8a2 2 0 012 2v4"/><rect x="8" y="15" width="8" height="7" rx="1"/></svg> ' + esc(s.name) + ' <span class="text-xs text-amber-400 font-bold" aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>' +
          '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full ' + tierColor(s.tier) + '">' + (PRICE_TIERS[s.tier] ? PRICE_TIERS[s.tier].label : s.tier) + '</span>' +
          '<span class="text-xs text-gray-500 capitalize bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md font-medium">' + esc(s.type) + '</span>' +
          '</div>' +
          '<div class="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">' +
          '<span><span class="text-amber-400">★</span> <strong class="text-gray-800 dark:text-gray-200">' + esc(s.rating) + '</strong> <a href="' + esc(googleUrl) + '" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-amber-400 underline">(' + esc(s.reviews) + ' reviews)</a></span>' +
          (tags ? '<span class="flex gap-1.5">' + tags + '</span>' : '') +
          '</div>' +
          '<div class="flex flex-wrap gap-1.5">' + ams + '</div>' +
          '</div>' +
          '<div class="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-white/10 gap-2">' +
          '<div class="text-right">' +
          '<span class="text-2xl font-extrabold text-gray-900 dark:text-white">₹' + inr(s.priceMin) + '</span>' +
          '<span class="text-gray-400 text-xs block">to ₹' + inr(s.priceMax) + ' / night</span>' +
          '</div>' +
          '<a href="' + esc(googleUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-amber-500/20">Google Maps ↗</a>' +
          '</div>' +
          '</div></div>';
      }).join('');
      cards = '<div class="space-y-4">' + cards + '</div>';
    }

    document.getElementById('panel-stays').innerHTML =
      '<div class="flex items-center justify-between mb-4"><div><span class="tab-calligraphy-kicker">✦ Regal Stays & Boutique Sanctuaries ✦</span><h2 class="text-2xl font-bold text-gray-900 dark:text-white">Where to Stay in ' + esc(dest.title) + '</h2></div></div>' +
      '<div class="flex gap-2 flex-wrap mb-6">' + allBtn + tierBtns + '</div>' + cards;

    document.querySelectorAll('#panel-stays [data-tier]').forEach(function (b) {
      b.addEventListener('click', function () { stayTier = b.getAttribute('data-tier'); renderStays(); });
    });
  }

  // ─── BUDGET panel ───────────────────────────────────────
  function renderBudget(triggerPulse) {
    const b = computeBudgetState();
    const panel = document.getElementById('panel-budget');
    if (!panel) return;

    // SVG icons
    const SVG_WALLET = '<svg class="text-amber-400" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>';
    const SVG_USER = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    const SVG_USERS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    const SVG_FAMILY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="2"/></svg>';
    const SVG_GROUP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>';
    const SVG_STAY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
    const SVG_CAR = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 17H5M3 11l1.5-4.5A2 2 0 0 1 6.4 5h11.2a2 2 0 0 1 1.9 1.5L21 11v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="17" r="1"/></svg>';
    const SVG_FOOD = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>';
    const SVG_TICKET = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>';
    const SVG_DOWNLOAD = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    const SVG_PRINT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';
    const SVG_EXT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>';

    // Partner search queries
    const qStr = encodeURIComponent(dest.title + ' ' + (dest.state || 'India'));
    const matchedHotelUrl = (b.matchedHotel && b.matchedHotel.url) ? b.matchedHotel.url : ('https://www.google.com/travel/hotels?q=' + qStr);

    // Hotel dropdown options
    let hotelOptionsHtml = '';
    if (hotels && hotels.length > 0) {
      hotelOptionsHtml = hotels.map(function (h, idx) {
        const hPrice = h.priceMin ? ('₹' + inr(h.priceMin)) : (h.price ? ('₹' + inr(h.price)) : 'Standard');
        const hTier = h.tier ? (' [' + h.tier.toUpperCase() + ']') : '';
        const isSel = (budgetSelectedHotelIdx === idx);
        return '<option value="' + idx + '"' + (isSel ? ' selected' : '') + '>' + esc(h.name) + hTier + ' — ' + hPrice + '/nt</option>';
      }).join('');
    }

    // Sightseeing Checklist HTML
    const activeSightsCount = b.includedAttractions.filter(function (a) { return !a.isExcluded; }).length;
    let sightsChecklistHtml = '';
    if (b.includedAttractions && b.includedAttractions.length > 0) {
      sightsChecklistHtml =
        '<div class="budget-sights-checklist" id="budgetSightsList">' +
        b.includedAttractions.map(function (att) {
          return '<div class="budget-sight-item">' +
            '<label class="budget-sight-label" title="' + esc(att.name) + '">' +
            '<input type="checkbox" class="budget-sight-chk" data-sight-name="' + esc(att.name) + '"' + (!att.isExcluded ? ' checked' : '') + ' />' +
            '<span class="truncate max-w-[140px] sm:max-w-[180px]">' + esc(att.name) + '</span>' +
            '</label>' +
            '<span class="text-[11px] font-mono font-semibold shrink-0 ' + (att.isFree ? 'text-emerald-400' : 'text-purple-300') + '">' +
            (att.isFree ? 'Free' : esc(att.fee)) +
            '</span>' +
            '</div>';
        }).join('') +
        '</div>';
    }

    panel.innerHTML =
      '<div class="budget-sim-container">' +
      // Header Banner
      '<div class="budget-header-box">' +
      '<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">' +
      '<div>' +
      '<span class="tab-calligraphy-kicker">✦ Real-Time Financial Simulator ✦</span>' +
      '<h2 class="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">' +
      SVG_WALLET +
      '<span>Smart Budget Estimator — ' + esc(dest.title) + '</span>' +
      '</h2>' +
      '<p class="text-sm text-slate-300 mt-1 max-w-2xl">Interactive trip cost forecasting computed dynamically using this destination\'s actual hotel tiers, verified local transit rates, dining norms, and entry fees.</p>' +
      '</div>' +
      '<div class="flex items-center gap-2 flex-wrap shrink-0">' +
      '<span class="budget-stat-badge">₹ INR Indian Rupee</span>' +
      '<span class="budget-stat-badge !bg-emerald-500/20 !border-emerald-500/40 !text-emerald-300">Live Synchronized</span>' +
      '</div>' +
      '</div>' +
      '</div>' +

      // Controls Grid
      '<div class="budget-controls-grid">' +
      // Traveler Count Card
      '<div class="budget-card">' +
      '<div class="budget-card-title">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' +
      '<span>1. Traveler Count</span>' +
      '</div>' +
      '<div class="budget-pax-group">' +
      '<button type="button" class="budget-pax-btn' + (b.pKey === 'solo' ? ' is-active' : '') + '" data-bpax="solo">' +
      SVG_USER +
      '<span class="budget-pax-name">Solo</span><span class="budget-pax-desc">1 Adult</span>' +
      '</button>' +
      '<button type="button" class="budget-pax-btn' + (b.pKey === 'couple' ? ' is-active' : '') + '" data-bpax="couple">' +
      SVG_USERS +
      '<span class="budget-pax-name">Couple</span><span class="budget-pax-desc">2 Adults</span>' +
      '</button>' +
      '<button type="button" class="budget-pax-btn' + (b.pKey === 'family' ? ' is-active' : '') + '" data-bpax="family">' +
      SVG_FAMILY +
      '<span class="budget-pax-name">Family</span><span class="budget-pax-desc">2 Adults, 2 Kids</span>' +
      '</button>' +
      '<button type="button" class="budget-pax-btn' + (b.pKey === 'group' ? ' is-active' : '') + '" data-bpax="group">' +
      SVG_GROUP +
      '<span class="budget-pax-name">Group</span><span class="budget-pax-desc">4 Adults</span>' +
      '</button>' +
      '</div>' +
      '</div>' +

      // Travel Style Card
      '<div class="budget-card">' +
      '<div class="budget-card-title">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>' +
      '<span>2. Travel Style</span>' +
      '</div>' +
      '<div class="budget-style-group">' +
      '<button type="button" class="budget-style-btn' + (b.sKey === 'backpacker' ? ' is-active' : '') + '" data-bstyle="backpacker">' +
      '<span class="budget-style-symbol">₹</span>' +
      '<span class="budget-style-title">Backpacker</span>' +
      '<span class="budget-style-sub">Hostel & Street Food</span>' +
      '</button>' +
      '<button type="button" class="budget-style-btn' + (b.sKey === 'moderate' ? ' is-active' : '') + '" data-bstyle="moderate">' +
      '<span class="budget-style-symbol">₹₹</span>' +
      '<span class="budget-style-title">Moderate</span>' +
      '<span class="budget-style-sub">3-Star & City Cabs</span>' +
      '</button>' +
      '<button type="button" class="budget-style-btn' + (b.sKey === 'luxury' ? ' is-active' : '') + '" data-bstyle="luxury">' +
      '<span class="budget-style-symbol">₹₹₹</span>' +
      '<span class="budget-style-title">Luxury</span>' +
      '<span class="budget-style-sub">Palaces & Chauffeur</span>' +
      '</button>' +
      '</div>' +
      '</div>' +

      // Trip Duration Slider Card
      '<div class="budget-card">' +
      '<div class="budget-card-title">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
      '<span>3. Trip Duration</span>' +
      '</div>' +
      '<div class="budget-duration-control">' +
      '<div class="budget-duration-val-wrap">' +
      '<span class="budget-duration-num" id="budgetDurationDisplay">' + b.dVal + ' Days</span>' +
      '<span class="budget-duration-nights">(' + b.nights + ' Nights)</span>' +
      '</div>' +
      '<input type="range" min="2" max="7" step="1" value="' + b.dVal + '" class="budget-slider-range" id="budgetDaysSlider" aria-label="Trip duration in days" />' +
      '<div class="budget-duration-presets">' +
      '<button type="button" class="budget-preset-pill' + (b.dVal === 2 ? ' is-active' : '') + '" data-bdays="2">2 Days</button>' +
      '<button type="button" class="budget-preset-pill' + (b.dVal === 3 ? ' is-active' : '') + '" data-bdays="3">3 Days</button>' +
      '<button type="button" class="budget-preset-pill' + (b.dVal === 5 ? ' is-active' : '') + '" data-bdays="5">5 Days</button>' +
      '<button type="button" class="budget-preset-pill' + (b.dVal === 7 ? ' is-active' : '') + '" data-bdays="7">7 Days</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>' +

      // Detail Checking & Inclusions Strip
      '<div class="budget-audit-strip">' +
      '<div class="flex items-center gap-2.5 flex-wrap">' +
      '<span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' +
      '<span>Check & Audit Details:</span>' +
      '</span>' +
      '<span class="text-xs text-slate-300">' + b.checkedCount + ' of 5 components included · ' + activeSightsCount + ' of ' + b.includedAttractions.length + ' attractions active</span>' +
      '</div>' +
      '<div class="flex items-center gap-2 flex-wrap">' +
      '<button type="button" class="budget-check-details-btn" id="budgetResetDetailsBtn" title="Reset all custom inclusions to default">' +
      '<span>↺ Reset to Defaults</span>' +
      '</button>' +
      '<button type="button" class="budget-recalc-btn" id="budgetRecalcBtn" title="Re-estimate and calculate updated budget">' +
      '<span>⚡ Update Estimated Value</span>' +
      '</button>' +
      '</div>' +
      '</div>' +

      // Total Hero Card & Visual Distribution
      '<div class="budget-total-hero">' +
      '<div>' +
      '<div class="budget-total-heading">Estimated Total Trip Cost (' + b.dVal + ' Days · ' + b.pCfg.label + ')</div>' +
      '<div class="budget-total-amount" id="budgetHeroTotal">₹' + inr(b.grandTotal) + '</div>' +
      '<div class="budget-total-sub-wrap">' +
      '<span class="budget-stat-badge">₹' + inr(b.perPerson) + ' / person</span>' +
      '<span class="budget-stat-badge">₹' + inr(b.perDay) + ' / day</span>' +
      '<span class="text-xs text-slate-400">Includes ' + (budgetIncludeBuffer ? '5% safety buffer' : '0% buffer') + ' & zero platform markup</span>' +
      '</div>' +
      '</div>' +
      '<div class="budget-distrib-wrap">' +
      '<div class="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">' +
      '<span>Cost Distribution</span>' +
      '<span>' + (b.grandTotal > 0 ? '100% Comprehensive' : '0 Selected') + '</span>' +
      '</div>' +
      '<div class="budget-distrib-bar" role="progressbar" aria-label="Trip cost distribution">' +
      '<div class="budget-bar-seg budget-bar-seg-stays" style="width:' + b.pctStay + '%" title="Stays: ₹' + inr(b.totalStay) + ' (' + b.pctStay + '%)"></div>' +
      '<div class="budget-bar-seg budget-bar-seg-transport" style="width:' + b.pctTrans + '%" title="Transport: ₹' + inr(b.totalTransport) + ' (' + b.pctTrans + '%)"></div>' +
      '<div class="budget-bar-seg budget-bar-seg-food" style="width:' + b.pctFood + '%" title="Food: ₹' + inr(b.totalFood) + ' (' + b.pctFood + '%)"></div>' +
      '<div class="budget-bar-seg budget-bar-seg-entry" style="width:' + b.pctEntry + '%" title="Entry Fees: ₹' + inr(b.totalEntry) + ' (' + b.pctEntry + '%)"></div>' +
      '<div class="budget-bar-seg budget-bar-seg-buffer" style="width:' + b.pctBuffer + '%" title="Buffer: ₹' + inr(b.bufferCost) + ' (' + b.pctBuffer + '%)"></div>' +
      '</div>' +
      '<div class="budget-distrib-legend">' +
      '<div class="budget-legend-item"><span class="budget-legend-dot" style="background:#F59E0B"></span>Stays ₹' + inr(b.totalStay) + ' (' + b.pctStay + '%)</div>' +
      '<div class="budget-legend-item"><span class="budget-legend-dot" style="background:#0EA5E9"></span>Transit ₹' + inr(b.totalTransport) + ' (' + b.pctTrans + '%)</div>' +
      '<div class="budget-legend-item"><span class="budget-legend-dot" style="background:#10B981"></span>Dining ₹' + inr(b.totalFood) + ' (' + b.pctFood + '%)</div>' +
      '<div class="budget-legend-item"><span class="budget-legend-dot" style="background:#8B5CF6"></span>Tickets ₹' + inr(b.totalEntry) + ' (' + b.pctEntry + '%)</div>' +
      '<div class="budget-legend-item"><span class="budget-legend-dot" style="background:#EC4899"></span>Buffer ₹' + inr(b.bufferCost) + ' (' + b.pctBuffer + '%)</div>' +
      '</div>' +
      '<div class="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">' +
      '<label class="budget-item-checkbox text-xs cursor-pointer">' +
      '<input type="checkbox" id="chkBufferInclude"' + (budgetIncludeBuffer ? ' checked' : '') + ' />' +
      '<span>Include 5% Safety Buffer (₹' + inr(b.bufferCost) + ')</span>' +
      '</label>' +
      '<span class="text-slate-400 text-[11px]">Dynamic updates on every change</span>' +
      '</div>' +
      '</div>' +
      '</div>' +

      // 4-Card Itemized Breakdown
      '<div class="budget-breakdown-grid">' +
      // Stays Card
      '<div class="budget-item-card' + (!budgetIncludeStays ? ' is-excluded' : '') + '">' +
      '<div>' +
      '<div class="budget-item-top mb-3">' +
      '<div class="budget-item-icon-box text-amber-400">' + SVG_STAY + '</div>' +
      '<div class="flex items-center gap-1.5">' +
      (!budgetIncludeStays ? '<span class="budget-excluded-tag">Excluded</span>' : '') +
      '<span class="budget-item-badge">' + b.nights + ' Nights</span>' +
      '</div>' +
      '</div>' +
      '<div class="budget-item-category">Accommodation</div>' +
      '<div class="budget-item-cost">₹' + inr(b.totalStay) + '</div>' +
      '<p class="budget-item-details mt-2"><strong>' + esc(b.stayTierLabel) + '</strong><br>' +
      (budgetIncludeStays
        ? ((b.matchedHotel ? 'Based on: <span class="text-amber-400 font-semibold">' + esc(b.matchedHotel.name) + '</span>' : 'Verified local guesthouses & hotels') + '<br>~₹' + inr(b.nightlyRate) + ' / night')
        : 'Self-arranged / staying with friends / excluded from budget estimate') +
      '</p>' +
      (budgetIncludeStays && hotels && hotels.length > 0
        ? ('<div class="mt-2.5">' +
          '<label for="selHotelPicker" class="text-[11px] text-slate-400 font-semibold block mb-1">Check Specific Hotel:</label>' +
          '<select id="selHotelPicker" class="budget-select-picker" aria-label="Select specific hotel">' +
          '<option value="-1"' + (budgetSelectedHotelIdx === -1 ? ' selected' : '') + '>Auto-Matched (' + esc(b.sKey.toUpperCase()) + ' Tier)</option>' +
          hotelOptionsHtml +
          '</select>' +
          '</div>')
        : '') +
      '</div>' +
      '<div class="budget-item-toggle-wrap">' +
      '<label class="budget-item-checkbox">' +
      '<input type="checkbox" id="chkStayInclude"' + (budgetIncludeStays ? ' checked' : '') + ' />' +
      '<span>Include Hotel Stays</span>' +
      '</label>' +
      '<button type="button" class="text-xs text-amber-400 font-semibold text-left hover:underline cursor-pointer" data-goto="stays">Explore all →</button>' +
      '</div>' +
      '</div>' +

      // Transport Card
      '<div class="budget-item-card' + (!budgetIncludeTransport ? ' is-excluded' : '') + '">' +
      '<div>' +
      '<div class="budget-item-top mb-3">' +
      '<div class="budget-item-icon-box text-sky-400">' + SVG_CAR + '</div>' +
      '<div class="flex items-center gap-1.5">' +
      (!budgetIncludeTransport ? '<span class="budget-excluded-tag">Excluded</span>' : '') +
      '<span class="budget-item-badge">' + b.dVal + ' Days Mobility</span>' +
      '</div>' +
      '</div>' +
      '<div class="budget-item-category">Local Transport</div>' +
      '<div class="budget-item-cost">₹' + inr(b.totalTransport) + '</div>' +
      '<p class="budget-item-details mt-2"><strong>' + esc(b.transportDesc) + '</strong><br>' +
      (budgetIncludeTransport
        ? ('Local sightseeing hops, railway/bus station transit & city mobility.<br>~₹' + inr(b.dailyTransport) + ' / day')
        : 'Own vehicle / walking / excluded from budget estimate') +
      '</p>' +
      '</div>' +
      '<div class="budget-item-toggle-wrap">' +
      '<label class="budget-item-checkbox">' +
      '<input type="checkbox" id="chkTransportInclude"' + (budgetIncludeTransport ? ' checked' : '') + ' />' +
      '<span>Include Local Transit</span>' +
      '</label>' +
      '<button type="button" class="text-xs text-sky-400 font-semibold text-left hover:underline cursor-pointer" data-goto="reach">Routes →</button>' +
      '</div>' +
      '</div>' +

      // Food & Dining Card
      '<div class="budget-item-card' + (!budgetIncludeFood ? ' is-excluded' : '') + '">' +
      '<div>' +
      '<div class="budget-item-top mb-3">' +
      '<div class="budget-item-icon-box text-emerald-400">' + SVG_FOOD + '</div>' +
      '<div class="flex items-center gap-1.5">' +
      (!budgetIncludeFood ? '<span class="budget-excluded-tag">Excluded</span>' : '') +
      '<span class="budget-item-badge">All Meals</span>' +
      '</div>' +
      '</div>' +
      '<div class="budget-item-category">Food & Dining</div>' +
      '<div class="budget-item-cost">₹' + inr(b.totalFood) + '</div>' +
      '<p class="budget-item-details mt-2"><strong>' + esc(b.diningDesc) + '</strong><br>' +
      (budgetIncludeFood
        ? ('Breakfast, lunch, dinner & local tea/coffee stops.<br>~₹' + inr(b.adultMealPerDay) + ' / adult / day')
        : 'Self-catered / complimentary meals / excluded from budget estimate') +
      '</p>' +
      '</div>' +
      '<div class="budget-item-toggle-wrap">' +
      '<label class="budget-item-checkbox">' +
      '<input type="checkbox" id="chkFoodInclude"' + (budgetIncludeFood ? ' checked' : '') + ' />' +
      '<span>Include Meals & Dining</span>' +
      '</label>' +
      '<span class="text-xs text-slate-400 font-medium">Regional cuisine</span>' +
      '</div>' +
      '</div>' +

      // Sightseeing & Entry Fees Card
      '<div class="budget-item-card' + (!budgetIncludeEntry ? ' is-excluded' : '') + '">' +
      '<div>' +
      '<div class="budget-item-top mb-3">' +
      '<div class="budget-item-icon-box text-purple-400">' + SVG_TICKET + '</div>' +
      '<div class="flex items-center gap-1.5">' +
      (!budgetIncludeEntry ? '<span class="budget-excluded-tag">Excluded</span>' : '') +
      '<span class="budget-item-badge">' + activeSightsCount + ' Sights</span>' +
      '</div>' +
      '</div>' +
      '<div class="budget-item-category">Entry Fees & Permits</div>' +
      '<div class="budget-item-cost">₹' + inr(b.totalEntry) + '</div>' +
      '<p class="budget-item-details mt-2">' +
      (budgetIncludeEntry
        ? ('Calculated directly from topPlaces tickets & passes across ' + activeSightsCount + ' active attractions.<br>' +
          (b.includedAttractions.length ? '<span class="text-xs text-slate-400">Sample: ' + b.includedAttractions.slice(0, 2).map(function (a) { return esc(a.name) + ' (' + esc(a.fee) + ')'; }).join(', ') + '</span>' : 'Many sanctuaries offer free devotee access'))
        : 'Attraction tickets excluded from budget estimate') +
      '</p>' +
      (budgetIncludeEntry && b.includedAttractions.length > 0
        ? ('<div class="mt-2.5">' +
          '<button type="button" id="btnToggleSightsAudit" class="text-xs text-purple-300 font-semibold hover:text-purple-200 cursor-pointer flex items-center justify-between w-full py-1 border-t border-white/10">' +
          '<span>Check Sightseeing Places (' + activeSightsCount + '/' + b.includedAttractions.length + ')</span>' +
          '<span class="text-purple-400">' + (budgetSightsOpen ? '▲ Hide List' : '▼ Audit Sights') + '</span>' +
          '</button>' +
          (budgetSightsOpen ? sightsChecklistHtml : '') +
          '</div>')
        : '') +
      '</div>' +
      '<div class="budget-item-toggle-wrap">' +
      '<label class="budget-item-checkbox">' +
      '<input type="checkbox" id="chkEntryInclude"' + (budgetIncludeEntry ? ' checked' : '') + ' />' +
      '<span>Include Entry Tickets</span>' +
      '</label>' +
      '<button type="button" class="text-xs text-purple-400 font-semibold text-left hover:underline cursor-pointer" data-goto="places">Attractions →</button>' +
      '</div>' +
      '</div>' +
      '</div>' +

      // Pro Tip Banner
      '<div class="budget-protip-box">' +
      '<span class="text-xl shrink-0">💡</span>' +
      '<div class="budget-protip-text">' + esc(b.proTip) + '</div>' +
      '</div>' +

      // Actions & Download Strip
      '<div class="budget-actions-bar">' +
      '<div class="flex items-center gap-3 flex-wrap">' +
      '<button type="button" class="budget-download-btn" id="budgetDownloadBtn" aria-label="Download travel budget estimate breakdown as a text file">' +
      SVG_DOWNLOAD +
      '<span>Download Budget Plan (.txt)</span>' +
      '</button>' +
      '<button type="button" class="budget-partner-btn" id="budgetPrintBtn" aria-label="Print or Save PDF slip">' +
      SVG_PRINT +
      '<span>Print / PDF Slip</span>' +
      '</button>' +
      '</div>' +
      '<div class="budget-actions-note text-xs text-center sm:text-right">' +
      'Zero booking fees · 100% Free Open Travel Intelligence' +
      '</div>' +
      '</div>' +

      // Verified Booking Partners Section
      '<div class="budget-partners-section">' +
      '<div class="budget-partners-title">Verified Booking Partners & Direct Links</div>' +
      '<div class="budget-partners-grid">' +
      '<a href="' + esc(matchedHotelUrl) + '" target="_blank" rel="noopener noreferrer" class="budget-partner-card">' +
      '<div><div class="budget-partner-card-name">Hotel Booking (Direct)</div><div class="budget-partner-card-desc truncate max-w-[170px]">' + esc(b.matchedHotel ? b.matchedHotel.name : 'Google Hotels') + '</div></div>' +
      SVG_EXT +
      '</a>' +
      '<a href="https://www.google.com/travel/hotels?q=' + qStr + '" target="_blank" rel="noopener noreferrer" class="budget-partner-card">' +
      '<div><div class="budget-partner-card-name">Google Travel Hotels</div><div class="budget-partner-card-desc">Compare live rates in ' + esc(dest.title) + '</div></div>' +
      SVG_EXT +
      '</a>' +
      '<a href="https://www.irctc.co.in/" target="_blank" rel="noopener noreferrer" class="budget-partner-card">' +
      '<div><div class="budget-partner-card-name">IRCTC Rail Tickets</div><div class="budget-partner-card-desc">Check trains to nearest railhead</div></div>' +
      SVG_EXT +
      '</a>' +
      '<a href="https://www.redbus.in/" target="_blank" rel="noopener noreferrer" class="budget-partner-card">' +
      '<div><div class="budget-partner-card-name">Interstate Bus (RedBus)</div><div class="budget-partner-card-desc">Direct state buses & sleeper coaches</div></div>' +
      SVG_EXT +
      '</a>' +
      '</div>' +
      '</div>' +

      '</div>';

    // Wire up event listeners
    panel.querySelectorAll('[data-bpax]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        budgetPax = btn.getAttribute('data-bpax');
        renderBudget(true);
      });
    });

    panel.querySelectorAll('[data-bstyle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        budgetStyle = btn.getAttribute('data-bstyle');
        renderBudget(true);
      });
    });

    panel.querySelectorAll('[data-bdays]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        budgetDays = parseInt(btn.getAttribute('data-bdays'), 10);
        renderBudget(true);
      });
    });

    const slider = document.getElementById('budgetDaysSlider');
    if (slider) {
      slider.addEventListener('input', function () {
        budgetDays = parseInt(slider.value, 10);
        const disp = document.getElementById('budgetDurationDisplay');
        if (disp) disp.textContent = budgetDays + ' Days';
        const nightsSpan = panel.querySelector('.budget-duration-nights');
        if (nightsSpan) nightsSpan.textContent = '(' + Math.max(1, budgetDays - 1) + ' Nights)';
        const bLive = computeBudgetState();
        const totalEl = document.getElementById('budgetHeroTotal');
        if (totalEl) totalEl.textContent = '₹' + inr(bLive.grandTotal);
      });
      slider.addEventListener('change', function () {
        budgetDays = parseInt(slider.value, 10);
        renderBudget(true);
      });
    }

    // Detail Audit Bar Buttons
    const resetBtn = document.getElementById('budgetResetDetailsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        budgetIncludeStays = true;
        budgetSelectedHotelIdx = -1;
        budgetIncludeTransport = true;
        budgetIncludeFood = true;
        budgetIncludeEntry = true;
        budgetExcludedPlaces.clear();
        budgetIncludeBuffer = true;
        renderBudget(true);
      });
    }

    const recalcBtn = document.getElementById('budgetRecalcBtn');
    if (recalcBtn) {
      recalcBtn.addEventListener('click', function () {
        renderBudget(true);
      });
    }

    // Inclusion Checkboxes & Selectors
    const chkStay = document.getElementById('chkStayInclude');
    if (chkStay) {
      chkStay.addEventListener('change', function () {
        budgetIncludeStays = chkStay.checked;
        renderBudget(true);
      });
    }

    const selHotel = document.getElementById('selHotelPicker');
    if (selHotel) {
      selHotel.addEventListener('change', function () {
        budgetSelectedHotelIdx = parseInt(selHotel.value, 10);
        budgetIncludeStays = true;
        renderBudget(true);
      });
    }

    const chkTrans = document.getElementById('chkTransportInclude');
    if (chkTrans) {
      chkTrans.addEventListener('change', function () {
        budgetIncludeTransport = chkTrans.checked;
        renderBudget(true);
      });
    }

    const chkFood = document.getElementById('chkFoodInclude');
    if (chkFood) {
      chkFood.addEventListener('change', function () {
        budgetIncludeFood = chkFood.checked;
        renderBudget(true);
      });
    }

    const chkEntry = document.getElementById('chkEntryInclude');
    if (chkEntry) {
      chkEntry.addEventListener('change', function () {
        budgetIncludeEntry = chkEntry.checked;
        renderBudget(true);
      });
    }

    const chkBuffer = document.getElementById('chkBufferInclude');
    if (chkBuffer) {
      chkBuffer.addEventListener('change', function () {
        budgetIncludeBuffer = chkBuffer.checked;
        renderBudget(true);
      });
    }

    // Toggle Sights Audit Checklist
    const btnSightsToggle = document.getElementById('btnToggleSightsAudit');
    if (btnSightsToggle) {
      btnSightsToggle.addEventListener('click', function () {
        budgetSightsOpen = !budgetSightsOpen;
        renderBudget(false);
      });
    }

    // Sights Checklist checkboxes
    panel.querySelectorAll('.budget-sight-chk').forEach(function (chk) {
      chk.addEventListener('change', function () {
        const sName = chk.getAttribute('data-sight-name');
        if (!chk.checked) {
          budgetExcludedPlaces.add(sName);
        } else {
          budgetExcludedPlaces.delete(sName);
        }
        renderBudget(true);
      });
    });

    const dlBtn = document.getElementById('budgetDownloadBtn');
    if (dlBtn) {
      dlBtn.addEventListener('click', function () {
        downloadBudgetBreakdownFile(b);
      });
    }

    const prBtn = document.getElementById('budgetPrintBtn');
    if (prBtn) {
      prBtn.addEventListener('click', function () {
        window.print();
      });
    }

    // Delegated clicks for switching tabs
    panel.querySelectorAll('[data-goto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTab(btn.getAttribute('data-goto'));
      });
    });

    // Pulse animation for estimated value update
    if (triggerPulse) {
      const heroTot = document.getElementById('budgetHeroTotal');
      if (heroTot) {
        heroTot.classList.remove('budget-pulse-update');
        void heroTot.offsetWidth; // Force reflow
        heroTot.classList.add('budget-pulse-update');
      }
    }
  }

  // ─── REACH panel ────────────────────────────────────────
  let reachCity = 'all';
  function renderReach() {
    const routes = reach.routes || [];
    const delhiRoute = routes.find(function (r) { return r.from && r.from.indexOf('Delhi') >= 0; }) || {};
    const delhiCar = delhiRoute.byCar || 'Via road';

    const cityOpts = '<option value="all">All States & UTs (' + routes.length + ' Origins)</option>' + routes.map(function (r) {
      return '<option value="' + esc(r.from) + '"' + (reachCity === r.from ? ' selected' : '') + '>' + esc(r.from) + ' · ' + r.distance + ' km</option>';
    }).join('');

    const shown = routes.filter(function (r) { return reachCity === 'all' || r.from === reachCity; });
    const rows = shown.map(function (r) {
      return '<tr><td><span class="font-semibold text-gray-900">' + esc(r.from) + '</span></td>' +
        '<td><span class="font-medium text-primary">' + r.distance + ' km</span></td>' +
        '<td>' + esc(r.byCar) + '</td><td class="text-xs">' + esc(r.byTrain) + '</td>' +
        '<td class="text-xs">' + esc(r.byAir) + '</td><td class="text-xs text-gray-500">' + esc(r.via) + '</td></tr>';
    }).join('');

    let selectedBanner = '';
    if (reachCity !== 'all') {
      const target = routes.find(function (r) { return r.from === reachCity; });
      if (target) {
        let recMode = '🚗 Direct Drive / Bus';
        let recBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
        if (target.distance > 700 && reach.nearestAirport && reach.nearestAirport.name) {
          recMode = '✈️ Flight to ' + esc(reach.nearestAirport.name) + ' (' + reach.nearestAirport.distance + ' km away) + Taxi';
          recBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
        } else if (target.distance > 300 && reach.nearestRailway && reach.nearestRailway.name) {
          recMode = '🚂 Express Train to ' + esc(reach.nearestRailway.name) + ' (' + reach.nearestRailway.distance + ' km away) or 🚗 Drive';
          recBadge = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
        } else if (target.distance > 700) {
          recMode = '✈️ Flight + Taxi';
          recBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
        } else if (target.distance > 300) {
          recMode = '🚂 Express Train or 🚗 Drive';
          recBadge = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
        }
        selectedBanner = '<div class="card p-4 mb-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-2xl text-slate-100 shadow-xl">' +
          '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">' +
          '<div>' +
          '<div class="text-xs text-emerald-400 font-semibold tracking-wider uppercase mb-1">📍 Selected Origin Route</div>' +
          '<h4 class="text-base font-bold text-white">From ' + esc(target.from) + ' to ' + esc(dest.title) + '</h4>' +
          '<p class="text-xs text-slate-300 mt-1">Road Distance: <strong class="text-white">' + target.distance + ' km</strong> · Drive Time: <strong class="text-white">' + esc(target.byCar) + '</strong></p>' +
          '</div>' +
          '<div class="shrink-0">' +
          '<span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold ' + recBadge + '">' +
          recMode +
          '</span>' +
          '</div>' +
          '</div>' +
          '</div>';
      }
    }

    // Bug 20 fix: replaced ✈️ 🚂 🚗 emojis with inline SVGs in reach panel
    const SVG_PLANE = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2A1 1 0 0 0 1 7.2l2.4 2.4 4.8-.8L3.5 17.8l2.3 2.3 7.5-4.8-.8 4.8 2.4 2.4a1 1 0 0 0 1-.8z"/></svg>';
    const SVG_TRAIN = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M9 3v16M15 3v16M4 11h16M4 7h16"/><path d="m8 20-1 2M17 20l1 2"/></svg>';
    const SVG_METRO = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16M12 3v8M8 19l-3 3M16 19l3 3M8 15h.01M16 15h.01"/></svg>';
    const SVG_CAR = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 17H5M3 11l1.5-4.5A2 2 0 0 1 6.4 5h11.2a2 2 0 0 1 1.9 1.5L21 11v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="17" r="1"/></svg>';
    const hasMetro = !!(reach && reach.nearestMetro && reach.nearestMetro.name);
    document.getElementById('panel-reach').innerHTML =
      '<div class="mb-4"><span class="tab-calligraphy-kicker">✦ The Royal Passage & Routes ✦</span><h2 class="text-2xl font-bold text-gray-900 dark:text-white">How to Reach ' + esc(dest.title) + '</h2></div>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 ' + (hasMetro ? 'lg:grid-cols-4' : 'lg:grid-cols-3') + ' gap-4 mb-8">' +
      (reach && reach.nearestAirport && reach.nearestAirport.name ? '<div class="info-card text-center"><div class="info-card-icon mx-auto">' + SVG_PLANE + '</div><h3 class="font-bold text-sm mb-1">Nearest Airport</h3>' +
        '<p class="text-gray-600 text-sm">' + esc(reach.nearestAirport.name) + '</p><p class="text-primary font-semibold text-sm mt-1">' + (reach.nearestAirport.distance || '—') + ' km away</p></div>' : '') +
      (reach && reach.nearestRailway && reach.nearestRailway.name ? '<div class="info-card text-center"><div class="info-card-icon mx-auto">' + SVG_TRAIN + '</div><h3 class="font-bold text-sm mb-1">Nearest Railway</h3>' +
        '<p class="text-gray-600 text-sm">' + esc(reach.nearestRailway.name) + '</p><p class="text-primary font-semibold text-sm mt-1">' + (reach.nearestRailway.distance || '—') + ' km away</p></div>' : '') +
      (hasMetro ? '<div class="info-card text-center"><div class="info-card-icon mx-auto text-primary">' + SVG_METRO + '</div><h3 class="font-bold text-sm mb-1">Nearest Metro</h3>' +
        '<p class="text-gray-600 text-sm">' + esc(reach.nearestMetro.name) + '</p><p class="text-primary font-semibold text-sm mt-1">' + (reach.nearestMetro.distance || '—') + ' km away</p></div>' : '') +
      '<div class="info-card text-center"><div class="info-card-icon mx-auto">' + SVG_CAR + '</div><h3 class="font-bold text-sm mb-1">From Delhi</h3>' +
      '<p class="text-gray-600 text-sm">' + (delhiRoute.distance ? delhiRoute.distance + ' km' : (ov && ov.distanceFromDelhi ? ov.distanceFromDelhi + ' km' : (dest.distanceFromDelhi ? dest.distanceFromDelhi + ' km' : 'N/A'))) + '</p><p class="text-primary font-semibold text-sm mt-1">' + esc(delhiCar) + '</p></div>' +
      '</div>' +
      selectedBanner +
      '<div class="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">' +
      '<div class="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">' +
      '<h3 class="font-bold text-gray-900 text-sm">Distance & Routes from All States & UTs (' + routes.length + ' Origins)</h3>' +
      '<label class="flex items-center gap-2 text-xs text-gray-500">Filter Origin: ' +
      '<select id="reachCity" class="form-input !py-1 !px-2 !text-xs rounded-lg border-gray-200" style="width:auto;display:inline-block">' + cityOpts + '</select>' +
      '</label>' +
      '</div>' +
      '<div class="overflow-x-auto"><table class="route-table"><thead><tr><th>From (City & State)</th><th>Distance</th><th>By Road</th><th>By Train</th><th>By Air</th><th>Via</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>' +
      (reach && reach.roadNote ? '<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"><span class="text-xl shrink-0">⚠️</span>' +
        '<div><p class="font-semibold text-amber-900 text-sm mb-1">Road Advisory</p><p class="text-amber-800 text-sm">' + esc(reach.roadNote) + '</p></div></div>' : '');

    const sel = document.getElementById('reachCity');
    if (sel) sel.addEventListener('change', function () { reachCity = sel.value; renderReach(); });
  }

  // ─── MAP ────────────────────────────────────────────────
  let mapReady = false;
  const mapNameEl = document.getElementById('mapName');
  if (mapNameEl) mapNameEl.textContent = dest.title;

  // Wire "Open in Google Maps" and "Get Directions" buttons
  const mapCoords = coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])
    ? coords : [20.5937, 78.9629];
  const mapOpenGoogleBtn = document.getElementById('mapOpenGoogleBtn');
  const mapDirectionsBtn = document.getElementById('mapDirectionsBtn');
  if (mapOpenGoogleBtn) {
    mapOpenGoogleBtn.href = 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(dest.title + ', ' + dest.state + ', India') +
      '&query_place_id=' + mapCoords[0] + ',' + mapCoords[1];
  }
  if (mapDirectionsBtn) {
    mapDirectionsBtn.href = 'https://www.google.com/maps/dir/?api=1&destination=' +
      mapCoords[0] + ',' + mapCoords[1] +
      '&destination_place_id=' + encodeURIComponent(dest.title + ', ' + dest.state);
  }

  function initMap() {
    if (mapReady) return;
    const mapContainer = document.getElementById('destination-map') || document.getElementById('leaflet-map');
    if (!mapContainer) return;

    mountGoogleMapEmbed(mapContainer, {
      name: dest.title,
      state: dest.state,
      latitude: coords ? coords[0] : null,
      longitude: coords ? coords[1] : null,
      zoom: 12
    });

    mapReady = true;
  }

  // ─── Persistent Nav Bar Render ─────────────────────────
  function renderNav() {
    const container = document.getElementById('destNavContainer');
    if (!container) return;

    var pc = places.length;
    var sc = hotels.length;

    // Full ARIA tab pattern: role=tab, id, aria-controls, aria-selected
    container.setAttribute('role', 'tablist');
    container.setAttribute('aria-label', 'Destination sections');

    container.innerHTML =
      '<div class="dest-subnav-bar">' +
      '<button type="button" role="tab" id="tab-overview" class="dest-quick-pill active" data-navtab="overview" aria-controls="panel-overview" aria-selected="true" tabindex="0">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' +
      '<span>Overview</span>' +
      '</button>' +
      '<button type="button" role="tab" id="tab-places" class="dest-quick-pill" data-navtab="places" aria-controls="panel-places" aria-selected="false" tabindex="-1">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
      '<span>Places</span>' +
      '<span class="tab-badge" aria-label="' + pc + ' places">' + pc + '</span>' +
      '</button>' +
      '<button type="button" role="tab" id="tab-stays" class="dest-quick-pill" data-navtab="stays" aria-controls="panel-stays" aria-selected="false" tabindex="-1">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
      '<span>Stays</span>' +
      '<span class="tab-badge" aria-label="' + sc + ' stays">' + sc + '</span>' +
      '</button>' +
      '<button type="button" role="tab" id="tab-budget" class="dest-quick-pill" data-navtab="budget" aria-controls="panel-budget" aria-selected="false" tabindex="-1">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>' +
      '<span>Budget</span>' +
      '</button>' +
      '<button type="button" role="tab" id="tab-reach" class="dest-quick-pill" data-navtab="reach" aria-controls="panel-reach" aria-selected="false" tabindex="-1">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' +
      '<span>How to Reach</span>' +
      '</button>' +
      '<button type="button" role="tab" id="tab-map" class="dest-quick-pill" data-navtab="map" aria-controls="panel-map" aria-selected="false" tabindex="-1">' +
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>' +
      '<span>Map</span>' +
      '</button>' +
      '</div>';
  }


  // ─── Tab Navigation ────────────────────────────────────
  function setTab(name) {
    var tabs = ['overview', 'places', 'stays', 'budget', 'reach', 'map'];

    // Update tab buttons: active class + aria-selected
    document.querySelectorAll('[data-navtab]').forEach(function (b) {
      var on = b.getAttribute('data-navtab') === name;
      b.className = 'dest-quick-pill' + (on ? ' active' : '');
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.setAttribute('tabindex', on ? '0' : '-1');
    });

    // Update panels: display + aria-hidden
    tabs.forEach(function (n) {
      var panel = document.getElementById('panel-' + n);
      if (panel) {
        var visible = n === name;
        panel.style.display = visible ? 'block' : 'none';
        panel.setAttribute('aria-hidden', visible ? 'false' : 'true');
      }
    });

    // Move focus to panel for screen reader users
    var activePanel = document.getElementById('panel-' + name);
    if (activePanel && name !== 'overview') activePanel.setAttribute('tabindex', '-1');

    // Smooth-scroll to just below the sticky nav bar
    if (name !== 'overview') {
      var navContainer = document.getElementById('destNavContainer');
      if (navContainer) {
        var navBottom = navContainer.getBoundingClientRect().bottom + window.pageYOffset;
        window.scrollTo({ top: navBottom - 16, behavior: 'smooth' });
      }
    }

    if (name === 'map') initMap();
  }

  // Global event delegation for all subnav pill buttons
  document.addEventListener('click', function (e) {
    const navBtn = e.target.closest('[data-navtab]');
    if (navBtn) {
      e.preventDefault();
      e.stopPropagation();
      const target = navBtn.getAttribute('data-navtab');
      if (target) setTab(target);
    }
  });

  // Map is initialized lazily on first Map-tab open (see the data-navtab
  // delegated handler above, which calls initMap() when name === 'map').

  // Roving tabindex arrow-key navigation for the subnav tablist (moves focus
  // only; activation still requires click/Enter/Space per the ARIA APG
  // "manual activation" tab pattern).
  (function () {
    const navContainer = document.getElementById('destNavContainer');
    if (!navContainer) return;
    navContainer.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const tabs = Array.from(navContainer.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;
      const currentIndex = tabs.indexOf(document.activeElement);
      if (currentIndex === -1) return;
      e.preventDefault();
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + delta + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
    });
  })();

  // ─── Render nav & all panels ───────────────────────────
  renderNav();
  renderOverview();
  renderPlaces();
  renderStays();
  renderBudget();
  renderReach();

  // ─── Live weather (auto-updating) ───────────────────────
  let latestWeather = null;
  (function liveWeather() {
    const body = document.getElementById('liveWeatherBody');
    if (!body) return;
    if (!coords) { body.innerHTML = '<span class="text-gray-400">Live weather unavailable for this location.</span>'; return; }

    let offsetSeconds = 0;   // destination UTC offset, filled from API
    let haveData = false;

    function fmtClock() {
      if (!haveData) return '';
      const d = new Date(Date.now() + offsetSeconds * 1000);
      return pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ':' + pad2(d.getUTCSeconds());
    }

    function paint(cur) {
      const info = weatherInfo(cur.weather_code);
      const temp = Math.round(cur.temperature_2m);
      const feels = (cur.apparent_temperature != null) ? Math.round(cur.apparent_temperature) : temp;
      offsetSeconds = cur._offset || 0;
      haveData = true;
      latestWeather = {
        temp: temp, feels: feels, label: info[0], emoji: info[1],
        humidity: cur.relative_humidity_2m, wind: Math.round(cur.wind_speed_10m)
      };
      refreshPlaceWeather();
      body.innerHTML =
        '<div class="flex items-center gap-3 mb-3">' +
        '<span class="text-4xl leading-none">' + info[1] + '</span>' +
        '<div><div class="text-3xl font-bold text-gray-900 leading-none">' + temp + '°C</div>' +
        '<div class="text-xs text-gray-500 mt-1">' + info[0] + '</div></div>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">' +
        '<div class="flex justify-between"><span class="text-gray-500">Feels like</span><span class="font-medium">' + feels + '°C</span></div>' +
        '<div class="flex justify-between"><span class="text-gray-500">Humidity</span><span class="font-medium">' + cur.relative_humidity_2m + '%</span></div>' +
        '<div class="flex justify-between"><span class="text-gray-500">Wind</span><span class="font-medium">' + Math.round(cur.wind_speed_10m) + ' km/h</span></div>' +
        '<div class="flex justify-between"><span class="text-gray-500">Local time</span><span class="font-medium" id="liveClock">' + fmtClock() + '</span></div>' +
        '</div>' +
        '<p class="text-[11px] text-gray-400 mt-3" id="liveUpdated">Updated just now · refreshes every 10 min</p>';
    }

    function fetchNow(force) {
      const cacheKey = 'weather_' + dest.slug;
      if (!force) {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;
            if (age < 600000) { // 10 minutes cache
              paint(parsed.data);
              return;
            }
          }
        } catch (e) {
          // ignore storage access errors
        }
      }

      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + coords[0] + '&longitude=' + coords[1] +
        '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto';
      fetch(url)
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (data) {
          const cur = data.current || {};
          cur._offset = data.utc_offset_seconds || 0;
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: cur }));
          } catch (e) {
            // ignore storage access errors
          }
          paint(cur);
        })
        .catch(function () {
          if (!haveData) {
            body.innerHTML = '<span class="text-gray-400">Couldn\'t load live weather (offline or blocked). ' +
              'Best season: ' + esc((dest.bestTime && dest.bestTime.label) || 'Oct – Mar') + '.</span>';
          }
        });
    }

    fetchNow(false);
    setInterval(function () { fetchNow(true); }, 600000);         // refresh every 10 min (Open-Meteo free-tier friendly)
    setInterval(function () {              // tick the local clock every second
      const el = document.getElementById('liveClock');
      if (el && haveData) el.textContent = fmtClock();
    }, 1000);
  })();

  // delegated clicks inside overview: "See all / View all" tabs + Top Places cards
  document.getElementById('panel-overview').addEventListener('click', function (e) {
    const goto = e.target.closest('[data-goto]');
    if (goto) { setTab(goto.getAttribute('data-goto')); return; }
    const top = e.target.closest('[data-topidx]');
    if (top) openPlaceModal(places[parseInt(top.getAttribute('data-topidx'), 10)]);
  });
  document.getElementById('panel-overview').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const top = e.target.closest('[data-topidx]');
    if (top) { e.preventDefault(); openPlaceModal(places[parseInt(top.getAttribute('data-topidx'), 10)]); }
  });

  // ─── Similar destinations (from the light manifest) ────
  const TYPE_TITLES = {
    hill_station: 'Hill Station',
    beach: 'Beach & Coastal',
    heritage: 'Heritage',
    spiritual: 'Spiritual',
    lakes: 'Lakes & Backwaters',
    wildlife: 'Wildlife & Nature',
    adventure: 'Adventure',
    city: 'City & Culture',
  };
  const similarHeadingTypeName = document.getElementById('similarTypeName');
  if (similarHeadingTypeName) {
    const rawType = TYPE_TITLES[dest.type] || (dest.type ? dest.type.replace(/_/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }) : '');
    similarHeadingTypeName.textContent = rawType ? rawType + ' ' : '';
  }

  function resolveCardPhoto(d) {
    if (!d) return '';
    if (typeof cardImg === 'function') {
      const res = cardImg(d);
      if (res) return res;
    }
    const val = d.heroImage || d.image;
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val.src === 'string') return val.src;
    return '';
  }

  function populateSimilar(activeIdx) {
    const list = (activeIdx && Array.isArray(activeIdx.destinations)) ? activeIdx.destinations : [];
    if (!list.length) return;

    function byRating(a, b) {
      return (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0);
    }

    const sameStateAndType = list.filter(function (d) {
      return d && d.slug !== dest.slug && d.type === dest.type && d.state === dest.state;
    }).sort(byRating);

    const sameTypeOther = list.filter(function (d) {
      return d && d.slug !== dest.slug && d.type === dest.type && d.state !== dest.state;
    }).sort(byRating);

    const sameStateOther = (sameStateAndType.length + sameTypeOther.length < 4)
      ? list.filter(function (d) {
        return d && d.slug !== dest.slug && d.state === dest.state && d.type !== dest.type;
      }).sort(byRating)
      : [];

    const others = (sameStateAndType.length + sameTypeOther.length + sameStateOther.length < 4)
      ? list.filter(function (d) { return d && d.slug !== dest.slug; }).sort(byRating)
      : [];

    const pool = [].concat(sameStateAndType, sameTypeOther, sameStateOther, others);
    const uniqueMap = new Map();
    pool.forEach(function (d) {
      if (d && d.slug && !uniqueMap.has(d.slug)) {
        uniqueMap.set(d.slug, d);
      }
    });

    const similar = Array.from(uniqueMap.values()).slice(0, 4);
    const similarGrid = document.getElementById('similar-grid');
    if (similarGrid && similar.length > 0) {
      similarGrid.innerHTML = similar.map(function (d) {
        const img = optimizeImageUrl(resolveCardPhoto(d), 600);
        return '' +
          '<a href="' + destUrl(d.slug) + '" class="group block rounded-2xl p-3 border border-white/15 bg-slate-900/85 backdrop-blur-xl shadow-2xl hover:border-emerald-400/60 hover:-translate-y-1.5 transition-all duration-300">' +
          '<div class="rounded-xl overflow-hidden aspect-video relative mb-3 bg-slate-800' + (img ? '' : ' image-unavailable') + '">' +
          (img ? '<img src="' + esc(img) + '" alt="' + esc((d.image && d.image.alt) || d.title) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.onerror=null;this.style.display=\'none\';" />' : '') +
          '<div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>' +
          '<div class="absolute top-2 right-2">' +
          '<span class="badge bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full border border-white/15">' + esc(typeLabel(d.type)) + '</span>' +
          '</div>' +
          '<div class="absolute bottom-2 left-2.5 right-2.5">' +
          '<p class="similar-card-title text-white text-sm font-bold truncate leading-tight drop-shadow">' + esc(d.title) + '</p>' +
          '<p class="similar-card-state text-white/70 text-[11px] font-medium">' + esc(d.state) + '</p>' +
          '</div>' +
          '</div>' +
          '<div class="flex items-center justify-between px-1">' +
          '<div class="similar-card-rating flex items-center gap-1 text-amber-400 text-xs font-bold">' +
          '<span class="similar-star">★</span><span class="similar-score">' + esc(d.rating || '4.5') + '</span>' +
          '</div>' +
          '<p class="similar-card-price text-xs text-slate-400">Stay starts from <span class="similar-price-val font-bold text-amber-400">₹' + inr(d.minPrice || 1500) + '</span></p>' +
          '</div>' +
          '</a>';
      }).join('');
    }
  }

  window.__renderSimilarDestinations = populateSimilar;
  if (idx) populateSimilar(idx);

  // Bug 4 fix: added null checks for mStays and mReach before addEventListener
  const mStaysEl = document.getElementById('mStays');
  const mReachEl = document.getElementById('mReach');
  if (mStaysEl) mStaysEl.addEventListener('click', function (e) { e.preventDefault(); setTab('stays'); });
  if (mReachEl) mReachEl.addEventListener('click', function (e) { e.preventDefault(); setTab('reach'); });

  // ─── Place details modal (with live weather) ───────────
  const pModal = document.getElementById('placeModal');
  let modalReturnFocus = null;   // element to restore focus to when the modal closes

  function trapModalTab(e) {
    if (e.key !== 'Tab' || pModal.style.display === 'none') return;
    const focusable = pModal.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])');
    const list = Array.prototype.filter.call(focusable, function (el) { return el.offsetParent !== null; });
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function setInitialFocus() {
    const closeBtn = document.getElementById('placeClose');
    if (closeBtn) closeBtn.focus();
  }

  function refreshPlaceWeather() {
    const el = document.getElementById('placeWeather');
    if (!el || pModal.style.display === 'none') return;
    if (!latestWeather) { el.textContent = 'Loading…'; return; }
    const w = latestWeather;
    el.innerHTML = '<span class="text-xl mr-1">' + w.emoji + '</span>' +
      '<span class="font-bold text-gray-900">' + w.temp + '°C</span> · ' + w.label +
      ' · feels ' + w.feels + '°C · humidity ' + w.humidity + '% · wind ' + w.wind + ' km/h';
  }

  // ─── Place photos: card image as slide 1 + baked p.photos ──
  function fetchPlacePhotos(p, cb) {
    const list = [];
    if (p.image && p.image.src && typeof p.image.src === 'string' && !p.image.src.includes('picsum.photos')) {
      list.push(p.image.src);
    }
    if (Array.isArray(p.photos)) {
      for (const u of p.photos) {
        const photoUrl = (typeof u === 'string') ? u : (u && u.src ? u.src : '');
        if (photoUrl && !photoUrl.includes('picsum.photos') && !list.includes(photoUrl)) {
          list.push(photoUrl);
        }
      }
    }
    if (list.length > 0) {
      cb(list);
      return;
    }
    if (dest.heroImage && dest.heroImage.src) {
      cb([dest.heroImage.src]);
      return;
    }
    if (dest.image && dest.image.src) {
      cb([dest.image.src]);
      return;
    }
    cb([]);
  }

  // ─── Carousel ──────────────────────────────────────────
  const carTrack = document.getElementById('placeTrack');
  const carDots = document.getElementById('carDots');
  const carCount = document.getElementById('carCount');
  let carIdx = 0, carLen = 0, carTimer = null, carToken = 0;

  function carGo(i) {
    if (!carLen) return;
    carIdx = (i + carLen) % carLen;
    carTrack.style.transform = 'translateX(-' + (carIdx * 100) + '%)';
    carCount.textContent = (carIdx + 1) + ' / ' + carLen;
    const dots = carDots.children;
    for (let d = 0; d < dots.length; d++) {
      dots[d].className = 'dot' + (d === carIdx ? ' active' : '');
      dots[d].setAttribute('aria-current', d === carIdx ? 'true' : 'false');
    }
  }
  function carRender(urls, name) {
    carLen = urls.length; carIdx = 0;
    carTrack.innerHTML = urls.map(function (u, i) {
      return '<div class="carousel-slide"><img src="' + esc(optimizeImageUrl(u, 1000)) + '" alt="' + esc(name) + ' photo ' + (i + 1) +
        '" decoding="async" referrerpolicy="origin" onerror="this.onerror=null;" /></div>';
    }).join('');
    carDots.innerHTML = urls.map(function (u, i) {
      return '<button type="button" class="dot' + (i === 0 ? ' active' : '') + '" data-i="' + i + '" aria-label="Go to photo ' + (i + 1) + '" aria-current="' + (i === 0 ? 'true' : 'false') + '"></button>';
    }).join('');
    carCount.textContent = '1 / ' + carLen;
    carTrack.style.transform = 'translateX(0)';
  }
  const carReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function carStartAuto() { if (carReduceMotion) return; carStopAuto(); carTimer = setInterval(function () { carGo(carIdx + 1); }, 4000); }
  function carStopAuto() { if (carTimer) { clearInterval(carTimer); carTimer = null; } }

  document.getElementById('carPrev').addEventListener('click', function () { carGo(carIdx - 1); carStartAuto(); });
  document.getElementById('carNext').addEventListener('click', function () { carGo(carIdx + 1); carStartAuto(); });
  carDots.addEventListener('click', function (e) {
    const d = e.target.closest('.dot'); if (d) { carGo(parseInt(d.getAttribute('data-i'), 10)); carStartAuto(); }
  });
  carDots.addEventListener('focusin', carStopAuto);

  function getPlaceTravelTime(p, destTitle, destState) {
    if (p && p.travelTime && typeof p.travelTime === 'string') return p.travelTime;
    const isHimalayan = HIMALAYAN_STATES.has((destState || '').trim());
    let rawDist = ((p && p.distance) || '').trim();
    let numKm = null;
    const kmMatch = rawDist.match(/([\d.]+)\s*km/i);
    if (kmMatch) numKm = parseFloat(kmMatch[1]);
    else if (/^\d+(\.\d+)?$/.test(rawDist)) numKm = parseFloat(rawDist);

    const isBoat = /boat|ferry|water/i.test(rawDist);
    const isTownCentre = /town\s*cent(re|er)|city\s*cent(re|er)|^centre$|^center$|^central$/i.test(rawDist);
    const isOnSite = /^(main\s*complex|courtyard|on[- ]site|inside|premises|gate|campus|sanctum)/i.test(rawDist);

    const baseName = destTitle || 'main destination';

    if (isOnSite) return 'Inside complex (Walkable)';
    if (isTownCentre || numKm === 0) return 'Under 5 mins walk in Town Centre';
    if (isBoat) return (numKm || 2) <= 2 ? '10–15 mins boat ride from ' + baseName : '20–30 mins boat ride from ' + baseName;

    if (numKm !== null) {
      if (numKm <= 0.8) return '3–5 mins walk from ' + baseName;
      if (numKm <= 1.5) return '5–10 mins walk / 3 min drive from ' + baseName;
      if (numKm <= 3) return isHimalayan ? '10–15 mins drive from ' + baseName : '5–10 mins drive from ' + baseName;
      if (numKm <= 6) return isHimalayan ? '15–25 mins drive from ' + baseName : '10–15 mins drive from ' + baseName;
      if (numKm <= 12) return isHimalayan ? '25–35 mins drive from ' + baseName : '15–20 mins drive from ' + baseName;
      if (numKm <= 20) return isHimalayan ? '35–45 mins drive from ' + baseName : '25–35 mins drive from ' + baseName;
      if (numKm <= 35) return isHimalayan ? '1–1.5 hrs drive from ' + baseName : '35–50 mins drive from ' + baseName;
      if (numKm <= 50) return isHimalayan ? '2–3 hrs drive from ' + baseName : '1–1.5 hrs drive from ' + baseName;
      if (numKm <= 80) return isHimalayan ? '2.5–3.5 hrs drive from ' + baseName : '1.5–2 hrs drive from ' + baseName;
      if (numKm <= 120) return isHimalayan ? '3.5–5 hrs drive from ' + baseName : '2–3 hrs drive from ' + baseName;
      if (numKm <= 180) return isHimalayan ? '5–6 hrs drive from ' + baseName : '3–4 hrs drive from ' + baseName;
      return isHimalayan ? '6+ hrs drive from ' + baseName + ' (Day trip)' : '4–6 hrs drive from ' + baseName;
    }
    return '15–30 mins drive from ' + baseName;
  }

  function openPlaceModal(p) {
    document.getElementById('placeName').textContent = p.name;
    document.getElementById('placeRating').textContent = '★ ' + p.rating;
    document.getElementById('placeCategory').textContent = p.category;
    var distText = (p.distance || '').trim();
    if (/^\d+(\.\d+)?\s*(km|m)$/i.test(distText)) {
      distText = distText + ' from ' + dest.title;
    } else if (/^\d+(\.\d+)?\s*(km|m)\s+from\s+/i.test(distText)) {
      if (!distText.toLowerCase().includes(dest.title.toLowerCase())) {
        distText = distText + ', ' + dest.title;
      }
    } else if (/town\s*cent(re|er)/i.test(distText)) {
      distText = 'In Town Centre';
    } else if (/^(main\s*complex|courtyard|on[- ]site|inside|centre|center|premises)/i.test(distText)) {
      distText = distText + ' (On-site)';
    }
    document.getElementById('placeDistance').textContent = distText || ('Near ' + dest.title);

    // Set Travel Time from main destination
    const travelTimeStr = getPlaceTravelTime(p, dest.title, dest.state);
    const travelEl = document.getElementById('placeTravelTime');
    if (travelEl) {
      travelEl.textContent = travelTimeStr;
    }
    document.getElementById('placeDuration').textContent = p.duration || '1–2 hrs to explore';
    document.getElementById('placeFee').textContent = p.entryFee;
    document.getElementById('placeTimings').textContent = p.timings;
    document.getElementById('placeMapLink').href =
      'https://www.google.com/maps/search/' + encodeURIComponent(p.name + ', ' + dest.title + ', ' + dest.state);
    // show loading then real photos. Reset carousel state + stop any running
    // autoplay so arrow/dot input during the "Loading…" window can't act on the
    // previous place's slides, and bump a token so a slow fetch for a place the
    // user has since navigated away from can't overwrite the current carousel.
    carStopAuto();
    carLen = 0; carIdx = 0;
    const myToken = ++carToken;
    carTrack.innerHTML = '<div class="carousel-slide"><div class="carousel-loading">Loading photos…</div></div>';
    carDots.innerHTML = ''; carCount.textContent = '';
    pModal.style.display = 'flex';
    pModal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    // a11y: hide background content from screen readers while modal is open
    // Bug 11 fix: destination.html uses id="main", not id="content"
    const nav = document.getElementById('siteNav');
    const mainContent = document.getElementById('main') || document.getElementById('content');
    const footer = document.getElementById('siteFooter');
    if (nav) nav.setAttribute('aria-hidden', 'true');
    if (mainContent) mainContent.setAttribute('aria-hidden', 'true');
    if (footer) footer.setAttribute('aria-hidden', 'true');
    // a11y: remember what to return focus to, move focus into the dialog, trap Tab
    modalReturnFocus = document.activeElement;
    const closeBtn = document.getElementById('placeClose');
    if (closeBtn) closeBtn.focus();
    document.addEventListener('keydown', trapModalTab);
    refreshPlaceWeather();
    fetchPlacePhotos(p, function (urls) {
      if (pModal.style.display === 'none' || myToken !== carToken) return;   // modal closed or place switched
      carRender(urls, p.name);
      carGo(0);
      carStartAuto();
    });
  }
  function closePlaceModal() {
    pModal.style.display = 'none';
    pModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    carStopAuto();
    document.removeEventListener('keydown', trapModalTab);
    // a11y: restore background visibility for screen readers
    // Bug 11 fix: use 'main' (destination.html) with 'content' as fallback
    const nav = document.getElementById('siteNav');
    const mainContent = document.getElementById('main') || document.getElementById('content');
    const footer = document.getElementById('siteFooter');
    if (nav) nav.removeAttribute('aria-hidden');
    if (mainContent) mainContent.removeAttribute('aria-hidden');
    if (footer) footer.removeAttribute('aria-hidden');
    if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') modalReturnFocus.focus();
    modalReturnFocus = null;
  }
  document.getElementById('placeClose').addEventListener('click', closePlaceModal);
  document.getElementById('placeBackdrop').addEventListener('click', closePlaceModal);
  document.addEventListener('keydown', function (e) {
    if (pModal.style.display === 'none') return;
    if (e.key === 'Escape') closePlaceModal();
    else if (e.key === 'ArrowLeft') { carGo(carIdx - 1); carStartAuto(); }
    else if (e.key === 'ArrowRight') { carGo(carIdx + 1); carStartAuto(); }
  });

  // ─── GSAP ScrollTrigger Motion ─────────────────────────
  function initDestinationGSAP() {
    if (!window.gsap) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }

    // Hero content entrance
    window.gsap.from('#heroTitle', { opacity: 0, y: 25, duration: 0.9, ease: 'power3.out' });
    window.gsap.from('#heroTagline', { opacity: 0, y: 20, duration: 0.8, delay: 0.2, ease: 'power3.out' });
    window.gsap.from('#heroType, #heroBadge', { opacity: 0, scale: 0.85, stagger: 0.1, duration: 0.6, ease: 'back.out(1.7)' });

    // Parallax background scroll
    if (window.ScrollTrigger && document.querySelector('.dest-immersive-bg')) {
      window.gsap.to('.dest-immersive-bg', {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      });
    }

    // ─── HERO IMAGE PARALLAX ───────────────────────────────
    // heroImg moves at 40% of scroll speed → classic depth illusion
    // overflow:hidden on .dest-hero clips the extra 20% height
    const heroImgEl = document.getElementById('heroImg');
    if (window.ScrollTrigger && heroImgEl) {
      window.gsap.to(heroImgEl, {
        yPercent: 22,          // translate down 22% of its height as user scrolls
        ease: 'none',
        scrollTrigger: {
          trigger: '.dest-hero',
          start: 'top top',
          end: 'bottom top',   // trigger ends when hero bottom hits viewport top
          scrub: true,         // perfectly tied to scroll position
        },
      });
    }

    // Similar destinations scroll reveal
    if (window.ScrollTrigger && document.getElementById('similarSection')) {
      window.gsap.from('#similarSection .dest-similar-header', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: '#similarSection',
          start: 'top 98%',
          toggleActions: 'play none none none',
        },
      });

      window.gsap.from('#similar-grid a', {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power2.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: '#similarSection',
          start: 'top 98%',
          toggleActions: 'play none none none',
        },
      });

      setTimeout(function () {
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        const cards = document.querySelectorAll('#similar-grid a');
        cards.forEach(function (c) { c.style.opacity = '1'; });
      }, 500);
    }
  }

  setTimeout(initDestinationGSAP, 100);

  // Clean up any residual sample classes from testing session
  try {
    sessionStorage.removeItem('delhi_sample_theme');
    document.body.classList.remove('sample-canvas-obsidian', 'sample-canvas-white');
    const oldBar = document.getElementById('sampleThemeBar');
    if (oldBar) oldBar.remove();
    const oldStyles = document.getElementById('delhiThemeInjectedStyles');
    if (oldStyles) oldStyles.remove();
  } catch (_) { }

  // ─── EXPLOREDESH GO: OFFLINE POCKET GUIDE & CHEAT SHEET ───────────
  async function setupPocketGuideActions(dest) {
    const saveBtn = document.getElementById('savePocketGuideBtn');
    const cardBtn = document.getElementById('openPocketCardBtn');
    if (!saveBtn) return;

    const isSaved = await isDestinationOffline(dest.slug);
    updateSaveButtonUI(isSaved);

    function updateSaveButtonUI(saved) {
      if (saved) {
        saveBtn.classList.add('is-saved');
        saveBtn.dataset.confirmPending = 'false';
        saveBtn.innerHTML = `
          <span class="save-icon text-emerald-400">${icon('check', { size: 16 })}</span>
          <span class="save-label font-semibold text-sm">Saved Offline ✓ &nbsp;<span style="opacity:0.65;font-weight:400;font-size:11px">(tap again to remove)</span></span>
        `;
        saveBtn.title = 'Saved on device. Tap to remove from offline storage.';
      } else {
        saveBtn.classList.remove('is-saved');
        saveBtn.dataset.confirmPending = 'false';
        saveBtn.innerHTML = `
          <span class="save-icon">${icon('download', { size: 16 })}</span>
          <span class="save-label font-semibold text-sm">Save Pocket Guide (Offline)</span>
        `;
        saveBtn.title = 'Download full guide, places, and images for zero-connectivity travels';
      }
    }

    let removeTimeout = null;
    saveBtn.onclick = async () => {
      const currentlySaved = await isDestinationOffline(dest.slug);
      if (currentlySaved) {
        // Two-step inline confirm — no confirm() dialog
        if (saveBtn.dataset.confirmPending === 'true') {
          // Second click: actually remove
          clearTimeout(removeTimeout);
          saveBtn.disabled = true;
          saveBtn.innerHTML = `<span class="save-icon">${icon('trash', { size: 16 })}</span><span class="save-label text-sm">Removing...</span>`;
          await removeDestinationOffline(dest.slug);
          saveBtn.disabled = false;
          updateSaveButtonUI(false);
        } else {
          // First click: show confirm state
          saveBtn.dataset.confirmPending = 'true';
          saveBtn.style.borderColor = '#F87171';
          saveBtn.style.background = 'rgba(239,68,68,0.2)';
          saveBtn.innerHTML = `<span class="save-icon">${icon('trash', { size: 16 })}</span><span class="save-label text-sm" style="color:#FCA5A5">Tap again to remove offline</span>`;
          // Auto-reset after 3 seconds
          removeTimeout = setTimeout(() => {
            updateSaveButtonUI(true);
            saveBtn.style.borderColor = '';
            saveBtn.style.background = '';
          }, 3000);
        }
      } else {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="save-icon animate-spin">${icon('refresh', { size: 16 })}</span><span class="save-label text-sm">Downloading Pocket Guide...</span>`;
        try {
          await saveDestinationOffline(dest);
          saveBtn.disabled = false;
          updateSaveButtonUI(true);
        } catch (e) {
          saveBtn.disabled = false;
          updateSaveButtonUI(false);
          // Show inline error instead of alert()
          saveBtn.innerHTML = `<span class="save-icon">${icon('x', { size: 16 })}</span><span class="save-label text-sm" style="color:#F87171">Save failed — try again</span>`;
          setTimeout(() => updateSaveButtonUI(false), 3000);
        }
      }
    };

    if (cardBtn) {
      cardBtn.onclick = () => renderPocketCheatSheetModal(dest);
    }
  }

  function renderPocketCheatSheetModal(dest) {
    const modal = document.getElementById('pocketCheatSheetModal');
    const title = document.getElementById('pocketCardTitle');
    const subtitle = document.getElementById('pocketCardSubtitle');
    const body = document.getElementById('pocketCardBody');
    const closeBtn = document.getElementById('pocketCloseBtn');
    const printBtn = document.getElementById('pocketPrintBtn');
    if (!modal || !body) return;

    title.textContent = `${dest.title} — Offline Travel Cheat Sheet`;
    subtitle.textContent = `${dest.state || 'India'} • ${dest.overview && dest.overview.altitude ? dest.overview.altitude + 'm elevation' : (dest.type || 'Travel')}`;

    const isHighAltitude = dest.overview && dest.overview.altitude && dest.overview.altitude >= 2400;

    const placesHtml = (dest.topPlaces || []).slice(0, 6).map(p => `
      <div class="cheat-place-row">
        <div class="font-bold text-white text-xs">${esc(p.name)}</div>
        <div class="text-[11px] text-gray-400">${esc(p.timings || 'Daily')} • ${esc(p.entryFee || 'Free')}</div>
        <div class="text-[11px] text-gray-300 mt-0.5">${esc(p.description || '')}</div>
      </div>
    `).join('');

    const reach = dest.howToReach || {};
    const routes = (reach.routes || []).slice(0, 3).map(r => `
      <div class="cheat-route-item text-xs text-gray-300">
        <strong>From ${esc(r.from)}:</strong> ${esc(r.byCar || '')} (${esc(r.via || '')})
      </div>
    `).join('');

    body.innerHTML = `
      ${isHighAltitude ? `
        <div class="cheat-alert-box ams">
          <span class="alert-symbol">🏔️</span>
          <div>
            <strong>High Altitude Zone (${dest.overview.altitude}m):</strong>
            <span>Acclimatize 48 hrs. Drink 3.5L+ water daily. If severe headache or nausea occurs, descend immediately.</span>
          </div>
        </div>
      ` : ''}

      <div class="cheat-section">
        <h4 class="cheat-section-title">Essential Overview</h4>
        <p class="text-xs text-gray-300 leading-relaxed">${esc((dest.overview && dest.overview.short) || dest.tagline || '')}</p>
      </div>

      <div class="cheat-section">
        <h4 class="cheat-section-title">Key Transport & Access</h4>
        <div class="space-y-1 mt-1">
          ${routes || '<p class="text-xs text-gray-400">Road accessible. Check local weather in winter.</p>'}
        </div>
        ${reach.roadNote ? `<p class="text-[11px] text-amber-300/90 mt-2">⚠️ <em>${esc(reach.roadNote)}</em></p>` : ''}
      </div>

      <div class="cheat-section">
        <h4 class="cheat-section-title">Must-See Attractions & Timings</h4>
        <div class="space-y-2 mt-1">
          ${placesHtml || '<p class="text-xs text-gray-400">Consult destination places tab.</p>'}
        </div>
      </div>

      <div class="cheat-section">
        <h4 class="cheat-section-title">Emergency Numbers (Works Offline)</h4>
        <div class="grid grid-cols-2 gap-2 mt-1">
          <a href="tel:112" class="cheat-sos-btn">🚨 Universal SOS: 112</a>
          <a href="tel:108" class="cheat-sos-btn">🚑 Medical: 108</a>
          <a href="tel:1070" class="cheat-sos-btn">🏔️ Mountain Rescue: 1070</a>
          <a href="tel:100" class="cheat-sos-btn">👮 Police: 100</a>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    closeBtn.onclick = () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    };
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    };
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }
  }

  setupPocketGuideActions(dest);
}

