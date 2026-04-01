"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "@/lib/supabase-api";
import { auth } from "@/lib/supabase-api";
import {
  ADMIN_AUTH_CHANGE_EVENT,
  establishConfiguredAdminSession,
  getAdminCredentials,
  getMockAdminUser,
  isAdminUser,
  isMockAdminSessionActive,
} from "@/lib/admin";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncSession = async (nextUser: User | null) => {
      if (!mounted) return;

      setLoading(true);

      if (isMockAdminSessionActive()) {
        const credentials = getAdminCredentials();

        try {
          const realUser = await establishConfiguredAdminSession(auth, credentials.email, credentials.password);

          if (realUser) {
            setUser(realUser);
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        } catch {
          // Fall back to the local mock session if Supabase auth cannot be restored.
        }

        setUser(getMockAdminUser());
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      setUser(nextUser);

      if (!nextUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const allowed = await isAdminUser(nextUser);
        if (!mounted) return;
        setIsAdmin(allowed);
      } catch {
        if (!mounted) return;
        setIsAdmin(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (nextUser: User | null) => {
      void syncSession(nextUser);
    });

    const handleAdminAuthChange = () => {
      void syncSession(auth.currentUser);
    };

    if (typeof window !== "undefined") {
      window.addEventListener(ADMIN_AUTH_CHANGE_EVENT, handleAdminAuthChange);
      window.addEventListener("storage", handleAdminAuthChange);
    }

    void syncSession(auth.currentUser);

    return () => {
      mounted = false;
      unsubscribe();

      if (typeof window !== "undefined") {
        window.removeEventListener(ADMIN_AUTH_CHANGE_EVENT, handleAdminAuthChange);
        window.removeEventListener("storage", handleAdminAuthChange);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
