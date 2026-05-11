import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Building2, Phone, Calendar, Clock, MessageSquare, ChevronDown, CheckCircle2, Loader2, PhoneCall, HelpCircle, RotateCcw } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseErrorHandler';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import toast from 'react-hot-toast';

export function Consultation() {
  const isOnline = useOnlineStatus();
  const { settings } = useSiteSettings();
  const { requireAuth } = useRequireAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showWhatsAppConfirm, setShowWhatsAppConfirm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    subject: '',
    phone: '',
    serviceType: 'اختيار ساعة مناسبة',
    date: '',
    time: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast.error('المعذرة منك ياحبوب.. النت مقطوع، يرجى الاتصال بالنت يالغالي للحجز.');
      return;
    }
    requireAuth(async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        await addDoc(collection(db, 'consultations'), {
          ...formData,
          userId: auth.currentUser?.uid || null,
          createdAt: serverTimestamp(),
          status: 'pending'
        });

        // Add notifications - wrap in separate try/catch so it doesn't block the UI
        try {
          await addDoc(collection(db, 'notifications'), {
            message: `حجز استشارة جديد من ${formData.fullName}`,
            link: '/admin/consultations',
            isAdmin: true,
            read: false,
            createdAt: serverTimestamp(),
            type: 'consultation'
          });
          
          if (auth.currentUser) {
             await addDoc(collection(db, 'notifications'), {
               message: `تم استلام طلب حجز استشارة. سنقوم بالتواصل معك قريباً يا ${formData.fullName}.`,
               userId: auth.currentUser.uid,
               isAdmin: false,
               read: false,
               createdAt: serverTimestamp(),
               type: 'consultation'
             });
          }
        } catch (notifError) {
          console.warn('Failed to create admin notification:', notifError);
        }

        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error: any) {
        console.error('CONSULTATION_ERROR_FULL:', error);
        console.error('CONSULTATION_ERROR_CODE:', error.code);
        console.error('CONSULTATION_ERROR_MSG:', error.message);
        const isPermissionError = error.code === 'permission-denied' || error.message?.includes('permission-denied');
        setErrorMessage(
          isPermissionError 
            ? 'عذراً، لا نملك الصلاحية لتنفيذ هذا الطلب حالياً (خطأ في الصلاحيات: ' + error.code + '). يرجى التواصل مع الدعم.' 
            : 'حدث خطأ غير متوقع أثناء حجز الاستشارة. يرجى المحاولة مرة أخرى لاحقاً.'
        );
      } finally {
        setLoading(false);
      }
    });
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      subject: '',
      phone: '',
      serviceType: 'اختيار ساعة مناسبة',
      date: '',
      time: '',
      notes: ''
    });
  };

  if (success) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 bg-slate-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-slate-100 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">تم استلام طلبك!</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            شكراً لثقتك بنا. سيقوم أحد مستشارينا بالتواصل معك قريباً لتأكيد الموعد ومناقشة احتياجاتك.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-rose-600 text-white hover:bg-rose-700 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-slate-200"
          >
            العودة للرئيسية
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        {/* Header section */}
        <div className="text-center mb-16 space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-900"
          >
            احجز استشارة مجانية
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto font-medium text-lg"
          >
            احجز موعداً مع خبرائنا لمناقشة أفضل الخيارات المناسبة لذوقك، سواء كنت تبحث عن ساعة فاخرة أو عطر فريد يكمل شخصيتك.
          </motion.p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col lg:flex-row">
          {/* Main Form Area */}
          <div className="flex-1 p-8 md:p-12">
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-4 text-rose-800"
              >
                <HelpCircle className="w-6 h-6 text-rose-500 shrink-0" />
                <p className="font-bold">{errorMessage}</p>
              </motion.div>
            )}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                    <User className="w-4 h-4 text-rose-600" /> الاسم الكامل
                  </label>
                  <input 
                    type="text" required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-6 py-4 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
                    placeholder="اسمك بالكامل"
                  />
                </div>

                {/* Subject/Entity */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                    <Building2 className="w-4 h-4 text-rose-600" /> الغرض من الاستشارة
                  </label>
                  <input 
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-6 py-4 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
                    placeholder="مثال: اختيار هدية"
                  />
                </div>

                {/* Service Type */}
                <div className="space-y-2 lg:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                    <HelpCircle className="w-4 h-4 text-rose-600" /> نوع الخدمة المطلوبة
                  </label>
                  <div className="relative">
                    <select 
                      value={formData.serviceType}
                      onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                      className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-6 py-4 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                    >
                      <option>اختيار ساعة مناسبة</option>
                      <option>نصيحة حول العطور</option>
                      <option>تنسيق طقم إكسسوارات</option>
                      <option>خدمات ما بعد البيع</option>
                      <option>أخرى</option>
                    </select>
                    <ChevronDown className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                    <Phone className="w-4 h-4 text-rose-600" /> رقم الهاتف
                  </label>
                  <input 
                    type="tel" dir="ltr" required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-6 py-4 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400 text-right"
                    placeholder="+967 7XX XXX XXX"
                  />
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                    <Calendar className="w-4 h-4 text-rose-600" /> التاريخ المفضل
                  </label>
                  <input 
                    type="date" required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-6 py-4 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-slate-900"
                  />
                </div>

                {/* Time */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                    <Clock className="w-4 h-4 text-rose-600" /> الوقت المفضل
                  </label>
                  <input 
                    type="time" required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-6 py-4 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                  <MessageSquare className="w-4 h-4 text-rose-600" /> ملاحظات إضافية
                </label>
                <textarea 
                  rows={4}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-6 py-4 focus:bg-white focus:border-rose-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400 resize-none"
                  placeholder="أخبرنا المزيد عن احتياجاتك..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={loading}
                  className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  <RotateCcw className="w-5 h-5" /> مسح البيانات
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-rose-700 text-white py-5 rounded-2xl font-black text-xl hover:bg-rose-800 transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تأكيد الحجز'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Section */}
          <div className="lg:w-80 bg-rose-700 p-8 md:p-10 text-white flex flex-col">
            <div className="space-y-8 flex-1">
              <div className="space-y-4">
                <h3 className="text-2xl font-black">معلومات الحجز</h3>
                <p className="text-rose-100 text-sm font-medium leading-relaxed">
                  نقدم استشارات متخصصة لعملائنا لمساعدتهم في اتخاذ القرار الأمثل والحصول على أفضل خدمة وتجهيز لطلباتهم الخاصة.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wider mb-1">أوقات العمل</h4>
                    <p className="text-rose-50 text-xs font-bold opacity-80">السبت - الخميس</p>
                    <p className="text-rose-50 text-xs font-bold opacity-80">8:00 صباحاً - 5:00 مساءً</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wider mb-1">للمساعدة العاجلة</h4>
                    <p className="text-rose-50 text-base font-black">+967 774 974 712</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <button 
                onClick={() => setShowWhatsAppConfirm(true)}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 mb-6 group"
              >
                <MessageSquare className="w-5 h-5 text-rose-300 group-hover:scale-110 transition-transform" />
                <span>طلب مساعدة فورية</span>
              </button>
              <p className="text-[10px] text-rose-200 font-bold uppercase tracking-widest text-center">
                عموري ستور - خدمتكم غايتنا
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showWhatsAppConfirm}
        onClose={() => setShowWhatsAppConfirm(false)}
        onConfirm={() => window.open(`https://wa.me/${settings?.phone?.replace(/[^0-9]/g, '') || '967774974712'}`, '_blank')}
        title="تواصل معنا عبر واتساب"
        message="هل ترغب في الانتقال إلى واتساب للتحدث مباشرة مع أحد خبرائنا؟"
        confirmText="نعم، فتح واتساب"
        cancelText="إلغاء"
        variant="info"
      />

      <ConfirmationModal 
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetForm}
        title="تأكيد المسح"
        message="هل أنت متأكد من رغبتك في مسح كافة البيانات المدخلة في النموذج؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="نعم، امسح الكل"
        cancelText="إلغاء"
        variant="warning"
      />
    </div>
  );
}
