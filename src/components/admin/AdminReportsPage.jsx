import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const PIE_COLORS = ['#50c87a', '#f85149', '#a078ff', '#58a6ff'];

export const AdminReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminService.getPlatformStats()
      .then(setStats)
      .catch(() => toast.error('Failed to load report data'))
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats ? [
    { name: 'Active Users',    value: stats.activeUsers },
    { name: 'Suspended Users', value: stats.suspendedUsers },
    { name: 'Admins',          value: stats.adminUsers },
  ].filter(d => d.value > 0) : [];

  const barData = stats ? [
    { name: 'Total Users',   value: stats.totalUsers },
    { name: 'Active',        value: stats.activeUsers },
    { name: 'Suspended',     value: stats.suspendedUsers },
    { name: 'Admins',        value: stats.adminUsers },
    { name: 'Regular Users', value: stats.regularUsers },
  ] : [];

  const activeRate = stats?.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0;
  const suspendRate = stats?.totalUsers > 0 ? ((stats.suspendedUsers / stats.totalUsers) * 100).toFixed(1) : 0;

  return (
    <div className="fade-in">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">📈 Platform Reports</h1>
          <p className="admin-page-subtitle">Platform-level analytics and statistics</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">⏳ Generating reports…</div>
      ) : (
        <>
          {/* Summary metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Registered Users', value: stats?.totalUsers, color: '#a078ff' },
              { label: 'Active Rate',             value: `${activeRate}%`,  color: '#50c87a' },
              { label: 'Suspension Rate',         value: `${suspendRate}%`, color: '#f85149' },
              { label: 'Admin Accounts',          value: stats?.adminUsers, color: '#58a6ff' },
            ].map(({ label, value, color }) => (
              <div key={label} className="admin-card" style={{ borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>{value ?? '—'}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div className="admin-card">
              <div className="admin-card-title">User Breakdown (Bar)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0d0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: '0.8rem' }} labelStyle={{ color: '#f0f0fa' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="value" name="Count" fill="rgba(160,120,255,0.75)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="admin-card">
              <div className="admin-card-title">User Status (Pie)</div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: '0.8rem' }} />
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="admin-empty" style={{ padding: '40px 0' }}><p>No data</p></div>
              )}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-title">Health Metrics</div>
            {[
              { label: 'Active Users',    value: activeRate,   color: '#50c87a' },
              { label: 'Suspended Users', value: suspendRate,  color: '#f85149' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>{value}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
