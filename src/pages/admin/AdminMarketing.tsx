import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, serverTimestamp, count, getCountFromServer, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { notificationService } from '../../services/notificationService';
import { Bell, Send, Users, Smartphone, Globe, AlertCircle, CheckCircle2, Loader2, Megaphone, ShoppingBag, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminMarketing() {
  const [targetUsers, setTargetUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | '', message: string }>({ type: '', message: '' });
  
  const [products, setProducts] = useState<any[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [notification, setNotification] = useState({
    title: '',
    body: '',
    link: ''
  });

  useEffect(() => {
    fetchStats();
    
    // Fetch products for promotion
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubProducts();
  }, []);

  const fetchStats = async () => {
    try {
      const coll = collection(db, 'fcm_tokens');
      const snapshot = await getCountFromServer(coll);
      setTargetUsers(snapshot.data().count);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    setNotification({
      title: `عرض خاص: ${product.name}`,
      body: `الآن متوفر بـ ${product.price} ريال فقط! ${product.description?.substring(0, 50)}...`,
      link: `/product/${product.id}`
    });
    setShowProductSelector(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notification.title || !notification.body) return;

    setSending(true);
    try {
      // Send Broadcast (Standard Web Notifications via Firestore sync)
      await notificationService.sendBroadcastNotification(
        notification.title,
        notification.body,
        notification.link
      );

      setStatus({ 
        type: 'success', 
        message: 'تم إرسال الإشعار بنجاح لجميع المستخدمين المتصلين!' 
      });
      setNotification({ title: '', body: '', link: '' });
      
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    } catch (error) {
      console.error("Error sending notification:", error);
      setStatus({ type: 'error', message: 'حدث خطأ أثناء إرسال الإشعار.' });
    } finally {
      setSending(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-rose-600" />
            التسويق والإشعارات
          </h1>
          <p className="text-slate-500 mt-1">أرسل تنبيهات مباشرة لهواتف المستخدمين (عروض، جمعة مباركة، أخبار)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-rose-50 p-4 rounded-2xl">
            <Users className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">مشتركو الإشعارات</p>
            <p className="text-2xl font-black text-slate-900">{targetUsers}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-4 rounded-2xl">
            <Smartphone className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">الوصول للجوال</p>
            <p className="text-lg font-bold text-slate-900">مباشر</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-4 rounded-2xl">
            <Globe className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">الحالة</p>
            <p className="text-lg font-bold text-slate-900">نشط</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-amber-500"></div>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-900">إنشاء إشعار جديد</h2>
            <button 
              onClick={() => setShowProductSelector(true)}
              className="text-xs font-black text-rose-600 hover:text-rose-700 flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              اختيار منتج للترويج
            </button>
          </div>
          
          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الإشعار</label>
              <input 
                type="text" 
                value={notification.title}
                onChange={e => setNotification({...notification, title: e.target.value})}
                placeholder="مثال: جمعة مباركة، عرض جديد!"
                className="w-full p-4 rounded-2xl border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نص الإشعار</label>
              <textarea 
                value={notification.body}
                onChange={e => setNotification({...notification, body: e.target.value})}
                placeholder="اكتب محتوى الإشعار هنا..."
                className="w-full p-4 rounded-2xl border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none h-32 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رابط الإرشاد (اختياري)</label>
              <input 
                type="text" 
                value={notification.link}
                onChange={e => setNotification({...notification, link: e.target.value})}
                placeholder="/store أو رابط منتج معين"
                className="w-full p-4 rounded-2xl border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none text-left"
                dir="ltr"
              />
            </div>

            {status.message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl flex items-center gap-3 ${
                  status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="font-bold text-sm">{status.message}</p>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={sending}
              className="w-full bg-slate-900 hover:bg-black text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              إرسال الإشعار للجميع الآن
            </button>
          </form>
        </div>

        {/* Preview Section */}
        <div className="bg-slate-50 rounded-3xl border border-slate-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest">معاينة الإشعار على الجوال</p>
          
          <div className="w-72 bg-white rounded-[3rem] p-4 shadow-2xl ring-1 ring-slate-200 relative aspect-[9/19]">
            <div className="w-20 h-5 bg-slate-100 rounded-full mx-auto mb-6"></div>
            
            <div className="space-y-4">
               {/* Phone UI Skeleton */}
              <div className="w-full h-8 bg-slate-50 rounded-lg"></div>
              
              {/* Notification Popup */}
              <motion.div 
                animate={{ 
                  y: [20, 0, 0, 0],
                  opacity: [0, 1, 1, 1],
                  scale: [0.9, 1, 1, 1]
                }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
                className="w-full bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-rose-500 p-1 rounded-md">
                    <Bell className="w-3 h-3 text-white fill-white" />
                  </div>
                  <span className="text-[10px] text-white/50 font-medium uppercase tracking-tighter">عموري للتجميل • الآن</span>
                </div>
                <h3 className="text-white text-xs font-black truncate">{notification.title || 'عنوان الإشعار يظهر هنا'}</h3>
                <p className="text-white/70 text-[10px] mt-1 leading-relaxed line-clamp-2">
                  {notification.body || 'محتوى الرسالة التي سيراها المستخدم على شاشة القفل تظهر هنا...'}
                </p>
              </motion.div>

              <div className="w-full h-24 bg-slate-50 rounded-2xl"></div>
              <div className="w-1/2 h-24 bg-slate-50 rounded-2xl ml-auto"></div>
              <div className="w-full h-12 bg-slate-50 rounded-2xl"></div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-slate-200 rounded-full"></div>
          </div>
          
          <div className="mt-8 flex items-start gap-3 max-w-xs">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              سيصل هذا الإشعار لجميع المستخدمين الذين قاموا بتثبيت التطبيق أو السماح بالإشعارات في المتصفح. قد يتأخر الوصول لبعض الأجهزة حسب إعدادات توفير الطاقة.
            </p>
          </div>
        </div>
      </div>

      {/* Product Selector Modal */}
      <AnimatePresence>
        {showProductSelector && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductSelector(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-900">اختر منتجاً للترويج</h3>
                <button 
                  onClick={() => setShowProductSelector(false)}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <AlertCircle className="rotate-45" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="ابحث عن منتج..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                  {filteredProducts.map(product => (
                    <button 
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-rose-300 hover:bg-rose-50 transition-all flex items-center gap-4 text-right group"
                    >
                      <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                        {product.images?.[0] ? 
                          <img src={product.images[0]} className="w-full h-full object-contain" alt="" /> :
                          <ShoppingBag className="w-6 h-6 text-slate-300" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{product.name}</p>
                        <p className="text-xs text-rose-600 font-black">{product.price} ريال</p>
                      </div>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="py-10 text-center text-slate-400 font-medium">لا توجد منتجات مطابقة</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

