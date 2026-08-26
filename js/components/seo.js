/**
 * seo.js — runtime SEO helpers: title/description/canonical/OG/Twitter meta +
 * Schema.org JSON-LD injection. Canonical & OG URLs are computed from
 * location.origin so they stay correct on any domain.
 */

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
  try { return new URL(path, window.location.href).href; }
  catch (e) { return path; }
}

/**
 * Apply page SEO. opts:
 *  { title, description, canonicalPath (relative, default current page),
 *    ogImage, keywords: [], type: 'website'|'article' }
 */
export function applySEO(opts) {
  if (opts.title) document.title = opts.title;
  setMeta('name', 'description', opts.description);
  if (opts.keywords && opts.keywords.length) setMeta('name', 'keywords', opts.keywords.join(', '));

  const canonical = absUrl(opts.canonicalPath || (window.location.pathname.split('/').pop() + window.location.search));
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', canonical);

  setMeta('property', 'og:title', opts.title);
  setMeta('property', 'og:description', opts.description);
  setMeta('property', 'og:url', canonical);
  setMeta('property', 'og:type', opts.type || 'website');
  setMeta('property', 'og:site_name', 'ExploreDesh');
  if (opts.ogImage) setMeta('property', 'og:image', absUrl(opts.ogImage));

  setMeta('name', 'twitter:card', opts.ogImage ? 'summary_large_image' : 'summary');
  setMeta('name', 'twitter:title', opts.title);
  setMeta('name', 'twitter:description', opts.description);
  if (opts.ogImage) setMeta('name', 'twitter:image', absUrl(opts.ogImage));
}

/** Inject one Schema.org JSON-LD block. */
export function injectJsonLd(obj) {
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(obj);
  document.head.appendChild(s);
}

/** BreadcrumbList schema. items: [{name, path}] (path relative). */
export function breadcrumbJsonLd(items) {
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
export function faqJsonLd(faq) {
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
export function destinationJsonLd(dest) {
  const ov = dest.overview || {};
  const description = ov.short || dest.short || dest.description || '';
  const out = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: dest.title,
    description: description,
    address: { '@type': 'PostalAddress', addressRegion: dest.state, addressCountry: 'IN' },
    touristType: dest.type ? dest.type.replace(/_/g, ' ') : undefined,
  };
  if (dest.weather && dest.weather.lat != null) {
    out.geo = { '@type': 'GeoCoordinates', latitude: dest.weather.lat, longitude: dest.weather.lng };
  } else if (dest.coordinates) {
    out.geo = { '@type': 'GeoCoordinates', latitude: dest.coordinates.lat, longitude: dest.coordinates.lng };
  }
  const imgSrc = typeof dest.heroImage === 'string' ? dest.heroImage : (dest.heroImage && dest.heroImage.src ? dest.heroImage.src : (dest.image && dest.image.src ? dest.image.src : null));
  if (imgSrc) out.image = imgSrc;
  if (ov.rating) {
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ov.rating,
      reviewCount: ov.reviewCount || 1,
      bestRating: 5,
    };
  } else if (dest.rating) {
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: dest.rating,
      reviewCount: dest.reviewCount || 1,
      bestRating: 5,
    };
  }
  return out;
}
