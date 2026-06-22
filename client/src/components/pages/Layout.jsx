import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Receipt, User, LogOut } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import LoadingScreen from './LoadingScreen';
import '../styles/Layout.css';

import LogoGua from './../../LogoMD.svg';

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsGuest(user?.is_anonymous ?? false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/transactions', icon: Receipt, label: 'Transactions' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      if (onLogout) onLogout();
      toast.success('Berhasil keluar!');
    } catch (error) {
      toast.error('Gagal logout: ' + error.message);
    }
  };

  return (
    <div className="layout">
      {isPageLoading && <LoadingScreen />}

      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-brand">
              <div className="logo-wrapper">
                <img src={LogoGua} alt="Logo DompetGua" className="nav-logo-img" />
              </div>
              <h1 className="app-title">Dompet<span>Gua</span></h1>
              {isGuest && <span className="guest-badge">Tamu</span>}
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
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="header-actions">
              <button onClick={handleLogout} className="logout-btn-premium">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {!isPageLoading && (
          <div className="main-container fade-in">
            {children}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button onClick={handleLogout} className="bottom-nav-link logout">
          <LogOut size={24} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
