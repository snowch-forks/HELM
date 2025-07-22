const CACHE_NAME = 'helm-v1';

// Install event - cache essential resources
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    fetch('file-list.json')
      .then(response => response.json())
      .then(files => {
        return caches.open(CACHE_NAME)
          .then(function(cache) {
            console.log('Opened cache');
            return cache.addAll(files);
          });
      })
      .then(function() {
        console.log('All files from list cached');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.log('Cache install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Simple fetch handler
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Fetch from network
        return fetch(event.request).then(function(response) {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Cache the response for future use
          var responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(function() {
          // If both cache and network fail, return main page for documents
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// All caching is now done during the install phase, so these functions are no longer needed.
