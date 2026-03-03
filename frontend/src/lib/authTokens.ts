/**
 * In-memory token storage — tokens are NEVER written to localStorage.
 *
 * Trade-off: tokens are lost on page refresh. The first protected API call
 * will receive a 401, trigger a token refresh via the stored refreshToken,
 * and silently restore the session.
 *
 * This module is a plain singleton so both api.ts and authStore.ts can
 * import it without creating a circular dependency.
 */

let _accessToken:  string | null = null;
let _refreshToken: string | null = null;

export const authTokens = {
  getAccess:  () => _accessToken,
  getRefresh: () => _refreshToken,

  setAccess: (token: string) => {
    _accessToken = token;
  },

  set: (access: string, refresh: string) => {
    _accessToken  = access;
    _refreshToken = refresh;
  },

  clear: () => {
    _accessToken  = null;
    _refreshToken = null;
  },
};
