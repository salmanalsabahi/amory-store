import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { setDoc, deleteDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { FileText, Search, Trash2, Edit2, Plus, Loader2, Image as ImageIcon, ToggleRight, ToggleLeft, X } from 'lucide-react';

export function AdminArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    author: '',
    active: true
  });

  const fetchArticles = async () => {
    const qs = await getDocs(query(collection(db, 'articles'), orderBy("createdAt", "desc")));
    setArticles(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = async (id: string) => {
    if(!window.confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    try {
      await deleteDoc(doc(db, 'articles', id));
      setArticles(articles.filter(a => a.id !== id));
    } catch (error) {
      console.error(error);
      alert('حدث خطأ');
    }
  }

  const handleOpenModal = (article?: any) => {
    if (article) {
      setEditingId(article.id);
      setFormData({
        title: article.title,
        content: article.content,
        imageUrl: article.imageUrl || '',
        author: article.author || '',
        active: article.active
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', content: '', imageUrl: '', author: '', active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    
    setSaving(true);
    try {
      const docRef = doc(collection(db, 'articles'), editingId || crypto.randomUUID());
      const now = serverTimestamp();
      
      const categoryData = {
        title: formData.title,
        content: formData.content,
        imageUrl: formData.imageUrl,
        author: formData.author,
        active: formData.active,
        updatedAt: now,
        ...(editingId ? {} : { createdAt: now })
      };
      
      await setDoc(docRef, categoryData, { merge: true });
      await fetchArticles();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving article:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await setDoc(doc(db, 'articles', id), { active: !current }, { merge: true });
      setArticles(articles.map(a => a.id === id ? { ...a, active: !current } : a));
    } catch (error) {
      console.error("Error toggling active status", error);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">إدارة المقالات</h1>
          <p className="text-sm md:text-base text-slate-500">إضافة وتعديل مدونات ومقالات الموقع</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto bg-slate-900 text-white px-4 py-3 md:py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة مقال
        </button>
      </div>

      <div className="bg-transparent md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-200 md:overflow-hidden">
        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="py-8 text-center text-slate-500">جاري التحميل...</div>
          ) : articles.length === 0 ? (
            <div className="py-8 text-center text-slate-500">لا توجد مقالات حاليا</div>
          ) : articles.map(article => (
            <div key={article.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex flex-shrink-0 items-center justify-center overflow-hidden">
                  {article.imageUrl ? <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 line-clamp-1">{article.title}</div>
                  <div className="text-xs text-slate-500 mt-1 truncate">{article.author || 'إدارة المتجر'}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{article.createdAt ? new Date(article.createdAt?.seconds ? article.createdAt.toDate() : article.createdAt).toLocaleDateString('ar-YE') : '-'}</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">الحالة:</span>
                  <button onClick={() => toggleActive(article.id, article.active)} className="p-1">
                    {article.active ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenModal(article)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(article.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">المقال</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الكاتب</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">التاريخ</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الحالة</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">جاري التحميل...</td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">لا توجد مقالات حاليا</td>
                </tr>
              ) : articles.map(article => (
                <tr key={article.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 p-1 flex items-center justify-center overflow-hidden shrink-0">
                        {article.imageUrl ? <img src={article.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1">{article.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{article.author || 'إدارة المتجر'}</td>
                  <td className="px-6 py-4 text-slate-600">{article.createdAt ? new Date(article.createdAt?.seconds ? article.createdAt.toDate() : article.createdAt).toLocaleDateString('ar-YE') : '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(article.id, article.active)} className="p-1">
                      {article.active ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenModal(article)} className="text-slate-400 hover:text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(article.id)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'تعديل المقال' : 'مقال جديد'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-500 p-2 rounded-full hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto w-full">
              <form id="article-form" onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">عنوان المقال *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">اسم الكاتب (اختياري)</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={e => setFormData({...formData, author: e.target.value})}
                    placeholder="سيظهر كـ 'إدارة المتجر' اذا تم تركه فارغاً"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">صورة الغلاف (رابط URL)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-left"
                    dir="ltr"
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">محتوى المقال *</label>
                  <textarea
                    required
                    rows={8}
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none"
                    placeholder="اكتب محتوى المقال هنا..."
                  ></textarea>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-sm">حالة النشر</div>
                    <div className="text-xs text-slate-500">هل تريد نشر هذا المقال ليراه العملاء فوراً؟</div>
                  </div>
                  <button type="button" onClick={() => setFormData({...formData, active: !formData.active})}>
                    {formData.active ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 mt-auto shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                disabled={saving}
              >
                إلغاء
              </button>
              <button 
                type="submit"
                form="article-form"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {editingId ? 'حفظ التعديلات' : 'إضافة المقال'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
