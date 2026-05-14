import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const slides = [
  {
    id: 1,
    title: 'بيع بالجملة والتجزئة',
    subtitle: 'أفضل الأسعار لجميع احتياجاتكم من العطور ومستحضرات التجميل',
    image: 'https://images.unsplash.com/photo-1573883430060-143ac1744bfa?auto=format&fit=crop&q=80',
    link: '/store'
  },
  {
    id: 2,
    title: 'ساعات فاخرة',
    subtitle: 'أناقة لا تضاهى',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80',
    link: '/store?category=ساعات'
  },
  {
    id: 3,
    title: 'مستحضرات تجميل',
    subtitle: 'جمالك هو أولويتنا',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80',
    link: '/store?category=مكياج'
  },
  {
    id: 4,
    title: 'عطور خلابة',
    subtitle: 'عبق يجسد فخامتك',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80',
    link: '/store?category=عطور'
  },
  {
    id: 5,
    title: 'إكسسوارات راقية',
    subtitle: 'لمسة تكتمل بها إطلالتك',
    image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&q=80',
    link: '/store?category=إكسسوارات'
  },
  {
    id: 6,
    title: 'أجهزة تجميل إلكترونية',
    subtitle: 'العناية المتطورة بين يديك',
    image: 'https://images.unsplash.com/photo-1571781926291-c4a7ed36f014?auto=format&fit=crop&q=80',
    link: '/store?category=أجهزة'
  }
];

export function BeautySlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[60vh] w-full overflow-hidden bg-slate-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[current].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img 
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-black text-white mb-2"
            >
              {slides[current].title}
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-2xl text-white font-medium mb-6"
            >
              {slides[current].subtitle}
            </motion.p>
            <Link 
              to={slides[current].link}
              className="bg-rose-600 text-white font-bold py-3 px-8 rounded-full hover:bg-rose-700 transition"
            >
              تسوق الآن
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, idx) => (
          <div 
            key={idx}
            className={cn("h-2 w-2 rounded-full transition-all", idx === current ? "bg-white w-8" : "bg-white/50")}
          />
        ))}
      </div>
    </section>
  );
}
