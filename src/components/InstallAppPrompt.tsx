import React, { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Only show for standalone mode (not already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        setShowPrompt(true);
      }
    };

    // For Android/Chrome
    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show it after a short delay if not standalone
    if (isIOSDevice && !isStandalone) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white p-5 rounded-3xl shadow-2xl z-[100] border border-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom-20 fade-in duration-500 max-w-sm mx-auto">
      <button 
        onClick={() => setShowPrompt(false)} 
        className="absolute top-3 right-3 text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-4 mt-2">
        <div className="bg-rose-100 p-3 rounded-2xl shrink-0">
          <Download className="w-8 h-8 text-rose-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">تثبيت عموري للتجميل</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            استمتع بتجربة تسوق أسرع وأسهل مع عموري للتجميل من خلال إضافة التطبيق إلى شاشتك الرئيسية.
          </p>
        </div>
      </div>

      {isIOS ? (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <p className="text-sm text-slate-700 flex flex-wrap items-center gap-2 leading-relaxed">
            للتثبيت على iPhone:
            <br />
            1. اضغط على زر المشاركة <Share className="w-4 h-4 text-blue-500 inline" />
            <br />
            2. اختر "إضافة إلى الشاشة الرئيسية" <PlusSquare className="w-4 h-4 text-slate-700 inline" />
          </p>
        </div>
      ) : (
        <button 
          onClick={handleInstall}
          className="w-full bg-rose-600 text-white hover:bg-rose-700 py-4 rounded-2xl font-bold text-center shadow-lg shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          تثبيت التطبيق الآن
        </button>
      )}
    </div>
  );
}
