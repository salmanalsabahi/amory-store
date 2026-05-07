import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORIES = [
  'ساعات رجالي',
  'ساعات نسائي',
  'عطور رجالي',
  'عطور نسائي',
  'اكسسورات'
];

const PRODUCTS = [
  { 
    name: 'ساعة رولكس دايتونا ذهب أبيض', 
    brand: 'Rolex', 
    category: 'ساعات رجالي', 
    price: 45000, 
    originalPrice: 48000, 
    stock: 2, 
    description: 'ساعة رولكس كوزموغراف دايتونا من الذهب الأبيض عيار ١٨ قيراطاً، ميناء أسود فاخر.',
    images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a1b?auto=format&fit=crop&q=80&w=800']
  },
  { 
    name: 'ساعة أوميغا سيمستر كو-أكسيال', 
    brand: 'Omega', 
    category: 'ساعات رجالي', 
    price: 5200, 
    originalPrice: 6000, 
    stock: 5, 
    description: 'ساعة غوص احترافية مقاومة للماء حتى عمق ٣٠٠ متر، تصميم كلاسيكي متين.',
    images: ['https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=800']
  },
  { 
    name: 'ساعة كارتييه سانتوس ديموزيل', 
    brand: 'Cartier', 
    category: 'ساعات نسائي', 
    price: 12500, 
    originalPrice: 14000, 
    stock: 3, 
    description: 'ساعة نسائية أيقونية مرصعة بالألماس، سوار من الفولاذ والذهب الوردي.',
    images: ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=800']
  },
  { 
    name: 'ساعة شانيل J12 سيراميك', 
    brand: 'Chanel', 
    category: 'ساعات نسائي', 
    price: 6800, 
    originalPrice: 7500, 
    stock: 4, 
    description: 'ساعة عصرية من السيراميك الأبيض المقاوم للخدش، تصميم يجمع بين الأناقة والرياضية.',
    images: ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800']
  },
  { 
    name: 'عطر ديور سافاج بارفيوم', 
    brand: 'Dior', 
    category: 'عطور رجالي', 
    price: 155, 
    originalPrice: 180, 
    stock: 15, 
    description: 'عطر رجالي بتركيز عالٍ، تفوح منه رائحة الماندرين وخشب الصندل.',
    images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800']
  },
  { 
    name: 'عطر بلو دي شانيل', 
    brand: 'Chanel', 
    category: 'عطور رجالي', 
    price: 145, 
    originalPrice: 170, 
    stock: 12, 
    description: 'عطر خشبي عطري يجسد الحرية في زجاجة زرقاء عميقة وغامضة.',
    images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800']
  },
  { 
    name: 'عطر جادور ديور نسائي', 
    brand: 'Dior', 
    category: 'عطور نسائي', 
    price: 165, 
    originalPrice: 195, 
    stock: 10, 
    description: 'باقة زهور غنية، عطر الأنوثة المطلقة من دار ديور العالمية.',
    images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800']
  },
  { 
    name: 'عطر لافي إي بيل لانكوم', 
    brand: 'Lancôme', 
    category: 'عطور نسائي', 
    price: 130, 
    originalPrice: 155, 
    stock: 20, 
    description: 'عطر السعادة بتوليفة من السوسن والياسمين وزهر البرتقال.',
    images: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800']
  },
  { 
    name: 'نظارة ري بان كلاسيك أفياتور', 
    brand: 'Ray-Ban', 
    category: 'اكسسورات', 
    price: 210, 
    originalPrice: 245, 
    stock: 18, 
    description: 'تصميم الطيار الكلاسيكي منذ عام ١٩٣٧، حماية كاملة من الأشعة فوق البنفسجية.',
    images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800']
  },
  { 
    name: 'محفظة مون بلان جلد طبيعي', 
    brand: 'Montblanc', 
    category: 'اكسسورات', 
    price: 380, 
    originalPrice: 420, 
    stock: 8, 
    description: 'محفظة جيب كلاسيكية لست بطاقات ائتمان، مصنوعة من أجود أنواع الجلود.',
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800']
  }
];

export async function seedInitialData() {
  try {
    const categoriesToSeed = [
      'ساعات رجالي',
      'ساعات نسائي',
      'عطور رجالي',
      'عطور نسائي',
      'اكسسورات'
    ];

    // 1. Seed Categories if missing
    const catsSnap = await getDocs(collection(db, 'categories'));
    const existingCatNames = catsSnap.docs.map(d => d.data().name);
    
    for (const catName of categoriesToSeed) {
      if (!existingCatNames.includes(catName)) {
        try {
          await addDoc(collection(db, 'categories'), { name: catName });
        } catch (catErr) {
          console.warn('Skipping category seed due to permissions');
          break; // Stop seeding if we can't write
        }
      }
    }

    // 2. Seed Products if they don't exist
    const prodsSnap = await getDocs(collection(db, 'products'));
    if (prodsSnap.empty) {
      for (const prod of PRODUCTS) {
        try {
          await addDoc(collection(db, 'products'), {
            ...prod,
            images: prod.images || ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'],
            createdAt: new Date(),
            updatedAt: new Date(),
            rating: 5,
            reviewsCount: 1,
            featured: true
          });
        } catch (prodErr) {
          console.warn('Skipping product seed due to permissions');
          break;
        }
      }
      console.log('Products seeded.');
    }
  } catch (error) {
    console.warn('Silent seeding failure (likely permission denied for anonymous user):', error);
  }
}
