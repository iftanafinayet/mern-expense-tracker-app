import { useState, useEffect } from 'react';
import { User, Mail, Camera, Download, Settings, Bell, Loader2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import '../styles/Profile.css';

export default function Profile() {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    avatar: '',
  });
  const [isGuest, setIsGuest] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsGuest(user.is_anonymous ?? false);

        if (user.is_anonymous) {
          setUserData({
            username: 'Pengguna Tamu',
            email: 'guest@dompetgua.local',
            avatar: '',
          });
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        setUserData({
          username: profile?.full_name || user.email.split('@')[0],
          email: user.email,
          avatar: profile?.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Error:', error.message);
      toast.error('Gagal mengambil data profil');
    }
  };

  // FUNGSI UPLOAD FOTO KE SUPABASE STORAGE
  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Pilih gambar untuk diupload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Ambil Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update database profiles (TAMBAHKAN full_name DISINI)
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          full_name: userData.username, // <--- TAMBAHKAN INI agar NOT NULL constraint terpenuhi
          updated_at: new Date(),
        });

      if (updateError) throw updateError;

      setUserData({ ...userData, avatar: publicUrl });
      toast.success('Foto profil diperbarui!');
    } catch (error) {
      toast.error('Gagal upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (isGuest) {
      toast.error('Buat akun dulu untuk menyimpan profil');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User tidak ditemukan');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: userData.username,
          avatar_url: userData.avatar,
          updated_at: new Date(),
        });

      if (error) throw error;

      toast.success('Profil berhasil diperbarui!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Gagal memperbarui profil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    toast.info(`Fitur Export ${type} segera hadir!`, {
      description: 'Kami sedang menyiapkan generator CSV untuk laporanmu.'
    });
  };

  return (
    <div className="profile-page fade-in">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="avatar-wrapper">
            <div className="avatar">
              {uploading ? (
                <Loader2 size={32} className="animate-spin text-blue-500" />
              ) : userData.avatar ? (
                <img src={userData.avatar} alt="Profile" />
              ) : (
                <User size={48} />
              )}
            </div>
            <label className="avatar-upload" htmlFor="avatar-input">
              <Camera size={16} />
              <input
                type="file"
                id="avatar-input"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{userData.username}</h1>
            <p className="profile-email">
              <Mail size={16} />
              {userData.email}
            </p>
          </div>
        </div>
      </div>

      {isGuest && (
        <div className="card guest-alert-card">
          <div className="guest-alert-content">
            <div className="guest-alert-icon">
              <LogIn size={24} />
            </div>
            <div className="guest-alert-text">
              <h3>Mode Tamu</h3>
              <p>Data hanya tersimpan sementara. Daftar akun gratis untuk menyimpan data secara permanen.</p>
            </div>
            <Link to="/register" className="btn btn-primary guest-register-btn">
              Daftar
            </Link>
          </div>
        </div>
      )}

      {/* Account Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Settings size={24} />
            Account Settings
          </h2>
          {!isGuest && (
            <button
              onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
              className="btn btn-primary"
              disabled={loading || uploading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Edit Profile')}
            </button>
          )}
        </div>

        <div className="settings-form">
          <div className="input-group">
            <label className="input-label">Username / Full Name</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input
                type="text"
                value={userData.username}
                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                disabled={!isEditing}
                className="input-field"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email (Auth Managed)</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                value={userData.email}
                disabled={true}
                className="input-field"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Export Reports */}
      <div className="card">
        <h2 className="card-title">
          <Download size={24} />
          Export Reports
        </h2>

        <div className="export-grid">
          <div className="export-card income" onClick={() => handleExport('Income')}>
            <div className="export-header">
              <div className="export-icon income"><Download size={24} /></div>
              <span className="export-emoji">📈</span>
            </div>
            <h3 className="export-title">Income Report</h3>
            <p className="export-description">Format .CSV</p>
          </div>

          <div className="export-card expense" onClick={() => handleExport('Expense')}>
            <div className="export-header">
              <div className="export-icon expense"><Download size={24} /></div>
              <span className="export-emoji">📉</span>
            </div>
            <h3 className="export-title">Expense Report</h3>
            <p className="export-description">Format .CSV</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card">
        <h2 className="card-title">Preferences</h2>
        <div className="preferences-list">
          <div className="preference-item">
            <div className="preference-info">
              <Bell size={20} />
              <div>
                <p className="preference-title">Email Notifications</p>
                <p className="preference-description">Update laporan mingguan DompetGua</p>
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}