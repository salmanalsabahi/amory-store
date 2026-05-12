import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Chatbot } from '../Chatbot';
import { FloatingSocialButtons } from '../FloatingSocialButtons';
import { MobileBottomNav } from './MobileBottomNav';
import { OfflineAlert } from '../OfflineAlert';
import { PWAInstallPrompt } from '../PWAInstallPrompt';

export function Layout() {
  const location = useLocation();
  const showComponents = ['/', '/offers', '/packages', '/articles'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col relative pb-[68px] lg:pb-0">
      <OfflineAlert />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      
      {showComponents && <Chatbot />}
      {showComponents && <FloatingSocialButtons />}
      <MobileBottomNav />
      <PWAInstallPrompt />
    </div>
  );
}
