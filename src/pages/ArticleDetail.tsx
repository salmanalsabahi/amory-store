import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Loader2, ArrowRight, User, Calendar } from 'lucide-react';

export function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'articles', id);
        let docSnap;
        try {
           docSnap = await getDoc(docRef);
        } catch (error: any) {
           if (error?.message?.includes('offline') || error?.code === 'unavailable') {
              const { getDocFromCache } = await import('firebase/firestore');
              docSnap = await getDocFromCache(docRef);
           } else {
              throw error;
           }
        }
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-32 pb-32 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="pt-32 pb-32 text-center">
        <h1 className="text-2xl font-bold mb-4">المقال غير موجود</h1>
        <Link to="/articles" className="text-rose-600 hover:underline">العودة إلى المقالات</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <Link to="/articles" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowRight className="w-4 h-4" />
        العودة للمقالات
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-6 text-sm text-slate-500 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(article.createdAt).toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {article.author || 'إدارة المتجر'}
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 mb-8 leading-tight">
          {article.title}
        </h1>

        {article.imageUrl && (
          <div className="rounded-3xl overflow-hidden mb-12 shadow-lg">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        )}

        <div className="prose prose-slate prose-lg max-w-none whitespace-pre-wrap leading-relaxed text-slate-700">
          {article.content}
        </div>
      </motion.div>
    </div>
  );
}
