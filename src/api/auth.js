import { fetchJson } from '../apiClient.js';

export const USERS = {
  "w.belaidi": {
    password: "Waiyl9134#",
    prenom: "Waiyl",
    nom: "BELAIDI",
    roles: ["ADMIN"]
  },
  "m.ravichandran": {
    password: "RBE2025",
    prenom: "Méthusan",
    nom: "RAVICHANDRAN",
    roles: ["MEMBER"]
  },
  "g.champenois": {
    password: "RBE2026",
    prenom: "Gaëlle",
    nom: "CHAMPENOIS",
    roles: ["MEMBER"]
  },
  "n.tetillon": {
    password: "RBE185C",
    prenom: "Nathan",
    nom: "TETILLON",
    roles: ["MEMBER"]
  }
};

// Mode mock: si VITE_USE_MOCK_AUTH=true
const USE_MOCK = import.meta.env?.VITE_USE_MOCK_AUTH === 'true';

function mockLogin(payload) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const { email, password } = payload;
      const username = email?.split('@')[0] || email; // ex: w.belaidi@...
      const user = USERS[username];
      
      if (!user || user.password !== password) {
        return reject(new Error('Identifiants incorrects'));
      }

      // Token fictif
      const token = btoa(JSON.stringify({ 
        userId: username, 
        email, 
        nom: user.nom, 
        prenom: user.prenom,
        roles: user.roles 
      }));

      resolve({ token, user: { id: username, email, ...user } });
    }, 300);
  });
}

function mockMe() {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) return resolve({ notFound: true });
        const decoded = JSON.parse(atob(token));
        resolve({ id: decoded.userId, email: decoded.email, nom: decoded.nom, prenom: decoded.prenom });
      } catch {
        resolve({ notFound: true });
      }
    }, 200);
  });
}

function mockLogout() {
  return Promise.resolve({ ok: true });
}

export const AuthAPI = {
  me: () => USE_MOCK ? mockMe() : fetchJson('/api/auth/me'),
  login: (payload) => USE_MOCK ? mockLogin(payload) : fetchJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  logout: () => USE_MOCK ? mockLogout() : fetchJson('/api/auth/logout', { method: 'POST' }),
};
