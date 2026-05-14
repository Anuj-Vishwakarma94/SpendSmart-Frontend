import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ExpenseService } from '../../services/api';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './Dashboard.css';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const PIE_COLORS = ['#ffffff', '#888888', '#555555', '#4ade80', '#fbbf24', '#f87171'];

const PAYMENT_LABELS = {
  CASH: 'Cash', CARD: 'Card', UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer', WALLET: 'Wallet'
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const symbol = CURRENCY_SYMBOLS[user?.currency] || '₹';
  const now = new Date();

  const [expenses, setExpenses] = useState([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [allTotal, setAllTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [all, monthlyTotal] = await Promise.all([
        ExpenseService.getAll(),
        ExpenseService.getTotalByMonth(now.getMonth() + 1, now.getFullYear()),
      ]);
      setExpenses(all);
      setMonthTotal(monthlyTotal.total || 0);
      const totRes = await ExpenseService.getTotal();
      setAllTotal(totRes.total || 0);
    } catch (_) { }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Derived chart data ───────────────────────────────
  const categoryMap = {};
  expenses.forEach(e => {
    const key = e.categoryId ? `Cat ${e.categoryId}` : 'Uncategorised';
    categoryMap[key] = (categoryMap[key] || 0) + e.amount;
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Last 6 months bar chart
  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const m = d.getMonth() + 1; const y = d.getFullYear();
    const total = expenses.filter(e => {
      const ed = new Date(e.date);
      return ed.getMonth() + 1 === m && ed.getFullYear() === y;
    }).reduce((s, e) => s + e.amount, 0);
    return { name: d.toLocaleString('default', { month: 'short' }), amount: total };
  });

  const recent = [...expenses].slice(0, 5);

  const fmt = (n) => `${symbol}${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) return <div className="spinner" />;

  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/expenses/add" className="btn btn-primary">
          + Add Expense
        </Link>
      </div>

      {/* ─── Stat Cards ─────────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value text-red">{fmt(monthTotal)}</div>
          <div className="stat-sub">{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">All Time</div>
          <div className="stat-value">{fmt(allTotal)}</div>
          <div className="stat-sub">{expenses.length} transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Budget</div>
          <div className="stat-value text-amber">{user?.monthlyBudget ? fmt(user.monthlyBudget) : '—'}</div>
          <div className="stat-sub">
            {user?.monthlyBudget
              ? `${Math.min(100, Math.round((monthTotal / user.monthlyBudget) * 100))}% used`
              : 'Not set'}
          </div>
        </div>


      </div>

      {/* ─── Charts Row ──────────────────────────────── */}
      <div className="charts-grid">
        <div className="card">
          <h3 className="chart-title">Monthly Spend (6 mo)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#8b8ba0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b8ba0', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${symbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
                labelStyle={{ color: '#f1f1f5' }}
                formatter={v => [fmt(v), 'Amount']}
              />
              <Bar dataKey="amount" fill="rgba(255,255,255,0.85)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="chart-title">By Category</h3>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}
                  formatter={v => [fmt(v), 'Amount']}
                />
                <Legend iconType="circle" iconSize={8}
                  formatter={v => <span style={{ color: '#8b8ba0', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Recent Expenses ──────────────────────────── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header-row">
          <h3 className="chart-title">Recent Expenses</h3>
          <Link to="/expenses" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <p>No expenses yet. <Link to="/expenses/add">Add your first one</Link></p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(e => (
                  <tr key={e.expenseId}>
                    <td>{e.title}</td>
                    <td><span className="text-red">{fmt(e.amount)}</span></td>
                    <td><span className="badge badge-blue">{PAYMENT_LABELS[e.paymentMethod] || e.paymentMethod}</span></td>
                    <td className="text-muted">{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};
