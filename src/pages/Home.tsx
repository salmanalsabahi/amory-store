import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, Truck, ShieldCheck, 
  Clock, Sparkles, HeadphonesIcon,
  ChevronRight, ChevronLeft, Gem, Watch, Eye, Droplets
} from 'lucide-react';
import { collection, query, onSnapshot, where, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firebaseErrorHandler';
import { ProductCard } from '../components/ProductCard';
import { BeautySlider } from '../components/BeautySlider';

export function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const { settings } = useSiteSettings();
  
  const brands = ["CeraVe", "Bioderma", "La Roche-Posay", "Cetaphil", "Garnier", "Vichy", "Eucerin", "The Ordinary", "PanOxyl", "Avene"];

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), limit(12));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products', auth));

    const qArticles = query(collection(db, 'articles'), where('active', '==', true), orderBy('createdAt', 'desc'), limit(3));
    const unsubscribeArticles = onSnapshot(qArticles, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'articles', auth));

    const qOffers = query(collection(db, 'offers'), where('active', '==', true), limit(3));
    const unsubscribeOffers = onSnapshot(qOffers, (snapshot) => {
      setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'offers', auth));

    const qOrders = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders', auth));

    const unsubscribeCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories', auth));

    return () => {
      unsubscribeProducts();
      unsubscribeArticles();
      unsubscribeOffers();
      unsubscribeOrders();
      unsubscribeCats();
    };
  }, []);

  // Aggregation
  const bestSellers = useMemo(() => {
    if (products.length === 0 || orders.length === 0) return [];
    
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      order.items?.forEach((item: any) => {
        counts[item.id] = (counts[item.id] || 0) + (item.quantity || 1);
      });
    });
    
    return products.filter(p => counts[p.id]).sort((a,b) => (counts[b.id] || 0) - (counts[a.id] || 0)).slice(0, 5);
  }, [products, orders]);

  const saleProducts = products.filter(p => p.originalPrice > p.price);

  return (
    <div className="flex flex-col bg-white">
      <BeautySlider />

      {/* Trust Badges */}
      <section className="relative z-10 -mt-16 max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: 'توصيل مجاني', desc: 'للطلبات فوق 500 ريال', color: 'bg-rose-600' },
            { icon: ShieldCheck, title: 'أصلية 100%', desc: 'ضمان الوكيل الرسمي', color: 'bg-indigo-600' },
            { icon: Clock, title: 'شحن سريع', desc: 'خلال 24-48 ساعة', color: 'bg-rose-600' },
            { icon: HeadphonesIcon, title: 'دعم فني', desc: 'متاح طوال الأسبوع', color: 'bg-rose-600' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg", feature.color)}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1 leading-tight">{feature.title}</h4>
              <p className="text-[10px] text-slate-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-display font-black text-slate-900 mb-4 tracking-tighter">أقسام مختارة</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => {
              const Icon = (cat.name.includes('بشرة') || cat.name.includes('وجه')) ? Droplets : 
                          (cat.name.includes('شعر') || cat.name.includes('شامبو')) ? Sparkles : 
                          (cat.name.includes('مكياج') || cat.name.includes('تجميل')) ? Gem : 
                          (cat.name.includes('عطر') || cat.name.includes('عطور')) ? Droplets : 
                          cat.name.includes('رجل') ? ShieldCheck : Sparkles;
              return (
                <Link 
                  key={cat.id || `cat-idx-${i}`}
                  to={`/store?category=${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group h-full"
                >
                  <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm", 
                    i % 2 === 0 ? "text-rose-600 bg-rose-50" : "text-slate-700 bg-slate-50")}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs text-center leading-tight group-hover:text-rose-600 transition-colors uppercase">{cat.name}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <h2 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tighter">منتجات مميزة</h2>
            <Link to="/store" className="text-xs md:text-sm font-bold text-rose-600 hover:underline">عرض الكل</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.slice(0, 4).map((product, idx) => (
              <ProductCard key={product.id} product={product} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-12 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-display font-black text-slate-900 mb-8 tracking-tighter">الأكثر مبيعاً</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {bestSellers.map((product, idx) => (
                <ProductCard key={product.id} product={product} idx={idx} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sale Section */}
      {saleProducts.length > 0 && (
         <section className="py-12 md:py-20 bg-rose-600">
           <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-10">
                 <div className="flex-1 text-center lg:text-right">
                    <span className="bg-white text-rose-600 text-[9px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-full mb-3 md:mb-4 inline-block">عروض حصرية</span>
                    <h2 className="text-3xl md:text-4xl lg:text-6xl font-display font-black text-white mb-4 md:mb-6 leading-tight">توفير حتى 60% على تشكيلة مختارة</h2>
                    <Link to="/store?onSale=true" className="inline-flex items-center gap-2 bg-white text-rose-600 px-6 md:px-8 py-2 md:py-3 rounded-full font-black text-sm md:text-lg hover:bg-rose-50 transition-all shadow-xl shadow-rose-900/10">
                       تسوق العروض <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                    </Link>
                 </div>
                 <div className="flex-1 w-full grid grid-cols-2 gap-4">
                    {saleProducts.slice(0, 2).map((product) => (
                       <ProductCard key={product.id} product={product} idx={0} />
                    ))}
                 </div>
              </div>
           </div>
         </section>
      )}

      {/* Latest Products */}
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-12 gap-4 md:gap-6 text-right">
             <div>
                <h2 className="text-xl md:text-2xl lg:text-4xl font-display font-black text-slate-900 tracking-tighter mb-1 md:mb-2">أحدث ما وصلنا</h2>
                <p className="text-xs md:text-sm text-slate-500">نختار لك الأفضل دائماً من أرقى الماركات العالمية</p>
             </div>
             <Link to="/store" className="bg-rose-600 text-white hover:bg-rose-700 px-5 md:px-6 py-2 md:py-2.5 rounded-full font-bold text-[10px] md:text-sm flex items-center justify-center w-full md:w-auto gap-2 transition-all">
                المتجر بالكامل <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
             </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.slice(0, 8).map((product, idx) => (
              <ProductCard key={product.id} product={product} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers */}
      {offers.length > 0 && (
        <section className="py-20 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-2xl lg:text-4xl font-display font-black text-slate-900 tracking-tighter">باقات وعروض حصرية</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {offers.map((offer, idx) => (
                <div key={offer.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group">
                  <div className="aspect-video relative overflow-hidden">
                    <img src={offer.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 bg-red-500 text-white font-black text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 md:py-1 rounded-md">-{offer.discount}%</div>
                  </div>
                  <div className="p-3 md:p-6">
                    <h3 className="font-bold text-slate-900 mb-1 md:mb-2 text-xs md:text-base line-clamp-1">{offer.title}</h3>
                    <p className="text-[9px] md:text-[10px] text-slate-500 mb-3 md:mb-6 line-clamp-2">{offer.description}</p>
                    <Link to="/offers" className="block w-full text-center bg-rose-600 text-white hover:bg-rose-700 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-colors">عرض التفاصيل</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Articles */}
      {articles.length > 0 && (
        <section className="py-12 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8 md:mb-12">
              <h2 className="text-xl md:text-2xl lg:text-4xl font-display font-black text-slate-900 tracking-tighter">مدونة الأناقة</h2>
              <Link to="/articles" className="text-xs md:text-sm font-bold text-rose-600 hover:underline">عرض الكل</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {articles.map((article, idx) => (
                <motion.article 
                  key={article.id} 
                  className="group cursor-pointer"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Link to={`/article/${article.id}`}>
                    <div className="aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden mb-4">
                      <img src={article.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="text-[10px] text-rose-600 font-bold mb-2 uppercase tracking-wide">
                        {new Date(article.createdAt?.seconds * 1000).toLocaleDateString('ar-YE')}
                    </div>
                    <h4 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2">{article.title}</h4>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brands Slider */}
      <section className="py-12 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-8">
           <h2 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tighter text-center">أشهر الماركات العالمية</h2>
        </div>
        <div className="flex justify-center">
          <motion.div 
            className="flex gap-8 items-center"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          >
            {[...brands, ...brands].map((brand, i) => (
              <div key={i} className="text-2xl font-display font-black text-slate-300 whitespace-nowrap px-4 hover:text-rose-600 transition-colors cursor-pointer">
                {brand}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="h-10" />
    </div>
  );
}
