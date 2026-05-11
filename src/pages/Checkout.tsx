import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, addDoc, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebaseErrorHandler';
import { db, auth, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { Truck, CheckCircle2, Loader2, CreditCard, Wallet, Banknote, Tag, ShoppingBag, Upload } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';

import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function Checkout() {
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const { items: cartItems, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('جاري إرسال الطلب...');
  const [success, setSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [couponMessage, setCouponMessage] = useState('');
  
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [shippingFee, setShippingFee] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    governorate: '',
    address: '',
    paymentMethod: 'الدفع عند الاستلام'
  });

  useEffect(() => {
    const fetchMethodsAndShipping = async () => {
      try {
        const q = query(collection(db, 'paymentMethods'), where('isEnabled', '==', true), orderBy('name'));
        const qs = await getDocs(q);
        setPaymentMethods(qs.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }

      try {
        const docRef = doc(db, 'siteSettings', 'shipping');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().rates) {
          const activeRates = docSnap.data().rates.filter((r: any) => r.isActive);
          setShippingRates(activeRates);
          if (activeRates.length > 0) {
            setFormData(prev => ({ ...prev, governorate: activeRates[0].name }));
            setShippingFee(activeRates[0].cost || 0);
          }
        } else {
          // Fallback basic governorates
          const defaultGovs = ['صنعاء', 'عدن', 'تعز', 'حجة', 'الحديدة', 'إب'];
          const rates = defaultGovs.map(name => ({ name, cost: 0, isActive: true }));
          setShippingRates(rates);
          setFormData(prev => ({ ...prev, governorate: rates[0].name }));
        }
      } catch (error) {
        console.error("Error fetching shipping rates:", error);
      }
    };
    fetchMethodsAndShipping();
  }, []);

  const handleGovernorateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const govName = e.target.value;
    setFormData({ ...formData, governorate: govName });
    const selectedGov = shippingRates.find(r => r.name === govName);
    if (selectedGov) {
      setShippingFee(selectedGov.cost || 0);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!isOnline) {
      setCouponMessage('يجب أن تكون متصلاً بالإنترنت للتحقق من الكوبون');
      return;
    }
    setValidatingCoupon(true);
    setCouponMessage('');
    try {
      const qs = await getDocs(query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase())));
      if (qs.empty) {
        setCouponMessage('كود الخصم غير صحيح');
        setAppliedCoupon(null);
      } else {
        const coupon = qs.docs[0].data();
        if (coupon.active) {
          setAppliedCoupon({ code: coupon.code, discount: coupon.discountPercentage });
          setCouponMessage(`تم تطبيق خصم ${coupon.discountPercentage}% بنجاح`);
        } else {
          setCouponMessage('عذراً، هذا الكوبون غير فعال حالياً');
          setAppliedCoupon(null);
        }
      }
    } catch (e) {
      setCouponMessage('حدث خطأ');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discount / 100) : 0;
  const total = subtotal - discountAmount + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit started");
    
    if (!isOnline) {
      toast.error('المعذرة منك ياحبوب.. النت مقطوع، يرجى الاتصال بالنت لإتمام طلبك.');
      return;
    }

    if (cartItems.length === 0) {
      toast('سلتك فارغة يا غالي، ضيف منتجات عشان تكمل طلبك.', { icon: '🛒' });
      return;
    }
    
    if (formData.paymentMethod !== 'الدفع عند الاستلام' && !paymentProof) {
      toast.error('ياحبوب إلزامي ترفق رسالة او صورة التسديد عشان نكمل الطلب.');
      return;
    }
    
    setLoading(true);
    setLoadingMessage('جاري تهيئة الطلب...');
    console.log("Loading set to true, starting order sequence");

    try {
      const generatedOrderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      
      let paymentProofUrl = null;
      if (paymentProof) {
        setLoadingMessage('جاري معالجة السند...');
        
        try {
          const options = {
            maxSizeMB: 0.15, // Extremely compressed to fit in Firestore safely
            maxWidthOrHeight: 800,
            useWebWorker: false,
          };
          
          setLoadingMessage('جاري معالجة السند...');
          const compressedFile = await imageCompression(paymentProof, options);
          
          setLoadingMessage('جاري تجهيز السند...');
          
          paymentProofUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) {
                resolve(reader.result as string);
              } else {
                reject(new Error("Failed to read file"));
              }
            };
            reader.onerror = (error) => {
              reject(error);
            };
            reader.readAsDataURL(compressedFile);
          });
          
          setLoadingMessage('اتمام الطلب...');
          
        } catch (uploadError: any) {
          console.error("Image upload error:", uploadError);
          throw new Error('فشل رفع صورة السند. حاول مجدداً أو استخدم صورة أصغر.');
        }
      }
      
      setLoadingMessage('جاري حفظ الطلب...');
      const newOrder = {
        orderNumber: generatedOrderNum,
        userId: auth.currentUser?.uid || null,
        customerInfo: {
          name: formData.name,
          phone: formData.phone,
          governorate: formData.governorate,
          address: formData.address
        },
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        })),
        subtotal: subtotal,
        shippingFee: shippingFee,
        discount: discountAmount,
        couponCode: appliedCoupon?.code || null,
        total: total,
        paymentMethod: formData.paymentMethod,
        paymentProofUrl: paymentProofUrl,
        status: 'pending',
        paymentStatus: 'Pending Payment',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'orders'), newOrder);
      await clearCart();
      
      // Notify Admin
      try {
        await addDoc(collection(db, 'notifications'), {
          message: `طلب جديد بقيمة ${total} ريال من ${formData.name}`,
          link: '/admin/orders',
          isAdmin: true,
          read: false,
          createdAt: new Date().toISOString(),
          type: 'order'
        });
        
        // Notify User
        const currentUser = auth.currentUser;
        if (currentUser) {
          await addDoc(collection(db, 'notifications'), {
            message: `تم استلام طلبك رقم ${generatedOrderNum} بنجاح. سنقوم بمعالجته قريباً.`,
            userId: currentUser.uid,
            isAdmin: false,
            read: false,
            createdAt: new Date().toISOString(),
            type: 'order'
          });
        }
      } catch (notifError) {
        console.warn('Failed to create notifications:', notifError);
      }
      
      setLoadingMessage('تم بنجاح!');
      setOrderNum(generatedOrderNum);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error submitting order:", error);
      // Ensure we stop the loader
      setLoading(false);
      try {
        const errorInfo = JSON.parse(error instanceof Error ? error.message : String(error));
        toast.error('حدث خطأ ياحبوب: ' + errorInfo.error);
      } catch (e) {
        toast.error(error instanceof Error ? error.message : 'حدث خطأ غير متوقع ياحبوب. جرب مرة ثانية.');
      }
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="pt-32 pb-32 max-w-2xl mx-auto px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-50 p-8 rounded-3xl border border-green-100"
        >
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 mb-2">تم استلام طلبك بنجاح!</h2>
          <p className="text-slate-600 mb-6">شكراً لتسوقك من عموري ستور. سيتم معالجة طلبك قريباً.</p>
          
          <div className="bg-white p-6 rounded-2xl inline-block text-right mb-8 w-full max-w-md shadow-sm">
            <div className="text-sm text-slate-500 mb-1">رقم الطلب الخاص بك:</div>
            <div className="text-2xl font-bold text-rose-600 font-mono tracking-wider">{orderNum}</div>
            <p className="text-xs text-slate-400 mt-2">يرجى الاحتفاظ بهذا الرقم لتتبع حالة طلبك.</p>
          </div>

          <div>
            <button 
              onClick={() => navigate('/tracking')}
              className="bg-rose-600 text-white hover:bg-rose-700 px-8 py-3 rounded-xl font-medium transition-colors"
            >
              تتبع الطلب
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cartItems.length === 0 && !success) {
      return (
          <div className="pt-32 pb-32 max-w-2xl mx-auto px-4 text-center">
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
                <ShoppingBag className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-800 mb-4">سلتك فارغة</h2>
                <p className="text-slate-500 mb-8 font-medium">لا يمكنك إتمام الطلب بدون إضافة منتجات إلى السلة أولاً.</p>
                <button 
                    onClick={() => navigate('/store')}
                    className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-600/20"
                >
                    اذهب للمتجر
                </button>
            </div>
          </div>
      )
  }

  return (
    <div className="pt-24 pb-32 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-screen overflow-x-hidden">
      <h1 className="text-3xl font-display font-bold mb-8">إتمام الطلب</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Shipping details */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Truck className="w-5 h-5 text-rose-500" />
            معلومات التوصيل
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">الاسم الكامل *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                placeholder="الاسم الثلاثي"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">رقم الهاتف (واتساب) *</label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors text-left"
                placeholder="770000000"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">المحافظة *</label>
              <select
                value={formData.governorate}
                onChange={handleGovernorateChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                disabled={shippingRates.length === 0}
              >
                {shippingRates.map(gov => (
                  <option key={gov.name} value={gov.name}>
                    {gov.name} {gov.cost > 0 ? `(+${gov.cost} ريال)` : '(توصيل مجاني)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">العنوان التفصيلي *</label>
              <input
                required
                type="text"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                placeholder="المدينة، الشارع، أقرب معلم"
              />
            </div>
          </div>
        </div>

        {/* Coupon */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Tag className="w-5 h-5 text-rose-500" />
            هل لديك كود خصم؟
          </h2>
          <div className="flex gap-2 relative flex-wrap sm:flex-nowrap">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="أدخل كود الخصم هنا"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors uppercase min-w-[200px]"
              disabled={!!appliedCoupon || validatingCoupon}
            />
            <button
              type="button"
              onClick={appliedCoupon ? () => { setAppliedCoupon(null); setCouponCode(''); setCouponMessage(''); } : handleApplyCoupon}
              disabled={validatingCoupon || (!couponCode && !appliedCoupon)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 justify-center flex-shrink-0 ${appliedCoupon ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
            >
              {validatingCoupon ? <Loader2 className="w-5 h-5 animate-spin" /> : appliedCoupon ? 'إلغاء' : 'تطبيق'}
            </button>
          </div>
          {couponMessage && (
            <div className={`mt-3 text-sm font-medium ${appliedCoupon ? 'text-green-600' : 'text-red-500'}`}>
              {couponMessage}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-500" />
            طريقة الدفع
          </h2>
          
          <div className="space-y-4">
            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${formData.paymentMethod === 'الدفع عند الاستلام' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-rose-300'}`}>
              <input 
                type="radio" 
                name="payment" 
                value="الدفع عند الاستلام"
                checked={formData.paymentMethod === 'الدفع عند الاستلام'}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                className="w-5 h-5 text-rose-600 focus:ring-rose-500 border-slate-300"
              />
              <Banknote className="w-6 h-6 text-slate-600" />
              <div>
                <div className="font-bold text-slate-900">الدفع عند الاستلام</div>
                <div className="text-sm text-slate-500">ادفع نقداً عند استلام طلبك</div>
              </div>
            </label>

            {paymentMethods.map(method => (
              <div key={method.id} className="space-y-4">
                <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${formData.paymentMethod === method.name ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-rose-300'}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value={method.name}
                    checked={formData.paymentMethod === method.name}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-5 h-5 text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  {method.type === 'bank' ? <CreditCard className="w-6 h-6 text-slate-600"/> : <Wallet className="w-6 h-6 text-slate-600"/>}
                  <div>
                    <div className="font-bold text-slate-900">{method.name}</div>
                    <div className="text-sm text-slate-500">{method.providerName}</div>
                  </div>
                </label>
                
                {formData.paymentMethod === method.name && (
                  <div className="text-sm text-rose-800 bg-rose-100 p-4 rounded-xl space-y-2">
                    <p className="font-bold">يرجى التحويل إلى المعلومة التالية:</p>
                    <p>{method.accountName}: {method.accountNumber}</p>
                    <p>بعد التحويل، قم بتصوير سند أو إشعار التحويل وأرفقه بالأسفل لإتمام الطلب.</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {formData.paymentMethod !== 'الدفع عند الاستلام' && (
            <div className="mt-6 p-4 border border-dashed border-rose-300 rounded-xl space-y-3 bg-rose-50/50">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Upload className="w-4 h-4 text-rose-600" />
                إرفاق صورة التحويل/الحوالة *
              </label>
              <input 
                type="file"
                accept="image/*"
                onChange={(e) => setPaymentProof(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-600 file:text-white hover:file:bg-rose-700 file:cursor-pointer"
              />
              <p className="text-xs text-slate-500">يجب إرفاق صورة واضحة للحوالة البنكية أو إشعار التحويل.</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-rose-600 text-white hover:bg-rose-700 p-6 rounded-3xl">
          <div className="flex-1 w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>المجموع الفرعي:</span>
              <span>{subtotal.toLocaleString()} ريال</span>
            </div>
            {discountAmount > 0 && (
               <div className="flex items-center justify-between text-sm text-green-300">
                <span>الخصم ({appliedCoupon?.discount}%):</span>
                <span>-{discountAmount.toLocaleString()} ريال</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-white/80 border-b border-white/20 pb-2">
              <span>التوصيل:</span>
              <span>{shippingFee.toLocaleString()} ريال</span>
            </div>
            <div className="flex items-center justify-between font-bold text-white text-xl pt-1">
              <span>الإجمالي:</span>
              <span>{total.toLocaleString()} <span className="text-sm font-normal text-white/80">ريال</span></span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-white text-rose-600 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:bg-rose-50 disabled:opacity-70 flex items-center justify-center min-w-[200px] active:scale-95"
          >
            {loading ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>{loadingMessage}</span>
                </div>
            ) : "تأكيد الطلب"}
          </button>
        </div>

      </form>
    </div>
  );
}
