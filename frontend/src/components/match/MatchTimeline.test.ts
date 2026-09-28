import { describe, expect, it } from 'vitest';
import { buildTimeline } from './MatchTimeline';
import type { ApiEvent } from '@/types';

function event(overrides: {
  elapsed: number;
  extra?: number | null;
  type: string;
  detail?: string;
  team?: ApiEvent['team'];
  player?: ApiEvent['player'];
  assist?: ApiEvent['assist'];
}): ApiEvent {
  const { elapsed, extra = null, type, detail = '', team, player, assist } = overrides;
  return {
    time: { elapsed, extra },
    team: team ?? { id: 1, name: 'Team A' },
    player: player ?? { id: 1, name: 'Player' },
    assist: assist ?? { id: null, name: null },
    type,
    detail,
  };
}

describe('buildTimeline', () => {
  it('returns events most-recent-first', () => {
    const events = [
      event({ elapsed: 10, type: 'Goal' }),
      event({ elapsed: 70, type: 'Goal' }),
      event({ elapsed: 40, type: 'Goal' }),
    ];

    const timeline = buildTimeline(events);

    expect(timeline.map((t) => t.minute)).toEqual([70, 40, 10]);
  });

  it('assigns minute <= 45 to the first half and everything after to the second', () => {
    const events = [event({ elapsed: 45, type: 'Goal' }), event({ elapsed: 46, type: 'Goal' })];
    const timeline = buildTimeline(events);

    expect(timeline.find((t) => t.minute === 45)?.half).toBe(1);
    expect(timeline.find((t) => t.minute === 46)?.half).toBe(2);
  });

  it('folds extra time into the minute used for sorting and half assignment', () => {
    const events = [event({ elapsed: 90, extra: 3, type: 'Goal' })];
    const timeline = buildTimeline(events);

    expect(timeline[0].minute).toBe(93);
    expect(timeline[0].half).toBe(2);
  });

  it('tallies the running score across goals in chronological order', () => {
    const events = [
      event({ elapsed: 10, type: 'Goal', team: { id: 1, name: 'Home' } }),
      event({ elapsed: 30, type: 'Goal', team: { id: 2, name: 'Away' } }),
      event({ elapsed: 60, type: 'Goal', team: { id: 1, name: 'Home' } }),
    ];

    const timeline = buildTimeline(events);

    // Newest first: the minute-60 goal should show the final 2-1 score.
    expect(timeline[0]).toMatchObject({ minute: 60, scoreAfter: { home: 2, away: 1 } });
    expect(timeline[1]).toMatchObject({ minute: 30, scoreAfter: { home: 1, away: 1 } });
    expect(timeline[2]).toMatchObject({ minute: 10, scoreAfter: { home: 1, away: 0 } });
  });

  it('does not count a missed penalty as a goal', () => {
    const events = [event({ elapsed: 30, type: 'Goal', detail: 'Missed Penalty' })];
    const timeline = buildTimeline(events);

    expect(timeline[0].scoreAfter).toEqual({ home: 0, away: 0 });
  });

  it('a card does not change the score', () => {
    const events = [
      event({ elapsed: 10, type: 'Goal' }),
      event({ elapsed: 20, type: 'Card', detail: 'Yellow Card' }),
    ];
    const timeline = buildTimeline(events);

    expect(timeline[0].scoreAfter).toEqual({ home: 1, away: 0 }); // the card
    expect(timeline[1].scoreAfter).toEqual({ home: 1, away: 0 }); // the goal
  });

  it('produces a stable, unique key per event even with identical minutes', () => {
    const events = [
      event({ elapsed: 10, type: 'Goal', player: { id: 1, name: 'A' } }),
      event({ elapsed: 10, type: 'Goal', player: { id: 2, name: 'B' } }),
    ];
    const timeline = buildTimeline(events);

    expect(new Set(timeline.map((t) => t.key)).size).toBe(2);
  });

  it('returns an empty timeline for no events', () => {
    expect(buildTimeline([])).toEqual([]);
  });
});
