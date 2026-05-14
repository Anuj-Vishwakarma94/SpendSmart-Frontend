import React, { useState, useEffect, useCallback } from 'react';
import { AnalyticsService } from '../../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import './Analytics.css';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const PIE_COLORS = ['#3fb950','#58a6ff','#bc8cff','#d29922','#f85149','#79c0ff'];
const GRADE_COLORS = { A:'#3fb950', B:'#58a6ff', C:'#d29922', D:'#f0883e', F:'#f85149' };

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const sym = CURRENCY_SYMBOLS[user?.currency] || '₹';
  const fmt = n => `${sym}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const [summary, setSummary]       = useState(null);
  const [trend, setTrend]           = useState([]);
  const [topCats, setTopCats]       = useState([]);
  const [health, setHealth]         = useState(null);
  const [forecast, setForecast]     = useState(null);
  const [savingsRates, setSavingsRates] = useState([]);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, tc, h, f, sr] = await Promise.all([
        AnalyticsService.getMonthlySummary(),
        AnalyticsService.getIncomeTrend(),
        AnalyticsService.getTopCategories(),
        AnalyticsService.getHealthScore(),
        AnalyticsService.getSpendingForecast(),
        AnalyticsService.getSavingsRateTrend(),
      ]);
      setSummary(s); setTrend(t); setTopCats(tc);
      setHealth(h); setForecast(f); setSavingsRates(sr);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="spinner" />;

  const savingsRateData = trend.map((t, i) => ({ month: t.month, rate: savingsRates[i] || 0 }));

  return (
    <div className="analytics-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Financial insights & visualizations</p>
        </div>
      </div>

      {/* ─── Monthly Summary ────────────────────────── */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Income</div>
            <div className="stat-value text-green">{fmt(summary.totalIncome)}</div>
            <div className="stat-sub">this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Expenses</div>
            <div className="stat-value text-red">{fmt(summary.totalExpenses)}</div>
            <div className="stat-sub">this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Net Savings</div>
            <div className={`stat-value ${summary.netSavings >= 0 ? 'text-green' : 'text-red'}`}>{fmt(summary.netSavings)}</div>
            <div className="stat-sub">this month</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Savings Rate</div>
            <div className="stat-value text-blue">{summary.savingsRate}%</div>
            <div className="stat-sub">of income saved</div>
          </div>
        </div>
      )}

      {/* ─── Health Score + Forecast ────────────────── */}
      <div className="analytics-row">
        {health && (
          <div className="card health-card">
            <h3 className="chart-title">Financial Health Score</h3>
            <div className="health-score-ring">
              <div className="score-number" style={{ color: GRADE_COLORS[health.grade] }}>
                {health.score}
              </div>
              <div className="score-grade" style={{ color: GRADE_COLORS[health.grade] }}>
                Grade {health.grade}
              </div>
            </div>
            <p className="health-message">{health.message}</p>
            <div className="health-breakdown">
              <div className="health-row"><span>Savings Rate</span><span className="text-green">{health.savingsRate}%</span></div>
              <div className="health-row"><span>Budget Adherence</span><span className="text-blue">{health.budgetAdherence}%</span></div>
              <div className="health-row"><span>Expense / Income</span><span className="text-amber">{health.expenseToIncomeRatio}</span></div>
            </div>
          </div>
        )}

        {forecast && (
          <div className="card forecast-card">
            <h3 className="chart-title">Spending Forecast — Next Month</h3>
            <div className="forecast-amount">{fmt(forecast.projectedAmount)}</div>
            <div className="forecast-meta">
              <span className={`badge ${forecast.trend === 'INCREASING' ? 'badge-red' : forecast.trend === 'DECREASING' ? 'badge-green' : 'badge-blue'}`}>
                {forecast.trend === 'INCREASING' ? '↑' : forecast.trend === 'DECREASING' ? '↓' : '→'} {forecast.trend}
              </span>
              <span className="text-muted" style={{ fontSize: '0.82rem', marginLeft: 8 }}>
                3-month avg: {fmt(forecast.threeMonthAvg)}
              </span>
            </div>
            {topCats.length > 0 && (
              <>
                <h3 className="chart-title" style={{ marginTop: 20 }}>Top Spending Categories</h3>
                <div className="top-cats">
                  {topCats.map((c, i) => (
                    <div key={i} className="top-cat-row">
                      <span className="cat-rank">{i + 1}</span>
                      <span className="cat-name-label">{c.name}</span>
                      <span className="cat-pct text-muted">{c.percentage}%</span>
                      <span className="cat-amt">{fmt(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Income vs Expense 12-month Bar ─────────── */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="chart-title">Income vs Expenses — Last 12 Months</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:10 }} axisLine={false} tickLine={false}
              tickFormatter={v => v.split(' ')[0]} />
            <YAxis tick={{ fill:'rgba(255,255,255,0.3)', fontSize:10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${sym}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
            <Tooltip contentStyle={{ background:'#0d0d0d', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8 }}
              formatter={v => [fmt(v)]} />
            <Legend iconType="circle" iconSize={8}
              formatter={v => <span style={{color:'#8b8ba0',fontSize:11}}>{v}</span>} />
            <Bar dataKey="income"   name="Income"   fill="#3fb950" radius={[3,3,0,0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Savings Rate Trend ──────────────────────── */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="chart-title">Savings Rate Trend — Last 12 Months</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={savingsRateData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:10 }} axisLine={false} tickLine={false}
              tickFormatter={v => v.split(' ')[0]} />
            <YAxis tick={{ fill:'rgba(255,255,255,0.3)', fontSize:10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={{ background:'#0d0d0d', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8 }}
              formatter={v => [`${v}%`, 'Savings Rate']} />
            <Line type="monotone" dataKey="rate" stroke="rgba(255,255,255,0.7)" strokeWidth={2} dot={{ r:3, fill:'rgba(255,255,255,0.7)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
