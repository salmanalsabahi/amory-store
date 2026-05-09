import React, { useState, useEffect } from 'react';
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { setDoc } from '../lib/safeFirestore';
import { auth, db } from '../firebase';
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ProfileSettings() {
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setPhone(userDoc.data().phone || '');
        }
      } catch (error: any) {
        if (error?.message?.includes('offline') || error?.code === 'unavailable') {
          console.warn("أنت غير متصل بالإنترنت. تعذر جلب بيانات المستخدم.");
        } else {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const updates: any = {};
      if (name !== auth.currentUser.displayName) updates.displayName = name;
      
      if (Object.keys(updates).length > 0) {
        await updateProfile(auth.currentUser, updates);
      }
      
      if (email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, email);
      }

      await setDoc(doc(db, 'users', auth.currentUser.uid), { phone }, { merge: true });
      
      setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء تحديث الملف الشخصي.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">إعدادات الحساب</h2>
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p>{message.text}</p>
        </div>
      )}
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">الاسم الكامل</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">رقم الهاتف</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200" />
        </div>
        <button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-amber-600/20">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          حفظ التغييرات
        </button>
      </form>
    </div>
  );
}
