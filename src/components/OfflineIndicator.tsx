import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-amber-500/95 backdrop-blur-md text-white py-2.5 px-6 rounded-2xl flex items-center gap-3 text-sm font-medium shadow-xl border border-white/20"
        >
          <WifiOff className="w-5 h-5" />
          <span>المعذرة منك يا غالي.. يبدو أنك بعيد عن الشبكة حالياً، سنعرض لك ما هو متاح لدينا.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OfflineDataMessage() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500 animate-pulse">
        <WifiOff className="w-10 h-10" />
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-3">نعتذر منك بشدة..</h3>
      <p className="text-slate-600 max-w-sm leading-relaxed text-lg">
        يا هلا فيك، ودنا نخدمك ونعرض لك كل جديد، لكن نحتاج اتصال بالإنترنت حالياً. تكرم علينا بالاتصال وجرب تحدث الصفحة.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-8 px-10 py-3 bg-button-gradient text-white rounded-2xl hover:shadow-xl transition-all font-bold text-lg shadow-lg shadow-primary-600/20 active:scale-95"
      >
        تحديث وشوف الجديد
      </button>
    </div>
  );
}
