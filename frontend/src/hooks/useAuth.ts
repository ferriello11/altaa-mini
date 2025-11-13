"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await get<{ user: any }>("/auth/me"); 
        setUser(res.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return { user, loading };
}
