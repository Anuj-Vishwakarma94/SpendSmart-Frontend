import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// ─── Layouts ─────────────────────────────────────────────
import { UserLayout }  from './components/layout/UserLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// ─── Auth pages ───────────────────────────────────────────
import { LoginPage, RegisterPage } from './components/auth/AuthPages';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';

// ─── User pages ───────────────────────────────────────────
import { DashboardPage }                      from './components/dashboard/DashboardPage';
import { ExpenseListPage, ExpenseFormPage }   from './components/expense/ExpensePages';
import { IncomeListPage, IncomeFormPage }     from './components/income/IncomePages';
import { CategoryPage }                       from './components/category/CategoryPage';
import { BudgetPage }                         from './components/budget/BudgetPage';
import { AnalyticsPage }                      from './components/analytics/AnalyticsPage';
import { RecurringPage }                      from './components/recurring/RecurringPage';
import { NotificationsPage }                  from './components/notifications/NotificationsPage';
import { ProfilePage }                        from './components/profile/ProfilePage';
import { SubscriptionPage }                   from './components/subscription/SubscriptionPage';

// ─── Admin pages ──────────────────────────────────────────
import { AdminDashboardPage }    from './components/admin/AdminDashboardPage';
import { AdminUsersPage }        from './components/admin/AdminUsersPage';
import { AdminTransactionsPage } from './components/admin/AdminTransactionsPage';
import { AdminBroadcastPage }    from './components/admin/AdminBroadcastPage';
import { AdminReportsPage }      from './components/admin/AdminReportsPage';
import { AuditLogsPage }         from './components/admin/AuditLogsPage';

import LandingPage from './components/landing/LandingPage';
import './styles/global.css';

// ─── Route Guards ─────────────────────────────────────────

/** Smart root: show landing if not logged in, redirect if logged in */
const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <LandingPage />;
  return user?.role === 'ADMIN'
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/dashboard" replace />;
};

/** Public-only: redirect logged-in users to their home */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return children;
  return user?.role === 'ADMIN'
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/dashboard" replace />;
};

/** USER only — admins are hard-blocked, sent to admin dashboard */
const UserRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return children;
};

/** ADMIN only — regular users are blocked, sent to user dashboard */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
};

/** Shells = guard + layout */
const UserShell  = ({ children }) => <UserRoute><UserLayout>{children}</UserLayout></UserRoute>;
const AdminShell = ({ children }) => <AdminRoute><AdminLayout>{children}</AdminLayout></AdminRoute>;

// ─── App ──────────────────────────────────────────────────
const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* ── Aurora animated background — GPU-optimised ── */}
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blur">
          <div className="aurora-inner" />
        </div>
      </div>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#0c0c0c', color: '#f0f0f0', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Inter',sans-serif", fontSize: '0.875rem', boxShadow: '0 8px 32px rgba(0,0,0,0.9)' },
        success: { iconTheme: { primary: 'rgba(255,255,255,0.85)', secondary: '#0c0c0c' } },
        error:   { iconTheme: { primary: '#f87171', secondary: '#0c0c0c' } },
      }} />

      <Routes>
        {/* Root Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Public */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

        {/* ── USER routes ──────────────────────────────── */}
        <Route path="/dashboard"          element={<UserShell><DashboardPage /></UserShell>} />
        <Route path="/expenses"           element={<UserShell><ExpenseListPage /></UserShell>} />
        <Route path="/expenses/add"       element={<UserShell><ExpenseFormPage /></UserShell>} />
        <Route path="/expenses/edit/:id"  element={<UserShell><ExpenseFormPage /></UserShell>} />
        <Route path="/incomes"            element={<UserShell><IncomeListPage /></UserShell>} />
        <Route path="/incomes/add"        element={<UserShell><IncomeFormPage /></UserShell>} />
        <Route path="/incomes/edit/:id"   element={<UserShell><IncomeFormPage /></UserShell>} />
        <Route path="/categories"         element={<UserShell><CategoryPage /></UserShell>} />
        <Route path="/budgets"            element={<UserShell><BudgetPage /></UserShell>} />
        <Route path="/analytics"          element={<UserShell><AnalyticsPage /></UserShell>} />
        <Route path="/recurring"          element={<UserShell><RecurringPage /></UserShell>} />
        <Route path="/notifications"      element={<UserShell><NotificationsPage /></UserShell>} />
        <Route path="/subscription"       element={<UserShell><SubscriptionPage /></UserShell>} />
        <Route path="/profile"            element={<UserShell><ProfilePage /></UserShell>} />

        {/* ── ADMIN routes ─────────────────────────────── */}
        <Route path="/admin/dashboard"     element={<AdminShell><AdminDashboardPage /></AdminShell>} />
        <Route path="/admin/users"         element={<AdminShell><AdminUsersPage /></AdminShell>} />
        <Route path="/admin/transactions"  element={<AdminShell><AdminTransactionsPage /></AdminShell>} />
        <Route path="/admin/notifications" element={<AdminShell><AdminBroadcastPage /></AdminShell>} />
        <Route path="/admin/reports"       element={<AdminShell><AdminReportsPage /></AdminShell>} />
        <Route path="/admin/audit-logs"    element={<AdminShell><AuditLogsPage /></AdminShell>} />

        {/* Fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
