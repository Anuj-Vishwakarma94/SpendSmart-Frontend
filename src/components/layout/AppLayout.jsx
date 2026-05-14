import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/dashboard',     icon: '⬛', label: 'Dashboard' },
  { to: '/expenses',      icon: '💳', label: 'Expenses' },
  { to: '/incomes',       icon: '💰', label: 'Income' },
  { to: '/categories',    icon: '🗂️',  label: 'Categories' },
  { to: '/budgets',       icon: '🎯', label: 'Budgets' },
  { to: '/analytics',     icon: '📊', label: 'Analytics' },
  { to: '/recurring',     icon: '🔄', label: 'Recurring' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/profile',       icon: '👤', label: 'Profile' },
];

const ADMIN_NAV = { to: '/admin', icon: '🛡️', label: 'Admin Panel' };

export const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          {!collapsed && (
            <div className="brand">
              <span className="brand-icon">💸</span>
              <span className="brand-name">SpendSmart</span>
            </div>
          )}
          <button className="collapse-btn btn btn-ghost btn-sm" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {user?.role === 'ADMIN' && (
            <NavLink
              to={ADMIN_NAV.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={{ borderLeft: '2px solid rgba(188,140,255,0.5)', marginBottom: '8px', background: 'rgba(188,140,255,0.06)' }}
            >
              <span className="nav-icon">{ADMIN_NAV.icon}</span>
              {!collapsed && <span className="nav-label" style={{ color: 'var(--admin-purple, #bc8cff)' }}>{ADMIN_NAV.label}</span>}
            </NavLink>
          )}
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{icon}</span>
              {!collapsed && <span className="nav-label">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && user && (
            <div className="user-info">
              <div className="user-avatar">{user.fullName?.[0]?.toUpperCase()}</div>
              <div className="user-meta">
                <div className="user-name">
                  {user.fullName}
                  {user.role === 'ADMIN' && (
                    <span style={{
                      marginLeft: '6px', fontSize: '0.6rem', fontWeight: 700,
                      background: 'rgba(188,140,255,0.2)', color: 'var(--admin-purple, #bc8cff)',
                      padding: '1px 5px', borderRadius: '3px', verticalAlign: 'middle'
                    }}>ADMIN</span>
                  )}
                </div>
                <div className="user-currency">{user.currency}</div>
              </div>
            </div>
          )}
          <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout} title="Logout">
            🚪{!collapsed && ' Logout'}
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
};
