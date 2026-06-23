import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { isGuestMode, getGuestTransactions, disableGuestMode } from '../../utils/guestStorage';
import '../styles/Register.css';
import LogoGua from './../../LogoMD.svg';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.username || form.username.length < 3) e.username = 'Minimal 3 karakter';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email tidak valid';
    if (!form.password || form.password.length < 6) e.password = 'Minimal 6 karakter';
    if (!form.confirmPassword) e.confirmPassword = 'Konfirmasi kata sandi';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Kata sandi tidak cocok';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const migrateGuestData = async (userId) => {
    const guestTx = getGuestTransactions();
    if (!guestTx.length) return;

    const payload = guestTx.map(t => ({
      user_id: userId,
      title: t.title,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      description: t.description || '',
    }));

    const { error } = await supabase.from('transactions').insert(payload);
    if (!error) {
      localStorage.removeItem('dompetgua_guest_transactions');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const isGuest = isGuestMode();
      const guestTx = isGuest ? getGuestTransactions() : [];

      const { data, error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { username: form.username } },
      });
      if (error) throw error;

      if (isGuest && data?.user && guestTx.length) {
        await migrateGuestData(data.user.id);
        disableGuestMode();
        toast.success('Data tamu berhasil dipindahkan!', { description: 'Transaksi kamu sudah disimpan.' });
        window.location.href = '/';
        return;
      }

      if (isGuest) {
        localStorage.setItem('dompetgua_pending_migration', JSON.stringify(guestTx));
        disableGuestMode();
      }

      toast.success('Pendaftaran berhasil! Cek email kamu.');
      navigate('/verify-email');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <main className="register-main">
        <div className="register-logo">
          <img src={LogoGua} alt="DompetGua" className="register-logo-img" />
          <h1 className="register-title">Buat Akun</h1>
          <p className="register-subtitle">Mulai catat pengeluaranmu sekarang</p>
        </div>

        <div className="register-card">
          <form onSubmit={handleSubmit}>
            {[
              { id: 'username', label: 'Nama Lengkap', icon: 'person', type: 'text',               placeholder: 'Nama kamu' },
              { id: 'email', label: 'Email', icon: 'mail', type: 'email', placeholder: 'email@example.com' },
              { id: 'password', label: 'Kata Sandi', icon: 'lock', type: showPw ? 'text' : 'password', placeholder: 'Minimal 6 karakter', toggle: () => setShowPw(!showPw), icon2: showPw ? 'visibility_off' : 'visibility' },
              { id: 'confirmPassword', label: 'Konfirmasi Kata Sandi', icon: 'lock', type: showCp ? 'text' : 'password', placeholder: 'Ulangi kata sandi', toggle: () => setShowCp(!showCp), icon2: showCp ? 'visibility_off' : 'visibility' },
            ].map(f => (
              <div className="reg-field" key={f.id}>
                <label className="reg-label">{f.label}</label>
                <div className="reg-input-wrap">
                  <span className="material-symbols-outlined reg-input-icon">{f.icon}</span>
                  <input type={f.type} className={`reg-input ${errors[f.id] ? 'error' : ''}`} placeholder={f.placeholder}
                    value={form[f.id]} onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))} />
                  {f.toggle && (
                    <button type="button" className="reg-pw-toggle" onClick={f.toggle}>
                      <span className="material-symbols-outlined">{f.icon2}</span>
                    </button>
                  )}
                </div>
                {errors[f.id] && <p className="reg-error">{errors[f.id]}</p>}
              </div>
            ))}

            <button type="submit" className="reg-submit" disabled={loading}>
              {loading ? 'Mendaftarkan...' : 'Daftar'}
            </button>

            <p className="reg-redirect">
              Sudah punya akun? <Link to="/login" className="reg-link">Masuk</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
