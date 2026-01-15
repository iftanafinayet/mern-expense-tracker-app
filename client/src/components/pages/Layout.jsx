import { Link, useLocation } from 'react-router-dom';
import { Home, Receipt, User, LogOut, Wallet } from 'lucide-react';
import '../styles/Layout.css';

export default function Layout({ children, onLogout }) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo">
              <Wallet size={32} />
              <h1 className="app-title">Dompet Gua</h1>
            </div>

            <nav className="desktop-nav">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button onClick={onLogout} className="logout-btn">
              <LogOut size={20} />
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="main-container">{children}</div>
      </main>

      <nav className="mobile-nav">
        <div className="mobile-nav-container">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={24} />
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mobile-spacer" />
    </div>
  );
}
