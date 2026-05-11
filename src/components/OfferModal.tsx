import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, ShoppingBag, Tag } from 'lucide-react';
import { cn } from '../lib/utils';

export function OfferModal({ offer, onClose, onClaim, bookingLoading }: { 
  offer: any, 
  onClose: () => void, 
  onClaim: (offer: any) => void,
  bookingLoading: string | null
}) {
  return (
    <AnimatePresence>
      {offer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[3rem] overflow-hidden shadow-2xl relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 z-10 p-3 bg-white/80 rounded-full hover:bg-white transition-colors shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative h-64 md:h-96 bg-slate-100">
              <img 
                src={offer.imageUrl || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80'} 
                alt={offer.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-6 right-6">
                <div className="bg-rose-500 text-slate-950 font-black px-4 py-2 rounded-2xl shadow-xl border border-white/20">
                  -{offer.discount}% خصم
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm uppercase tracking-widest mb-4">
                <Clock className="w-4 h-4" /> عرض لفترة محدودة
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 mb-6">{offer.title}</h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">{offer.description}</p>
              
              <button
                onClick={() => onClaim(offer)}
                disabled={bookingLoading === offer.id}
                className="w-full bg-rose-600 text-white hover:bg-rose-700 px-8 py-5 rounded-2xl font-black text-lg hover:text-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-xl shadow-slate-900/20"
              >
                {bookingLoading === offer.id ? (
                  <span className="animate-pulse">جاري الطلب...</span>
                ) : (
                  <>اغتنم العرض الآن <ShoppingBag className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
