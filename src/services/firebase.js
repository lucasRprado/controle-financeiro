import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyATRhpgkWqIDpkoyd1Xg-d5Vc7sRnH5w_Q',
  authDomain: 'fin-app-a0b9c.firebaseapp.com',
  projectId: 'fin-app-a0b9c',
  storageBucket: 'fin-app-a0b9c.firebasestorage.app',
  messagingSenderId: '880315529064',
  appId: '1:880315529064:web:983fd6f35ab02e9a0e48dd',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

const firestoreCacheKey = '__financasFirestoreInstance';
let firestore = globalThis[firestoreCacheKey];

if (!firestore) {
  try {
    firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (error) {
    if (error?.code !== 'failed-precondition') throw error;
    console.warn(
      'O Firestore já estava inicializado nesta sessão; recarregue a página para ativar o cache persistente.',
      error,
    );
    firestore = getFirestore(app);
  }
  globalThis[firestoreCacheKey] = firestore;
}

export const db = firestore;