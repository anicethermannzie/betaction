Authentication uses opaque refresh credentials in a host-only HttpOnly, SameSite=Strict cookie. Secure is enabled unless NODE_ENV is explicitly development. Fake login and registration have been removed in every mode.

Deploy the frontend over HTTPS. Set frontend AUTH_SERVICE_URL to the internal auth-service origin (Docker Compose sets http://auth-service:3001). Set auth-service CORS_ORIGIN to the exact browser-facing frontend origin. Browser auth calls use the frontend's same-origin /api/auth proxy, including the X-Requested-With: BetAction CSRF header.

On startup the auth service creates auth_sessions and auth_refresh_tokens in PostgreSQL; its database role needs CREATE TABLE permissions and the users table must already exist. Existing refresh JWTs and access tokens without a session ID are invalidated on rollout. Users must sign in again.

Sessions expire seven days after login. Refresh runs in a transaction with row locks, consumes the previous token, and stores only SHA-256 hashes. Reuse revokes the whole session. Logout revokes the session and clears the cookie; auth-service bearer authentication also checks revocation. Other services independently validating access JWTs must enforce session revocation if they add protected operations. Expired sessions can be periodically deleted (refresh records cascade).

Run regression checks with `node --test tests/session.test.cjs`. Browser refresh calls are deduplicated and use Web Locks where available to serialize tabs. Browsers without Web Locks may require signing in again if tabs rotate the same credential concurrently.

Reference: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
