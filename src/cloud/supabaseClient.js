const PROJECT_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const SESSION_KEY = 'teztarif_cloud_session';

const ensureConfigured = () => {
  if (!PROJECT_URL || !PUBLISHABLE_KEY) throw new Error('Cloud sync is not configured');
};

const readSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
};

const saveSession = (session) => {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
};

const authHeaders = (token) => ({
  apikey: PUBLISHABLE_KEY,
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const parseResponse = async (response) => {
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const error = new Error(body?.message || body?.error_description || body?.error || `Cloud request failed (${response.status})`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
};

export const cloudAuth = {
  session: readSession,

  async signIn(email, password) {
    ensureConfigured();
    const response = await fetch(`${PROJECT_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const session = await parseResponse(response);
    saveSession(session);
    return session;
  },

  async refresh() {
    ensureConfigured();
    const current = readSession();
    if (!current?.refresh_token) throw new Error('No refresh token available');
    const response = await fetch(`${PROJECT_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    });
    const session = await parseResponse(response);
    saveSession(session);
    return session;
  },

  async signOut() {
    const current = readSession();
    try {
      if (current?.access_token) {
        await fetch(`${PROJECT_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: authHeaders(current.access_token),
        });
      }
    } finally {
      saveSession(null);
    }
  },
};

const validToken = async () => {
  let session = readSession();
  if (!session?.access_token) throw new Error('Sign in to use cloud features');
  const expiresAt = Number(session.expires_at || 0) * 1000;
  if (expiresAt && expiresAt < Date.now() + 60_000) session = await cloudAuth.refresh();
  return session.access_token;
};

export const cloudDb = {
  async request(path, { method = 'GET', body, headers = {} } = {}) {
    ensureConfigured();
    const token = await validToken();
    return parseResponse(await fetch(`${PROJECT_URL}/rest/v1/${path}`, {
      method,
      headers: { ...authHeaders(token), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    }));
  },

  select(table, query = '') {
    return this.request(`${table}?select=*${query ? `&${query}` : ''}`);
  },

  insert(table, rows) {
    return this.request(table, {
      method: 'POST',
      body: rows,
      headers: { Prefer: 'return=representation' },
    });
  },

  update(table, query, patch) {
    return this.request(`${table}?${query}`, {
      method: 'PATCH',
      body: patch,
      headers: { Prefer: 'return=representation' },
    });
  },

  upsert(table, rows, onConflict) {
    const suffix = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : '';
    return this.request(`${table}${suffix}`, {
      method: 'POST',
      body: rows,
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    });
  },
};
