import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Loader2, Save, AlertCircle, CheckCircle2, Bell, ShieldAlert } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

import { compressImage } from '../../utils/imageUtils';

export function AdminSiteSettings() {
  const [settings, setSettings] = useState({
    storeName: '',
    storeDescription: '',
    logoUrl: '',
    location: '',
    mapEmbedUrl: '',
    workingHours: '',
    phone: '',
    email: '',
    socialMedia: { facebook: '', instagram: '', twitter: '', whatsapp: '', tiktok: '', linkedin: '' },
    privacyPolicy: '',
    termsOfService: '',
    aboutUs: '',
    aboutUsImage: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'siteSettings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const compressedImage = await compressImage(file);
      setSettings({...settings, [field]: compressedImage});
    } catch (error) {
      console.error("Error compressing image:", error);
      alert("حدث خطأ أثناء معالجة الصورة. يرجى المحاولة بصورة أخرى.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setMessage({ type: 'error', text: 'يجب الاتصال بالإنترنت لحفظ الإعدادات.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await setDoc(doc(db, 'siteSettings', 'general'), settings);
      setMessage({ type: 'success', text: 'تم حفظ إعدادات الموقع بنجاح.' });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ الإعدادات.' });
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async () => {
    if (!isOnline) {
      alert("يجب الاتصال بالإنترنت لإرسال تنبيه تجريبي.");
      return;
    }
    setTestLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        isAdmin: true,
        message: 'هذا تنبيه تجريبي من إعدادات الموقع',
        type: 'info',
        read: false,
        createdAt: serverTimestamp(),
        link: '/admin/site-settings'
      });
      alert('تم إرسال التنبيه التجريبي. تحقق من أيقونة الجرس.');
    } catch (error) {
      console.error("Error sending test notification:", error);
      alert('فشل إرسال التنبيه التجريبي');
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 min-h-[500px]">
      <LoadingSpinner size="lg" label="جاري تحميل إعدادات الموقع..." />
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">إعدادات الموقع</h1>
        <button
          onClick={sendTestNotification}
          disabled={testLoading}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium transition-all"
        >
          {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          إرسال تنبيه تجريبي
        </button>
      </div>
      
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl space-y-6">
        {message.text && (
          <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <p>{message.text}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">اسم المتجر</label>
          <input type="text" value={settings.storeName} onChange={e => setSettings({...settings, storeName: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">وصف المتجر (للمحركات البحث)</label>
          <textarea value={settings.storeDescription} onChange={e => setSettings({...settings, storeDescription: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 h-20" placeholder="اكتب وصفاً قصيراً وجذاباً للمتجر..." />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">الشعار</label>
          <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'logoUrl')} className="w-full p-3 rounded-xl border border-slate-200" />
          {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="mt-2 h-20" />}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">الموقع</label>
          <input type="text" value={settings.location} onChange={e => setSettings({...settings, location: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">رابط خريطة جوجل (Google Maps Embed URL)</label>
          <input 
            type="text" 
            value={settings.mapEmbedUrl} 
            onChange={e => {
              let url = e.target.value;
              // Extract src if user pastes the whole iframe tag
              if (url.includes('<iframe')) {
                const match = url.match(/src="([^"]+)"/);
                if (match) url = match[1];
              }
              setSettings({...settings, mapEmbedUrl: url});
            }} 
            className="w-full p-3 rounded-xl border border-slate-200" 
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
          <p className="mt-2 text-xs text-slate-500">
            للحصول على الرابط الصحيح: اذهب إلى خرائط جوجل {'>'} مشاركة {'>'} تضمين خريطة {'>'} انسخ الرابط الموجود داخل src.
          </p>
          {settings.mapEmbedUrl && !settings.mapEmbedUrl.includes('embed') && (
            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              يبدو أنك أدخلت رابطاً عادياً وليس رابط تضمين. الخريطة قد لا تظهر للعملاء.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">ساعات العمل</label>
          <input type="text" value={settings.workingHours} onChange={e => setSettings({...settings, workingHours: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200" placeholder="مثلاً: 9 صباحاً - 9 مساءً" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">رقم الهاتف</label>
          <input type="text" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني</label>
          <input type="email" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">فيسبوك</label>
            <input type="url" value={settings.socialMedia.facebook} onChange={e => setSettings({...settings, socialMedia: {...settings.socialMedia, facebook: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">إنستغرام</label>
            <input type="url" value={settings.socialMedia.instagram} onChange={e => setSettings({...settings, socialMedia: {...settings.socialMedia, instagram: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">تويتر / X</label>
            <input type="url" value={settings.socialMedia.twitter} onChange={e => setSettings({...settings, socialMedia: {...settings.socialMedia, twitter: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">واتساب (رقم)</label>
            <input type="text" value={settings.socialMedia.whatsapp} onChange={e => setSettings({...settings, socialMedia: {...settings.socialMedia, whatsapp: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200" placeholder="967..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">تيك توك</label>
            <input type="url" value={settings.socialMedia.tiktok} onChange={e => setSettings({...settings, socialMedia: {...settings.socialMedia, tiktok: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">لينكد إن</label>
            <input type="url" value={settings.socialMedia.linkedin} onChange={e => setSettings({...settings, socialMedia: {...settings.socialMedia, linkedin: e.target.value}})} className="w-full p-3 rounded-xl border border-slate-200" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">سياسة الخصوصية</label>
          <textarea value={settings.privacyPolicy} onChange={e => setSettings({...settings, privacyPolicy: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 h-32" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">الشروط والأحكام</label>
          <textarea value={settings.termsOfService} onChange={e => setSettings({...settings, termsOfService: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 h-32" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">من نحن (النص)</label>
          <textarea value={settings.aboutUs} onChange={e => setSettings({...settings, aboutUs: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 h-32" placeholder="اكتب نبذة عن المتجر..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">من نحن (صورة)</label>
          <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'aboutUsImage')} className="w-full p-3 rounded-xl border border-slate-200" />
          {settings.aboutUsImage && <img src={settings.aboutUsImage} alt="About Us" className="mt-2 h-32 object-cover rounded-lg" />}
        </div>

        <button type="submit" disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 active:scale-95">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          حفظ جميع الإعدادات
        </button>
      </form>
    </div>
  );
}
