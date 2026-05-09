import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  }, firebaseConfig.firestoreDatabaseId);
} catch (error) {
  // If already initialized (e.g., during Vite HMR), use getFirestore
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}
export const db = firestoreDb;

export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { sendPasswordResetEmail } from 'firebase/auth';
export const saveUserToFirestore = async (user: any, additionalData: any = {}, role: string = 'user') => {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  const userData: any = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || additionalData.displayName || '',
    photoURL: user.photoURL || '',
    phone: additionalData.phone || '',
    updatedAt: new Date().toISOString(),
    role: (user.email === 'openclaw@emtiazsky.com' || user.email === 'salmanalsabahi775@gmail.com') ? 'admin' : (additionalData.role || role)
  };

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date().toISOString()
    });
  } else {
    // Preserve existing role, but force admin if this specific user
    const existingData = userSnap.data();
    
    // Always force admin for the designated email
    if (user.email === 'openclaw@emtiazsky.com' || user.email === 'salmanalsabahi775@gmail.com') {
        userData.role = 'admin';
    } 
    
    await setDoc(userRef, userData, { merge: true });
  }
};

export const findUserByPhone = async (phone: string) => {
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  const q = query(collection(db, 'users'), where('phone', '==', phone));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  return null;
};

export const signInWithGoogle = async () => {
  try {
    console.log("Attempting Google Sign In with authDomain:", firebaseConfig.authDomain);
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google Sign In successful, saving user...");
    await saveUserToFirestore(result.user);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
      domain: window.location.hostname
    });
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
