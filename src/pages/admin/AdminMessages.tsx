import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, Timestamp } from 'firebase/firestore';
import { updateDoc, deleteDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { Mail, Phone, Clock, Trash2, CheckCircle, MessageSquare, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  createdAt: Timestamp;
  status: 'new' | 'read' | 'replied';
  userId?: string;
}

export function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContactMessage[];
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("AdminMessages error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (msg: ContactMessage, status: 'read' | 'replied') => {
    try {
      await updateDoc(doc(db, 'contactMessages', msg.id), { status });
      if (status === 'replied' && msg.userId) {
         const { addDoc } = await import('firebase/firestore');
         await addDoc(collection(db, 'notifications'), {
            message: `تم الرد على رسالتك التي أرسلتها عبر اتصل بنا. يرجى تفقد بريدك الإلكتروني أو الواتساب.`,
            userId: msg.userId,
            isAdmin: false,
            read: false,
            createdAt: new Date().toISOString(),
            type: 'contact_reply'
         });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    try {
      await deleteDoc(doc(db, 'contactMessages', id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">رسائل العملاء</h1>
          <p className="text-slate-500 mt-1">إدارة الاستفسارات والرسائل الواردة من الموقع</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-sm font-medium text-slate-600">إجمالي الرسائل: </span>
          <span className="text-lg font-bold text-amber-600">{messages.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">صندوق الوارد فارغ</h3>
              <p className="text-slate-500 max-w-xs mx-auto">لم تصل أي رسائل جديدة من العملاء حتى هذه اللحظة. استمتع بيوم هادئ!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                layout
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (msg.status === 'new') handleStatusChange(msg, 'read');
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedMessage?.id === msg.id
                    ? 'bg-amber-50 border-amber-200 shadow-sm'
                    : msg.status === 'new'
                    ? 'bg-white border-amber-100 shadow-sm ring-1 ring-amber-50'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${msg.status === 'new' ? 'bg-amber-500' : 'bg-transparent'}`} />
                    <h4 className="font-bold text-slate-900">{msg.firstName} {msg.lastName}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {msg.createdAt?.toDate().toLocaleDateString('ar-YE')}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{msg.message}</p>
              </motion.div>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedMessage ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{selectedMessage.firstName} {selectedMessage.lastName}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <a href={`mailto:${selectedMessage.email}`} className="text-sm text-amber-600 hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {selectedMessage.email}
                        </a>
                        <a href={`tel:${selectedMessage.phone}`} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedMessage.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedMessage, 'replied')}
                      className={`p-2 rounded-xl transition-colors ${
                        selectedMessage.status === 'replied' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                      title="تم الرد"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                    <MessageSquare className="w-4 h-4" />
                    <span>محتوى الرسالة:</span>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[200px]">
                    {selectedMessage.message}
                  </div>
                  
                  <div className="mt-8 flex gap-4">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=بخصوص استفسارك في متجر عموري ستور`}
                      className="flex-1 bg-slate-900 hover:bg-amber-600 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" />
                      الرد عبر البريد
                    </a>
                    <a
                      href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      الرد عبر واتساب
                    </a>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <p>اختر رسالة من القائمة لعرض تفاصيلها</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
