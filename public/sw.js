// Minimal service worker that immediately unregisters itself
// This prevents 404 errors while ensuring no caching occurs

self.addEventListener('install', function(event) {
  // Skip waiting and activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // Clear all caches and unregister
  event.waitUntil(
    Promise.all([
      // Clear all caches
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      }),
      // Unregister this service worker
      self.registration.unregister(),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Don't cache anything
self.addEventListener('fetch', function(event) {
  // Let all requests go through to the network
  return;
});