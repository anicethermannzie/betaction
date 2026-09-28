'use strict';

/**
 * Match momentum — built only from real, timestamped events.
 *
 * IMPORTANT — a deliberate scope decision, not an oversight:
 *
 * SofaScore's momentum chart is driven by shot-by-shot, second-by-second
 * tracking data from a proprietary live-match feed. API-Football's
 * `/fixtures/events` endpoint only carries a timestamp for four event types —
 * Goal, Card, Subst, Var — nothing else. Its `/fixtures/statistics` endpoint
 * (shots on/off target, dangerous attacks, corners) returns match-TOTAL
 * aggregates only: "5 shots on goal" for the whole match so far, never "a shot
 * on goal in minute 34". There is no way to place those counts on the minute
 * axis without inventing *when* each one happened — the same class of
 * fabrication this codebase deliberately removed everywhere else (see
 * docs/PRODUCTION_READINESS_AUDIT.md). Spreading a match-total evenly or
 * randomly across the elapsed minutes would produce a chart that looks like
 * real shot-momentum but isn't.
 *
 * So this calculator scores only what carries a real minute: goals and cards.
 * `statistics` is still accepted (kept in the function signature so a future
 * data source that does carry timed shot/corner events can be wired in
 * without an API change), but it is NOT distributed into per-window scores.
 * The result is sparser than SofaScore's — flat between goals/cards rather
 * than a continuously undulating line — but every point on it corresponds to
 * something that actually happened at that minute.
 */

const WINDOW_MINUTES = 2;
const POINTS = {
  GOAL: 10,
  CARD_AGAINST: -2,
};
const CLAMP = 10;

/**
 * @param {Array<object>} events - raw API-Football fixture events
 *   ({ time: { elapsed, extra }, team, player, assist, type, detail, comments })
 * @param {object} [statistics] - accepted for signature stability; unused —
 *   see file header.
 * @param {number} currentMinute - elapsed minute to build the chart up to
 *   (typically the live match's current minute, or the final minute for a
 *   finished match).
 * @param {{ homeTeamId: number, awayTeamId: number }} teams - which side each
 *   event's team id belongs to, since API-Football events carry team id/name
 *   but not a home/away flag.
 * @returns {{ windows: Array<{minute:number, home_score:number, away_score:number}>,
 *             markers: Array<{minute:number, type:string, team:'home'|'away', player:string|null}> }}
 */
function calculateMomentum(events, statistics, currentMinute, teams) {
  void statistics; // see file header — deliberately not used

  const lastMinute = Math.max(
    0,
    Number.isFinite(currentMinute) ? currentMinute : 0,
    ...(events || []).map((e) => (e?.time?.elapsed ?? 0) + (e?.time?.extra ?? 0))
  );
  const windowCount = Math.floor(lastMinute / WINDOW_MINUTES) + 1;

  const windows = Array.from({ length: windowCount }, (_, i) => ({
    minute: i * WINDOW_MINUTES,
    home_score: 0,
    away_score: 0,
  }));

  const markers = [];

  for (const event of events || []) {
    const minute = (event?.time?.elapsed ?? 0) + (event?.time?.extra ?? 0);
    const windowIndex = Math.min(Math.floor(minute / WINDOW_MINUTES), windows.length - 1);
    if (windowIndex < 0) continue;

    const teamId = event?.team?.id;
    const side = teamId === teams?.homeTeamId ? 'home'
      : teamId === teams?.awayTeamId ? 'away'
        : null;
    if (!side) continue; // an event we can't attribute to either side is skipped, not guessed

    const type = (event?.type || '').toLowerCase();
    const detail = (event?.detail || '').toLowerCase();
    const window = windows[windowIndex];

    if (type === 'goal' && detail !== 'missed penalty') {
      window[`${side}_score`] += POINTS.GOAL;
      markers.push({
        minute,
        type: 'goal',
        team: side,
        player: event?.player?.name ?? null,
      });
    } else if (type === 'card') {
      window[`${side}_score`] += POINTS.CARD_AGAINST;
      if (detail.includes('red')) {
        markers.push({
          minute,
          type: 'red_card',
          team: side,
          player: event?.player?.name ?? null,
        });
      }
    }
  }

  for (const window of windows) {
    window.home_score = clamp(window.home_score);
    window.away_score = clamp(window.away_score);
  }

  markers.sort((a, b) => a.minute - b.minute);

  return { windows, markers };
}

function clamp(value) {
  return Math.max(-CLAMP, Math.min(CLAMP, value));
}

module.exports = { calculateMomentum, WINDOW_MINUTES };
