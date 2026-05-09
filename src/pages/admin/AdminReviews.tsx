import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { updateDoc, deleteDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trash2, CheckCircle2, XCircle, Clock, Loader2, MessageSquare, Filter, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'service' | 'product'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { status });
    } catch (error) {
      console.error("Error updating review status:", error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التقييم نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const typeMatch = typeFilter === 'all' || review.targetType === typeFilter;
    const statusMatch = statusFilter === 'all' || review.status === statusFilter;
    return typeMatch && statusMatch;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
      <LoadingSpinner size="lg" label="جاري تحميل التقييمات وآراء العملاء..." />
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">إدارة التقييمات</h1>
          <p className="text-slate-500">مراجعة والتحكم في آراء العملاء المنشورة في الموقع.</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 outline-none"
            >
              <option value="all">جميع الأنواع</option>
              <option value="service">الخدمات</option>
              <option value="product">المنتجات</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 outline-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">معلق</option>
              <option value="approved">مقبول</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-200">
            <MessageSquare className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-800">لا توجد تقييمات حالياً</h3>
            <p className="text-slate-400">سيظهر هنا أي تقييم يضيفه العملاء على المنتجات أو الخدمات.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                      {review.userPhoto ? (
                        <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-slate-300">{review.userName[0]}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{review.userName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                          review.targetType === 'service' ? "bg-teal-50 text-teal-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {review.targetType === 'service' ? 'خدمة' : 'منتج'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">#{review.targetId.slice(-5)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("w-4 h-4", review.rating >= s ? "text-amber-500 fill-amber-500" : "text-slate-100")} />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleString('ar-SA') : 'الآن'}
                    </span>
                  </div>
                </div>

                <div className="mb-8 p-6 bg-slate-50 rounded-3xl text-right relative italic text-slate-600">
                  <span className="absolute top-2 right-2 text-slate-200 text-4xl leading-none">"</span>
                  {review.comment}
                  <span className="absolute bottom-2 left-2 text-slate-200 text-4xl leading-none rotate-180">"</span>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold",
                      review.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                      review.status === 'rejected' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {review.status === 'approved' ? <ShieldCheck className="w-3.5 h-3.5" /> : 
                       review.status === 'rejected' ? <ShieldAlert className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {review.status === 'approved' ? 'مقبول' : review.status === 'rejected' ? 'مرفوض' : 'يطلب المراجعة'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {review.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(review.id, 'approved')}
                        className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                        title="قبول التقييم"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(review.id, 'rejected')}
                        className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                        title="رفض التقييم"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                      title="حذف نهائي"
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
    </div>
  );
}
