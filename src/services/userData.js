import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export function userCollection(userId, collectionName) {
  return collection(db, 'users', userId, collectionName);
}

export function userDocument(userId, collectionName, documentId) {
  return doc(db, 'users', userId, collectionName, documentId);
}

export function createUserRecord(userId, collectionName, data) {
  return addDoc(userCollection(userId, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export function updateUserRecord(userId, collectionName, documentId, data) {
  return updateDoc(userDocument(userId, collectionName, documentId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function deleteUserRecord(userId, collectionName, documentId) {
  return deleteDoc(userDocument(userId, collectionName, documentId));
}

export function toCents(amount) {
  return Math.round((Number(amount) + Number.EPSILON) * 100);
}

export function fromCents(amount) {
  return Number(amount ?? 0) / 100;
}

const firebaseErrors = {
  'auth/account-exists-with-different-credential':
    'Este e-mail já está associado a outra forma de acesso. Entre usando o método original.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado. Tente entrar na sua conta.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Informe um endereço de e-mail válido.',
  'auth/operation-not-allowed':
    'Este método de acesso não está habilitado no Firebase Authentication.',
  'auth/popup-blocked': 'O navegador bloqueou a janela de autenticação. Tente novamente.',
  'auth/popup-closed-by-user': 'A janela de autenticação foi fechada antes da conclusão.',
  'auth/cancelled-popup-request': 'Outra janela de autenticação já está em andamento. Tente novamente.',
  'auth/web-storage-unsupported':
    'O navegador bloqueou o armazenamento necessário para autenticar. Tente em um navegador padrão e atualizado.',
  'auth/operation-not-supported-in-this-environment':
    'Este ambiente não permite autenticação Google. Abra o app em um navegador compatível, como Safari ou Chrome.',
  'auth/unauthorized-domain':
    'Este domínio não está autorizado no Firebase Authentication. Adicione-o aos domínios autorizados.',
  'auth/user-disabled': 'Esta conta foi desativada. Entre em contato com o suporte.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  'auth/network-request-failed': 'Falha de conexão. Verifique a internet e tente novamente.',
  'firestore/permission-denied':
    'O Firebase recusou o acesso. Verifique se as regras do Firestore foram publicadas.',
  'firestore/unauthenticated': 'Sua sessão expirou. Entre novamente para continuar.',
  'firestore/unavailable': 'O Firestore está indisponível. Verifique sua conexão e tente novamente.',
  'firestore/failed-precondition':
    'O Firestore não conseguiu concluir a operação. Verifique a configuração do banco.',
};

export function firebaseErrorMessage(error) {
  if (error && typeof error.message === 'string' && !error.code) return error.message;
  if (error?.code && firebaseErrors[error.code]) return firebaseErrors[error.code];
  if (error?.code === 'permission-denied') return firebaseErrors['firestore/permission-denied'];
  if (error?.code === 'unauthenticated') return firebaseErrors['firestore/unauthenticated'];
  if (error?.code === 'unavailable') return firebaseErrors['firestore/unavailable'];
  if (error?.code === 'failed-precondition') return firebaseErrors['firestore/failed-precondition'];
  return 'Não foi possível concluir a operação. Tente novamente.';
}
