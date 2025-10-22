const API_BASE_URL = (import.meta.env?.VITE_API_URL || 'https://attractive-kindness-rbe-serveurs.up.railway.app').replace(/\/$/, '');

function buildAuthHeaders() {
  try {
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export const fetchJson = async (path, options = {}) => {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...buildAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (res.status === 404) return { notFound: true };
  if (res.status === 204) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
};

export { API_BASE_URL };