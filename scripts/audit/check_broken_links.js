const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

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

const brokenLinks = [];

htmlPages.forEach(hp => {
  const content = fs.readFileSync(path.join(ROOT, hp), 'utf8');
  const hrefMatches = content.match(/href=["']([^"'#]+)["']/g) || [];
  hrefMatches.forEach(hm => {
    let link = hm.replace(/^href=["']/, '').replace(/["']$/, '');
    if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('javascript:')) return;
    let clean = link.split('?')[0].split('#')[0];
    if (clean === '' || clean === '/') return;
    if (clean.startsWith('/')) clean = clean.slice(1);
    if (!fs.existsSync(path.join(ROOT, clean))) {
      brokenLinks.push({ page: hp, link: link, clean: clean });
    }
  });
});

console.log('Broken relative links found:', brokenLinks.length);
if (brokenLinks.length > 0) {
  console.log(JSON.stringify(brokenLinks, null, 2));
} else {
  console.log('All static relative links in all 8 HTML templates point to valid existing files.');
}
