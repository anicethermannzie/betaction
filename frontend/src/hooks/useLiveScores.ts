'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useMatchStore } from '@/stores/matchStore';

interface LiveScorePayload {
  fixtureId: number;
  home:      number | null;
  away:      number | null;
  elapsed:   number | null;
  status:    string;
}

/**
 * Subscribes to live score updates for a specific match room.
 * Pass `fixtureId` to subscribe to `match:<fixtureId>`.
 * Pass `null` to only set up a global live-score listener without joining a room.
 */
export function useLiveScores(fixtureId: number | null) {
  const updateLiveScore = useMatchStore((s) => s.updateLiveScore);
  const subscribedRef   = useRef<number | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleLiveScore = (payload: LiveScorePayload) => {
      updateLiveScore(
        payload.fixtureId,
        payload.home,
        payload.away,
        payload.elapsed,
        payload.status
      );
    };

    socket.on('live:score', handleLiveScore);

    if (fixtureId !== null && subscribedRef.current !== fixtureId) {
      if (subscribedRef.current !== null) {
        socket.emit('unsubscribe:match', { fixtureId: subscribedRef.current });
      }
      socket.emit('subscribe:match', { fixtureId });
      subscribedRef.current = fixtureId;
    }

    return () => {
      socket.off('live:score', handleLiveScore);
      if (subscribedRef.current !== null) {
        socket.emit('unsubscribe:match', { fixtureId: subscribedRef.current });
        subscribedRef.current = null;
      }
    };
  }, [fixtureId, updateLiveScore]);
}

/**
 * Subscribes to all live score events for a given league.
 */
export function useLiveLeagueScores(leagueId: number) {
  const updateLiveScore = useMatchStore((s) => s.updateLiveScore);

  useEffect(() => {
    const socket = getSocket();

    const handleLiveScore = (payload: LiveScorePayload) => {
      updateLiveScore(
        payload.fixtureId,
        payload.home,
        payload.away,
        payload.elapsed,
        payload.status
      );
    };

    socket.on('live:score', handleLiveScore);
    socket.emit('subscribe:league', { leagueId });

    return () => {
      socket.off('live:score', handleLiveScore);
      socket.emit('unsubscribe:league', { leagueId });
    };
  }, [leagueId, updateLiveScore]);
}
