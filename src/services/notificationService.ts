import { messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const VAPID_KEY = ''; // The user will need to provide this for real background push

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
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('Service worker not registered');
        return;
      }

      // In a real app, you'd use a VAPID key: getToken(m, { vapidKey: '...', serviceWorkerRegistration: registration })
      // For now, we'll try to get the token without it or just handle local notifications
      try {
        const token = await getToken(m, {
          serviceWorkerRegistration: registration
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
  onMessageListener() {
    return messaging().then(m => {
      if (!m) return null;
      return new Promise((resolve) => {
        onMessage(m, (payload) => {
          console.log('Foreground message received:', payload);
          resolve(payload);
        });
      });
    });
  },

  async sendBroadcastNotification(title: string, body: string, link?: string) {
    // In our simplified system, we write a "broadcast" document
    // Clients listen to this collection and show local notifications
    await addDoc(collection(db, 'broadcasts'), {
      title,
      body,
      link: link || '/',
      createdAt: serverTimestamp(),
      sentBy: auth.currentUser?.uid
    });
  }
};
