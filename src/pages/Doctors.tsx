import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Clock, Calendar, Loader2, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function Doctors() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // If we go offline, we don't necessarily want to unsubscribe, 
    // but the UI will handle it via isOnline check.
    const q = query(collection(db, 'doctors'));
    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        setDoctors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
        setError(null);
      },
      error: (err) => {
        console.error("Error fetching doctors:", err);
        setError("نعتذر، تعذر جلب البيانات. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  // If we are offline and have no data, show the offline data message
  if (!isOnline && doctors.length === 0) {
    return (
      <div className="pt-32 pb-20 bg-slate-50 min-h-screen flex items-center justify-center px-4 text-center">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 max-w-lg mx-auto">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-600 mx-auto">
            <WifiOff className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">المعذرة، أنت خارج التغطية</h2>
          <p className="text-slate-600 mb-8 text-lg leading-relaxed">
            نعتذر منك جداً، لا نستطيع عرض بيانات الأطباء بدون إنترنت حالياً. يرجى التكرم بالاتصال بالشبكة لرؤية كادرنا الطبي المتميز.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-button-gradient text-white px-10 py-3.5 rounded-2xl font-bold text-lg hover:shadow-xl transition-all active:scale-95 shadow-lg shadow-primary-600/20"
          >
            جرب مرة ثانية
          </button>
        </div>
      </div>
    );
  }

  if (error && doctors.length === 0) {
    return (
      <div className="pt-32 pb-20 bg-slate-50 min-h-screen flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-red-100 max-w-md mx-auto">
          <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">تعذر جلب البيانات</h2>
          <p className="text-slate-600">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-500 transition-colors">
            حاول مرة أخرى
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">تعرف على فريقنا الخبير</h1>
          <p className="text-lg text-slate-600">
            يكرس المتخصصون ذوو المهارات العالية لدينا جهودهم لتزويدك بأفضل رعاية ممكنة في بيئة مريحة ومرحبة.
          </p>
        </div>

        {doctors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <p className="text-slate-500 text-lg">لا يوجد أطباء مضافين حالياً. يرجى المراجعة لاحقاً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {doctors.map((doctor, index) => (
              <motion.div 
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col sm:flex-row group"
              >
                <div className="sm:w-2/5 h-64 sm:h-auto relative overflow-hidden">
                  <img 
                    src={doctor.image || undefined} 
                    alt={doctor.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent sm:hidden" />
                </div>
                
                <div className="p-6 sm:p-8 sm:w-3/5 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">{doctor.name}</h3>
                    <p className="text-primary-600 font-medium text-sm">{doctor.role}</p>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-700">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="font-bold">{doctor.rating || 5.0}</span>
                      <span className="text-slate-400">({doctor.reviews || 0})</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <div className="flex items-center gap-1 text-slate-700">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{doctor.experience || 'غير محدد'}</span>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm mb-6 line-clamp-3">
                    {doctor.bio}
                  </p>

                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(doctor.specialties || []).slice(0, 2).map((spec: string, i: number) => (
                        <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                    
                    <Link 
                      to={`/book?doctor=${encodeURIComponent(doctor.name)}`}
                      className="flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-primary-50 text-slate-900 hover:text-primary-700 border border-slate-200 hover:border-primary-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <Calendar className="w-4 h-4" /> احجز مع {doctor.name.split(' ')[1] || doctor.name}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
