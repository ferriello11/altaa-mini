"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { get } from "@/lib/api";

type User = {
  id: string;
  email: string;
  activeCompanyId: string | null;
  activeCompanyRole: "OWNER" | "ADMIN" | "MEMBER" | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    try {
      const res = await get<{ user: User }>("/auth/session");

      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    await loadUser();
  }

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
