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

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = event.notification.data?.url || '/notifications';

    event.waitUntil(clients.openWindow(target));
});
