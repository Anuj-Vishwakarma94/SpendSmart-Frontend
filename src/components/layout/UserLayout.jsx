import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './UserLayout.css';

/* ── Brand wallet icon — matches landing page ── */
const WalletIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

/* ── Logout icon — arrow-right-from-bracket style ── */
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const NAV_ITEMS = [
  { to: '/dashboard',     icon: '⊞', label: 'Dashboard' },
  { to: '/expenses',      icon: '↑', label: 'Expenses' },
  { to: '/incomes',       icon: '↓', label: 'Income' },
  { to: '/categories',    icon: '⊟', label: 'Categories' },
  { to: '/budgets',       icon: '◎', label: 'Budgets' },
  { to: '/analytics',     icon: '∿', label: 'Analytics' },
  { to: '/recurring',     icon: '↻', label: 'Recurring' },
  { to: '/notifications', icon: '◉', label: 'Notifications' },
  { to: '/subscription',  icon: '◆', label: 'Premium' },
  { to: '/profile',       icon: '○', label: 'Profile' },
];

export const UserLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={`user-shell ${collapsed ? 'collapsed' : ''}`}>
      {/* Mobile top bar */}
      <div className="user-topbar">
        <div className="user-topbar-brand">
          <div className="user-brand-icon"><WalletIcon /></div>
          <span className="user-topbar-brand-name">SpendSmart</span>
        </div>
        <button className="user-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>

      {/* Backdrop overlay */}
      <div className={`user-sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={closeMobile} />

      <aside className={`user-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="user-sidebar-header">
          <div className="user-brand">
            <div className="user-brand-icon"><WalletIcon /></div>
            <span className="user-brand-name">SpendSmart</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="user-nav">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} onClick={closeMobile} className={({ isActive }) => `user-nav-item ${isActive ? 'active' : ''}`}>
              <span className="user-nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="user-sidebar-footer">
          {user && (
            <div className="user-info">
              <div className="user-avatar">{user.fullName?.[0]?.toUpperCase()}</div>
              <div className="user-meta">
                <div className="user-name">{user.fullName}</div>
                <div className="user-currency">{user.currency}</div>
              </div>
            </div>
          )}
          <button className="btn logout-btn" onClick={handleLogout} title="Logout">
            <LogoutIcon /> <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="user-main">{children}</main>
    </div>
  );
};
