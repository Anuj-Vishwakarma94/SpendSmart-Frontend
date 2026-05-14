import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '../../services/api';
import toast from 'react-hot-toast';
import './Auth.css';

export const ResetPasswordPage = () => {
  const [searchParams]            = useSearchParams();
  const navigate                  = useNavigate();

  const [form, setForm]           = useState({ token: searchParams.get('token') || '', newPassword: '', confirm: '' });
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.token) {
      toast.error('Please enter the OTP sent to your email.');
      return;
    }
    if (form.newPassword !== form.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await AuthService.resetPassword(form.token, form.newPassword);
      setSuccess(true);
      toast.success('Password reset! Redirecting to sign in…');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      toast.error(err?.message || 'Reset failed. The OTP may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card fade-in">
        <div className="auth-brand">
          <div className="auth-logo">💸</div>
          <h1 className="auth-title">SpendSmart</h1>
          <p className="auth-subtitle">Track. Visualize. Save. Grow.</p>
        </div>

        {success ? (
          <div className="auth-form">
            <div style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600, color: '#f0f0f0' }}>
                Password updated!
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                Redirecting you to sign in…
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="form-heading">Choose a new password</h2>
            <p style={{ margin: '-8px 0 4px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Must be at least 8 characters.
            </p>

            <div className="form-group">
              <label className="form-label">OTP / Reset Code</label>
              <input
                id="reset-token"
                name="token"
                type="text"
                required
                className="form-control"
                placeholder="Enter the 6-digit code from email"
                value={form.token}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reset-password"
                  name="newPassword"
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="form-control"
                  placeholder="Min. 8 characters"
                  value={form.newPassword}
                  onChange={handleChange}
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', fontSize: '1rem', lineHeight: 1,
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                id="reset-confirm"
                name="confirm"
                type={showPass ? 'text' : 'password'}
                required
                minLength={8}
                className="form-control"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handleChange}
              />
            </div>

            <button
              id="reset-submit-btn"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Resetting…' : 'Reset password'}
            </button>

            <p className="auth-switch">
              <Link to="/login">← Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
