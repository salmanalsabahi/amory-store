import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show our custom prompt if the user hasn't dismissed it recently
      const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
      const now = new Date().getTime();
      
      // Only show if not dismissed in the last 7 days
      if (!lastDismissed || now - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    setIsVisible(false);
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', new Date().getTime().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-white border-b border-slate-200 shadow-md px-4 py-3"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 leading-tight text-sm md:text-base">تثبيت تطبيق عموري للتجميل</h3>
                <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">احصل على تجربة تسوق أسرع وأفضل</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-rose-600 text-white font-bold text-xs md:text-sm px-3 md:px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
              >
                موافق
              </button>
              <button
                onClick={handleDismiss}
                className="text-slate-500 font-medium text-xs md:text-sm px-2 md:px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                عدم السماح
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
