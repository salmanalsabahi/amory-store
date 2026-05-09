import { addDoc as fAddDoc, updateDoc as fUpdateDoc, deleteDoc as fDeleteDoc, setDoc as fSetDoc } from 'firebase/firestore';

function checkOnlineBeforeAction() {
  if (!navigator.onLine) {
    alert('يجب الاتصال بالإنترنت لإجراء هذه العملية.');
    throw new Error('OFFLINE_REQUIRED');
  }
}

export const addDoc = (...args: any[]) => { checkOnlineBeforeAction(); return (fAddDoc as any)(...args); };
export const updateDoc = (...args: any[]) => { checkOnlineBeforeAction(); return (fUpdateDoc as any)(...args); };
export const deleteDoc = (...args: any[]) => { checkOnlineBeforeAction(); return (fDeleteDoc as any)(...args); };
export const setDoc = (...args: any[]) => { checkOnlineBeforeAction(); return (fSetDoc as any)(...args); };
