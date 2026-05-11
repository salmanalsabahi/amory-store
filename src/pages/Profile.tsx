import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ShoppingBag, Clock, User, CheckCircle2, Package, Loader2, XCircle, Settings, Truck } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Link } from 'react-router-dom';
import { ProfileSettings } from './ProfileSettings';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function Profile() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const unsubscribeDb = onSnapshot(q, (snapshot) => {
          setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        }, (error) => {
          console.error("Error fetching orders:", error);
          // Fallback if index isn't ready or other error
          const qSimple = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
          onSnapshot(qSimple, (snap) => {
             setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
             setLoading(false);
          });
        });

        return () => unsubscribeDb();
      } else {
        setOrders([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" label="جاري استدعاء بيانات ملفك الشخصي..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-slate-50 flex items-center justify-center font-body">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">يرجى تسجيل الدخول لعرض ملفك الشخصي</h2>
          <Link to="/" className="text-rose-600 hover:underline">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-slate-50 min-h-screen font-body">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-6">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} 
            alt="Profile" 
            className="w-24 h-24 rounded-full border-4 border-rose-50"
          />
          <div className="text-center md:text-right flex-1">
            <h1 className="text-3xl font-display font-black text-slate-900 mb-2">{user.displayName || 'عميل مميز'}</h1>
            <p className="text-slate-600 font-medium">{user.email}</p>
          </div>
          {(user.email === 'salmanalsabahi775@gmail.com' || user.email === 'openclaw@emtiazsky.com') && (
            <div className="mt-4 md:mt-0">
              <Link to="/admin" className="inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold transition-all gap-2 shadow-lg shadow-rose-900/10 active:scale-95">
                الانتقال إلى لوحة التحكم
              </Link>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-sm ${activeTab === 'orders' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 hover:bg-rose-50'}`}
          >
            طلباتي
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-sm ${activeTab === 'settings' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 hover:bg-rose-50'}`}
          >
            إعدادات الحساب
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div>
            <h2 className="text-2xl font-display font-black text-slate-900 mb-6">طلباتي السابقة</h2>
            
            {orders.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-16 text-center shadow-sm border border-slate-100">
                <ShoppingBag className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">لا توجد طلبات بعد</h3>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">ابدأ رحلة الأناقة وقم بأول طلب لك الآن من مجموعتنا الحصرية.</p>
                <Link to="/store" className="inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-rose-600/20 active:scale-95">
                  اذهب للمتجر
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className={cn(
                      "absolute top-0 right-0 w-2 h-full transition-all",
                      order.status === 'delivered' ? 'bg-emerald-500' :
                      order.status === 'cancelled' ? 'bg-rose-500' : 
                      order.status === 'shipped' ? 'bg-blue-500' : 'bg-rose-500'
                    )} />
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                           <Package className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-400 mb-1">رقم الطلب</div>
                          <div className="text-xl font-display font-black text-slate-900">{order.orderNumber}</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                         <span className={cn(
                           "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tight",
                           order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                           order.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                           order.status === 'shipped' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                         )}>
                            {order.status === 'delivered' ? 'تم التوصيل' :
                             order.status === 'cancelled' ? 'ملغى' :
                             order.status === 'shipped' ? 'جاري الشحن' : 'قيد المعالجة'}
                         </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100/50">
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                             <Clock className="w-3 h-3" /> التاريخ
                          </div>
                          <div className="text-sm font-black text-slate-700">{new Date(order.createdAt).toLocaleDateString('ar-YE')}</div>
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                             <Truck className="w-3 h-3" /> المحافظة
                          </div>
                          <div className="text-sm font-black text-slate-700">{order.customerInfo.governorate}</div>
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">الدفع</div>
                          <div className="text-sm font-black text-slate-700">{order.paymentMethod}</div>
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">الإجمالي</div>
                          <div className="text-sm font-black text-rose-600">{order.total?.toLocaleString()} ريال</div>
                       </div>
                    </div>

                    <div className="mt-6">
                       <div className="flex -space-x-4 space-x-reverse overflow-hidden">
                          {order.items?.map((item: any, i: number) => (
                             <img 
                               key={i} 
                               src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80'} 
                               className="inline-block h-12 w-12 rounded-xl ring-4 ring-white object-cover bg-white shadow-sm" 
                               alt={item.name} 
                             />
                          ))}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <ProfileSettings />
        )}

      </div>
    </div>
  );
}
