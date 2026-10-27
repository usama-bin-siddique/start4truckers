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

export async function requestAndRegisterToken(vapidKey: string | null | undefined): Promise<{ ok: boolean; message: string }> {
    if (!('Notification' in window)) {
        return { ok: false, message: 'This browser does not support desktop notifications.' };
    }
    if (!('serviceWorker' in navigator)) {
        return { ok: false, message: 'Service workers are not supported or page is not served over HTTPS/localhost.' };
    }
    if (!vapidKey) {
        return { ok: false, message: 'Firebase VAPID key is missing in application settings.' };
    }

    try {
        const supported = await isSupported();
        if (!supported) {
            return { ok: false, message: 'Firebase messaging is not supported in this browser context.' };
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { ok: false, message: `Notification permission was ${permission}. Please allow notifications in site settings.` };
        }

        console.log('[FCM-Client] Registering service worker and setting up listener...');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[FCM-Client] Service Worker registered:', registration);

        const messaging = getMessaging(initializeApp(firebaseConfig));

        onMessage(messaging, (payload) => {
            console.log('[FCM-Client] Foreground message received:', payload);
            const title = payload.notification?.title || 'Start4Truckers';
            const body = payload.notification?.body || 'You have a new notification.';
            const url = payload.data?.url || payload.fcmOptions?.link;

            if (Notification.permission === 'granted') {
                try {
                    new Notification(title, { body, icon: '/images/logo.png', data: { url } });
                    console.log('[FCM-Client] Foreground Notification constructor called successfully');
                } catch (e) {
                    console.warn('[FCM-Client] Could not call new Notification(), using ServiceWorker showNotification:', e);
                    registration.showNotification(title, { body, icon: '/images/logo.png', data: { url } });
                }
            }

            router.reload({ only: ['auth'] });
        });

        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
        if (!token) {
            return { ok: false, message: 'Could not generate FCM device token.' };
        }

        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        const res = await fetch('/notifications/device-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrf,
                Accept: 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        if (!res.ok) {
            return { ok: false, message: 'Failed to save token to server.' };
        }

        return { ok: true, message: 'Desktop notifications enabled and device token registered successfully!' };
    } catch (err: any) {
        return { ok: false, message: err?.message || 'Error initializing Firebase notifications.' };
    }
}

export async function registerFirebaseMessaging(vapidKey: string | null | undefined): Promise<void> {
    if (!vapidKey || !('Notification' in window) || !('serviceWorker' in navigator)) {
        return;
    }

    if (Notification.permission !== 'granted') {
        return;
    }

    if (started) {
        return;
    }

    started = true;
    console.log('[FCM-Client] Auto-registering messaging since permission is granted');
    await requestAndRegisterToken(vapidKey);
}
