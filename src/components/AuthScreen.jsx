import { LogIn } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { useState } from 'react';
import { InstallApp } from './InstallApp';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../services/firebase';
import { firebaseErrorMessage } from '../services/userData';

export function AuthScreen() {
  const { authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setError('');
    clearAuthError();
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (requestError) {
      console.error('Não foi possível autenticar com e-mail:', requestError);
      setError(firebaseErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    clearAuthError();
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (requestError) {
      if (requestError?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error('Não foi possível redirecionar para o Google:', redirectError);
          setError(firebaseErrorMessage(redirectError));
        }
      } else {
        console.error('Não foi possível entrar com Google:', requestError);
        setError(firebaseErrorMessage(requestError));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = error || authError;
  const isRegistering = mode === 'register';

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <img
          className="auth-logo"
          src="/solus_logo.jpg"
          alt="Solus Creation Finances"
          width="180"
          height="116"
        />
        <p className="page-kicker">Finanças · Controle pessoal</p>
        <h1 className="auth-title" id="auth-title">
          {isRegistering ? 'Crie sua conta' : 'Acesse suas finanças'}
        </h1>
        <p className="auth-description">
          Seus dados ficam salvos e vinculados com segurança à sua conta.
        </p>

        <button
          className="button auth-google-button"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          <img className="auth-google-logo" src="/google_logo.svg" alt="" />
          Continuar com Google
        </button>

        <div className="auth-divider"><span>ou use seu e-mail</span></div>

        <form className="auth-form" onSubmit={handleEmailSubmit}>
          <div className="form-field">
            <label className="form-label" htmlFor="auth-email">E-mail</label>
            <input
              className="form-input"
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="auth-password">Senha</label>
            <input
              className="form-input"
              id="auth-password"
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {displayedError && <p className="auth-error" role="alert">{displayedError}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
            <LogIn size={17} aria-hidden="true" />
            {isSubmitting
              ? 'Aguarde...'
              : isRegistering
                ? 'Criar conta'
                : 'Entrar'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
          <button
            className="auth-switch-button"
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setMode(isRegistering ? 'login' : 'register');
              setError('');
              clearAuthError();
            }}
          >
            {isRegistering ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
        <InstallApp placement="auth" />
      </section>
    </main>
  );
}
