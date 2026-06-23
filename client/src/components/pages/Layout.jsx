import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { isGuestMode } from '../../utils/guestStorage';
import LoadingScreen from './LoadingScreen';
import '../styles/Layout.css';

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (isGuestMode()) { setIsGuest(true); return; }
      const { data: { user } } = await supabase.auth.getUser();
      setIsGuest(user?.is_anonymous ?? false);
    };
    check();
  }, []);

  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => setIsPageLoading(false), 600);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const navItems = [
    { path: '/', icon: 'dashboard', label: 'Dashboard' },
    { path: '/transactions', icon: 'payments', label: 'Transaksi' },
    { path: '/budget', icon: 'account_balance_wallet', label: 'Anggaran' },
    { path: '/profile', icon: 'person', label: 'Profil' },
  ];

  return (
    <div className="layout">
      {isPageLoading && <LoadingScreen />}

      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-left">
            <div className="app-avatar">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNbrZGtaIG8mapUnWg_F2p5dXpH-AIc4KVPl-85RBPknVAlVLUQIVLG1BnYDFheqF5wKgBCLfLzRvbrURMAZwHHUiPOQW1YnRYzdfJzVfpvHavT0rMcMLP1j6tfpnbE9PrZr_EkkOpWVM2E4S0o8AUlKTDvWiKx0P5_kUl4_S7Zatl7VhKlbBO_4XBqjaScdZV5WCgysEmbTKYUDgTqLzTzoLq2bSGrVw0GZkSCgF55JA0zRrDwN_krzYib7FnUj2_xBstkkzV9-ZN"
                alt="avatar"
              />
            </div>
            <h1 className="app-title">Dompet<span>Gua</span></h1>
            {isGuest && <span className="guest-badge">Tamu</span>}
          </div>

          <nav className="desktop-nav">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`desktop-nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="app-main">
        {!isPageLoading && (
          <div className="app-container fade-in">
            {children}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive ? 'active' : ''} ${item.path === '/profile' && isActive ? 'active-profile' : ''}`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive && item.path === '/profile' ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
