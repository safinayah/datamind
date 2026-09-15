import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface EmailUser {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
}

interface AuthContextType {
  user: EmailUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "email_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<EmailUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const verifyQuery = trpc.auth.verifyEmailToken.useQuery(
    { token: localStorage.getItem(TOKEN_KEY) ?? "" },
    {
      enabled: !!localStorage.getItem(TOKEN_KEY),
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (!verifyQuery.isLoading) {
      if (verifyQuery.data) {
        setUser(verifyQuery.data as EmailUser);
      }
      setLoading(false);
    }
  }, [verifyQuery.isLoading, verifyQuery.data]);

  // If no token, stop loading immediately
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    // Store token in localStorage for session persistence
    // The server also sets a cookie, but we use localStorage as primary
    setUser(result.user as EmailUser);
  }, [loginMutation]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await registerMutation.mutateAsync({ name, email, password });
    setUser(result.user as EmailUser);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, [logoutMutation]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAdmin: user?.role === "admin",
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useEmailAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useEmailAuth must be used within AuthProvider");
  return ctx;
}
