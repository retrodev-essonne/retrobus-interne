const BASE = (import.meta?.env?.VITE_API_URL || '').replace(/\/+$/, '');
const tokenHeader = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const ensureJson = async (resp) => {
  const ct = (resp.headers.get('content-type') || '').toLowerCase();
  if (!(ct.includes('application/json') || ct.includes('+json'))) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Réponse non-JSON (${resp.status}) ${text?.slice(0, 200) || ''}`);
  }
};

const fetchWithTimeout = (url, init = {}, ms = 8000) => {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), ms);
  return fetch(url, { ...init, signal: ac.signal }).finally(() => clearTimeout(id));
};

const toUrl = (path) => {
  const p = String(path || '').replace(/^\/+|\/+$/g, '');
  return BASE ? `${BASE}/${p}` : `/${p}`;
};

const MEMBERS_ENDPOINTS = ['api/members', 'members', 'api/v1/members', 'v1/members'];

async function tryEndpoints(method, body, extraHeaders) {
  let lastErr = null;
  for (const ep of MEMBERS_ENDPOINTS) {
    try {
      const url = toUrl(ep);
      const resp = await fetchWithTimeout(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': body instanceof FormData ? undefined : 'application/json',
          ...tokenHeader(),
          ...(extraHeaders || {}),
        },
        body: body == null
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
      });
      if (!resp.ok) { lastErr = new Error(`HTTP ${resp.status}`); continue; }
      await ensureJson(resp);
      // Renvoie l’objet JSON natif
      return await resp.json();
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('Aucun endpoint membre valide');
}

export const membersAPI = {
  // Renvoie { members: [...] } pour s’adapter au code existant
  async getAll() {
    try {
      const data = await tryEndpoints('GET');
      if (Array.isArray(data)) return { members: data };
      if (Array.isArray(data?.members)) return data;
      if (Array.isArray(data?.data)) return { members: data.data };
      // Normalisation minimale
      return { members: [] };
    } catch {
      return { members: [] };
    }
  },

  // Ping rapide pour le “mode dégradé”
  async testConnectivity() {
    const candidates = [
      toUrl('api/health'),
      toUrl('health'),
      toUrl(MEMBERS_ENDPOINTS[0])
    ];
    for (const u of candidates) {
      try {
        const r = await fetchWithTimeout(u, { method: 'GET', headers: { ...tokenHeader() } }, 3000);
        if (r.ok) return true;
      } catch {}
    }
    return false;
  },

  async create(member) {
    const res = await tryEndpoints('POST', member);
    return res?.member || res?.data || res;
  },

  async update(id, member) {
    // Essaye PATCH puis PUT si besoin
    try {
      const out = await tryEndpoints('PATCH', { id, ...member }, { 'X-Method-Override': 'PATCH' });
      return out?.member || out?.data || out;
    } catch {
      const out = await tryEndpoints('PUT', { id, ...member });
      return out?.member || out?.data || out;
    }
  },

  async delete(id) {
    const payload = { id };
    try {
      const out = await tryEndpoints('DELETE', payload);
      return out?.ok === true ? out : { ok: true };
    } catch (e) {
      // Certaines APIs n’acceptent pas de body en DELETE → fallback querystring
      for (const ep of MEMBERS_ENDPOINTS) {
        try {
          const url = toUrl(`${ep}/${encodeURIComponent(id)}`);
          const r = await fetchWithTimeout(url, { method: 'DELETE', headers: { ...tokenHeader() } });
          if (r.ok) return { ok: true };
        } catch {}
      }
      throw e;
    }
  },
};