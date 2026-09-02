/**
 * company.js — shared page logic for the static company pages
 * (about.html, privacy.html, terms.html). Mounts the company-variant chrome
 * and applies per-page SEO, keyed off the current filename.
 */
import { initLayout } from '../components/layout.js';
import { applySEO, injectJsonLd, breadcrumbJsonLd, aboutPageJsonLd } from '../components/seo.js';

const PAGES = {
  'about.html': {
    active: 'about',
    title: 'About Us — ExploreDesh',
    description: "Learn about ExploreDesh — India's most thoughtful travel discovery platform. Our mission, story, and the values behind 2,390 destinations across 36 states & UTs.",
    crumb: 'About Us',
    keywords: ['about exploredesh', 'india travel platform', 'curated india destinations'],
  },
  'privacy.html': {
    active: '',
    title: 'Privacy Policy — ExploreDesh',
    description: 'ExploreDesh Privacy Policy — what information we collect, how we use it, and the third-party services (weather, maps, photos) we rely on.',
    crumb: 'Privacy Policy',
    keywords: ['exploredesh privacy policy'],
    robots: 'noindex, follow, max-image-preview:large',
  },
  'terms.html': {
    active: '',
    title: 'Terms of Use — ExploreDesh',
    description: 'The terms and conditions of using the ExploreDesh travel discovery website.',
    crumb: 'Terms of Use',
    keywords: ['exploredesh terms of use'],
    robots: 'noindex, follow, max-image-preview:large',
  },
};

const file = window.location.pathname.split('/').pop() || 'about.html';
const page = PAGES[file] || PAGES['about.html'];

initLayout({ variant: 'company', active: page.active });

applySEO({
  title: page.title,
  description: page.description,
  canonicalPath: file,
  keywords: page.keywords,
  robots: page.robots,
});
if (file === 'about.html') {
  injectJsonLd(aboutPageJsonLd({
    title: page.title,
    description: page.description,
    canonicalPath: file,
  }));
}
injectJsonLd(breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: page.crumb, path: file },
]));
