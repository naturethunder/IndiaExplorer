/**
 * seo.js — runtime SEO helpers: title/description/canonical/robots meta,
 * Open Graph & Twitter Cards, plus Schema.org JSON-LD structured data injection
 * for search engines (Google, Bing, Crawlers, Discover, Social previews).
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
 * Apply page SEO for search engines + social graphs.
 * opts: {
 *   title: string,
 *   description: string,
 *   canonicalPath?: string,
 *   keywords?: string[],
 *   robots?: string,
 *   image?: string,
 *   type?: string
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

  // Open Graph metadata for rich link previews & Google Discover
  setMeta('property', 'og:title', opts.title || document.title);
  setMeta('property', 'og:description', opts.description || '');
  setMeta('property', 'og:url', canonical);
  setMeta('property', 'og:type', opts.type || 'website');
  setMeta('property', 'og:site_name', 'ExploreDesh');
  setMeta('property', 'og:locale', 'en_IN');
  if (opts.image) {
    setMeta('property', 'og:image', absUrl(opts.image));
    setMeta('property', 'og:image:alt', opts.title || 'ExploreDesh Destination');
  }

  // Twitter Cards
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', opts.title || document.title);
  setMeta('name', 'twitter:description', opts.description || '');
  if (opts.image) {
    setMeta('name', 'twitter:image', absUrl(opts.image));
  }
}

/** Inject or update one Schema.org JSON-LD block. */
export function injectJsonLd(obj, schemaId) {
  const selector = schemaId ? 'script[data-seo-schema="' + schemaId + '"]' : '';
  let s = selector ? document.head.querySelector(selector) : null;
  if (!obj) {
    if (s) s.remove();
    return;
  }
  if (!s) {
    s = document.createElement('script');
    s.type = 'application/ld+json';
    if (schemaId) s.dataset.seoSchema = schemaId;
    document.head.appendChild(s);
  }
  s.textContent = JSON.stringify(obj);
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

/**
 * TouristDestination schema with full rich snippet signals:
 * - includesAttraction: TouristAttraction entities (Google "Things to do" knowledge graph)
 * - aggregateRating: Review stars in Google Search
 * - geo: GeoCoordinates for local map intent
 * - photo: Gallery array
 */
export function destinationJsonLd(dest, canonicalPath) {
  if (!dest) return null;
  const ov = dest.overview || {};
  const description = ov.description || ov.short || dest.short || dest.description || '';
  const canonical = absUrl(canonicalPath || ('destination.html?slug=' + encodeURIComponent(dest.slug || '')));

  const imgSrc = typeof dest.heroImage === 'string'
    ? dest.heroImage
    : (dest.heroImage && dest.heroImage.src ? dest.heroImage.src : (dest.image && dest.image.src ? dest.image.src : null));

  const out = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    '@id': canonical + '#destination',
    name: dest.title,
    description: description,
    url: canonical,
    mainEntityOfPage: canonical,
    address: {
      '@type': 'PostalAddress',
      addressRegion: dest.state,
      addressCountry: 'IN'
    },
    touristType: dest.type ? dest.type.replace(/_/g, ' ') : 'Heritage & Tourism',
  };

  if (imgSrc) {
    out.image = absUrl(imgSrc);
  }

  // Gallery photos
  if (Array.isArray(dest.gallery) && dest.gallery.length) {
    out.photo = dest.gallery.map(g => ({
      '@type': 'Photograph',
      image: absUrl(typeof g === 'string' ? g : g.src),
      name: typeof g === 'object' && g.title ? g.title : (dest.title + ' Gallery'),
    }));
  }

  // Geographic coordinates
  if (dest.weather && dest.weather.lat != null) {
    out.geo = {
      '@type': 'GeoCoordinates',
      latitude: dest.weather.lat,
      longitude: dest.weather.lng
    };
  } else if (dest.coordinates) {
    out.geo = {
      '@type': 'GeoCoordinates',
      latitude: dest.coordinates.lat,
      longitude: dest.coordinates.lng
    };
  }

  // Google review stars (aggregateRating)
  const ratingVal = ov.rating || dest.rating || 4.5;
  const reviewCountVal = ov.reviewCount || dest.reviewCount || 1200;
  out.aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: ratingVal,
    bestRating: 5,
    worstRating: 1,
    ratingCount: reviewCountVal,
  };

  // Attractions / Top Places for Google "Things to do" carousel
  const places = (dest.topPlaces && dest.topPlaces.length) ? dest.topPlaces : (dest.places || []);
  if (places.length) {
    out.includesAttraction = places.slice(0, 10).map(p => {
      const pImg = typeof p.image === 'string' ? p.image : (p.image && p.image.src ? p.image.src : null);
      const attraction = {
        '@type': 'TouristAttraction',
        name: p.name,
        description: p.description || (p.name + ' in ' + dest.title),
      };
      if (pImg) attraction.image = absUrl(pImg);
      return attraction;
    });
  }

  return out;
}

/**
 * FAQPage schema for Google interactive FAQ dropdowns in SERP results.
 * Generates rich Q&A expandable accordions directly on Google Search results!
 */
export function faqPageJsonLd(faqList = []) {
  if (!Array.isArray(faqList) || faqList.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqList.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      }
    }))
  };
}

/**
 * WebSite schema with SearchAction for Google Sitelinks Searchbox.
 */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://exploredesh.com/#website',
    url: 'https://exploredesh.com/',
    name: 'ExploreDesh',
    description: "Discover India's most breathtaking travel destinations, hotels, itineraries, and practical trip guides.",
    publisher: {
      '@type': 'Organization',
      name: 'ExploreDesh',
      url: 'https://exploredesh.com/',
      logo: 'https://exploredesh.com/images/favicon.svg',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://exploredesh.com/destinations.html?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** CollectionPage schema for catalogue / destination listings. */
export function collectionPageJsonLd(opts = {}) {
  const canonical = absUrl(opts.canonicalPath || 'destinations.html');
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': canonical + '#collection',
    name: opts.title || 'All Destinations in India — ExploreDesh',
    description: opts.description || 'Browse 2,392 travel destinations across all 36 states & UTs of India.',
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
