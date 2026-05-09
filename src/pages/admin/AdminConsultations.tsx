import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, orderBy } from 'firebase/firestore';
import { deleteDoc, updateDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { Loader2, Trash2, Phone, Clock, User, Calendar, MessageSquare, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export function AdminConsultations() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'consultations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConsultations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'consultations', deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleStatusChange = async (id: string, currentStatus: string, userId?: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await updateDoc(doc(db, 'consultations', id), { status: nextStatus });
      
      if (userId && nextStatus === 'completed') {
         const { addDoc } = await import('firebase/firestore');
         await addDoc(collection(db, 'notifications'), {
            message: `تم الانتهاء من استشارتك بنجاح. شكراً لثقتك بنا.`,
            userId: userId,
            isAdmin: false,
            read: false,
            createdAt: new Date().toISOString(),
            type: 'consultation'
         });
      }
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin w-10 h-10 text-teal-600" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">طلبات الاستشارات</h1>
          <p className="text-slate-500 font-medium mt-1">عرض وإدارة الحجوزات القادمة من العملاء</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
          <span className="text-slate-400 font-bold">إجمالي الطلبات:</span>
          <span className="text-2xl font-black text-teal-600">{consultations.length}</span>
        </div>
      </div>

      {consultations.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">لا يوجد طلبات استشارة بعد</h3>
          <p className="text-slate-400 mt-2 font-medium">ستظهر الطلبات الجديدة هنا بمجرد قيام العملاء بالحجز</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {consultations.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border-2 overflow-hidden relative ${
                  c.status === 'completed' ? 'border-emerald-100' : 'border-white'
                }`}
              >
                {c.status === 'completed' && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 text-[10px] font-black rounded-bl-xl flex items-center gap-1.5 z-10">
                    <CheckCircle2 className="w-3 h-3" /> تم التواصل
                  </div>
                )}

                <div className="space-y-6">
                  {/* Client Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black">
                        {c.fullName?.charAt(0) || <User />}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 truncate max-w-[150px]">{c.fullName || c.name || 'عميل مجهول'}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mt-0.5">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setDeleteId(c.id)}
                      className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Consultation Details */}
                  <div className="space-y-3 bg-slate-50/50 rounded-2xl p-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="font-black text-slate-600">{c.serviceType || 'استشارة عامة'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-bold text-slate-500">{c.date || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-bold text-slate-500">{c.time || 'غير محدد'}</span>
                    </div>
                    {c.subject && (
                      <div className="flex items-center gap-3 text-sm border-t border-slate-100 pt-2 mt-2">
                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">الغرض</span>
                          <span className="font-bold text-slate-600 leading-tight">{c.subject}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {(c.notes || c.details) && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" /> تفاصيل الطلب
                      </label>
                      <p className="text-xs font-medium text-slate-600 bg-teal-50/30 p-3 rounded-xl border border-teal-50 leading-relaxed italic max-h-24 overflow-y-auto">
                        {c.notes || c.details}
                      </p>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={() => handleStatusChange(c.id, c.status, c.userId)}
                      className={`flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                        c.status === 'completed' 
                          ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                      }`}
                    >
                      {c.status === 'completed' ? (
                        <>تراجع عن الإكمال</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" /> وضع كـ مكتمل</>
                      )}
                    </button>
                    <a 
                      href={`tel:${c.phone}`}
                      className="w-12 h-12 bg-white border-2 border-slate-100 text-slate-400 hover:text-teal-600 hover:border-teal-100 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف الطلب"
        message="هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف الآن"
        cancelText="تراجع"
        variant="danger"
      />
    </div>
  );
}
