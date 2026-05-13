import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, serverTimestamp } from 'firebase/firestore';
import { setDoc, addDoc } from '../../lib/safeFirestore';
import { db, auth } from '../../firebase';
import { Loader2, Save, AlertCircle, CheckCircle2, Bell, ShieldAlert } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

import { compressImage } from '../../utils/imageUtils';

import { seedAmoryData } from '../../utils/seedAmoryData';

export function AdminSiteSettings() {
  const [settings, setSettings] = useState<any>({
    storeName: '',
    storeDescription: '',
    logoUrl: '',
    location: '',
    mapEmbedUrl: '',
    workingHours: '',
    phone: '',
    email: '',
    socialMedia: [],
    privacyPolicy: '',
    termsOfService: '',
    aboutUs: '',
    aboutUsImage: '',
    exchangeRateSanaa: 530,
    exchangeRateAden: 1700
  });

  const PLATFORMS = [
    { value: 'whatsapp', label: 'واتساب' },
    { value: 'facebook', label: 'فيسبوك' },
    { value: 'instagram', label: 'إنستغرام' },
    { value: 'twitter', label: 'تويتر' },
    { value: 'tiktok', label: 'تيك توك' },
    { value: 'snapchat', label: 'سناب شات' },
    { value: 'youtube', label: 'يوتيوب' },
    { value: 'linkedin', label: 'لينكد إن' },
  ];

  const addSocialLink = () => {
    const currentLinks = Array.isArray(settings.socialMedia) ? settings.socialMedia : [];
    setSettings({
      ...settings,
      socialMedia: [...currentLinks, { platform: 'whatsapp', url: '', active: true }]
    });
  };

  const removeSocialLink = (index: number) => {
    const currentLinks = Array.isArray(settings.socialMedia) ? [...settings.socialMedia] : [];
    currentLinks.splice(index, 1);
    setSettings({ ...settings, socialMedia: currentLinks });
  };

  const updateSocialLink = (index: number, field: string, value: any) => {
    const currentLinks = Array.isArray(settings.socialMedia) ? [...settings.socialMedia] : [];
    currentLinks[index] = { ...currentLinks[index], [field]: value };
    setSettings({ ...settings, socialMedia: currentLinks });
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const isOnline = useOnlineStatus();

  const handleSeed = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إضافة بيانات "عموري ستور"؟ سيتم إضافة أصناف ومنتجات جديدة وتحديث إعدادات المتجر.')) return;
    setSeeding(true);
    try {
      await seedAmoryData();
      alert('تم تحديث البيانات بنجاح! يرجى تحديث الصفحة لرؤية التغييرات.');
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('فشل تحديث البيانات');
    } finally {
      setSeeding(false);
    }
  };

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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">إعدادات الموقع</h1>
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 md:py-2 rounded-xl font-bold transition-all border border-red-100 shadow-sm text-sm"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            تهيئة بيانات "عموري ستور"
          </button>
          <button
            onClick={sendTestNotification}
            disabled={testLoading}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 md:py-2 rounded-xl font-medium transition-all text-sm"
          >
            {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            إرسال تنبيه تجريبي
          </button>
        </div>
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
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-black text-slate-700">روابط التواصل الاجتماعي</label>
            <button 
              type="button" 
              onClick={addSocialLink}
              className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-black transition-colors"
            >
              + إضافة منصة
            </button>
          </div>
          
          <div className="space-y-3">
            {(Array.isArray(settings.socialMedia) ? settings.socialMedia : []).map((link: any, index: number) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">المنصة</label>
                  <select 
                    value={link.platform} 
                    onChange={e => updateSocialLink(index, 'platform', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  >
                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">الرابط أو الرقم (للواتس)</label>
                  <input 
                    type="text" 
                    value={link.url} 
                    onChange={e => updateSocialLink(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => removeSocialLink(index)}
                  className="sm:self-end p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
          {(!settings.socialMedia || settings.socialMedia.length === 0) && (
            <p className="text-center py-8 text-slate-400 text-sm italic">لا توجد روابط تواصل اجتماعي مضافة حالياً</p>
          )}
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

        <button type="submit" disabled={saving} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          حفظ جميع الإعدادات
        </button>
      </form>
    </div>
  );
}
