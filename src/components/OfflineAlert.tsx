import { WifiOff, Wifi, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useState, useEffect, useRef } from 'react';

export function OfflineAlert() {
  const isOnline = useOnlineStatus();
  const [alertType, setAlertType] = useState<'offline' | 'online' | null>(null);
  const wasOffline = useRef(!isOnline);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isOnline) {
      wasOffline.current = true;
      
      const timeSinceMount = Date.now() - mountTime.current;
      if (timeSinceMount < 1500) {
          // Delay showing initial offline state slightly to avoid false positives on mobile browser refresh
          timer = setTimeout(() => {
              setAlertType('offline');
              // auto dismiss after 5s
              setTimeout(() => setAlertType(null), 5000);
          }, 1500);
      } else {
        setAlertType('offline');
        // Auto dismiss after 4 seconds
        timer = setTimeout(() => {
          setAlertType(null);
        }, 4000);
      }
    } else if (isOnline && wasOffline.current) {
      wasOffline.current = false;
      setAlertType('online');
      timer = setTimeout(() => {
        setAlertType(null);
      }, 3000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOnline]);

  return (
    <AnimatePresence>
      {alertType === 'offline' && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600/95 backdrop-blur-md text-white py-2.5 px-6 rounded-2xl flex items-center gap-3 text-sm font-medium shadow-xl border border-white/20 w-11/12 max-w-md"
        >
          <WifiOff className="w-5 h-5 shrink-0" />
          <span className="flex-1">المعذرة منك ياحبوب.. النت مقطوع، يرجى الاتصال بالنت كي تتمكن من اجراء العمليات</span>
          <button onClick={() => setAlertType(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
      
      {alertType === 'online' && (
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

