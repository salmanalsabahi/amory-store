import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle2, AlertCircle } from 'lucide-react';

export function NotificationBanner() {
  const { permission, requestPermission } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show after 5 seconds if not yet granted or denied
    // AND if they haven't dismissed it in the last 24 hours
    const dismissedAt = localStorage.getItem('notifications_banner_dismissed_at');
    const isRecentlyDismissed = dismissedAt && (Date.now() - parseInt(dismissedAt)) < 24 * 60 * 60 * 1000;

    const timer = setTimeout(() => {
      if (permission === 'default' && !isRecentlyDismissed) {
        setIsVisible(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [permission]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setIsVisible(false);
      localStorage.setItem('notifications_banner_dismissed_at', Date.now().toString());
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('notifications_banner_dismissed_at', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-24 left-4 right-4 z-[40] md:left-auto md:right-8 md:w-96"
        >
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            
            <button 
              onClick={handleDismiss}
              className="absolute top-3 left-3 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="bg-rose-500 p-3 rounded-2xl shadow-lg shadow-rose-500/20">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-sm">فعّل التنبيهات للحصول على العروض!</h3>
                <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                  كن أول من يعرف بجديد عمور للتجميل وعروض الجمعة المباركة مباشرة على هاتفك.
                </p>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={handleEnable}
                    className="flex-1 bg-white text-slate-900 py-2 rounded-xl text-xs font-black transition-all hover:bg-rose-50 active:scale-95"
                  >
                    تفعيل التنبيهات
                  </button>
                  <button 
                    onClick={handleDismiss}
                    className="px-4 py-2 text-white/50 text-xs font-bold hover:text-white"
                  >
                    ليس الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
