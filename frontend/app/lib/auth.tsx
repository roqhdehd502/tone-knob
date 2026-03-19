import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { api, type User } from "./api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setSocialTokens: (accessToken: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await api.auth.me();
      setUser(userData);
    } catch {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem("accessToken", res.tokens.accessToken);
    localStorage.setItem("refreshToken", res.tokens.refreshToken);
    setUser(res.user);
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => {
    const res = await api.auth.register(data);
    localStorage.setItem("accessToken", res.tokens.accessToken);
    localStorage.setItem("refreshToken", res.tokens.refreshToken);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  const setSocialTokens = useCallback(
    (accessToken: string, refreshToken: string) => {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      void refreshUser();
    },
    [refreshUser],
  );

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, refreshUser, setSocialTokens }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
