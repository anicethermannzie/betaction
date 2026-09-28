const { randomBytes } = require('crypto');
const { spawnSync } = require('child_process');
const path = require('path');
const { validateJwtSecrets } = require('../src/config/jwt');
const valid = () => ({ JWT_ACCESS_SECRET: randomBytes(32).toString('hex'), JWT_REFRESH_SECRET: randomBytes(32).toString('hex') });
const names = ["JWT_ACCESS_SECRET","JWT_REFRESH_SECRET"];

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
