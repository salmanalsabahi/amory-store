import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ShoppingBag, Star, Search, Filter, Heart, Loader2, Plus, Minus, Check, ChevronDown, Package } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firebaseErrorHandler';

import { ProductCard } from '../components/ProductCard';

export function Store() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States for filter checkoxes
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(query(collection(db, 'products')), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products', auth);
      setLoading(false);
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const uniqueNames = Array.from(new Set(snapshot.docs.map(doc => doc.data().name)));
      setCategories(uniqueNames as string[]);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };

    const catParam = searchParams.get('category');
    if (catParam) setSelectedCategories([catParam]);

  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => (prev.includes(cat) ? [] : [cat]));
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const [visibleCount, setVisibleCount] = useState(12);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.scientificName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, selectedCategories, selectedBrands]);

  return (
    <div className="pt-20 md:pt-24 pb-20 md:pb-32 bg-slate-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:gap-8 mt-4 md:mt-8">
          
          {/* Top Filters Area */}
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
              <h3 className="font-display font-black text-slate-900 border-r-4 border-rose-500 pr-3">تصفية المنتجات</h3>
              {(selectedCategories.length > 0 || selectedBrands.length > 0 || searchQuery) && (
                <button 
                  onClick={() => { setSelectedCategories([]); setSelectedBrands([]); setSearchQuery(''); }}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 px-4 py-2 rounded-full self-start md:self-auto inline-flex"
                >
                  إعادة ضبط الخيارات
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
               {/* Categories */}
               <div>
                  <h4 className="font-bold text-slate-800 mb-3 md:mb-4 text-xs md:text-sm">الأصناف</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategories([])}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                          selectedCategories.length === 0 
                            ? "bg-rose-600 text-white border-rose-600" 
                            : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                        )}
                      >
                        عرض جميع المنتجات
                     </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                          selectedCategories.includes(cat) 
                            ? "bg-rose-100 text-rose-800 border-rose-200" 
                            : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Brands */}
               <div>
                  <h4 className="font-bold text-slate-800 mb-3 md:mb-4 text-xs md:text-sm">الماركات</h4>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((brand: any) => (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand as string)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                          selectedBrands.includes(brand) 
                            ? "bg-rose-100 text-rose-800 border-rose-200" 
                            : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                        )}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Product Grid Area */}
          <main className="flex-1 w-full">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
              <div className="relative flex-1 group">
                <Search className="w-5 h-5 absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                <input
                  type="text"
                  placeholder="ابحث عن ساعتك المفضلة، براند، أو عطر فريد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-6 pr-14 py-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none font-medium"
                />
              </div>
              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm whitespace-nowrap px-6">
                <span className="text-xs font-bold text-slate-400">ترتيب حسب:</span>
                <select className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-700 outline-none cursor-pointer">
                  <option>الأحدث أولاً</option>
                  <option>السعر: من الأقل</option>
                  <option>السعر: من الأعلى</option>
                  <option>الأكثر مبيعاً</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                <LoadingSpinner size="lg" label="جاري استدعاء قائمة المنتجات..." />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <ShoppingBag className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-2xl font-display font-black text-slate-900 mb-2">لا توجد نتائج مطابقة</h3>
                <p className="text-slate-500 max-w-sm mx-auto">لم نعثر على أي منتجات تطابق معايير البحث الحالية. جرب تغيير كلمات البحث أو الفلاتر.</p>
                <button 
                  onClick={() => { setSelectedCategories([]); setSelectedBrands([]); setSearchQuery(''); }}
                  className="mt-8 text-rose-600 font-bold hover:underline"
                >
                  عرض جميع المنتجات
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                  {displayedProducts.map((product, idx) => (
                    <ProductCard key={product.id} product={product} idx={idx} />
                  ))}
                </div>
                
                {visibleCount < filteredProducts.length && (
                  <div className="mt-12 flex justify-center">
                    <button
                      onClick={() => setVisibleCount(v => v + 12)}
                      className="bg-white text-rose-600 hover:bg-rose-50 border-2 border-rose-100 px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-900/5 group"
                    >
                      عرض المزيد <Plus className="w-5 h-5 transition-transform group-hover:scale-125" />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
