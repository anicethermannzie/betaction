'use strict';

const { EventEmitter } = require('events');

// jest.mock factories cannot reference out-of-scope variables, so 'events' is
// required again inside it rather than reusing the top-level import.
jest.mock('ioredis', () => {
  const { EventEmitter: MockEmitter } = require('events');
  return jest.fn().mockImplementation(() => new MockEmitter());
});

const { waitUntilReady } = require('../redis');

/**
 * Regression test for the boot crash: server.js called redis.ping()
 * immediately, before the client's connection handshake finished. With
 * enableOfflineQueue: false that command is rejected outright rather than
 * queued ("Stream isn't writeable"), which crashed the service on every cold
 * start. waitUntilReady is what server.js now awaits first.
 */
describe('waitUntilReady', () => {
  test('resolves immediately for a client already in ready state', async () => {
    const client = new EventEmitter();
    client.status = 'ready';

    await expect(waitUntilReady(client)).resolves.toBeUndefined();
  });

  test('resolves once the client emits "ready"', async () => {
    const client = new EventEmitter();
    client.status = 'connecting';

    const promise = waitUntilReady(client);
    client.emit('ready');

    await expect(promise).resolves.toBeUndefined();
  });

  test('rejects if the client errors before becoming ready', async () => {
    const client = new EventEmitter();
    client.status = 'connecting';

    const promise = waitUntilReady(client);
    client.emit('error', new Error('ECONNREFUSED'));

    await expect(promise).rejects.toThrow('ECONNREFUSED');
  });

  test('does not leak listeners once settled', async () => {
    const client = new EventEmitter();
    client.status = 'connecting';

    const promise = waitUntilReady(client);
    client.emit('ready');
    await promise;

    expect(client.listenerCount('ready')).toBe(0);
    expect(client.listenerCount('error')).toBe(0);
  });
});
