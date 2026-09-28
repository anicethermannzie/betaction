const { randomBytes } = require('crypto');
const { spawnSync } = require('child_process');
const path = require('path');
const { validateJwtSecrets } = require('../src/config/jwt');
const valid = () => ({ JWT_ACCESS_SECRET: randomBytes(32).toString('hex'), JWT_REFRESH_SECRET: randomBytes(32).toString('hex') });
const names = ["JWT_ACCESS_SECRET"];

test('accepts generated secrets', () => {
  expect(() => validateJwtSecrets(valid())).not.toThrow();
});
for (const name of names) {
  test.each([undefined, '', ' '.repeat(64), 'a'.repeat(31), 'your_jwt_secret_change_in_production', 'replace-with-a-long-secret-before-production', 'placeholder'.repeat(5)])(name + ' rejects invalid value %p', value => {
    expect(() => validateJwtSecrets({ ...valid(), [name]: value })).toThrow(name);
  });
  test(name + ' fails startup before loading infrastructure', () => {
    const result = spawnSync(process.execPath, [path.resolve(__dirname, '../src/server.js')], {
      env: { ...process.env, ...valid(), [name]: '', JWT_SECRET: randomBytes(32).toString('hex') },
      encoding: 'utf8', timeout: 5000,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(name + ' must contain at least 32 bytes');
    expect(result.stderr).not.toContain('connect');
  });
}

test('auth-issued access tokens authenticate sockets with the shared access secret', () => {
  const previous = process.env.JWT_ACCESS_SECRET;
  process.env.JWT_ACCESS_SECRET = valid().JWT_ACCESS_SECRET;
  try {
    // Load the actual issuer using this service's JWT dependency (CI installs one service).
    const issuer = { exports: {} };
    require('vm').runInNewContext(require('fs').readFileSync(path.resolve(__dirname, '../../auth-service/src/utils/jwt.js'), 'utf8'), {
      require, process, module: issuer,
    });
    const { generateAccessToken } = issuer.exports;
    const { initSocketService } = require('../src/services/socketService');
    let middleware;
    initSocketService({ use(fn) { middleware = fn; }, on() {} });
    const socket = { handshake: { auth: { token: generateAccessToken({ id: 'user-123' }) } } };
    const next = jest.fn();
    middleware(socket, next);
    expect(socket.user.id).toBe('user-123');
    expect(next).toHaveBeenCalledTimes(1);
  } finally {
    if (previous === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = previous;
  }
});
