/**
 * js/utils/offlineStorage.js — Native IndexedDB Engine for ExploreDesh Go
 * 
 * Manages persistent offline pocket guides, emergency protocols,
 * offline travel checklists, and device storage metrics.
 * Zero external libraries — 100% standard W3C IndexedDB API.
 */

const DB_NAME = 'exploredesh_go_db';
const DB_VERSION = 1;
const STORE_GUIDES = 'guides';
const STORE_NOTES = 'notes';
const STORE_EMERGENCY = 'emergency';

// Built-in Comprehensive Emergency & Safety Toolkit for Remote Bharat
const EMERGENCY_TOOLKIT_DATA = {
  sos_contacts: [
    { name: 'National Universal Emergency', number: '112', desc: 'All-India unified SOS (Police, Fire, Ambulance, Disaster)', icon: 'phone-call' },
    { name: 'Police Helpline', number: '100', desc: 'Direct state police dispatch across all states & UTs', icon: 'shield-check' },
    { name: 'Ambulance & Medical Emergency', number: '108', desc: 'Emergency medical services & trauma dispatch', icon: 'activity' },
    { name: 'Mountain Rescue & Disaster Control (NDRF)', number: '1070', desc: 'State disaster management / High-altitude avalanche & search rescue', icon: 'mountain' },
    { name: 'District Disaster Control Room', number: '1077', desc: 'District-level emergency response & road blockade clearance', icon: 'compass' },
    { name: 'Women Safety Helpline', number: '1091', desc: '24x7 women distress & safety support across India', icon: 'users' },
    { name: 'Indian Coast Guard (Maritime & Backwaters)', number: '1554', desc: 'Coastal distress, marine emergency & backwater boat assistance', icon: 'waves' },
    { name: 'National Tourist Helpline', number: '1363', desc: 'Ministry of Tourism 24x7 multi-lingual tourist assistance', icon: 'globe' }
  ],
  altitude_protocol: {
    title: 'High-Altitude Mountain Sickness (AMS) Protocol',
    threshold: '2,400m+ (Leh, Spiti, Khardung La, Rohtang, Chopta, Gurudongmar)',
    golden_rule: 'Ascend gradually. NEVER ascend higher with symptoms of AMS. If symptoms worsen, DESCEND IMMEDIATELY (300m–500m lower).',
    symptoms: [
      'Throbbing headache (especially behind forehead or temples)',
      'Nausea, dizziness, loss of appetite, or vomiting',
      'Fatigue, uncharacteristic lethargy, and sleep disruption',
      'Severe Warning Signs (HAPE/HACE): extreme breathlessness at rest, persistent dry cough with pink sputum, confusion, ataxia (stumbling walk)'
    ],
    action_checklist: [
      'Acclimatize for minimum 48 hours upon flying or driving above 3,000m (e.g. Leh 3,500m).',
      'Maintain 3.5 to 4 Litres of water intake daily; avoid alcohol and sedatives.',
      'Lake Louise Score check: Rate Headache (0-3), Nausea (0-3), Fatigue (0-3), Dizziness (0-3). Score >= 3 with headache indicates AMS.',
      'Consult physician regarding preventive Acetazolamide (Diamox 125mg–250mg bid) prior to ascent.',
      'Carry portable pulse oximeter: normal SpO2 at 3,500m is 80–88%. SpO2 < 70% with dyspnea requires immediate supplemental oxygen and descent.'
    ]
  },
  wildlife_safari_rules: {
    title: 'Forest Core & Safari Zone Safety Protocol',
    zones: 'Jim Corbett, Kaziranga, Ranthambore, Gir, Kanha, Bandhavgarh, Sundarbans',
    guidelines: [
      'Maintain absolute silence in safari vehicles; sudden shouts can startle charging elephants or big cats.',
      'Never dismount from gypsy/canter outside designated watchtowers and forest rest houses.',
      'Wear muted earthy colors (khaki, olive green, brown). Avoid bright whites, reds, and neon fabrics.',
      'Keep minimum 25 metres distance from solitary wild tuskers or breeding herds with calves.',
      'No flash photography; do not use plastic wrappers or leave food in forest areas.'
    ]
  },
  coastal_backwaters_rules: {
    title: 'Coastal & Backwater Waterway Safety Protocol',
    zones: 'Alleppey, Kumarakom, Lakshadweep, Andaman & Nicobar, Goa, Gokarna',
    guidelines: [
      'Always insist on certified life jackets before boarding houseboats, shikaras, or island ferries.',
      'Beware of rip currents along open surf beaches; swim only in designated lifeguard patrol flags.',
      'Keep waterproof dry bags for satellite communicators, power banks, and physical emergency maps.',
      'Check local tide charts before entering tidal sea caves and barrier sandbars.'
    ]
  }
};

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported in this browser'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store for full destination guides
        if (!db.objectStoreNames.contains(STORE_GUIDES)) {
          const store = db.createObjectStore(STORE_GUIDES, { keyPath: 'slug' });
          store.createIndex('state', 'state', { unique: false });
          store.createIndex('savedAt', 'savedAt', { unique: false });
        }

        // Store for offline travel notes
        if (!db.objectStoreNames.contains(STORE_NOTES)) {
          db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
        }

        // Store for pre-seeded emergency toolkit
        if (!db.objectStoreNames.contains(STORE_EMERGENCY)) {
          db.createObjectStore(STORE_EMERGENCY, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        // Pre-seed emergency data if needed
        const tx = db.transaction(STORE_EMERGENCY, 'readwrite');
        const store = tx.objectStore(STORE_EMERGENCY);
        store.put({ id: 'toolkit', data: EMERGENCY_TOOLKIT_DATA });
        resolve(db);
      };

      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

/**
 * Extract all critical image URLs to download for this destination pocket guide
 */
function extractDestinationImages(dest) {
  const urls = new Set();

  if (!dest) return [];

  // Hero image
  if (typeof dest.heroImage === 'string') urls.add(dest.heroImage);
  else if (dest.heroImage && dest.heroImage.src) urls.add(dest.heroImage.src);

  // Top places images
  if (Array.isArray(dest.topPlaces)) {
    dest.topPlaces.forEach((p) => {
      if (typeof p.image === 'string') urls.add(p.image);
      else if (p.image && p.image.src) urls.add(p.image.src);

      if (Array.isArray(p.photos)) {
        p.photos.slice(0, 2).forEach((src) => { if (src) urls.add(src); });
      }
    });
  }

  // Gallery
  if (Array.isArray(dest.gallery)) {
    dest.gallery.slice(0, 3).forEach((item) => {
      const src = typeof item === 'string' ? item : (item && item.src);
      if (src) urls.add(src);
    });
  }

  return Array.from(urls).filter(Boolean);
}

/**
 * 1-Click Save / Download Destination Pocket Guide for 100% Offline Access
 */
export async function saveDestinationOffline(dest) {
  if (!dest || !dest.slug) throw new Error('Invalid destination object');

  const db = await getDB();
  const slug = dest.slug;
  const jsonUrl = `data/destinations/${encodeURIComponent(slug)}.json`;
  const imageUrls = extractDestinationImages(dest);

  // Approximate storage footprint calculation
  const jsonString = JSON.stringify(dest);
  const jsonBytes = new Blob([jsonString]).size;
  // Estimate ~120KB per image on average
  const estimatedMediaBytes = imageUrls.length * 125000;
  const totalSizeBytes = jsonBytes + estimatedMediaBytes;

  const record = {
    slug,
    title: dest.title || slug,
    state: dest.state || '',
    type: dest.type || '',
    tagline: dest.tagline || '',
    altitude: (dest.overview && dest.overview.altitude) || 0,
    heroImage: typeof dest.heroImage === 'string' ? dest.heroImage : (dest.heroImage && dest.heroImage.src) || '',
    howToReach: dest.howToReach || null,
    weather: dest.weather || null,
    placesCount: (dest.topPlaces && dest.topPlaces.length) || 0,
    hotelsCount: (dest.hotels && (
      (dest.hotels.budget || []).length +
      (dest.hotels.mid || []).length +
      (dest.hotels.luxury || []).length
    )) || 0,
    data: dest,
    imageUrls,
    jsonUrl,
    sizeBytes: totalSizeBytes,
    savedAt: Date.now()
  };

  // 1. Put record in IndexedDB
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GUIDES, 'readwrite');
    const store = tx.objectStore(STORE_GUIDES);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // 2. Instruct Service Worker to pre-cache media & JSON payload
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      action: 'CACHE_POCKET_GUIDE',
      payload: { slug, jsonUrl, imageUrls }
    });
  }

  // 3. Dispatch reactive update event across all tabs/components
  window.dispatchEvent(new CustomEvent('exploredesh:offline-guides-changed', {
    detail: { action: 'saved', slug, title: dest.title }
  }));

  return record;
}

/**
 * Remove / Delete a saved destination pocket guide to reclaim device storage
 */
export async function removeDestinationOffline(slug) {
  const db = await getDB();

  // 1. Get record first to retrieve associated image URLs
  const record = await getDestinationOffline(slug);

  // 2. Delete from IndexedDB
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GUIDES, 'readwrite');
    const store = tx.objectStore(STORE_GUIDES);
    const req = store.delete(slug);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // 3. Directly evict cached media and JSON from Cache Storage
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key.includes('media') || key.includes('data')) {
          const cache = await caches.open(key);
          if (record && record.jsonUrl) {
            await cache.delete(record.jsonUrl);
            await cache.delete('/' + record.jsonUrl);
          }
          if (record && Array.isArray(record.imageUrls)) {
            await Promise.allSettled(
              record.imageUrls.map(async (url) => {
                await cache.delete(url);
                await cache.delete(url, { ignoreSearch: true });
              })
            );
          }
        }
      }

      // If no saved guides remain, completely purge media and data caches to reclaim 100% of offline storage
      const remainingGuides = await getAllOfflineGuides();
      if (remainingGuides.length === 0) {
        for (const key of keys) {
          if (key.includes('media') || key.includes('data')) {
            await caches.delete(key);
          }
        }
      }
    } catch (err) {
      console.warn('[ExploreDesh Go] Cache eviction error:', err);
    }
  }

  // 4. Also instruct Service Worker to evict cached media
  if (record && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      action: 'EVICT_POCKET_GUIDE',
      payload: {
        jsonUrl: record.jsonUrl,
        imageUrls: record.imageUrls
      }
    });
  }

  // 5. Dispatch reactive update event
  window.dispatchEvent(new CustomEvent('exploredesh:offline-guides-changed', {
    detail: { action: 'removed', slug }
  }));

  return true;
}

/**
 * Fetch a single saved pocket guide from IndexedDB
 */
export async function getDestinationOffline(slug) {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_GUIDES, 'readonly');
    const store = tx.objectStore(STORE_GUIDES);
    const req = store.get(slug);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

/**
 * Fast check whether a destination is already saved offline
 */
export async function isDestinationOffline(slug) {
  const guide = await getDestinationOffline(slug);
  return !!guide;
}

/**
 * Retrieve all saved offline pocket guides sorted by most recently saved
 */
export async function getAllOfflineGuides() {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_GUIDES, 'readonly');
    const store = tx.objectStore(STORE_GUIDES);
    const req = store.getAll();
    req.onsuccess = () => {
      const guides = req.result || [];
      guides.sort((a, b) => b.savedAt - a.savedAt);
      resolve(guides);
    };
    req.onerror = () => resolve([]);
  });
}

/**
 * Get device storage estimation via StorageManager API
 */
export async function getStorageMetrics() {
  const guides = await getAllOfflineGuides();
  const guideCount = guides.length;
  const guidesBytes = guides.reduce((sum, g) => sum + (g.sizeBytes || 0), 0);

  let quota = 0;
  let usage = 0;

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      quota = estimate.quota || 0;
      usage = estimate.usage || guidesBytes;
    } catch (_) {
      usage = guidesBytes;
    }
  } else {
    usage = guidesBytes;
  }

  return {
    guideCount,
    guidesBytes,
    guidesFormatted: formatBytes(guidesBytes),
    usageBytes: usage,
    quotaBytes: quota,
    usageFormatted: formatBytes(usage),
    quotaFormatted: quota ? formatBytes(quota) : 'Unknown',
    percentUsed: quota > 0 ? Math.min(100, Math.round((usage / quota) * 100)) : 0
  };
}

/**
 * Clear all offline stored guides and reset storage
 */
export async function clearAllOfflineData() {
  const db = await getDB();
  const guides = await getAllOfflineGuides();

  // Clear IndexedDB store
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GUIDES, 'readwrite');
    const store = tx.objectStore(STORE_GUIDES);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Clear Service Worker Caches
  if ('caches' in window) {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key.includes('media') || key.includes('data')) {
        await caches.delete(key);
      }
    }
  }

  window.dispatchEvent(new CustomEvent('exploredesh:offline-guides-changed', {
    detail: { action: 'cleared_all' }
  }));
}

/**
 * Retrieve the offline emergency toolkit data
 */
export async function getEmergencyToolkit() {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_EMERGENCY, 'readonly');
      const store = tx.objectStore(STORE_EMERGENCY);
      const req = store.get('toolkit');
      req.onsuccess = () => resolve((req.result && req.result.data) || EMERGENCY_TOOLKIT_DATA);
      req.onerror = () => resolve(EMERGENCY_TOOLKIT_DATA);
    });
  } catch (_) {
    return EMERGENCY_TOOLKIT_DATA;
  }
}

/**
 * Format bytes to human readable KB/MB
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  if (bytes < k) return bytes + ' B';
  if (bytes < k * k) return (bytes / k).toFixed(1) + ' KB';
  return (bytes / (k * k)).toFixed(1) + ' MB';
}
