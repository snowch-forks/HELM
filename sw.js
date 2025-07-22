const CACHE_NAME = 'helm-v1';

// Install event - take control of the page
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('message', event => {
  if (event.data.type === 'START_CACHE') {
    event.waitUntil(
      fetch('file-list.json')
        .then(response => response.json())
        .then(files => {
          let totalFiles = files.length;
          let cachedFiles = 0;

          return caches.open(CACHE_NAME)
            .then(async (cache) => {
              console.log('Opened cache for manual caching');
              let delay = 250;
              for (const file of files) {
                let retries = 5;
                while (retries > 0) {
                  try {
                    await cache.add(file);
                    cachedFiles++;
                    self.clients.matchAll().then(clients => {
                      clients.forEach(client => {
                        client.postMessage({
                          type: 'CACHE_UPDATE',
                          cached: cachedFiles,
                          total: totalFiles
                        });
                      });
                    });
                    delay = 250; // Reset delay on success
                    break; // Success, exit retry loop
                  } catch (err) {
                    console.error(`Failed to cache ${file}, retries left: ${retries - 1}`, err);
                    retries--;
                    if (retries > 0) {
                      await new Promise(resolve => setTimeout(resolve, delay));
                      delay *= 2; // Exponential backoff
                    }
                  }
                }
              }
              console.log('All files from list cached');
              self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                  client.postMessage({
                    type: 'CACHE_COMPLETE',
                    total: files.length
                  });
                });
              });
            });
        })
        .catch(function(error) {
          console.log('Cache install failed:', error);
        })
    );
  }
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
