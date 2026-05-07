import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Loader2, Mail, Shield, User as UserIcon, Key, Phone, X, Send, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleToggleRole = async (user: any) => {
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', user.id), {
        role: newRole
      });
      setMessage({ type: 'success', text: `تم تغيير صلاحية المستخدم إلى ${newRole === 'admin' ? 'مشرف' : 'عميل'} بنجاح.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error toggling role:", error);
      setMessage({ type: 'error', text: `حدث خطأ أثناء تغيير الصلاحيات: ${error.message}` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRequestResetLink = async () => {
    setProcessing(true);
    setMessage(null);

    try {
      if (!selectedUser?.email) {
        throw new Error('لا يوجد بريد إلكتروني مسجل لهذا المستخدم لإرسال الرابط.');
      }

      // Use standard Firebase frontend SDK for password reset
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('../../firebase');
      
      await sendPasswordResetEmail(auth, selectedUser.email);

      setResetSuccess(true);
      setMessage({ type: 'success', text: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني للمستخدم بنجاح.' });

    } catch (error: any) {
      console.error("Error sending reset link:", error);
      setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء إرسال الرابط.' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">إدارة المستخدمين</h1>
        <p className="text-slate-600 mt-1">عرض جميع العملاء والمشرفين المسجلين في النظام.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-900">المستخدم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-900">التواصل</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-900">الدور</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-900">تاريخ التسجيل</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-900">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}`} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                      <div>
                        <div className="font-bold text-slate-900">{user.displayName || 'بدون اسم'}</div>
                        <div className="text-xs text-slate-400">ID: {user.uid ? user.uid.substring(0, 8) : '...'}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600" dir="ltr">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600" dir="ltr">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                      {user.role === 'admin' ? 'مشرف' : 'عميل'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-YE') : 'غير معروف'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleRole(user)}
                        className={`${user.role === 'admin' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold`}
                      >
                        <Shield className="w-4 h-4" />
                        {user.role === 'admin' ? 'إزالة الإشراف' : 'ترقية لمشرف'}
                      </button>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="bg-amber-50 text-amber-600 hover:bg-amber-100 px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                      >
                        <Key className="w-4 h-4" />
                        المرور
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative"
            >
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute left-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                <Key className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">إعادة تعيين كلمة المرور</h2>
              
              <p className="text-slate-600 mb-6">
                سيتم إنشاء رابط آمن لإعادة تعيين كلمة المرور للمستخدم <span className="font-bold text-slate-900">{selectedUser.displayName || selectedUser.email}</span>.
              </p>

              {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <p>{message.text}</p>
                </div>
              )}

              <div className="space-y-5">
                {!resetSuccess ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleRequestResetLink}
                      disabled={processing}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      إنشاء الرابط
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setResetSuccess(false);
                        setMessage(null);
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-all"
                    >
                      إغلاق
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
