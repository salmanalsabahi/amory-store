import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { auth, signInWithGoogle, logOut, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LayoutDashboard, Users, Activity, LogOut, Loader2, Calendar, Settings, Shield, Star, Image as ImageIcon, ExternalLink, Key, Bell, MessageSquare, BarChart3, Ticket, Package, ShoppingCart, Grid, Tags, Factory, Stethoscope, Mail, Search, CreditCard, Truck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AdminNotifications } from '../admin/AdminNotifications';
import { OfflineAlert } from '../OfflineAlert';

export function AdminLayout() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

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
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <OfflineAlert />
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-display font-bold text-lg">
              A
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">
              لوحة التحكم
            </span>
          </Link>
          <AdminNotifications />
        </div>

        <div className="px-4 py-4">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl transition-all border border-slate-700 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>عرض الموقع</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path !== '/admin' && location.pathname.startsWith(item.path)) ||
                           (item.path === '/admin' && location.pathname === '/admin/orders');
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  isActive
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" className="w-8 h-8 rounded-full" />
            <div className="text-sm overflow-hidden">
              <div className="text-white truncate">{user.displayName || 'المشرف'}</div>
              <div className="text-slate-500 text-xs truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={logOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-right text-red-400 hover:text-red-300 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex-1 max-w-xl">
             <div className="relative">
               <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 type="text"
                 placeholder="ابحث عن دواء، مادة فعالة، أو شركة مصنعة..."
                 className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all text-sm"
               />
             </div>
          </div>

          <div className="flex items-center gap-6 mr-6">
            <div className="flex items-center gap-2 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors text-sm font-medium">
              <span>English</span>
              <ExternalLink className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3">
              <div className="text-left hidden lg:block">
                <div className="text-sm font-bold text-slate-900">عموري ستور</div>
                <div className="text-[10px] text-slate-500">مشرف النظام</div>
              </div>
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" className="w-10 h-10 rounded-xl border border-slate-200 object-cover" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
