import { onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { firebaseErrorMessage, userCollection } from '../services/userData';

export function useUserCollection(collectionName) {
  const { user } = useAuth();
  const userId = user?.uid;
  const [snapshot, setSnapshot] = useState({ userId: null, documents: [], error: '' });

  useEffect(() => {
    if (!userId) return undefined;

    return onSnapshot(
      userCollection(userId, collectionName),
      (result) => {
        const documents = result.docs
          .map((item) => ({ ...item.data(), id: item.id }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setSnapshot({ userId, documents, error: '' });
      },
      (error) => {
        console.error(`Não foi possível carregar ${collectionName}:`, error);
        setSnapshot({ userId, documents: [], error: firebaseErrorMessage(error) });
      },
    );
  }, [collectionName, userId]);

  const isCurrentUser = Boolean(userId) && snapshot.userId === userId;
  return {
    documents: isCurrentUser ? snapshot.documents : [],
    loading: Boolean(userId) && !isCurrentUser,
    error: isCurrentUser ? snapshot.error : '',
  };
}
