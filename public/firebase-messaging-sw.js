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
  apiKey: "REPLACED_BY_CONFIG",
  authDomain: "REPLACED_BY_CONFIG",
  projectId: "REPLACED_BY_CONFIG",
  storageBucket: "REPLACED_BY_CONFIG",
  messagingSenderId: "REPLACED_BY_CONFIG",
  appId: "REPLACED_BY_CONFIG"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
