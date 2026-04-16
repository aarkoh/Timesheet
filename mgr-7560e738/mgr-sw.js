// Raycontrol Manager Hub — Service Worker
const CACHE_NAME = 'raycontrol-mgr-v1';

const SHELL_URLS = [
  '/Raycontrol/mgr-7560e738/',
  '/Raycontrol/mgr-7560e738/index.html',
  '/Raycontrol/mgr-7560e738/jobs-manager.html',
  '/Raycontrol/mgr-7560e738/vendor-invoices-manager.html',
  '/Raycontrol/mgr-7560e738/petty-cash-manager.html',
  '/Raycontrol/mgr-7560e738/clock-manager.html',
  '/Raycontrol/mgr-7560e738/stock-manager.html',
  '/Raycontrol/icons/icon-mgr-192.png',
  '/Raycontrol/icons/icon-mgr-512.png'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        SHELL_URLS.map(function(url) {
          return cache.add(url).catch(function() {
            console.warn('[MGR SW] Could not cache:', url);
          });
        })
      );
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var url = event.request.url;
  if (
    url.includes('firebaseapp.com') ||
    url.includes('firebasedatabase.app') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('frankfurter.app') ||
    url.includes('chrome-extension')
  ) { return; }

  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        }
        return networkResponse;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || new Response(
            '<h2 style="font-family:sans-serif;padding:2rem;color:#555">You are offline.</h2>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
  );
});
