import React, { useState, useEffect, useCallback } from 'react';
import { BudgetService, CategoryService } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './Budget.css';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const STATUS_COLORS = { SAFE: 'var(--accent-green)', WARNING: 'var(--accent-amber)', EXCEEDED: 'var(--accent-red)' };
const STATUS_BADGES = { SAFE: 'badge-green', WARNING: 'badge-amber', EXCEEDED: 'badge-red' };

export const BudgetPage = () => {
  const { user } = useAuth();
  const sym = CURRENCY_SYMBOLS[user?.currency] || '₹';
  const fmt = n => `${sym}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const [progress, setProgress] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [alerts, setAlerts]     = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prog, alts] = await Promise.all([
        BudgetService.getAllProgress(),
        BudgetService.getAlerts(),
      ]);
      setProgress(prog);
      setAlerts(alts);
    } catch (_) { toast.error('Failed to load budgets'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await BudgetService.delete(id);
      toast.success('Budget deleted');
      load();
    } catch (_) { toast.error('Delete failed'); }
  };

  const safe   = progress.filter(p => p.status === 'SAFE').length;
  const warn   = progress.filter(p => p.status === 'WARNING').length;
  const exceed = progress.filter(p => p.status === 'EXCEEDED').length;

  return (
    <div className="budget-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">{progress.length} active · {warn + exceed} need attention</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Budget</button>
      </div>

      {alerts.length > 0 && (
        <div className="alerts-banner">
          {alerts.map((a, i) => (
            <div key={i} className="alert-row">
              <span>⚠️ {a}</span>
            </div>
          ))}
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Total Budgets</div><div className="stat-value">{progress.length}</div></div>
        <div className="stat-card"><div className="stat-label">On Track</div><div className="stat-value text-green">{safe}</div></div>
        <div className="stat-card"><div className="stat-label">Warning</div><div className="stat-value text-amber">{warn}</div></div>
        <div className="stat-card"><div className="stat-label">Exceeded</div><div className="stat-value text-red">{exceed}</div></div>
      </div>

      {loading ? <div className="spinner" /> : progress.length === 0 ? (
        <div className="empty-state card">
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</div>
          <h3>No budgets yet</h3>
          <p>Create a budget to track your spending limits.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>Create Budget</button>
        </div>
      ) : (
        <div className="budget-grid">
          {progress.map(p => (
            <div key={p.budgetId} className="budget-card fade-in">
              <div className="budget-card-header">
                <div className="budget-name">{p.name}</div>
                <span className={`badge ${STATUS_BADGES[p.status]}`}>{p.status}</span>
              </div>
              <div className="budget-amounts">
                <span className="spent-amount" style={{ color: STATUS_COLORS[p.status] }}>{fmt(p.spentAmount)}</span>
                <span className="limit-amount text-muted"> / {fmt(p.limitAmount)}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill"
                  style={{
                    width: `${Math.min(100, p.percentageUsed)}%`,
                    background: STATUS_COLORS[p.status],
                  }}
                />
              </div>
              <div className="budget-footer">
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                  {p.percentageUsed}% used · {fmt(p.remainingAmount)} remaining
                </span>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.budgetId)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <BudgetFormModal onSaved={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}
    </div>
  );
};

const BudgetFormModal = ({ onSaved, onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', limitAmount: '', period: 'MONTHLY', alertThreshold: 80, currency: user?.currency || 'INR', categoryId: '' });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    CategoryService.getAll().then(res => setCategories(res)).catch(() => {});
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, limitAmount: parseFloat(form.limitAmount), categoryId: form.categoryId || null };
      await BudgetService.create(payload);
      toast.success('Budget created!');
      onSaved();
    } catch (err) { toast.error(err?.message || 'Failed'); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Budget</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Budget Name *</label>
            <input required className="form-control" placeholder="e.g. Monthly Food Budget"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
              <option value="">Uncategorised</option>
              {categories.map(c => (
                <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Limit Amount *</label>
            <input required type="number" min="0" step="100" className="form-control" placeholder="e.g. 10000"
              value={form.limitAmount} onChange={e => setForm(p => ({ ...p, limitAmount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Period</label>
            <select className="form-control" value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))}>
              <option value="MONTHLY">Monthly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Alert Threshold: {form.alertThreshold}%</label>
            <input type="range" min="50" max="100" step="5" className="range-input"
              value={form.alertThreshold} onChange={e => setForm(p => ({ ...p, alertThreshold: parseInt(e.target.value) }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Budget'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
