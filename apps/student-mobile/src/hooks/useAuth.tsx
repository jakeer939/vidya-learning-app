import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '@vidya/auth';
import {
  getStoredToken,
  loginStudent,
  logoutStudent,
  validateSession,
} from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const initSession = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = await getStoredToken();
      if (storedToken) {
        const sessionUser = await validateSession();
        if (sessionUser) {
          setUser(sessionUser);
          setToken(storedToken);
        } else {
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.warn('Session validation failed on startup:', err);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const login = async (email: string, pass: string) => {
    const { token: nextToken, user: nextUser } = await loginStudent(email, pass);
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = async () => {
    try {
      await logoutStudent();
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const refreshSession = async () => {
    await initSession();
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
