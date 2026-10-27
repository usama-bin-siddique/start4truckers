importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js');
importScripts('/firebase-config.js');

firebase.initializeApp(self.firebaseConfig);

const messaging = firebase.messaging();

console.log('[FCM-SW] Service worker script loaded');

messaging.onBackgroundMessage((payload) => {
    console.log('[FCM-SW] Received background message:', payload);
    const title = payload.notification?.title || 'Start4Truckers';
    const options = {
        body: payload.notification?.body || 'You have a new notification.',
        icon: '/images/logo.png',
        data: { url: payload.data?.url || payload.fcmOptions?.link || '/notifications' },
    };

    self.registration.showNotification(title, options);
});

self.addEventListener('push', (event) => {
    console.log('[FCM-SW] Raw Push event received:', event);
    if (!event.data) return;
    try {
        const data = event.data.json();
        console.log('[FCM-SW] Push event data (JSON):', data);
        const title = data.notification?.title || data.data?.title || 'Start4Truckers';
        const body = data.notification?.body || data.data?.body || 'You have a new notification.';
        const targetUrl = data.data?.url || data.fcmOptions?.link || '/notifications';

        event.waitUntil(
            self.registration.showNotification(title, {
                body,
                icon: '/images/logo.png',
                data: { url: targetUrl },
            })
        );
    } catch (e) {
        console.error('[FCM-SW] Error handling raw push event:', e);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = event.notification.data?.url || '/notifications';

    event.waitUntil(clients.openWindow(target));
});
