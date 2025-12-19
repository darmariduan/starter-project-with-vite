const CACHE_NAME = 'story-app-v1';
const BASE_PATH = '/starter-project-with-vite';

const urlsToCache = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/manifest.json`,
];

// Install
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching app shell');
            return cache.addAll(urlsToCache).catch((error) => {
                console.error('[SW] Cache addAll error:', error);
            });
        })
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch - Network First for API, Cache First for assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API requests - Network First
    if (url.origin === 'https://story-api.dicoding.dev') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone response untuk cache
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback ke cache jika offline
                    return caches.match(request).then((cached) => {
                        return cached || new Response('Offline', { status: 503 });
                    });
                })
        );
        return;
    }

    // Static assets - Cache First
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                return cached;
            }
            return fetch(request).then((response) => {
                // Cache response untuk next time
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            });
        })
    );
});

// Push Notification Handler
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');

    let data = { title: 'Story App', body: 'New notification' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || 'Ada cerita baru!',
        icon: `${BASE_PATH}/icons/icon-192x192.png`,
        badge: `${BASE_PATH}/icons/icon-72x72.png`,
        vibrate: [200, 100, 200],
        data: {
            url: data.url || `${BASE_PATH}/`,
        },
        actions: [
            {
                action: 'open',
                title: 'Lihat Cerita',
            },
            {
                action: 'close',
                title: 'Tutup',
            },
        ],
    };

    event.waitUntil(self.registration.showNotification(data.title || 'Story App', options));
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data?.url || `${BASE_PATH}/`;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Cek apakah sudah ada window terbuka
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jika belum, buka window baru
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Skip Waiting Message
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
