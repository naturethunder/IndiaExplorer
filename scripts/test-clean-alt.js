// Test the new cleanAltText against all known problematic patterns

function cleanAltText(str) {
  if (!str || typeof str !== 'string') return '';
  let clean = str;
  clean = clean.replace(/<!--[\s\S]*?-->/g, ' ');
  clean = clean
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ');
  let prev = '';
  while (prev !== clean) {
    prev = clean;
    clean = clean.replace(/<[^>]*>/g, ' ');
    clean = clean.replace(/<[a-zA-Z\/][^<]*/g, ' ');
  }
  clean = clean.replace(/[<>]/g, ' ');
  clean = clean.replace(/(?:https?:\/\/|\/\/)\S+/gi, ' ');
  clean = clean.replace(/^File:[^.]+\.(?:jpe?g|png|webp)/i, ' ');
  clean = clean.replace(/^This is a photo of\s*/i, ' ');
  clean = clean.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  clean = clean.replace(/[-—–:]\s*(?:This is a photo of|A photo of|View of)?\s*$/i, '');
  clean = clean.replace(/^[-—–:;,./|]\s*/, '').replace(/\s*[-—–:;,./|]$/, '').trim();
  return clean;
}

const tests = [
  // Old Wikimedia data with HTML in alt
  'Grand entrance of Rohtasgarh Fort <a href="Archaeological_Survey">Archaeological Sur',
  'Red Fort sandstone fortifications <a href="https://en.wikipedia.org/wiki/Red_Fort">Wikipedia</a>',
  'Kapileshwar Temple &lt;a href="https://commons.wikimedia.org"&gt;Commons&lt;/a&gt;',
  '&lt;a href="https://commons.wikimedia.org/wiki/File:Test.jpg"&gt;Photo&lt;/a&gt; — Temple view',
  'Varanasi ghats <span class="mw-category">Spiritual</span> on the Ganges',
  // Truncated HTML (the actual bug)
  'Rohtasgarh Fort gateway <a href="https://en.wiki',
  // Normal clean text (should pass through unchanged)
  'Rohtasgarh Fort — Grand Hathiya Pol gateway entrance atop Kaimur hills, Bihar',
  'Varanasi Ghats on the Ganges, Uttar Pradesh',
  // Empty/null
  '',
];

console.log('=== cleanAltText Tests ===\n');
tests.forEach(function(t, i) {
  const result = cleanAltText(t);
  const hasHtml = result.includes('<') || result.includes('>') || result.includes('href');
  const status = hasHtml ? '❌ FAIL - HTML leaked!' : '✅ PASS';
  console.log('Test ' + (i+1) + ': ' + status);
  console.log('  Input:  ' + t.substring(0, 100));
  console.log('  Output: ' + result.substring(0, 100));
  console.log('');
});
