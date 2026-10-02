import axios, { type AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
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
function attachAccessToken(config: InternalAxiosRequestConfig) {
  const token = authTokens.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}
async function retryAfterRefresh(err: AxiosError & { config?: { _retry?: boolean } }, client: AxiosInstance) {
  if (!err.config || err.response?.status !== 401 || err.config._retry || typeof window === 'undefined') throw err;
  err.config._retry = true;
  try {
    const { data } = await refreshSession();
    err.config.headers.Authorization = `Bearer ${data.accessToken}`;
    return client(err.config);
  } catch (error) {
    authTokens.clear();
    throw error;
  }
}
api.interceptors.request.use(attachAccessToken);
api.interceptors.response.use(res => res, err => retryAfterRefresh(err, api));

// authClient carries the session cookie (CSRF-protected) for /auth/* routes.
// Most of those routes — login, register, refresh-token, logout — are either
// unauthenticated or cookie-only, and a 401 from them is a real rejection
// (wrong password, invalid/expired session), not an access token that merely
// needs refreshing. Blanket-attaching a token and retry-on-401 to every
// request on this client, the way `api` does, broke exactly that: a wrong
// password on /auth/login got silently replaced with whatever
// refreshSession() failed with, because that 401 triggered the same "maybe
// the token expired, refresh and retry" logic. /auth/account is the only
// route here that actually needs it — it is guarded by the authenticate
// middleware's Bearer token AND the cookie CSRF check — so both interceptors
// are scoped to it alone, not applied client-wide.
const AUTH_CLIENT_TOKEN_ROUTES = new Set(['/auth/account']);
authClient.interceptors.request.use((config) =>
  AUTH_CLIENT_TOKEN_ROUTES.has(config.url ?? '') ? attachAccessToken(config) : config
);
authClient.interceptors.response.use(res => res, (err: AxiosError) =>
  AUTH_CLIENT_TOKEN_ROUTES.has(err.config?.url ?? '') ? retryAfterRefresh(err, authClient) : Promise.reject(err)
);

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
  events:     (id: number)                 => api.get(`/matches/${id}/events`),
  // `live` tells the gateway/cache whether to use the short TTL — the caller
  // already knows the fixture's status (it fetched the fixture itself first),
  // so this avoids match-service needing a second upstream call just to
  // answer "is this still live?" purely to pick a cache duration.
  momentum:   (id: number, isLive: boolean) =>
    api.get(`/matches/${id}/momentum`, { params: { live: isLive } }),
  liveOdds:   (id: number, isLive: boolean) =>
    api.get(`/matches/${id}/odds/live`, { params: { live: isLive } }),
};

export const predictionApi = {
  forMatch:  (fixtureId: number) => api.get(`/predictions/${fixtureId}`),
  today:     ()                  => api.get('/predictions/today'),
  forLeague: (leagueId: number)  => api.get(`/predictions/league/${leagueId}`),
  markets:   (fixtureId: number) => api.get(`/predictions/${fixtureId}/markets`),
  getMatchMarkets: (fixtureId: number, category?: string) =>
    api.get(`/predictions/${fixtureId}/markets`, { params: { category } }),
  deepAnalysis: (fixtureId: number) => api.get(`/predictions/${fixtureId}/deep-analysis`),
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
  deleteAccount: (password: string) => authClient.delete('/auth/account', { data: { password } }),
  forgotPassword: (email: string) => authClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => authClient.post('/auth/reset-password', { token, password }),
};

// Bearer-token-authenticated, same as authApi.profile — these hit the gateway
// directly rather than going through the Next.js cookie-proxy route, because
// they carry no CSRF-sensitive cookie the way login/refresh/logout do.
export const billingApi = {
  createCheckoutSession: () => api.post('/auth/billing/create-checkout-session'),
  createPortalSession:   () => api.post('/auth/billing/create-portal-session'),
  status:                () => api.get('/auth/billing/status'),
};
