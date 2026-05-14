import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { motion } from 'motion/react';
import { 
  ShoppingCart, Star, ShieldCheck, Truck, 
  Heart, Plus, Minus, Check, ChevronRight, ChevronLeft, Bell, Sparkles, Facebook, Twitter, MessageCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { RatingsAndReviews } from '../components/ui/RatingsAndReviews';
import { ProductCard } from '../components/ProductCard';
import { SEO } from '../components/SEO';

export function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [notified, setNotified] = useState(false);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { requireAuth } = useRequireAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (error: any) {
          if (error?.message?.includes('offline') || error?.code === 'unavailable') {
             const { getDocFromCache } = await import('firebase/firestore');
             docSnap = await getDocFromCache(docRef);
          } else {
             throw error;
          }
        }

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          setQuantity(data.minOrder || 1);
          
          // Fetch related products (get more than needed, then sort by brand)
          const q = query(
            collection(db, 'products'),
            where('category', '==', data.category),
            limit(15)
          );
          let snapshot;
          try {
            snapshot = await getDocs(q);
          } catch (error: any) {
             if (error?.message?.includes('offline') || error?.code === 'unavailable') {
                const { getDocsFromCache } = await import('firebase/firestore');
                snapshot = await getDocsFromCache(q);
             } else {
                throw error;
             }
          }

          const related = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p.id !== docSnap.id);
            
          // Sort to prioritize same brand
          related.sort((a: any, b: any) => {
            const aBrandMatch = a.brand === data.brand;
            const bBrandMatch = b.brand === data.brand;
            if (aBrandMatch && !bBrandMatch) return -1;
            if (!aBrandMatch && bBrandMatch) return 1;
            return 0;
          });
          
          setRelatedProducts(related.slice(0, 4));
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-20 pb-20 flex flex-col items-center justify-center min-h-[60vh] bg-slate-50/30">
        <LoadingSpinner size="lg" label="جاري تحضير المنتج..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-20 pb-20 text-center bg-slate-50/30 min-h-screen">
        <h1 className="text-xl font-bold text-slate-800 mb-4">المنتج غير متوفر</h1>
        <Link to="/store" className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold">العودة للمتجر</Link>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80'];

  const handleAddToCart = async () => {
    requireAuth(async () => {
      setAdding(true);
      try {
        await addToCart(product, quantity);
        setTimeout(() => setAdding(false), 2000);
      } catch (err) {
        setAdding(false);
      }
    }, { redirect: false, customMessage: 'ياحبوب يرجى تسجيل الدخول أو إنشاء حساب لكي تتمكن من الإضافة للسلة.' });
  };

  const handleNotifyMe = async () => {
    requireAuth(async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Request permission if not granted
        if ('Notification' in window && Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            toast.error("يرجى تفعيل الإشعارات من إعدادات المتصفح لنتمكن من تنبيهك.");
            return;
          }
        }

        await addDoc(collection(db, 'stock_notifications'), {
          productId: product.id,
          productName: product.name,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          requestedAt: serverTimestamp(),
          status: 'pending'
        });
        setNotified(true);
        toast.success("ولا يهمك، بنبلغك أول ما يتوفر ياحبوب!", { icon: "🔔" });
      } catch (error) {
        console.error("Error signing up for notification:", error);
      }
    }, { customMessage: 'لازم تسجل دخول عشان نقدر نبلغك أول ما يتوفر المنتج!' });
  };

  const increment = () => setQuantity(prev => prev + 1);
  const decrement = () => setQuantity(prev => Math.max(product.minOrder || 1, prev - 1));

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  const nextImage = () => {
    setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  const prevImage = () => {
    setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  return (
    <div className="pt-16 md:pt-24 pb-16 bg-white min-h-screen">
      <SEO 
        title={product.name}
        description={product.description?.substring(0, 160) || `تسوق ${product.name} من عموري للتجميل. أفضل الأسعار والجودة المضمونة.`}
        image={images[0]}
        keywords={`${product.name}, ${product.brand}, ${product.category}, عموري للتجميل`}
        type="product"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-6 text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider">
          <Link to="/" className="hover:text-rose-700 transition-colors">الرئيسية</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/store" className="hover:text-rose-700 transition-colors">المنتجات</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-bold">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-16 mb-8 md:mb-12">
          {/* Right Area - Details (Visually Right in RTL) */}
          <div className="w-full lg:w-1/2 flex flex-col order-2 lg:order-1">
            
            {/* Top Labels */}
            <div className="flex justify-between items-center mb-2 md:mb-4 text-[10px] md:text-sm font-medium">
               <span className="text-rose-700 bg-rose-50 px-2 py-0.5 md:px-3 md:py-1 rounded-sm">{product.brand || 'PharmaCare'}</span>
               <span className="text-slate-400">رقم التسجيل: YEM-22334</span>
            </div>
            
            {/* Title & Subtitle */}
            <h1 className="text-xl md:text-4xl font-extrabold text-slate-900 mb-1 leading-tight">
              {product.name}
            </h1>
            <p className="text-xs md:text-lg text-slate-500 mb-2 font-medium" dir="ltr">{product.englishName || product.name}</p>

            {product.isComingSoon ? (
               <div className="mb-4 md:mb-6">
                 <span className="inline-block bg-amber-100 text-amber-800 text-xs md:text-sm font-black px-3 py-1 rounded-full border border-amber-200">سيتوفر قريباً (قيد الاستيراد)</span>
               </div>
            ) : product.stock <= 0 ? (
               <div className="mb-4 md:mb-6">
                 <span className="inline-block bg-rose-100 text-rose-800 text-xs md:text-sm font-black px-3 py-1 rounded-full border border-rose-200">نفذت الكمية</span>
               </div>
            ) : null}

            {/* Ratings */}
            <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-6 text-[10px] md:text-sm">
                <span className="text-slate-500">({rating.count} تقييم)</span>
                <div className="flex text-slate-200">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={cn("w-3 h-3 md:w-4 md:h-4", Math.round(rating.average || 5) >= s ? "fill-rose-400 text-rose-400" : "")} />
                  ))}
                </div>
            </div>

            {/* Price section */}
            <div className="mb-4 md:mb-6 flex flex-col items-start gap-0.5 md:gap-1">
               <div className="flex items-baseline gap-1 md:gap-2 text-rose-700">
                 <span className="text-2xl md:text-4xl font-bold">{formatPrice(product.price)}</span>
                 {typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
                   <span className="text-slate-500 font-bold text-base md:text-2xl line-through decoration-red-600 decoration-2 mr-3">
                     {formatPrice(product.originalPrice)}
                   </span>
                 )}
               </div>
            </div>

            {/* Description Preview */}
            <p className="text-slate-600 text-[11px] md:text-base leading-relaxed mb-4 md:mb-8">
              {product.description || "يستخدم لخفض مستويات الكوليسترول والدهون الثلاثية في الدم. يقلل من تفاقم أمراض القلب والأوعية الدموية."}
            </p>

            {/* Action Bar */}
            <div className="sticky bottom-0 z-50 bg-white border-t border-slate-100 p-4 rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:bg-transparent md:border-0 md:p-0 md:rounded-none md:shadow-none md:static flex flex-col gap-4 mb-8">
               <div className="flex items-center justify-between gap-4">
                  {!product.isComingSoon && product.stock > 0 ? (
                      <div className="flex items-center bg-slate-100 rounded-lg p-1">
                          <button onClick={decrement} className="p-2 text-slate-600 hover:text-rose-700">
                             <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-bold text-slate-900">{quantity}</span>
                          <button onClick={increment} className="p-2 text-slate-600 hover:text-rose-700">
                             <Plus className="w-4 h-4" />
                          </button>
                      </div>
                  ) : <div />}

                  <div className="flex-1"></div>
                  
                  <button 
                     onClick={() => {
                        requireAuth(() => {
                          isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist({
                            id: product.id, name: product.name, price: product.price, imageUrl: images[0], brand: product.brand
                          });
                        }, { redirect: false, customMessage: 'ياحبوب يرجى تسجيل الدخول أو إنشاء حساب لكي تتمكن من الإضافة للمفضلة.' });
                     }}
                     className={cn(
                         "p-3 rounded-full border transition-all active:scale-95",
                         isInWishlist(product.id) ? "border-rose-200 bg-rose-50 text-rose-500" : "border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500"
                     )}
                   >
                     <Heart className={cn("w-5 h-5", isInWishlist(product.id) && "fill-current")} />
                  </button>
               </div>

               <div className="flex gap-3">
                  {!product.isComingSoon && product.stock > 0 ? (
                      <button 
                        onClick={handleAddToCart}
                        disabled={adding}
                        className={cn(
                          "flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-rose-700/20 transition-all active:scale-95",
                          adding ? "bg-rose-500" : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
                        )}
                      >
                         {adding ? <Check className="w-5 h-5 animate-in zoom-in" /> : <ShoppingCart className="w-5 h-5" />}
                         {adding ? "تمت الإضافة" : "إضافة للسلة"}
                      </button>
                  ) : (
                      <button 
                        onClick={handleNotifyMe}
                        disabled={notified}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border transition-all w-full active:scale-95",
                          notified ? "bg-amber-100 text-amber-600 border-amber-200" : "bg-amber-500 text-white border-amber-500 hover:bg-amber-600 active:bg-amber-700"
                        )}
                      >
                         {notified ? "تم التسجيل بنجاح" : product.isComingSoon ? "أعلمني عند التوفر (قريباً)" : "أعلمني عند التوفر"}
                      </button>
                  )}
               </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-row items-center justify-between text-[11px] md:text-sm font-medium text-slate-600 gap-2 md:gap-3 border-b border-slate-100 pb-4 md:pb-6 mb-4 md:mb-6">
               <div className="flex items-center gap-1.5 md:gap-2 text-rose-600">
                  <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> <span className="truncate">منتج أصلي ومضمون</span>
               </div>
               <div className="flex items-center gap-1.5 md:gap-2 text-rose-700">
                  <Truck className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> <span className="truncate">توصيل لجميع المحافظات</span>
               </div>
            </div>

            {/* Social Share */}
            <div className="flex items-center justify-between md:justify-end gap-3 text-xs md:text-sm">
                <span className="text-slate-500 font-medium">شارك المنتج:</span>
                <div className="flex gap-2">
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(product.name + ' - ' + window.location.href)}`} target="_blank" rel="noopener noreferrer" className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-green-500 hover:bg-green-50 transition-colors">
                     <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                  </a>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-colors">
                     <Twitter className="w-4 h-4 md:w-5 md:h-5" />
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                     <Facebook className="w-4 h-4 md:w-5 md:h-5" />
                  </a>
                </div>
            </div>
          </div>

          {/* Left Area - Image (Visually Left in RTL) */}
          <div className="w-full lg:w-1/2 order-1 lg:order-2">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-[#f8f9fa] rounded-[1.5rem] md:rounded-[2rem] aspect-[4/3] md:aspect-square flex flex-col relative overflow-hidden group"
               onTouchStart={onTouchStart}
               onTouchMove={onTouchMove}
               onTouchEnd={onTouchEnd}
            >
               <div className="flex-1 flex items-center justify-center p-4 md:p-12">
                   <img 
                     src={images[selectedImage]} 
                     alt={product.name}
                     draggable={false}
                     className="max-h-full w-full object-contain mix-blend-multiply transition-opacity duration-300 pointer-events-none"
                   />
               </div>
               
               {/* Controls */}
               {images.length > 1 && (
                 <>
                   <button 
                     onClick={(e) => { e.stopPropagation(); nextImage(); }}
                     className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg transition-all opacity-100 md:opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 cursor-pointer z-10"
                   >
                     <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); prevImage(); }}
                     className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-lg transition-all opacity-100 md:opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 cursor-pointer z-10"
                   >
                     <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                   </button>
                 </>
               )}
            </motion.div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
               <div className="flex gap-2 md:gap-3 justify-center mt-3 md:mt-4 overflow-x-auto pb-2 custom-scrollbar">
                 {images.map((img: string, idx: number) => (
                   <button
                     key={idx}
                     onClick={() => setSelectedImage(idx)}
                     className={cn(
                       "w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                       selectedImage === idx ? "border-rose-700 shadow-sm" : "border-transparent opacity-60 hover:opacity-100 bg-slate-50"
                     )}
                   >
                     <img src={img} className="w-full h-full object-contain mix-blend-multiply" />
                   </button>
                 ))}
               </div>
            )}
          </div>
        </div>


        {/* Ratings Section */}
        <div className="border-t border-slate-100 pt-6 md:pt-10 mb-10 md:mb-16">
           <RatingsAndReviews 
               targetId={product.id} 
               targetTitle={product.name} 
               targetType="product" 
               onRatingUpdate={(avg, count) => setRating({ average: avg, count })}
           />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-slate-100 pt-6 md:pt-10 mb-10 md:mb-16">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 border-b-2 border-rose-700 inline-block pb-2 md:pb-3">منتجات مشابهة</h2>
              <Link to={`/store?category=${product.category}`} className="text-xs md:text-sm font-medium text-rose-700 hover:text-rose-800 transition-colors">عرض المزيد</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {relatedProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} idx={idx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
