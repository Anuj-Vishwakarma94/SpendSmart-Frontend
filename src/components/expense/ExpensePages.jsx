import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExpenseService, CategoryService, RecurringService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Expense.css';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET'];
const PAYMENT_LABELS  = { CASH: 'Cash', CARD: 'Card', UPI: 'UPI', BANK_TRANSFER: 'Bank Transfer', WALLET: 'Wallet' };
const FREQUENCIES     = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
const FREQ_LABELS     = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', YEARLY: 'Yearly' };

// ─── Expense List ─────────────────────────────────────────
export const ExpenseListPage = () => {
  const { user } = useAuth();
  const symbol = CURRENCY_SYMBOLS[user?.currency] || '₹';
  const fmt = n => `${symbol}${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const [expenses, setExpenses]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [deleting, setDeleting]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ExpenseService.getAll();
      setExpenses(data);
      setFiltered(data);
    } catch (_) { toast.error('Failed to load expenses'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let f = expenses;
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(e => e.title.toLowerCase().includes(q) || (e.notes || '').toLowerCase().includes(q));
    }
    if (payFilter) f = f.filter(e => e.paymentMethod === payFilter);
    setFiltered(f);
  }, [expenses, search, payFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    setDeleting(id);
    try {
      await ExpenseService.delete(id);
      toast.success('Expense deleted');
      setExpenses(prev => prev.filter(e => e.expenseId !== id));
    } catch (_) { toast.error('Delete failed'); }
    setDeleting(null);
  };

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="expense-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">{filtered.length} transactions · {fmt(totalFiltered)}</p>
        </div>
        <Link to="/expenses/add" className="btn btn-primary">+ Add Expense</Link>
      </div>

      {/* ─── Filters ─────────────────────────────────── */}
      <div className="filter-bar card">
        <input
          className="form-control" placeholder="🔍 Search title or notes…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="form-control" value={payFilter} onChange={e => setPayFilter(e.target.value)}>
          <option value="">All payment methods</option>
          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>)}
        </select>
        {(search || payFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setPayFilter(''); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ─── Table ───────────────────────────────────── */}
      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state card">
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>💸</div>
          <h3>No expenses found</h3>
          <p>{expenses.length === 0 ? 'Start by adding your first expense.' : 'Try adjusting your filters.'}</p>
          {expenses.length === 0 && (
            <Link to="/expenses/add" className="btn btn-primary" style={{ marginTop: 16 }}>Add Expense</Link>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Recurring</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.expenseId} className="slide-in">
                  <td>
                    <div className="expense-title">{e.title}</div>
                    {e.notes && <div className="expense-notes">{e.notes}</div>}
                  </td>
                  <td><strong className="text-red">{fmt(e.amount)}</strong></td>
                  <td><span className="badge badge-blue">{PAYMENT_LABELS[e.paymentMethod] || e.paymentMethod}</span></td>
                  <td className="text-muted">{e.date}</td>
                  <td>{e.isRecurring ? <span className="badge badge-amber">🔄 Yes</span> : <span className="text-muted">—</span>}</td>
                  <td>
                    <div className="action-row">
                      <button
                        className="btn btn-sm"
                        style={{
                          background: e.receiptUrl ? 'rgba(63,185,80,0.15)' : 'rgba(255,255,255,0.05)',
                          color: e.receiptUrl ? 'var(--green)' : 'var(--text-secondary)',
                          border: `1px solid ${e.receiptUrl ? 'rgba(63,185,80,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          cursor: e.receiptUrl ? 'pointer' : 'not-allowed',
                          opacity: e.receiptUrl ? 1 : 0.45,
                        }}
                        disabled={!e.receiptUrl}
                        onClick={() => e.receiptUrl && window.open(e.receiptUrl, '_blank', 'noopener,noreferrer')}
                        title={e.receiptUrl ? 'View receipt' : 'No receipt attached'}
                      >
                        🧾 Receipt
                      </button>
                      <Link to={`/expenses/edit/${e.expenseId}`} className="btn btn-ghost btn-sm">Edit</Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(e.expenseId)}
                        disabled={deleting === e.expenseId}
                      >
                        {deleting === e.expenseId ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Add / Edit Expense Form ──────────────────────────────
const DEFAULT_FORM = {
  title: '', amount: '', categoryId: '', date: new Date().toISOString().split('T')[0],
  paymentMethod: 'CASH', notes: '', receiptUrl: '', isRecurring: false, currency: 'INR', type: 'EXPENSE',
  frequency: 'MONTHLY', endDate: '',
};

export const ExpenseFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm]     = useState({ ...DEFAULT_FORM, currency: user?.currency || 'INR' });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    // Always fetch categories
    CategoryService.getAll().then(res => setCategories(res)).catch(() => {});

    if (!isEdit) return;
    setLoading(true);
    ExpenseService.getById(id)
      .then(e => setForm({
        title: e.title, amount: e.amount, categoryId: e.categoryId || '',
        date: e.date, paymentMethod: e.paymentMethod, notes: e.notes || '',
        receiptUrl: e.receiptUrl || '', isRecurring: e.isRecurring,
        currency: e.currency, type: e.type,
        frequency: 'MONTHLY', endDate: '',
      }))
      .catch(() => { toast.error('Failed to load expense'); navigate('/expenses'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), categoryId: form.categoryId || null };
      if (isEdit) {
        await ExpenseService.update(id, payload);
        toast.success('Expense updated!');
      } else {
        const saved = await ExpenseService.add(payload);
        // If marked as recurring, also create a recurring rule
        if (form.isRecurring) {
          try {
            await RecurringService.add({
              title: form.title,
              amount: parseFloat(form.amount),
              type: 'EXPENSE',
              frequency: form.frequency,
              startDate: form.date,
              endDate: form.endDate || null,
              paymentMethod: form.paymentMethod,
              currency: form.currency,
              description: form.notes || '',
              categoryId: form.categoryId || null,
            });
            toast.success('Expense added & recurring rule created!');
          } catch (_) {
            toast.success('Expense added!');
            toast.error('Could not create recurring rule (Premium required)');
          }
        } else {
          toast.success('Expense added!');
        }
      }
      navigate('/expenses');
    } catch (err) {
      toast.error(err?.message || 'Save failed');
    }
    setSaving(false);
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="expense-form-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Expense' : 'Add Expense'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update the details below' : 'Record a new transaction'}</p>
        </div>
        <Link to="/expenses" className="btn btn-secondary">← Back</Link>
      </div>

      <div className="card expense-form-card">
        <form onSubmit={handleSubmit} className="expense-form">

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Title *</label>
              <input name="title" required className="form-control" placeholder="e.g. Lunch at café"
                value={form.title} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Amount *</label>
              <input name="amount" type="number" step="0.01" min="0.01" required
                className="form-control" placeholder="0.00"
                value={form.amount} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Date *</label>
              <input name="date" type="date" required className="form-control"
                value={form.date} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <select name="categoryId" className="form-control" value={form.categoryId} onChange={handleChange}>
                <option value="">Uncategorised</option>
                {categories.map(c => (
                  <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Payment Method</label>
              <select name="paymentMethod" className="form-control" value={form.paymentMethod} onChange={handleChange}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Currency</label>
              <select name="currency" className="form-control" value={form.currency} onChange={handleChange}>
                {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea name="notes" rows={3} className="form-control" placeholder="Optional notes…"
              value={form.notes} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Receipt URL</label>
            <input name="receiptUrl" type="url" className="form-control" placeholder="https://…"
              value={form.receiptUrl} onChange={handleChange} />
          </div>

          <label className="recurring-toggle">
            <input name="isRecurring" type="checkbox" checked={form.isRecurring} onChange={handleChange} />
            <span>Make this a recurring transaction</span>
          </label>

          {/* ─── Recurring Options (shown when checkbox ticked) ─── */}
          {form.isRecurring && (
            <div className="recurring-options-box">
              <div className="form-group">
                <label className="form-label">Frequency *</label>
                <div className="period-pills">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f} type="button"
                      className={`period-pill ${form.frequency === f ? 'active' : ''}`}
                      onClick={() => setForm(p => ({ ...p, frequency: f }))}
                    >
                      {FREQ_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ maxWidth: 240 }}>
                <label className="form-label">End Date <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  name="endDate" type="date" className="form-control"
                  value={form.endDate} onChange={handleChange}
                  min={form.date}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                ℹ️ A recurring rule will be created automatically — it will log this expense every <strong>{FREQ_LABELS[form.frequency].toLowerCase()}</strong> starting from the selected date.
              </p>
            </div>
          )}

          <div className="form-actions">
            <Link to="/expenses" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
