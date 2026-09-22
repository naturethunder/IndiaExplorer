const fs = require('fs');
const path = require('path');

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');
const targetFiles = JSON.parse(fs.readFileSync('scratch_image_changed_files.json', 'utf8'))
  .filter(f => f.endsWith('.json') && !f.endsWith('index.json'))
  .map(f => path.basename(f));

console.log(`Starting Phase 1: HD Resolution Upgrade (w=1920) across ${targetFiles.length} destinations...`);

function upgradeUrlToHD(url) {
  if (!url || typeof url !== 'string') return url;
  
  // 1. Pexels
  if (url.includes('images.pexels.com')) {
    // If it has &w=... and &h=..., replace with &w=1920
    let upgraded = url;
    if (upgraded.includes('w=940') || upgraded.includes('w=1280') || upgraded.includes('w=1600') || upgraded.includes('w=1000')) {
      upgraded = upgraded.replace(/[?&]h=\d+/g, '');
      upgraded = upgraded.replace(/w=\d+/g, 'w=1920');
      // Clean up double ampersands or trailing ?/&
      upgraded = upgraded.replace(/\?&+/g, '?').replace(/&&+/g, '&').replace(/[?&]$/, '');
    } else if (!upgraded.includes('w=')) {
      const sep = upgraded.includes('?') ? '&' : '?';
      upgraded = `${upgraded}${sep}auto=compress&cs=tinysrgb&w=1920`;
    }
    return upgraded;
  }

  // 2. Unsplash
  if (url.includes('images.unsplash.com')) {
    let upgraded = url;
    if (upgraded.includes('w=940') || upgraded.includes('w=1280') || upgraded.includes('w=1600') || upgraded.includes('w=1000')) {
      upgraded = upgraded.replace(/[?&]h=\d+/g, '');
      upgraded = upgraded.replace(/w=\d+/g, 'w=1920');
      upgraded = upgraded.replace(/\?&+/g, '?').replace(/&&+/g, '&').replace(/[?&]$/, '');
    }
    return upgraded;
  }

  return url;
}

let totalUpgraded = 0;
let filesModified = 0;

for (const file of targetFiles) {
  const filePath = path.join(destDir, file);
  if (!fs.existsSync(filePath)) continue;
  let d;
  try {
    d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch(e) {
    continue;
  }

  let modified = false;

  // Hero
  if (d.heroImage?.src) {
    const upgraded = upgradeUrlToHD(d.heroImage.src);
    if (upgraded !== d.heroImage.src) {
      d.heroImage.src = upgraded;
      modified = true;
      totalUpgraded++;
    }
  }

  // Gallery
  (d.gallery || []).forEach(g => {
    if (g.src) {
      const upgraded = upgradeUrlToHD(g.src);
      if (upgraded !== g.src) {
        g.src = upgraded;
        modified = true;
        totalUpgraded++;
      }
    }
  });

  // Maintain hero sync
  if (d.gallery?.[0]?.src && d.heroImage?.src && d.heroImage.src !== d.gallery[0].src) {
    d.heroImage.src = d.gallery[0].src;
    modified = true;
  }

  // TopPlaces
  (d.topPlaces || []).forEach(p => {
    if (p.image?.src) {
      const upgraded = upgradeUrlToHD(p.image.src);
      if (upgraded !== p.image.src) {
        p.image.src = upgraded;
        modified = true;
        totalUpgraded++;
      }
    }
    (p.photos || []).forEach((ph, phIdx) => {
      if (typeof ph === 'string') {
        const upgraded = upgradeUrlToHD(ph);
        if (upgraded !== ph) {
          p.photos[phIdx] = upgraded;
          modified = true;
          totalUpgraded++;
        }
      } else if (ph && typeof ph === 'object' && ph.src) {
        const upgraded = upgradeUrlToHD(ph.src);
        if (upgraded !== ph.src) {
          ph.src = upgraded;
          modified = true;
          totalUpgraded++;
        }
      }
    });
  });

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(d, null, 2) + '\n', 'utf8');
    filesModified++;
  }
}

console.log(`Phase 1 Complete: Upgraded ${totalUpgraded} photo URLs across ${filesModified} files to w=1920 HD.`);
