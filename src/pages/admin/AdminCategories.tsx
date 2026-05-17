import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { setDoc, deleteDoc, addDoc } from '../../lib/safeFirestore';
import { db, auth } from '../../firebase';
import { Grid, Plus, Trash2, Edit2, Loader2, X, Save, Database, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../../lib/firebaseErrorHandler';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories', auth));
    return () => unsubscribe();
  }, []);

  const handleSeed = async () => {
    alert('This feature has been disabled.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await setDoc(doc(db, 'categories', editingId), { name });
      } else {
        await addDoc(collection(db, 'categories'), { name });
      }
      setIsModalOpen(false);
      setName('');
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'categories', auth);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'categories', deleteId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'categories', auth);
    }
  };

  const openEdit = (category: any) => {
    setEditingId(category.id);
    setName(category.name);
    setIsModalOpen(true);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">إدارة الأصناف</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="flex-1 md:flex-none bg-slate-800 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 disabled:opacity-50 transition-all text-sm md:text-base"
          >
            {seeding ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Database className="w-4 h-4 md:w-5 md:h-5" />}
            <span className="hidden md:inline">إضافة بيانات تجريبية</span>
            <span className="md:hidden">تجريبية</span>
          </button>
          <button 
            onClick={() => { setName(''); setEditingId(null); setIsModalOpen(true); }}
            className="flex-1 md:flex-none bg-rose-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-700 text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" /> إضافة صنف
          </button>
        </div>
      </div>

      <div className="bg-transparent md:bg-white md:rounded-3xl md:shadow-sm md:border md:border-slate-100 md:p-6">
        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="font-bold text-slate-900">{cat.name}</div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEdit(cat)} className="text-slate-500 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                <button onClick={() => setDeleteId(cat.id)} className="text-rose-500 p-2 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          ))}
          {categories.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-500">لا توجد أصناف</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="text-slate-500 text-sm">
                <th className="text-right py-4">اسم الصنف</th>
                <th className="text-center py-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td className="py-4 font-bold text-slate-900">{cat.name}</td>
                  <td className="py-4 flex justify-center gap-2">
                    <button onClick={() => openEdit(cat)} className="text-slate-500 p-2 hover:bg-slate-50 rounded-lg transition-colors"><Edit2 className="w-5 h-5"/></button>
                    <button onClick={() => setDeleteId(cat.id)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-md relative shadow-2xl"
             >
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
               >
                 <X className="w-5 h-5" />
               </button>

               <div className="text-center mb-8">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Grid className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">{editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h2>
                <p className="text-slate-500 font-medium">أدخل اسم الصنف لتنظيم منتجات متجرك</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">اسم الصنف</label>
                   <input 
                     type="text" value={name} onChange={e => setName(e.target.value)}
                     className="w-full p-4 rounded-2xl border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition-all font-bold" 
                     required placeholder="مثال: عطور رجالية"
                   />
                 </div>
                 <button 
                   type="submit" 
                   disabled={submitting}
                   className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-rose-700 shadow-xl shadow-rose-100 disabled:opacity-70 active:scale-95 transition-all"
                 >
                   {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> حفظ التغييرات</>}
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
        title="حذف الصنف"
        message="هل أنت متأكد من رغبتك في حذف هذا الصنف؟ قد يؤدي ذلك إلى تأثر ظهور المنتجات المرتبطة به."
        confirmText="نعم، احذف"
        cancelText="تراجع"
        variant="danger"
      />
    </div>
  );
}
