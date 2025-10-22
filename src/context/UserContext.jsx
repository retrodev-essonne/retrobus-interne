import { createContext, useContext, useEffect, useState } from 'react';
import { AuthAPI } from '../api/auth.js';

export const UserContext = createContext({
  user: null,
  token: null,
  loading: true,
  setToken: () => {},
  logout: () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, _setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const setToken = (newToken) => {
    _setToken(newToken || null);
    try {
      if (newToken) localStorage.setItem('accessToken', newToken);
      else localStorage.removeItem('accessToken');
    } catch {}
  };

  const logout = async () => {
    try { await AuthAPI.logout?.(); } catch {}
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored =
          localStorage.getItem('accessToken') ||
          localStorage.getItem('token') ||
          localStorage.getItem('jwt');
        if (stored) _setToken(stored);
        const me = await AuthAPI.me();
        if (!cancelled && me?.notFound !== true) setUser(me || null);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <UserContext.Provider value={{ user, token, loading, setToken, logout }}>
      {children}
    </UserContext.Provider>
  );
}