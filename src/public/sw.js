/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'story-app-v1';
const API_CACHE = 'story-app-api-v1';
const IMAGE_CACHE = 'story-app-images-v1';

const urlsToCache = [
    '/',
    '/index.html',
    '/scripts/index.js',
    '/styles/styles.css',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME &&
                        cacheName !== API_CACHE &&
                        cacheName !== IMAGE_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - Network First for API, Cache First for images, Stale While Revalidate for static
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API requests - Network First with cache fallback
    if (url.origin === 'https://story-api.dicoding.dev') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone response before caching
                    const responseToCache = response.clone();

                    caches.open(API_CACHE).then((cache) => {
                        cache.put(request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // If network fails, try cache
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Return offline page for API requests if no cache
                            return new Response(
                                JSON.stringify({ error: true, message: 'Offline - No cached data available' }),
                                { headers: { 'Content-Type': 'application/json' } }
                            );
                        });
                })
        );
        return;
    }

    // Image requests - Cache First
    if (request.destination === 'image') {
        event.respondWith(
            caches.open(IMAGE_CACHE).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(request).then((response) => {
                        cache.put(request, response.clone());
                        return response;
                    });
                });
            })
        );
        return;
    }

    // Static assets - Stale While Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse.clone());
                });
                return networkResponse;
            });

            return cachedResponse || fetchPromise;
        })
    );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
    console.log('Push notification received', event);

    let notificationData = {
        title: 'Story App',
        body: 'You have a new story!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: {
            url: '/',
        },
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || 'New Story Added!',
                body: data.body || data.message || 'Check out the latest story',
                icon: data.icon || '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                image: data.image || null,
                data: {
                    url: data.url || '/',
                    storyId: data.storyId || null,
                },
                actions: [
                    {
                        action: 'view',
                        title: 'View Story',
                        icon: '/icons/view-icon.png',
                    },
                    {
                        action: 'close',
                        title: 'Close',
                        icon: '/icons/close-icon.png',
                    },
                ],
            };
        } catch (error) {
            console.error('Error parsing push data:', error);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            image: notificationData.image,
            data: notificationData.data,
            actions: notificationData.actions,
            vibrate: [200, 100, 200],
            tag: 'story-notification',
            requireInteraction: false,
        })
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked', event);

    event.notification.close();

    if (event.action === 'view') {
        const urlToOpen = event.notification.data.url || '/';

        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    // Check if there's already a window open
                    for (let i = 0; i < clientList.length; i++) {
                        const client = clientList[i];
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Open new window if none exists
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open app
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// Background sync event - sync offline data
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered', event.tag);

    if (event.tag === 'sync-stories') {
        event.waitUntil(syncPendingStories());
    }
});

async function syncPendingStories() {
    try {
        // This will be handled by the app's database helper
        console.log('Syncing pending stories...');

        // Send message to all clients to trigger sync
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'SYNC_PENDING_STORIES',
            });
        });
    } catch (error) {
        console.error('Error syncing pending stories:', error);
    }
}

// Message event - communicate with app
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Service Worker loaded');
