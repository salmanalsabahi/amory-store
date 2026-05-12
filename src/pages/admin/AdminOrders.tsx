import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { updateDoc, deleteDoc, addDoc } from '../../lib/safeFirestore';
import { db } from '../../firebase';
import { Package, Search, Filter, Loader2, ArrowLeftRight, CheckCircle2, Clock, Trash2, X, Plus, ExternalLink, MessageCircle, Eye, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrder = async (orderId: string, updates: any, orderData?: any) => {
    try {
      setUpdating(orderId);
      await updateDoc(doc(db, 'orders', orderId), updates);
      
      if (updates.status && orderData?.userId) {
        let message = '';
        switch(updates.status) {
          case 'processing': message = `طلبك رقم ${orderData.orderNumber} قيد التجهيز الآن.`; break;
          case 'shipped': message = `تم شحن طلبك رقم ${orderData.orderNumber}.`; break;
          case 'delivered': message = `تم تسليم طلبك رقم ${orderData.orderNumber}.`; break;
          case 'cancelled': message = `تم رفض/إلغاء لطلبك رقم ${orderData.orderNumber}.`; break;
          default: message = `تم تحديث حالة طلبك رقم ${orderData.orderNumber}.`;
        }
        
        await addDoc(collection(db, 'notifications'), {
          message,
          userId: orderData.userId,
          isAdmin: false,
          read: false,
          createdAt: new Date().toISOString(),
          type: 'order'
        });
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert('حدث خطأ أثناء تحديث الطلب');
    } finally {
      setUpdating(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      console.error("Error deleting order:", error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.customerInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerInfo?.phone?.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    'pending': { label: 'جديد', color: 'bg-slate-100 text-slate-600', icon: Clock },
    'processing': { label: 'قيد التجهيز', color: 'bg-rose-100/10 text-rose-600', icon: Package },
    'shipped': { label: 'تم الشحن', color: 'bg-blue-100/10 text-blue-600', icon: ArrowLeftRight },
    'delivered': { label: 'تم التسليم', color: 'bg-emerald-100/10 text-emerald-600', icon: CheckCircle2 },
    'cancelled': { label: 'مرفوض', color: 'bg-rose-100/10 text-rose-600', icon: X }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">إدارة الطلبات</h1>
          <p className="text-slate-500">متابعة ومعالجة طلبات العملاء</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="text-center px-4 border-l border-slate-200">
            <div className="text-2xl font-bold text-slate-900">{orders.filter(o => o.status === 'pending').length}</div>
            <div className="text-sm text-slate-500">طلبات جديدة</div>
          </div>
          <div className="text-center px-4">
            <div className="text-2xl font-bold text-slate-900">{orders.length}</div>
            <div className="text-sm text-slate-500">إجمالي الطلبات</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث برقم الطلب، الاسم، أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto relative">
            <Filter className="w-5 h-5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:w-48 appearance-none px-4 pl-10 py-2 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors bg-white cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">طلبات جديدة</option>
              <option value="processing">قيد التجهيز</option>
              <option value="shipped">تم الشحن</option>
              <option value="delivered">مكتملة</option>
              <option value="cancelled">ملغية</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4 pt-4">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500">لا توجد طلبات مطابقة</div>
          ) : filteredOrders.map((order, index) => {
            const StatusIcon = statusMap[order.status]?.icon || Package;
            const whatsappUrl = `https://wa.me/${order.customerInfo?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${order.customerInfo?.name}، بخصوص طلبك رقم ${order.orderNumber}...`)}`;
            
            return (
              <div key={order.id} className={cn(
                "p-4 rounded-2xl border space-y-4",
                index % 2 === 0 ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50 border-slate-200 shadow-sm"
              )}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono font-bold text-slate-900 mb-1">{order.orderNumber}</div>
                    <div className="text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString('en-CA')}</div>
                  </div>
                  <div className="text-left flex flex-col items-end">
                    <div className="font-bold text-slate-900">{order.total?.toLocaleString()} ريال</div>
                    <div className="text-xs text-slate-500">{order.paymentMethod}</div>
                    {order.couponCode && (
                       <div className="text-[10px] text-green-600 bg-green-50 px-1 py-0.5 rounded mt-0.5" dir="ltr">
                         كود: {order.couponCode}
                       </div>
                    )}
                  </div>
                </div>
                
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  index % 2 === 0 ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200"
                )}>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-sm mb-0.5">{order.customerInfo?.name}</div>
                    <div className="text-xs text-slate-500">{order.customerInfo?.phone} • {order.customerInfo?.governorate}</div>
                  </div>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>

                {order.paymentProofUrl && (
                  <button 
                    onClick={() => setPreviewImage(order.paymentProofUrl)}
                    className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    عرض سند التحويل
                  </button>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex-1">
                    {updating === order.id ? (
                      <div className="w-full py-2 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-rose-500" /></div>
                    ) : (
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrder(order.id, { status: e.target.value }, order)}
                          className={cn(
                            "w-full appearance-none px-4 py-2 pl-10 rounded-xl text-sm font-bold text-center cursor-pointer transition-all border-none focus:ring-2 focus:ring-rose-500",
                            statusMap[order.status]?.color || "bg-slate-100 text-slate-700"
                          )}
                        >
                          <option value="pending">جديد</option>
                          <option value="processing">قيد التجهيز</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="delivered">تم التسليم</option>
                          <option value="cancelled">مرفوض</option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteOrder(order.id)}
                    className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">رقم الطلب</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">العميل</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">التاريخ</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">الإجمالي</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">طريقة الدفع</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600 text-center">السند</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600 text-center">الحالة</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">واتساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">لا توجد طلبات مطابقة</td>
                </tr>
              ) : filteredOrders.map((order) => {
                const StatusIcon = statusMap[order.status]?.icon || Package;
                const whatsappUrl = `https://wa.me/${order.customerInfo?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${order.customerInfo?.name}، بخصوص طلبك رقم ${order.orderNumber}...`)}`;
                
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 mb-0.5">{order.customerInfo?.name}</div>
                      <div className="text-xs text-slate-500">{order.customerInfo?.governorate}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString('en-CA')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{order.total?.toLocaleString()} ريال</div>
                      {order.couponCode && (
                        <div className="text-[10px] text-green-600 bg-green-50 px-1 py-0.5 rounded inline-block mt-0.5" dir="ltr">
                          كود: {order.couponCode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.paymentMethod}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {order.paymentProofUrl ? (
                        <button 
                          onClick={() => setPreviewImage(order.paymentProofUrl)}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          عرض السند
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {updating === order.id ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-rose-500" />
                      ) : (
                        <div className="relative inline-block w-32">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrder(order.id, { status: e.target.value }, order)}
                            className={cn(
                              "appearance-none w-full px-4 py-2 pl-8 rounded-full text-xs font-bold text-center cursor-pointer transition-all border-none focus:ring-2 focus:ring-offset-1 focus:ring-rose-500",
                              statusMap[order.status]?.color || "bg-slate-100 text-slate-700"
                            )}
                          >
                            <option value="pending" className="bg-white text-slate-900">جديد</option>
                            <option value="processing" className="bg-white text-slate-900">قيد التجهيز</option>
                            <option value="shipped" className="bg-white text-slate-900">تم الشحن</option>
                            <option value="delivered" className="bg-white text-slate-900">تم التسليم</option>
                            <option value="cancelled" className="bg-white text-slate-900">مرفوض</option>
                          </select>
                          <ChevronDown className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <a 
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          title="تواصل واتساب"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </a>
                        <button 
                          onClick={() => deleteOrder(order.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف الطلب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center bg-white p-4 rounded-t-xl">
              <h3 className="font-bold text-slate-900">سند التحويل</h3>
              <button 
                onClick={() => setPreviewImage(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-100 p-4 rounded-b-xl overflow-auto flex items-center justify-center min-h-[50vh]">
              <img src={previewImage} alt="Payment Proof" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
