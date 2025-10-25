import { createContext, useContext, useEffect, useMemo, useState } from "react";
import ForcePasswordChange from '../components/ForcePasswordChange';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // NEW: état de contrôle session
  const [sessionChecked, setSessionChecked] = useState(false);
  const isAuthenticated = !!token;

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // NEW: revalidation stricte auprès du serveur
  const ensureSession = async () => {
    if (!token) {
      setUser(null);
      setSessionChecked(true);
      return false;
    }

    // Dev mode support: si pas d'API configurée OU token local, ne pas invalider la session
    const base = (import.meta?.env?.VITE_API_URL || '').replace(/\/+$/, '');
    const isLocalDevToken = String(token).startsWith('local-dev-token-');
    if (!base || isLocalDevToken) {
      // On fait confiance au stockage local pour la session de dev
      setSessionChecked(true);
      return true;
    }

    try {
      const res = await fetch(`${base}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const disabled = data?.disabled === true || data?.active === false || data?.status === 'DISABLED';
      if (disabled) {
        logout();
        setSessionChecked(true);
        return false;
      }

      // Normalisation du profil utilisateur pour toute l'appli
      const normalized = (() => {
        const username = data?.username || data?.matricule || data?.login || (data?.email ? String(data.email).split('@')[0] : '');
        const prenom = data?.prenom || data?.firstName || data?.given_name || '';
        const nom = data?.nom || data?.lastName || data?.family_name || '';
        return { ...data, username, prenom, nom };
      })();

      setUser(normalized);
      setMustChangePassword(!!data.mustChangePassword);
      setSessionChecked(true);
      return true;
    } catch (e) {
      // En cas d'échec de vérification serveur, ne casse pas la session si on est en dev sans API
      logout();
      setSessionChecked(true);
      return false;
    }
  };

  // Revalidation au chargement
  useEffect(() => {
    // On ne bloque pas le démarrage si pas de token
    ensureSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revalidation quand le token change
  useEffect(() => {
    if (token) ensureSession();
    else setSessionChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Revalidation: à chaque regain de focus et périodiquement
  useEffect(() => {
    const onFocus = () => ensureSession();
    window.addEventListener('focus', onFocus);
    const id = setInterval(() => ensureSession(), 5 * 60 * 1000); // toutes les 5 min
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const username = user?.username || '';
  const prenom = user?.prenom || '';
  const nom = user?.nom || '';
  const roles = user?.roles || [];
  const isAdmin = roles.includes('ADMIN');
  const matricule = user?.username || '';

  const value = useMemo(
    () => ({
      token,
      setToken,
      user,
      setUser,
      isAuthenticated,
      username,
      prenom,
      nom,
      roles,
      isAdmin,
      matricule,
      logout,
      // NEW: exposer le statut de session et l’action
      sessionChecked,
      ensureSession,
    }),
    [token, user, isAuthenticated, username, prenom, nom, roles, isAdmin, matricule, sessionChecked]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
      <ForcePasswordChange
        isOpen={mustChangePassword}
        onPasswordChanged={() => {
          setMustChangePassword(false);
          if (token) ensureSession();
        }}
      />
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}