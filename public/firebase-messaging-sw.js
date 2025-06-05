// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCLo3o8mNLaMLaIQwUfwetrvRpYyT6xWCY',
  authDomain: 'author-sprint.firebaseapp.com',
  projectId: 'author-sprint',
  storageBucket: 'author-sprint.firebasestorage.app',
  messagingSenderId: '418943351906',
  appId: '1:418943351906:web:9f85fe743552c68aeda53b',
  measurementId: 'G-8T1VVXSH7V'
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationOptions = {
    body: payload.notification.body,
    icon: '/notification-icon.png',
    badge: '/notification-badge.png',
    tag: 'sprint-notification',
    vibrate: [200, 100, 200],
    data: payload.data
  };

  return self.registration.showNotification(
    payload.notification.title,
    notificationOptions
  );
});