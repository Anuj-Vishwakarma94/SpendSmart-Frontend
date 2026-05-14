import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/api';
import toast from 'react-hot-toast';

export const AuditLogsPage = () => {
  const [logs, setLogs]       = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminService.getAuditLogs()
      .then(setLogs)
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return l.action?.toLowerCase().includes(q) ||
           l.actorEmail?.toLowerCase().includes(q) ||
           l.targetDescription?.toLowerCase().includes(q);
  });

  return (
    <div className="fade-in">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">📋 Audit Logs</h1>
          <p className="admin-page-subtitle">All admin actions with full traceability</p>
        </div>
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono,monospace)' }}>{filtered.length} entries</span>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-toolbar">
          <input
            className="admin-search-input"
            placeholder="🔍 Filter by action, actor or target…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="admin-loading">⏳ Loading audit logs…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📋</div>
            <p>No audit logs yet</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr><th>#</th><th>Actor</th><th>Action</th><th>Target / Details</th><th>Timestamp</th></tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', fontFamily: 'var(--font-mono,monospace)' }}>#{log.id}</td>
                  <td style={{ fontWeight: 600, color: '#a078ff', fontSize: '0.85rem' }}>{log.actorEmail}</td>
                  <td><span className="audit-action-tag">{log.action}</span></td>
                  <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', maxWidth: 320, wordBreak: 'break-all' }}>{log.targetDescription}</td>
                  <td style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono,monospace)' }}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
