/**
 * Tests for matchPollingService.pollOnce's connected-clients gate.
 *
 * The 30s poll used to run unconditionally, which meant every tick was a
 * guaranteed API-Football cache miss on match-service's side — credits spent
 * around the clock even with nobody using the app. These tests assert the
 * gate: zero connected clients means zero network calls.
 */

jest.mock('axios');
const axios = require('axios');
const { pollOnce } = require('../matchPollingService');

function makeIo(clientsCount) {
  return {
    engine: { clientsCount },
    sockets: { adapter: { rooms: new Map() } },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('makes no request at all when no clients are connected', async () => {
  const io = makeIo(0);

  await pollOnce(io);

  expect(axios.get).not.toHaveBeenCalled();
});

test('polls match-service when at least one client is connected', async () => {
  axios.get.mockResolvedValue({ data: { response: [] } });
  const io = makeIo(1);

  await pollOnce(io);

  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get.mock.calls[0][0]).toMatch(/\/matches\/live$/);
});
