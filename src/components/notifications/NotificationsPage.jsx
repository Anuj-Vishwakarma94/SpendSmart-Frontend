import React, { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../../services/api';
import toast from 'react-hot-toast';
import './Notifications.css';

const SEV_CONFIG = {
  INFO:     { icon: 'ℹ️', badge: 'badge-blue',  label: 'Info' },
  WARNING:  { icon: '⚠️', badge: 'badge-amber', label: 'Warning' },
  CRITICAL: { icon: '🚨', badge: 'badge-red',   label: 'Critical' },
};

const TYPE_LABELS = {
  BUDGET_ALERT:    '🎯 Budget Alert',
  BUDGET_EXCEEDED: '🚫 Budget Exceeded',
  RECURRING_DUE:   '🔄 Recurring Due',
  MONTHLY_SUMMARY: '📊 Monthly Summary',
  SYSTEM:          '🔧 System',
};

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('ALL');  // ALL | UNREAD | WARNING | CRITICAL
  const [processing, setProcessing]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await NotificationService.getAll();
      setNotifications(data);
    } catch (_) { toast.error('Failed to load notifications'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD')   return !n.isRead;
    if (filter === 'WARNING')  return n.severity === 'WARNING';
    if (filter === 'CRITICAL') return n.severity === 'CRITICAL';
    return true;
  });

  const unreadCount   = notifications.filter(n => !n.isRead).length;
  const warningCount  = notifications.filter(n => n.severity === 'WARNING').length;
  const criticalCount = notifications.filter(n => n.severity === 'CRITICAL').length;

  const handleRead = async (id) => {
    setProcessing(id);
    try {
      const updated = await NotificationService.markRead(id);
      setNotifications(prev => prev.map(n => n.notificationId === id ? updated : n));
    } catch (_) { toast.error('Failed'); }
    setProcessing(null);
  };

  const handleAcknowledge = async (id) => {
    setProcessing(id);
    try {
      const updated = await NotificationService.acknowledge(id);
      setNotifications(prev => prev.map(n => n.notificationId === id ? updated : n));
      toast.success('Acknowledged');
    } catch (_) { toast.error('Failed'); }
    setProcessing(null);
  };

  const handleDelete = async (id) => {
    setProcessing(id);
    try {
      await NotificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.notificationId !== id));
    } catch (_) { toast.error('Failed'); }
    setProcessing(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (_) { toast.error('Failed'); }
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="notifications-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount} unread · {notifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            ✓ Mark all read
          </button>
        )}
      </div>

      {/* ─── Summary Chips ──────────────────────────── */}
      <div className="notif-summary">
        <div className="notif-chip"><span className="chip-num text-blue">{unreadCount}</span><span className="chip-label">Unread</span></div>
        <div className="notif-chip"><span className="chip-num text-amber">{warningCount}</span><span className="chip-label">Warnings</span></div>
        <div className="notif-chip"><span className="chip-num text-red">{criticalCount}</span><span className="chip-label">Critical</span></div>
        <div className="notif-chip"><span className="chip-num">{notifications.length}</span><span className="chip-label">Total</span></div>
      </div>

      {/* ─── Filter Tabs ────────────────────────────── */}
      <div className="notif-filter-tabs">
        {['ALL','UNREAD','WARNING','CRITICAL'].map(f => (
          <button key={f} className={`notif-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'ALL' ? `All (${notifications.length})`
             : f === 'UNREAD' ? `Unread (${unreadCount})`
             : f === 'WARNING' ? `Warning (${warningCount})`
             : `Critical (${criticalCount})`}
          </button>
        ))}
      </div>

      {/* ─── Notification List ──────────────────────── */}
      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state card">
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔔</div>
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className="notif-list">
          {filtered.map(n => {
            const sev = SEV_CONFIG[n.severity] || SEV_CONFIG.INFO;
            const isBusy = processing === n.notificationId;
            return (
              <div key={n.notificationId}
                className={`notif-card fade-in ${!n.isRead ? 'unread' : ''} ${n.severity === 'CRITICAL' ? 'critical-border' : n.severity === 'WARNING' ? 'warning-border' : ''}`}>
                <div className="notif-left">
                  <span className="notif-sev-icon">{sev.icon}</span>
                </div>
                <div className="notif-body">
                  <div className="notif-top-row">
                    <span className="notif-title">{n.title}</span>
                    <div className="notif-badges">
                      <span className={`badge ${sev.badge}`}>{sev.label}</span>
                      {n.type && <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{TYPE_LABELS[n.type] || n.type}</span>}
                      {n.isAcknowledged && <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ Ack</span>}
                    </div>
                  </div>
                  <p className="notif-message">{n.message}</p>
                  <div className="notif-footer">
                    <span className="notif-time text-muted">{timeAgo(n.createdAt)}</span>
                    <div className="notif-actions">
                      {!n.isRead && (
                        <button className="btn btn-ghost btn-sm" disabled={isBusy}
                          onClick={() => handleRead(n.notificationId)}>
                          Mark read
                        </button>
                      )}
                      {!n.isAcknowledged && n.severity !== 'INFO' && (
                        <button className="btn btn-secondary btn-sm" disabled={isBusy}
                          onClick={() => handleAcknowledge(n.notificationId)}>
                          Acknowledge
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" disabled={isBusy}
                        onClick={() => handleDelete(n.notificationId)}>
                        {isBusy ? '…' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
