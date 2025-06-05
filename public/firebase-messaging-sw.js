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

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/notification-icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});