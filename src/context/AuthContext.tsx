import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, getAuthToken, setAuthToken } from '@/lib/api';
import type { Agent } from '@/types';

interface AuthContextValue {
  user: Agent | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: { email: string; password: string }) => Promise<Agent>;
  register: (
    payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      bio?: string;
      role?: string;
    },
  ) => Promise<Agent>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      const me = await api.auth.me();
      setUser(me);
    } catch (error) {
      console.error('Failed to bootstrap auth state', error);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const result = await api.auth.login(payload);
      setAuthToken(result.accessToken);
      setUser(result.user);
      return result.user;
    },
    [],
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      bio?: string;
      role?: string;
    }) => {
      const result = await api.auth.register(payload);
      setAuthToken(result.accessToken);
      setUser(result.user);
      return result.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => { 
    const me = await api.auth.me();
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

