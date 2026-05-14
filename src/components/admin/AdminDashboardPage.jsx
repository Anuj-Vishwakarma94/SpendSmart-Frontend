import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Admin.css';

/* ── Tiny stat card ──────────────────────────────────── */
const KpiCard = ({ icon, value, label, accentClass }) => (
  <div className={`admin-kpi-card ${accentClass}`}>
    <div className="admin-kpi-icon">{icon}</div>
    <div className="admin-kpi-value">{value ?? '—'}</div>
    <div className="admin-kpi-label">{label}</div>
  </div>
);

/* ── Quick-access tiles ──────────────────────────────── */
const QUICK_LINKS = [
  { to: '/admin/users',         icon: '👥', label: 'Manage Users',  desc: 'Suspend, restore, delete accounts' },
  { to: '/admin/notifications', icon: '📢', label: 'Broadcast',     desc: 'Send platform-wide message' },
  { to: '/admin/reports',       icon: '📈', label: 'Reports',       desc: 'Platform analytics & charts' },
  { to: '/admin/audit-logs',    icon: '📋', label: 'Audit Logs',    desc: 'Review all admin actions' },
];

const PIE_COLORS = ['#4ade80', '#f87171'];

export const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminService.getPlatformStats()
      .then(setStats)
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats ? [
    { name: 'Active',    value: stats.activeUsers    ?? 0 },
    { name: 'Suspended', value: stats.suspendedUsers ?? 0 },
  ] : [];

  const barData = stats ? [
    { name: 'Total',     v: stats.totalUsers     ?? 0 },
    { name: 'Active',    v: stats.activeUsers    ?? 0 },
    { name: 'Suspended', v: stats.suspendedUsers ?? 0 },
    { name: 'Admins',    v: stats.adminUsers     ?? 0 },
    { name: 'Users',     v: stats.regularUsers   ?? 0 },
  ] : [];

  const activeRate = stats && stats.totalUsers > 0
    ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {greeting()}, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="admin-page-subtitle">
            Platform overview · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/admin/users" className="admin-btn admin-btn-primary" style={{ textDecoration: 'none' }}>
          + Manage Users
        </Link>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
          <p style={{ marginTop: 12 }}>Loading platform data…</p>
        </div>
      ) : (
        <>
          {/* ── KPI row ── */}
          <div className="admin-kpi-grid">
            <KpiCard icon="👥" value={stats?.totalUsers}     label="Total Users"   accentClass="purple" />
            <KpiCard icon="✅" value={stats?.activeUsers}    label="Active"        accentClass="green"  />
            <KpiCard icon="🚫" value={stats?.suspendedUsers} label="Suspended"     accentClass="red"    />
            <KpiCard icon="🛡️" value={stats?.adminUsers}     label="Admins"        accentClass="blue"   />
            <KpiCard icon="👤" value={stats?.regularUsers}   label="Regular Users" accentClass="pink"   />
          </div>

          {/* ── Charts row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Bar chart */}
            <div className="admin-card">
              <div className="admin-card-title">User Distribution</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: '0.8rem' }}
                    labelStyle={{ color: '#f0f0f0' }}
                    cursor={{ fill: 'rgba(255,255,255,0.3)' }}
                  />
                  <Bar dataKey="v" name="Count" fill="rgba(255,255,255,0.75)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="admin-card">
              <div className="admin-card-title">Active vs Suspended</div>
              {stats?.totalUsers > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={68} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: '0.8rem' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 6 }}>
                    {pieData.map((d, i) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i], display: 'inline-block' }} />
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="admin-empty" style={{ padding: '40px 0' }}><p>No users yet</p></div>
              )}
            </div>
          </div>

          {/* ── Health bar ── */}
          <div className="admin-card" style={{ marginBottom: 24 }}>
            <div className="admin-card-title">Platform Health</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              <span>Active user rate</span>
              <span style={{ color: '#50c87a', fontWeight: 600 }}>{activeRate}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${activeRate}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                Total: <strong style={{ color: '#f0f0f0' }}>{stats?.totalUsers ?? 0}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                Active: <strong style={{ color: '#50c87a' }}>{stats?.activeUsers ?? 0}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                Suspended: <strong style={{ color: '#f85149' }}>{stats?.suspendedUsers ?? 0}</strong>
              </div>
            </div>
          </div>

          {/* ── Quick actions ── */}
          <div className="admin-card-title" style={{ marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {QUICK_LINKS.map(({ to, icon, label, desc }) => (
              <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                <div className="admin-card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontWeight: 600, color: '#f0f0f0', fontSize: '0.88rem', marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
