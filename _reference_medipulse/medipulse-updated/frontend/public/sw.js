/* MediPulse Service Worker - Push Notifications */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle push events from server (Web Push API)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🏥 MediPulse';
  const options = {
    body: data.message || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.type || 'medipulse',
    requireInteraction: data.type === 'MOOD_CHECK' || data.type === 'LAB_ALERT',
    data: {
      type: data.type,
      url: data.url || '/notifications',
    },
    actions: data.type === 'MOOD_CHECK' ? [
      { action: 'mood', title: '😊 Rate Mood' },
      { action: 'dismiss', title: 'Dismiss' },
    ] : [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const type = event.notification.data?.type;

  let url = '/notifications';
  if (action === 'mood' || type === 'MOOD_CHECK') url = '/mood';
  else if (action === 'view') url = '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Handle notification close (dismissed by user)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed:', event.notification.tag);
});
