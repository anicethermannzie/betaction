// Only short-lived access tokens are available to JavaScript.
let accessToken: string | null = null;
export const authTokens = {
  getAccess: () => accessToken,
  setAccess: (token: string) => { accessToken = token; },
  clear: () => { accessToken = null; },
};
