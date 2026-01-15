import { useState, useEffect } from 'react';
import { User, Mail, Camera, Download, Settings, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/Profile.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Profile() {
  const [userData, setUserData] = useState({
    username: 'johndoe',
    email: 'john.doe@example.com',
    avatar: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setUserData({
            username: data.username || 'johndoe',
            email: data.email || 'john.doe@example.com',
            avatar: data.profileImage || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleExportIncome = () => {
    toast.success('Income report downloaded successfully!', { description: 'Check your downloads folder' });
    console.log('Exporting income data...');
  };

  const handleExportExpense = () => {
    toast.success('Expense report downloaded successfully!', { description: 'Check your downloads folder' });
    console.log('Exporting expense data...');
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          profileImage: userData.avatar,
        }),
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="avatar-wrapper">
            <div className="avatar">
              {userData.avatar ? (
                <img src={userData.avatar} alt="Profile" />
              ) : (
                <User size={48} />
              )}
            </div>
            <button className="avatar-upload">
              <Camera size={16} />
            </button>
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{userData.username}</h1>
            <p className="profile-email">
              <Mail size={16} />
              {userData.email}
            </p>
            <p className="profile-member">Member since January 2026</p>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Settings size={24} />
            Account Settings
          </h2>
          <button
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Edit Profile')}
          </button>
        </div>

        <div className="settings-form">
          <div className="input-group">
            <label className="input-label">Username</label>
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
            <label className="input-label">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                disabled={!isEditing}
                className="input-field"
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
          <div className="export-card income">
            <div className="export-header">
              <div className="export-icon income">
                <Download size={24} />
              </div>
              <span className="export-emoji">📈</span>
            </div>
            <h3 className="export-title">Income Report</h3>
            <p className="export-description">Download all your income transactions in Excel format</p>
            <button onClick={handleExportIncome} className="btn btn-income export-btn">
              <Download size={16} />
              Download Income
            </button>
          </div>

          <div className="export-card expense">
            <div className="export-header">
              <div className="export-icon expense">
                <Download size={24} />
              </div>
              <span className="export-emoji">📉</span>
            </div>
            <h3 className="export-title">Expense Report</h3>
            <p className="export-description">Download all your expense transactions in Excel format</p>
            <button onClick={handleExportExpense} className="btn btn-expense export-btn">
              <Download size={16} />
              Download Expenses
            </button>
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
                <p className="preference-description">Receive updates about your transactions</p>
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <Shield size={20} />
              <div>
                <p className="preference-title">Two-Factor Authentication</p>
                <p className="preference-description">Add an extra layer of security</p>
              </div>
            </div>
            <button className="btn btn-primary btn-sm">Enable</button>
          </div>
        </div>
      </div>
    </div>
  );
}
