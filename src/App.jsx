import {
  ArrowLeftRight,
  FileDown,
  KeyRound,
  LayoutDashboard,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { BrowserRouter as Router, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AuthScreen } from './components/AuthScreen';
import { InstallApp } from './components/InstallApp';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Custos } from './pages/Custos';
import { Dashboard } from './pages/Dashboard';
import { Investimentos } from './pages/Investimentos';
import { PixKeys } from './pages/PixKeys';
import { auth } from './services/firebase';
import { firebaseErrorMessage } from './services/userData';

const navigation = [
  { to: '/', label: 'Visão geral', Icon: LayoutDashboard, end: true },
  { to: '/custos', label: 'Receitas e despesas', Icon: ArrowLeftRight },
  { to: '/investimentos', label: 'Investimentos e metas', Icon: TrendingUp },
  { to: '/pix', label: 'Chaves Pix', Icon: KeyRound },
];

function AuthenticatedApp({ user }) {
  const [logoutError, setLogoutError] = useState('');
  const location = useLocation();

  const handleExportPdf = () => {
    if (
      location.pathname === '/pix' &&
      !window.confirm('O PDF desta página incluirá suas chaves Pix completas. Deseja continuar?')
    ) {
      return;
    }

    window.print();
  };

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Não foi possível encerrar a sessão:', error);
      setLogoutError(firebaseErrorMessage(error));
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <img
            className="brand-logo"
            src="/solus_logo.jpg"
            alt="Solus Creation Finances"
            width="200"
            height="130"
          />
        </NavLink>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navigation.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="account-panel">
            <span className="account-email" title={user.email ?? 'Conta Google'}>
              {user.email ?? 'Conta Google'}
            </span>
            <button className="sidebar-logout" type="button" onClick={handleLogout}>
              <LogOut size={17} aria-hidden="true" />
              Sair
            </button>
          </div>
          {logoutError && <p className="sidebar-error" role="alert">{logoutError}</p>}
          <InstallApp />
          <p className="sidebar-note">Organize seu dinheiro com clareza.</p>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-container">
          <div className="page-toolbar print-hidden">
            <button
              className="button button-secondary"
              type="button"
              title="Na próxima tela, escolha salvar como PDF ou compartilhar."
              onClick={handleExportPdf}
            >
              <FileDown size={18} aria-hidden="true" />
              Exportar PDF
            </button>
          </div>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/custos" element={<Custos />} />
            <Route path="/investimentos" element={<Investimentos />} />
            <Route path="/pix" element={<PixKeys />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="auth-page">
        <p className="auth-loading" role="status">Verificando sua sessão...</p>
      </main>
    );
  }

  return user ? <AuthenticatedApp user={user} /> : <AuthScreen />;
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
