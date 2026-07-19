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
  setMeta('property', 'og:site_name', 'IndiaExplore');
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
  const out = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: dest.title,
    description: dest.overview.short,
    address: { '@type': 'PostalAddress', addressRegion: dest.state, addressCountry: 'IN' },
    touristType: dest.type ? dest.type.replace(/_/g, ' ') : undefined,
  };
  if (dest.weather && dest.weather.lat != null) {
    out.geo = { '@type': 'GeoCoordinates', latitude: dest.weather.lat, longitude: dest.weather.lng };
  }
  if (dest.heroImage && dest.heroImage.src) out.image = dest.heroImage.src;
  if (dest.overview.rating) {
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: dest.overview.rating,
      reviewCount: dest.overview.reviewCount || 1,
      bestRating: 5,
    };
  }
  return out;
}
