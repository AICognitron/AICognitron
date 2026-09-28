// Login state + API helper for the Think-X features
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'aicog_token';

const AuthContext = createContext(null);

function readToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function writeToken(t) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!readToken());

  const logout = useCallback(() => {
    writeToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const request = useCallback(async (path, { method = 'GET', body, form } = {}) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    let payload;
    if (form) payload = form;
    else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(API_BASE + path, { method, headers, body: payload });
    } catch {
      throw new Error('Cannot reach the server. Is the backend running (npm run dev)?');
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) logout();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }, [token, logout]);

  const download = useCallback(async (path, filename) => {
    const res = await fetch(API_BASE + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Download failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, [token]);

  // restore session on page load
  useEffect(() => {
    if (!token) { setChecking(false); return; }
    let alive = true;
    fetch(API_BASE + '/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { if (alive) setUser(d.user); })
      .catch(() => { if (alive) logout(); })
      .finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, [token, logout]);

  // re-read the account from the server (picks up e.g. tester access without logging out)
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(API_BASE + '/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { logout(); return; }
      if (res.ok) {
        const d = await res.json();
        setUser(prev => (JSON.stringify(prev) === JSON.stringify(d.user) ? prev : d.user));
      }
    } catch { /* ignore */ }
  }, [token, logout]);

  const signIn = useCallback((t, u) => {
    writeToken(t);
    setToken(t);
    setUser(u);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, checking, signIn, logout, request, download, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

// eslint-disable-next-line react-refresh/only-export-components
export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
}
