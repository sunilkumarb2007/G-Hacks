// Service Worker for SafeGate 2.0 PWA

const CACHE_NAME = 'safegate-v2.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/firebase.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css'
];

// Install event
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Install');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                console.log('[ServiceWorker] Skip waiting on install');
                return self.skipWaiting();
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activate');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('[ServiceWorker] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('[ServiceWorker] Serving from cache:', event.request.url);
                    return response;
                }
                
                return fetch(event.request)
                    .then(response => {
                        // Don't cache if not a success response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                console.log('[ServiceWorker] Caching new resource:', event.request.url);
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.log('[ServiceWorker] Fetch failed:', error);
                        
                        // If request is for HTML, return offline page
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match(OFFLINE_URL);
                        }
                    });
            })
    );
});

// Background sync for offline emergencies
self.addEventListener('sync', event => {
    console.log('[ServiceWorker] Background sync:', event.tag);
    
    if (event.tag === 'sync-emergencies') {
        event.waitUntil(syncOfflineEmergencies());
    }
});

// Push notifications
self.addEventListener('push', event => {
    console.log('[ServiceWorker] Push received:', event);
    
    let data = {};
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body || 'New emergency alert from SafeGate',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
            emergencyId: data.emergencyId
        },
        actions: [
            {
                action: 'view',
                title: 'View Details'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'SafeGate Alert', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('[ServiceWorker] Notification click:', event);
    
    event.notification.close();
    
    if (event.action === 'view' && event.notification.data.emergencyId) {
        // Open emergency details
        event.waitUntil(
            clients.openWindow(`/?emergency=${event.notification.data.emergencyId}`)
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
    } else {
        // Default: open the app
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// Handle messages from the main app
self.addEventListener('message', event => {
    console.log('[ServiceWorker] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_EMERGENCY') {
        cacheEmergencyData(event.data.payload);
    }
});

// Helper functions
function syncOfflineEmergencies() {
    console.log('[ServiceWorker] Syncing offline emergencies...');
    // Implementation would sync with Firebase
    return Promise.resolve();
}

function cacheEmergencyData(emergencyData) {
    caches.open(CACHE_NAME)
        .then(cache => {
            const url = `/emergencies/${emergencyData.id}`;
            const response = new Response(JSON.stringify(emergencyData), {
                headers: { 'Content-Type': 'application/json' }
            });
            cache.put(url, response);
            console.log('[ServiceWorker] Cached emergency data:', emergencyData.id);
        });
}