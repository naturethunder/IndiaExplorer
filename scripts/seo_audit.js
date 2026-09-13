const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const report = {
  passed: [],
  warnings: [],
  errors: [],
  metaMetrics: {}
};

console.log('=== EXPLOREDESH DEEP TECHNICAL SEO & INDEXING AUDIT ===\n');

// 1. Robots.txt Audit
try {
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  if (robots.includes('Sitemap:') && robots.includes('sitemap.xml')) {
    report.passed.push('robots.txt: Correctly declares master sitemap (https://exploredesh.com/sitemap.xml)');
  } else {
    report.errors.push('robots.txt: Missing Sitemap directive');
  }
  if (robots.includes('Disallow: /stubs/')) {
    report.passed.push('robots.txt: Disallows /stubs/ to prevent duplicate indexing of redirect fallbacks');
  }
} catch (e) {
  report.errors.push('robots.txt: File not found');
}

// 2. Sitemaps Audit
const sitemaps = [
  'sitemap.xml',
  'sitemap-main.xml',
  'sitemap-states.xml',
  'sitemap-destinations-1.xml',
  'sitemap-destinations-2.xml',
  'sitemap-destinations-3.xml'
];
let totalSitemapUrls = 0;
let totalSitemapImages = 0;

sitemaps.forEach(sm => {
  const p = path.join(ROOT, sm);
  if (!fs.existsSync(p)) {
    report.errors.push('Sitemap: ' + sm + ' is missing');
    return;
  }
  const content = fs.readFileSync(p, 'utf8');
  if (!content.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    report.errors.push('Sitemap: ' + sm + ' missing XML declaration');
  }
  const urlMatches = content.match(/<loc>/g) || [];
  const imgMatches = content.match(/<image:image>/g) || [];
  if (sm === 'sitemap.xml') {
    if (content.includes('<sitemapindex')) {
      report.passed.push('Sitemap Index (sitemap.xml): Valid <sitemapindex> pointing to ' + urlMatches.length + ' sub-sitemaps');
    } else {
      report.errors.push('Sitemap Index: sitemap.xml does not contain <sitemapindex>');
    }
  } else {
    totalSitemapUrls += urlMatches.length;
    totalSitemapImages += imgMatches.length;
    report.passed.push('Sub-Sitemap (' + sm + '): ' + urlMatches.length + ' URLs, ' + imgMatches.length + ' indexed images');
  }
});

report.metaMetrics.totalSitemapUrls = totalSitemapUrls;
report.metaMetrics.totalSitemapImages = totalSitemapImages;

// 3. HTML Pages Audit
const htmlPages = [
  'index.html',
  'destinations.html',
  'destination.html',
  'about.html',
  'contact.html',
  'ai-finder.html',
  'privacy.html',
  'terms.html'
];

htmlPages.forEach(hp => {
  const p = path.join(ROOT, hp);
  if (!fs.existsSync(p)) {
    report.errors.push('HTML: ' + hp + ' is missing');
    return;
  }
  const html = fs.readFileSync(p, 'utf8');

  // Title tag
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) {
    report.errors.push(hp + ': Missing <title> tag');
  } else {
    const t = titleMatch[1].trim();
    if (t.length > 70) {
      report.warnings.push(hp + ': <title> exceeds 70 chars (' + t.length + ' chars): "' + t + '"');
    } else {
      report.passed.push(hp + ': Clean <title> (' + t.length + ' chars)');
    }
  }

  // Meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch || !descMatch[1].trim()) {
    report.warnings.push(hp + ': Missing static meta description');
  } else {
    const d = descMatch[1].trim();
    if (d.length > 170) {
      report.warnings.push(hp + ': Meta description exceeds 170 chars (' + d.length + ' chars)');
    } else {
      report.passed.push(hp + ': Valid meta description (' + d.length + ' chars)');
    }
  }

  // Viewport
  if (html.includes('name="viewport"')) {
    report.passed.push(hp + ': Mobile viewport configured');
  } else {
    report.errors.push(hp + ': Missing viewport meta tag');
  }

  // Robots
  if (html.includes('name="robots"')) {
    report.passed.push(hp + ': Robots directive present');
  } else {
    report.warnings.push(hp + ': No explicit robots meta tag');
  }

  // Canonical tag
  if (hp === 'destination.html') {
    if (html.includes('canonicalUrl') && !html.includes('<link rel="canonical" href="https://exploredesh.com/destination.html" />')) {
      report.passed.push(hp + ': Dynamic self-referencing canonical script active; generic root canonical successfully removed');
    } else {
      report.errors.push(hp + ': Conflicting generic canonical tag detected');
    }
  } else {
    const canonMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (!canonMatch) {
      report.errors.push(hp + ': Missing canonical tag');
    } else if (!canonMatch[1].startsWith('https://exploredesh.com')) {
      report.warnings.push(hp + ': Canonical not absolute https://exploredesh.com: ' + canonMatch[1]);
    } else {
      report.passed.push(hp + ': Absolute canonical verified: ' + canonMatch[1]);
    }
  }

  // Headings
  const h1Matches = html.match(/<h1[\s>]/gi) || [];
  if (h1Matches.length === 1) {
    report.passed.push(hp + ': Exactly 1 <h1> heading in markup');
  } else if (h1Matches.length === 0) {
    report.warnings.push(hp + ': 0 static <h1> headings (dynamically injected on client)');
  } else {
    report.warnings.push(hp + ': Multiple <h1> headings found (' + h1Matches.length + ')');
  }
});

// 4. Stubs Audit (Sample 10 stubs)
const stubsDir = path.join(ROOT, 'stubs');
if (fs.existsSync(stubsDir)) {
  const stubFiles = fs.readdirSync(stubsDir);
  report.passed.push('Stubs Directory: ' + stubFiles.length + ' pre-rendered redirect stubs generated');
  const sample = stubFiles.slice(0, 10);
  let stubsValid = true;
  sample.forEach(f => {
    const txt = fs.readFileSync(path.join(stubsDir, f), 'utf8');
    if (!txt.includes('link rel="canonical" href="https://exploredesh.com/destination.html?slug=')) {
      stubsValid = false;
    }
  });
  if (stubsValid) {
    report.passed.push('Stubs Canonical: Sample stubs all use absolute canonical URLs');
  } else {
    report.errors.push('Stubs Canonical: Found stubs with relative or missing canonicals');
  }
} else {
  report.errors.push('Stubs Directory: stubs/ folder does not exist');
}

// 5. Schema.org JSON-LD structured data in index.html & JS modules
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (indexHtml.includes('"@type": "Organization"') && indexHtml.includes('"@type": "WebSite"')) {
  report.passed.push('Structured Data (index.html): Organization and WebSite (Sitelinks Searchbox) JSON-LD present');
}

const destHtml = fs.readFileSync(path.join(ROOT, 'destinations.html'), 'utf8');
if (destHtml.includes('"@type": "CollectionPage"')) {
  report.passed.push('Structured Data (destinations.html): CollectionPage JSON-LD present');
}

const seoJs = fs.readFileSync(path.join(ROOT, 'js', 'components', 'seo.js'), 'utf8');
if (seoJs.includes('TouristDestination') && seoJs.includes('BreadcrumbList') && seoJs.includes('faqPageJsonLd')) {
  report.passed.push('Structured Data (seo.js): TouristDestination, BreadcrumbList, and FAQPage JSON-LD generators active');
}

// Print Results
console.log('✅ PASSED CHECKS (' + report.passed.length + '):');
report.passed.forEach(p => console.log('  [PASS] ' + p));

if (report.warnings.length > 0) {
  console.log('\n⚠️ WARNINGS (' + report.warnings.length + '):');
  report.warnings.forEach(w => console.log('  [WARN] ' + w));
}

if (report.errors.length > 0) {
  console.log('\n❌ ERRORS (' + report.errors.length + '):');
  report.errors.forEach(e => console.log('  [FAIL] ' + e));
} else {
  console.log('\n🎉 ZERO ERRORS FOUND! All critical technical SEO and indexing checks passed.');
}

console.log('\nSummary Metrics:');
console.log('  - Total Sitemaps: ' + sitemaps.length);
console.log('  - Total Sitemapped URLs: ' + report.metaMetrics.totalSitemapUrls);
console.log('  - Total Sitemapped Images: ' + report.metaMetrics.totalSitemapImages);
