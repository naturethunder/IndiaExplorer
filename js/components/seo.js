/**
 * seo.js — runtime SEO helpers: title/description/canonical/robots meta +
 * Schema.org JSON-LD structured data injection for search engines (Google, Bing, Crawlers).
 * Note: Social media metadata (Open Graph and Twitter Cards) is excluded.
 */

const SITE_ORIGIN = 'https://exploredesh.com/';

function setMeta(attr, key, content) {
  if (content == null || content === '') return;
  let el = document.head.querySelector('meta[' + attr + '="' + key + '"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function absUrl(path) {
  try { return new URL(path || '', SITE_ORIGIN).href; }
  catch (e) { return path || ''; }
}

/**
 * Apply page SEO for search engines.
 * opts: {
 *   title: string,
 *   description: string,
 *   canonicalPath?: string (relative, e.g. '/' or 'destinations.html'),
 *   keywords?: string[],
 *   robots?: string
 * }
 */
export function applySEO(opts = {}) {
  if (opts.title) document.title = opts.title;
  setMeta('name', 'description', opts.description);
  setMeta('name', 'robots', opts.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  if (opts.keywords && opts.keywords.length) {
    setMeta('name', 'keywords', opts.keywords.join(', '));
  }

  const currentPath = window.location.pathname + window.location.search;
  const canonical = absUrl(opts.canonicalPath || currentPath);
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', canonical);
}

/** Inject one Schema.org JSON-LD block. */
export function injectJsonLd(obj) {
  if (!obj) return;
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(obj);
  document.head.appendChild(s);
}

/** BreadcrumbList schema. items: [{name, path}] (path relative). */
export function breadcrumbJsonLd(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

/** FAQPage schema from [{q, a}]. */
export function faqJsonLd(faq = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (faq || []).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** TouristDestination schema for a destination detail page. */
export function destinationJsonLd(dest, canonicalPath) {
  if (!dest) return null;
  const ov = dest.overview || {};
  const description = ov.short || dest.short || dest.description || '';
  const canonical = absUrl(canonicalPath || ('destination.html?slug=' + encodeURIComponent(dest.slug || '')));
  const out = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    '@id': canonical + '#destination',
    name: dest.title,
    description: description,
    url: canonical,
    mainEntityOfPage: canonical,
    address: { '@type': 'PostalAddress', addressRegion: dest.state, addressCountry: 'IN' },
    touristType: dest.type ? dest.type.replace(/_/g, ' ') : undefined,
  };
  if (dest.weather && dest.weather.lat != null) {
    out.geo = { '@type': 'GeoCoordinates', latitude: dest.weather.lat, longitude: dest.weather.lng };
  } else if (dest.coordinates) {
    out.geo = { '@type': 'GeoCoordinates', latitude: dest.coordinates.lat, longitude: dest.coordinates.lng };
  }
  const imgSrc = typeof dest.heroImage === 'string' ? dest.heroImage : (dest.heroImage && dest.heroImage.src ? dest.heroImage.src : (dest.image && dest.image.src ? dest.image.src : null));
  if (imgSrc) out.image = absUrl(imgSrc);
  return out;
}

/** CollectionPage schema for catalogue / destination listings. */
export function collectionPageJsonLd(opts = {}) {
  const canonical = absUrl(opts.canonicalPath || 'destinations.html');
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': canonical + '#collection',
    name: opts.title || 'All Destinations in India',
    description: opts.description || 'Browse 2,389 travel destinations across all 36 states & UTs of India.',
    url: canonical,
    mainEntityOfPage: canonical,
  };
}

/** AboutPage schema. */
export function aboutPageJsonLd(opts = {}) {
  const canonical = absUrl(opts.canonicalPath || 'about.html');
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': canonical + '#about',
    name: opts.title || 'About Us — ExploreDesh',
    description: opts.description || "Learn about ExploreDesh — India's most thoughtful travel discovery platform.",
    url: canonical,
    mainEntityOfPage: canonical,
  };
}

/** ContactPage schema. */
export function contactPageJsonLd(opts = {}) {
  const canonical = absUrl(opts.canonicalPath || 'contact.html');
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': canonical + '#contact',
    name: opts.title || 'Contact Us — ExploreDesh',
    description: opts.description || 'Get in touch with the ExploreDesh team.',
    url: canonical,
    mainEntityOfPage: canonical,
  };
}
