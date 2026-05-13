import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Facebook, Instagram, Twitter, MessageCircle, Youtube, Mail, Globe, Share2, Music } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useLocation } from 'react-router-dom';

const PLATFORM_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
  whatsapp: { icon: MessageCircle, color: 'bg-[#25D366]', label: 'واتساب' },
  facebook: { icon: Facebook, color: 'bg-[#1877F2]', label: 'فيسبوك' },
  instagram: { icon: Instagram, color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', label: 'إنستغرام' },
  twitter: { icon: Twitter, color: 'bg-[#1DA1F2]', label: 'تويتر' },
  tiktok: { icon: Music, color: 'bg-black', label: 'تيك توك' },
  youtube: { icon: Youtube, color: 'bg-[#FF0000]', label: 'يوتيوب' },
  snapchat: { icon: Globe, color: 'bg-[#FFFC00] text-black', label: 'سناب شات' },
  email: { icon: Mail, color: 'bg-slate-600', label: 'البريد' },
  default: { icon: Share2, color: 'bg-slate-500', label: 'تواصل' }
};

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

  // Map settings.socialMedia (now an array) to the UI list
  const socialLinks = (Array.isArray(settings.socialMedia) ? settings.socialMedia : []).map(link => {
    // If it's a new array structure
    if (typeof link === 'object' && link.platform) {
      const config = PLATFORM_CONFIG[link.platform.toLowerCase()] || PLATFORM_CONFIG.default;
      let href = link.url;
      if (link.platform.toLowerCase() === 'whatsapp' && !href.startsWith('http')) {
        href = `https://wa.me/${href}`;
      }
      return {
        id: link.platform,
        icon: config.icon,
        href,
        color: config.color,
        label: link.label || config.label
      };
    }
    return null;
  }).filter(Boolean) as any[];

  // Fallback for legacy data if needed
  if (socialLinks.length === 0 && settings.socialMedia && typeof settings.socialMedia === 'object' && !Array.isArray(settings.socialMedia)) {
    Object.entries(settings.socialMedia).forEach(([platform, value]) => {
      if (!value) return;
      const config = PLATFORM_CONFIG[platform.toLowerCase()] || PLATFORM_CONFIG.default;
      let href = value as string;
      if (platform === 'whatsapp' && !href.startsWith('http')) href = `https://wa.me/${href}`;
      socialLinks.push({
        id: platform,
        icon: config.icon,
        href,
        color: config.color,
        label: config.label
      });
    });
  }

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
                <span className="absolute start-12 lg:start-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
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
          isOpen ? 'bg-rose-800 rotate-45' : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
        } text-white p-0`}
      >
        <Plus className="w-6 h-6 lg:w-7 lg:h-7" />
      </button>
    </div>
  );
}
