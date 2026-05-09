import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { updateDoc, addDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { Loader2, Check, X, Clock, User, Mail, Tag, Calendar, Send, MessageCircle } from 'lucide-react';

export function AdminOfferBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [adminMessage, setAdminMessage] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openConfirmModal = (booking: any) => {
    setSelectedBooking(booking);
    setAdminMessage(`مرحباً ${booking.userName}، يسعدنا إبلاغك بأنه تم تأكيد حجزك للعرض: ${booking.offerTitle}. سنتواصل معك قريباً لتحديد الموعد.`);
    setConfirmModalOpen(true);
  };

  const handleStatusUpdate = async (booking: any, newStatus: 'confirmed' | 'rejected') => {
    setProcessingId(booking.id);
    try {
      // 1. Update booking status
      await updateDoc(doc(db, 'bookings', booking.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        adminMessage: newStatus === 'confirmed' ? adminMessage : null
      });

      // 2. Create notification for user
      const message = newStatus === 'confirmed' 
        ? adminMessage
        : `نعتذر، تم رفض طلب حجزك للعرض: ${booking.offerTitle}. يرجى التواصل معنا للمزيد من التفاصيل.`;

      await addDoc(collection(db, 'notifications'), {
        userId: booking.userId,
        message,
        type: newStatus === 'confirmed' ? 'success' : 'error',
        read: false,
        createdAt: serverTimestamp()
      });

      // 3. Open WhatsApp link (instead of just email)
      if (booking.userPhone) {
        const phone = booking.userPhone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(adminMessage)}`;
        window.open(whatsappUrl, '_blank');
      }

      setConfirmModalOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error updating booking status:", error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">حجوزات العروض</h1>
          <p className="text-slate-500 mt-1">إدارة طلبات حجز العروض المقدمة من العملاء</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {bookings.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-100">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">لا توجد طلبات حجز حالياً</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{booking.userName}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="w-4 h-4" />
                      <span>{booking.userEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                    <Tag className="w-4 h-4 text-primary-500" />
                    <span className="font-medium">العرض:</span>
                    <span>{booking.offerTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span className="font-medium">التاريخ:</span>
                    <span>{booking.createdAt?.toDate().toLocaleDateString('ar-YE')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {booking.status === 'confirmed' && booking.userPhone && (
                  <a 
                    href={`https://wa.me/${booking.userPhone.replace(/\D/g, '')}?text=${encodeURIComponent(booking.adminMessage || '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 text-green-500 hover:bg-green-50 rounded-xl transition-colors border border-green-100"
                    title="مراسلة واتساب"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
                {booking.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(booking, 'rejected')}
                      disabled={processingId === booking.id}
                      className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      رفض
                    </button>
                    <button
                      onClick={() => openConfirmModal(booking)}
                      disabled={processingId === booking.id}
                      className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      تأكيد
                    </button>
                  </>
                ) : (
                  <div className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${
                    booking.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {booking.status === 'confirmed' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {booking.status === 'confirmed' ? 'تم التأكيد' : 'تم الرفض'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && selectedBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setConfirmModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">تأكيد حجز العرض</h3>
              <button 
                onClick={() => setConfirmModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رسالة التأكيد (ستظهر للعميل)</label>
                <textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none h-32"
                  placeholder="اكتب رسالة التأكيد هنا..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => handleStatusUpdate(selectedBooking, 'confirmed')}
                disabled={processingId === selectedBooking.id}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                {processingId === selectedBooking.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                تأكيد وإرسال
              </button>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
