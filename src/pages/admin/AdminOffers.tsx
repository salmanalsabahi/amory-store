import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Edit2, X } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

import { compressImage } from '../../utils/imageUtils';

export function AdminOffers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    discount: 0, 
    imageUrl: '', 
    active: true 
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const compressedImage = await compressImage(file);
      setFormData({...formData, imageUrl: compressedImage});
    } catch (error) {
      console.error("Error compressing image:", error);
      alert("حدث خطأ أثناء معالجة الصورة. يرجى المحاولة بصورة أخرى.");
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'offers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Offers fetch error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (offer?: any) => {
    if (offer) {
      setEditingId(offer.id);
      setFormData({ ...offer });
    } else {
      setEditingId(null);
      setFormData({ title: '', description: '', discount: 0, imageUrl: '', active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'offers', editingId), formData);
      } else {
        await addDoc(collection(db, 'offers'), formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving offer:", error);
      alert("حدث خطأ أثناء الحفظ.");
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await updateDoc(doc(db, 'offers', id), { active: !active });
  };

  const deleteOffer = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العرض؟")) {
      await deleteDoc(doc(db, 'offers', id));
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
      <LoadingSpinner size="lg" label="جاري تحميل العروض..." />
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">إدارة العروض والتخفيضات</h1>
        <button onClick={() => handleOpenModal()} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" /> إضافة عرض
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(offer => (
          <div key={offer.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            {offer.imageUrl && <img src={offer.imageUrl || undefined} alt={offer.title} className="w-full h-40 object-cover" />}
            <div className="p-6 flex-1 flex flex-col gap-3">
              <h3 className="font-bold text-lg">{offer.title}</h3>
              <p className="text-slate-600 text-sm flex-1">{offer.description}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <span className="font-bold text-primary-600">{offer.discount}% خصم</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(offer.id, offer.active)} className="text-slate-500 p-1">
                    {offer.active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button onClick={() => handleOpenModal(offer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => deleteOffer(offer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'تعديل العرض' : 'إضافة عرض جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">عنوان العرض</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نسبة الخصم (%)</label>
                <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">صورة العرض</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-0" />
                {formData.imageUrl && <img src={formData.imageUrl || undefined} alt="Preview" className="mt-2 h-20 rounded-lg" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">وصف العرض</label>
                <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-0 resize-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">إلغاء</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
