import { motion } from 'motion/react';
import { useWishlist } from '../contexts/WishlistContext';
import { Link } from 'react-router-dom';
import { HeartCrack, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';

export function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();

  return (
    <div className="pt-32 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-body">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/store" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowRight className="w-5 h-5 text-slate-500" />
        </Link>
        <h1 className="text-3xl font-display font-black text-slate-900">المفضلة</h1>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <HeartCrack className="w-20 h-20 text-slate-200 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">قائمة أمنياتك فارغة</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto font-medium">
            تصفح مجموعتنا الحصرية وأضف القطع التي تلامس ذوقك إلى قائمة أمنياتك لشرائها لاحقاً.
          </p>
          <Link 
            to="/store"
            className="inline-flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-amber-600/20 shadow-xl transition-all active:scale-95"
          >
            تصفح المنتجات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-6 h-full hover:shadow-md transition-shadow group"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center p-4">
                <img 
                  src={item.imageUrl || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80`} 
                  alt={item.name}
                  className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col flex-1 py-1 text-right">
                <div className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-1">{item.brand || 'ماركة حصرية'}</div>
                <h3 className="font-black text-slate-900 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors">{item.name}</h3>
                <div className="text-xl font-display font-black text-slate-900 mb-auto">
                  {typeof item.price === 'number' ? item.price.toLocaleString() : item.price} <span className="text-xs font-normal text-slate-400">ريال</span>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <Link 
                    to={`/product/${item.id}`}
                    className="flex-1 bg-slate-900 hover:bg-amber-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-sm font-bold shadow-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    عرض المنتج
                  </Link>
                  <button 
                    onClick={() => removeFromWishlist(item.id)}
                    className="p-3 border border-slate-200 text-slate-300 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-xl transition-all"
                    title="حذف من المفضلة"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
