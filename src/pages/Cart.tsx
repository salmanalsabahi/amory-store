import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Truck, CreditCard, ShoppingCart, ShoppingCartIcon, CheckCircle2, ChevronLeft, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { cn } from '../lib/utils';

export function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, subtotal, shipping, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="pt-24 md:pt-32 pb-20 md:pb-32 bg-slate-50/30 min-h-screen font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12">
          <div>
            <nav className="flex items-center gap-2 md:gap-3 text-xs md:text-sm font-bold text-slate-400 mb-3 md:mb-4">
               <Link to="/" className="hover:text-amber-600 transition-colors">الرئيسية</Link>
               <ArrowRight className="w-3 h-3" />
               <span className="text-slate-900">سلة المشتريات</span>
            </nav>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-black text-slate-900 flex items-center gap-3 md:gap-4">
              حقيبة التسوق
              <span className="text-[10px] md:text-sm bg-amber-50 text-amber-600 px-3 py-0.5 md:px-4 md:py-1 rounded-full font-black mt-1 md:mt-2">
                {items.length} منتجات
              </span>
            </h1>
          </div>
          
          {items.length > 0 && (
            <button 
              onClick={clearCart}
              className="text-xs md:text-sm font-black text-rose-500 hover:text-rose-600 flex items-center gap-1.5 md:gap-2 group transition-colors self-end md:self-auto"
            >
               <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
               تفريغ السلة بالكامل
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 md:py-32 bg-white rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-sm mx-4 md:mx-0"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 text-slate-200">
               <ShoppingBag className="w-12 h-12 md:w-16 md:h-16" />
            </div>
            <h2 className="text-xl md:text-3xl font-display font-black text-slate-800 mb-3 md:mb-4">سلة المشتريات فارغة</h2>
            <p className="text-xs md:text-sm text-slate-400 mb-8 md:mb-10 max-w-sm mx-auto font-medium">يبدو أنك لم تضف أي منتجات حصرية بعد. ابدأ بالتسوق الآن واكتشف أرقى أنواع الساعات والعطور.</p>
            <Link 
              to="/store"
              className="inline-flex items-center gap-2 md:gap-3 bg-amber-600 hover:bg-amber-700 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-base shadow-xl shadow-amber-600/30 transition-all hover:scale-105 active:scale-95"
            >
              اذهب للمتجر
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 shadow-sm" />
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 lg:items-start">
            <div className="flex-1 space-y-4 md:space-y-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    key={item.id} 
                    className="group bg-white p-3 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-row gap-3 md:gap-6 items-center"
                  >
                    <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-50 rounded-xl md:rounded-3xl overflow-hidden flex items-center justify-center p-2 md:p-4 flex-shrink-0 group-hover:scale-105 transition-transform">
                      <img src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80'} alt={item.name} className="max-h-full object-contain mix-blend-multiply" />
                    </div>
                    
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-1 md:gap-4 mb-2 md:mb-4">
                        <div className="w-full sm:w-auto">
                          <h3 className="text-sm md:text-xl font-bold md:font-black text-slate-900 mb-0.5 md:mb-1 group-hover:text-amber-600 transition-colors truncate">{item.name}</h3>
                          <div className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">{item.brand}</div>
                        </div>
                        <div className="text-base md:text-2xl font-display font-black text-slate-900 mt-1 sm:mt-0 whitespace-nowrap">{item.price.toLocaleString()} <span className="text-[10px] md:text-xs font-bold text-slate-400 italic">ريال</span></div>
                      </div>
                      
                      <div className="flex flex-row items-center justify-between gap-2 md:gap-6">
                        <div className="flex items-center gap-1 md:gap-2 bg-slate-100 rounded-lg md:rounded-2xl p-1 border border-slate-200">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                            className="w-7 h-7 md:w-10 md:h-10 bg-white rounded-md md:rounded-xl flex items-center justify-center shadow-sm text-amber-600 hover:bg-amber-600 hover:text-white transition-all active:scale-90"
                          >
                            <Plus className="w-3.5 h-3.5 md:w-5 md:h-5" />
                          </button>
                          <span className="w-6 md:w-12 text-center font-bold md:font-black text-xs md:text-base text-slate-700">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} 
                            className="w-7 h-7 md:w-10 md:h-10 bg-white rounded-md md:rounded-xl flex items-center justify-center shadow-sm text-slate-400 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                          >
                            <Minus className="w-3.5 h-3.5 md:w-5 md:h-5" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="hidden sm:block text-[10px] md:text-xs font-bold text-slate-400">الإجمالي: <span className="text-slate-900">{(item.price * item.quantity).toLocaleString()} ريال</span></div>
                            <button 
                                onClick={() => removeFromCart(item.id)} 
                                className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg md:rounded-2xl transition-all"
                                title="حذف من السلة"
                            >
                                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white border border-slate-100 flex flex-row items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2 md:gap-3 text-teal-700">
                   <div className="bg-teal-50 p-1.5 md:p-2 rounded-lg flex-shrink-0">
                      <Truck className="w-4 h-4 md:w-5 md:h-5" />
                   </div>
                   <span className="font-bold text-[10px] md:text-sm">شحن مجاني للطلبات الكبيرة</span>
                </div>
                <button 
                  onClick={() => navigate('/store')}
                  className="bg-slate-50 text-slate-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-xs hover:bg-slate-100 transition-all flex items-center gap-1 md:gap-1.5 flex-shrink-0"
                >
                   اكمل التسوق
                   <ArrowLeft className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="w-full lg:w-[350px] xl:w-[400px]">
              <div className="bg-white p-6 md:p-8 lg:p-10 rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-xl lg:sticky lg:top-32">
                <h3 className="text-lg md:text-2xl font-display font-black text-slate-900 mb-4 md:mb-6 border-b border-slate-50 pb-4 text-right">ملخص الطلب</h3>
                
                <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] md:text-sm text-slate-400 font-bold flex items-center gap-2">
                       المجموع الفرعي
                    </span>
                    <span className="font-black text-sm md:text-base text-slate-900">{subtotal.toLocaleString()} ريال</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] md:text-sm text-slate-400 font-bold">رسوم التوصيل</span>
                    <span className="font-black text-sm md:text-base text-emerald-500">{shipping === 0 ? 'مجاني' : `${shipping.toLocaleString()} ريال`}</span>
                  </div>
                  
                  <div className="pt-4 md:pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-end">
                      <div>
                         <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المبلغ الإجمالي</div>
                         <div className="text-2xl md:text-4xl font-display font-black text-amber-600">{totalPrice.toLocaleString()}</div>
                      </div>
                      <div className="text-xs md:text-sm font-black text-slate-900 mb-1">ريال يمني</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <Link 
                    to="/checkout"
                    className="w-full flex items-center justify-center gap-2 md:gap-3 bg-slate-900 hover:bg-slate-800 text-white py-3 md:py-5 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-lg shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    متابعة عملية الدفع
                    <CreditCard className="w-4 h-4 md:w-6 md:h-6" />
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-2 md:gap-4 mt-4 md:mt-8">
                     <div className="flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl text-center">
                        <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                        <span className="text-[9px] md:text-[10px] font-black text-slate-500">دفع آمن 100%</span>
                     </div>
                     <div className="flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl text-center">
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                        <span className="text-[9px] md:text-[10px] font-black text-slate-500">جودة مضمونة</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
