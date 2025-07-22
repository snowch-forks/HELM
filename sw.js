const CACHE_NAME = 'helm-v1';

// Install event - take control of the page
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(self.skipWaiting());
});

const CHUNK_SIZE = 50;

let cachingInProgress = {};
let allFiles = [];
let cacheInterval;

async function cacheFiles(data) {
    const { files, startIndex } = data;
    if (cachingInProgress[startIndex]) {
        return;
    }
    cachingInProgress[startIndex] = true;

    const cache = await caches.open(CACHE_NAME);
    const totalFiles = files.length;

    const endIndex = Math.min(startIndex + CHUNK_SIZE, totalFiles);
    const chunk = files.slice(startIndex, endIndex);

    for (const file of chunk) {
        let retries = 3;
        let delay = 1000;
        while (retries > 0) {
            const request = new Request(file, { cache: 'reload' });
            try {
                const response = await fetch(request);
                if (response.ok) {
                    await cache.put(request, response);
                    break; // Success
                }
                throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
            } catch (err) {
                console.error(`Failed to cache ${file}, retries left: ${retries - 1}`, err);
                retries--;
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                }
            }
        }
    }
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'CHUNK_CACHED',
            cached: endIndex,
            total: totalFiles,
            nextIndex: endIndex
        });
    });

    delete cachingInProgress[startIndex];

    if (endIndex < totalFiles) {
        cacheFiles({ files, startIndex: endIndex });
    } else {
        clearInterval(cacheInterval);
        cacheInterval = null;
    }
}

function monitorDownloads(files) {
    let lastCachedCount = -1;
    let checks = 0;
    allFiles = files;

    if (cacheInterval) {
        return;
    }

    cacheInterval = setInterval(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedRequests = await cache.keys();
        const cachedUrls = new Set(cachedRequests.map(req => new URL(req.url).href));
        const cachedCount = allFiles.filter(file => cachedUrls.has(new URL(file, self.location.origin).href)).length;

        if (cachedCount === allFiles.length) {
            clearInterval(cacheInterval);
            cacheInterval = null;
            return;
        }

        if (cachedCount === lastCachedCount) {
            checks++;
            if (checks >= 3) { // If no progress after 3 checks (30 seconds)
                console.log('Download stalled, restarting...');
                const filesToCache = allFiles.filter(file => !cachedUrls.has(new URL(file, self.location.origin).href));
                cacheFiles({ files: filesToCache, startIndex: 0 });
                checks = 0; // Reset checks
            }
        } else {
            lastCachedCount = cachedCount;
            checks = 0; // Reset checks on progress
        }
    }, 10000); // Check every 10 seconds
}

self.addEventListener('message', (event) => {
    if (event.data.type === 'START_CACHE') {
        event.waitUntil(cacheFiles(event.data));
        if (!cacheInterval) {
            monitorDownloads(event.data.files);
        }
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
