import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { enableGuestMode } from '../../utils/guestStorage';
import '../styles/Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email tidak valid';
    if (!formData.password) newErrors.password = 'Kata sandi wajib diisi';
    else if (formData.password.length < 6) newErrors.password = 'Minimal 6 karakter';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) loginUser();
  };

  const loginUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) { toast.error(error.message); return; }

      if (data.session) {
        const pending = localStorage.getItem('dompetgua_pending_migration');
        if (pending) {
          try {
            const guestTx = JSON.parse(pending);
            if (guestTx.length && data.user) {
              const payload = guestTx.map(t => ({
                user_id: data.user.id, title: t.title, amount: t.amount,
                type: t.type, category: t.category, date: t.date, description: t.description || '',
              }));
              await supabase.from('transactions').insert(payload);
              localStorage.removeItem('dompetgua_pending_migration');
              toast.success('Data tamu berhasil dipindahkan!');
            }
          } catch { localStorage.removeItem('dompetgua_pending_migration'); }
        }
        toast.success('Berhasil masuk!');
        window.location.href = '/';
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.session) {
        enableGuestMode();
        window.location.href = '/';
        return;
      }
      if (data.session) { window.location.href = '/'; }
    } catch {
      enableGuestMode();
      window.location.href = '/';
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="login-page">
      <main className="login-main">
        <div className="login-logo-section">
          <div className="login-logo-icon">
            <span className="material-symbols-outlined filled-icon">account_balance_wallet</span>
          </div>
          <h1 className="login-title">Selamat Datang</h1>
          <p className="login-subtitle">Masuk untuk mengelola keuanganmu</p>
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="email">Email</label>
              <div className="login-input-wrap">
                <span className="material-symbols-outlined login-input-icon">mail</span>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`login-input ${errors.email ? 'error' : ''}`}
                  placeholder="email@example.com"
                />
              </div>
              {errors.email && <p className="login-error">{errors.email}</p>}
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">Kata Sandi</label>
              <div className="login-input-wrap">
                <span className="material-symbols-outlined login-input-icon">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`login-input ${errors.password ? 'error' : ''}`}
                  placeholder="Masukkan kata sandi"
                />
                <button type="button" className="login-pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.password && <p className="login-error">{errors.password}</p>}
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" className="login-checkbox" />
                <span>Ingat aku</span>
              </label>
              <button type="button" className="login-forgot">Lupa kata sandi?</button>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? <span className="material-symbols-outlined spin">autorenew</span> : 'Masuk'}
            </button>

            <p className="login-redirect">
              Belum punya akun? <Link to="/register" className="login-link">Daftar</Link>
            </p>
          </form>

          <div className="login-divider">
            <span className="login-divider-line" />
            <span className="login-divider-text">atau</span>
            <span className="login-divider-line" />
          </div>

          <button onClick={handleGuestLogin} className="login-guest-btn" disabled={guestLoading}>
            <span className="material-symbols-outlined">person_add</span>
            {guestLoading ? 'Memproses...' : 'Lanjut sebagai Tamu'}
          </button>
        </div>

        <div className="login-dots">
          <span /><span /><span />
        </div>
      </main>
    </div>
  );
}
