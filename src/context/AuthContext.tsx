"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/lib/types";
import { authenticateUser } from "@/lib/data";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Baca user dari sessionStorage saat pertama render
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("pos_user");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {}
    setLoading(false);
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    const authenticated = await authenticateUser(username, password);
    if (authenticated) {
      setUser(authenticated);
      try {
        sessionStorage.setItem("pos_user", JSON.stringify(authenticated));
      } catch {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem("pos_user");
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
