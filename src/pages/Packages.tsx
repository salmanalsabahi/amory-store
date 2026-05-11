import { motion, AnimatePresence } from 'motion/react';
import { Gift, GraduationCap, Heart, Package as PackageIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useCart } from '../contexts/CartContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { cn } from '../lib/utils';

export function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const isOnline = useOnlineStatus();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const q = collection(db, 'packages');
    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        setPackages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      error: (error: any) => {
        if (error?.message?.includes('offline') || error?.code === 'unavailable') {
          console.warn("أنت غير متصل بالإنترنت. تُعرض الباقات من الذاكرة المؤقتة.");
        } else {
          console.error("Error fetching packages:", error);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddToCart = async (pkg: any) => {
    if (!isOnline) {
      setMessage({ type: 'error', text: 'عذراً، يجب أن تكون متصلاً بالإنترنت لتتمكن من إضافة الباقة للسلة.' });
      return;
    }
    
    setAddingId(pkg.id);
    setMessage(null);

    try {
      await addToCart({
        id: pkg.id,
        name: pkg.title,
        price: pkg.price || 0,
        imageUrl: '', // Packages don't seem to have images in the provided view
        category: 'باقة',
        brand: ''
      });
      
      setMessage({ type: 'success', text: 'تمت إضافة الباقة إلى السلة بنجاح!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding package to cart:", error);
      if (error?.message !== 'AUTH_REQUIRED') {
        setMessage({ type: 'error', text: 'فشل إضافة الباقة للسلة. يرجى المحاولة مرة أخرى.' });
      }
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="pt-32 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-4"
        >
          باقات العطور والساعات الملكية
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
        >
          اختر من باقاتنا المميزة للهدايا والمناسبات الخاصة بأسعار تنافسية للمميزين فقط
        </motion.p>
      </div>

      {message && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 text-white font-bold",
              message.type === 'success' ? "bg-emerald-600" : "bg-rose-600"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </motion.div>
        </AnimatePresence>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 min-h-[50vh]">
          <LoadingSpinner size="lg" label="جاري تحضير أفضل الباقات الملكية..." />
        </div>
      ) : packages.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm text-center flex flex-col items-center max-w-2xl mx-auto"
        >
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8">
            <PackageIcon className="w-12 h-12 text-rose-600" />
          </div>
          <h3 className="text-3xl font-display font-black text-slate-800 mb-4">عذراً، الباقات غير متوفرة حالياً</h3>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed font-medium">
            نعتذر منكم، لا توجد أي باقات مفعلة في الوقت الحالي. نحن نعمل على تحديث قائمتنا لنقدم لكم الأفضل دائماً في عالم الأناقة. شكراً لتفهمكم.
          </p>
          <div className="flex gap-4">
            <Link to="/store" className="bg-rose-600 hover:bg-rose-700 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-rose-600/20 active:scale-95">
              تصفح المتجر الآن
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
          {packages.map((pkg, idx) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2rem] md:rounded-[3rem] p-4 sm:p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 text-center flex flex-col items-center group"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-slate-50 text-rose-600 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500 shadow-sm">
                <PackageIcon className="w-8 h-8 md:w-12 md:h-12" />
              </div>
              
              <h3 className="text-[13px] sm:text-base md:text-2xl font-display font-black text-slate-900 mb-1 md:mb-3 group-hover:text-rose-600 transition-colors uppercase tracking-tight line-clamp-2 md:line-clamp-none">{pkg.title}</h3>
              <p className="text-slate-500 mb-2 md:mb-4 text-[10px] md:text-sm font-medium line-clamp-2 md:line-clamp-none">{pkg.subtitle}</p>
              <div className="text-sm sm:text-lg md:text-2xl font-display font-black text-rose-600 mb-4 md:mb-8">{pkg.price.toLocaleString()} <span className="text-[9px] md:text-xs font-normal text-slate-400">ريال</span></div>
              
              <button 
                onClick={() => handleAddToCart(pkg)}
                disabled={addingId === pkg.id}
                className="mt-auto w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl md:rounded-2xl py-2 md:py-4 font-black transition-all shadow-lg shadow-rose-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 md:gap-2 text-[11px] sm:text-sm md:text-base"
              >
                {addingId === pkg.id ? (
                  <>
                    <Loader2 className="w-3 h-3 md:w-5 md:h-5 animate-spin" />
                    <span className="hidden sm:inline">جاري...</span>
                  </>
                ) : (
                    "طلب الباقة"
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
