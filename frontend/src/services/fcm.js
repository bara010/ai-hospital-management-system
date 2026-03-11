import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { authApi } from './hospitoApi';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let initialized = false;

function isConfigComplete() {
  return Object.values(firebaseConfig).every((v) => Boolean(v));
}

async function registerMessagingServiceWorker(config) {
  const workerScript = `
    importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');
    firebase.initializeApp(${JSON.stringify(config)});
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title = payload?.data?.title || 'HOSPITO Notification';
      const body = payload?.data?.body || '';
      self.registration.showNotification(title, { body });
    });
  `;

  const blob = new Blob([workerScript], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const registration = await navigator.serviceWorker.register(url);
  URL.revokeObjectURL(url);
  return registration;
}

export async function registerFcmTokenIfPossible() {
  if (initialized || !isConfigComplete() || !('Notification' in window)) return;

  const supported = await isSupported().catch(() => false);
  if (!supported) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    const swRegistration = await registerMessagingServiceWorker(firebaseConfig);

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      await authApi.setFcmToken(token);
      initialized = true;
    }
  } catch {
    // Notification token registration is optional.
  }
}
