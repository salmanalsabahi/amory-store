import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { notificationService } from '../services/notificationService';
import toast from 'react-hot-toast';
import { Bell, X } from 'lucide-react';

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
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} cursor-pointer max-w-sm w-full bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] rounded-[1.5rem] pointer-events-auto flex flex-col ring-1 ring-black/5 overflow-hidden relative`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100/40 to-rose-500/0 rounded-full blur-2xl -mt-8 -mr-8 pointer-events-none" />
            
            <div className="p-4 flex items-start gap-4">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center shrink-0 shadow-inner">
                 <img src="/logo.png" alt="" className="w-7 h-7 object-contain drop-shadow-sm" />
               </div>
               <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[15px] font-bold text-slate-900 truncate leading-tight">{payload.notification?.title}</p>
                  <p className="mt-1.5 text-[13px] text-slate-500 font-medium line-clamp-2 leading-relaxed">{payload.notification?.body}</p>
               </div>
               <button 
                   onClick={(e) => {
                       e.stopPropagation();
                       toast.dismiss(t.id);
                   }}
                   className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors shrink-0"
               >
                   <X className="w-4 h-4" />
               </button>
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
