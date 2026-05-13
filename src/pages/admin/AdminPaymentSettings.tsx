import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, query, orderBy, getDoc } from 'firebase/firestore';
import { addDoc, updateDoc, deleteDoc, setDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

type PaymentMethod = {
  id: string;
  name: string;
  providerName: string;
  accountName: string;
  accountNumber: string;
  isEnabled: boolean;
  type: 'bank' | 'wallet' | 'cash';
};

export function AdminPaymentSettings() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({ type: 'bank', isEnabled: true });
  
  // Settings for Exchange Rates
  const [settings, setSettings] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchMethods();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'siteSettings', 'general');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching settings: ", error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const docRef = doc(db, 'siteSettings', 'general');
      await setDoc(docRef, settings, { merge: true });
      setMessage({ text: 'تم حفظ أسعار الصرف بنجاح', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error("Error saving settings: ", error);
      setMessage({ text: 'حدث خطأ أثناء החفظ', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchMethods = async () => {
    setLoading(true);
    const qs = await getDocs(query(collection(db, 'paymentMethods'), orderBy('name')));
    setMethods(qs.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod)));
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'paymentMethods'), newMethod);
    setAdding(false);
    setNewMethod({ type: 'bank', isEnabled: true });
    fetchMethods();
  };

  const handleToggle = async (method: PaymentMethod) => {
    await updateDoc(doc(db, 'paymentMethods', method.id), { isEnabled: !method.isEnabled });
    fetchMethods();
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) {
      await deleteDoc(doc(db, 'paymentMethods', id));
      fetchMethods();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">إعدادات الدفع والصرف</h1>
        
        {/* Exchange Rates Section */}
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8 max-w-4xl space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p>{message.text}</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 mb-1">إعدادات العملات والصرف (بالدولار)</h3>
                <p className="text-sm text-amber-800">
                  أدخل أسعار المنتجات في المتجر بالدولار. سيتم تحويلها للمستخدم بناءً على العملة التي يختارها (قديم، جديد أو سعودي) وفقاً لأسعار الصرف المتوفرة هنا.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">سعر الصرف القديم (ريال / دولار)</label>
                <input 
                  type="number" 
                  value={settings.exchangeRateSanaa || 530} 
                  onChange={e => setSettings({...settings, exchangeRateSanaa: Number(e.target.value)})} 
                  className="w-full p-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white" 
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">سعر الصرف الجديد (ريال / دولار)</label>
                <input 
                  type="number" 
                  value={settings.exchangeRateAden || 1700} 
                  onChange={e => setSettings({...settings, exchangeRateAden: Number(e.target.value)})} 
                  className="w-full p-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white" 
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">سعر الريال السعودي (ر.س / دولار)</label>
                <input 
                  type="number" 
                  value={settings.exchangeRateSar || 3.75} 
                  onChange={e => setSettings({...settings, exchangeRateSar: Number(e.target.value)})} 
                  className="w-full p-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white" 
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={savingSettings}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                حفظ أسعار الصرف
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between mb-8 max-w-4xl">
        <h2 className="text-xl font-bold text-slate-900">طرق الدفع المتاحة</h2>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl font-medium">
          <Plus className="w-4 h-4" /> إضافة طريقة دفع
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <h3 className="font-bold mb-4">إضافة طريقة دفع جديدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="اسم الطريقة (مثل: تحويل بنكي)" value={newMethod.name || ''} onChange={e => setNewMethod({...newMethod, name: e.target.value})} className="p-3 rounded-xl border border-slate-200" required />
            <input placeholder="مزود الخدمة (مثل: بنك الكريمي)" value={newMethod.providerName || ''} onChange={e => setNewMethod({...newMethod, providerName: e.target.value})} className="p-3 rounded-xl border border-slate-200" required />
            <input placeholder="اسم الحساب" value={newMethod.accountName || ''} onChange={e => setNewMethod({...newMethod, accountName: e.target.value})} className="p-3 rounded-xl border border-slate-200" required />
            <input placeholder="رقم الحساب/المحفظة" value={newMethod.accountNumber || ''} onChange={e => setNewMethod({...newMethod, accountNumber: e.target.value})} className="p-3 rounded-xl border border-slate-200" required />
            <select value={newMethod.type} onChange={e => setNewMethod({...newMethod, type: e.target.value as any})} className="p-3 rounded-xl border border-slate-200">
              <option value="bank">بنك / صرافة</option>
              <option value="wallet">محفظة إلكترونية</option>
              <option value="cash">نقداً</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl">حفظ</button>
            <button type="button" onClick={() => setAdding(false)} className="bg-slate-200 px-4 py-2 rounded-xl">إلغاء</button>
          </div>
        </form>
      )}

      {loading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid gap-4">
          {methods.map(m => (
            <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold">{m.name} - {m.providerName}</div>
                <div className="text-sm text-slate-500">{m.accountName}: {m.accountNumber} ({m.type})</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(m)}>
                  {m.isEnabled ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
                <button onClick={() => handleDelete(m.id)} className="text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
