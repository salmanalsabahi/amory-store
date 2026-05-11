import React, { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect if running in an iframe or standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone) {
      // Very basic detection - in a real app would use beforeinstallprompt
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 border-primary-500 shadow-lg z-[9999] rounded-t-2xl">
      <div className="flex flex-col gap-2 p-2">
        <h3 className="font-bold text-lg text-rose-600">ثبّت عموري للتجميل في شاشتك</h3>
        <p className="text-slate-600 text-sm">
          للحصول على أفضل تجربة، اضغط على زر المشاركة (Share) ثم "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).
        </p>
        <button onClick={() => setShowPrompt(false)} className="bg-rose-600 text-white font-bold py-2 rounded-lg">إغلاق</button>
      </div>
    </div>
  );
}
