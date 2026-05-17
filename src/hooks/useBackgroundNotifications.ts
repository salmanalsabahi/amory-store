import { useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { showNativeNotification } from '../lib/notifications';

export const useBackgroundNotifications = () => {
    useEffect(() => {
        // Get seen notifications once at the start of the effect
        const initialSeen = JSON.parse(localStorage.getItem('seen_notifications') || '[]');
        const seenNotifications = new Set<string>(initialSeen);

        // Listen for broad marketing broadcasts from the last 7 days
        const broadQuery = query(
            collection(db, 'broadcasts'),
            where('createdAt', '>', new Date(Date.now() - 1000 * 60 * 60 * 24 * 7))
        );

        const unsubscribeBroadcasts = onSnapshot(broadQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const broadcastId = change.doc.id;
                    
                    // Logic: Must not have been seen before (persistent)
                    if (!seenNotifications.has(broadcastId)) {
                        seenNotifications.add(broadcastId);
                        localStorage.setItem('seen_notifications', JSON.stringify(Array.from(seenNotifications).slice(-100)));

                        showNativeNotification(data.title, {
                            body: data.body,
                            icon: '/logo.png',
                            data: { url: data.link || '/' }
                        });
                    }
                }
            });
        });

        // Listen for user-specific stock notifications
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            if (!user) return; // If logged out, don't query user specific notifications

            const stockQuery = query(
                collection(db, 'stock_notifications'),
                where('userId', '==', user.uid),
                where('status', '==', 'ready')
            );

            const unsubscribeStock = onSnapshot(stockQuery, (snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        const notifId = change.doc.id;
                        
                        // Only show if it's recent (less than 10 mins old)
                        const createdAt = data.createdAt?.toMillis() || Date.now();
                        const isRelevant = (Date.now() - createdAt) < 600000; // 10 minutes

                        if (!seenNotifications.has(notifId) && isRelevant) {
                            seenNotifications.add(notifId);
                            localStorage.setItem('seen_notifications', JSON.stringify(Array.from(seenNotifications).slice(-100)));

                            showNativeNotification(`المنتج متوفر الآن! 🕒`, {
                                body: `المنتج الذي طلبته "${data.productName}" متوفر الآن.`,
                                tag: `stock-${data.productId}`,
                                icon: '/logo.png',
                                data: { url: `/product/${data.productId}` }
                            });

                            try {
                                await updateDoc(doc(db, 'stock_notifications', notifId), {
                                    status: 'sent',
                                    notifiedAt: serverTimestamp()
                                });
                            } catch (error) {
                                console.error("Error updating notification status:", error);
                            }
                        }
                    }
                });
            });

            // Store the unsubscribe so we can cleanup if user logs out or unmounts completely
            // We attach it to a property on the auth observer or similar so we don't leak it
            // but for simplicity, we have it running as long as user is logged in
        });

        return () => {
            unsubscribeBroadcasts();
            unsubscribeAuth();
        };
    }, []); 
};
