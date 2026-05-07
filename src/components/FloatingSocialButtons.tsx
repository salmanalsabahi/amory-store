import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CalendarDays, Facebook, Instagram, Twitter, X } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useLocation } from 'react-router-dom';

export function FloatingSocialButtons() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSiteSettings();
  const location = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  if (!settings) return null;

  const allowedPaths = ['/', '/doctors', '/services', '/offers'];
  if (!allowedPaths.includes(location.pathname)) return null;

  const socialLinks = [
    {
      id: 'whatsapp',
      icon: CalendarDays,
      href: settings.socialMedia.whatsapp ? `https://wa.me/${settings.socialMedia.whatsapp}` : null,
      color: 'bg-[#25D366]',
      label: 'حجز استشارة'
    },
    {
      id: 'facebook',
      icon: Facebook,
      href: settings.socialMedia.facebook || null,
      color: 'bg-[#1877F2]',
      label: 'فيسبوك'
    },
    {
      id: 'instagram',
      icon: Instagram,
      href: settings.socialMedia.instagram || null,
      color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
      label: 'إنستغرام'
    },
    {
      id: 'twitter',
      icon: Twitter,
      href: settings.socialMedia.twitter || null,
      color: 'bg-[#1DA1F2]',
      label: 'تويتر'
    }
  ].filter(link => link.href !== null);

  if (socialLinks.length === 0) return null;

  return (
    <div ref={wrapperRef} className="floating-social-buttons fixed bottom-[80px] lg:bottom-12 left-2 lg:left-6 z-[45] flex flex-col items-center gap-3">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-center gap-2 mb-2">
            {socialLinks.map((link, index) => (
              <motion.a
                key={link.id}
                href={link.href!}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0, y: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`${link.color} text-white w-9 h-9 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform relative group`}
                aria-label={link.label}
              >
                <link.icon className="w-4 h-4 lg:w-6 lg:h-6" />
                <span className="absolute start-12 lg:start-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {link.label}
                </span>
              </motion.a>
            ))}
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-[44px] h-[44px] lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 border-2 lg:border-2 border-white/20 ${
          isOpen ? 'bg-slate-800 rotate-45' : 'bg-teal-600 hover:bg-teal-700'
        } text-white p-0`}
      >
        <Plus className="w-6 h-6 lg:w-7 lg:h-7" />
      </button>
    </div>
  );
}
