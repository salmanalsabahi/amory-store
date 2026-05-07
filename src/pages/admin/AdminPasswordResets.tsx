import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, getDocs, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { Loader2, Check, X, Clock, User, Mail, Phone, Key, Send, AlertCircle } from 'lucide-react';

export function AdminPasswordResets() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'password_reset_requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleResetPassword = async (request: any) => {
    setProcessingId(request.id);
    setMessage(null);

    try {
      // 1. Find user by email or phone
      const usersRef = collection(db, 'users');
      let q = query(usersRef, where('email', '==', request.identifier));
      let querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Try searching string matched phone
        q = query(usersRef, where('phone', '==', request.identifier));
        querySnapshot = await getDocs(q);
      }

      if (querySnapshot.empty) {
        throw new Error('لم يتم العثور على المستخدم في قاعدة البيانات. قد يكون الحساب محذوفاً أو أن بريده/الرقم المدخل خطأ.');
      }

      const userData = querySnapshot.docs[0].data();
      const userEmail = userData.email;
      const userUid = userData.uid;

      if (!userEmail) {
        throw new Error('لا يوجد بريد إلكتروني مرتبط بالمستخدم لإرسال الرابط.');
      }

      // 2. Send official Firebase Password Reset Email
      await sendPasswordResetEmail(auth, userEmail);

      // 3. Create notification for user
      await addDoc(collection(db, 'notifications'), {
        userId: userUid,
        title: 'إعادة تعيين كلمة المرور',
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح من قبل الإدارة.',
        type: 'system',
        read: false,
        createdAt: serverTimestamp()
      });

      // 4. Update request status
      await updateDoc(doc(db, 'password_reset_requests', request.id), {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      setMessage({ type: 'success', text: 'تم إرسال رابط تحديث كلمة المرور لبريد المستخدم بنجاح!' });

    } catch (error: any) {
      console.error("Error resetting password:", error);
      setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء إرسال الرابط. حاول مرة أخرى.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, 'password_reset_requests', id), {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">طلبات إعادة تعيين كلمة المرور</h1>
        <p className="text-slate-500 mt-1">إدارة طلبات المستخدمين الذين فقدوا الوصول إلى حساباتهم</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {requests.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-100">
            <Key className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">لا توجد طلبات حالياً</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{request.identifier}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>{request.createdAt?.toDate().toLocaleString('ar-YE')}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                  request.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                  request.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {request.status === 'pending' ? 'قيد الانتظار' :
                   request.status === 'completed' ? 'تم الإنجاز' : 'تم الرفض'}
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="flex flex-col md:flex-row gap-4 items-end mt-4">
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleReject(request.id)}
                      className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
                    >
                      تجاهل
                    </button>
                    <button
                      onClick={() => handleResetPassword(request)}
                      disabled={processingId === request.id}
                      className="flex-[2] px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processingId === request.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      إرسال رابط الاستعادة للمستخدم
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
