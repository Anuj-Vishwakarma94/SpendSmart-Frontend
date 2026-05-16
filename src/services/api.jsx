import axios from 'axios';

// ─── Base URL (uses VITE_API_URL on Render, localhost for local dev) ─────────
const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api`;

// ─── Base instances ───────────────────────────────────────
const authApi = axios.create({ baseURL: BASE_URL });
const expenseApi = axios.create({ baseURL: BASE_URL });

// ─── Token interceptor helper ─────────────────────────────
const addAuthHeader = (config) => {
  const token = localStorage.getItem('ss_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

authApi.interceptors.request.use(addAuthHeader);
expenseApi.interceptors.request.use(addAuthHeader);

// ─── Response error interceptor ───────────────────────────
const handleError = (error) => {
  // Only force-logout on 401 if the user had an active session.
  // During login/google-auth itself there's no token yet, so we
  // should NOT redirect — just let the error propagate to the caller.
  if (error.response?.status === 401 && localStorage.getItem('ss_token')) {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    window.location.href = '/login';
  }
  return Promise.reject(error.response?.data || error);
};

authApi.interceptors.response.use(r => r, handleError);
expenseApi.interceptors.response.use(r => r, handleError);

const incomeApi = axios.create({ baseURL: BASE_URL });
incomeApi.interceptors.request.use(addAuthHeader);
incomeApi.interceptors.response.use(r => r, handleError);

// ─── Auth Service ─────────────────────────────────────────
export const AuthService = {
  register: (data) => authApi.post('/auth/register', data).then(r => r.data),
  login: (data) => authApi.post('/auth/login', data).then(r => r.data),
  googleLogin: (idToken) => authApi.post('/auth/google', { idToken }).then(r => r.data),
  logout: () => authApi.post('/auth/logout').then(r => r.data),
  getProfile: () => authApi.get('/auth/profile').then(r => r.data),
  updateProfile: (data) => authApi.put('/auth/profile', data).then(r => r.data),
  changePassword: (data) => authApi.put('/auth/password', data).then(r => r.data),
  updateCurrency: (currency) => authApi.put('/auth/currency', { currency }).then(r => r.data),
  updateBudget: (monthlyBudget) => authApi.put('/auth/budget', { monthlyBudget }).then(r => r.data),
  deactivate: () => authApi.delete('/auth/deactivate').then(r => r.data),
  validateToken: () => authApi.get('/auth/validate').then(r => r.data),
  forgotPassword: (email) => authApi.post('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token, newPassword) => authApi.post('/auth/reset-password', { token, newPassword }).then(r => r.data),
};

// ─── Expense Service ──────────────────────────────────────
export const ExpenseService = {
  add: (data) => expenseApi.post('/expenses', data).then(r => r.data),
  getAll: () => expenseApi.get('/expenses').then(r => r.data),
  getById: (id) => expenseApi.get(`/expenses/${id}`).then(r => r.data),
  getByCategory: (categoryId) => expenseApi.get(`/expenses/category/${categoryId}`).then(r => r.data),
  getByDateRange: (start, end) => expenseApi.get('/expenses/date-range', { params: { start, end } }).then(r => r.data),
  getByMonth: (month, year) => expenseApi.get('/expenses/month', { params: { month, year } }).then(r => r.data),
  getByType: (type) => expenseApi.get(`/expenses/type/${type}`).then(r => r.data),
  search: (keyword) => expenseApi.get('/expenses/search', { params: { keyword } }).then(r => r.data),
  getByAmountRange: (min, max) => expenseApi.get('/expenses/amount-range', { params: { min, max } }).then(r => r.data),
  update: (id, data) => expenseApi.put(`/expenses/${id}`, data).then(r => r.data),
  delete: (id) => expenseApi.delete(`/expenses/${id}`).then(r => r.data),
  getTotal: () => expenseApi.get('/expenses/total').then(r => r.data),
  getTotalByCategory: (categoryId) => expenseApi.get(`/expenses/total/category/${categoryId}`).then(r => r.data),
  getTotalByMonth: (month, year) => expenseApi.get('/expenses/total/month', { params: { month, year } }).then(r => r.data),
};

// ─── Income Service ───────────────────────────────────────
export const IncomeService = {
  add: (data) => incomeApi.post('/incomes', data).then(r => r.data),
  getAll: () => incomeApi.get('/incomes').then(r => r.data),
  getById: (id) => incomeApi.get(`/incomes/${id}`).then(r => r.data),
  getBySource: (source) => incomeApi.get(`/incomes/source/${source}`).then(r => r.data),
  getByDateRange: (start, end) => incomeApi.get('/incomes/date-range', { params: { start, end } }).then(r => r.data),
  getByMonth: (month, year) => incomeApi.get('/incomes/month', { params: { month, year } }).then(r => r.data),
  getByCategory: (categoryId) => incomeApi.get(`/incomes/category/${categoryId}`).then(r => r.data),
  search: (keyword) => incomeApi.get('/incomes/search', { params: { keyword } }).then(r => r.data),
  getRecurring: () => incomeApi.get('/incomes/recurring').then(r => r.data),
  update: (id, data) => incomeApi.put(`/incomes/${id}`, data).then(r => r.data),
  delete: (id) => incomeApi.delete(`/incomes/${id}`).then(r => r.data),
  getTotal: () => incomeApi.get('/incomes/total').then(r => r.data),
  getTotalByMonth: (month, year) => incomeApi.get('/incomes/total/month', { params: { month, year } }).then(r => r.data),
  getTotalBySource: (source) => incomeApi.get(`/incomes/total/source/${source}`).then(r => r.data),
  getBreakdownBySource: () => incomeApi.get('/incomes/breakdown/source').then(r => r.data),
};

// ─── Category Service ─────────────────────────────────────
const categoryApi = axios.create({ baseURL: BASE_URL });
categoryApi.interceptors.request.use(addAuthHeader);
categoryApi.interceptors.response.use(r => r, handleError);

export const CategoryService = {
  create: (data) => categoryApi.post('/categories', data).then(r => r.data),
  getAll: () => categoryApi.get('/categories').then(r => r.data),
  getById: (id) => categoryApi.get(`/categories/${id}`).then(r => r.data),
  getByType: (type) => categoryApi.get(`/categories/type/${type}`).then(r => r.data),
  getCustom: () => categoryApi.get('/categories/custom').then(r => r.data),
  getDefaults: () => categoryApi.get('/categories/defaults').then(r => r.data),
  getDefaultsByType: (type) => categoryApi.get(`/categories/defaults/${type}`).then(r => r.data),
  update: (id, data) => categoryApi.put(`/categories/${id}`, data).then(r => r.data),
  delete: (id) => categoryApi.delete(`/categories/${id}`).then(r => r.data),
  setBudget: (id, budgetLimit) => categoryApi.put(`/categories/${id}/budget`, { budgetLimit }).then(r => r.data),
  getCount: () => categoryApi.get('/categories/count').then(r => r.data),
};

// ─── Budget Service (port 8085) ───────────────────────────
const budgetApi = axios.create({ baseURL: BASE_URL });
budgetApi.interceptors.request.use(addAuthHeader);
budgetApi.interceptors.response.use(r => r, handleError);

export const BudgetService = {
  create: (d) => budgetApi.post('/budgets', d).then(r => r.data),
  getAll: () => budgetApi.get('/budgets').then(r => r.data),
  getById: (id) => budgetApi.get(`/budgets/${id}`).then(r => r.data),
  getActive: () => budgetApi.get('/budgets/active').then(r => r.data),
  update: (id, d) => budgetApi.put(`/budgets/${id}`, d).then(r => r.data),
  delete: (id) => budgetApi.delete(`/budgets/${id}`).then(r => r.data),
  updateSpent: (id, delta) => budgetApi.put(`/budgets/${id}/spent`, { delta }).then(r => r.data),
  getProgress: (id) => budgetApi.get(`/budgets/${id}/progress`).then(r => r.data),
  getAllProgress: () => budgetApi.get('/budgets/progress').then(r => r.data),
  getAlerts: () => budgetApi.get('/budgets/alerts').then(r => r.data),
  resetPeriod: (period) => budgetApi.post(`/budgets/reset?period=${period}`).then(r => r.data),
  getByCategory: (categoryId) => budgetApi.get(`/budgets/category/${categoryId}`).then(r => r.data),
};

// ─── Analytics Service (port 8086) ───────────────────────
const analyticsApi = axios.create({ baseURL: BASE_URL });
analyticsApi.interceptors.request.use(addAuthHeader);
analyticsApi.interceptors.response.use(r => r, handleError);

export const AnalyticsService = {
  getMonthlySummary: (month, year) => analyticsApi.get('/analytics/summary/monthly', { params: { month, year } }).then(r => r.data),
  getYearlySummary: (year) => analyticsApi.get('/analytics/summary/yearly', { params: { year } }).then(r => r.data),
  getCategoryBreakdown: (month, year) => analyticsApi.get('/analytics/breakdown/category', { params: { month, year } }).then(r => r.data),
  getIncomeTrend: () => analyticsApi.get('/analytics/trend/income-expense').then(r => r.data),
  getSavingsRateTrend: () => analyticsApi.get('/analytics/trend/savings-rate').then(r => r.data),
  getDailyTrend: (month, year) => analyticsApi.get('/analytics/trend/daily', { params: { month, year } }).then(r => r.data),
  getTopCategories: (month, year) => analyticsApi.get('/analytics/categories/top', { params: { month, year } }).then(r => r.data),
  getCashflow: (month, year) => analyticsApi.get('/analytics/cashflow', { params: { month, year } }).then(r => r.data),
  getSpendingForecast: () => analyticsApi.get('/analytics/forecast').then(r => r.data),
  getHealthScore: () => analyticsApi.get('/analytics/health-score').then(r => r.data),
  generateSnapshot: (month, year) => analyticsApi.post('/analytics/snapshot', null, { params: { month, year } }).then(r => r.data),
};

// ─── Recurring Service (port 8087) ───────────────────────
const recurringApi = axios.create({ baseURL: BASE_URL });
recurringApi.interceptors.request.use(addAuthHeader);
recurringApi.interceptors.response.use(r => r, handleError);

export const RecurringService = {
  add: (d) => recurringApi.post('/recurring', d).then(r => r.data),
  getAll: () => recurringApi.get('/recurring').then(r => r.data),
  getById: (id) => recurringApi.get(`/recurring/${id}`).then(r => r.data),
  getActive: () => recurringApi.get('/recurring/active').then(r => r.data),
  getByType: (type) => recurringApi.get(`/recurring/type/${type}`).then(r => r.data),
  getUpcoming: () => recurringApi.get('/recurring/upcoming').then(r => r.data),
  getDueSoon: (days = 3) => recurringApi.get(`/recurring/due-soon?days=${days}`).then(r => r.data),
  update: (id, d) => recurringApi.put(`/recurring/${id}`, d).then(r => r.data),
  deactivate: (id) => recurringApi.put(`/recurring/${id}/deactivate`).then(r => r.data),
  process: (id) => recurringApi.post(`/recurring/${id}/process`).then(r => r.data),
  delete: (id) => recurringApi.delete(`/recurring/${id}`).then(r => r.data),
};

// ─── Notification Service (port 8088) ────────────────────
const notifApi = axios.create({ baseURL: BASE_URL });
notifApi.interceptors.request.use(addAuthHeader);
notifApi.interceptors.response.use(r => r, handleError);

export const NotificationService = {
  getAll: () => notifApi.get('/notifications').then(r => r.data),
  getUnread: () => notifApi.get('/notifications/unread').then(r => r.data),
  getUnreadCount: () => notifApi.get('/notifications/unread-count').then(r => r.data),
  markRead: (id) => notifApi.put(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => notifApi.put('/notifications/read-all').then(r => r.data),
  acknowledge: (id) => notifApi.put(`/notifications/${id}/acknowledge`).then(r => r.data),
  delete: (id) => notifApi.delete(`/notifications/${id}`).then(r => r.data),
};

// ─── Subscription Service (port 8090) ────────────────────
const subApi = axios.create({ baseURL: BASE_URL });
subApi.interceptors.request.use(addAuthHeader);
subApi.interceptors.response.use(r => r, handleError);

export const SubscriptionService = {
  getStatus: () => subApi.get('/subscription/status').then(r => r.data),
  initiateCheckout: () => subApi.post('/subscription/checkout').then(r => r.data),
  activate: (data) => subApi.post('/subscription/activate', data).then(r => r.data),
  cancel: () => subApi.post('/subscription/cancel').then(r => r.data),
};

// ─── Admin Service (port 8081, admin-only) ────────────────
export const AdminService = {
  getUsers:            ()       => authApi.get('/admin/users').then(r => r.data),
  suspendUser:         (id)     => authApi.put(`/admin/users/${id}/suspend`).then(r => r.data),
  unsuspendUser:       (id)     => authApi.put(`/admin/users/${id}/unsuspend`).then(r => r.data),
  deleteUser:          (id)     => authApi.delete(`/admin/users/${id}`).then(r => r.data),
  getPlatformStats:    ()       => authApi.get('/admin/analytics').then(r => r.data),
  broadcast:           (data)   => authApi.post('/admin/notifications/broadcast', data).then(r => r.data),
  getAuditLogs:        ()       => authApi.get('/admin/audit-logs').then(r => r.data),
  // Fetch all transactions across all users (admin-only endpoint on expense-service)
  getAllTransactions:   ()       => expenseApi.get('/expenses/admin/all').then(r => r.data),
  // Fetch all subscription transactions across all users
  getAllSubscriptions:  ()       => subApi.get('/subscription/admin/all').then(r => r.data),
  // Actually deliver broadcast notifications via notification-service
  broadcastToUsers:    (data)   => notifApi.post('/notifications/bulk', data).then(r => r.data),
};
