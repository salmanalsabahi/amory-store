import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Loader2, WifiOff, CheckCircle2, Globe, Sparkles, Facebook, Instagram, Twitter, Youtube, Music, Share2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useRequireAuth } from '../hooks/useRequireAuth';

const PLATFORM_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
  whatsapp: { icon: MessageCircle, color: 'bg-[#25D366]', label: 'واتساب' },
  facebook: { icon: Facebook, color: 'bg-[#1877F2]', label: 'فيسبوك' },
  instagram: { icon: Instagram, color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', label: 'إنستغرام' },
  twitter: { icon: Twitter, color: 'bg-[#1DA1F2]', label: 'تويتر' },
  tiktok: { icon: Music, color: 'bg-black', label: 'تيك توك' },
  youtube: { icon: Youtube, color: 'bg-[#FF0000]', label: 'يوتيوب' },
  snapchat: { icon: Globe, color: 'bg-[#FFFC00] text-black', label: 'سناب شات' },
  default: { icon: Share2, color: 'bg-slate-500', label: 'تواصل' }
};

const GEMINI_KEY = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

if (!GEMINI_KEY && typeof window !== 'undefined') {
  console.warn("Gemini API Key is missing. Maps grounding and AI features in Contact page may not work.");
}

export function Contact() {
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { requireAuth } = useRequireAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mapInfo, setMapInfo] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const isOnline = useOnlineStatus();

  React.useEffect(() => {
    async function fetchAiMapInfo() {
      if (settingsLoading) return;

      // Use admin provided description if available as secondary info
      if (!ai) {
        setMapInfo(settings?.storeDescription || "لا تتوفر معلومات إضافية عن الموقع حالياً.");
        setMapLoading(false);
        return;
      }
      try {
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: `Provide the address and a brief description of the location for 'Amory Store' (عموري ستور) in Sana'a, Yemen. Admin says: ${settings?.location || 'Sana\'a'}. Format in Arabic with bullet points.`,
          config: {
            tools: [{ googleMaps: {} }],
          },
        });
        setMapInfo(response.text || settings?.storeDescription || "لا تتوفر معلومات الموقع حالياً.");
      } catch (aiError) {
        console.warn("Gemini Maps Grounding failed:", aiError);
        setMapInfo(settings?.storeDescription || "يمكنك زيارتنا في موقعنا الرسمي بصنعاء، أو التواصل معنا عبر الهاتف للحصول على الموقع الدقيق عبر الواتساب.");
      } finally {
        setMapLoading(false);
      }
    }
    fetchAiMapInfo();
  }, [settings, settingsLoading, ai]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth(async () => {
      setSuccessMessage(null);
      setErrorMessage(null);
      
      if (!isOnline) {
        setErrorMessage("عذراً، يجب أن تكون متصلاً بالإنترنت لتتمكن من إرسال رسالة.");
        return;
      }

      setLoading(true);
      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        const { db, auth } = await import('../firebase');
        
        await addDoc(collection(db, 'contactMessages'), {
          ...formData,
          createdAt: serverTimestamp(),
          status: 'new',
          userId: auth.currentUser?.uid || null
        });

        await addDoc(collection(db, 'notifications'), {
          message: `رسالة جديدة من ${formData.firstName} ${formData.lastName}`,
          link: '/admin/messages',
          isAdmin: true,
          read: false,
          createdAt: serverTimestamp(),
          type: 'contact'
        });
        
        if (auth.currentUser) {
          await addDoc(collection(db, 'notifications'), {
            message: `تم إرسال رسالتك بنجاح. نشكرك على تواصلك معنا.`,
            userId: auth.currentUser.uid,
            isAdmin: false,
            read: false,
            createdAt: serverTimestamp(),
            type: 'contact'
          });
        }

        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setSuccessMessage('تم إرسال رسالتك بنجاح! سنتواصل معك في أقرب وقت ممكن.');
          setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          const errorText = data.details ? `\nالتفاصيل: ${data.details}` : '';
          throw new Error((data.error || 'حدث خطأ أثناء إرسال الرسالة.') + errorText);
        }
      } catch (error: any) {
        console.error('Error:', error);
        setErrorMessage(error.message || 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="pt-24 md:pt-32 pb-16 md:pb-24 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-rose-600 font-black tracking-widest uppercase bg-rose-50 px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-sm inline-block"
          >
            تواصل معنا
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900"
          >
            نحن هنا لخدمتك دائماً
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-lg text-slate-500 font-medium max-w-2xl mx-auto"
          >
            سواء كنت تبحث عن استشارة خاصة أو لديك استفسار عن منتجاتنا الفاخرة، فريقنا متواجد للرد عليك بكل سرور.
          </motion.p>
        </div>

        {/* Map Section - Now at Top */}
        <div className="mb-12 md:mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 md:p-6 lg:p-4 rounded-[2rem] md:rounded-[4rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative min-h-[300px] md:min-h-[400px] lg:min-h-[550px] rounded-[1.5rem] md:rounded-[3.5rem] overflow-hidden bg-slate-100 group">
                {settingsLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 md:w-12 md:h-12 animate-spin text-rose-600" />
                    <span className="text-xs md:text-sm font-black text-slate-400">جاري الاتصال بالنظام...</span>
                  </div>
                ) : settings?.mapEmbedUrl ? (
                  <>
                    <iframe 
                      src={settings.mapEmbedUrl} 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0 grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                    />
                    <a 
                      href={settings.mapEmbedUrl.replace('/embed', '/place')} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 md:bottom-8 md:right-8 bg-white/95 backdrop-blur-sm hover:bg-white text-slate-900 px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-3xl text-[10px] md:text-sm font-black shadow-2xl transition-all flex items-center gap-2 md:gap-3 border border-slate-100 active:scale-95 group/btn"
                    >
                      <MapPin className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
                      عرض الموقع على الخريطة
                    </a>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <MapPin className="w-12 h-12 text-slate-200 mb-4" />
                    <h4 className="text-base font-black text-slate-900 mb-2">موقعنا متاح دائماً</h4>
                    <p className="text-[10px] text-slate-500 font-bold max-w-sm">يمكنك زيارتنا في الركن الفخم بصنعاء.</p>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-10 lg:p-16 flex flex-col justify-center">
                <div className="space-y-6 md:space-y-10">
                  <div>
                    <h3 className="text-xl md:text-3xl font-black text-slate-900 mb-3 block">أين تجدنا؟</h3>
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-rose-50 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 mt-1">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
                      </div>
                      <p className="text-sm md:text-lg font-bold text-slate-700 leading-relaxed">
                        {settings?.location || 'صنعاء - شارع الستين - بجانب البريد العام'}
                      </p>
                    </div>
                  </div>

                  <div className="relative p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-slate-50 border border-slate-100 overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 md:w-2 h-full bg-rose-500" />
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-rose-600" />
                      <span className="text-[9px] md:text-xs font-black text-rose-600 uppercase tracking-widest">معلومات إضافية للموقع</span>
                    </div>
                    {mapLoading ? (
                      <div className="flex items-center gap-2 text-slate-400 font-bold animate-pulse text-xs md:text-base">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري استرداد التفاصيل...</span>
                      </div>
                    ) : (
                      <p className="text-slate-600 leading-relaxed font-bold text-xs md:text-base whitespace-pre-line">
                        {mapInfo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Form - Middle Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl shadow-slate-200/60 border border-slate-50 relative overflow-hidden order-1"
          >
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-rose-50/50 rounded-full blur-2xl md:blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
            
            <div className="mb-8 md:mb-10 text-right">
              <h3 className="text-xl md:text-3xl font-black text-slate-900 flex items-center gap-2 md:gap-3">
                تواصل مع خبرائنا مباشرة
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-rose-500 shrink-0" />
              </h3>
              <p className="text-xs md:text-base text-slate-500 font-medium mt-2">نحن هنا للإجابة على جميع تساؤلاتك حول خدماتنا ومنتجاتنا.</p>
            </div>
            
            {(successMessage || errorMessage) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] mb-6 md:mb-10 flex items-center gap-4 md:gap-5 border-2 ${
                  successMessage ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
                }`}
              >
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 ${
                  successMessage ? 'bg-emerald-100' : 'bg-rose-100'
                }`}>
                  {successMessage ? <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7 text-emerald-600" /> : <WifiOff className="w-5 h-5 md:w-7 md:h-7 text-rose-600" />}
                </div>
                <div>
                  <h4 className="font-black text-sm md:text-lg">{successMessage ? 'شكراً لك!' : 'تنبيه'}</h4>
                  <p className="font-bold opacity-80 text-xs md:text-base">{successMessage || errorMessage}</p>
                </div>
              </motion.div>
            )}

            <form className="space-y-6 md:space-y-8" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 text-right">
                <div className="space-y-2">
                  <label className="block text-xs md:text-sm font-black text-slate-700 mr-2">الاسم الأول</label>
                  <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-2 border-slate-200 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs md:text-sm font-black text-slate-700 mr-2">اسم العائلة</label>
                  <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-2 border-slate-200 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold" required />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 text-right">
                <div className="space-y-2">
                  <label className="block text-xs md:text-sm font-black text-slate-700 mr-2">البريد الإلكتروني</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-2 border-slate-200 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-left" dir="ltr" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs md:text-sm font-black text-slate-700 mr-2">رقم الهاتف</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-2 border-slate-200 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-left" dir="ltr" required />
                </div>
              </div>
              
              <div className="space-y-2 text-right">
                <label className="block text-xs md:text-sm font-black text-slate-700 mr-2">الرسالة أو الاستفسار</label>
                <textarea rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-100 border-2 border-slate-200 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold resize-none" required></textarea>
              </div>
              
              <button disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-base md:text-xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>إرسال الرسالة الآن</span>}
              </button>
            </form>
          </motion.div>

          {/* Contact Details - Bottom Section for Mobile, Sticky for Desktop */}
          <div className="lg:col-span-4 space-y-4 md:space-y-8 lg:sticky lg:top-32 order-2">
            
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-5 group"
              >
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 text-rose-600" />
                </div>
                <div className="flex flex-col text-right overflow-hidden">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">اتصل بنا</span>
                  <span className="text-xl font-black text-slate-900 truncate" dir="ltr">{settings?.phone || '967 774 974 712'}</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-5 group"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex flex-col text-right overflow-hidden">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">البريد الإلكتروني</span>
                  <span className="text-base font-bold text-slate-900 truncate" title={settings?.email}>{settings?.email || 'info@amorystore.com'}</span>
                </div>
              </motion.div>

            {/* Social Icons Section */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
              <h4 className="text-sm font-black text-slate-900 mb-6 text-center">تابعنا على وسائل التواصل</h4>
              <div className="grid grid-cols-4 gap-4">
                {(Array.isArray(settings?.socialMedia) ? settings.socialMedia : []).map((link: any, idx: number) => {
                  const config = PLATFORM_CONFIG[link.platform.toLowerCase()] || PLATFORM_CONFIG.default;
                  let href = link.url;
                  if (link.platform.toLowerCase() === 'whatsapp' && !href.startsWith('http')) {
                    href = `https://wa.me/${href}`;
                  }
                  return (
                    <motion.a 
                      key={idx}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`aspect-square rounded-2xl flex items-center justify-center shadow-lg transform transition-all group ${config.color}`}
                    >
                      <config.icon className="w-6 h-6 text-white" />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col items-center text-center gap-4 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-all"></div>
              <Clock className="w-10 h-10 text-rose-500" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-2">ساعات العمل</span>
                <p className="text-lg font-black">{settings?.workingHours || 'يومياً: 9 صباحاً - 10 مساءً'}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

