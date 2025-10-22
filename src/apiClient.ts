const BASE_URL = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '');
if (!BASE_URL) throw new Error('VITE_API_URL manquant dans .env');

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

export async function fetchJson(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    credentials: 'include',      Accept: 'application/json',
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
}