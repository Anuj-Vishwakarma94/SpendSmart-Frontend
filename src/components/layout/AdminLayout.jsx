import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminLayout.css';

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

const ADMIN_NAV = [
  { to: '/admin/dashboard',     icon: '▦', label: 'Dashboard' },
  { to: '/admin/users',         icon: '◎', label: 'User Management' },
  { to: '/admin/transactions',  icon: '⇅', label: 'Transactions' },
  { to: '/admin/notifications', icon: '◈', label: 'Broadcast' },
  { to: '/admin/reports',       icon: '◫', label: 'Reports' },
  { to: '/admin/audit-logs',    icon: '≋', label: 'Audit Logs' },
];

export const AdminLayout = ({ children }) => {
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
    <div className={`admin-shell ${collapsed ? 'collapsed' : ''}`}>
      {/* Mobile top bar */}
      <div className="admin-topbar">
        <div className="admin-topbar-brand">
          <div className="admin-brand-icon"><WalletIcon /></div>
          <span className="admin-topbar-brand-name">SpendSmart</span>
          <span className="admin-topbar-badge">Admin</span>
        </div>
        <button className="admin-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>

      {/* Backdrop overlay */}
      <div className={`admin-sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={closeMobile} />

      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="admin-brand-icon"><WalletIcon /></div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div className="admin-brand-name">SpendSmart</div>
                <div className="admin-brand-sub">Admin Panel</div>
              </div>
            )}
          </div>
          <button className="admin-collapse-btn" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="admin-nav">
          {ADMIN_NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to}
              onClick={closeMobile}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          {user && !collapsed && (
            <div className="admin-user-info">
              <div className="admin-avatar">{user.fullName?.[0]?.toUpperCase()}</div>
              <div style={{ overflow: 'hidden' }}>
                <div className="admin-user-name">{user.fullName}</div>
                <div className="admin-user-badge">Administrator</div>
              </div>
            </div>
          )}
          <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
            <LogoutIcon />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
};
