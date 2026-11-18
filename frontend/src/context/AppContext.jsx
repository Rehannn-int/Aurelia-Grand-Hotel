import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppContext } from './contextHooks';
import authService from '../services/authService';
import { setAccessToken } from '../services/apiClient';

export function AppProvider({ children }) {
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    if (demoMode) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('aurelia-grand-token');
      if (!token) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      const { user: currentUser } = await authService.getCurrentUser();
      setUser(currentUser || null);
    } catch {
      clearSession();
    } finally {
      setAuthLoading(false);
    }
  }, [clearSession, demoMode]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const value = useMemo(() => ({
    demoMode,
    user,
    setUser,
    authLoading,
    clearSession,
    restoreSession,
  }), [authLoading, clearSession, demoMode, restoreSession, user]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
