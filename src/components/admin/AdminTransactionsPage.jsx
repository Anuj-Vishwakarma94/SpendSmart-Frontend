import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  ACTIVE:    { bg: 'rgba(80,200,122,0.12)',  color: '#50c87a' },
  EXPIRED:   { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24' },
  CANCELLED: { bg: 'rgba(248,81,73,0.12)',   color: '#f85149' },
  PENDING:   { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' },
  FREE:      { bg: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' },
};

export const AdminTransactionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [userMap, setUserMap]             = useState({});
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('ALL');
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    Promise.all([
      AdminService.getAllSubscriptions(),
      AdminService.getUsers(),
    ])
      .then(([subs, users]) => {
        const map = {};
        users.forEach(u => {
          map[u.userId] = u.fullName ? `${u.fullName}` : u.email;
        });
        setUserMap(map);
        // Only show rows that had an actual subscription event (not pure FREE)
        setSubscriptions(subs.filter(s => s.status !== 'FREE'));
      })
      .catch(() => toast.error('Failed to load subscription transactions'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = subscriptions.filter(s => {
    const q = search.toLowerCase();
    const userName = (userMap[s.userId] || '').toLowerCase();
    const matchesSearch = userName.includes(q) || String(s.userId).includes(q) || s.status?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filtered
    .filter(s => s.status === 'ACTIVE' || s.status === 'EXPIRED' || s.status === 'CANCELLED')
    .reduce((sum, s) => sum + (s.amountPaid || 0), 0);

  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="fade-in">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">💳 Subscription Transactions</h1>
          <p className="admin-page-subtitle">Premium plan purchases across all users</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="admin-card" style={{ padding: '12px 20px', minWidth: 140, textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'var(--font-mono,monospace)' }}>Active Plans</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#50c87a' }}>{activeCount}</div>
          </div>
          <div className="admin-card" style={{ padding: '12px 20px', minWidth: 160, textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'var(--font-mono,monospace)' }}>Total Revenue</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <input
            className="admin-search-input"
            placeholder="🔍 Search by user or status…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PENDING">Pending</option>
          </select>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono,monospace)' }}>{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="admin-loading">⏳ Loading subscription data…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">💳</div><p>No subscription transactions found</p></div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Amount Paid</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const sc = STATUS_COLORS[s.status] || STATUS_COLORS.FREE;
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{userMap[s.userId] || `User #${s.userId}`}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono,monospace)' }}>ID: {s.userId}</div>
                    </td>
                    <td><span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>{s.planType?.replace('_', ' ') || '—'}</span></td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30`, fontFamily: 'var(--font-mono,monospace)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: s.amountPaid > 0 ? '#50c87a' : 'rgba(255,255,255,0.25)' }}>
                      {s.amountPaid > 0 ? `₹${Number(s.amountPaid).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', fontFamily: 'var(--font-mono,monospace)' }}>{s.startDate || '—'}</td>
                    <td style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', fontFamily: 'var(--font-mono,monospace)' }}>{s.endDate || '—'}</td>
                    <td style={{ color: s.daysRemaining > 0 ? '#50c87a' : 'rgba(255,255,255,0.25)', fontWeight: s.daysRemaining > 0 ? 600 : 400 }}>
                      {s.daysRemaining > 0 ? `${s.daysRemaining}d` : '—'}
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
