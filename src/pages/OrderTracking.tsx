import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Truck, Search, Package, CheckCircle2, Clock, MapPin, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function OrderTracking() {
  const [orderQuery, setOrderQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  // Fetch users recently placed orders if logged in
  const [userOrders, setUserOrders] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(collection(db, 'orders'), where('userId', '==', auth.currentUser.uid));
        const qs = await getDocs(q);
        setUserOrders(qs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching user orders:", err);
      }
    };
    fetchUserOrders();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;
    
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // Trying to match orderNumber (or phone number if implemented later)
      const q = query(collection(db, 'orders'), where('orderNumber', '==', orderQuery.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setOrder({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
      } else {
        setError('لم نتمكن من العثور على طلب بهذا الرقم. يرجى التأكد من الرقم وإعادة المحاولة.');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { label: string, step: number }> = {
    'pending': { label: 'تم الاستلام', step: 1 },
    'processing': { label: 'قيد التجهيز', step: 2 },
    'shipped': { label: 'تم الشحن', step: 3 },
    'delivered': { label: 'تم التسليم', step: 4 },
    'cancelled': { label: 'ملغى', step: -1 }
  };

  const renderSteps = (currentStatus: string) => {
    const currentStep = statusMap[currentStatus]?.step || 1;
    if (currentStep === -1) {
      return (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-bold">
          تم إلغاء هذا الطلب
        </div>
      );
    }

    const steps = [
      { id: 1, name: 'تم الاستلام', icon: Package },
      { id: 2, name: 'قيد التجهيز', icon: Clock },
      { id: 3, name: 'في الطريق', icon: Truck },
      { id: 4, name: 'تم التسليم', icon: CheckCircle2 },
    ];

    return (
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0 hidden sm:block" />
        <div 
          className="absolute top-1/2 right-0 h-1 bg-rose-500 -translate-y-1/2 z-0 hidden sm:block transition-all duration-1000" 
          style={{ width: `${(Math.max(1, currentStep) - 1) * (100 / 3)}%` }}
        />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
          {steps.map((step) => {
            const isCompleted = currentStep >= step.id;
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex sm:flex-col items-center gap-4 sm:gap-2">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-bold border-4 transition-colors duration-300 shadow-sm relative z-10",
                    isCompleted ? "bg-rose-500 border-rose-100 text-white" : "bg-white border-slate-100 text-slate-400"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-right sm:text-center flex-1">
                  <div className={cn(
                    "font-bold text-sm",
                    isCompleted ? "text-slate-900" : "text-slate-400"
                  )}>
                    {step.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="pt-32 pb-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-display font-bold mb-4">تتبع طلبك</h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          أدخل رقم الطلب الخاص بك لمعرفة حالة الطلب وأين وصل الآن.
        </p>
      </div>

      <div className="bg-white p-2 pl-2 pr-6 rounded-full shadow-sm border border-slate-200 flex items-center max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="flex-1 flex items-center">
          <input
            type="text"
            placeholder="مثال: ORD-123456"
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            className="flex-1 border-none bg-transparent focus:ring-0 py-3 text-lg font-mono text-left"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white p-3 px-8 rounded-full font-medium transition-colors disabled:opacity-70 flex items-center gap-2 active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Search className="w-5 h-5" />
                تتبع
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-center mb-8 bg-red-50 py-4 px-6 rounded-2xl max-w-2xl mx-auto border border-red-100">
          {error}
        </motion.div>
      )}

      {order && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="text-sm text-slate-500 mb-1">رقم الطلب</div>
              <div className="text-2xl font-bold font-mono tracking-wider text-rose-600">{order.orderNumber}</div>
            </div>
            <div className="text-right sm:text-left">
              <div className="text-sm text-slate-500 mb-1">تاريخ الطلب</div>
              <div className="font-medium text-slate-900">{new Date(order.createdAt).toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>

          <div className="p-6 sm:p-12">
            {renderSteps(order.status)}
            
            <div className="mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-lg mb-4">تفاصيل التوصيل</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">العنوان</div>
                    <div className="font-medium text-slate-900">{order.customerInfo?.address}</div>
                    <div className="text-sm text-slate-600">{order.customerInfo?.governorate}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-slate-600 font-medium">المبلغ المطلوب</span>
                  <span className="font-bold text-xl text-rose-600">{order.total} ريال</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Suggested Orders if logged in */}
      {!order && userOrders.length > 0 && (
        <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-900">طلباتك الأخيرة</h3>
          <div className="space-y-3">
            {userOrders.slice(0, 3).map((uo) => (
              <button 
                key={uo.id} 
                onClick={() => { setOrderQuery(uo.orderNumber); document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-right p-4 rounded-xl transition-colors flex justify-between items-center"
              >
                <div>
                  <div className="font-mono font-bold text-rose-600">{uo.orderNumber}</div>
                  <div className="text-sm text-slate-500">{new Date(uo.createdAt).toLocaleDateString('ar-YE')}</div>
                </div>
                <div className="text-sm font-medium bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                  {statusMap[uo.status]?.label || uo.status}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
