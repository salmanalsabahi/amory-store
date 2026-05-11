import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Bell, X, CheckCircle2, AlertCircle, Info, Calendar, MessageSquare, Key } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';

export function Notifications({ isAdmin = false, isDark = false }: { isAdmin?: boolean, isDark?: boolean }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // If admin, listen to all admin notifications + user notifications
    // Using simple query merge logic if complex or is not available
    const qUser = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubUser = onSnapshot(qUser, (snapshot) => {
      const userNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(prev => {
        const others = prev.filter(n => n.userId !== user.uid);
        const combined = [...userNotes, ...others].sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        // Deduplicate
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
    });

    let unsubAdmin: any = null;
    if (isAdmin) {
      const qAdmin = query(
        collection(db, 'notifications'),
        where('isAdmin', '==', true),
        orderBy('createdAt', 'desc')
      );
      unsubAdmin = onSnapshot(qAdmin, (snapshot) => {
        const adminNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(prev => {
          const others = prev.filter(n => !n.isAdmin);
          const combined = [...adminNotes, ...others].sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
          });
          // Deduplicate
          return Array.from(new Map(combined.map(item => [item.id, item])).values());
        });
      });
    }

    return () => {
      unsubUser();
      if (unsubAdmin) unsubAdmin();
    };
  }, [user, isAdmin]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const buttonClasses = isDark 
    ? "text-slate-600 hover:text-rose-600"
    : "text-white/80 hover:text-white";

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`relative p-2 flex items-center justify-center transition-all group ${buttonClasses}`}
      >
        <Bell className="w-6 h-6 transition-transform group-hover:scale-110 active:scale-95" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="relative w-full max-w-lg md:w-96 max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900">الإشعارات</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 bg-white">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Bell className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                  <p className="font-medium">لا توجد إشعارات حالياً</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map(n => {
                    if (!n) return null;
                    const linkStr = n.link ? String(n.link) : '';
                    const Icon = linkStr.includes('bookings') ? Calendar : 
                               linkStr.includes('appointments') ? Calendar :
                               linkStr.includes('messages') ? MessageSquare :
                               linkStr.includes('resets') ? Key :
                               n.type === 'success' ? CheckCircle2 : 
                               n.type === 'error' ? AlertCircle : Info;
  
                    const content = (
                      <div className="flex gap-4">
                        <div className={`mt-1 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                          n.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 
                          n.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {Icon ? <Icon className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 text-right">
                          <p className={`text-sm leading-relaxed mb-1 ${n.read ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>
                            {n.message || 'تنبيه جديد'}
                          </p>
                          <div className="flex items-center gap-2 justify-end">
                            {!n.read && (
                              <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                            )}
                            <span className="text-[10px] text-slate-400">
                              {n.createdAt && typeof n.createdAt.toDate === 'function' 
                                ? n.createdAt.toDate().toLocaleString('ar-YE') 
                                : n.createdAt instanceof Date 
                                  ? n.createdAt.toLocaleString('ar-YE')
                                  : n.createdAt ? new Date(n.createdAt).toLocaleString('ar-YE') : 'تنبيه جديد'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
  
                    const linkPath = n.link ? String(n.link) : null;
                    const baseClasses = `block w-full p-5 transition-all hover:bg-slate-50 active:bg-slate-100 border-b border-transparent last:border-0 cursor-pointer ${n.read ? 'bg-white' : 'bg-rose-50/20'}`;
                    
                    if (linkPath) {
                      const isExternal = linkPath.startsWith('http');
                      if (isExternal) {
                        return (
                          <a
                            key={n.id}
                            href={linkPath}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => {
                              if (!n.read && n.id) markAsRead(n.id);
                              setIsOpen(false);
                            }}
                            className={baseClasses}
                          >
                            {content}
                          </a>
                        );
                      }
                      return (
                        <Link
                          key={n.id}
                          to={linkPath}
                          onClick={() => {
                            if (!n.read && n.id) markAsRead(n.id);
                            setIsOpen(false);
                          }}
                          className={baseClasses}
                        >
                          {content}
                        </Link>
                      );
                    }
  
                    return (
                      <div 
                        key={n.id} 
                        className={baseClasses}
                        onClick={() => {
                          if (!n.read && n.id) markAsRead(n.id);
                        }}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                <p className="text-[10px] text-slate-400 tracking-wide font-medium">نهاية التنبيهات</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
