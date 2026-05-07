import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Truck, User, Settings, Percent } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Pre-fetch helper
const prefetchMap: Record<string, () => Promise<any>> = {
  '/': () => import('../../pages/Home'),
  '/store': () => import('../../pages/Store'),
  '/offers': () => import('../../pages/Offers'),
  '/cart': () => import('../../pages/Cart'),
  '/tracking': () => import('../../pages/OrderTracking'),
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
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'المتجر', path: '/store', icon: ShoppingBag },
    { name: 'العروض', path: '/offers', icon: Percent },
    { name: 'الطلبات', path: '/tracking', icon: Truck },
    accountItem,
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-[60] lg:hidden pb-safe">
      <div className="flex justify-around items-center h-[68px] px-2 pb-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              onTouchStart={() => handlePrefetch(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive ? 'text-amber-600' : 'text-slate-400 hover:text-amber-600'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-all duration-200 ${isActive ? 'bg-amber-50 scale-110' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
