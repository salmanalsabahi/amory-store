import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, onSnapshot, where } from 'firebase/firestore';
import { setDoc, deleteDoc, updateDoc, addDoc } from '../../lib/safeFirestore';
import { db, auth } from '../../firebase';
import { PackageOpen, Search, Trash2, Edit2, Plus, Image as ImageIcon, Loader2, X, Check, AlertCircle, Save, Filter, ChevronDown } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/firebaseErrorHandler';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

interface ProductFormState {
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  stock: number;
  stockStatus: 'in_stock' | 'out_of_stock';
  isComingSoon: boolean;
  description: string;
  images: string[];
}

const INITIAL_FORM_STATE: ProductFormState = {
  name: '',
  brand: '',
  category: '',
  price: 0,
  originalPrice: 0,
  stock: 10,
  stockStatus: 'in_stock',
  isComingSoon: false,
  description: '',
  images: ['']
};

export function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(INITIAL_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products', auth));
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
        // Deduplicate category names
        const dbCats = Array.from(new Set(snapshot.docs.map(d => d.data().name).filter(Boolean)));
        setCategories(['All', ...dbCats]);
        // Set default category for form if empty
        if (!formState.category && dbCats.length > 0) {
            setFormState(prev => ({ ...prev, category: dbCats[0] }));
        }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories', auth));
    return () => { unsubProducts(); unsubCats(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const productData = {
        ...formState,
        updatedAt: new Date().toISOString(),
      };

      let becameAvailable = false;
      const isNowAvailable = !formState.isComingSoon && formState.stock > 0;

      if (editingId) {
        const existingProduct = products.find(p => p.id === editingId);
        if (existingProduct) {
          const wasNotAvailable = existingProduct.stock <= 0 || existingProduct.isComingSoon;
          if (wasNotAvailable && isNowAvailable) {
            becameAvailable = true;
          }
        }
        await updateDoc(doc(db, 'products', editingId), productData);
      } else {
        const newDocRef = doc(collection(db, 'products'));
        await setDoc(newDocRef, { ...productData, createdAt: new Date().toISOString() });
      }

      if (becameAvailable && editingId) {
        try {
          const notifsQuery = query(
            collection(db, 'stock_notifications'),
            where('productId', '==', editingId),
            where('status', '==', 'pending')
          );
          const notifsSnapshot = await getDocs(notifsQuery);
          
          for (const notifDoc of notifsSnapshot.docs) {
            const data = notifDoc.data();
            if (data.userId) {
              await addDoc(collection(db, 'notifications'), {
                userId: data.userId,
                title: 'تنبيه توفر المنتج',
                message: `أبشرك! المنتج ${formState.name} اللي كنت تنتظره صار متوفر الآن في متجرنا.`,
                type: 'success',
                link: `/product/${editingId}`,
                read: false,
                createdAt: new Date()
              });
            }
            await updateDoc(doc(db, 'stock_notifications', notifDoc.id), {
              status: 'notified',
              notifiedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error("Error sending stock notifications:", error);
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("فشل حفظ المنتج. يرجى المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'products', deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setFormState({
      name: product.name || '',
      brand: product.brand || '',
      category: product.category || '',
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
      stock: product.stock || 0,
      stockStatus: product.stockStatus || 'in_stock',
      isComingSoon: product.isComingSoon || false,
      description: product.description || '',
      images: product.images?.length > 0 ? product.images : ['']
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setEditingId(null);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
      <LoadingSpinner size="lg" label="جاري استدعاء قائمة المنتجات..." />
    </div>
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;

          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedData = canvas.toDataURL('image/jpeg', 0.7);
          
          setFormState(prev => ({
            ...prev,
            images: [...prev.images.filter(img => img !== ''), compressedData]
          }));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">إدارة المخزون</h1>
          <p className="text-slate-500 font-medium">التحكم الكامل في منتجات وتوفر المتجر</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-3 shadow-lg shadow-rose-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج جديد
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors" />
          <input
            type="text"
            placeholder="ابحث باسم المنتج أو الماركة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 pr-12 py-3.5 rounded-2xl border-2 border-slate-100 bg-white focus:border-rose-500 focus:outline-none transition-all font-medium"
          />
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl border-2 border-slate-100 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap",
                activeCategory === cat ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {cat === 'All' ? 'الكل' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-transparent md:bg-white md:rounded-[2rem] md:shadow-sm md:border md:border-slate-100 md:overflow-hidden">
        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {filteredProducts.length === 0 ? (
             <div className="text-center py-10 text-slate-500 font-medium">لا توجد منتجات مطابقة</div>
          ) : filteredProducts.map(product => (
            <div key={product.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-transform">
              <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.images?.[0] ? 
                  <img src={product.images[0]} className="max-h-full object-contain mix-blend-multiply" alt={product.name} /> : 
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">{product.name}</div>
                <div className="text-[11px] text-slate-500">{product.category} • {product.brand}</div>
                <div className="font-black text-rose-600 text-sm mt-0.5">{product.price.toLocaleString()} ريال</div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => openEdit(product)}
                  className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setDeleteId(product.id)}
                  className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto overflow-y-hidden">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">المنتج</th>
                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">الصنف والماركة</th>
                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">السعر</th>
                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">المخزون</th>
                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center opacity-40">
                       <PackageOpen className="w-16 h-16 mb-4 text-slate-300" />
                       <p className="font-bold text-slate-500">لا توجد منتجات مطابقة لعملية البحث</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 p-2 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        {product.images?.[0] ? 
                          <img src={product.images[0]} className="max-h-full object-contain mix-blend-multiply" alt={product.name} /> : 
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        }
                      </div>
                      <div>
                        <div className="font-black text-slate-900 mb-0.5 line-clamp-1">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-700">{product.category}</div>
                    <div className="text-xs text-slate-400 font-medium">{product.brand}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col">
                      <div className="font-black text-emerald-600">{product.price.toLocaleString()} ريال</div>
                      {product.originalPrice > 0 && product.originalPrice > product.price && (
                        <div className="text-[10px] text-slate-400 font-bold line-through ml-1">
                          {product.originalPrice.toLocaleString()} ريال
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-24">
                           <div 
                             className={cn(
                               "h-full rounded-full transition-all duration-1000",
                               product.stock > 5 ? "bg-emerald-500" : product.stock > 0 ? "bg-rose-500" : "bg-rose-500"
                             )}
                             style={{ width: `${Math.min(100, (product.stock / 20) * 100)}%` }}
                           />
                        </div>
                        <span className="text-xs font-black text-slate-600">{product.stock} قـطعة</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black w-fit px-2 py-0.5 rounded-md",
                        product.isComingSoon ? "bg-amber-50 text-amber-600 border border-amber-100" : product.stockStatus === 'in_stock' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                      )}>
                        {product.isComingSoon ? 'قريباً' : product.stockStatus === 'in_stock' ? 'متوفر' : 'نفد'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openEdit(product)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all hover:scale-110"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteId(product.id)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all hover:scale-110"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/40 overflow-hidden font-body"
            >
              <div className="flex justify-between items-center px-10 py-8 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{editingId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h2>
                  <p className="text-sm font-medium text-slate-500">أدخل كافة التفاصيل لضمان ظهورها بشكل صحيح للعملاء</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 sm:px-12 sm:pb-12 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {/* Basic Info */}
                  <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-sm font-black text-rose-600 uppercase tracking-widest border-r-4 border-rose-500 pr-3 mb-8">المعلومات الأساسية</h3>
                    
                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-700 block">اسم المنتج</label>
                       <input 
                         type="text" required
                         value={formState.name}
                         onChange={e => setFormState({...formState, name: e.target.value})}
                         className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-rose-500 focus:outline-none transition-all font-bold"
                         placeholder="اسم الساعة أو العطر..."
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-sm font-black text-slate-700 block">الماركة (Brand)</label>
                         <input 
                           type="text" required
                           value={formState.brand}
                           onChange={e => setFormState({...formState, brand: e.target.value})}
                           className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-rose-500 focus:outline-none transition-all font-bold"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-black text-slate-700 block">الصنف</label>
                         <select 
                           value={formState.category}
                           onChange={e => setFormState({...formState, category: e.target.value})}
                           required
                           className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-rose-500 focus:outline-none transition-all font-bold appearance-none bg-white"
                         >
                            <option value="" disabled>اختر صنفاً</option>
                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-700 block">الوصف</label>
                       <textarea 
                         rows={4}
                         value={formState.description}
                         onChange={e => setFormState({...formState, description: e.target.value})}
                         className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-rose-500 focus:outline-none transition-all font-bold resize-none"
                         placeholder="اكتب وصفاً جذاباً للمنتج..."
                       />
                    </div>
                  </div>

                  {/* Pricing & Logic */}
                  <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-sm font-black text-rose-600 uppercase tracking-widest border-r-4 border-rose-500 pr-3 mb-8">الأسعار والكميات</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 text-slate-500">
                         <label className="text-sm font-black block">السعر القديم (ريال) - اختياري</label>
                         <input 
                           type="number"
                           value={formState.originalPrice}
                           onChange={e => setFormState({...formState, originalPrice: Number(e.target.value)})}
                           className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-slate-500 focus:outline-none transition-all font-bold text-slate-400"
                           placeholder="مثلاً: 1500"
                         />
                      </div>
                      <div className="space-y-2 text-rose-600">
                         <label className="text-sm font-black block">السعر الحالي (ريال)</label>
                         <input 
                           type="number" required
                           value={formState.price}
                           onChange={e => setFormState({...formState, price: Number(e.target.value)})}
                           className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-rose-500 focus:outline-none transition-all font-bold"
                           placeholder="مثلاً: 1200"
                         />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-sm font-black text-slate-700 block">الكمية المتوفرة</label>
                          <input 
                            type="number"
                            value={formState.stock}
                            onChange={e => {
                               const val = Number(e.target.value);
                               setFormState({...formState, stock: val, stockStatus: val > 0 ? 'in_stock' : 'out_of_stock'});
                            }}
                            disabled={formState.isComingSoon}
                            className={cn("w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-rose-500 focus:outline-none transition-all font-bold", formState.isComingSoon && "opacity-50 bg-slate-50")}
                          />
                       </div>
                       <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 block">حالة المخزون</label>
                            <select 
                              value={formState.stockStatus}
                              onChange={e => setFormState({...formState, stockStatus: e.target.value as any})}
                              disabled={formState.isComingSoon}
                              className={cn("w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-rose-500 focus:outline-none transition-all font-bold appearance-none bg-white", formState.isComingSoon && "opacity-50 bg-slate-50")}
                            >
                               <option value="in_stock">متوفر (In Stock)</option>
                               <option value="out_of_stock">نفد (Out of Stock)</option>
                            </select>
                          </div>
                          
                          <label className="flex items-center gap-3 cursor-pointer mt-4 bg-amber-50 p-3 rounded-xl border border-amber-100 hover:bg-amber-100/50 transition-colors">
                            <input 
                              type="checkbox"
                              checked={formState.isComingSoon}
                              onChange={e => setFormState({...formState, isComingSoon: e.target.checked})}
                              className="w-5 h-5 rounded hover:cursor-pointer accent-amber-500"
                            />
                            <span className="text-sm font-bold text-amber-900">المنتج سيتوفر قريباً (قيد الاستيراد)</span>
                          </label>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-black text-slate-700 block">صور المنتج (اختر من جهازك)</label>
                       <div className="grid grid-cols-3 gap-4 mb-4">
                         {formState.images.map((img, idx) => img && (
                           <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-100 group">
                             <img src={img} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                             <button 
                               type="button"
                               onClick={() => setFormState(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                               className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                               <X className="w-4 h-4" />
                             </button>
                           </div>
                         ))}
                         <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-rose-500 hover:bg-rose-50/50 transition-all">
                           <input 
                             type="file" 
                             accept="image/*"
                             multiple
                             className="hidden"
                             onChange={handleImageUpload}
                           />
                           <Plus className="w-6 h-6 text-slate-400" />
                           <span className="text-[10px] font-black text-slate-500">إضافة صورة</span>
                         </label>
                       </div>
                       <p className="text-[10px] text-slate-400 font-medium italic">* سيتم ضغط الصور تلقائياً لتناسب العرض</p>
                    </div>
                  </div>
                </div>

                <div className="mt-16 flex gap-4">
                   <button 
                     type="button"
                     onClick={() => setIsModalOpen(false)}
                     className="flex-1 px-8 py-4 rounded-[1.5rem] font-bold text-slate-400 hover:bg-slate-50 transition-all"
                   >
                     إلغاء
                   </button>
                   <button 
                     type="submit"
                     disabled={submitting}
                     className="flex-[2] bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-8 py-4 rounded-[1.5rem] font-black text-lg shadow-xl shadow-rose-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                   >
                     {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                     {editingId ? 'حفظ التعديلات' : 'نشر المنتج الآن'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف المنتج"
        message="هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من المتجر؟ سيتوقف العملاء عن رؤيته."
        confirmText="نعم، حذف المنتج"
        cancelText="إلغاء والتراجع"
        variant="danger"
      />
    </div>
  );
}
