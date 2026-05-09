import { WifiOff, Wifi, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useState, useEffect } from 'react';

export function OfflineAlert() {
  const isOnline = useOnlineStatus();
  const [showOnline, setShowOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowOnline(false);
      setDismissed(false);
      // Auto dismiss offline message after 4 seconds to match user request
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else if (isOnline && wasOffline) {
      setShowOnline(true);
      const timer = setTimeout(() => {
        setShowOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline && !dismissed && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600/95 backdrop-blur-md text-white py-2.5 px-6 rounded-2xl flex items-center gap-3 text-sm font-medium shadow-xl border border-white/20 w-11/12 max-w-md"
        >
          <WifiOff className="w-5 h-5 shrink-0" />
          <span className="flex-1">المعذرة منك ياحبوب.. النت مقطوع، يرجى الاتصال بالنت كي تتمكن من اجراء العمليات</span>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
      
      {showOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-green-600/95 backdrop-blur-md text-white py-2.5 px-6 rounded-2xl flex items-center gap-3 text-sm font-medium shadow-xl border border-white/20 w-11/12 max-w-md"
        >
          <Wifi className="w-5 h-5 shrink-0" />
          <span className="flex-1">تم استعادة الاتصال بالشبكة ياحبوب! 😊</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

