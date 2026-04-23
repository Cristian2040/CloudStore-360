// Service Worker para modo offline
const CACHE_NAME = 'sistema-tienda-v10';
const DYNAMIC_CACHE_NAME = 'sistema-tienda-dynamic-v10';

// Archivos esenciales para cachear
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/inicio.html',
    '/dashboard.html',
    '/productos.html',
    '/ventas.html',
    '/gastos.html',
    '/reportes.html',
    '/clientes.html',
    '/css/styles.css',
    '/js/services/firebase.js',
    '/js/services/auth.js',
    '/js/services/products.js',
    '/js/services/sales.js',
    '/js/services/gastos.js',
    '/js/services/clientes.js',
    '/js/utils/helpers.js',
    '/js/utils/import-handler.js',
    '/js/pwa.js',
    '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando archivos estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => {
                console.error('[SW] Error al cachear archivos:', err);
            })
    );

    self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Eliminando cache antigua:', name);
                            return caches.delete(name);
                        })
                );
            })
    );

    return self.clients.claim();
});

// Interceptar peticiones (estrategia Stale-While-Revalidate para mayor velocidad)
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Ignorar peticiones no GET
    if (request.method !== 'GET') return;

    // Ignorar peticiones a Firebase o APIs externas para no guardarlas en cache estático
    if (request.url.includes('firebaseio.com') ||
        request.url.includes('googleapis.com') ||
        request.url.includes('gstatic.com') ||
        request.url.includes('firestore')) {
        return;
    }

    event.respondWith(
        caches.match(request).then(cachedResponse => {
            // Fetch network promise in the background
            const fetchPromise = fetch(request).then(networkResponse => {
                // If it's a valid response, update the cache
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Si falla la red (offline) y no hay cache
                if (!cachedResponse) {
                    if (request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline - Recurso no disponible', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                }
            });

            // Return cached response immediately if available, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});

// Sincronización en segundo plano (para futuras mejoras)
self.addEventListener('sync', (event) => {
    console.log('[SW] Sincronización en segundo plano');

    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

// Función de sincronización (placeholder)
function syncData() {
    console.log('[SW] Sincronizando datos...');
    return Promise.resolve();
}

// Notificaciones push (para futuras mejoras)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nueva notificación',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification('Sistema Tienda', options)
    );
});
