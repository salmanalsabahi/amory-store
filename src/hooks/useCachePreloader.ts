import { useEffect } from 'react';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { db } from '../firebase';

export function useCachePreloader() {
  useEffect(() => {
    const collectionsToPreload = [
      'products',
      'categories',
      'packages',
      'offers',
      'articles',
      'services',
      'site_settings',
      'orders',
      'messages',
      'users',
      'reviews',
      'coupons',
      'consultations',
      'offer_bookings',
      'password_resets',
      'banners'
    ];

    const unsubscribers = collectionsToPreload.map(collectionName => {
      // WARM UP the cache with a basic query
      // For large collections, you might want to use limit() if you only want the first few
      const q = query(collection(db, collectionName));
      return onSnapshot(q, () => {
        // We don't need to do anything with the data, 
        // the Firebase SDK will automatically persist it to IndexedDB.
      }, (error) => {
        // Silently ignore errors (e.g. offline) during background cache warmup
        if (!error.message.includes('offline') && error.code !== 'unavailable') {
          console.warn(`Cache warmup error for ${collectionName}:`, error);
        }
      });
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);
}
