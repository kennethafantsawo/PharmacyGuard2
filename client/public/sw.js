const CACHE_NAME = 'pharmacies-garde-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Return offline page or cached content when network fails
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for weekly updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'weekly-update') {
    event.waitUntil(updatePharmacyData());
  }
});

// Periodic background sync (requires registration from main thread)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'pharmacy-weekly-sync') {
    event.waitUntil(updatePharmacyData());
  }
});

async function updatePharmacyData() {
  try {
    console.log('Service Worker: Updating pharmacy data...');
    
    const response = await fetch('/api/pharmacies/current-week');
    if (response.ok) {
      const data = await response.json();
      
      // Store in cache for offline access
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/api/pharmacies/current-week', new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      }));
      
      console.log('Service Worker: Pharmacy data updated successfully');
      
      // Notify all clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PHARMACY_DATA_UPDATED',
          data: data,
          timestamp: new Date().toISOString()
        });
      });
    }
  } catch (error) {
    console.error('Service Worker: Error updating pharmacy data:', error);
  }
}

// Handle real-time sync messages from server
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    console.log('Service Worker: Received force update request');
    updatePharmacyData();
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelles pharmacies de garde disponibles',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Voir les pharmacies',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Pharmacies de Garde', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});
