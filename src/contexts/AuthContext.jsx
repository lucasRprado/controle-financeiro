import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth-context';
import { auth } from '../services/firebase';
import { firebaseErrorMessage } from '../services/userData';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        if (currentUser) setAuthError('');
      },
      (error) => {
        console.error('Não foi possível verificar a sessão do usuário:', error);
        setAuthError(firebaseErrorMessage(error));
        setLoading(false);
      },
    );

    getRedirectResult(auth).catch((error) => {
      console.error('Não foi possível concluir a autenticação redirecionada:', error);
      setAuthError(firebaseErrorMessage(error));
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      clearAuthError: () => setAuthError(''),
    }),
    [user, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
