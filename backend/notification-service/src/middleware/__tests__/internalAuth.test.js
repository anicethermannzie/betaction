'use strict';

const { requireInternalKey } = require('../internalAuth');

function mockReqRes(headers = {}) {
  const req = { headers, path: '/notify/match-event', ip: '127.0.0.1' };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return { req, res };
}

describe('requireInternalKey', () => {
  const ORIGINAL_KEY = process.env.INTERNAL_API_KEY;

  afterEach(() => {
    process.env.INTERNAL_API_KEY = ORIGINAL_KEY;
  });

  it('fails closed with 500 when INTERNAL_API_KEY is not configured', () => {
    delete process.env.INTERNAL_API_KEY;
    const { req, res } = mockReqRes({ 'x-internal-api-key': 'whatever' });
    const next = jest.fn();

    requireInternalKey(req, res, next);

    expect(res.statusCode).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects requests with a missing header', () => {
    process.env.INTERNAL_API_KEY = 'correct-secret';
    const { req, res } = mockReqRes({});
    const next = jest.fn();

    requireInternalKey(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects requests with an incorrect header', () => {
    process.env.INTERNAL_API_KEY = 'correct-secret';
    const { req, res } = mockReqRes({ 'x-internal-api-key': 'wrong-secret' });
    const next = jest.fn();

    requireInternalKey(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when the header matches, even with a different length', () => {
    process.env.INTERNAL_API_KEY = 'correct-secret';
    const { req, res } = mockReqRes({ 'x-internal-api-key': 'correct-secret' });
    const next = jest.fn();

    requireInternalKey(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });
});
