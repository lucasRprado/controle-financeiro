import { ArrowLeftRight, KeyRound, LayoutDashboard, Leaf, TrendingUp } from 'lucide-react';
import { BrowserRouter as Router, NavLink, Route, Routes } from 'react-router-dom';
import { InstallApp } from './components/InstallApp';
import { Custos } from './pages/Custos';
import { Dashboard } from './pages/Dashboard';
import { Investimentos } from './pages/Investimentos';
import { PixKeys } from './pages/PixKeys';

const navigation = [
  { to: '/', label: 'Visão geral', Icon: LayoutDashboard, end: true },
  { to: '/custos', label: 'Receitas e despesas', Icon: ArrowLeftRight },
  { to: '/investimentos', label: 'Investimentos e metas', Icon: TrendingUp },
  { to: '/pix', label: 'Chaves Pix', Icon: KeyRound },
];

export function App() {
  return (
    <Router>
      <div className="app-shell">
        <aside className="sidebar">
          <NavLink to="/" className="brand">
            <span className="brand-mark">
              <Leaf size={22} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="brand-copy">
              <strong>Finanças</strong>
              <small>CONTROLE PESSOAL</small>
            </span>
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
            <InstallApp />
            <p className="sidebar-note">Organize seu dinheiro com clareza.</p>
          </div>
        </aside>

        <main className="main-content">
          <div className="page-container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/custos" element={<Custos />} />
              <Route path="/investimentos" element={<Investimentos />} />
              <Route path="/pix" element={<PixKeys />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
