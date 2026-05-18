import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IncomeService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Income.css';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

const SOURCES = ['SALARY', 'FREELANCE', 'BUSINESS', 'INVESTMENT', 'GIFT', 'OTHER'];
const SOURCE_LABELS = {
  SALARY: '💼 Salary', FREELANCE: '🧑‍💻 Freelance', BUSINESS: '🏢 Business',
  INVESTMENT: '📈 Investment', GIFT: '🎁 Gift', OTHER: '📦 Other',
};
const SOURCE_COLORS = {
  SALARY: 'badge-green', FREELANCE: 'badge-blue', BUSINESS: 'badge-purple',
  INVESTMENT: 'badge-amber', GIFT: 'badge-pink', OTHER: 'badge-muted',
};

const RECURRENCE_PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

// ─── Income List ──────────────────────────────────────────
export const IncomeListPage = () => {
  const { user } = useAuth();
  const symbol = CURRENCY_SYMBOLS[user?.currency] || '₹';
  const fmt = n => `${symbol}${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const now = new Date();

  const [incomes, setIncomes]       = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [monthTotal, setMonthTotal] = useState(0);
  const [allTotal, setAllTotal]     = useState(0);
  const [breakdown, setBreakdown]   = useState([]);
  const [deleting, setDeleting]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, mt, at, bd] = await Promise.all([
        IncomeService.getAll(),
        IncomeService.getTotalByMonth(now.getMonth() + 1, now.getFullYear()),
        IncomeService.getTotal(),
        IncomeService.getBreakdownBySource(),
      ]);
      setIncomes(all);
      setFiltered(all);
      setMonthTotal(mt.total || 0);
      setAllTotal(at.total || 0);
      setBreakdown(bd);
    } catch (err) { 
      if (err?.error === 'PREMIUM_REQUIRED') {
        toast.error('Premium required');
      } else {
        toast.error('Failed to load incomes'); 
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let f = incomes;
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(i => i.title.toLowerCase().includes(q) || (i.notes || '').toLowerCase().includes(q));
    }
    if (sourceFilter) f = f.filter(i => i.source === sourceFilter);
    if (recurringOnly) f = f.filter(i => i.isRecurring);
    setFiltered(f);
  }, [incomes, search, sourceFilter, recurringOnly]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income entry?')) return;
    setDeleting(id);
    try {
      await IncomeService.delete(id);
      toast.success('Income deleted');
      setIncomes(prev => prev.filter(i => i.incomeId !== id));
    } catch (_) { toast.error('Delete failed'); }
    setDeleting(null);
  };

  const totalFiltered = filtered.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="income-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Income</h1>
          <p className="page-subtitle">{filtered.length} entries · {fmt(totalFiltered)}</p>
        </div>
        <Link to="/incomes/add" className="btn btn-primary">+ Add Income</Link>
      </div>

      {/* ─── Summary Cards ───────────────────────────── */}
      {!loading && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">This Month</div>
            <div className="stat-value text-green">{fmt(monthTotal)}</div>
            <div className="stat-sub">{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">All Time</div>
            <div className="stat-value text-green">{fmt(allTotal)}</div>
            <div className="stat-sub">{incomes.length} total entries</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Recurring Streams</div>
            <div className="stat-value">{incomes.filter(i => i.isRecurring).length}</div>
            <div className="stat-sub">active recurring rules</div>
          </div>
          {breakdown[0] && (
            <div className="stat-card">
              <div className="stat-label">Top Source</div>
              <div className="stat-value">{SOURCE_LABELS[breakdown[0].source]}</div>
              <div className="stat-sub">{breakdown[0].percentage}% of income</div>
            </div>
          )}
        </div>
      )}

      {/* ─── Source Breakdown ─────────────────────────── */}
      {!loading && breakdown.length > 0 && (
        <div className="card breakdown-card">
          <h3 className="chart-title" style={{ marginBottom: 14 }}>Income by Source</h3>
          <div className="breakdown-bars">
            {breakdown.map(b => (
              <div key={b.source} className="breakdown-row">
                <div className="breakdown-label">
                  <span>{SOURCE_LABELS[b.source]}</span>
                  <span className="text-muted">{fmt(b.totalAmount)} ({b.percentage}%)</span>
                </div>
                <div className="breakdown-bar-track">
                  <div
                    className="breakdown-bar-fill"
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Filters ──────────────────────────────────── */}
      <div className="filter-bar card" style={{ marginTop: 20 }}>
        <input
          className="form-control" placeholder="🔍 Search title or notes…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="form-control" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="">All sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </select>
        <label className="recurring-toggle">
          <input type="checkbox" checked={recurringOnly} onChange={e => setRecurringOnly(e.target.checked)} />
          <span>Recurring only</span>
        </label>
        {(search || sourceFilter || recurringOnly) && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(''); setSourceFilter(''); setRecurringOnly(false); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ─── Table ────────────────────────────────────── */}
      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 16 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>💰</div>
          <h3>No income entries found</h3>
          <p>{incomes.length === 0 ? 'Start by adding your first income entry.' : 'Try adjusting your filters.'}</p>
          {incomes.length === 0 && (
            <Link to="/incomes/add" className="btn btn-primary" style={{ marginTop: 16 }}>Add Income</Link>
          )}
        </div>
      ) : (
        <div className="table-wrapper" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Source</th>
                <th>Date</th>
                <th>Recurring</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.incomeId} className="slide-in">
                  <td>
                    <div className="income-title">{i.title}</div>
                    {i.notes && <div className="income-notes">{i.notes}</div>}
                  </td>
                  <td><strong className="text-green">{fmt(i.amount)}</strong></td>
                  <td>
                    <span className={`badge ${SOURCE_COLORS[i.source] || 'badge-blue'}`}>
                      {SOURCE_LABELS[i.source] || i.source}
                    </span>
                  </td>
                  <td className="text-muted">{i.date}</td>
                  <td>
                    {i.isRecurring
                      ? <span className="badge badge-amber">🔄 {i.recurrencePeriod}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <div className="action-row">
                      <Link to={`/incomes/edit/${i.incomeId}`} className="btn btn-ghost btn-sm">Edit</Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(i.incomeId)}
                        disabled={deleting === i.incomeId}
                      >
                        {deleting === i.incomeId ? '…' : 'Delete'}
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

// ─── Add / Edit Income Form ───────────────────────────────
const DEFAULT_FORM = {
  title: '', amount: '', categoryId: '',
  date: new Date().toISOString().split('T')[0],
  source: 'SALARY', notes: '',
  isRecurring: false, recurrencePeriod: 'MONTHLY', currency: 'INR',
};

export const IncomeFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm]       = useState({ ...DEFAULT_FORM, currency: user?.currency || 'INR' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    IncomeService.getById(id)
      .then(i => setForm({
        title: i.title, amount: i.amount, categoryId: i.categoryId || '',
        date: i.date, source: i.source, notes: i.notes || '',
        isRecurring: i.isRecurring,
        recurrencePeriod: i.recurrencePeriod || 'MONTHLY',
        currency: i.currency,
      }))
      .catch(() => { toast.error('Failed to load income'); navigate('/incomes'); })
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
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        categoryId: form.categoryId || null,
        recurrencePeriod: form.isRecurring ? form.recurrencePeriod : null,
      };
      if (isEdit) {
        await IncomeService.update(id, payload);
        toast.success('Income updated!');
      } else {
        await IncomeService.add(payload);
        toast.success('Income added!');
      }
      navigate('/incomes');
    } catch (err) {
      toast.error(err?.message || 'Save failed');
    }
    setSaving(false);
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="income-form-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Income' : 'Add Income'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update the details below' : 'Record a new income entry'}</p>
        </div>
        <Link to="/incomes" className="btn btn-secondary">← Back</Link>
      </div>

      <div className="card income-form-card">
        <form onSubmit={handleSubmit} className="income-form">

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Title *</label>
              <input name="title" required className="form-control"
                placeholder="e.g. Monthly Salary"
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
              <label className="form-label">Source *</label>
              <select name="source" className="form-control" value={form.source} onChange={handleChange}>
                {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Date *</label>
              <input name="date" type="date" required className="form-control"
                value={form.date} onChange={handleChange} />
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

          {/* ─── Recurring Section ─── */}
          <div className="recurring-section">
            <label className="recurring-toggle">
              <input name="isRecurring" type="checkbox"
                checked={form.isRecurring} onChange={handleChange} />
              <span>Mark as recurring income</span>
            </label>

            {form.isRecurring && (
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Recurrence Frequency *</label>
                <div className="period-pills">
                  {RECURRENCE_PERIODS.map(p => (
                    <button
                      key={p} type="button"
                      className={`period-pill ${form.recurrencePeriod === p ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, recurrencePeriod: p }))}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <Link to="/incomes" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update Income' : 'Add Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
