import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { notificationService } from '../services/notificationService';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const requestPermission = async () => {
    const result = await notificationService.requestPermission();
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    return result;
  };

  useEffect(() => {
    // Listen for real FCM foreground messages if available
    notificationService.onMessageListener().then((payload: any) => {
      if (payload) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 items-center gap-4`}>
            <div className="bg-rose-100 p-2 rounded-full">
              <Bell className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-900">{payload.notification.title}</p>
              <p className="mt-1 text-sm text-slate-500">{payload.notification.body}</p>
            </div>
          </div>
        ), { duration: 5000 });
      }
    });

    // Simple broadcast system using Firestore
    // This allows sending notifications even without complex FCM setup
    const now = Timestamp.now();
    const q = query(
      collection(db, 'broadcasts'),
      where('createdAt', '>', now),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          
          // Only show if it's new (last 30 seconds) to avoid historical blasts
          const age = Date.now() - (data.createdAt?.toMillis() || 0);
          if (age < 30000) {
            showLocalNotification(data.title, data.body, data.link);
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const showLocalNotification = (title: string, body: string, link?: string) => {
    // 1. Show Toast in app
    toast.custom((t) => (
      <div 
        onClick={() => {
          if (link) window.location.href = link;
          toast.dismiss(t.id);
        }}
        className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 text-white shadow-2xl rounded-2xl pointer-events-auto flex p-4 items-center gap-4 cursor-pointer hover:bg-slate-800 transition-colors`}
      >
        <div className="bg-white/10 p-2 rounded-xl">
          <Bell className="w-6 h-6 text-rose-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-0.5 text-xs text-white/70 line-clamp-2">{body}</p>
        </div>
      </div>
    ), { duration: 6000 });

    // 2. Show System Notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/logo.png',
        tag: 'broadcast'
      });
    }
  };

  return (
    <NotificationContext.Provider value={{ permission, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
