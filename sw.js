const CACHE_NAME = 'twd-eur-v1.3.1'; // Changer ce numéro à chaque déploiement
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation du service worker
self.addEventListener('install', event => {
  // Force le nouveau service worker à devenir actif immédiatement
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Supprime TOUS les anciens caches
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prend immédiatement le contrôle de toutes les pages
      return self.clients.claim();
    })
  );
});

// Stratégie: Cache First (offline-first) pour une vraie PWA
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si on trouve dans le cache, on le retourne immédiatement
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Sinon on fait la requête réseau
        return fetch(event.request)
          .then(response => {
            // Ne pas mettre en cache les requêtes non-GET ou les erreurs
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // Clone la réponse car elle ne peut être utilisée qu'une fois
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Si le réseau échoue, retourne une réponse vide
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
