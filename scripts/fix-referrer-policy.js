const fs = require('fs');
const files = ['destination.html', 'index.html', 'destinations.html', 'ai-finder.html'];
const OLD = '<meta name="referrer" content="no-referrer" />';
const NEW = '<meta name="referrer" content="strict-origin-when-cross-origin" />';
for (const f of files) {
  if (!fs.existsSync(f)) { console.log('Not found:', f); continue; }
  const orig = fs.readFileSync(f, 'utf8');
  if (!orig.includes(OLD)) { console.log('No change needed:', f); continue; }
  const updated = orig.split(OLD).join(NEW);
  fs.writeFileSync(f, updated, 'utf8');
  console.log('Fixed:', f);
}
