import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ss_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ss_token'));
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token && !!user;

  const saveSession = (authResponse) => {
    const { token: t, user: u } = authResponse;
    localStorage.setItem('ss_token', t);
    localStorage.setItem('ss_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const clearSession = useCallback(() => {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    setToken(null);
    setUser(null);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await AuthService.login(credentials);
      saveSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (idToken) => {
    setLoading(true);
    try {
      const data = await AuthService.googleLogin(idToken);
      saveSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const data = await AuthService.register(formData);
      saveSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await AuthService.logout(); } catch (_) {}
    clearSession();
  };

  const refreshUser = async () => {
    try {
      const updated = await AuthService.getProfile();
      setUser(updated);
      localStorage.setItem('ss_user', JSON.stringify(updated));
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, loginWithGoogle, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
