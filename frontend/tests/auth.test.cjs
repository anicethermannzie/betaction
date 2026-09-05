const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => dependencies[name], ...globals });
  return exports;
}
function store(api) {
  let state;
  const tokens = { setAccess() {}, clear() {} };
  load('src/stores/authStore.ts', {
    zustand: { create: initialize => {
      state = initialize(update => Object.assign(state, update), () => state);
      return state;
    } },
    '@/lib/api': { authApi: api }, '@/lib/authTokens': { authTokens: tokens },
  }, { localStorage: { removeItem() {} } });
  return state;
}
test('network failures never authenticate or pretend registration succeeded', async () => {
  const fail = async () => { throw new Error('Network Error'); };
  const state = store({ login: fail, register: fail });
  await assert.rejects(state.login('test@example.com', 'password'));
  assert.equal(state.isAuthenticated, false);
  await assert.rejects(state.register('test', 'test@example.com', 'password'));
  assert.equal(state.isLoading, false);
});
test('reload restores user from cookie refresh without persisted credentials', async () => {
  let calls = 0;
  const state = store({ refreshToken: async () => { calls++; return { data: { user: { id: 1 }, accessToken: 'access' } }; } });
  await Promise.all([state.initialize(), state.initialize()]);
  assert.equal(calls, 1);
  assert.equal(state.isAuthenticated, true);
  assert.equal(state.initialized, true);
});
test('failed logout stays visible and successful logout clears identity', async () => {
  let fail = true;
  const state = store({ logout: async () => { if (fail) throw new Error('offline'); } });
  state.setAuth({ id: 1 }, 'access');
  await assert.rejects(state.logout());
  assert.equal(state.isAuthenticated, true);
  assert.match(state.error, /retry/);
  fail = false;
  await state.logout();
  assert.equal(state.isAuthenticated, false);
  assert.equal(state.user, null);
});
test('route middleware rejects missing, forged, revoked and unavailable sessions', async () => {
  for (const [token, status] of [[undefined, 204], ['mock.token', 204], ['a'.repeat(64), 401], ['a'.repeat(64), 503], ['a'.repeat(64), 204]]) {
    const { middleware } = load('src/middleware.ts', {
      'next/server': { NextResponse: { next: () => 'allow', redirect: () => 'redirect' } },
    }, { URL, AbortSignal, process: { env: {} }, fetch: async () => ({ status }) });
    const result = await middleware({ url: 'https://example.com/profile', cookies: { get: () => token ? { value: token } : undefined } });
    assert.equal(result, token?.length === 64 && status === 204 ? 'allow' : 'redirect');
  }
});
