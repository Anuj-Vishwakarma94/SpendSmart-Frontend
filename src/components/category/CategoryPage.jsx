import React, { useState, useEffect, useCallback } from 'react';
import { CategoryService } from '../../services/api';
import toast from 'react-hot-toast';
import './Category.css';

// ─── Constants ───────────────────────────────────────────
const PRESET_ICONS = [
  '🍔','🚗','🛍️','⚡','💊','🎬','📚','✈️','🛒','🏠','📱','📦',
  '💼','🧑‍💻','🏢','📈','🎁','💰','🏋️','🎮','🐾','🌱','☕','🎵',
];

const PRESET_COLORS = [
  '#3fb950','#58a6ff','#bc8cff','#d29922','#f85149','#ff7b72',
  '#79c0ff','#56d364','#e3b341','#f0883e','#a5d6ff','#8b949e',
];

const TYPE_TABS = ['ALL', 'EXPENSE', 'INCOME'];

// ─── Category Page ────────────────────────────────────────
export const CategoryPage = () => {
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('ALL');
  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null);   // Category being edited
  const [budgetTarget, setBudgetTarget] = useState(null); // Category for budget modal
  const [deleting, setDeleting]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch (_) { toast.error('Failed to load categories'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = categories.filter(c => {
    if (activeTab === 'ALL') return true;
    return c.type === activeTab;
  });

  const expenseCount = categories.filter(c => c.type === 'EXPENSE').length;
  const incomeCount  = categories.filter(c => c.type === 'INCOME').length;
  const customCount  = categories.filter(c => !c.isDefault).length;

  const handleDelete = async (cat) => {
    if (cat.isDefault) { toast.error('System categories cannot be deleted'); return; }
    if (!window.confirm(`Delete category "${cat.name}"? Linked transactions will be uncategorised.`)) return;
    setDeleting(cat.categoryId);
    try {
      await CategoryService.delete(cat.categoryId);
      toast.success('Category deleted');
      setCategories(prev => prev.filter(c => c.categoryId !== cat.categoryId));
    } catch (err) { toast.error(err?.message || 'Delete failed'); }
    setDeleting(null);
  };

  const handleSaved = (saved, isEdit) => {
    if (isEdit) {
      setCategories(prev => prev.map(c => c.categoryId === saved.categoryId ? saved : c));
    } else {
      setCategories(prev => [...prev, saved]);
    }
    setShowForm(false);
    setEditTarget(null);
  };

  const handleBudgetSaved = (updated) => {
    setCategories(prev => prev.map(c => c.categoryId === updated.categoryId ? updated : c));
    setBudgetTarget(null);
    toast.success('Budget limit saved');
  };

  return (
    <div className="category-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{categories.length} total · {customCount} custom</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          + New Category
        </button>
      </div>

      {/* ─── Stat Cards ────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{categories.length}</div>
          <div className="stat-sub">categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expense</div>
          <div className="stat-value text-red">{expenseCount}</div>
          <div className="stat-sub">expense categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Income</div>
          <div className="stat-value text-green">{incomeCount}</div>
          <div className="stat-sub">income categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Custom</div>
          <div className="stat-value text-blue">{customCount}</div>
          <div className="stat-sub">created by you</div>
        </div>
      </div>

      {/* ─── Type Tabs ─────────────────────────────── */}
      <div className="type-tabs">
        {TYPE_TABS.map(t => (
          <button
            key={t}
            className={`type-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t === 'ALL' ? `All (${categories.length})`
             : t === 'EXPENSE' ? `Expense (${expenseCount})`
             : `Income (${incomeCount})`}
          </button>
        ))}
      </div>

      {/* ─── Category Grid ─────────────────────────── */}
      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state card">
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗂️</div>
          <h3>No categories found</h3>
          <p>Create a custom category to organise your transactions.</p>
        </div>
      ) : (
        <div className="category-grid">
          {filtered.map(cat => (
            <div key={cat.categoryId} className="category-card fade-in">
              <div className="cat-top">
                <div className="cat-icon-wrap" style={{ background: `${cat.colorCode}22`, borderColor: `${cat.colorCode}44` }}>
                  <span className="cat-icon">{cat.icon}</span>
                </div>
                <div className="cat-info">
                  <div className="cat-name">{cat.name}</div>
                  <div className="cat-meta">
                    <span className={`badge ${cat.type === 'EXPENSE' ? 'badge-red' : 'badge-green'}`}>
                      {cat.type}
                    </span>
                    {cat.isDefault && <span className="badge badge-muted">Default</span>}
                  </div>
                </div>
              </div>

              {/* Budget limit indicator */}
              {cat.budgetLimit && (
                <div className="cat-budget">
                  <span className="cat-budget-label">Budget limit</span>
                  <span className="cat-budget-value" style={{ color: cat.colorCode }}>
                    ₹{Number(cat.budgetLimit).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="cat-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setBudgetTarget(cat)}
                  title="Set budget limit"
                >
                  💰 Budget
                </button>
                {!cat.isDefault && (
                  <>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setEditTarget(cat); setShowForm(true); }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(cat)}
                      disabled={deleting === cat.categoryId}
                    >
                      {deleting === cat.categoryId ? '…' : '🗑️'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Create / Edit Modal ───────────────────── */}
      {showForm && (
        <CategoryFormModal
          existing={editTarget}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}

      {/* ─── Budget Limit Modal ────────────────────── */}
      {budgetTarget && (
        <BudgetLimitModal
          category={budgetTarget}
          onSaved={handleBudgetSaved}
          onClose={() => setBudgetTarget(null)}
        />
      )}
    </div>
  );
};

// ─── Category Form Modal ──────────────────────────────────
const CategoryFormModal = ({ existing, onSaved, onClose }) => {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    name:      existing?.name      || '',
    type:      existing?.type      || 'EXPENSE',
    icon:      existing?.icon      || '📦',
    colorCode: existing?.colorCode || '#3fb950',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      let saved;
      if (isEdit) {
        saved = await CategoryService.update(existing.categoryId, {
          name: form.name, icon: form.icon, colorCode: form.colorCode,
        });
        toast.success('Category updated');
      } else {
        saved = await CategoryService.create(form);
        toast.success('Category created');
      }
      onSaved(saved, isEdit);
    } catch (err) { toast.error(err?.message || 'Save failed'); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Category' : 'New Category'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">

          {/* Preview */}
          <div className="cat-preview">
            <div className="cat-icon-wrap large"
              style={{ background: `${form.colorCode}22`, borderColor: `${form.colorCode}44` }}>
              <span className="cat-icon">{form.icon}</span>
            </div>
            <div>
              <div className="cat-name">{form.name || 'Category Name'}</div>
              <span className={`badge ${form.type === 'EXPENSE' ? 'badge-red' : 'badge-green'}`}>
                {form.type}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Name *</label>
            <input required className="form-control" placeholder="e.g. Gym & Fitness"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>

          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Type *</label>
              <div className="type-toggle">
                {['EXPENSE', 'INCOME'].map(t => (
                  <button key={t} type="button"
                    className={`type-toggle-btn ${form.type === t ? 'active-' + t.toLowerCase() : ''}`}
                    onClick={() => setForm(p => ({ ...p, type: t }))}>
                    {t === 'EXPENSE' ? '💸 Expense' : '💰 Income'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Icon picker */}
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="icon-grid">
              {PRESET_ICONS.map(ic => (
                <button key={ic} type="button"
                  className={`icon-btn ${form.icon === ic ? 'active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, icon: ic }))}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Colour picker */}
          <div className="form-group">
            <label className="form-label">Colour</label>
            <div className="color-grid">
              {PRESET_COLORS.map(col => (
                <button key={col} type="button"
                  className={`color-btn ${form.colorCode === col ? 'active' : ''}`}
                  style={{ background: col }}
                  onClick={() => setForm(p => ({ ...p, colorCode: col }))}>
                  {form.colorCode === col && <span>✓</span>}
                </button>
              ))}
              <input type="color" className="color-custom" value={form.colorCode}
                onChange={e => setForm(p => ({ ...p, colorCode: e.target.value }))}
                title="Custom colour" />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Budget Limit Modal ───────────────────────────────────
const BudgetLimitModal = ({ category, onSaved, onClose }) => {
  const [limit, setLimit] = useState(category.budgetLimit || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await CategoryService.setBudget(
        category.categoryId,
        limit ? parseFloat(limit) : null
      );
      onSaved(updated);
    } catch (err) { toast.error(err?.message || 'Failed to set budget'); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            Budget Limit — {category.icon} {category.name}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-form">
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 16 }}>
            Set a monthly spending cap for this category. Leave blank to remove the limit.
          </p>

          <div className="form-group">
            <label className="form-label">Monthly Limit (₹)</label>
            <input type="number" min="0" step="100" className="form-control"
              placeholder="e.g. 5000"
              value={limit} onChange={e => setLimit(e.target.value)} />
          </div>

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            {category.budgetLimit && (
              <button className="btn btn-danger" onClick={async () => {
                setSaving(true);
                try {
                  const updated = await CategoryService.setBudget(category.categoryId, null);
                  onSaved(updated);
                } catch (_) { toast.error('Failed to remove limit'); }
                setSaving(false);
              }} disabled={saving}>Remove Limit</button>
            )}
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Limit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
