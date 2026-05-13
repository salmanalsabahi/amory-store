import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, startAfter, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Loader2, CheckCircle2, AlertCircle, WifiOff, Tag, Sparkles, ArrowLeft, Clock, ShoppingBag, Plus } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { OfferModal } from '../components/OfferModal';
import { useCart } from '../contexts/CartContext';

export function Offers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const [user, setUser] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const OFFERS_PER_PAGE = 4;

  const fetchOffers = async (isLoadMore = false) => {
    if (!isOnline) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      let q = query(
        collection(db, 'offers'), 
        where('active', '==', true),
        limit(OFFERS_PER_PAGE)
      );

      if (isLoadMore && lastDoc) {
        q = query(
          collection(db, 'offers'), 
          where('active', '==', true),
          startAfter(lastDoc),
          limit(OFFERS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);
      const newOffers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (isLoadMore) {
        setOffers(prev => [...prev, ...newOffers]);
      } else {
        setOffers(newOffers);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === OFFERS_PER_PAGE);
    } catch (err: any) {
      if (err?.message?.includes('offline') || err?.code === 'unavailable') {
         console.warn("أنت غير متصل بالإنترنت. لتطبيق التصفح يتطلب اتصال.");
      } else {
         console.error("Error fetching offers:", err);
         setMessage({ type: 'error', text: 'نعتذر، تعذر جلب العروض.' });
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    fetchOffers();

    return () => unsubscribeAuth();
  }, [isOnline]);

  const handleAddToCart = async (offer: any) => {
    if (!isOnline) {
      setMessage({ type: 'error', text: 'عذراً، يجب أن تكون متصلاً بالإنترنت لتتمكن من إضافة العرض للسلة.' });
      return;
    }
    
    setBookingLoading(offer.id);
    setMessage(null);

    try {
      await addToCart({
        id: offer.id,
        name: offer.title,
        price: offer.price || 0,
        imageUrl: offer.imageUrl,
        category: 'عرض',
        brand: offer.brand || ''
      });
      
      setMessage({ type: 'success', text: 'تمت إضافة العرض إلى السلة بنجاح!' });
      
      // Auto hide message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      if (error?.message !== 'AUTH_REQUIRED') {
        setMessage({ type: 'error', text: 'فشل إضافة العرض للسلة. يرجى المحاولة مرة أخرى.' });
      }
    } finally {
      setBookingLoading(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 animate-spin text-rose-500 mb-4" />
      <p className="text-slate-500 font-medium font-display">جاري تحضير أقوى العروض الحصرية...</p>
    </div>
  );

  if (!isOnline && offers.length === 0) {
    return (
      <div className="pt-36 md:pt-48 pb-20 bg-slate-50 min-h-screen flex items-center justify-center px-4 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 max-w-lg mx-auto">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8 text-rose-600 mx-auto">
            <WifiOff className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-display font-black text-slate-900 mb-4">أوه! يبدو أنك بعيد عن عالمنا</h2>
          <p className="text-slate-600 mb-10 text-lg leading-relaxed">
            العروض الحصرية تتطلب اتصالاً بالإنترنت لتظهر لك فور نزولها. يرجى التأكد من اتصالك لكي لا تفوت فرصة التوفير الكبرى!
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-rose-600 text-white hover:bg-rose-700 px-10 py-4 rounded-2xl font-black text-lg hover:text-slate-900 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
          >
            تحديث الصفحة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-36 md:pt-48 pb-32 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-600 font-black text-sm mb-6 border border-rose-500/20"
          >
            <Tag className="w-4 h-4" /> عروض الأناقة الحصرية
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display font-black text-slate-900 mb-6"
          >
            عروض لا تُقاوم <span className="text-rose-500">لأناقتك</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            استمتع بأسعار استثنائية وباقات مختارة بعناية من أفخم ماركات الساعات والعطور العالمية. عروضنا محدودة جداً، اغتنم الفرصة الآن!
          </motion.p>
        </div>

        {/* Message Banner */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "mb-12 p-6 rounded-[2rem] flex items-center gap-4 border shadow-sm",
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
              )}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
              <p className="font-bold text-lg">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {offers.length === 0 && !loading && !message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200"
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 mx-auto shadow-sm">
              <Sparkles className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 font-display">عروض جديدة قادمة إليكم!</h3>
            <p className="text-slate-500 text-lg max-w-sm mx-auto">نعمل حالياً على تجهيز باقات استثنائية. ترقبونا قريباً، الفخامة بانتظارك.</p>
            <Link to="/store" className="inline-flex items-center gap-2 mt-8 text-rose-600 font-black hover:translate-x-[-4px] transition-all">
              تصفح المنتجات الحالية <ArrowLeft className="w-5 h-5" />
            </Link>
          </motion.div>
        )}

        {/* Offers Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6 md:gap-10">
          {offers.map((offer, idx) => (
            <motion.div 
              key={offer.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedOffer(offer)}
              className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col md:flex-row group hover:shadow-2xl transition-all duration-500 h-full cursor-pointer"
            >
              {/* Image Section */}
              <div className="relative w-full md:w-2/5 min-h-[160px] sm:min-h-[220px] md:min-h-[300px] bg-slate-50 overflow-hidden">
                <img 
                  src={offer.imageUrl || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80'} 
                  alt={offer.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 absolute inset-0" 
                />
                <div className="absolute top-3 right-3 md:top-6 md:right-6">
                  <div className="bg-rose-500 text-slate-950 font-black px-2 py-1 text-[10px] md:text-base md:px-4 md:py-2 rounded-xl md:rounded-2xl shadow-xl border border-white/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
                    -{offer.discount}% خصم
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Content Section */}
              <div className="p-4 sm:p-6 md:p-10 flex-1 flex flex-col">
                <div className="flex items-center gap-1 md:gap-2 text-rose-600 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-2 md:mb-4">
                  <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" /> <span className="truncate">عرض لفترة محدودة</span>
                </div>
                <h3 className="text-base sm:text-xl md:text-3xl font-display font-black text-slate-900 mb-2 md:mb-4 tracking-tight group-hover:text-rose-600 transition-colors line-clamp-2 md:line-clamp-none">{offer.title}</h3>
                
                {offer.occasion && (
                    <div className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-700 mb-1 md:mb-2 flex items-center gap-1 md:gap-2">
                        <Tag className="w-3 h-3 md:w-4 md:h-4" /> المناسبة: {offer.occasion}
                    </div>
                )}
                
                <p className="text-slate-500 mb-4 md:mb-10 text-[11px] sm:text-sm md:text-lg leading-relaxed flex-1 line-clamp-3 md:line-clamp-none">{offer.description}</p>
                
                {offer.expiryDate && (
                    <div className="text-[10px] md:text-xs text-rose-500 font-bold mb-3 md:mb-4">
                        ينتهي: {new Date(offer.expiryDate.seconds * 1000).toLocaleDateString()}
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(offer);
                    }}
                    disabled={bookingLoading === offer.id}
                    className="flex-1 bg-rose-600 text-white hover:bg-rose-700 px-3 py-2 sm:px-4 sm:py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-[13px] sm:text-sm md:text-lg hover:text-slate-900 transition-all flex items-center justify-center gap-1 md:gap-3 disabled:opacity-50 active:scale-95 shadow-xl shadow-slate-900/10"
                  >
                    {bookingLoading === offer.id ? (
                      <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin" />
                    ) : (
                      <>اغتنم العرض <ShoppingBag className="w-3.5 h-3.5 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" /></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {hasMore && offers.length > 0 && !loading && (
           <div className="mt-12 flex justify-center">
              <button
                onClick={() => fetchOffers(true)}
                disabled={loadingMore}
                className="bg-white text-rose-600 hover:bg-rose-50 border-2 border-rose-100 px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-xl shadow-slate-900/5 group"
              >
                {loadingMore ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>عرض المزيد <Plus className="w-5 h-5 transition-transform group-hover:scale-125" /></>
                )}
              </button>
           </div>
        )}

        <OfferModal 
          offer={selectedOffer} 
          onClose={() => setSelectedOffer(null)} 
          onClaim={handleAddToCart}
          bookingLoading={bookingLoading}
        />

        {/* Support Section */}
        <div className="mt-32 p-12 lg:p-20 bg-slate-950 rounded-[4rem] text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full" />
          
          <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-6 relative z-10">هل تحتاج مساعدة في اختيار العرض؟</h2>
          <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">
            فريق خبرائنا متاح دائماً لمساعدتك في الحصول على أفضل الصفقات والهدايا المثالية لمناسباتك.
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

