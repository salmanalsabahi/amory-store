import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, AlertTriangle, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineAlert() {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<'offline' | 'online'>('online');

  useEffect(() => {
    if (!isOnline) {
      setStatus('offline');
      setShow(true);
      // Don't auto-hide offline message? 
      // The user said "don't let it stay visible", so we hide it after 5 seconds.
      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    } else {
      if (status === 'offline') {
        setStatus('online');
        setShow(true);
        const timer = setTimeout(() => setShow(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 inset-x-0 z-[9999] px-4 pointer-events-none flex justify-center"
        >
          <div className={`
            ${status === 'offline' ? 'bg-red-600' : 'bg-green-600'} 
            text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto backdrop-blur-md border border-white/20
          `}>
            {status === 'offline' ? (
              <>
                <WifiOff className="w-5 h-5 animate-pulse" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm">أنت غير متصل بالإنترنت</span>
                  <span className="text-[10px] opacity-90">ستظل البيانات المحملة متاحة، ولكن العمليات الجديدة تتطلب اتصالاً</span>
                </div>
              </>
            ) : (
              <>
                <Wifi className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm">تم استعادة الاتصال</span>
                  <span className="text-[10px] opacity-90">تم تحديث الاتصال بالخادم بنجاح</span>
                </div>
              </>
            )}
            <button 
              onClick={() => setShow(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors ms-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
