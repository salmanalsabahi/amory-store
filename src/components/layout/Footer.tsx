import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Mail, Facebook, Instagram, Twitter, ArrowLeft, MessageCircle, Linkedin } from 'lucide-react';
import { useSiteSettings } from '../../hooks/useSiteSettings';

export function Footer() {
  const { settings } = useSiteSettings();

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
                <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white font-display font-bold text-2xl">
                  S
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl tracking-tight text-white leading-tight">
                  {settings?.storeName || "عموري ستور"}
                </span>
                <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold mt-1">فخامة وأناقة</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              {settings?.aboutUs?.substring(0, 150) || "وجهتكم الأولى لأرقى الساعات والعطور العالمية. نوفر لكم تشكيلة مميزة تجمع بين الفخامة والجودة العالية لتناسب ذوقكم الرفيع."}
              {settings?.aboutUs && settings.aboutUs.length > 150 && "..."}
            </p>
            <div className="flex flex-wrap gap-3">
              {settings?.socialMedia?.facebook && (
                <a href={settings.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800/50 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-all border border-slate-700/50 text-sm">
                  <Facebook className="w-4 h-4" /> فیسبوك
                </a>
              )}
              {settings?.socialMedia?.instagram && (
                <a href={settings.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800/50 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-all border border-slate-700/50 text-sm">
                  <Instagram className="w-4 h-4" /> انستقرام
                </a>
              )}
              {settings?.socialMedia?.twitter && (
                <a href={settings.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800/50 hover:bg-sky-500 text-white px-4 py-2 rounded-lg transition-all border border-slate-700/50 text-sm">
                  <Twitter className="w-4 h-4" /> تويتر
                </a>
              )}
              {settings?.socialMedia?.tiktok && (
                <a href={settings.socialMedia.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800/50 hover:bg-black text-white px-4 py-2 rounded-lg transition-all border border-slate-700/50 text-sm">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.85.51-1.44 1.43-1.58 2.41-.14 1.02.26 2.13 1.01 2.81.76.71 1.84.99 2.85.78 1.02-.21 1.91-.98 2.33-1.92.23-.53.33-1.1.32-1.66V0h.02z"/></svg> 
                  تيك توك
                </a>
              )}
              {settings?.socialMedia?.linkedin && (
                <a href={settings.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800/50 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all border border-slate-700/50 text-sm">
                  <Linkedin className="w-4 h-4" /> لينكد إن
                </a>
              )}
            </div>
          </div>

          {/* Columns 2 & 3: Links */}
          <div className="grid grid-cols-2 gap-6 lg:gap-8 lg:col-span-2">
            {/* Column 2: Quick Links */}
            <div className="lg:ps-12">
              <h3 className="text-white font-display font-bold text-base md:text-lg mb-6 md:mb-8 relative inline-block pb-2">
                روابط سريعة
                <span className="absolute bottom-0 right-0 w-8 h-1 bg-teal-500 rounded-full"></span>
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
                    <Link to={item.path} className="text-xs md:text-sm hover:text-teal-400 transition-all hover:translate-x-1 inline-block">
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
                <span className="absolute bottom-0 right-0 w-8 h-1 bg-teal-500 rounded-full"></span>
              </h3>
              <ul className="grid grid-cols-1 gap-y-3 md:gap-y-4">
                {[
                  { name: 'ساعات رجالية', slug: 'ساعات رجالية' },
                  { name: 'ساعات نسائية', slug: 'ساعات نسائية' },
                  { name: 'عطور رجالية', slug: 'عطور رجالية' },
                  { name: 'عطور نسائية', slug: 'عطور نسائية' },
                  { name: 'إكسسوارات', slug: 'إكسسوارات وهدايا' }
                ].map((item) => (
                  <li key={item.name}>
                    <Link to={`/store?category=${item.slug}`} className="text-xs md:text-sm hover:text-teal-400 transition-all hover:translate-x-1 inline-block">
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
              <span className="absolute bottom-0 right-0 w-8 h-1 bg-teal-500 rounded-full"></span>
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-teal-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-600 uppercase mb-1">الموقع</h4>
                  <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                    {settings?.location || "اليمن، صنعاء"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-teal-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-600 uppercase mb-1">الهاتف</h4>
                  <p className="text-sm text-slate-300" dir="ltr">
                    {settings?.phone || "+967 774974712"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-teal-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-600 uppercase mb-1">البريد الإلكتروني</h4>
                  <p className="text-sm text-slate-300 break-all">
                    {settings?.email || "salmanalsabahi775@gmail.com"}
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
