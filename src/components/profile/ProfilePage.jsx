import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/api';
import toast from 'react-hot-toast';
import './Profile.css';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState('');

  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    timezone: user?.timezone || 'Asia/Kolkata',
  });


  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [budget, setBudget] = useState(user?.monthlyBudget || '');

  const handleProfileSave = async e => {
    e.preventDefault();
    setSaving('profile');
    try {
      await AuthService.updateProfile(profile);
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) { toast.error(err?.message || 'Update failed'); }
    setSaving('');
  };



  const handleCurrencyUpdate = async () => {
    setSaving('currency');
    try {
      await AuthService.updateCurrency(currency);
      await refreshUser();
      toast.success(`Currency set to ${currency}`);
    } catch (err) { toast.error(err?.message || 'Update failed'); }
    setSaving('');
  };

  const handleBudgetUpdate = async () => {
    setSaving('budget');
    try {
      await AuthService.updateBudget(parseFloat(budget));
      await refreshUser();
      toast.success('Monthly budget updated');
    } catch (err) { toast.error(err?.message || 'Update failed'); }
    setSaving('');
  };

  return (
    <div className="profile-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* ─── Profile Info ────────────────────────── */}
        <div className="card">
          <div className="profile-avatar-row">
            <div className="avatar-lg">{user?.fullName?.[0]?.toUpperCase()}</div>
            <div>
              <div className="profile-name">{user?.fullName}</div>
              <div className="profile-email">{user?.email}</div>
              <span className="badge badge-green">{user?.role}</span>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="profile-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={profile.fullName}
                onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea rows={3} className="form-control" placeholder="Tell us about yourself…"
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-control" value={profile.timezone}
                onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving === 'profile'}>
              {saving === 'profile' ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        <div className="profile-right">
          {/* ─── Currency ─────────────────────────── */}
          <div className="card">
            <h3 className="section-title">Display Currency</h3>
            <div className="inline-row">
              <select className="form-control" value={currency} onChange={e => setCurrency(e.target.value)}>
                {Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => (
                  <option key={code} value={code}>{code} {sym}</option>
                ))}
              </select>
              <button className="btn btn-secondary" onClick={handleCurrencyUpdate} disabled={saving === 'currency'}>
                {saving === 'currency' ? '…' : 'Update'}
              </button>
            </div>
          </div>

          {/* ─── Monthly Budget ────────────────────── */}
          <div className="card">
            <h3 className="section-title">Monthly Budget Goal</h3>
            <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: 12 }}>
              Used in Financial Health Score computation
            </p>
            <div className="inline-row">
              <input type="number" min="0" step="100" className="form-control"
                placeholder="e.g. 30000" value={budget}
                onChange={e => setBudget(e.target.value)} />
              <button className="btn btn-secondary" onClick={handleBudgetUpdate} disabled={saving === 'budget'}>
                {saving === 'budget' ? '…' : 'Set'}
              </button>
            </div>
          </div>

          {/* ─── Change Password ───────────────────── */}
          {/* Removed per user request */}
        </div>
      </div>
    </div>
  );
};
