import toast from 'react-hot-toast';

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
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        // Try to show via service worker for better background support if possible
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    icon: '/logo.png',
                    requireInteraction: true,
                    ...options
                } as any);
            });
        } else {
            // Fallback to basic Notification API
            const notif = new Notification(title, {
                icon: '/logo.png',
                requireInteraction: true,
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

export const subscribeToNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
        toast.success("تم تفعيل الإشعارات بنجاح!", { icon: '🔕' });
        
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
