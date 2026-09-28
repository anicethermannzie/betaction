const { calculateMomentum, WINDOW_MINUTES } = require('../momentumCalculator');

const TEAMS = { homeTeamId: 1, awayTeamId: 2 };

function goalEvent(minute, teamId, player = 'Scorer') {
  return { time: { elapsed: minute, extra: null }, team: { id: teamId }, player: { name: player }, type: 'Goal', detail: 'Normal Goal' };
}

function cardEvent(minute, teamId, detail = 'Yellow Card', player = 'Fouler') {
  return { time: { elapsed: minute, extra: null }, team: { id: teamId }, player: { name: player }, type: 'Card', detail };
}

describe('calculateMomentum', () => {
  test('produces one window per 2-minute increment up to currentMinute', () => {
    const { windows } = calculateMomentum([], null, 10, TEAMS);
    expect(windows.map((w) => w.minute)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(WINDOW_MINUTES).toBe(2);
  });

  test('a home goal scores +10 in its window and produces a goal marker', () => {
    const { windows, markers } = calculateMomentum([goalEvent(34, 1, 'A. Grimaldo')], null, 40, TEAMS);
    const window = windows.find((w) => w.minute === 34);
    expect(window.home_score).toBe(10);
    expect(window.away_score).toBe(0);
    expect(markers).toEqual([{ minute: 34, type: 'goal', team: 'home', player: 'A. Grimaldo' }]);
  });

  test('an away goal only affects the away score, never the home score', () => {
    const { windows } = calculateMomentum([goalEvent(20, 2)], null, 20, TEAMS);
    const window = windows.find((w) => w.minute === 20);
    expect(window.away_score).toBe(10);
    expect(window.home_score).toBe(0);
  });

  test('a card against a team lowers only that team\'s window score', () => {
    const { windows } = calculateMomentum([cardEvent(52, 2)], null, 60, TEAMS);
    const window = windows.find((w) => w.minute === 52);
    expect(window.away_score).toBe(-2);
    expect(window.home_score).toBe(0);
  });

  test('only a red card produces a marker — a yellow affects score but not markers', () => {
    const events = [cardEvent(10, 1, 'Yellow Card'), cardEvent(52, 2, 'Red Card', 'D. Huijsen')];
    const { markers } = calculateMomentum(events, null, 60, TEAMS);
    expect(markers).toEqual([{ minute: 52, type: 'red_card', team: 'away', player: 'D. Huijsen' }]);
  });

  test('scores are clamped to [-10, 10] even with several events in one window', () => {
    const events = [goalEvent(10, 1), goalEvent(11, 1), goalEvent(10, 1, 'Another scorer')];
    const { windows } = calculateMomentum(events, null, 20, TEAMS);
    const window = windows.find((w) => w.minute === 10);
    expect(window.home_score).toBe(10); // 30 raw, clamped
  });

  test('an event for a team id that is neither home nor away is skipped, not guessed', () => {
    const events = [goalEvent(10, 999)];
    const { windows, markers } = calculateMomentum(events, null, 20, TEAMS);
    expect(windows.every((w) => w.home_score === 0 && w.away_score === 0)).toBe(true);
    expect(markers).toEqual([]);
  });

  test('a missed penalty is not counted as a goal', () => {
    const events = [{ time: { elapsed: 30, extra: null }, team: { id: 1 }, player: { name: 'X' }, type: 'Goal', detail: 'Missed Penalty' }];
    const { windows, markers } = calculateMomentum(events, null, 40, TEAMS);
    expect(windows.every((w) => w.home_score === 0)).toBe(true);
    expect(markers).toEqual([]);
  });

  test('markers are returned sorted by minute regardless of input order', () => {
    const events = [goalEvent(70, 1), cardEvent(10, 2, 'Red Card')];
    const { markers } = calculateMomentum(events, null, 80, TEAMS);
    expect(markers.map((m) => m.minute)).toEqual([10, 70]);
  });

  test('extra time is folded into the elapsed minute for window placement', () => {
    const event = { time: { elapsed: 90, extra: 3 }, team: { id: 1 }, player: { name: 'X' }, type: 'Goal', detail: 'Normal Goal' };
    const { windows, markers } = calculateMomentum([event], null, 93, TEAMS);
    expect(markers[0].minute).toBe(93);
    expect(windows.find((w) => w.minute === 92).home_score).toBe(10);
  });

  test('the statistics parameter is accepted but never influences the result', () => {
    const withStats = calculateMomentum([goalEvent(10, 1)], { some: 'aggregate totals' }, 20, TEAMS);
    const withoutStats = calculateMomentum([goalEvent(10, 1)], null, 20, TEAMS);
    expect(withStats).toEqual(withoutStats);
  });

  test('an empty event list produces flat, all-zero windows', () => {
    const { windows, markers } = calculateMomentum([], null, 6, TEAMS);
    expect(windows.every((w) => w.home_score === 0 && w.away_score === 0)).toBe(true);
    expect(markers).toEqual([]);
  });
});
