import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Receipt, User, LogOut } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import LoadingScreen from './LoadingScreen'; // Import LoadingScreen yang sudah kita buat
import '../styles/Layout.css';

import LogoGua from './../../LogoMD.svg';

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Memicu Loading Screen setiap kali pindah rute
  useEffect(() => {
    setIsPageLoading(true);

    // Beri jeda 600ms - 800ms agar animasi logo sempet terlihat
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
      {/* Tampilkan Loading Screen saat pindah halaman */}
      {isPageLoading && <LoadingScreen />}

      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo-brand">
              <div className="logo-wrapper">
                <img src={LogoGua} alt="Logo DompetGua" className="nav-logo-img" />
              </div>
              <h1 className="app-title">Dompet<span>Gua</span></h1>
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
        {/* Konten muncul dengan animasi fade-in setelah loading selesai */}
        {!isPageLoading && (
          <div className="main-container fade-in">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}