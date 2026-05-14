import React, { useState, useEffect, useCallback } from 'react';
import { AdminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Admin.css';

// ─── KPI Card ──────────────────────────────────────────────
const KpiCard = ({ icon, value, label, accent }) => (
  <div className={`admin-kpi accent-${accent}`}>
    <div className="admin-kpi-icon">{icon}</div>
    <div className="admin-kpi-value">{value ?? '—'}</div>
    <div className="admin-kpi-label">{label}</div>
  </div>
);

// ─── Overview Tab ───────────────────────────────────────────
const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminService.getPlatformStats()
      .then(setStats)
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">⏳ Loading platform stats…</div>;
  if (!stats)  return <div className="admin-empty"><div className="admin-empty-icon">📊</div><p>No stats available</p></div>;

  return (
    <>
      <div className="admin-stats-grid">
        <KpiCard icon="👥" value={stats.totalUsers}     label="Total Users"      accent="blue" />
        <KpiCard icon="✅" value={stats.activeUsers}    label="Active Users"     accent="green" />
        <KpiCard icon="🚫" value={stats.suspendedUsers} label="Suspended"        accent="red" />
        <KpiCard icon="🛡️" value={stats.adminUsers}     label="Admins"           accent="purple" />
        <KpiCard icon="👤" value={stats.regularUsers}   label="Regular Users"    accent="yellow" />
      </div>

      <div className="admin-table-wrap">
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>📈 Platform Health</h3>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {stats.activeUsers} of {stats.totalUsers} users are currently active
            {stats.suspendedUsers > 0 && ` · ${stats.suspendedUsers} suspended`}
            {stats.adminUsers > 0 && ` · ${stats.adminUsers} admin${stats.adminUsers > 1 ? 's' : ''}`}
          </p>
          <div style={{ marginTop: '20px', height: '8px', background: 'var(--bg-primary)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers * 100).toFixed(1) : 0}%`,
              background: 'linear-gradient(90deg, var(--admin-success), var(--admin-blue))',
              borderRadius: '999px',
              transition: 'width 1s ease'
            }} />
          </div>
          <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}% active rate
          </p>
        </div>
      </div>
    </>
  );
};

// ─── Users Tab ──────────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(null); // userId being actioned

  const load = useCallback(() => {
    setLoading(true);
    AdminService.getUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handle = async (action, userId, label) => {
    if (action === 'delete' && !window.confirm(`Permanently delete this user? This cannot be undone.`)) return;
    setBusy(userId);
    try {
      const fn = { suspend: AdminService.suspendUser, unsuspend: AdminService.unsuspendUser, delete: AdminService.deleteUser }[action];
      const res = await fn(userId);
      toast.success(res.message || label);
      load();
    } catch (e) {
      toast.error(e?.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                        u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL'      ? true
                      : filter === 'ACTIVE'   ? u.isActive
                      : filter === 'SUSPENDED'? !u.isActive
                      : filter === 'ADMIN'    ? u.role === 'ADMIN'
                      : true;
    return matchSearch && matchFilter;
  });

  return (
    <div className="admin-table-wrap">
      <div className="admin-table-toolbar">
        <input
          className="admin-search"
          placeholder="🔍 Search users by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL','ACTIVE','SUSPENDED','ADMIN'].map(f => (
            <button
              key={f}
              className={`admin-action-btn ${filter === f ? 'btn-unsuspend' : ''}`}
              style={filter !== f ? { background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : {}}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{filtered.length} users</span>
      </div>

      {loading ? (
        <div className="admin-loading">⏳ Loading users…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">👥</div>
          <p>No users found</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.userId}>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>#{u.userId}</td>
                <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                <td>
                  <span className={`pill ${u.role === 'ADMIN' ? 'pill-admin' : 'pill-user'}`}>
                    {u.role === 'ADMIN' ? '🛡️' : '👤'} {u.role}
                  </span>
                </td>
                <td>
                  <span className={`pill ${u.isActive ? 'pill-active' : 'pill-suspended'}`}>
                    {u.isActive ? '● Active' : '● Suspended'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{u.provider}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                </td>
                <td>
                  <div className="admin-actions">
                    {u.isActive ? (
                      <button
                        className="admin-action-btn btn-suspend"
                        disabled={busy === u.userId}
                        onClick={() => handle('suspend', u.userId, 'Suspended')}
                      >
                        {busy === u.userId ? '…' : '🚫 Suspend'}
                      </button>
                    ) : (
                      <button
                        className="admin-action-btn btn-unsuspend"
                        disabled={busy === u.userId}
                        onClick={() => handle('unsuspend', u.userId, 'Reactivated')}
                      >
                        {busy === u.userId ? '…' : '✅ Restore'}
                      </button>
                    )}
                    <button
                      className="admin-action-btn btn-delete"
                      disabled={busy === u.userId}
                      onClick={() => handle('delete', u.userId, 'Deleted')}
                    >
                      {busy === u.userId ? '…' : '🗑️ Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ─── Broadcast Tab ──────────────────────────────────────────
const BroadcastTab = () => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!message.trim()) { toast.error('Message cannot be empty'); return; }
    setSending(true);
    try {
      const res = await AdminService.broadcast({ message: message.trim(), userIds: null });
      toast.success(res.message || 'Broadcast sent!');
      setMessage('');
    } catch {
      toast.error('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="broadcast-card">
      <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>📢 Platform Broadcast</h3>
      <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        Send a notification message to all platform users.
      </p>

      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Message
      </label>
      <textarea
        className="broadcast-textarea"
        placeholder="Type your broadcast message here…"
        value={message}
        onChange={e => setMessage(e.target.value)}
        maxLength={500}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{message.length}/500</span>
        <button
          className="btn btn-primary"
          onClick={send}
          disabled={sending || !message.trim()}
          style={{ background: 'var(--admin-accent)', minWidth: '140px' }}
        >
          {sending ? '⏳ Sending…' : '📤 Send Broadcast'}
        </button>
      </div>

      <div style={{
        marginTop: '24px', padding: '14px', borderRadius: 'var(--radius-sm)',
        background: 'rgba(227,179,65,.08)', border: '1px solid rgba(227,179,65,.2)'
      }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-warn)' }}>
          ⚠️ Broadcasts are logged in the audit trail. Actual delivery to users requires integration with the notification-service.
        </p>
      </div>
    </div>
  );
};

// ─── Audit Logs Tab ─────────────────────────────────────────
const AuditLogsTab = () => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    AdminService.getAuditLogs()
      .then(setLogs)
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.actorEmail?.toLowerCase().includes(search.toLowerCase()) ||
    l.targetDescription?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-table-wrap">
      <div className="admin-table-toolbar">
        <input
          className="admin-search"
          placeholder="🔍 Filter by action, actor or target…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{filtered.length} entries</span>
      </div>

      {loading ? (
        <div className="admin-loading">⏳ Loading audit logs…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📋</div>
          <p>No audit logs yet</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="audit-log-row">
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>#{log.id}</td>
                <td>{log.actorEmail}</td>
                <td><span className="audit-action-tag">{log.action}</span></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '300px', wordBreak: 'break-all' }}>
                  {log.targetDescription}
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ─── Main Admin Page ────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: '📊 Overview' },
  { id: 'users',      label: '👥 Users' },
  { id: 'broadcast',  label: '📢 Broadcast' },
  { id: 'audit',      label: '📋 Audit Logs' },
];

export const AdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Admin Panel</h1>
          <p className="page-subtitle">
            Platform management · Logged in as <strong style={{ color: 'var(--admin-purple)' }}>{user?.email}</strong>
          </p>
        </div>
        <span className="pill pill-admin" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
          ADMINISTRATOR
        </span>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview'  && <OverviewTab />}
      {activeTab === 'users'     && <UsersTab />}
      {activeTab === 'broadcast' && <BroadcastTab />}
      {activeTab === 'audit'     && <AuditLogsTab />}
    </div>
  );
};
