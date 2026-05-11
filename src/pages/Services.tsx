import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Star, Activity, CheckCircle2, HeartPulse, Loader2, WifiOff, Truck, Gift, Clock, ShieldCheck, Gem, Sparkles, Headphones, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { RatingsAndReviews } from '../components/ui/RatingsAndReviews';

const iconMap: Record<string, any> = {
  Shield, Star, Activity, CheckCircle2, HeartPulse, Truck, Gift, Clock, ShieldCheck, Gem, Sparkles, Headphones
};

const fixedFeatures = [
  {
    title: 'توصيل سريع وآمن',
    desc: 'نضمن وصول مشترياتك في أسرع وقت ممكن مع تغليف آمن وضمان كامل ومتابعة حية لشحنتك.',
    icon: Truck,
    color: 'text-rose-600',
    bg: 'bg-rose-50'
  },
  {
    title: 'تغليف هدايا ملكي',
    desc: 'خدمة تغليف استثنائية تناسب فخامة مشترياتكم، مع خيارات مخصصة للبطاقات والشرائط.',
    icon: Gift,
    color: 'text-rose-600',
    bg: 'bg-rose-50'
  },
  {
    title: 'ضمان الجودة المتناهي',
    desc: 'نفحص كل قطعة يدوياً قبل الشحن لضمان خلوها من أي عيوب ومطابقتها لأعلى المعايير.',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    title: 'استشارات متخصصة',
    desc: 'فريق من الخبراء جاهز لمساعدتكم في اختيار الساعة التي تناسب معصمكم أو العطر الذي يعبر عنكم.',
    icon: Headphones,
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  }
];

const expertiseSteps = [
  {
    title: 'الاختيار بعناية',
    desc: 'ننتقي أفضل الماركات العالمية والموديلات الحصرية التي تجمع بين الأصالة والعصرية.',
    icon: Gem
  },
  {
    title: 'فحص الدقة',
    desc: 'نخضع الساعات لفحوصات دقيقة للأداء، والعطور لاختبارات الثبات والانتشار.',
    icon: Clock
  },
  {
    title: 'تجربة فاخرة',
    desc: 'من اللحظة الأولى لدخولك متجرنا وحتى وصول المنتج إليك، نعدك برحلة تسوق لا تُنسى.',
    icon: Sparkles
  }
];

export function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const q = query(collection(db, 'services'));
    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
        setError(null);
      },
      error: (err) => {
        console.error("Error fetching services:", err);
        // We don't set loading to false here IF we want to show error state, 
        // but it's better to show the page with what we have (fixed features)
        setLoading(false);
      }
    });

    // Set a timeout to stop loading if it takes too long
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Show fixed content even if still loading from firebase, to avoid blank screen
  // if (loading) { ... } // Removing the blocking loading state

  return (
    <div className="bg-white min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 bg-rose-900 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center opacity-20 scale-110 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-rose-900 via-rose-900/80 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-widest mb-6 border border-rose-500/20">التميز هو معيارنا</span>
            <h1 className="text-4xl md:text-7xl font-display font-black text-white mb-8 leading-tight">
              خدمات تليق <br/> <span className="text-white">بأسلوب حياتكم</span>
            </h1>
            <p className="text-xl text-rose-100 max-w-2xl mx-auto leading-relaxed">
              في متجرنا، نؤمن بأن التجربة لا تنتهي بمجرد الشراء، بل تبدأ من هناك. اكتشف عالم العناية والرفاهية الذي نقدمه لعملائنا المميزين.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {fixedFeatures.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all group"
            >
              <div className={`w-16 h-16 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Expertise Journey Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-slate-50/50 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-6">رحلتنا في خدمتك</h2>
            <p className="text-slate-500 text-lg">نحن لا نبيع المنتجات فحسب، بل نقدم تجربة متكاملة مبنية على الدقة والشغف.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -z-10 hidden lg:block" />
            
            {expertiseSteps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 text-center hover:shadow-xl transition-all"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-rose-600 text-white rounded-full flex items-center justify-center font-bold text-xl border-4 border-white">
                  {idx + 1}
                </div>
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-8 mx-auto rotate-3 group-hover:rotate-0 transition-transform">
                  <step.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Services List */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-6">خدماتنا التخصصية</h2>
              <p className="text-slate-500 text-lg max-w-xl leading-relaxed">نقدم خدمات مخصصة ومدعومة بخبراء في عالم الساعات والعطور لضمان استدامة وجمال مقتنياتكم.</p>
            </div>
            {loading && (
              <div className="flex items-center gap-3 text-rose-600 bg-rose-50 px-4 py-2 rounded-full">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">جاري التحديث...</span>
              </div>
            )}
            <div className="h-px bg-slate-200 flex-grow hidden md:block mx-12 mb-6" />
          </div>

          {services.length === 0 && !loading ? (
            <div className="text-center py-12 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400">سيتم إضافة المزيد من الخدمات التخصصية قريباً...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => {
                const Icon = iconMap[service.icon] || Sparkles;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 h-full flex flex-col hover:border-rose-500/20 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[100px] -translate-y-8 translate-x-8 -z-10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      
                      <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-8 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <Icon className="w-10 h-10" />
                      </div>
                      
                      <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">{service.title}</h2>
                      <p className="text-slate-500 mb-10 leading-relaxed flex-grow">{service.shortDesc}</p>
                      
                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                        <Link 
                          to={`/contact?subject=${encodeURIComponent(service.title)}`} 
                          className="inline-flex items-center gap-2 font-bold text-rose-700 hover:text-rose-800 transition-colors text-sm"
                        >
                          طلب الخدمة
                          <motion.span 
                            animate={{ x: [0, 3, 0] }} 
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >→</motion.span>
                        </Link>
                        
                        <button
                          onClick={() => setSelectedService(service)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          اراء العملاء
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Reviews Modal/Overlay */}
      <AnimatePresence>
        {selectedService && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedService(null)}
                className="absolute top-8 left-8 p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors z-10"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
              
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                    {(() => {
                      const Icon = iconMap[selectedService.icon] || Sparkles;
                      return <Icon className="w-10 h-10" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-black text-slate-900 mb-2">{selectedService.title}</h2>
                    <p className="text-slate-500 font-medium">تقييمات وآراء العملاء حول هذه الخدمة</p>
                  </div>
                </div>

                <RatingsAndReviews 
                  targetId={selectedService.id} 
                  targetTitle={selectedService.title} 
                  targetType="service"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-rose-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-8 relative z-10">هل لديك استفسار محدد؟</h2>
            <p className="text-rose-100 text-lg mb-12 max-w-2xl mx-auto relative z-10 leading-relaxed">فريقنا يسعد دائماً بالإجابة على تساؤلاتك ومساعدتك في الحصول على تجربة تسوق استثنائية.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
              <Link to="/contact" className="px-10 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-rose-900/20">تحدث إلينا</Link>
              <a href={`tel:${process.env.VITE_PHONE || '+967...'}`} className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/10 transition-all backdrop-blur-sm">اتصال مباشر</a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
