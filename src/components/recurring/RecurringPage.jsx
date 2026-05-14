import React, { useState, useEffect, useCallback } from 'react';
import { RecurringService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Recurring.css';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const FREQ_LABELS = { DAILY:'Daily', WEEKLY:'Weekly', MONTHLY:'Monthly', QUARTERLY:'Quarterly', YEARLY:'Yearly' };
const FREQ_COLORS = { DAILY:'badge-red', WEEKLY:'badge-blue', MONTHLY:'badge-green', QUARTERLY:'badge-purple', YEARLY:'badge-amber' };
const TYPE_LABELS = { EXPENSE:'💸 Expense', INCOME:'💰 Income' };
const PM_LABELS   = { CASH:'Cash', CARD:'Card', UPI:'UPI', BANK_TRANSFER:'Bank Transfer', WALLET:'Wallet' };

export const RecurringPage = () => {
  const { user } = useAuth();
  const sym = CURRENCY_SYMBOLS[user?.currency] || '₹';
  const fmt = n => `${sym}${Number(n||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const [rules, setRules]       = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [activeFilter, setActiveFilter] = useState('ACTIVE');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, up] = await Promise.all([
        RecurringService.getAll(),
        RecurringService.getUpcoming(),
      ]);
      setRules(all);
      setUpcoming(up);
    } catch (_) { toast.error('Failed to load recurring rules'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rules.filter(r => {
    const typeOk   = typeFilter === 'ALL' || r.type === typeFilter;
    const activeOk = activeFilter === 'ALL' || (activeFilter === 'ACTIVE' ? r.isActive : !r.isActive);
    return typeOk && activeOk;
  });

  const handleDeactivate = async (id) => {
    try {
      await RecurringService.deactivate(id);
      toast.success('Rule deactivated');
      load();
    } catch (_) { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this recurring rule?')) return;
    try {
      await RecurringService.delete(id);
      toast.success('Rule deleted');
      load();
    } catch (_) { toast.error('Failed'); }
  };

  const handleProcess = async (id) => {
    try {
      await RecurringService.process(id);
      toast.success('Transaction processed successfully');
      load();
    } catch (err) { toast.error(err?.message || 'Failed to process'); }
  };

  const activeCount   = rules.filter(r => r.isActive).length;
  const expenseCount  = rules.filter(r => r.type === 'EXPENSE').length;
  const incomeCount   = rules.filter(r => r.type === 'INCOME').length;
  const dueSoonCount  = upcoming.filter(r => (r.daysUntilDue ?? 99) <= 3).length;

  return (
    <div className="recurring-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recurring Transactions</h1>
          <p className="page-subtitle">{activeCount} active rules · {upcoming.length} due this month</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Rule</button>
      </div>

      {/* ─── Due Soon Banner ────────────────────────── */}
      {dueSoonCount > 0 && (
        <div className="due-banner">
          🔔 {dueSoonCount} transaction{dueSoonCount > 1 ? 's' : ''} due within 3 days
        </div>
      )}

      {/* ─── Stats ──────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Active Rules</div><div className="stat-value text-green">{activeCount}</div></div>
        <div className="stat-card"><div className="stat-label">Expenses</div><div className="stat-value text-red">{expenseCount}</div></div>
        <div className="stat-card"><div className="stat-label">Income</div><div className="stat-value text-blue">{incomeCount}</div></div>
        <div className="stat-card"><div className="stat-label">Due This Month</div><div className="stat-value text-amber">{upcoming.length}</div></div>
      </div>

      {/* ─── Upcoming This Month ────────────────────── */}
      {upcoming.length > 0 && (
        <div className="card upcoming-card">
          <h3 className="section-heading">📅 Due This Month</h3>
          <div className="upcoming-list">
            {upcoming.map(r => (
              <div key={r.recurringId} className="upcoming-row">
                <span className={`badge ${r.type === 'EXPENSE' ? 'badge-red' : 'badge-green'}`}>
                  {r.type === 'EXPENSE' ? '💸' : '💰'}
                </span>
                <span className="upcoming-title">{r.title}</span>
                <span className="upcoming-amount">{fmt(r.amount)}</span>
                <span className="upcoming-date">{r.nextDueDate}</span>
                <span className={`days-badge ${(r.daysUntilDue ?? 99) <= 3 ? 'urgent' : ''}`}>
                  {r.daysUntilDue === 0 ? 'Today' : r.daysUntilDue === 1 ? 'Tomorrow' : `${r.daysUntilDue}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Filters ────────────────────────────────── */}
      <div className="filter-bar card" style={{ marginTop: 20 }}>
        <div className="filter-group">
          {['ALL','EXPENSE','INCOME'].map(t => (
            <button key={t} className={`filter-pill ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(t)}>{t}</button>
          ))}
        </div>
        <div className="filter-group">
          {['ALL','ACTIVE','INACTIVE'].map(a => (
            <button key={a} className={`filter-pill ${activeFilter === a ? 'active' : ''}`}
              onClick={() => setActiveFilter(a)}>{a}</button>
          ))}
        </div>
      </div>

      {/* ─── Rules Table ────────────────────────────── */}
      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 16 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔄</div>
          <h3>No recurring rules</h3>
          <p>Set up recurring rules to auto-track regular transactions.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
            Create Rule
          </button>
        </div>
      ) : (
        <div className="table-wrapper" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Frequency</th>
                <th>Next Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.recurringId} className={`slide-in ${!r.isActive ? 'inactive-row' : ''}`}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.title}</div>
                    {r.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.description}</div>}
                  </td>
                  <td>
                    <strong className={r.type === 'EXPENSE' ? 'text-red' : 'text-green'}>{fmt(r.amount)}</strong>
                  </td>
                  <td><span className={`badge ${r.type === 'EXPENSE' ? 'badge-red' : 'badge-green'}`}>{TYPE_LABELS[r.type]}</span></td>
                  <td><span className={`badge ${FREQ_COLORS[r.frequency] || 'badge-blue'}`}>{FREQ_LABELS[r.frequency]}</span></td>
                  <td>
                    <div className="text-muted" style={{ fontSize: '0.82rem' }}>{r.nextDueDate || '—'}</div>
                    {r.daysUntilDue !== null && r.isActive && (
                      <div className={`days-text ${r.daysUntilDue <= 3 ? 'text-red' : 'text-muted'}`} style={{ fontSize: '0.72rem' }}>
                        {r.daysUntilDue === 0 ? '🔴 Due today' : r.daysUntilDue < 0 ? '🔴 Overdue' : `${r.daysUntilDue}d left`}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${r.isActive ? 'badge-green' : 'badge-muted'}`}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-row">
                      {r.isActive && r.daysUntilDue !== null && r.daysUntilDue <= 0 && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleProcess(r.recurringId)}>
                          Process Now
                        </button>
                      )}
                      {r.isActive && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDeactivate(r.recurringId)}>
                          Pause
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.recurringId)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <RecurringFormModal
          onSaved={() => { setShowForm(false); load(); }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

// ─── Add Recurring Form Modal ─────────────────────────────
const FREQUENCIES = ['DAILY','WEEKLY','MONTHLY','QUARTERLY','YEARLY'];
const PAYMENT_METHODS = ['CASH','CARD','UPI','BANK_TRANSFER','WALLET'];

const RecurringFormModal = ({ onSaved, onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '', amount: '', type: 'EXPENSE', frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '', paymentMethod: 'CASH',
    description: '', currency: user?.currency || 'INR',
  });
  const [saving, setSaving] = useState(false);

  const handle = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await RecurringService.add({
        ...form,
        amount: parseFloat(form.amount),
        endDate: form.endDate || null,
      });
      toast.success('Recurring rule created!');
      onSaved();
    } catch (err) { toast.error(err?.message || 'Save failed'); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Recurring Rule</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Title *</label>
              <input name="title" required className="form-control" placeholder="e.g. Netflix Subscription"
                value={form.title} onChange={handle} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Amount *</label>
              <input name="amount" type="number" min="0.01" step="0.01" required
                className="form-control" placeholder="0.00"
                value={form.amount} onChange={handle} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Type *</label>
            <div className="type-toggle">
              {['EXPENSE','INCOME'].map(t => (
                <button key={t} type="button"
                  className={`type-toggle-btn ${form.type === t ? (t === 'EXPENSE' ? 'active-expense' : 'active-income') : ''}`}
                  onClick={() => setForm(p => ({ ...p, type: t }))}>
                  {t === 'EXPENSE' ? '💸 Expense' : '💰 Income'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Frequency *</label>
            <div className="period-pills">
              {FREQUENCIES.map(f => (
                <button key={f} type="button"
                  className={`period-pill ${form.frequency === f ? 'active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, frequency: f }))}>
                  {FREQ_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Start Date *</label>
              <input name="startDate" type="date" required className="form-control"
                value={form.startDate} onChange={handle} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">End Date (optional)</label>
              <input name="endDate" type="date" className="form-control"
                value={form.endDate} onChange={handle} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Payment Method</label>
              <select name="paymentMethod" className="form-control" value={form.paymentMethod} onChange={handle}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PM_LABELS[m]}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Currency</label>
              <select name="currency" className="form-control" value={form.currency} onChange={handle}>
                {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input name="description" className="form-control" placeholder="Optional description"
              value={form.description} onChange={handle} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
