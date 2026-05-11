import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc } from 'firebase/firestore';
import { setDoc, deleteDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { Package as PackageIcon, Search, Trash2, Edit2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export function AdminPackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    price: '',
    description: ''
  });

  const fetchPackages = async () => {
    setLoading(true);
    const qs = await getDocs(query(collection(db, 'packages')));
    setPackages(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const packageRef = editingPackage 
        ? doc(db, 'packages', editingPackage.id)
        : doc(collection(db, 'packages'));
      
      await setDoc(packageRef, {
        ...formData,
        price: Number(formData.price),
        updatedAt: new Date()
      }, { merge: true });

      setIsModalOpen(false);
      setEditingPackage(null);
      setFormData({ title: '', subtitle: '', price: '', description: '' });
      fetchPackages();
    } catch (error) {
      console.error("Error saving package:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
      await deleteDoc(doc(db, 'packages', id));
      fetchPackages();
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const lowerQuery = searchQuery.toLowerCase();
    return pkg.title?.toLowerCase().includes(lowerQuery) || 
           pkg.subtitle?.toLowerCase().includes(lowerQuery);
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
      <LoadingSpinner size="lg" label="جاري استدعاء قائمة الباقات..." />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">إدارة الباقات</h1>
          <p className="text-slate-500">إضافة وتعديل وحذف باقات الهدايا</p>
        </div>
        <button 
          onClick={() => {
            setEditingPackage(null);
            setFormData({ title: '', subtitle: '', price: '', description: '' });
            setIsModalOpen(true);
          }}
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة باقة جديدة
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h2 className="text-xl font-black text-slate-900 mb-6 border-r-4 border-rose-500 pr-3">
              {editingPackage ? 'تعديل باقة هدايا' : 'تصميم باقة جديدة'}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 text-right">عنوان الباقة (مثلاً: الباقة الملكية)</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-right font-bold transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 text-right">وصف إهداء مختصر</label>
                <input
                  type="text"
                  required
                  value={formData.subtitle}
                  onChange={e => setFormData({...formData, subtitle: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-right font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 text-right">السعر (ريال)</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-right font-bold transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 text-right">ماذا تتضمن الباقة؟</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-right h-24 font-medium transition-all resize-none"
                  placeholder="ساعة فاخرة + عطر فرنسي + صندوق مخملي..."
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold transition-all active:scale-95"
                >
                  حفظ الباقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-50 bg-slate-50/30">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم الباقة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-rose-500/20 transition-all text-right font-medium"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">الباقة</th>
                <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">السعر المطلق</th>
                <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-20 text-center text-slate-400 font-bold">لا توجد باقات هدايا مسجلة</td>
                </tr>
              ) : filteredPackages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100 shadow-sm">
                        <PackageIcon className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 mb-0.5">{pkg.title}</div>
                        <div className="text-xs text-slate-500 font-bold">{pkg.subtitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-black text-rose-600">{pkg.price.toLocaleString()} ريال</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => {
                          setEditingPackage(pkg);
                          setFormData({
                            title: pkg.title || '',
                            subtitle: pkg.subtitle || '',
                            price: pkg.price?.toString() || '',
                            description: pkg.description || ''
                          });
                          setIsModalOpen(true);
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(pkg.id)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
