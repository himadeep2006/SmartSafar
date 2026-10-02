import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

function clearStoredToken() {
  localStorage.removeItem("token");
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }
    setStatus("checking");
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
      setStatus("authenticated");
    } catch (error) {
      if (error.response?.status === 401) {
        clearStoredToken();
        setUser(null);
        setStatus("unauthenticated");
      } else {
        setStatus("unavailable");
      }
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const establishSession = useCallback((response) => {
    localStorage.setItem("token", response.access_token);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ status, user, establishSession, logout, refreshSession }),
    [status, user, establishSession, logout, refreshSession]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
