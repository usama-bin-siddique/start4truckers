import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { router } from '@inertiajs/react';

const firebaseConfig = {
    apiKey: 'AIzaSyCvSuQW45HusQuMnM7Ked7Z14yh4Q-oZqg',
    authDomain: 'portalstart4truckers.firebaseapp.com',
    projectId: 'portalstart4truckers',
    storageBucket: 'portalstart4truckers.firebasestorage.app',
    messagingSenderId: '723744372773',
    appId: '1:723744372773:web:699ac1fd2afc198cc4e7cc',
};

let started = false;

export async function registerFirebaseMessaging(vapidKey: string | null | undefined): Promise<void> {
    if (started || !vapidKey || !('Notification' in window) || !('serviceWorker' in navigator)) {
        return;
    }

    if (!await isSupported()) {
        return;
    }

    started = true;

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        return;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(initializeApp(firebaseConfig));

    onMessage(messaging, (payload) => {
        const title = payload.notification?.title || 'Start4Truckers';
        const body = payload.notification?.body || 'You have a new notification.';
        const url = payload.data?.url || payload.fcmOptions?.link;

        new Notification(title, { body, icon: '/images/logo.png', data: { url } });
        router.reload({ only: ['auth'] });
    });

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

    if (!token) {
        return;
    }

    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

    await fetch('/notifications/device-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrf,
            Accept: 'application/json',
        },
        body: JSON.stringify({ token }),
    });
}
