import React from 'react';
import toast from "react-hot-toast";

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

export const showNativeNotification = (title: string, options?: NotificationOptions & { inApp?: boolean }) => {
    // Show prominent in-app toast by default
    if (options?.inApp !== false) {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-2xl rounded-[1.5rem] pointer-events-auto flex ring-1 ring-black/5 p-4 border-l-4 border-rose-500`}>
                <div className="flex-1 w-0 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                        <img src={options?.icon || '/logo.png'} alt="" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                            {title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 font-medium line-clamp-2">
                            {options?.body}
                        </p>
                    </div>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    }

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
            new Notification(title, {
                icon: '/logo.png',
                ...options
            });
        }
    }
};

export const subscribeToNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
        toast.success("تم تفعيل الإشعارات بنجاح!", { icon: '🔕' });
        
        // Show a welcome notification
        showNativeNotification("عموري للتجميل", {
            body: "أهلاً بك! ستصلك إشعارات عند توفر المنتجات التي تطلبها.",
        });
        
        return true;
    } else {
        toast.error("يرجى تفعيل الإشعارات من إعدادات المتصفح للحصول على تنبيهات المنتجات.");
        return false;
    }
};
