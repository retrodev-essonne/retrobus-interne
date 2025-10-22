// Configuration de base pour les API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://attractive-kindness-rbe-serveurs.up.railway.app/api';

const getToken = () => localStorage.getItem('token');
const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
});

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    if (response.status === 404) return null;
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
  }

  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error('Réponse non-JSON (HTML). Vérifie l’URL API.');
  }

  return response.json();
};

const buildUrl = (endpoint) =>
  `${API_BASE_URL}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

const api = {
  async get(endpoint) {
    const res = await fetch(buildUrl(endpoint), { method: 'GET', headers: getHeaders() });
    const data = await parseResponse(res);
    return data ?? {};
  },
  async post(endpoint, body) {
    const res = await fetch(buildUrl(endpoint), { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
    const data = await parseResponse(res);
    return data ?? {};
  },
  async put(endpoint, body) {
    const res = await fetch(buildUrl(endpoint), { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) });
    const data = await parseResponse(res);
    return data ?? {};
  },
  async delete(endpoint) {
    const res = await fetch(buildUrl(endpoint), { method: 'DELETE', headers: getHeaders() });
    const data = await parseResponse(res);
    return data ?? {};
  }
};

export default api;

