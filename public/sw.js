/* LoveChat Service Worker */
const CACHE_NAME = 'lovechat-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Handle incoming push notifications from server
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: 'LoveChat', body: event.data.text(), icon: '/icon-192.png' };
    }

    const options = {
        body: data.body || 'Pesan baru',
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: [
            { action: 'open', title: 'Buka' },
            { action: 'dismiss', title: 'Abaikan' }
        ],
        renotify: true,
        tag: data.tag || 'lovechat-message',
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'LoveChat 💕', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Focus existing window if open
            for (const client of windowClients) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Background sync (for offline message queueing)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-messages') {
        // Placeholder for future offline message sync
        console.log('[SW] Background sync triggered');
    }
});
