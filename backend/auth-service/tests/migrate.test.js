/**
 * Tests for the migration runner.
 *
 * The audit's CRITICAL-6 was that no file in the repository created the `users`
 * table: sessionModel ran DDL at boot that referenced users(id), so a clean
 * deploy crash-looped and the schema only existed because someone had typed it
 * into the dev database by hand. These tests cover the runner that replaced it.
 *
 * A live database would be better and is not available here, so this exercises
 * the ordering, idempotency, locking and rollback logic against a fake pool.
 * The migration SQL itself is still read from disk, so the files must exist.
 */

const path = require('path');

let queries = [];
let failOn = null;
let appliedVersions = [];

// Prefixed with "mock" so jest's module factory is allowed to reference it.
const mockClient = {
  query: async (sql, params) => {
    queries.push({ sql, params });

    if (failOn && sql.includes(failOn)) {
      throw new Error('syntax error at or near "boom"');
    }
    if (sql.startsWith('SELECT version FROM schema_migrations')) {
      return { rows: appliedVersions.map((version) => ({ version })) };
    }
    return { rows: [] };
  },
  release: jest.fn(),
};

// jest keeps its own module registry, so the pool has to be replaced through
// jest.mock rather than by writing into require.cache.
jest.mock('../src/config/database', () => ({
  pool: {
    connect: async () => mockClient,
    query: (...args) => mockClient.query(...args),
  },
}));

const { runMigrations } = require('../src/config/migrate');

const sqlOf = () => queries.map((q) => q.sql);
const recordedVersions = () =>
  queries
    .filter((q) => q.sql.startsWith('INSERT INTO schema_migrations'))
    .map((q) => q.params[0]);

beforeEach(() => {
  queries = [];
  failOn = null;
  appliedVersions = [];
  mockClient.release.mockClear();
});

describe('runMigrations', () => {
  test('creates the bookkeeping table before reading it', () => {
    return runMigrations().then(() => {
      const statements = sqlOf();
      const created = statements.findIndex((s) => s.includes('CREATE TABLE IF NOT EXISTS schema_migrations'));
      const read = statements.findIndex((s) => s.startsWith('SELECT version FROM schema_migrations'));

      expect(created).toBeGreaterThanOrEqual(0);
      expect(read).toBeGreaterThan(created);
    });
  });

  test('takes and releases the advisory lock so concurrent tasks cannot race', async () => {
    await runMigrations();

    const statements = sqlOf();
    expect(statements.some((s) => s.includes('pg_advisory_lock'))).toBe(true);
    expect(statements.some((s) => s.includes('pg_advisory_unlock'))).toBe(true);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('applies every pending migration in filename order', async () => {
    await runMigrations();

    const versions = recordedVersions();
    expect(versions).toEqual([...versions].sort());
    expect(versions).toContain('001_create_users.sql');
    expect(versions).toContain('002_create_sessions.sql');
    expect(versions).toContain('003_add_plan_and_trial.sql');
  });

  test('creates users before the sessions that reference it', async () => {
    await runMigrations();

    const versions = recordedVersions();
    expect(versions.indexOf('001_create_users.sql')).toBeLessThan(
      versions.indexOf('002_create_sessions.sql'),
    );
  });

  test('wraps each migration in its own transaction', async () => {
    await runMigrations();

    const statements = sqlOf();
    const begins = statements.filter((s) => s === 'BEGIN').length;
    const commits = statements.filter((s) => s === 'COMMIT').length;

    expect(begins).toBe(recordedVersions().length);
    expect(commits).toBe(begins);
  });

  test('is idempotent — an already-recorded migration is not reapplied', async () => {
    appliedVersions = ['001_create_users.sql', '002_create_sessions.sql', '003_add_plan_and_trial.sql'];

    await runMigrations();

    expect(recordedVersions()).toEqual([]);
    expect(sqlOf().filter((s) => s === 'BEGIN')).toHaveLength(0);
  });

  test('rolls back and stops on a failing migration', async () => {
    failOn = 'CREATE TABLE IF NOT EXISTS users';

    await expect(runMigrations()).rejects.toThrow(/001_create_users\.sql failed/);

    const statements = sqlOf();
    expect(statements).toContain('ROLLBACK');
    // The database is left on the last good version, not half-migrated.
    expect(recordedVersions()).toEqual([]);
    // And the lock is still released, so the next task is not blocked forever.
    expect(statements.some((s) => s.includes('pg_advisory_unlock'))).toBe(true);
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('every migration file on disk is plain SQL that the runner can read', () => {
    const { readdirSync, readFileSync } = require('fs');
    const dir = path.join(__dirname, '..', 'migrations');

    const files = readdirSync(dir).filter((f) => f.endsWith('.sql'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      expect(readFileSync(path.join(dir, file), 'utf8').trim().length).toBeGreaterThan(0);
      // Filenames order the run, so they must start with a zero-padded number.
      expect(file).toMatch(/^\d{3}_[a-z0-9_]+\.sql$/);
    }
  });
});
