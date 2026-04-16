// Raycontrol Staff Hub — Service Worker
// Cache version: bump this string to force a cache refresh after updates
const CACHE_NAME = 'raycontrol-v1';

// Core shell files to cache on install (app pages + assets)
const SHELL_URLS = [
  '/Raycontrol/',
  '/Raycontrol/index.html',
  '/Raycontrol/jobs.html',
  '/Raycontrol/vendor-invoices.html',
  '/Raycontrol/contacts.html',
  '/Raycontrol/stocktaking.html',
  '/Raycontrol/clock.html',
  '/Raycontrol/planner.html',
  '/Raycontrol/petty-cash-manager.html',
  '/Raycontrol/mgr-7560e738/index.html',
  '/Raycontrol/mgr-7560e738/jobs-manager.html',
  '/Raycontrol/mgr-7560e738/vendor-invoices-manager.html',
  '/Raycontrol/icons/icon-192.png',
  '/Raycontrol/icons/icon-512.png'
];

// ── Install: pre-cache the shell ──────────────────────────────────────────
self.addEventListener('install', function(event) {
  self.skipWaiting(); // activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // addAll fails silently if some pages don't exist yet — use individual adds
      return Promise.allSettled(
        SHELL_URLS.map(function(url) {
          return cache.add(url).catch(function() {
            console.warn('[SW] Could not cache:', url);
          });
        })
      );
    })
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch: network-first for Firebase/API, cache-first for shell ──────────
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Always go to network for Firebase, Google APIs, external resources,
  // and the manager hub (which has its own service worker)
  if (
    url.includes('firebaseapp.com') ||
    url.includes('firebasedatabase.app') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('frankfurter.app') ||
    url.includes('chrome-extension') ||
    url.includes('/mgr-7560e738/')
  ) {
    return; // let browser handle normally
  }

  // For same-origin HTML/JS files: network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        // Clone and cache the fresh response
        if (networkResponse && networkResponse.status === 200) {
          var clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      })
      .catch(function() {
        // Network failed — serve from cache
        return caches.match(event.request).then(function(cached) {
          return cached || new Response(
            '<h2 style="font-family:sans-serif;padding:2rem;color:#555">You are offline. Please connect to the internet to use Raycontrol.</h2>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
  );
});
