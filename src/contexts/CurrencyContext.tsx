import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export type CurrencyRegion = 'sanaa' | 'aden' | 'sar' | 'usd';

interface CurrencyContextType {
  region: CurrencyRegion;
  setRegion: (region: CurrencyRegion) => void;
  exchangeRateSanaa: number;
  exchangeRateAden: number;
  exchangeRateSar: number;
  formatPrice: (usdPrice: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Try to load region from localStorage or default to sanaa
  const [region, setRegion] = useState<CurrencyRegion>(() => {
    const saved = localStorage.getItem('currency_region');
    return (saved as CurrencyRegion) || 'sanaa';
  });

  const [exchangeRateSanaa, setExchangeRateSanaa] = useState(530);
  const [exchangeRateAden, setExchangeRateAden] = useState(1700);
  const [exchangeRateSar, setExchangeRateSar] = useState(3.75);

  // Update localStorage when region changes
  useEffect(() => {
    localStorage.setItem('currency_region', region);
  }, [region]);

  // Fetch exchange rates
  useEffect(() => {
    const docRef = doc(db, 'siteSettings', 'general');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.exchangeRateSanaa) setExchangeRateSanaa(data.exchangeRateSanaa);
        if (data.exchangeRateAden) setExchangeRateAden(data.exchangeRateAden);
        if (data.exchangeRateSar) setExchangeRateSar(data.exchangeRateSar);
      }
    });
    return () => unsubscribe();
  }, []);

  const formatPrice = (usdPrice: number) => {
    if (!usdPrice) return '0';
    
    let result = 0;
    let symbol = '';

    if (region === 'sanaa') {
      result = usdPrice * exchangeRateSanaa;
      symbol = 'ريال (قديم)';
    } else if (region === 'aden') {
      result = usdPrice * exchangeRateAden;
      symbol = 'ريال (جديد)';
    } else if (region === 'sar') {
      result = usdPrice * exchangeRateSar;
      symbol = 'ر.س';
    } else {
      result = usdPrice;
      symbol = '$';
    }

    // Format with commas, no decimals for YER, 2 decimals for USD
    if (region === 'usd' || region === 'sar') {
      return `${result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
    } else {
      // Round to nearest 5 or 10 maybe? Let's just round to nearest integer.
      return `${Math.round(result).toLocaleString('en-US')} ${symbol}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ region, setRegion, exchangeRateSanaa, exchangeRateAden, exchangeRateSar, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
