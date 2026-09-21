/**
 * sw.js — High-Performance Service Worker for ExploreDesh Go
 * 
 * Capabilities:
 * - Ultra-fast App Shell pre-caching for instant zero-latency loads
 * - Stale-While-Revalidate for CSS, JS, fonts, and icons
 * - Network-First with Cache-Fallback for live APIs & dynamic JSON
 * - Cache-First for saved Pocket Guide photography & media assets
 * - Graceful offline navigation fallback for remote Himalayan & safari zones
 * - Zero external dependencies, pure W3C Service Worker API
 */

const VERSION = 'v1.0.4';
const CACHE_SHELL = `exploredesh-shell-${VERSION}`;
const CACHE_MEDIA = `exploredesh-media-${VERSION}`;
const CACHE_DATA = `exploredesh-data-${VERSION}`;

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/destinations.html',
  '/destination.html',
  '/ai-finder.html',
  '/about.html',
  '/contact.html',
  '/css/styles.css',
  '/css/tailwind.css',
  '/css/glass-immersive.css',
  '/css/destination-immersive.css',
  '/css/explore-immersive.css',
  '/js/data/api.js',
  '/js/data/taxonomy.js',
  '/js/components/icons.js',
  '/js/components/layout.js',
  '/js/components/destinationCard.js',
  '/js/components/seo.js',
  '/js/components/googleMapEmbed.js',
  '/js/components/indiaMap.js',
  '/js/components/offlineHub.js',
  '/js/utils/format.js',
  '/js/utils/theme.js',
  '/js/utils/search.js',
  '/js/utils/offlineStorage.js',
  '/js/pages/home.js',
  '/js/pages/explore.js',
  '/js/pages/destination.js',
  '/js/pages/finder.js',
  '/js/pages/company.js',
  '/images/favicon.svg',
  '/images/pwa-icon.svg',
  '/images/pwa-icon-192.png',
  '/images/pwa-icon-512.png',
  '/fonts/caveat-latin.woff2',
  '/manifest.webmanifest',
  '/data/destinations/index.json',
];

// Fallback 1x1 transparent PNG for uncached images when offline
const EMPTY_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82
]);

// ─── INSTALL EVENT ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      // Use individual puts so a single missing optional asset doesn't abort the entire install
      return Promise.allSettled(
        APP_SHELL_URLS.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch((err) => {
              console.warn('[SW] Pre-cache skip for:', url, err.message);
            })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE EVENT ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const allowedCaches = new Set([CACHE_SHELL, CACHE_MEDIA, CACHE_DATA]);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!allowedCaches.has(key)) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH EVENT ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and external analytics/submission APIs
  if (req.method !== 'GET') return;
  if (url.origin === 'https://api.web3forms.com') return;

  // 1. Navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const copy = networkRes.clone();
            caches.open(CACHE_SHELL).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(async () => {
          // Check for exact cached match
          const cached = await caches.match(req);
          if (cached) return cached;

          // For destination page with query params (/destination.html?slug=...)
          if (url.pathname.includes('destination')) {
            const destShell = await caches.match('/destination.html');
            if (destShell) return destShell;
          }

          // Fallback to home page or root shell
          const rootShell = await caches.match('/');
          if (rootShell) return rootShell;

          return new Response('Offline — Please check your saved ExploreDesh Go pocket guides.', {
            status: 503,
            statusText: 'Service Unavailable (Offline)',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. Images (Hero images, place photos, thumbnails)
  if (req.destination === 'image' || /\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req)
          .then((networkRes) => {
            // Cache same-origin local assets
            if (networkRes && (networkRes.ok || networkRes.type === 'opaque')) {
              if (url.origin === self.location.origin) {
                const copy = networkRes.clone();
                caches.open(CACHE_MEDIA).then((cache) => {
                  cache.put(req, copy).catch(() => {});
                });
              }
            }
            return networkRes;
          })
          .catch((fetchErr) => {
            // Only return 1x1 transparent PNG when genuinely offline and no cache is available
            if (!self.navigator.onLine) {
              return new Response(EMPTY_PNG, {
                headers: { 'Content-Type': 'image/png' }
              });
            }
            // Allow error to propagate when online so browser/onerror fallbacks trigger properly
            throw fetchErr;
          });
      })
    );
    return;
  }

  // 3. Dynamic Destination JSON Data (`data/destinations/*.json`)
  if (url.pathname.startsWith('/data/') || url.pathname.includes('/data/')) {
    event.respondWith(
      caches.open(CACHE_DATA).then(async (cache) => {
        try {
          const networkRes = await fetch(req);
          if (networkRes && networkRes.ok) {
            cache.put(req, networkRes.clone());
            return networkRes;
          }
        } catch (_) {
          // Network failed (offline)
        }

        const cached = await cache.match(req);
        if (cached) return cached;

        // Check in shell cache as secondary fallback
        const shellCached = await caches.match(req);
        if (shellCached) return shellCached;

        return new Response(JSON.stringify({ error: 'offline', message: 'Data not cached for offline access' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      })
    );
    return;
  }

  // 4. Static assets (CSS, JS, Fonts, SVGs, Manifest): True Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok) {
            const copy = networkRes.clone();
            caches.open(CACHE_SHELL).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(() => cached);

      // If cached, return immediately while revalidating in background
      if (cached) {
        fetchPromise.catch(() => {});
        return cached;
      }
      return fetchPromise;
    })
  );
});

// ─── MESSAGE EVENT (Pocket Guide Pre-caching & Management) ──
self.addEventListener('message', (event) => {
  const { action, payload } = event.data || {};

  if (action === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Pre-cache an entire destination bundle (JSON + hero + place photos)
  if (action === 'CACHE_POCKET_GUIDE' && payload) {
    const { slug, jsonUrl, imageUrls } = payload;
    event.waitUntil(
      (async () => {
        const dataCache = await caches.open(CACHE_DATA);
        const mediaCache = await caches.open(CACHE_MEDIA);

        // 1. Cache JSON data
        if (jsonUrl) {
          try {
            const jsonRes = await fetch(jsonUrl);
            if (jsonRes.ok) await dataCache.put(jsonUrl, jsonRes);
          } catch (e) {
            console.warn('[SW] Failed to cache JSON for:', slug, e);
          }
        }

        // 2. Cache Images
        if (Array.isArray(imageUrls)) {
          await Promise.allSettled(
            imageUrls.map(async (rawImg) => {
              const imgUrl = typeof rawImg === 'string' ? rawImg : (rawImg && rawImg.src);
              if (!imgUrl || typeof imgUrl !== 'string') return;
              try {
                // If not already cached
                const match = await mediaCache.match(imgUrl);
                if (!match) {
                  const imgRes = await fetch(imgUrl, { mode: 'no-cors' });
                  if (imgRes) await mediaCache.put(imgUrl, imgRes);
                }
              } catch (_) {}
            })
          );
        }

        // Notify client that download is completed
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            action: 'POCKET_GUIDE_CACHED',
            slug,
            success: true
          });
        });
      })()
    );
  }

  // Evict cached media when user deletes an offline guide
  if (action === 'EVICT_POCKET_GUIDE' && payload) {
    const { jsonUrl, imageUrls } = payload;
    event.waitUntil(
      (async () => {
        const dataCache = await caches.open(CACHE_DATA);
        const mediaCache = await caches.open(CACHE_MEDIA);

        if (jsonUrl) await dataCache.delete(jsonUrl);
        if (Array.isArray(imageUrls)) {
          await Promise.all(imageUrls.map((url) => mediaCache.delete(url)));
        }
      })()
    );
  }
});
