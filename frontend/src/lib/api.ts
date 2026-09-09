import axios, { type AxiosResponse } from 'axios';
import type { User } from '@/types';
import { authTokens } from '@/lib/authTokens';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';
export const api = axios.create({ baseURL: BASE_URL, timeout: 12000, headers: { 'Content-Type': 'application/json' } });
const authClient = axios.create({ baseURL: '/api', withCredentials: true, timeout: 12000,
  headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'BetAction' } });
let refreshing: Promise<AxiosResponse<{ user: User; accessToken: string }>> | null = null;
function refreshSession() {
  if (!refreshing) {
    const refresh = async () => {
      const response = await authClient.post<{ user: User; accessToken: string }>('/auth/refresh-token');
      authTokens.setAccess(response.data.accessToken);
      return response;
    };
    refreshing = (async () => {
      if (typeof navigator !== 'undefined' && navigator.locks) {
        return await navigator.locks.request('betaction-refresh', refresh);
      }
      return await refresh();
    })()
      .finally(() => { refreshing = null; });
  }
  return refreshing!;
}
api.interceptors.request.use(config => {
  const token = authTokens.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(res => res, async err => {
  if (err.response?.status !== 401 || err.config?._retry || typeof window === 'undefined') throw err;
  err.config._retry = true;
  try {
    const { data } = await refreshSession();
    err.config.headers.Authorization = `Bearer ${data.accessToken}`;
    return api(err.config);
  } catch (error) {
    authTokens.clear();
    throw error;
  }
});

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
  getInternationalMatches: (date?: string) =>
    api.get('/matches/international' + (date ? `/${date}` : '')),
  getClubMatches: (date?: string) =>
    api.get('/matches/clubs' + (date ? `/${date}` : '')),
  getAllLeagues: () => api.get('/leagues'),
};

export const predictionApi = {
  forMatch:  (fixtureId: number) => api.get(`/predictions/${fixtureId}`),
  today:     ()                  => api.get('/predictions/today'),
  forLeague: (leagueId: number)  => api.get(`/predictions/league/${leagueId}`),
  markets:   (fixtureId: number) => api.get(`/predictions/${fixtureId}/markets`),
  getMatchMarkets: (fixtureId: number, category?: string) =>
    api.get(`/predictions/${fixtureId}/markets`, { params: { category } }),
};

export const ticketApi = {
  today:  ()              => api.get('/predictions/tickets/today'),
  byTier: (tier: string)  => api.get(`/predictions/tickets/${tier}`),
};

export const authApi = {
  login:        (email: string, password: string) =>
    authClient.post('/auth/login', { email, password }),
  register:     (username: string, email: string, password: string) =>
    authClient.post('/auth/register', { username, email, password }),
  refreshToken: refreshSession,
  logout: () => authClient.post('/auth/logout'),
  profile:      () => api.get('/auth/profile'),
};
