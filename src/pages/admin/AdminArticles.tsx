import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FileText, Search, Trash2, Edit2, Plus, Loader2, Image as ImageIcon } from 'lucide-react';

export function AdminArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick implementation. In a real app this would have a modal or separate page for creation/editing
  
  useEffect(() => {
    const fetchArticles = async () => {
      const qs = await getDocs(query(collection(db, 'articles')));
      setArticles(qs.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">إدارة المقالات</h1>
          <p className="text-slate-500">إضافة وتعديل مدونات ومقالات الموقع</p>
        </div>
        <button 
          onClick={() => alert("في النسخة الكاملة سيتم فتح نافذة لاضافة مقال جديد")}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة مقال
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
                <td className="px-6 py-4 text-slate-600">{article.createdAt ? new Date(article.createdAt).toLocaleDateString('ar-YE') : '-'}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${article.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {article.active ? 'منشور' : 'مسودة'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => alert("تعديل: " + article.title)} className="text-slate-400 hover:text-amber-500 p-1"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(article.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
