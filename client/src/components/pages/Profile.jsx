import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { isGuestMode, disableGuestMode } from '../../utils/guestStorage';
import '../styles/Profile.css';

export default function Profile() {
  const [userData, setUserData] = useState({ username: '', email: '', avatar: '' });
  const [isGuest, setIsGuest] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      if (isGuestMode()) {
        setIsGuest(true);
        setUserData({ username: 'Pengguna Tamu', email: 'guest@dompetgua.local', avatar: '' });
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setIsGuest(user.is_anonymous ?? false);
      if (user.is_anonymous) {
        setUserData({ username: 'Pengguna Tamu', email: 'guest@dompetgua.local', avatar: '' });
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserData({
        username: profile?.full_name || user.email.split('@')[0],
        email: user.email,
        avatar: profile?.avatar_url || '',
      });
    } catch (e) {
      console.error(e.message);
    }
  };

  const uploadAvatar = async (e) => {
    try {
      setUploading(true);
      if (!e.target.files?.length) return;
      const file = e.target.files[0];
      const ext = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl, full_name: userData.username, updated_at: new Date() });
      setUserData(p => ({ ...p, avatar: publicUrl }));
      toast.success('Foto profil diperbarui!');
    } catch (err) {
      toast.error('Gagal upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (isGuest) { toast.error('Buat akun dulu untuk menyimpan profil'); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('profiles').upsert({ id: user.id, full_name: userData.username, updated_at: new Date() });
      toast.success('Profil berhasil diperbarui!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (isGuestMode()) { disableGuestMode(); }
      else { await supabase.auth.signOut(); }
    } catch {}
    window.location.href = '/login';
  };

  const handleExport = (type) => {
    toast.info(`Export ${type === 'Income' ? 'Pemasukan' : 'Pengeluaran'} — segera hadir!`);
  };

  return (
    <div className="profile-page fade-in">
      {isGuest && (
        <div className="guest-card">
          <div className="guest-card-icon">
            <span className="material-symbols-outlined">person_add</span>
          </div>
          <div className="guest-card-text">
            <h3>Mode Tamu</h3>
            <p>Data hanya tersimpan sementara. Daftar gratis untuk menyimpan permanen.</p>
          </div>
          <Link to="/register" className="guest-card-btn">Daftar</Link>
        </div>
      )}

      <section className="profile-hero">
        <div className="profile-hero-content">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {userData.avatar ? (
                <img src={userData.avatar} alt="" />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--primary)' }}>person</span>
              )}
            </div>
            <label className="avatar-upload-label">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>photo_camera</span>
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} hidden />
            </label>
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-name">{userData.username}</h1>
            <p className="profile-email">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span>
              {userData.email}
            </p>
          </div>
        </div>
      </section>

      <section className="tonal-card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="card-icon-box">
              <span className="material-symbols-outlined">settings</span>
            </div>
            <h2 className="card-heading">Pengaturan Akun</h2>
              {!isGuest && (
                <button className="btn btn-primary" onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} disabled={loading || uploading}>
                  {loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Edit Profil'}
                </button>
              )}
          </div>
        </div>
        <div className="settings-form">
          <div className="settings-field">
            <label className="settings-label">Username / Full Name</label>
            <div className="settings-input-wrap">
              <span className="material-symbols-outlined settings-input-icon">person</span>
              <input
                type="text"
                className="settings-input"
                value={userData.username}
                onChange={e => setUserData(p => ({ ...p, username: e.target.value }))}
                disabled={!isEditing}
                readOnly={!isEditing}
              />
            </div>
          </div>
          <div className="settings-field">
            <label className="settings-label">Email (Dikelola Auth)</label>
            <div className="settings-input-wrap">
              <span className="material-symbols-outlined settings-input-icon">alternate_email</span>
              <input type="email" className="settings-input" value={userData.email} disabled />
            </div>
          </div>
        </div>
      </section>

      <section className="tonal-card">
        <div className="card-header-left" style={{ marginBottom: 16 }}>
          <div className="card-icon-box">
            <span className="material-symbols-outlined">download</span>
          </div>
          <h2 className="card-heading">Laporan</h2>
        </div>
        <div className="export-grid">
          <button className="export-card income" onClick={() => handleExport('Income')}>
            <div className="export-card-top">
              <div className="export-icon income">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <span className="material-symbols-outlined export-dl">download</span>
            </div>
            <h3 className="export-title">Laporan Pemasukan</h3>
            <p className="export-desc">Format .CSV • Bulanan</p>
          </button>
          <button className="export-card expense" onClick={() => handleExport('Expense')}>
            <div className="export-card-top">
              <div className="export-icon expense">
                <span className="material-symbols-outlined">trending_down</span>
              </div>
              <span className="material-symbols-outlined export-dl">download</span>
            </div>
            <h3 className="export-title">Laporan Pengeluaran</h3>
            <p className="export-desc">Format .CSV • Bulanan</p>
          </button>
        </div>
      </section>

      <section className="tonal-card">
        <h2 className="card-heading" style={{ marginBottom: 16 }}>Pengaturan</h2>
        <div className="pref-item">
          <div className="pref-left">
            <div className="pref-icon-box">
              <span className="material-symbols-outlined">notifications_active</span>
            </div>
            <div>
              <p className="pref-title">Notifikasi Email</p>
              <p className="pref-desc">Update laporan mingguan DompetGua</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider" />
          </label>
        </div>
      </section>

      <div className="logout-section">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          Keluar dari Perangkat
        </button>
      </div>
    </div>
  );
}
