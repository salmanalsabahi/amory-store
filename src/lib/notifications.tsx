import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
};

export const showNativeNotification = (title: string, options?: NotificationOptions & { inApp?: boolean, data?: { url?: string } }) => {
    // 1. Show in-app toast, unless explicitly disabled
    if (options?.inApp !== false) {
        toast.custom((t) => (
            <div 
                className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] rounded-[1.5rem] pointer-events-auto flex flex-col ring-1 ring-black/5 overflow-hidden relative cursor-pointer`}
                onClick={() => {
                   toast.dismiss(t.id);
                   if (options?.data?.url) {
                       window.location.href = options.data.url;
                   }
                }}
             >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100/40 to-rose-500/0 rounded-full blur-2xl -mt-8 -mr-8 pointer-events-none" />

                <div className="p-4 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center shrink-0 shadow-inner">
                        <img src={options?.icon || '/logo.png'} alt="" className="w-7 h-7 object-contain drop-shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[15px] font-bold text-slate-900 truncate leading-tight">
                            {title}
                        </p>
                        <p className="mt-1.5 text-[13px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {options?.body}
                        </p>
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
        ), { duration: 5000, position: 'top-center' }); // Auto disappear after 5 seconds
    }

    // 2. Show native system notification (background/OS level)
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        // Try to show via service worker for better background support if possible
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    icon: '/logo.png',
                    ...options
                } as any);
            });
        } else {
            // Fallback to basic Notification API
            const notif = new Notification(title, {
                icon: '/logo.png',
                ...options
            });
            notif.onclick = function(event) {
                event.preventDefault(); // prevent the browser from focusing the Notification's tab
                notif.close();
                if (options?.data?.url) {
                    window.location.href = options.data.url;
                }
            };
        }
    }
};

export const subscribeToNotifications = async (userId?: string) => {
    const granted = await requestNotificationPermission();
    if (granted) {
        toast.success("تم تفعيل الإشعارات بنجاح!", { icon: '🔕' });
        
        try {
            // Attempt to get FCM token for background pushes
            const { messaging, db } = await import('../firebase');
            const msg = await messaging();
            if (msg) {
                let registration = null;
                if ('serviceWorker' in navigator) {
                    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    await navigator.serviceWorker.ready;
                }

                const { getToken } = await import('firebase/messaging');
                const token = await getToken(msg, { 
                    vapidKey: 'BDfcOrphBI_qWDVo2MUgC9aE2ryTSTasvGbvIVikNGZMVOj4x6j7A49YWTqFNnVz9fWuS4fxhMylDErKrIvrnQs',
                    serviceWorkerRegistration: registration || undefined
                });
                
                if (token && userId) {
                    const { doc, setDoc } = await import('firebase/firestore');
                    await setDoc(doc(db, 'fcm_tokens', token), {
                        token,
                        userId,
                        updatedAt: new Date().toISOString()
                    });
                    console.log("FCM Token saved successfully.");
                }
            }
        } catch (error) {
            console.error("Error setting up Firebase Cloud Messaging:", error);
        }

        // Show a welcome notification natively
        showNativeNotification("تذكير عموري", {
            body: "أهلاً بك! ستصلك إشعارات عند توفر المنتجات والعروض.",
            data: { url: "/" }
        });
        
        return true;
    } else {
        toast.error("يرجى تفعيل الإشعارات من إعدادات المتصفح للحصول على تنبيهات المنتجات.");
        return false;
    }
};
