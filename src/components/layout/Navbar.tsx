import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Menu, X, User as UserIcon, LogOut, ChevronDown, ShoppingCart, Heart, Clock, Mail, Facebook, Instagram, Linkedin, Twitter, MessageCircle, Star, ArrowLeft, Watch, Sparkles, PlusCircle, Activity, Pill, Thermometer, ShieldCheck, Stethoscope } from 'lucide-react';
import { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, signInWithGoogle, logOut } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Notifications } from '../Notifications';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { cn } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/firebaseErrorHandler';

import { collection, query, where, getDocs } from 'firebase/firestore';

const navLinks: { name: string; path: string; hasDropdown?: boolean }[] = [
  { name: 'الرئيسية', path: '/' },
  { name: 'المنتجات', path: '/store' },
  { name: 'العروض', path: '/offers' },
  { name: 'الباقات', path: '/packages' },
  { name: 'تتبع طلبك', path: '/tracking' },
  { name: 'المقالات', path: '/articles' },
  { name: 'من نحن', path: '/about' },
  { name: 'اتصل بنا', path: '/contact' },
];

// Pre-fetch mapping
const prefetchMap: Record<string, () => Promise<any>> = {
  '/': () => import('../../pages/Home'),
  '/about': () => import('../../pages/About'),
  '/articles': () => import('../../pages/Articles'),
  '/services': () => import('../../pages/Services'),
  '/store': () => import('../../pages/Store'),
  '/tracking': () => import('../../pages/OrderTracking'),
  '/contact': () => import('../../pages/Contact'),
  '/checkout': () => import('../../pages/Checkout'),
  '/offers': () => import('../../pages/Offers'),
};

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProductsMenuOpen, setMobileProductsMenuOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePromo, setActivePromo] = useState<any>(null);
  const [dbCategories, setDbCategories] = useState<{name: string, path: string}[]>([]);
  const location = useLocation();
  const { settings } = useSiteSettings();
  const { wishlist } = useWishlist();
  const { items } = useCart();

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const uniqueNames = new Set<string>();
      const cats: {name: string, path: string}[] = [];
      
      snapshot.docs.forEach(doc => {
        const name = doc.data().name;
        if (name && !uniqueNames.has(name)) {
          uniqueNames.add(name);
          cats.push({ name, path: `/store?category=${encodeURIComponent(name)}` });
        }
      });
      
      setDbCategories([{ name: 'الكل', path: '/store' }, ...cats]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories', auth));
    return () => unsubCats();
  }, []);

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const qs = await getDocs(query(collection(db, 'coupons'), where('active', '==', true)));
        if (!qs.empty) {
          const firstCoupon = qs.docs[0].data();
          setActivePromo({
            text: `عروض خاصة! استخدم كود الخصم: ${firstCoupon.code} للحصول على خصم ${firstCoupon.discountPercentage}%`,
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchPromo();
  }, []);

  const handlePrefetch = (path: string) => {
    const prefetch = prefetchMap[path];
    if (prefetch) {
      prefetch().catch(() => {}); // Silently fail if prefetch fails
    }
  };

  const isTransparent = false;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else if (currentUser.email === 'salmanalsabahi775@gmail.com' || currentUser.email === 'openclaw@emtiazsky.com') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error checking role:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Manage body class for hiding chatbot
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => document.body.classList.remove('menu-open');
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 z-50 transition-all duration-300',
          !isTransparent ? 'bg-white' : 'bg-transparent'
        )}
      >
        {/* Promo Banner / Announcement Bar */}
        {isBannerVisible && (activePromo || settings?.workingHours) && (
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white py-1.5 md:py-2 px-8 md:px-10 relative overflow-hidden shadow-md border-b border-indigo-800/30">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />
            <div className="max-w-7xl mx-auto flex flex-row items-center justify-center gap-2 md:gap-6 text-[10px] md:text-sm font-medium relative z-10 text-center flex-wrap">
              <span className="hidden sm:flex animate-pulse items-center gap-1.5 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                عرض خاص
              </span>
              <p className="flex items-center gap-1.5 md:gap-2 truncate max-w-[65%] md:max-w-none">
                {activePromo ? activePromo.text : (settings?.storeDescription || "خصومات حصرية تصل إلى 40% على تشكيلة الساعات الجديدة")}
              </p>
              <Link 
                to={activePromo?.link || "/store"} 
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1 md:px-4 md:py-1.5 rounded-full font-bold text-[10px] md:text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 flex-shrink-0"
              >
                تسوق الآن
              </Link>
            </div>
            
            <button 
              onClick={(e) => {
                e.preventDefault();
                setIsBannerVisible(false);
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 md:p-2 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition-all text-white/90 hover:text-white flex items-center justify-center border border-white/10"
              aria-label="إغلاق الإعلان"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>
        )}
        
        {/* Info Bar */}
        <div className="bg-slate-900 text-slate-300 py-2 px-4 sm:px-6 lg:px-8 text-xs flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {settings?.workingHours || "يومين شغال 24 ساعه"}</span>
              {settings?.phone && (
                <a href={`tel:${settings.phone}`} className="flex items-center gap-1 hover:text-white transition-colors">
                  <Phone className="w-3 h-3" /> {settings.phone}
                </a>
              )}
              {settings?.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-1 hover:text-white transition-colors">
                  <Mail className="w-3 h-3" /> {settings.email}
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
              {settings?.socialMedia?.facebook && (
                <a href={settings.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <Facebook className="w-3 h-3" /> <span className="hidden xs:inline">فيسبوك</span>
                </a>
              )}
              {settings?.socialMedia?.instagram && (
                <a href={settings.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <Instagram className="w-3 h-3" /> <span className="hidden xs:inline">انستقرام</span>
                </a>
              )}
              {settings?.socialMedia?.twitter && (
                <a href={settings.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <Twitter className="w-3 h-3" /> <span className="hidden xs:inline">تويتر</span>
                </a>
              )}
              {settings?.socialMedia?.tiktok && (
                <a href={settings.socialMedia.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.85.51-1.44 1.43-1.58 2.41-.14 1.02.26 2.13 1.01 2.81.76.71 1.84.99 2.85.78 1.02-.21 1.91-.98 2.33-1.92.23-.53.33-1.1.32-1.66V0h.02z"/></svg>
                  <span className="hidden xs:inline">تيك توك</span>
                </a>
              )}
              {settings?.socialMedia?.linkedin && (
                <a href={settings.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <Linkedin className="w-3 h-3" /> <span className="hidden xs:inline">لينكد إن</span>
                </a>
              )}
          </div>
        </div>

        {/* Main Navbar */}
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300", !isTransparent ? "py-2" : "py-4")}>
          <div className="flex items-center justify-between">
            {/* Right Side: Logo & Links */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2 group">
                  {settings?.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-auto h-8 md:h-10 object-contain transition-all" />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-amber-500 flex items-center justify-center text-white font-display font-bold text-xs shadow-lg group-hover:shadow-teal-500/25 transition-all">
                      R
                    </div>
                  )}
                  <span className={cn("font-display font-bold text-sm tracking-tight transition-colors", !isTransparent ? "text-slate-900" : "text-white")}>
                    {settings?.storeName || "عموري ستور"}
                  </span>
                </Link>
              </div>

              {/* Nav Links */}
              <nav className="hidden xl:flex items-center gap-6">
                  {navLinks.map((link) => (
                    <div key={link.name} className="relative group">
                      <Link
                          to={link.path}
                          onMouseEnter={() => handlePrefetch(link.path)}
                          className={cn(
                          'text-sm font-bold transition-colors relative whitespace-nowrap flex items-center gap-1 py-4',
                          location.pathname === link.path
                              ? (!isTransparent ? 'text-teal-700 underline decoration-2 underline-offset-8' : 'text-amber-400')
                              : (!isTransparent ? 'text-slate-700 hover:text-teal-600' : 'text-white/90 hover:text-amber-400')
                          )}
                      >
                          {link.name}
                          {link.hasDropdown && <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />}
                      </Link>

                      {link.hasDropdown && (
                        <div className="absolute top-full right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <div className="grid grid-cols-1 gap-2">
                             {dbCategories.map((cat) => (
                               <Link
                                 key={cat.name}
                                 to={cat.path}
                                 className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-all font-bold text-sm"
                               >
                                 <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                   {cat.name.includes('ساعات') ? <Watch className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                 </div>
                                 {cat.name}
                               </Link>
                             ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </nav>
            </div>

            {/* Left Side: Actions & Shop Button */}
            <div className="hidden md:flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1 md:gap-3 md:border-l md:border-slate-100 md:pl-4">
                {user ? (
                  <div className="flex items-center gap-1 md:gap-3">
                    {isAdmin ? (
                      <Link 
                        to="/admin" 
                        onMouseEnter={() => handlePrefetch('/admin')}
                        className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border border-teal-100 bg-teal-50/50 text-xs font-bold transition-colors", !isTransparent ? "text-teal-700 hover:bg-teal-100" : "text-white/90 hover:text-amber-400")}
                      >
                        <UserIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">لوحة التحكم</span>
                      </Link>
                    ) : (
                      <Link 
                        to="/profile" 
                        onMouseEnter={() => handlePrefetch('/profile')}
                        className={cn("flex items-center gap-2 text-sm font-medium transition-colors", !isTransparent ? "text-slate-700 hover:text-teal-600" : "text-white/90 hover:text-amber-400")}
                      >
                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" className="w-8 h-8 rounded-full border-2 border-amber-400/50" />
                      </Link>
                    )}
                    <button onClick={logOut} className={cn("p-2 rounded-full transition-colors", !isTransparent ? "text-red-500 hover:bg-red-50" : "text-red-400 hover:bg-white/10")} title="تسجيل الخروج">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Link 
                    to="/auth" 
                    onMouseEnter={() => handlePrefetch('/auth')}
                    className={cn("flex items-center gap-2 text-sm font-medium transition-colors", !isTransparent ? "text-slate-700 hover:text-teal-600" : "text-white/90 hover:text-amber-400")}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">دخول</span>
                  </Link>
                )}

                {user && (
                  <Notifications isAdmin={isAdmin} isDark={!isTransparent} />
                )}

                <Link 
                  to="/wishlist" 
                  className={cn("p-2 rounded-full relative transition-colors hidden md:block", !isTransparent ? "text-slate-700 hover:bg-slate-100" : "text-white/90 hover:bg-white/10")}
                >
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                <Link 
                  to="/cart" 
                  className={cn("p-2 rounded-full relative transition-colors hidden md:block", !isTransparent ? "text-slate-700 hover:bg-slate-100" : "text-white/90 hover:bg-white/10")}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
              </div>


              {/* Consultations Button */}
              <Link 
                to="/consultations" 
                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-600/20 transition-all active:scale-95 group"
              >
                <Stethoscope className="w-4 h-4" />
                <span>حجز استشارة</span>
              </Link>
            </div>
            {/* Mobile Actions (Menu Toggle) & Icons */}
            <div className="flex md:hidden items-center gap-1">
              {user && (
                <Notifications isAdmin={isAdmin} isDark={!isTransparent} />
              )}
              <Link to="/wishlist" className={cn("p-2 transition-colors", !isTransparent ? "text-slate-900" : "text-white")}>
                <Heart className="w-6 h-6" />
              </Link>
              <Link to="/cart" className={cn("p-2 transition-colors", !isTransparent ? "text-slate-900" : "text-white")}>
                <ShoppingCart className="w-6 h-6" />
              </Link>
                <button
                className={cn("p-2 -me-2 transition-colors", !isTransparent ? "text-slate-900" : "text-white")}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>
          </div>
        </div>
      </header>
      {/* Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 h-screen w-[50vw] bg-white/95 backdrop-blur-md shadow-2xl z-[100] md:hidden overflow-y-auto"
          >
            <div className="flex justify-between items-center p-4">
              <div className="font-bold text-lg text-slate-800">القائمة</div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-700 bg-black/5 hover:bg-black/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="px-4 pb-48 space-y-2">

              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    'block px-3 py-3 rounded-lg text-base font-medium transition-colors',
                    location.pathname === link.path
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-amber-600'
                  )}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="pt-2 pb-1">
                <button 
                  onClick={() => setMobileProductsMenuOpen(!mobileProductsMenuOpen)}
                  className="w-full px-3 py-2 text-sm font-bold text-slate-900 border-b border-slate-100 flex items-center justify-between"
                >
                  المنتجات
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", mobileProductsMenuOpen ? "rotate-180" : "")} />
                </button>
                {mobileProductsMenuOpen && (
                  <div className="mt-1 space-y-1 bg-slate-50 rounded-lg p-2">
                    {dbCategories.map((category) => (
                      <Link
                        key={category.name}
                        to={category.path}
                        className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-white hover:text-amber-600 transition-colors"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 px-3 pt-6 border-t border-slate-200 flex flex-col gap-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2">
                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="User" className="w-8 h-8 rounded-full" />
                        <div className="text-xs">
                          <div className="font-bold text-slate-900 truncate max-w-[120px]">{user.displayName || user.email.split('@')[0]}</div>
                          <div className="text-slate-500 truncate max-w-[150px]">{user.email}</div>
                        </div>
                    </div>
                    {isAdmin ? (
                      <Link to="/admin" className="flex items-center gap-1 py-1.5 text-xs text-teal-700 font-bold w-full text-right bg-teal-50 px-3 rounded-md mt-1">
                        لوحة التحكم
                      </Link>
                    ) : (
                      <Link to="/profile" className="flex items-center gap-1 py-1.5 text-xs text-teal-700 font-bold w-full text-right bg-teal-50 px-3 rounded-md mt-1">
                        حسابي
                      </Link>
                    )}
                    <button onClick={logOut} className="flex items-center gap-1 py-1.5 text-xs text-red-600 font-bold w-full text-right bg-red-50 px-3 rounded-md mt-1">
                      <LogOut className="w-3 h-3" />
                      خروج
                    </button>
                  </>
                ) : (
                  <Link to="/auth" className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                    <UserIcon className="w-3 h-3" />
                    دخول
                  </Link>
                )}
                <a href={settings?.phone ? `tel:${settings.phone}` : "tel:+1234567890"} className="flex items-center gap-2 text-slate-600 text-xs mt-1">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                    <Phone className="w-3 h-3 text-teal-600" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-slate-900" dir="ltr">{settings?.phone || "(555) 123-4567"}</div>
                  </div>
                </a>
                <Link
                  to="/consultations"
                  className="w-full bg-amber-600 text-white px-5 py-2 rounded-lg text-center text-xs font-bold shadow-md shadow-amber-600/20"
                >
                  حجز استشارة
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
