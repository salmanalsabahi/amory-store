import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Loader2, WifiOff, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useRequireAuth } from '../hooks/useRequireAuth';

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
      if (!ai) {
        setMapInfo("لا تتوفر معلومات إضافية عن الموقع حالياً.");
        setMapLoading(false);
        return;
      }
      try {
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: "Provide the address and a brief description of the location for 'Amory Store' in Sana'a, Yemen, specializing in luxury watches and perfumes. Format with clear bullet points in Arabic.",
          config: {
            tools: [{ googleMaps: {} }],
          },
        });
        setMapInfo(response.text || "لا تتوفر معلومات الموقع حالياً.");
      } catch (aiError) {
        console.warn("Gemini Maps Grounding failed:", aiError);
        setMapInfo("يمكنك زيارتنا في موقعنا الرسمي بصنعاء، أو التواصل معنا عبر الهاتف للحصول على الموقع الدقيق عبر الواتساب.");
      } finally {
        setMapLoading(false);
      }
    }
    fetchAiMapInfo();
  }, []);

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Details & Info (Sticky) */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6 lg:sticky lg:top-32">
            
            {/* Quick Contact Cards */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 md:gap-5 group"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-rose-50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">اتصل بنا</span>
                <span className="text-sm md:text-xl font-black text-slate-900" dir="ltr">{settings?.phone || '967 774 974 712'}</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 md:gap-5 group"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">البريد الإلكتروني</span>
                <span className="text-xs md:text-lg font-bold text-slate-900 truncate">{settings?.email || 'info@amorystore.com'}</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 md:gap-5 group"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-rose-50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">ساعات العمل</span>
                <span className="text-sm md:text-lg font-bold text-slate-900">{settings?.workingHours || 'يومياً: 9 ص - 10 ب'}</span>
              </div>
            </motion.div>

            {/* Social Links if available */}
            {settings?.socialMedia && (
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(settings.socialMedia).map(([key, value], idx) => value && (
                  <a 
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-center group"
                  >
                    <Globe className="w-5 h-5 text-slate-400 group-hover:text-rose-600" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl shadow-slate-200/60 border border-slate-50 relative overflow-hidden mt-6 lg:mt-0"
          >
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-rose-50/50 rounded-full blur-2xl md:blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
            
            <div className="mb-8 md:mb-10 text-right">
              <h3 className="text-xl md:text-3xl font-black text-slate-900 flex items-center gap-2 md:gap-3">
                تواصل مع خبرائنا مباشرة
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-rose-500 shrink-0" />
              </h3>
              <p className="text-xs md:text-base text-slate-500 font-medium mt-2">نحن هنا للإجابة على جميع تساؤلاتك حول خدماتنا ومنتجاتنا.</p>
            </div>
            
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="bg-emerald-50 text-emerald-800 border-2 border-emerald-100 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] mb-6 md:mb-10 flex items-center gap-4 md:gap-5"
              >
                <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-100 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-black text-sm md:text-lg">شكراً لك!</h4>
                  <p className="font-bold opacity-80 text-xs md:text-base">{successMessage}</p>
                </div>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="bg-rose-50 text-rose-800 border-2 border-rose-100 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] mb-6 md:mb-10 flex items-center gap-4 md:gap-5"
              >
                <div className="w-10 h-10 md:w-14 md:h-14 bg-rose-100 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                  <WifiOff className="w-5 h-5 md:w-7 md:h-7 text-rose-600" />
                </div>
                <p className="font-black text-xs md:text-base">{errorMessage}</p>
              </motion.div>
            )}

            <form className="space-y-6 md:space-y-8" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-xs md:text-sm font-black text-slate-700 mr-2">الاسم الأول</label>
                  <input 
                    type="text" 
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})} 
                    className="w-full px-5 py-4 md:px-7 md:py-5 rounded-2xl md:rounded-[2rem] bg-slate-100 border-2 border-slate-200 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-50 focus:outline-none transition-all font-bold text-sm md:text-base text-slate-800" 
                    placeholder="أدخل اسمك الأول" 
                    required 
                  />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-xs md:text-sm font-black text-slate-700 mr-2">اسم العائلة</label>
                  <input 
                    type="text" 
                    value={formData.lastName} 
                    onChange={e => setFormData({...formData, lastName: e.target.value})} 
                    className="w-full px-5 py-4 md:px-7 md:py-5 rounded-2xl md:rounded-[2rem] bg-slate-100 border-2 border-slate-200 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-50 focus:outline-none transition-all font-bold text-sm md:text-base text-slate-800" 
                    placeholder="أدخل اسم العائلة" 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-xs md:text-sm font-black text-slate-700 mr-2">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full px-5 py-4 md:px-7 md:py-5 rounded-2xl md:rounded-[2rem] bg-slate-100 border-2 border-slate-200 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-50 focus:outline-none transition-all font-bold text-sm md:text-base text-slate-800 text-left" 
                    dir="ltr" 
                    placeholder="ahmed@example.com" 
                    required 
                  />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-xs md:text-sm font-black text-slate-700 mr-2">رقم الهاتف</label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full px-5 py-4 md:px-7 md:py-5 rounded-2xl md:rounded-[2rem] bg-slate-100 border-2 border-slate-200 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-50 focus:outline-none transition-all font-bold text-sm md:text-base text-slate-800 text-left" 
                    dir="ltr" 
                    placeholder="+967 7xx xxx xxx" 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2 md:space-y-3">
                <label className="block text-xs md:text-sm font-black text-slate-700 mr-2">الرسالة أو الاستفسار</label>
                <textarea 
                  rows={6} 
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})} 
                  className="w-full px-5 py-4 md:px-7 md:py-5 rounded-2xl md:rounded-[2rem] bg-slate-100 border-2 border-slate-200 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-50 focus:outline-none transition-all font-bold text-sm md:text-base text-slate-800 resize-none min-h-[120px] md:min-h-[150px]" 
                  placeholder="كيف يمكننا مساعدتك اليوم؟" 
                  required 
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-rose-700 hover:bg-rose-800 text-white px-6 py-4 md:px-10 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-base md:text-xl transition-all flex items-center justify-center gap-2 md:gap-4 shadow-2xl shadow-rose-100 active:scale-[0.98] disabled:opacity-70 group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
                ) : (
                  <>
                    <span>إرسال وتأكيد الطلب</span>
                    <Send className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-[-4px] group-hover:translate-y-[-4px] transition-transform" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Map Section - Integrated & Refined */}
        <div className="mt-12 md:mt-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 md:p-6 lg:p-4 rounded-[2rem] md:rounded-[4rem] shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Actual Google Map Embed */}
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
                      <MapPin className="w-4 h-4 md:w-5 md:h-5 text-rose-500 group-hover/btn:scale-110 transition-transform" />
                      عرض الموقع على خرائط جوجل
                    </a>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 text-center bg-slate-50/80">
                    <MapPin className="w-12 h-12 md:w-20 md:h-20 text-slate-200 mb-4 md:mb-6" />
                    <h4 className="text-base md:text-xl font-black text-slate-900 mb-2">موقعنا متاح دائماً</h4>
                    <p className="text-[10px] md:text-sm text-slate-500 font-bold max-w-sm">يمكنك زيارتنا في الركن الفخم بصنعاء. لم يتم توفير رابط الخريطة بعد، تواصل معنا للتفاصيل.</p>
                  </div>
                )}
              </div>

              {/* Map Info & Grounding (AI Context) */}
              <div className="p-6 md:p-10 lg:p-16 flex flex-col justify-center">
                <div className="space-y-6 md:space-y-10">
                  <div>
                    <h3 className="text-xl md:text-3xl font-black text-slate-900 mb-3 md:mb-4">أين تجدنا؟</h3>
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-rose-50 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 mt-1">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
                      </div>
                      <p className="text-sm md:text-lg font-bold text-slate-700 leading-relaxed">
                        {settings?.location || 'صنعاء - شارع الستين - بجانب البريد العام'}
                      </p>
                    </div>
                  </div>

                  {/* Gemini AI Powered Content Section */}
                  <div className="relative p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-slate-50 border border-slate-100 overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 md:w-2 h-full bg-rose-500" />
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-rose-600" />
                      <span className="text-[9px] md:text-xs font-black text-rose-600 uppercase tracking-widest">معلومات إضافية للموقع</span>
                    </div>

                    {mapLoading ? (
                      <div className="flex items-center gap-2 md:gap-3 text-slate-400 font-bold animate-pulse text-xs md:text-base">
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                        <span>جاري استرداد التفاصيل...</span>
                      </div>
                    ) : (
                      <div className="prose prose-slate prose-sm md:prose-base prose-p:font-bold prose-p:text-slate-600 prose-p:leading-relaxed">
                        <p className="text-slate-600 leading-relaxed font-bold text-xs md:text-base">
                          {mapInfo}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Action */}
                  <button 
                    onClick={() => window.open(`https://wa.me/${settings?.phone?.replace(/[^0-9]/g, '') || '967774974712'}`, '_blank')}
                    className="flex items-center gap-3 md:gap-4 text-rose-700 font-black hover:gap-4 md:hover:gap-6 transition-all group text-sm md:text-base"
                  >
                    <span>احصل على الموقع عبر الواتساب</span>
                    <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

