import { createContext, useContext, useEffect, useState } from "react";

interface AuthState {
  authenticated: boolean;
  username: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ ok: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    username: null,
    loading: true,
  });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then((data: { authenticated: boolean; username?: string }) => {
        setState({ authenticated: data.authenticated, username: data.username ?? null, loading: false });
      })
      .catch(() => setState(s => ({ ...s, loading: false })));
  }, []);

  async function login(username: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json() as { username: string };
      setState({ authenticated: true, username: data.username, loading: false });
      return { ok: true };
    }
    return { ok: false };
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setState({ authenticated: false, username: null, loading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
