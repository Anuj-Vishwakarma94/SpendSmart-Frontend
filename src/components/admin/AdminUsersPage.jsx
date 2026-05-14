import React, { useState, useEffect, useCallback } from 'react';
import { AdminService } from '../../services/api';
import toast from 'react-hot-toast';

/* ── Confirmation Modal ──────────────────────────────────── */
const ConfirmModal = ({ open, onConfirm, onCancel, action, user }) => {
  if (!open) return null;

  const isSuspend = action === 'suspend';
  const isDelete  = action === 'delete';

  const config = {
    suspend: {
      icon: '🚫',
      title: 'Suspend User',
      color: '#fbbf24',
      borderColor: 'rgba(251,191,36,0.3)',
      btnClass: 'admin-btn admin-btn-suspend',
      body: (
        <>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Are you sure you want to suspend <strong style={{ color: '#f0f0fa' }}>{user?.fullName}</strong>?
          </p>
          <p style={{ color: 'rgba(251,191,36,0.8)', fontSize: '0.8rem', marginTop: 10, padding: '8px 12px', background: 'rgba(251,191,36,0.06)', borderRadius: 6, border: '1px solid rgba(251,191,36,0.15)' }}>
            ⚠️ The user will be unable to log in until restored.
          </p>
        </>
      ),
      confirmLabel: '🚫 Yes, Suspend',
    },
    unsuspend: {
      icon: '✅',
      title: 'Restore User',
      color: '#50c87a',
      borderColor: 'rgba(80,200,122,0.3)',
      btnClass: 'admin-btn admin-btn-restore',
      body: (
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Restore access for <strong style={{ color: '#f0f0fa' }}>{user?.fullName}</strong>? They will be able to log in again immediately.
        </p>
      ),
      confirmLabel: '✅ Yes, Restore',
    },
    delete: {
      icon: '🗑️',
      title: 'Delete User',
      color: '#f85149',
      borderColor: 'rgba(248,81,73,0.3)',
      btnClass: 'admin-btn admin-btn-delete',
      body: (
        <>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Permanently delete <strong style={{ color: '#f0f0fa' }}>{user?.fullName}</strong> (<span style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.email}</span>)?
          </p>
          <p style={{ color: 'rgba(248,81,73,0.85)', fontSize: '0.8rem', marginTop: 10, padding: '8px 12px', background: 'rgba(248,81,73,0.06)', borderRadius: 6, border: '1px solid rgba(248,81,73,0.2)' }}>
            🚨 This action is <strong>irreversible</strong>. All user data will be permanently removed.
          </p>
        </>
      ),
      confirmLabel: '🗑️ Yes, Delete Permanently',
    },
  }[action] || {};

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#0e0e18',
        border: `1px solid ${config.borderColor}`,
        borderRadius: 14,
        padding: '28px 32px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        animation: 'fadeIn 0.15s ease both',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
            border: `1px solid ${config.borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0,
          }}>
            {config.icon}
          </div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0f0fa' }}>{config.title}</h2>
        </div>

        {/* Body */}
        <div style={{ marginBottom: 24 }}>{config.body}</div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            className="admin-btn"
            onClick={onCancel}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', padding: '8px 18px' }}
          >
            Cancel
          </button>
          <button className={config.btnClass} onClick={onConfirm} style={{ padding: '8px 18px' }}>
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────── */
export const AdminUsersPage = () => {
  const [users, setUsers]       = useState([]);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('ALL');
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(null);

  // Modal state
  const [modal, setModal] = useState({ open: false, action: null, user: null });

  const load = useCallback(() => {
    setLoading(true);
    AdminService.getUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  /* Ask for confirmation — opens modal */
  const askConfirm = (action, user) => {
    setModal({ open: true, action, user });
  };

  /* Actually execute after modal confirm */
  const executeAction = async () => {
    const { action, user: targetUser } = modal;
    setModal({ open: false, action: null, user: null });
    setBusy(targetUser.userId);
    try {
      const fn = {
        suspend:   AdminService.suspendUser,
        unsuspend: AdminService.unsuspendUser,
        delete:    AdminService.deleteUser,
      }[action];
      const res = await fn(targetUser.userId);
      toast.success(res.message || 'Done');
      load();
    } catch (e) {
      toast.error(e?.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchFilter =
      filter === 'ALL'       ? true :
      filter === 'ACTIVE'    ? u.isActive :
      filter === 'SUSPENDED' ? !u.isActive :
      u.role === 'ADMIN';
    return matchSearch && matchFilter;
  });

  return (
    <div className="fade-in">
      {/* Confirmation modal */}
      <ConfirmModal
        open={modal.open}
        action={modal.action}
        user={modal.user}
        onConfirm={executeAction}
        onCancel={() => setModal({ open: false, action: null, user: null })}
      />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">👥 User Management</h1>
          <p className="admin-page-subtitle">Manage all platform accounts · Admins are protected</p>
        </div>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <input
            className="admin-search-input"
            placeholder="🔍 Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="filter-chips">
            {['ALL', 'ACTIVE', 'SUSPENDED', 'ADMIN'].map(f => (
              <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono,monospace)' }}>
            {filtered.length} users
          </span>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="spinner" /><p style={{ marginTop: 10 }}>Loading users…</p></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">👥</div><p>No users found</p></div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Role</th>
                <th>Status</th><th>Provider</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const isAdmin = u.role === 'ADMIN';
                return (
                  <tr key={u.userId}>
                    <td style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', fontFamily: 'var(--font-mono,monospace)' }}>#{u.userId}</td>
                    <td style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{u.fullName}</td>
                    <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.83rem' }}>{u.email}</td>
                    <td>
                      <span className={`apill ${isAdmin ? 'apill-admin' : 'apill-user'}`}>
                        {isAdmin ? '🛡️ ' : '👤 '}{u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`apill ${u.isActive ? 'apill-active' : 'apill-suspended'}`}>
                        {u.isActive ? '● Active' : '● Suspended'}
                      </span>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>{u.provider}</td>
                    <td style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', fontFamily: 'var(--font-mono,monospace)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {isAdmin ? (
                        /* Admin accounts are protected — no actions shown */
                        <span style={{
                          fontSize: '0.7rem', color: 'rgba(160,120,255,0.5)',
                          fontFamily: 'var(--font-mono,monospace)', padding: '4px 10px',
                          background: 'rgba(160,120,255,0.06)', borderRadius: 4,
                          border: '1px solid rgba(160,120,255,0.15)', whiteSpace: 'nowrap',
                        }}>
                          🛡️ Protected
                        </span>
                      ) : (
                        <div className="admin-actions-row">
                          {u.isActive ? (
                            <button
                              className="admin-btn admin-btn-suspend"
                              disabled={busy === u.userId}
                              onClick={() => askConfirm('suspend', u)}
                            >
                              {busy === u.userId ? '…' : '🚫 Suspend'}
                            </button>
                          ) : (
                            <button
                              className="admin-btn admin-btn-restore"
                              disabled={busy === u.userId}
                              onClick={() => askConfirm('unsuspend', u)}
                            >
                              {busy === u.userId ? '…' : '✅ Restore'}
                            </button>
                          )}
                          <button
                            className="admin-btn admin-btn-delete"
                            disabled={busy === u.userId}
                            onClick={() => askConfirm('delete', u)}
                          >
                            {busy === u.userId ? '…' : '🗑️ Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
