import { Link } from 'react-router-dom';
import { Phone, MapPin, Mail, Facebook, Instagram, Twitter, MessageCircle, Youtube, Music, Share2, Globe } from 'lucide-react';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const PLATFORM_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
  whatsapp: { icon: MessageCircle, color: 'bg-[#25D366]', label: 'واتساب' },
  facebook: { icon: Facebook, color: 'bg-[#1877F2]', label: 'فيسبوك' },
  instagram: { icon: Instagram, color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', label: 'إنستغرام' },
  twitter: { icon: Twitter, color: 'bg-[#1DA1F2]', label: 'تويتر' },
  tiktok: { icon: Music, color: 'bg-black', label: 'تيك توك' },
  youtube: { icon: Youtube, color: 'bg-[#FF0000]', label: 'يوتيوب' },
  snapchat: { icon: Globe, color: 'bg-[#FFFC00] text-black', label: 'سناب شات' },
  default: { icon: Share2, color: 'bg-slate-500', label: 'تواصل' }
};

export function Footer() {
  const { settings } = useSiteSettings();

  // Normalize social media data
  const socialLinks = (Array.isArray(settings?.socialMedia) ? settings.socialMedia : []).map(link => {
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
        label: link.label || config.label
      };
    }
    return null;
  }).filter(Boolean) as any[];

  // Fallback for legacy data
  if (socialLinks.length === 0 && settings?.socialMedia && typeof settings.socialMedia === 'object' && !Array.isArray(settings.socialMedia)) {
    Object.entries(settings.socialMedia).forEach(([platform, value]) => {
      if (!value) return;
      const config = PLATFORM_CONFIG[platform.toLowerCase()] || PLATFORM_CONFIG.default;
      let href = value as string;
      if (platform === 'whatsapp' && !href.startsWith('http')) href = `https://wa.me/${href}`;
      socialLinks.push({
        id: platform,
        icon: config.icon,
        href,
        label: config.label
      });
    });
  }

  return (
    <footer className="bg-slate-900 text-slate-300 pt-20 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Column 1: Brand & Social */}
          <div className="space-y-8 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              {settings?.logoUrl ? (
                <div className="bg-white p-2 rounded-xl h-16 w-16 flex items-center justify-center">
                  <img src={settings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-rose-600 flex items-center justify-center text-white font-display font-bold text-2xl">
                  S
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl tracking-tight text-white leading-tight">
                  {settings?.storeName || "عموري ستور"}
                </span>
                <span className="text-[10px] text-rose-500 uppercase tracking-widest font-bold mt-1">للعناية والتجميل</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              {settings?.aboutUs?.substring(0, 150) || "وجهتكم الأولى لمنتجات العناية بالبشرة والتجميل الأصلية. نوفر لكم تشكيلة مميزة من أشهر الماركات العالمية لتنعموا ببشرة صحية وجماد طبيعي."}
              {settings?.aboutUs && settings.aboutUs.length > 150 && "..."}
            </p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-rose-600 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/20 active:scale-90 transition-all group"
                  title={link.label}
                >
                  <link.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Columns 2 & 3: Links */}
          <div className="grid grid-cols-2 gap-6 lg:gap-8 lg:col-span-2">
            {/* Column 2: Quick Links */}
            <div className="lg:ps-12">
              <h3 className="text-white font-display font-bold text-base md:text-lg mb-6 md:mb-8 relative inline-block pb-2">
                روابط سريعة
                <span className="absolute bottom-0 right-0 w-8 h-1 bg-rose-500 rounded-full"></span>
              </h3>
              <ul className="grid grid-cols-1 gap-y-3 md:gap-y-4">
                {[
                  { name: 'الرئيسية', path: '/' },
                  { name: 'جميع المنتجات', path: '/store' },
                  { name: 'خدماتنا', path: '/services' },
                  { name: 'من نحن', path: '/about' },
                  { name: 'اتصل بنا', path: '/contact' },
                  { name: 'الشروط والأحكام', path: '/terms' }
                ].map((item) => (
                  <li key={item.name}>
                    <Link to={item.path} className="text-xs md:text-sm hover:text-rose-400 transition-all hover:translate-x-1 inline-block">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Product Types */}
            <div>
              <h3 className="text-white font-display font-bold text-base md:text-lg mb-6 md:mb-8 relative inline-block pb-2">
                أنواع المنتجات
                <span className="absolute bottom-0 right-0 w-8 h-1 bg-rose-500 rounded-full"></span>
              </h3>
              <ul className="grid grid-cols-1 gap-y-3 md:gap-y-4">
                {[
                  { name: 'العناية بالبشرة', slug: 'العناية بالبشرة' },
                  { name: 'المكياج', slug: 'مكياج' },
                  { name: 'العناية بالشعر', slug: 'العناية بالشعر' },
                  { name: 'العطور', slug: 'عطور' },
                  { name: 'منتجات الرجال', slug: 'منتجات الرجال' }
                ].map((item) => (
                  <li key={item.name}>
                    <Link to={`/store?category=${item.slug}`} className="text-xs md:text-sm hover:text-rose-400 transition-all hover:translate-x-1 inline-block">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: Contact Us */}
          <div className="lg:col-span-1">
            <h3 className="text-white font-display font-bold text-base md:text-lg mb-6 md:mb-8 relative inline-block pb-2">
              تواصل معنا
              <span className="absolute bottom-0 right-0 w-8 h-1 bg-rose-500 rounded-full"></span>
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-600 uppercase mb-1">الموقع</h4>
                  <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                    {settings?.location || "اليمن، صنعاء"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-600 uppercase mb-1">الهاتف</h4>
                  <p className="text-sm text-slate-300" dir="ltr">
                    {settings?.phone || "+967 774974712"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-600 uppercase mb-1">البريد الإلكتروني</h4>
                  <p className="text-sm text-slate-300 break-all">
                    {settings?.email || "salmanalsabahi775@gmail.com"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-600 uppercase mb-1">ساعات العمل</h4>
                  <p className="text-sm text-slate-300">
                    {settings?.workingHours || "يومياً: 9 صباحاً - 10 مساءً"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            &copy; {new Date().getFullYear()} {settings?.storeName || "عموري ستور"}. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
