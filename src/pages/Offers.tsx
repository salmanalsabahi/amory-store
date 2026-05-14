import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Tag, Sparkles, ArrowLeft, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ProductCard } from '../components/ProductCard';

export function Offers() {
  const [discountedProducts, setDiscountedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscountedProducts = async () => {
      try {
        const q = query(collection(db, 'products'));
        const snapshot = await getDocs(q);
        const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        // Filter products where original price is greater than current price (meaning there is a discount)
        const productsOffered = allProducts.filter((p: any) => p.originalPrice && p.originalPrice > p.price);
        
        setDiscountedProducts(productsOffered);
      } catch (err: any) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscountedProducts();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 animate-spin text-rose-500 mb-4" />
      <p className="text-slate-500 font-medium font-display">جاري البحث عن أفضل العروض لك...</p>
    </div>
  );

  return (
    <div className="pt-36 md:pt-48 pb-32 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-600 font-black text-sm mb-6 border border-rose-500/20"
          >
            <Percent className="w-4 h-4" /> تخفيضات لا تفوت
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display font-black text-slate-900 mb-6"
          >
            صفقات <span className="text-rose-500">حصرية</span> لك
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            استمتع بأسعار استثنائية وخصومات كبرى على أفخم ماركات العطور ومستحضرات التجميل. العروض محدودة جداً!
          </motion.p>
        </div>

        {/* Empty State */}
        {discountedProducts.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-white rounded-[4rem] border-2 border-dashed border-slate-200"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 mx-auto shadow-sm">
              <Sparkles className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 font-display">عروض جديدة قادمة إليكم!</h3>
            <p className="text-slate-500 text-lg max-w-sm mx-auto">نعمل حالياً على تجهيز تخفيضات استثنائية. ترقبونا قريباً، الفخامة بانتظارك.</p>
            <Link to="/store" className="inline-flex items-center gap-2 mt-8 text-rose-600 font-black hover:translate-x-[-4px] transition-all">
              تصفح جميع المنتجات <ArrowLeft className="w-5 h-5" />
            </Link>
          </motion.div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {discountedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-32 p-12 lg:p-20 bg-slate-950 rounded-[4rem] text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full" />
          
          <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-6 relative z-10">هل تبحث عن منتج معين؟</h2>
          <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">
            تواصل معنا وسنحاول توفيره لك بأفضل سعر ممكن في الأسواق.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
            <Link to="/contact" className="bg-rose-500 text-slate-900 px-10 py-5 rounded-2xl font-black text-xl hover:bg-white transition-all shadow-xl shadow-rose-500/10 active:scale-95">
              تواصل معنا الآن
            </Link>
            <Link to="/store" className="bg-white/10 text-white backdrop-blur-md px-10 py-5 rounded-2xl font-black text-xl hover:bg-white/20 transition-all border border-white/10 active:scale-95">
              تصفح كل المنتجات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

