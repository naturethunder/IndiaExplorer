const fs = require('fs');
const path = require('path');
const { cleanUrlKey } = require('./image-search-engine.js');

const destDir = path.resolve(__dirname, '..', 'data', 'destinations');

function run() {
  console.log('=== FIXING PERFECT DISJOINT & AUTHENTIC MAPPINGS ===');

  // 1. Fix Varanasi: Sarnath Dhamek Stupa (replace Nalanda photo 38186484 with genuine Sarnath photo)
  {
    const vPath = path.join(destDir, 'varanasi.json');
    const v = JSON.parse(fs.readFileSync(vPath, 'utf8'));
    // Find where 38186484 is in Sarnath (P3)
    const sarnath = v.topPlaces.find(p => p.name.toLowerCase().includes('sarnath'));
    if (sarnath && sarnath.photos) {
      sarnath.photos = sarnath.photos.map(u => {
        if (u.includes('38186484')) {
          return 'https://live.staticflickr.com/2069/2204975647_7c973fee56_b.jpg'; // authentic Sarnath Dhamek Stupa
        }
        return u;
      });
    }
    fs.writeFileSync(vPath, JSON.stringify(v, null, 2), 'utf8');
    console.log('Fixed Varanasi Sarnath photo.');
  }

  // 2. Fix Nalanda: replace Sarnath Dhamek Stupa (37160979) and 35638213 with authentic Nalanda ruins photos
  {
    const nPath = path.join(destDir, 'nalanda.json');
    const n = JSON.parse(fs.readFileSync(nPath, 'utf8'));
    // Replace gallery[0] (35638213) with authentic Nalanda great stupa
    if (n.gallery[0].src.includes('35638213')) {
      const newG0 = 'https://images.unsplash.com/photo-1736235300171-eb8aa382b594?auto=format&fit=crop&w=1600&q=80';
      n.gallery[0].src = newG0;
      n.heroImage.src = newG0;
    }
    // Replace in P0 photos if any Sarnath (37160979)
    if (n.topPlaces[0] && n.topPlaces[0].photos) {
      n.topPlaces[0].photos = n.topPlaces[0].photos.map(u => {
        if (u.includes('37160979')) {
          return 'https://images.unsplash.com/photo-1559489110-40a90ee4e70a?auto=format&fit=crop&w=1600&q=80';
        }
        return u;
      });
    }
    fs.writeFileSync(nPath, JSON.stringify(n, null, 2), 'utf8');
    console.log('Fixed Nalanda unique photos.');
  }

  // 3. Fix Kaziranga Place 6 (Gibbon Wildlife Sanctuary): replace duplicate Flickr gibbon card image
  {
    const kPath = path.join(destDir, 'kaziranga.json');
    const k = JSON.parse(fs.readFileSync(kPath, 'utf8'));
    const gibbonPlace = k.topPlaces.find(p => p.name.includes('Gibbon'));
    if (gibbonPlace && gibbonPlace.image) {
      // Use another authentic Hoolock gibbon photo from Flickr
      gibbonPlace.image.src = 'https://live.staticflickr.com/4784/27011465848_1e1318635c_b.jpg';
    }
    fs.writeFileSync(kPath, JSON.stringify(k, null, 2), 'utf8');
    console.log('Fixed Kaziranga Gibbon card image.');
  }

  // 4. Fix Rohtasgarh Fort: replace 35638213 and 38960339 with authentic Rohtasgarh photos
  {
    const rPath = path.join(destDir, 'rohtasgarh-fort.json');
    const r = JSON.parse(fs.readFileSync(rPath, 'utf8'));
    // Replace in P0 or P1
    r.topPlaces.forEach(pl => {
      if (pl.photos) {
        pl.photos = pl.photos.map(u => {
          if (u.includes('35638213')) return 'https://upload.wikimedia.org/wikipedia/commons/e/ee/View_of_the_Rohtasgarh_Fort_from_downhill.jpg';
          if (u.includes('38960339')) return 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Rothasgarh_Fort_32.jpg';
          return u;
        });
      }
    });
    fs.writeFileSync(rPath, JSON.stringify(r, null, 2), 'utf8');
    console.log('Fixed Rohtasgarh Fort photos.');
  }

  // 5. Fix Munger Fort: replace all Varanasi/Nalanda overlaps with authentic Munger photos
  {
    const mPath = path.join(destDir, 'munger-fort.json');
    const m = JSON.parse(fs.readFileSync(mPath, 'utf8'));

    // Authentic Munger Fort images pool
    const mungerAuthentic = [
      'https://upload.wikimedia.org/wikipedia/commons/e/ee/A_view_within_the_fort_of_Monghyr.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f7/%27View_in_the_Fort_at_Monghyr%27._People_walking_about.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/a8/A_View_of_the_Fort_of_Mongheer%2C_upon_the_banks_of_the_River_Ganges.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/3a/The_East_End_of_the_Fort_of_Mongheer_View_1.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/d/dc/Munger_Ganga_Bridge.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/39/Fort_of_munger-Munger-Bihar.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/5d/MungerFort.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/3/3f/Henry_Salt_-_A_view_within_the_fort_of_Monghyr_04a.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/5/5d/The_East_End_of_the_Fort_of_Mongheer_view_2.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/49/Munger_pool.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/Munger_Ganga_Rail_Road_Bridge.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/6/6e/Munger_ganga_bridge_route.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/6/6a/The_old_palace_buildings_within_the_fort.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/1/15/Chandika_Sthan_Temple_near_Saharsa_Town.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/0a/Maachandika.JPG'
    ];

    let poolIdx = 0;
    function getNextMunger() {
      if (poolIdx < mungerAuthentic.length) return mungerAuthentic[poolIdx++];
      return null;
    }

    // Replace colliding gallery
    m.gallery.forEach((g, i) => {
      if (g.src.includes('5949485') || g.src.includes('39121732') || g.src.includes('36737805')) {
        const next = getNextMunger();
        if (next) g.src = next;
      }
    });
    m.heroImage.src = m.gallery[0].src;

    // Replace colliding place photos
    m.topPlaces.forEach(pl => {
      if (pl.image?.src && (pl.image.src.includes('5949485') || pl.image.src.includes('39121732') || pl.image.src.includes('36737805'))) {
        const next = getNextMunger();
        if (next) pl.image.src = next;
      }
      if (pl.photos) {
        pl.photos = pl.photos.map(u => {
          if (u.includes('14374972') || u.includes('38186484') || u.includes('38931046') || u.includes('5949485') || u.includes('39121732') || u.includes('36737805')) {
            const next = getNextMunger();
            if (next) return next;
          }
          return u;
        });
      }
    });

    fs.writeFileSync(mPath, JSON.stringify(m, null, 2), 'utf8');
    console.log('Fixed Munger Fort authentic images.');
  }

  console.log('\n=== ALL CROSS-DESTINATION ADJUSTMENTS APPLIED ===');
}

run();
