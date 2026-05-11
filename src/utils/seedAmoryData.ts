import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function seedAmoryData() {
  const batch = writeBatch(db);

  // 1. Categories
  const categories = [
    { name: 'العناية بالبشرة', path: 'skin-care' },
    { name: 'مكياج', path: 'makeup' },
    { name: 'عطور', path: 'perfumes' },
    { name: 'العناية بالشعر', path: 'hair-care' },
    { name: 'العناية بالجسم', path: 'body-care' },
    { name: 'منتجات الرجال', path: 'men-care' }
  ];

  categories.forEach(cat => {
    const ref = doc(collection(db, 'categories'));
    batch.set(ref, { ...cat, createdAt: serverTimestamp() });
  });

  // 2. Products
  const products = [
    {
      name: 'سيرافي لوشن مرطب للبشرة الجافة',
      brand: 'CeraVe',
      category: 'العناية بالبشرة',
      price: 120,
      originalPrice: 150,
      stock: 50,
      stockStatus: 'in_stock',
      description: 'لوشن مرطب غني بالمغذيات الأساسية لتقوية حاجز البشرة الطبيعي.',
      images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80'],
      createdAt: serverTimestamp()
    },
    {
      name: 'لاروش بوزيه أنتيليوس يو في ميون 400',
      brand: 'La Roche-Posay',
      category: 'العناية بالبشرة',
      price: 180,
      originalPrice: 210,
      stock: 30,
      stockStatus: 'in_stock',
      description: 'واقي شمس متطور يوفر حماية فائقة ضد الأشعة فوق البنفسجية.',
      images: ['https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80'],
      createdAt: serverTimestamp()
    },
    {
      name: 'بيوديرما سينسيبيو H2O ماء ميسيلار',
      brand: 'Bioderma',
      category: 'العناية بالبشرة',
      price: 85,
      originalPrice: 100,
      stock: 100,
      stockStatus: 'in_stock',
      description: 'منظف ومزيل ملمع لطيف للبشرة الحساسة.',
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80'],
      createdAt: serverTimestamp()
    },
    {
      name: 'ذا اورديناري نياسيناميد 10% + زينك 1%',
      brand: 'The Ordinary',
      category: 'العناية بالبشرة',
      price: 65,
      originalPrice: 80,
      stock: 40,
      stockStatus: 'in_stock',
      description: 'سيروم فعال لتقليل الشوائب وتضييق المسام الواسعة.',
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80'],
      createdAt: serverTimestamp()
    },
    {
      name: 'غارنييه الترا دو شامبو بالأفوكادو',
      brand: 'Garnier',
      category: 'العناية بالشعر',
      price: 35,
      originalPrice: 45,
      stock: 60,
      stockStatus: 'in_stock',
      description: 'شامبو مغذي غني بزيت الأفوكادو وزبدة الشيا للشعر شديد الجفاف.',
      images: ['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80'],
      createdAt: serverTimestamp()
    }
  ];

  products.forEach(prod => {
    const ref = doc(collection(db, 'products'));
    batch.set(ref, { ...prod, createdAt: serverTimestamp() });
  });

  // 3. Site Settings
  const settingsRef = doc(db, 'siteSettings', 'general');
  batch.set(settingsRef, {
    storeName: 'عموري ستور',
    storeDescription: 'متجرك الأول لمنتجات العناية بالبشرة والتجميل الأصلية',
    workingHours: 'يومياً: 9 صباحاً - 11 مساءً',
    phone: '777000000',
    email: 'info@amory-store.com',
    location: 'اليمن - صنعاء',
    socialMedia: {
      facebook: 'https://facebook.com/amory.store',
      instagram: 'https://instagram.com/amory.store',
      whatsapp: '967777000000',
      tiktok: '',
      twitter: '',
      linkedin: ''
    }
  }, { merge: true });

  await batch.commit();
}
