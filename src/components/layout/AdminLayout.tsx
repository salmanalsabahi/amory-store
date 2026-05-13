import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { auth, signInWithGoogle, logOut, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LayoutDashboard, Users, Activity, LogOut, Loader2, Calendar, Settings, Shield, Star, Image as ImageIcon, ExternalLink, Key, Bell, MessageSquare, BarChart3, Ticket, Package, ShoppingCart, Grid, Tags, Factory, Stethoscope, Mail, Search, CreditCard, Truck, Menu, Megaphone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AdminNotifications } from '../admin/AdminNotifications';
import { OfflineAlert } from '../OfflineAlert';

export function AdminLayout() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on location change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.email === 'salmanalsabahi775@gmail.com' || currentUser.email === 'openclaw@emtiazsky.com') {
           setIsAdmin(true);
           setLoading(false);
           return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error: any) {
          if (error?.message?.includes('offline') || error?.code === 'unavailable') {
            console.warn("أنت غير متصل بالإنترنت. تعذر التحقق من الصلاحيات.");
          } else {
            console.error("Error fetching user role:", error);
          }
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <OfflineAlert />
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">لوحة تحكم المشرف</h1>
          <p className="text-slate-600 mb-8">يرجى تسجيل الدخول للوصول إلى لوحة التحكم.</p>
          <Link
            to="/auth"
            state={{ from: location }}
            className="block w-full bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-rose-600/20"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">عذراً، لا تملك صلاحية الدخول</h1>
          <p className="text-slate-600 mb-8">هذه الصفحة مخصصة لإدارة الموقع فقط. سيتم تحويلك للرئيسية.</p>
          <Link
            to="/"
            className="block w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'نظرة عامة', path: '/admin/analytics', icon: LayoutDashboard },
    { name: 'الطلبات', path: '/admin', icon: ShoppingCart },
    { name: 'المنتجات', path: '/admin/products', icon: Package },
    { name: 'الأصناف', path: '/admin/categories', icon: Grid },
    { name: 'العروض', path: '/admin/offers', icon: Ticket },
    { name: 'الباقات', path: '/admin/packages', icon: Package },
    { name: 'الكوبونات', path: '/admin/coupons', icon: Ticket },
    { name: 'المقالات', path: '/admin/articles', icon: ImageIcon },
    { name: 'التقييمات', path: '/admin/reviews', icon: Star },
    { name: 'العملاء', path: '/admin/users', icon: Users },
    { name: 'الاستشارات', path: '/admin/consultations', icon: Stethoscope },
    { name: 'الرسائل', path: '/admin/messages', icon: Mail },
    { name: 'إعدادات الدفع', path: '/admin/payment-settings', icon: CreditCard },
    { name: 'الشحن والتوصيل', path: '/admin/shipping', icon: Truck },
    { name: 'إعدادات الموقع', path: '/admin/site-settings', icon: Settings },
    { name: 'التسويق والإشعارات', path: '/admin/marketing', icon: Megaphone },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <OfflineAlert />
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:transform-none",
        isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-display font-bold text-lg">
              A
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              لوحة التحكم
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <AdminNotifications />
            <button className="md:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
              ❌
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            <Link 
              to="/" 
              className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl transition-all border border-slate-700 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              <span>عرض الموقع</span>
            </Link>
          </div>
          
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                             (item.path !== '/admin' && location.pathname.startsWith(item.path)) ||
                             (item.path === '/admin' && location.pathname === '/admin/orders');
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 mt-4">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" className="w-10 h-10 rounded-full border-2 border-slate-700" />
              <div className="text-sm overflow-hidden hidden md:block">
                <div className="text-white font-medium truncate">{user.displayName || 'المشرف'}</div>
                <div className="text-slate-500 text-xs truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={logOut}
              className="flex items-center gap-3 px-4 py-3 w-full text-right text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <header className="h-20 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <button className="md:hidden p-2 text-slate-900" onClick={() => setIsSidebarOpen(true)}>
             <Menu className="w-8 h-8" strokeWidth={3} />
          </button>
          
          <div className="flex-1 flex justify-end items-center gap-4">
            <AdminNotifications />
            <Link 
              to="/" 
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl transition-all font-medium text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>عرض الموقع</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
