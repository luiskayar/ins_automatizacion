"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  isAuthenticated: boolean;
  isHydrating: boolean;
  token: string | null;
  user: string | null;
  n8nCode: string | null;
  login: (token?: string | true, options?: { user?: string; n8nCode?: string }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = "authToken";
const AUTH_USER_KEY = "authUser";
const AUTH_N8N_KEY = "n8nCode";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [n8nCode, setN8nCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedToken = window.localStorage.getItem(AUTH_STORAGE_KEY);
      const storedUser = window.localStorage.getItem(AUTH_USER_KEY);
      const storedN8n = window.localStorage.getItem(AUTH_N8N_KEY);
      setToken(storedToken);
      setUser(storedUser);
      setN8nCode(storedN8n);
      setIsAuthenticated(!!storedToken);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsHydrating(false);
    }
  }, []);

  const login = useCallback((tokenArg?: string | true, options?: { user?: string; n8nCode?: string }) => {
    const value = typeof tokenArg === "string" ? tokenArg : "1";
    window.localStorage.setItem(AUTH_STORAGE_KEY, value);
    if (options?.user) {
      window.localStorage.setItem(AUTH_USER_KEY, options.user);
      setUser(options.user);
    }
    if (options?.n8nCode) {
      window.localStorage.setItem(AUTH_N8N_KEY, options.n8nCode);
      setN8nCode(options.n8nCode);
    }
    setToken(value);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    window.localStorage.removeItem(AUTH_N8N_KEY);
    setToken(null);
    setUser(null);
    setN8nCode(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, isHydrating, token, user, n8nCode, login, logout }),
    [isAuthenticated, isHydrating, token, user, n8nCode, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


