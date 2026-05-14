import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-[400px] z-[100]"
        >
          <div className="bg-rose-600 text-white hover:bg-rose-700 rounded-[2rem] p-6 shadow-2xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
            
            <button 
              onClick={handleDismiss}
              className="absolute top-4 left-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex gap-5 items-start">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                <Smartphone className="w-7 h-7 text-white hidden md:block" />
                <Download className="w-7 h-7 text-white md:hidden" />
              </div>

              <div className="flex-1 text-right">
                <h3 className="text-lg font-black mb-1">تطبيق عموري للتجميل</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">ثبّت التطبيق الآن على هاتفك لتجربة تسوق أسرع وأسهل في أي وقت.</p>
                
                <div className="mt-6 flex flex-row-reverse gap-3">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 bg-white text-slate-900 font-black py-3 rounded-xl hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>تثبيت الآن</span>
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-6 py-3 font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    لاحقاً
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 opacity-50">
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-tighter">iOS & Android</span>
              </div>
              <div className="w-1 h-1 bg-white/20 rounded-full" />
              <div className="flex items-center gap-1.5 opacity-50">
                <Monitor className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Desktop</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
