import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRequireAuth } from '../hooks/useRequireAuth';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  category: string;
  brand?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  shipping: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const { requireAuth, isOnline } = useRequireAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const q = query(collection(db, 'carts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cartItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CartItem[];
      setItems(cartItems);
    }, (error: any) => {
      if (error?.message?.includes('offline') || error?.code === 'unavailable') {
         console.warn("أنت غير متصل بالإنترنت. تُعرض السلة من الذاكرة المؤقتة.");
      } else {
         console.error("Cart error:", error);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const addToCart = async (product: any, quantity: number = 1) => {
    if (!isOnline) {
      toast.error('المعذرة منك ياحبوب.. النت مقطوع، يرجى الاتصال بالنت أولاً.');
      throw new Error('OFFLINE_REQUIRED');
    }
    if (!user) {
      requireAuth(() => {}, { redirect: false, customMessage: 'ياحبوب يرجى تسجيل الدخول أو إنشاء حساب لكي تتمكن من الإضافة للسلة.' });
      throw new Error('AUTH_REQUIRED'); // This intercepts the success flow
    }
    
    // User is logged in and online
    const existingItem = items.find(item => item.productId === product.id);

    if (existingItem) {
      await updateDoc(doc(db, 'carts', existingItem.id), {
        quantity: existingItem.quantity + quantity
      });
    } else {
      await addDoc(collection(db, 'carts'), {
        userId: user.uid,
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.images?.[0] || product.imageUrl || '',
        quantity,
        category: product.category,
        brand: product.brand || '',
        createdAt: new Date().toISOString()
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    await deleteDoc(doc(db, 'carts', itemId));
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
    } else {
      await updateDoc(doc(db, 'carts', itemId), { quantity });
    }
  };

  const clearCart = async () => {
    const q = query(collection(db, 'carts'), where('userId', '==', user.uid));
    const qs = await getDocs(q);
    const deletePromises = qs.docs.map(d => deleteDoc(doc(db, 'carts', d.id)));
    await Promise.all(deletePromises);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 50000 || subtotal === 0 ? 0 : 5000;
  const totalPrice = subtotal + shipping;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, shipping, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
