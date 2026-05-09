import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { setDoc, deleteDoc, addDoc } from '../../lib/safeFirestore';
import { db, auth } from '../../firebase';
import { Grid, Plus, Trash2, Edit2, Loader2, X, Save, Database, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../../lib/firebaseErrorHandler';
import { seedInitialData } from '../../lib/seedData';
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
    if (!window.confirm('هل تريد إضافة الأصناف والمنتجات الافتراضية؟')) return;
    setSeeding(true);
    try {
      await seedInitialData();
      alert('تمت إضافة البيانات بنجاح');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إضافة البيانات');
    } finally {
      setSeeding(false);
    }
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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">إدارة الأصناف</h1>
        <div className="flex gap-4">
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-900 disabled:opacity-50 transition-all"
          >
            {seeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
            إضافة بيانات تجريبية
          </button>
          <button 
            onClick={() => { setName(''); setEditingId(null); setIsModalOpen(true); }}
            className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-amber-700"
          >
            <Plus className="w-5 h-5" /> إضافة صنف جديد
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
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
                <td className="py-4 font-bold">{cat.name}</td>
                <td className="py-4 flex justify-center gap-2">
                  <button onClick={() => openEdit(cat)} className="text-amber-600 p-2 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 className="w-5 h-5"/></button>
                  <button onClick={() => setDeleteId(cat.id)} className="text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Grid className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">{editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h2>
                <p className="text-slate-500 font-medium">أدخل اسم الصنف لتنظيم منتجات متجرك</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2 mr-1">اسم الصنف</label>
                   <input 
                     type="text" value={name} onChange={e => setName(e.target.value)}
                     className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-50 transition-all font-bold" 
                     required placeholder="مثال: عطور رجالية"
                   />
                 </div>
                 <button 
                   type="submit" 
                   disabled={submitting}
                   className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-amber-700 shadow-xl shadow-amber-100 disabled:opacity-70 active:scale-95 transition-all"
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
