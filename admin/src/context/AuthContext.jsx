import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi, setAccessToken, setUnauthorizedHandler } from '../services/api';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem('aurelia-grand-admin-token');
    if (!token) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    setAccessToken(token);
    try {
      const response = await adminApi.me();
      setUser(response.data?.user || null);
    } catch {
      clearSession();
    } finally {
      setAuthLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    void restoreSession();
    return () => setUnauthorizedHandler(() => {});
  }, [clearSession, restoreSession]);

  const login = useCallback(async (credentials) => {
    const response = await adminApi.login(credentials);
    const result = response.data;
    if (!result?.user || !result?.token) throw new Error('The sign-in response was incomplete.');
    setAccessToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } catch (error) {
      if (!error?.response || error.response.status !== 401) throw error;
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateUser = useCallback((nextUser) => setUser(nextUser), []);
  const value = useMemo(() => ({ user, authLoading, login, logout, clearSession, updateUser, restoreSession }), [user, authLoading, login, logout, clearSession, updateUser, restoreSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
