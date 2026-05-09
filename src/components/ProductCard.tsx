import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Star, Heart, Check, Bell, X, Plus, Minus, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { cn } from '../lib/utils';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: any;
  idx: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, idx }) => {
  const [quantity, setQuantity] = useState(product.minOrder || 1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { requireAuth } = useRequireAuth();
  const isOnline = useOnlineStatus();
  const [adding, setAdding] = useState(false);
  const [notified, setNotified] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (product.stock <= 0) return;
    setAdding(true);
    try {
      await addToCart(product, quantity);
      toast.success(`تم إضافة ${product.name} لسلتك ياحبوب!`, { icon: '🛒' });
      setTimeout(() => {
        setAdding(false);
        setIsModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setAdding(false);
    }
  };

  const handleNotifyMe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOnline) {
      toast.error('المعذرة منك ياحبوب.. النت مقطوع، يرجى الاتصال بالنت لتلقي الإشعارات.');
      return;
    }
    try {
      await addDoc(collection(db, 'stock_notifications'), {
        productId: product.id,
        productName: product.name,
        requestedAt: serverTimestamp(),
        status: 'pending'
      });
      setNotified(true);
      toast.success('ولا يهمك، بنبلغك أول ما يتوفر ياحبوب!', { icon: '🔔' });
    } catch (error) {
      console.error("Error signing up for notification:", error);
    }
  };

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const closeModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const increment = (e: React.MouseEvent) => {
     e.stopPropagation();
     setQuantity(prev => prev + 1);
  };
  const decrement = (e: React.MouseEvent) => {
     e.stopPropagation();
     setQuantity(prev => Math.max(product.minOrder || 1, prev - 1));
  };
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(() => {
      isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.images?.[0],
        brand: product.brand
      });
    }, { redirect: false, customMessage: 'ياحبوب يرجى تسجيل الدخول أو إنشاء حساب لكي تتمكن من الإضافة للمفضلة.' });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group flex flex-col h-full cursor-pointer"
        onClick={openModal}
      >
        <div className="relative aspect-square overflow-hidden bg-slate-50 flex justify-center items-center group/card">
          <button 
            onClick={handleWishlistToggle}
            className={cn(
              "absolute top-2 right-2 z-10 p-1.5 rounded-full shadow-sm transition-all duration-300 transform active:scale-90",
              isInWishlist(product.id) ? 'bg-amber-500 text-white' : 'bg-white text-slate-400 hover:text-amber-500'
            )}
          >
            <Heart className={cn("w-4 h-4", isInWishlist(product.id) && "fill-current")} />
          </button>
          
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <button
                onClick={openModal}
                className="p-3 rounded-full bg-white text-slate-900 shadow-md transition-transform hover:scale-105 active:scale-95 mr-2"
                title="نظرة سريعة"
            >
                <Eye className="w-6 h-6" />
            </button>
            <button
                onClick={handleAddToCart}
                disabled={adding || product.stock <= 0}
                className={cn(
                    "p-3 rounded-full bg-white text-slate-900 shadow-md transition-transform hover:scale-105 active:scale-95",
                    adding && "bg-emerald-500 text-white",
                    product.stock <= 0 && "opacity-50 cursor-not-allowed hover:scale-100"
                )}
            >
                {adding ? <Check className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
            </button>
            {product.stock <= 0 && (
                <button
                    onClick={handleNotifyMe}
                    disabled={notified}
                    className="p-3 rounded-full bg-white text-slate-900 shadow-md transition-transform hover:scale-105 active:scale-95 ml-2"
                >
                    {notified ? <Check className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                </button>
            )}
          </div>

          <div className="w-full h-full p-2 flex items-center justify-center">
            <img 
              src={product.images?.[0] || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80'} 
              alt={product.name}
              className="max-h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-full">نفذت الكمية</span>
            </div>
          )}
        </div>

        <div className="p-3 md:p-4 flex-1 flex flex-col">
          <h3 className="text-sm md:text-[15px] font-bold text-slate-900 mb-1 leading-tight group-hover:text-amber-600 transition-colors line-clamp-1">{product.name}</h3>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{product.category}</span>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-bold", product.stock > 0 ? "text-emerald-600" : "text-rose-600")}>
                {product.stock > 0 ? `المتوفر: ${product.stock}` : 'نفذت الكمية'}
              </span>
              <div className="flex items-center gap-0.5">
                 <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                 <span className="text-[10px] font-bold text-slate-500">{product.rating || "4.9"}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex items-baseline gap-1 mb-2 flex-wrap">
              <span className="text-base md:text-lg font-black text-slate-900">{product.price.toLocaleString()}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">ريال</span>
              {typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
                <span className="text-[10px] md:text-xs text-slate-500 line-through decoration-red-600 decoration-2 mr-2 font-bold">
                  {product.originalPrice.toLocaleString()} ريال
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-slate-900/60 backdrop-blur-md p-4 sm:p-6" onClick={closeModal}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row pointer-events-auto"
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              <button 
                onClick={closeModal}
                className="absolute top-3 right-3 md:top-4 md:right-4 z-20 bg-white/80 hover:bg-white text-slate-500 hover:text-slate-900 p-2 md:p-2.5 rounded-full backdrop-blur-md shadow-sm transition-all hover:scale-110 active:scale-95"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              {/* Image Section */}
              <div className="w-full md:w-1/2 h-56 sm:h-64 md:h-auto flex-none bg-slate-50 relative p-4 md:p-8 flex items-center justify-center group/image rounded-t-3xl md:rounded-l-none md:rounded-r-3xl">
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 to-transparent pointer-events-none" />
                 <motion.img 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, ease: "easeOut" }}
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80'} 
                    className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover/image:scale-110" 
                    alt={product.name}
                 />
                 <button 
                    onClick={handleWishlistToggle}
                    className={cn(
                      "absolute bottom-3 right-3 md:bottom-4 md:right-4 z-10 p-2 md:p-3.5 rounded-full shadow-md transition-all duration-300 transform active:scale-90 hover:scale-110",
                      isInWishlist(product.id) ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-white text-slate-400 hover:text-amber-500 hover:shadow-lg'
                    )}
                 >
                    <Heart className={cn("w-4 h-4 md:w-6 md:h-6", isInWishlist(product.id) && "fill-current")} />
                 </button>
              </div>

              {/* Details Section */}
              <div className="w-full md:w-1/2 p-4 sm:p-5 md:p-8 overflow-y-auto bg-white flex flex-col">
                 <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                 >
                    <div className="flex justify-between items-start mb-1 md:mb-2 group/text">
                       <div>
                           <span className="inline-block text-[10px] md:text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md uppercase tracking-wider mb-2 md:mb-3">
                             {product.brand}
                           </span>
                           <Link to={`/product/${product.id}`} className="hover:text-amber-600 transition-colors block">
                              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-1 md:mb-2">{product.name}</h2>
                           </Link>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 bg-slate-50 p-1.5 md:p-2.5 rounded-lg md:rounded-xl w-max">
                       <div className="flex items-center gap-0.5 md:gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={cn("w-3 h-3 md:w-4 md:h-4", (product.rating || 5) >= s ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                          ))}
                       </div>
                       <div className="w-px h-3 md:h-4 bg-slate-200"></div>
                       {product.reviewsCount ? (
                         <span className="text-xs md:text-sm text-slate-600 font-bold">({product.reviewsCount} تقييم)</span>
                       ) : (
                         <span className="text-xs md:text-sm text-slate-600 font-bold">لا توجد تقييمات</span>
                       )}
                    </div>
                 </motion.div>

                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-4 md:mb-8"
                 >
                    <h3 className="text-[11px] md:text-sm font-bold text-slate-900 mb-1 md:mb-2 uppercase tracking-wide">تفاصيل المنتج</h3>
                    <p className="text-slate-500 text-[13px] md:text-[15px] leading-relaxed">
                       {product.description ? 
                         (product.description.length > 150 ? product.description.substring(0, 150) + '...' : product.description) 
                         : "لا يوجد وصف مفصل متاح لهذا المنتج حالياً. نؤكد لكم أن جميع منتجاتنا مختارة بعناية فائقة لضمان أعلى مستويات الجودة والفخامة."}
                    </p>
                 </motion.div>

                 <div className="mt-auto">
                    <motion.div 
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.4 }}
                       className="flex items-baseline gap-1.5 md:gap-2 mb-4 md:mb-6 bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100"
                    >
                       <span className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">{product.price.toLocaleString()}</span>
                       <span className="text-xs md:text-sm font-bold text-slate-500 uppercase">ريال</span>
                       {typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
                          <div className="mr-2 md:mr-3 flex items-center flex-wrap">
                            <span className="text-base md:text-xl text-slate-500 line-through decoration-red-600 decoration-2 mr-1 md:mr-2 font-bold">
                              {product.originalPrice.toLocaleString()}
                            </span>
                            <span className="bg-red-100 text-red-600 text-[9px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full mt-1 sm:mt-0">
                              وفّر {(product.originalPrice - product.price).toLocaleString()}
                            </span>
                          </div>
                       )}
                    </motion.div>

                    <motion.div 
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.5 }}
                    >
                       {product.stock > 0 ? (
                          <div className="flex flex-col gap-3 md:gap-4">
                             <div className="flex gap-2 mx-auto justify-center sm:w-full sm:mx-0 sm:gap-4 w-full">
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl overflow-hidden shadow-sm shrink-0">
                                   <button onClick={decrement} className="p-2 md:p-4 hover:bg-slate-200 transition-colors active:bg-slate-300">
                                      <Minus className="w-4 h-4 text-slate-600" />
                                   </button>
                                   <span className="w-8 md:w-12 text-center font-black text-sm md:text-lg text-slate-900">{quantity}</span>
                                   <button onClick={increment} className="p-2 md:p-4 hover:bg-slate-200 transition-colors active:bg-slate-300">
                                      <Plus className="w-4 h-4 text-slate-600" />
                                   </button>
                                </div>
                                
                                <button
                                  onClick={handleAddToCart}
                                  disabled={adding}
                                  className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 md:gap-2 rounded-lg md:rounded-xl font-black text-sm md:text-lg transition-all active:scale-95 shadow-lg",
                                    adding 
                                      ? "bg-emerald-500 text-white shadow-emerald-500/30" 
                                      : "bg-slate-900 text-white hover:bg-amber-500 hover:shadow-amber-500/30"
                                  )}
                                >
                                  {adding ? (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 md:gap-2">
                                      <Check className="w-4 h-4 md:w-6 md:h-6" /> <span className="hidden sm:inline">تمت الإضافة بنجاح</span><span className="sm:hidden">تمت الإضافة</span>
                                    </motion.div>
                                  ) : (
                                    <>
                                      <ShoppingBag className="w-4 h-4 md:w-6 md:h-6" /> <span className="hidden sm:inline">إضافة للسلة الآن</span><span className="sm:hidden">إضافة للسلة</span>
                                    </>
                                  )}
                                </button>
                             </div>
                          </div>
                       ) : (
                          <button
                             onClick={handleNotifyMe}
                             disabled={notified}
                             className={cn(
                               "w-full flex items-center justify-center gap-1.5 md:gap-2 py-3 md:py-4 rounded-lg md:rounded-xl font-black text-sm md:text-lg transition-all active:scale-95 border-2",
                               notified
                                 ? "bg-amber-50 border-amber-300 text-amber-600"
                                 : "border-slate-900 text-slate-900 hover:bg-slate-50"
                             )}
                          >
                             {notified ? (
                               <><Check className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">سوف نقوم بإبلاغك فور التوفر</span><span className="sm:hidden">سوف نخبرك</span></>
                             ) : (
                               <><Bell className="w-4 h-4 md:w-5 md:h-5" /> أعلمني عندما يتوفر</>
                             )}
                          </button>
                       )}
                       
                       <div className="mt-4 md:mt-6 text-center">
                          <Link 
                             to={`/product/${product.id}`} 
                             onClick={() => setIsModalOpen(false)}
                             className="inline-flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors group/link"
                          >
                             عرض كافة تفاصيل وتقييمات المنتج
                             <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover/link:bg-amber-100 transition-colors shrink-0">
                                <Plus className="w-3 h-3 md:w-4 md:h-4 group-hover/link:rotate-90 transition-transform" />
                             </div>
                          </Link>
                       </div>
                    </motion.div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
