import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/api';
import toast from 'react-hot-toast';

export const AdminBroadcastPage = () => {
  const [title, setTitle]       = useState('');
  const [message, setMessage]   = useState('');
  const [severity, setSeverity] = useState('INFO');
  const [sending, setSending]   = useState(false);
  const [logs, setLogs]         = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    AdminService.getAuditLogs()
      .then(all => setLogs(all.filter(l => l.action === 'BROADCAST_NOTIFICATION' || l.action === 'BROADCAST_INITIATED')))
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, []);

  const send = async () => {
    if (!message.trim()) { toast.error('Message cannot be empty'); return; }
    setSending(true);
    try {
      // Step 1: Log to audit trail
      await AdminService.broadcast({
        message: `ALL_USERS | msg=[${severity}] ${title ? title + ': ' : ''}${message.trim()}`,
        userIds: null
      });

      // Step 2: Fetch all user IDs
      const users = await AdminService.getUsers();
      const recipientIds = users.map(u => u.userId).filter(Boolean);

      // Step 3: Deliver notification to every user via notification-service
      await AdminService.broadcastToUsers({
        recipientIds,
        title: title.trim() || `Platform Broadcast`,
        message: message.trim(),
        type: 'SYSTEM',
        severity,
      });

      toast.success(`Broadcast sent to ${recipientIds.length} user(s)!`);
      setTitle(''); setMessage('');
    } catch { toast.error('Failed to send broadcast'); }
    finally { setSending(false); }
  };

  return (
    <div className="fade-in">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">📢 Broadcast Notifications</h1>
          <p className="admin-page-subtitle">Send platform-wide messages to all users</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <div className="admin-card">
          <div className="admin-card-title">New Broadcast</div>

          <div className="admin-form-group">
            <label className="admin-form-label">Severity</label>
            <select className="severity-select" value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="INFO">ℹ️ INFO</option>
              <option value="WARNING">⚠️ WARNING</option>
              <option value="CRITICAL">🚨 CRITICAL</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Title (optional)</label>
            <input className="broadcast-input" placeholder="Brief title…" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Message <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea className="broadcast-textarea" placeholder="Enter your broadcast message…" value={message} onChange={e => setMessage(e.target.value)} maxLength={500} />
            <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>{message.length}/500</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, padding: '12px 14px', background: 'rgba(251,191,36,0.06)', borderRadius: 8, border: '1px solid rgba(251,191,36,0.15)', marginBottom: 16 }}>
            <span>⚠️</span>
            <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>Broadcasts are logged in the audit trail and delivered to all active users via the notification-service.</span>
          </div>

          <button className="admin-btn admin-btn-primary" onClick={send} disabled={sending || !message.trim()} style={{ width: '100%' }}>
            {sending ? '⏳ Sending…' : '📤 Send Broadcast'}
          </button>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Recent Broadcasts</div>
          {logsLoading ? (
            <div className="admin-loading" style={{ padding: '20px' }}>Loading…</div>
          ) : logs.length === 0 ? (
            <div className="admin-empty" style={{ padding: '30px' }}><div className="admin-empty-icon">📭</div><p>No broadcasts yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logs.slice(0, 10).map(log => {
                // Parse stored format: "ALL_USERS | msg=[SEVERITY] Title: Message body"
                const raw = log.targetDescription || '';
                const msgMatch = raw.match(/msg=\[\w+\]\s*(.*)/);
                const msgPart  = msgMatch ? msgMatch[1] : raw;
                const colonIdx = msgPart.indexOf(': ');
                const title    = colonIdx !== -1 ? msgPart.slice(0, colonIdx).trim() : '';
                const body     = colonIdx !== -1 ? msgPart.slice(colonIdx + 2).trim() : msgPart.trim();
                return (
                  <div key={log.id} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {title && (
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.01em' }}>
                        {title}
                      </div>
                    )}
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, wordBreak: 'break-word' }}>
                      {body || '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
