import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../../services/api';
import toast from 'react-hot-toast';
import './Auth.css';

export const ForgotPasswordPage = () => {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await AuthService.forgotPassword(email);
      setSubmitted(true);
      toast.success('OTP sent! Check your inbox.');
    } catch (err) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
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

        {submitted ? (
          <div className="auth-form">
            <div style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📬</div>
              <h2 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 600, color: '#f0f0f0' }}>
                Check your inbox
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                If <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{email}</strong> is registered,
                you'll receive an OTP within a few minutes.
              </p>
            </div>
            <p className="auth-switch" style={{ paddingTop: '8px' }}>
              <Link to="/reset-password">Enter OTP here →</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <h2 className="form-heading">Reset your password</h2>
            <p style={{ margin: '-8px 0 4px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Enter your email and we'll send you a secure OTP to reset your password.
            </p>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                required
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              id="forgot-submit-btn"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>

            <p className="auth-switch">
              Remembered it? <Link to="/login">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
