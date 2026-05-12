import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, serverTimestamp } from 'firebase/firestore';
import { setDoc, deleteDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { Plus, Trash2, Edit2, Ticket, Loader2, X } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/firebaseErrorHandler';
import { auth } from '../../firebase';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { motion, AnimatePresence } from 'motion/react';

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ id: '', code: '', discountPercentage: 10, active: true });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const qs = await getDocs(query(collection(db, 'coupons')));
      setCoupons(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ id: '', code: '', discountPercentage: 10, active: true });
    setShowModal(true);
  };

  const handleEdit = (coupon: any) => {
    setFormData({ ...coupon, id: coupon.id });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if(!deleteId) return;
    try {
      await deleteDoc(doc(db, 'coupons', deleteId));
      setCoupons(coupons.filter(c => c.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'coupons', auth);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docId = formData.id || Math.random().toString(36).substring(2, 10);
      const couponData = {
        code: formData.code.toUpperCase(),
        discountPercentage: Number(formData.discountPercentage),
        active: formData.active,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'coupons', docId), couponData, { merge: true });
      
      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">إدارة الكوبونات</h1>
          <p className="text-sm md:text-base text-slate-500">إضافة وتعديل كوبونات الخصم والتي ستظهر في أعلى الموقع إذا كانت مفعلة</p>
        </div>
        <button 
          onClick={handleCreate}
          className="w-full md:w-auto bg-rose-700 hover:bg-rose-800 text-white px-4 py-3 md:py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة كوبون
        </button>
      </div>

      <div className="bg-transparent md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-200 md:overflow-hidden">
        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="py-8 text-center text-slate-500">جاري التحميل...</div>
          ) : coupons.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-medium">لا توجد كوبونات، أضف كوبونك الأول</div>
          ) : coupons.map(coupon => (
             <div key={coupon.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 tracking-widest">{coupon.code}</div>
                  <div className="text-rose-600 font-black mt-1">خصم {coupon.discountPercentage}%</div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                     {coupon.active ? 'نشط' : 'غير نشط'}
                   </span>
                   <div className="flex items-center gap-1 mt-1">
                     <button onClick={() => handleEdit(coupon)} className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                     <button onClick={() => setDeleteId(coupon.id)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
             </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">الكود</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">نسبة الخصم</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">الحالة</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">جاري التحميل...</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">لا توجد كوبونات، أضف كوبونك الأول</td>
              </tr>
            ) : coupons.map(coupon => (
              <tr key={coupon.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-slate-900">{coupon.code}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-rose-600 font-bold">{coupon.discountPercentage}%</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {coupon.active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(coupon)} className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors group"><Edit2 className="w-5 h-5 group-hover:scale-110 transition-transform" /></button>
                    <button onClick={() => setDeleteId(coupon.id)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors group"><Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden relative shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-black text-slate-900">إعداد الكوبون</h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">أدخل الكود ونسبة الخصم الخاصة بالعرض</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-black text-slate-700 mr-1">كود الخصم (Code)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition-all font-black uppercase text-center text-lg tracking-widest bg-slate-50/30"
                    placeholder="ELEGANCE10"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-black text-slate-700 mr-1">نسبة الخصم (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required min="1" max="100"
                      value={formData.discountPercentage}
                      onChange={e => setFormData({...formData, discountPercentage: Number(e.target.value)})}
                      className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition-all font-black text-center text-lg pr-12"
                    />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">%</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.active}
                      onChange={e => setFormData({...formData, active: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                  <span className="text-sm font-black text-slate-700">تفعيل العرض في الموقع</span>
                </div>

                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-rose-700 hover:bg-rose-800 text-white rounded-2xl py-4 font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-100 active:scale-95 disabled:opacity-70"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Ticket className="w-5 h-5" /> حفظ البيانات</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف الكوبون"
        message="هل أنت متأكد من رغبتك في حذف هذا الكوبون؟ لن يتمكن العملاء من استخدامه بعد الآن."
        confirmText="نعم، حذف"
        cancelText="إلغاء والتراجع"
        variant="danger"
      />
    </div>
  );
}
