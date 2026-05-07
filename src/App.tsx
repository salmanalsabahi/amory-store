/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import NProgress from 'nprogress';
import { Layout } from './components/layout/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WishlistProvider } from './contexts/WishlistContext';
import { CartProvider } from './contexts/CartContext';
import { seedInitialData } from './lib/seedData';
import { InstallAppPrompt } from './components/InstallAppPrompt';

// Lazy Loaded Public Pages
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Consultation = lazy(() => import('./pages/Consultation').then(m => ({ default: m.Consultation })));
const Store = lazy(() => import('./pages/Store').then(m => ({ default: m.Store })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Wishlist = lazy(() => import('./pages/Wishlist').then(m => ({ default: m.Wishlist })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const OrderTracking = lazy(() => import('./pages/OrderTracking').then(m => ({ default: m.OrderTracking })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Auth = lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Articles = lazy(() => import('./pages/Articles').then(m => ({ default: m.Articles })));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail').then(m => ({ default: m.ArticleDetail })));
const Packages = lazy(() => import('./pages/Packages').then(m => ({ default: m.Packages })));
const Offers = lazy(() => import('./pages/Offers').then(m => ({ default: m.Offers })));
const Services = lazy(() => import('./pages/Services').then(m => ({ default: m.Services })));

// Admin Imports
import { AdminLayout } from './components/layout/AdminLayout';
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then(m => ({ default: m.AdminOrders })));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories').then(m => ({ default: m.AdminCategories })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminConsultations = lazy(() => import('./pages/admin/AdminConsultations').then(m => ({ default: m.AdminConsultations })));
const AdminPackages = lazy(() => import('./pages/admin/AdminPackages').then(m => ({ default: m.AdminPackages })));
const AdminOffers = lazy(() => import('./pages/admin/AdminOffers').then(m => ({ default: m.AdminOffers })));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons').then(m => ({ default: m.AdminCoupons })));
const AdminSiteSettings = lazy(() => import('./pages/admin/AdminSiteSettings').then(m => ({ default: m.AdminSiteSettings })));
const AdminArticles = lazy(() => import('./pages/admin/AdminArticles').then(m => ({ default: m.AdminArticles })));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews').then(m => ({ default: m.AdminReviews })));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages').then(m => ({ default: m.AdminMessages })));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminPaymentSettings = lazy(() => import('./pages/admin/AdminPaymentSettings').then(m => ({ default: m.AdminPaymentSettings })));

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

  return (
    <BrowserRouter>
      <WishlistProvider>
        <CartProvider>
          <TooltipProvider>
            <InstallAppPrompt />
            <RouteProgress />
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </Suspense>
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


