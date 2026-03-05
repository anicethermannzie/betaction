import axios from 'axios';
import { authTokens } from '@/lib/authTokens';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 12_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach in-memory access token ──────────────────────

api.interceptors.request.use((config) => {
  const token = authTokens.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — silent token refresh on 401 ───────────────────────

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status !== 401 || typeof window === 'undefined') {
      return Promise.reject(err);
    }

    try {
      const refresh = authTokens.getRefresh();
      if (!refresh) throw new Error('no refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {
        refreshToken: refresh,
      });

      authTokens.setAccess(data.accessToken);
      err.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return axios(err.config);
    } catch {
      // Refresh failed — clear tokens and send user to login
      authTokens.clear();
      // Avoid importing the auth store here (circular dep); use direct navigation
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
  }
);

// ── Typed API helpers ─────────────────────────────────────────────────────────

export const matchApi = {
  live:       ()                           => api.get('/matches/live'),
  byDate:     (date: string)               => api.get(`/matches/date/${date}`),
  byId:       (id: number)                 => api.get(`/matches/${id}`),
  odds:       (id: number)                 => api.get(`/matches/${id}/odds`),
  statistics: (id: number)                 => api.get(`/matches/${id}/statistics`),
  h2h:        (t1: number, t2: number)     => api.get(`/matches/h2h/${t1}/${t2}`),
  standings:  (leagueId: number, season?: number) =>
    api.get(`/leagues/${leagueId}/standings`, { params: { season } }),
  teamStats:  (teamId: number, leagueId: number, season?: number) =>
    api.get(`/teams/${teamId}/stats`, { params: { league: leagueId, season } }),
};

export const predictionApi = {
  forMatch:  (fixtureId: number) => api.get(`/predictions/${fixtureId}`),
  today:     ()                  => api.get('/predictions/today'),
  forLeague: (leagueId: number)  => api.get(`/predictions/league/${leagueId}`),
  markets:   (fixtureId: number) => api.get(`/predictions/${fixtureId}/markets`),
};

export const ticketApi = {
  today:  ()              => api.get('/predictions/tickets/today'),
  byTier: (tier: string)  => api.get(`/predictions/tickets/${tier}`),
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
