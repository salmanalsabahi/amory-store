import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, X } from 'lucide-react';
import { auth, db } from '../firebase';
import { notificationService } from '../services/notificationService';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if the browser supports notifications
    if (!('Notification' in window)) return;

    const checkStatus = async () => {
      // Only show to logged in users
      const user = auth.currentUser;
      if (!user) {
        setShow(false);
        return;
      }

      // If already granted or denied, don't show the prompt
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        // If granted, just quietly make sure we have their token
        if (Notification.permission === 'granted') {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.data()?.pushEnabled) {
            // They have browser permission but maybe haven't registered token in our DB
            await notificationService.subscribeToPush();
            await setDoc(doc(db, 'users', user.uid), { pushEnabled: true }, { merge: true });
          }
        }
        return;
      }

      // Check if we previously dismissed
      const dismissed = localStorage.getItem('push_prompt_dismissed');
      if (dismissed === 'true') return;

      setShow(true);
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      checkStatus();
    });

    return () => unsubscribe();
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    const success = await notificationService.requestPermission();
    if (success) {
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), { pushEnabled: true }, { merge: true });
      }
      setShow(false);
    } else {
      // Might be denied or lacked VAPID key
      setShow(false);
    }
    setLoading(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('push_prompt_dismissed', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-3xl p-5 shadow-2xl z-50 border border-slate-100 flex flex-col gap-4"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-4 left-4 p-1 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4 pr-6">
            <div className="bg-amber-100 p-3 rounded-2xl shrink-0">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">تفعيل الإشعارات</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                هل ترغب في تلقي إشعارات بالتحديثات، حالة طلباتك، والعروض الحصرية حتى والبرنامج مغلق؟
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full mt-2">
            <button
              onClick={handleAllow}
              disabled={loading}
              className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-2xl transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري التفعيل...' : 'نعم، أوافق'}
            </button>
            <button
              onClick={handleDismiss}
              disabled={loading}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition-colors"
            >
              لا، شكراً
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
