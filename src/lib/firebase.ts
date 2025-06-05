import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if no apps exist
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize messaging only if in browser and service worker is supported
export const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator
  ? getMessaging(app)
  : null;

export async function requestNotificationPermission() {
  try {
    if (!messaging) {
      console.warn('Messaging not supported in this environment');
      return null;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('Service worker registered:', registration);

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      console.log('FCM Token:', token);
      return token;
    }
    
    console.warn('Notification permission denied');
    return null;
  } catch (error) {
    console.error('Notification permission error:', error);
    return null;
  }
}

export function onMessageListener() {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('Received foreground message:', payload);
    
    if (Notification.permission === 'granted') {
      new Notification(payload.notification?.title || 'New Message', {
        body: payload.notification?.body,
        icon: '/notification-icon.png',
        badge: '/notification-badge.png',
        tag: 'sprint-notification',
        vibrate: [200, 100, 200],
        data: payload.data
      });
    }
  });
}