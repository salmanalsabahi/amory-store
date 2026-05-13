import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface SiteSettings {
  storeName: string;
  storeDescription: string;
  email: string;
  logoUrl: string;
  location: string;
  mapEmbedUrl: string;
  workingHours: string;
  phone: string;
  socialMedia: any; // Dynamic structure: supports legacy object or new array
  privacyPolicy: string;
  termsOfService: string;
  aboutUs: string;
  aboutUsImage: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'siteSettings', 'general');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      }
      setLoading(false);
    }, (error: any) => {
      if (error?.message?.includes('offline') || error?.code === 'unavailable') {
        console.warn("أنت الآن غير متصل بالإنترنت. تعذر جلب الإعدادات، سيتم الاعتماد على النسخة المخبأة إن وجدت.");
      } else {
        console.error("Error fetching site settings:", error);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}
