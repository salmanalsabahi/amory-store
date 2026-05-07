import { useSiteSettings } from '../hooks/useSiteSettings';
import { Loader2, Target, Eye, Award, ShieldCheck, Heart, Users, TrendingUp, Sparkles, Gem, Watch } from 'lucide-react';
import { motion } from 'motion/react';

const stats = [
  { id: 1, label: 'سنة من الخبرة', value: '10+', icon: Award },
  { id: 2, label: 'عميل مميز', value: '2000+', icon: Users },
  { id: 3, label: 'قطعة حصرية', value: '500+', icon: TrendingUp },
  { id: 4, label: 'علامة تجارية', value: '15+', icon: Target },
];

const values = [
  {
    title: 'الأصالة والفخامة',
    description: 'نلتزم بتوفير أجود أنواع الساعات الأصلية والعطور الفاخرة من أرقى دور الموضة العالمية.',
    icon: Sparkles,
    color: 'bg-amber-50 text-amber-600'
  },
  {
    title: 'الدقة والموثوقية',
    description: 'نحن نؤمن بأن الوقت أغلى ما تملكه، لذا نحرص على تقديم أفضل ما انتجته الخبرة البشرية.',
    icon: Watch,
    color: 'bg-slate-50 text-slate-600'
  },
  {
    title: 'التميز والحصرية',
    description: 'نبحث دائماً عن القطع النادرة والإصدارات المحدودة التي تمنحك شعوراً بالتميز والتفرد.',
    icon: Gem,
    color: 'bg-indigo-50 text-indigo-600'
  }
];

export function About() {
  const { settings, loading } = useSiteSettings();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-24">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600 mb-4" />
        <p className="text-slate-500 font-medium">جاري تحضير هويتنا المميزة...</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden font-body">
        <div className="absolute top-0 right-0 w-full md:w-1/3 h-full bg-amber-50/50 -z-10 rounded-bl-[50px] md:rounded-bl-[100px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] md:text-sm font-bold mb-4 md:mb-6">من نحن؟</span>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-black text-slate-900 leading-tight mb-4 md:mb-8">
                {settings?.clinicName || "عموري ستور"} <br />
                <span className="text-amber-600 underline decoration-amber-200 underline-offset-4 md:underline-offset-8 decoration-4">عالم من الفخامة</span> والأناقة
              </h1>
              <p className="border-r-2 border-r-amber-400 pr-3 md:border-none md:pr-0 text-sm md:text-lg text-slate-600 leading-relaxed max-w-xl whitespace-pre-wrap">
                {settings?.aboutUs || "نحن في عموري ستور، نؤمن بأن الأناقة ليست ترفاً، بل هي لغة تعبر عن الرقي والتميز. نتخصص في تقديم تشكيلة حصرية من أرقى الساعات العالمية والعطور التي تأخذك في رحلة من السحر والجاذبية."}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 w-24 h-24 md:w-32 md:h-32 bg-amber-100 rounded-full blur-2xl md:blur-3xl opacity-60" />
              <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 w-32 h-32 md:w-48 md:h-48 bg-amber-100 rounded-full blur-2xl md:blur-3xl opacity-60" />
              {settings?.aboutUsImage ? (
                <img 
                  src={settings.aboutUsImage} 
                  alt="About Us" 
                  className="relative rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full aspect-[4/3] object-cover border-4 md:border-8 border-white"
                />
              ) : (
                <img 
                  src="https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80" 
                  alt="About Us" 
                  className="relative rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full aspect-[4/3] object-cover border-4 md:border-8 border-white"
                />
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-12"
          >
            {stats.map((stat) => (
              <motion.div key={stat.id} variants={itemVariants} className="text-center group">
                <div className="inline-flex w-12 h-12 md:w-16 md:h-16 items-center justify-center rounded-xl md:rounded-2xl bg-white/10 text-amber-400 mb-4 md:mb-6 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                  <stat.icon className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-white mb-1 md:mb-2">{stat.value}</div>
                <div className="text-slate-400 text-[10px] md:text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 md:py-24 bg-slate-50 relative overflow-hidden font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6 md:gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-6 sm:p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8">
                <Target className="w-6 h-6 md:w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">رسالتنا</h3>
              <p className="text-slate-600 leading-relaxed text-sm md:text-lg">
                نسعى لأن نكون جسركم نحو عالم الفخامة، من خلال توفير قطع فريدة وأصلية تعكس شخصيتكم، وضمان تجربة تسوق استثنائية ترتكز على الثقة والجودة.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 sm:p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8">
                <Eye className="w-6 h-6 md:w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">رؤيتنا</h3>
              <p className="text-slate-600 leading-relaxed text-sm md:text-lg">
                أن نصبح الوجهة الأولى في اليمن لكل من يبحث عن الأناقة والتميز، وأن نضع معايير جديدة في سوق المنتجات الفاخرة التي تجمع بين الجمال والجودة.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-20">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-slate-900 mb-4 md:mb-6 underline decoration-amber-100 decoration-8 underline-offset-4 pointer-events-none">قيمنا الجوهرية</h2>
            <p className="text-slate-500 text-sm md:text-lg">نحن نؤمن بأن الجمال يكمن في التفاصيل، والنجاح يُبنى على أسس من الثقة والأصالة.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
          >
            {values.map((value) => (
              <motion.div 
                key={value.title}
                variants={itemVariants}
                className="p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 hover:border-amber-100 transition-all hover:bg-amber-50/10 group"
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 ${value.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform`}>
                  <value.icon className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-slate-900 mb-3 md:mb-4">{value.title}</h4>
                <p className="text-slate-600 text-xs md:text-base leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-slate-950 overflow-hidden relative font-body">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-white rounded-full blur-[100px] md:blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-amber-400 rounded-full blur-[100px] md:blur-[120px] translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-4 md:mb-8">ابدأ رحلتك في عالم الأناقة معنا</h2>
          <p className="text-amber-100/80 text-sm md:text-lg mb-8 md:mb-12 leading-relaxed">
            لأكثر من عشر سنوات، حرصنا على أن نكون رفاقكم في أجمل لحظاتكم. شكراً لثقتكم بنا، ونعدكم بمواصلة تقديم الأفضل دائماً.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <motion.a 
              href="/contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 md:px-10 md:py-4 text-sm md:text-base bg-amber-500 text-slate-950 rounded-xl md:rounded-2xl font-bold shadow-xl shadow-amber-500/20"
            >
              تواصل معنا الآن
            </motion.a>
            <motion.a 
              href="/store"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 md:px-10 md:py-4 text-sm md:text-base bg-white/10 text-white rounded-xl md:rounded-2xl font-bold border border-white/20 backdrop-blur-sm"
            >
              تصفح مجموعتنا
            </motion.a>
          </div>
        </div>
      </section>
    </div>
  );
}
