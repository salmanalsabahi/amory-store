import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function Articles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, 'articles'), where('active', '==', true), orderBy('createdAt', 'desc'));
        let qs;
        try {
           qs = await getDocs(q);
        } catch (error: any) {
           if (error?.message?.includes('offline') || error?.code === 'unavailable') {
              const { getDocsFromCache } = await import('firebase/firestore');
              qs = await getDocsFromCache(q);
           } else {
              throw error;
           }
        }
        setArticles(qs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <div className="pt-32 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-display font-bold text-slate-900 mb-4"
        >
          المقالات والمدونة
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-600 max-w-2xl mx-auto"
        >
          اكتشف أحدث المقالات والنصائح وكل ما يخص عالم الأناقة
        </motion.p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 min-h-[50vh]">
          <LoadingSpinner size="lg" label="جاري جلب أحدث المقالات والنصائح..." />
        </div>
      ) : articles.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-16 rounded-[3rem] border border-slate-100 shadow-sm text-center flex flex-col items-center max-w-2xl mx-auto"
        >
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-8">
            <ArrowLeft className="w-12 h-12 text-amber-600 rotate-90" />
          </div>
          <h3 className="text-3xl font-display font-bold text-slate-800 mb-4">مدونتنا قيد التجهيز</h3>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed">
            نحن حالياً في طور كتابة مقالات ملهمة تليق بتطلعاتكم. قريباً ستجدون هنا نصيحة الخبراء وكل ما يخص عالم الساعات الفاخرة.
          </p>
          <Link to="/" className="text-amber-600 font-bold hover:underline">
            العودة للرئيسية
          </Link>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group flex flex-col"
            >
              <Link to={`/article/${article.id}`} className="block h-64 overflow-hidden relative">
                <img 
                  src={article.imageUrl || `https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&q=80`} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-sm text-amber-600 font-medium mb-3">
                  {new Date(article.createdAt).toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <Link to={`/article/${article.id}`}>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </Link>
                <p className="text-slate-600 line-clamp-3 mb-6">
                  {article.content.substring(0, 150)}...
                </p>
                
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-700">الكُتّاب: {article.author || 'إدارة المتجر'}</div>
                  <Link 
                    to={`/article/${article.id}`}
                    className="flex items-center gap-2 text-amber-600 font-medium hover:text-amber-700 transition-colors"
                  >
                    اقرأ المزيد <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
