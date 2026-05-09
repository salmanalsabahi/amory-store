import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { addDoc, updateDoc, deleteDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { Plus, Trash2, Edit2, Loader2, CreditCard, Wallet, Banknote, ToggleLeft, ToggleRight, Save, X } from 'lucide-react';

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

  useEffect(() => {
    fetchMethods();
  }, []);

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">إدارة طرق الدفع</h1>
        <button onClick={() => setAdding(true)} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-xl font-medium">
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
