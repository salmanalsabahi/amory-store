// Give the service worker access to Firebase Messaging.
// Note: These scripts are imported in the browser. 
// You can use the Firebase SDK version that matches your app.
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// You can find your project's config object in your Firebase project settings.
// I'll leave a placeholder here - in a real app, you would inject the actual config.
firebase.initializeApp({
  apiKey: "AIzaSyBY16h-n9iwGAfcCeRnGLfV4mdY2o9716o",
  authDomain: "my-salman-429814.firebaseapp.com",
  projectId: "my-salman-429814",
  storageBucket: "my-salman-429814.firebasestorage.app",
  messagingSenderId: "461464342248",
  appId: "1:461464342248:web:43b678d5f3db30c507435d"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'عموري للتجميل - إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || 'لديك تحديث جديد من متجر عموري.',
    icon: '/logo.png', // The app icon for the notification
    badge: '/logo.png', // Small icon for notification tray
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
