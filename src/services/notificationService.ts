import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || ''; // The user will need to provide this via .env for real background push

export const notificationService = {
  async requestPermission() {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        await this.subscribeToPush();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permission', error);
      return false;
    }
  },

  async subscribeToPush() {
    try {
      const m = await messaging();
      if (!m) return;

      // Register service worker if not registered
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('Service worker not registered, attempting to register...');
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }

      // VAPID key is required for FCM Web Push. If the user hasn't provided one, 
      // standard background push won't work, but we still save the token for future potential use.
      try {
        const token = await getToken(m, {
          serviceWorkerRegistration: registration,
          vapidKey: VAPID_KEY || undefined
        });

        if (token) {
          console.log('FCM Token:', token);
          await this.saveTokenToFirestore(token);
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } catch (err) {
        console.log('Error getting token (probably missing VAPID key):', err);
      }
    } catch (error) {
      console.error('Error subscribing to push', error);
    }
  },

  async saveTokenToFirestore(token: string) {
    const userId = auth.currentUser?.uid || 'anonymous';
    const tokenRef = doc(db, 'fcm_tokens', token);
    await setDoc(tokenRef, {
      token,
      userId,
      deviceType: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      updatedAt: serverTimestamp()
    });
  },

  // This handles foreground messages
  onMessageListener(callback: (payload: any) => void) {
    messaging().then(m => {
      if (!m) return;
      onMessage(m, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
      });
    });
  },

  async sendBroadcastNotification(title: string, body: string, link?: string) {
    // 1. Write to firestore (so active users see it immediately via useBackgroundNotifications)
    await addDoc(collection(db, 'broadcasts'), {
      title,
      body,
      link: link || '/',
      createdAt: serverTimestamp(),
      sentBy: auth.currentUser?.uid
    });

    // 2. Trigger FCM API to wake up background/offline devices
    try {
      const response = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          link: link || '/',
          type: 'broadcast'
        })
      });
      const data = await response.json();
      console.log('FCM Dispatch result:', data);
    } catch (err) {
      console.warn('Could not dispatch FCM notification:', err);
    }
  }
};
