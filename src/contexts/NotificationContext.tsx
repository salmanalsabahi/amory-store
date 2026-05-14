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
    notificationService.onMessageListener((payload: any) => {
      if (payload) {
        toast.custom((t) => (
          <div 
            onClick={() => {
              if (payload.data?.url) window.location.href = payload.data.url;
              toast.dismiss(t.id);
            }}
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} cursor-pointer max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 items-center gap-4 hover:bg-slate-50 transition-colors`}
          >
            <div className="bg-rose-100 p-2 rounded-full">
              <Bell className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-900">{payload.notification?.title}</p>
              <p className="mt-1 text-sm text-slate-500">{payload.notification?.body}</p>
            </div>
          </div>
        ), { duration: 5000 });
      }
    });
  }, []);

  const showLocalNotification = (title: string, body: string, link?: string) => {
    // Show Toast in app
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
