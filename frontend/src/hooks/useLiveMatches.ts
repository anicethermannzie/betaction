'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { matchApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { ApiFixture } from '@/types';

interface LiveScoreUpdate {
  fixtureId: number;
  home:      number | null;
  away:      number | null;
  elapsed:   number | null;
  status:    string;
}

/**
 * Fetches live matches on mount, polls every 30 s, and applies
 * real-time score updates from the Socket.io `live:score` event.
 */
export function useLiveMatches() {
  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Keep the latest list in a ref so the socket handler is never stale
  const fixturesRef = useRef<ApiFixture[]>([]);

  const fetchLive = useCallback(async () => {
    try {
      const { data } = await matchApi.live();
      const list: ApiFixture[] = Array.isArray(data?.response) ? data.response : [];
      fixturesRef.current = list;
      setFixtures(list);
    } catch {
      // keep showing previous data on transient errors
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 30 s polling
  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, 30_000);
    return () => clearInterval(id);
  }, [fetchLive]);

  // Real-time score patches via Socket.io
  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = (payload: LiveScoreUpdate) => {
      setFixtures((prev) => {
        const next = prev.map((f) =>
          f.fixture.id === payload.fixtureId
            ? {
                ...f,
                goals: { home: payload.home, away: payload.away },
                fixture: {
                  ...f.fixture,
                  status: {
                    ...f.fixture.status,
                    elapsed: payload.elapsed,
                    short:   payload.status,
                  },
                },
              }
            : f
        );
        fixturesRef.current = next;
        return next;
      });
    };

    socket.on('live:score', handleUpdate);
    return () => { socket.off('live:score', handleUpdate); };
  }, []);

  return { fixtures, loading };
}
