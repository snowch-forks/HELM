const CACHE_NAME = 'helm-v1';

// Install event - take control of the page
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'START_CACHE') {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedRequests = await cache.keys();
        const cachedUrls = new Set(cachedRequests.map(req => req.url));

        const response = await fetch('file-list.json');
        const allFiles = await response.json();
        const totalFiles = allFiles.length;

        const filesToCache = allFiles.filter(file => {
          const fileUrl = new URL(file, self.location.href).href;
          return !cachedUrls.has(fileUrl);
        });

        let newlyCachedFiles = 0;
        const alreadyCachedCount = totalFiles - filesToCache.length;

        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'CACHE_UPDATE',
                    cached: alreadyCachedCount,
                    total: totalFiles
                });
            });
        });

        console.log(`Resuming cache. Already cached: ${alreadyCachedCount}, To cache: ${filesToCache.length}`);

        for (const file of filesToCache) {
          let retries = 10;
          let delay = 500;
          while (retries > 0) {
            const request = new Request(file, { cache: 'reload' });
            try {
              const response = await fetch(request);
              if (response.ok) {
                await cache.put(request, response);
                newlyCachedFiles++;
                self.clients.matchAll().then(clients => {
                  clients.forEach(client => {
                    client.postMessage({
                      type: 'CACHE_UPDATE',
                      cached: alreadyCachedCount + newlyCachedFiles,
                      total: totalFiles
                    });
                  });
                });
                break; // Success
              } else {
                throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
              }
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
              total: totalFiles
            });
          });
        });
      } catch (error) {
        console.log('Cache install failed:', error);
      }
    })());
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
