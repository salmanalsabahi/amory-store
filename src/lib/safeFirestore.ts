import { addDoc as fAddDoc, updateDoc as fUpdateDoc, deleteDoc as fDeleteDoc, setDoc as fSetDoc } from 'firebase/firestore';

export const addDoc = (...args: any[]) => { return (fAddDoc as any)(...args); };
export const updateDoc = (...args: any[]) => { return (fUpdateDoc as any)(...args); };
export const deleteDoc = (...args: any[]) => { return (fDeleteDoc as any)(...args); };
export const setDoc = (...args: any[]) => { return (fSetDoc as any)(...args); };

