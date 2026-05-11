import { Link, useLocation } from 'react-router-dom';
import { Store, Percent, Package, User, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Pre-fetch helper
const prefetchMap: Record<string, () => Promise<any>> = {
  '/': () => import('../../pages/Home'),
  '/store': () => import('../../pages/Store'),
  '/offers': () => import('../../pages/Offers'),
  '/packages': () => import('../../pages/Packages'),
  '/profile': () => import('../../pages/Profile'),
  '/auth': () => import('../../pages/Auth'),
  '/admin': () => import('../../pages/admin/AdminOrders'),
};

export function MobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [user, setUser] = useState<any>(null);

  const handlePrefetch = (path: string) => {
    const prefetch = prefetchMap[path];
    if (prefetch) prefetch().catch(() => {});
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email === 'salmanalsabahi775@gmail.com' || user?.email === 'openclaw@emtiazsky.com';

  const accountItem = isAdmin 
    ? { name: 'لوحة التحكم', path: '/admin', icon: Settings }
    : user 
      ? { name: 'حسابي', path: '/profile', icon: User }
      : { name: 'دخول', path: '/auth', icon: User };

  const navItems = [
    { name: 'المتجر', path: '/store', icon: Store },
    { name: 'العروض', path: '/offers', icon: Percent },
    { name: 'الباقات', path: '/packages', icon: Package },
    accountItem,
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-[60] lg:hidden pb-safe">
      <div className="flex justify-around items-center h-[68px] px-2 pb-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          const Icon = item.icon;
          const badgeCount = (item as any).badge || 0;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              onTouchStart={() => handlePrefetch(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive ? 'text-rose-600' : 'text-slate-400 hover:text-rose-600'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-all duration-200 ${isActive ? 'bg-rose-50 scale-110' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
