import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function AdminSettings() {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !auth.currentUser) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Update the user document in Firestore to the new email AND set role to admin
      await updateDoc(doc(db, 'users', auth.currentUser!.uid), { 
        email: newAdminEmail,
        role: 'admin' 
      });
      
      setMessage({ type: 'success', text: 'تم التسليم بنجاح. العميل الجديد هو المشرف. سيتم تسجيل خروجك الآن...' });
      
      // 2. Log out current admin
      setTimeout(async () => {
        await signOut(auth);
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error("Error during handover:", error);
      setMessage({ type: 'error', text: `حدث خطأ: ${error.message}` });
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">تسليم الموقع للعميل الجديد</h1>
        <p className="text-slate-600 mt-1">أدخل بريد العميل الجديد ليصبح هو المشرف الأساسي.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl">
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleHandover} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">إيميل العميل الجديد</label>
            <input
              type="email"
              required
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-left"
              dir="ltr"
              placeholder="new-admin@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'جاري التسليم...' : 'تسليم الموقع والخروج نهائياً'}
          </button>
        </form>
      </div>
    </div>
  );
}
