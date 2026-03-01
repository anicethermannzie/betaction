import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 12_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach stored JWT if present ────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  try {
    const stored = localStorage.getItem('betaction-auth');
    const token: string | undefined = stored
      ? JSON.parse(stored)?.state?.accessToken
      : undefined;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    /* ignore parse errors */
  }
  return config;
});

// ── Response interceptor — handle 401 / token refresh ────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status !== 401 || typeof window === 'undefined') {
      return Promise.reject(err);
    }

    try {
      const stored = localStorage.getItem('betaction-auth');
      const refreshToken: string | undefined = stored
        ? JSON.parse(stored)?.state?.refreshToken
        : undefined;

      if (!refreshToken) throw new Error('no refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });

      // Patch the persisted store
      const auth = JSON.parse(localStorage.getItem('betaction-auth') ?? '{}');
      auth.state.accessToken = data.accessToken;
      localStorage.setItem('betaction-auth', JSON.stringify(auth));

      // Retry original request with the new token
      err.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return axios(err.config);
    } catch {
      localStorage.removeItem('betaction-auth');
      window.location.href = '/login';
      return Promise.reject(err);
    }
  }
);

// ── Typed helper methods ──────────────────────────────────────────────────────

export const matchApi = {
  live:          ()                        => api.get('/matches/live'),
  byDate:        (date: string)            => api.get(`/matches/date/${date}`),
  byId:          (id: number)              => api.get(`/matches/${id}`),
  odds:          (id: number)              => api.get(`/matches/${id}/odds`),
  statistics:    (id: number)              => api.get(`/matches/${id}/statistics`),
  h2h:           (t1: number, t2: number)  => api.get(`/matches/h2h/${t1}/${t2}`),
  standings:     (leagueId: number, season?: number) =>
    api.get(`/leagues/${leagueId}/standings`, { params: { season } }),
  teamStats:     (teamId: number, leagueId: number, season?: number) =>
    api.get(`/teams/${teamId}/stats`, { params: { league: leagueId, season } }),
};

export const predictionApi = {
  forMatch:   (fixtureId: number) => api.get(`/predictions/${fixtureId}`),
  today:      ()                  => api.get('/predictions/today'),
  forLeague:  (leagueId: number)  => api.get(`/predictions/league/${leagueId}`),
};

export const authApi = {
  login:        (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register:     (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh-token', { refreshToken }),
  profile:      () => api.get('/auth/profile'),
};
