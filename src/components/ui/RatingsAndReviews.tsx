import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, limit, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, Trash2, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { cn } from '../../lib/utils';

interface Review {
  id: string;
  targetId: string;
  targetType: 'service' | 'product';
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface RatingsAndReviewsProps {
  targetId: string;
  targetTitle: string;
  targetType: 'service' | 'product';
  onRatingUpdate?: (average: number, count: number) => void;
}

export function RatingsAndReviews({ targetId, targetTitle, targetType, onRatingUpdate }: RatingsAndReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeReviews();
    };
  }, [targetId, targetType]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'يرجى تسجيل الدخول لترك تقييم.' });
      return;
    }
    if (!comment.trim()) {
      setMessage({ type: 'error', text: 'يرجى كتابة تعليق.' });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        targetId,
        targetType,
        userId: user.uid,
        userName: user.displayName || user.email || 'عميل',
        userPhoto: user.photoURL || null,
        rating,
        comment,
        status: 'approved', // Auto-approving for now as requested for "smooth user experience"
        createdAt: serverTimestamp()
      });

      setComment('');
      setRating(5);
      setMessage({ type: 'success', text: 'شكراً لك! تم إضافة تقييمك بنجاح.' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error("Error submitting review:", error);
      setMessage({ type: 'error', text: 'فشل إرسال التقييم. يرجى المحاولة مرة أخرى.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 0;

  useEffect(() => {
    if (onRatingUpdate) {
      onRatingUpdate(Number(averageRating), reviews.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [averageRating, reviews.length]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-12">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1 md:mb-2">تقييمات العملاء</h3>
          <p className="text-xs md:text-base text-slate-500">شاركونا تجاربكم مع {targetTitle}</p>
        </div>
        
        {reviews.length > 0 && (
          <div className="flex items-center gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm self-start md:self-auto">
            <div className="text-center">
              <span className="block text-2xl md:text-3xl font-black text-slate-900 leading-none">{averageRating}</span>
              <span className="text-[9px] md:text-[10px] text-slate-400 uppercase font-bold">من 5</span>
            </div>
            <div className="h-8 md:h-10 w-px bg-slate-100" />
            <div className="flex flex-col">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={cn(
                      "w-3.5 h-3.5 md:w-4 md:h-4", 
                      Number(averageRating) >= s ? "text-rose-500 fill-rose-500" : "text-slate-200"
                    )} 
                  />
                ))}
              </div>
              <span className="text-[10px] md:text-xs text-slate-500 mt-1 font-medium">{reviews.length} تقييم</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
        {/* Review Form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 border border-slate-100 sticky top-32">
            <h4 className="text-base md:text-lg font-bold text-slate-900 mb-4 md:mb-6">أضف تقييمك</h4>
            
            {user ? (
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 text-right">تقييمك</label>
                  <div className="flex items-center gap-2 justify-center py-4 bg-white rounded-2xl border border-slate-200">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star 
                          className={cn(
                            "w-8 h-8 transition-all",
                            rating >= s ? "text-rose-500 fill-rose-500" : "text-slate-200"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 text-right">رأيك يهمنا</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="اكتب تجربتك هنا..."
                    required
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none text-right"
                  />
                </div>

                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-xl flex items-center gap-3 text-sm font-bold shadow-sm",
                      message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                    )}
                  >
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-rose-600 text-white hover:bg-rose-700 p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  نشر التقييم
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 mb-6">يرجى تسجيل الدخول لتتمكن من إضافة تقييمك ومشاركة تجربتك.</p>
                <Link to="/profile" className="inline-block bg-rose-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-700 transition-all">تسجيل الدخول</Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-rose-600 opacity-20" />
            </div>
          ) : reviews.length === 0 ? null : (
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative group"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                          {review.userPhoto ? (
                            <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900">{review.userName}</h5>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star 
                                key={s} 
                                className={cn(
                                  "w-3.5 h-3.5", 
                                  review.rating >= s ? "text-rose-500 fill-rose-500" : "text-slate-100"
                                )} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-3 py-1 rounded-full">{review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString('ar-SA') : 'منذ قليل'}</span>
                        {user && (user.uid === review.userId || user.email === 'salmanalsabahi775@gmail.com') && (
                          <button 
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-slate-600 leading-relaxed text-right pr-6 border-r-4 border-slate-50 italic">
                      "{review.comment}"
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Link as RouterLink } from 'react-router-dom';
const Link = RouterLink;
