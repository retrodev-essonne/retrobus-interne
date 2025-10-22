// Client HTTP unique + exports compatibles

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://attractive-kindness-rbe-serveurs.up.railway.app/api';

const getToken = () => localStorage.getItem('token');

export const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const buildUrl = (endpoint) =>
  `${API_BASE_URL}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Erreur ${response.status}`);
    }
    throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
  }

  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error('Réponse non-JSON reçue. Vérifie l’URL API.');
  }

  return response.json();
};

export const apiClient = {
  async get(endpoint) {
    const res = await fetch(buildUrl(endpoint), {
      method: 'GET',
      headers: getHeaders(),
    });
    return parseResponse(res);
  },
  async post(endpoint, body) {
    const res = await fetch(buildUrl(endpoint), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return parseResponse(res);
  },
  async put(endpoint, body) {
    const res = await fetch(buildUrl(endpoint), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return parseResponse(res);
  },
  async delete(endpoint) {
    const res = await fetch(buildUrl(endpoint), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return parseResponse(res);
  },
};

// Alias utiles pour compatibilité avec d’autres imports éventuels
export const api = apiClient;
export default apiClient;

