import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { deleteDoc, addDoc, updateDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { Loader2, Plus, Edit2, Trash2, X, Shield } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { handleFirestoreError, OperationType } from '../../lib/firebaseErrorHandler';
import { auth } from '../../firebase';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { motion, AnimatePresence } from 'motion/react';

export function AdminServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  
  const [formData, setFormData] = useState({
    title: '',
    shortDesc: '',
    icon: 'Shield', // default icon name
    duration: '',
    results: '',
    benefits: '', // comma separated
    steps: '' // comma separated
  });

  useEffect(() => {
    const q = query(collection(db, 'services'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(docsData);
      setLoading(false);
    }, (error) => {
      console.error("Services fetch error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (docData?: any) => {
    if (docData) {
      setEditingId(docData.id);
      setFormData({
        ...docData,
        benefits: docData.benefits ? docData.benefits.join(', ') : '',
        steps: docData.steps ? docData.steps.join(', ') : ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', shortDesc: '', icon: 'Shield', duration: '', results: '', benefits: '', steps: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!isOnline) {
      alert("يجب الاتصال بالإنترنت لحفظ بيانات الخدمة.");
      return;
    }
    const dataToSave = {
      ...formData,
      benefits: formData.benefits.split(',').map(s => s.trim()).filter(s => s),
      steps: formData.steps.split(',').map(s => s.trim()).filter(s => s)
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'services', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'services'), dataToSave);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving service:", error);
      alert("حدث خطأ أثناء الحفظ.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    if (!isOnline) {
      alert("يجب الاتصال بالإنترنت لحذف البيانات.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'services', deleteId));
      setDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'services', auth);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">إدارة الخدمات</h1>
        <button onClick={() => handleOpenModal()} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> إضافة خدمة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">{service.shortDesc}</p>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <button onClick={() => handleOpenModal(service)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={() => setDeleteId(service.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{editingId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h2>
                  <p className="text-sm text-slate-500 font-medium">أدخل تفاصيل الخدمة التي ستقدمها للعملاء</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-3 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-2xl transition-all shadow-sm border border-slate-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-black text-slate-700 mr-1">اسم الخدمة</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all font-bold" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-black text-slate-700 mr-1">وصف قصير</label>
                    <textarea required rows={2} value={formData.shortDesc} onChange={e => setFormData({...formData, shortDesc: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all font-bold resize-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-black text-slate-700 mr-1">المدة المتوقعة</label>
                    <input type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-black text-slate-700 mr-1">النتائج المتوقعة</label>
                    <input type="text" value={formData.results} onChange={e => setFormData({...formData, results: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all font-bold" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-black text-slate-700 mr-1">الفوائد (مفصولة بفاصلة)</label>
                    <textarea rows={2} value={formData.benefits} onChange={e => setFormData({...formData, benefits: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all font-bold resize-none" placeholder="فائدة 1, فائدة 2..." />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-black text-slate-700 mr-1">خطوات الإجراء (مفصولة بفاصلة)</label>
                    <textarea rows={2} value={formData.steps} onChange={e => setFormData({...formData, steps: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all font-bold resize-none" placeholder="خطوة 1, خطوة 2..." />
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all">إلغاء</button>
                  <button type="submit" className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary-100 transition-all active:scale-95">حفظ وتأكيد</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف الخدمة"
        message="هل أنت متأكد من رغبتك في حذف هذه الخدمة نهائياً؟ سيتم إزالتها من قائمة الخدمات المتاحة للجمهور."
        confirmText="نعم، حذف الخدمة"
        cancelText="تراجع"
        variant="danger"
      />
    </div>
  );
}
