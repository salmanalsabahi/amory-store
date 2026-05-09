/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import NProgress from 'nprogress';
import { Layout } from './components/layout/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WishlistProvider } from './contexts/WishlistContext';
import { CartProvider } from './contexts/CartContext';
import { seedInitialData } from './lib/seedData';
import { useCachePreloader } from './hooks/useCachePreloader';
import { InstallAppPrompt } from './components/InstallAppPrompt';
import { ErrorBoundary } from './components/ErrorBoundary';

// Public Pages
import { Home } from './pages/Home';
import { Consultation } from './pages/Consultation';
import { Store } from './pages/Store';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Wishlist } from './pages/Wishlist';
import { Checkout } from './pages/Checkout';
import { OrderTracking } from './pages/OrderTracking';
import { Contact } from './pages/Contact';
import { Profile } from './pages/Profile';
import { Auth } from './pages/Auth';
import { About } from './pages/About';
import { Articles } from './pages/Articles';
import { ArticleDetail } from './pages/ArticleDetail';
import { Packages } from './pages/Packages';
import { Offers } from './pages/Offers';
import { Services } from './pages/Services';
import { ProfileSettings } from './pages/ProfileSettings';

// Admin Imports
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminConsultations } from './pages/admin/AdminConsultations';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminOffers } from './pages/admin/AdminOffers';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminSiteSettings } from './pages/admin/AdminSiteSettings';
import { AdminArticles } from './pages/admin/AdminArticles';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminMessages } from './pages/admin/AdminMessages';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminPaymentSettings } from './pages/admin/AdminPaymentSettings';

// Loading component
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

// Progress Bar Controller
function RouteProgress() {
  const location = useLocation();

  useEffect(() => {
    NProgress.start();
    const timeout = setTimeout(() => {
      NProgress.done();
    }, 100);
    return () => {
      clearTimeout(timeout);
      NProgress.done();
    };
  }, [location.pathname]);

  return null;
}

// Animated Page Wrapper
function PageWrapper({ children, ...props }: { children: React.ReactNode, key?: string }) {
  return (
    <motion.div
      {...props}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  useEffect(() => {
    seedInitialData().catch(console.error);
  }, []);

  useCachePreloader();

  return (
    <BrowserRouter>
      <WishlistProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                  borderRadius: '16px',
                  padding: '12px 24px',
                  fontSize: '0.95rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  marginTop: '10px',
                },
                success: {
                  style: {
                    background: '#f59e0b',
                    color: '#fff',
                  },
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#f59e0b',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
            <InstallAppPrompt />
            <RouteProgress />
            <ScrollToTop />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <AppRoutes />
              </Suspense>
            </ErrorBoundary>
          </TooltipProvider>
        </CartProvider>
      </WishlistProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<Layout />}>
          <Route index element={<PageWrapper key="home"><Home /></PageWrapper>} />
          <Route path="about" element={<PageWrapper key="about"><About /></PageWrapper>} />
          <Route path="articles" element={<PageWrapper key="articles"><Articles /></PageWrapper>} />
          <Route path="packages" element={<PageWrapper key="packages"><Packages /></PageWrapper>} />
          <Route path="offers" element={<PageWrapper key="offers"><Offers /></PageWrapper>} />
          <Route path="/services" element={<PageWrapper key="services"><Services /></PageWrapper>} />
          <Route path="consultations" element={<PageWrapper key="consultation"><Consultation /></PageWrapper>} />
          <Route path="article/:id" element={<PageWrapper key="article-detail"><ArticleDetail /></PageWrapper>} />
          <Route path="store" element={<PageWrapper key="store"><Store /></PageWrapper>} />
          <Route path="product/:id" element={<PageWrapper key="product"><ProductDetail /></PageWrapper>} />
          <Route path="cart" element={<PageWrapper key="cart"><Cart /></PageWrapper>} />
          <Route path="wishlist" element={<PageWrapper key="wishlist"><Wishlist /></PageWrapper>} />
          <Route path="checkout" element={<PageWrapper key="checkout"><Checkout /></PageWrapper>} />
          <Route path="tracking" element={<PageWrapper key="tracking"><OrderTracking /></PageWrapper>} />
          <Route path="contact" element={<PageWrapper key="contact"><Contact /></PageWrapper>} />
          <Route path="profile" element={<PageWrapper key="profile"><Profile /></PageWrapper>} />
          <Route path="auth" element={<PageWrapper key="auth"><Auth /></PageWrapper>} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<PageWrapper key="admin-home"><AdminOrders /></PageWrapper>} />
          <Route path="orders" element={<PageWrapper key="admin-orders"><AdminOrders /></PageWrapper>} />
          <Route path="products" element={<PageWrapper key="admin-products"><AdminProducts /></PageWrapper>} />
          <Route path="categories" element={<PageWrapper key="admin-categories"><AdminCategories /></PageWrapper>} />
          <Route path="users" element={<PageWrapper key="admin-users"><AdminUsers /></PageWrapper>} />
          <Route path="consultations" element={<PageWrapper key="admin-consultations"><AdminConsultations /></PageWrapper>} />
          <Route path="packages" element={<PageWrapper key="admin-packages"><AdminPackages /></PageWrapper>} />
          <Route path="offers" element={<PageWrapper key="admin-offers"><AdminOffers /></PageWrapper>} />
          <Route path="coupons" element={<PageWrapper key="admin-coupons"><AdminCoupons /></PageWrapper>} />
          <Route path="articles" element={<PageWrapper key="admin-articles"><AdminArticles /></PageWrapper>} />
          <Route path="reviews" element={<PageWrapper key="admin-reviews"><AdminReviews /></PageWrapper>} />
          <Route path="site-settings" element={<PageWrapper key="admin-site"><AdminSiteSettings /></PageWrapper>} />
          <Route path="payment-settings" element={<PageWrapper key="admin-payments"><AdminPaymentSettings /></PageWrapper>} />
          <Route path="messages" element={<PageWrapper key="admin-messages"><AdminMessages /></PageWrapper>} />
          <Route path="analytics" element={<PageWrapper key="admin-analytics"><AdminAnalytics /></PageWrapper>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}


