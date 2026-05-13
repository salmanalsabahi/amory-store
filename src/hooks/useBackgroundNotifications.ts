import { useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { showNativeNotification } from '../lib/notifications';

export const useBackgroundNotifications = () => {
    useEffect(() => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Listen for stock notifications that are ready to be sent to the user
        // In a real app, a cloud function would set status to "ready" when stock > 0
        const q = query(
            collection(db, 'stock_notifications'),
            where('userId', '==', currentUser.uid),
            where('status', '==', 'ready') // "ready" means admin updated stock and it's time to notify
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    
                    // Show the native system notification
                    showNativeNotification(`المنتج متوفر الآن! 🕒`, {
                        body: `ياحبوب، المنتج الذي طلبته "${data.productName}" متوفر الآن في عموري ستور. سارع بالطلب!`,
                        tag: data.productId, // Avoid duplicates
                        data: {
                            url: `/product/${data.productId}`
                        }
                    });

                    // Update status to "sent" so it doesn't trigger again
                    try {
                        await updateDoc(doc(db, 'stock_notifications', change.doc.id), {
                            status: 'sent',
                            notifiedAt: serverTimestamp()
                        });
                    } catch (error) {
                        console.error("Error updating notification status:", error);
                    }
                }
            });
        });

        // Also listen for broad marketing broadcasts
        const broadcastsQuery = query(
            collection(db, 'broadcasts'),
            where('createdAt', '>', new Date(Date.now() - 1000 * 60 * 5)) // last 5 minutes
        );

        const unsubscribeBroadcasts = onSnapshot(broadcastsQuery, (snapshot) => {
             snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    showNativeNotification(data.title, {
                        body: data.body,
                        data: { url: data.link || '/' }
                    });
                }
             });
        });

        return () => {
            unsubscribe();
            unsubscribeBroadcasts();
        };
    }, []);
};
