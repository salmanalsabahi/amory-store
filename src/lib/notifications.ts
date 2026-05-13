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

export const showNativeNotification = (title: string, options?: NotificationOptions) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        // Try to show via service worker for better background support if possible
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    icon: '/icon.svg',
                    vibrate: [200, 100, 200],
                    ...options
                });
            });
        } else {
            // Fallback to basic Notification API
            new Notification(title, {
                icon: '/icon.svg',
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
        showNativeNotification("عموري ستور | Amory Store", {
            body: "أهلاً بك! ستصلك إشعارات عند توفر المنتجات التي تطلبها.",
        });
        
        return true;
    } else {
        toast.error("يرجى تفعيل الإشعارات من إعدادات المتصفح للحصول على تنبيهات المنتجات.");
        return false;
    }
};
