"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser } from "@/./lib/type";

interface AuthContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<AuthUser | null>(null);

  // Load user from localStorage on first render
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
  }, []);

  const setUser = (next: AuthUser | null) => {
    setUserState(next);
    if (next) {
      localStorage.setItem("auth_user", JSON.stringify(next));
    } else {
      localStorage.removeItem("auth_user");
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
