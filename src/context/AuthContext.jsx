import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

async function apiFetch(path, options = {}) {
  const { timeoutMs = 8000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(rest.headers || {}) },
      signal: controller.signal,
      ...rest,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.error || data?.message || "Request failed";
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("auth.lastUser");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("checking"); // checking | retrying | ready | failed

  function setFlash(key) {
    try {
      sessionStorage.setItem("flash", key);
    } catch {
      // ignore storage errors
    }
  }

  async function refresh(retries = 2) {
    setStatus("checking");
    try {
      const data = await apiFetch("/api/auth/me", { timeoutMs: 8000 });
      setUser(data.user || null);
      try {
        localStorage.setItem("auth.lastUser", JSON.stringify(data.user || null));
      } catch {
        // ignore storage errors
      }
      setStatus("ready");
    } catch (err) {
      const isTransient = err?.message === "Request timed out" || (err?.status && err.status >= 500);
      if (isTransient && retries > 0) {
        setStatus("retrying");
        await new Promise((r) => setTimeout(r, 1500));
        return refresh(retries - 1);
      }
      setUser(null);
      try {
        localStorage.removeItem("auth.lastUser");
      } catch {
        // ignore storage errors
      }
      setStatus("failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email, password, remember = false) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, remember }),
    });
    setUser(data.user);
    try {
      localStorage.setItem("auth.lastUser", JSON.stringify(data.user || null));
    } catch {
      // ignore storage errors
    }
    setFlash("signed_in");
    return data.user;
  }

  async function bootstrap(email, password, name, remember = false) {
    const data = await apiFetch("/api/auth/bootstrap", {
      method: "POST",
      body: JSON.stringify({ email, password, name, remember }),
    });
    setUser(data.user);
    try {
      localStorage.setItem("auth.lastUser", JSON.stringify(data.user || null));
    } catch {
      // ignore storage errors
    }
    setFlash("signed_in");
    return data.user;
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    try {
      localStorage.removeItem("auth.lastUser");
    } catch {
      // ignore storage errors
    }
    setFlash("signed_out");
  }

  const value = useMemo(
    () => ({ user, loading, status, login, logout, bootstrap, refresh }),
    [user, loading, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
