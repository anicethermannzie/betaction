'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { matchApi } from '@/lib/api';
import { toAmerican } from '@/lib/markets';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { Skeleton } from '@/components/ui/skeleton';
import type { LiveOdds, OddsMovementDirection } from '@/types';

const POLL_INTERVAL_MS = 15_000;
const FLASH_MS = 1200;

interface LiveOddsBarProps {
  fixtureId: number;
  isLive: boolean;
  homeTeam: string;
  awayTeam: string;
  /** Optional — lets the parent page jump to the full markets grid, which
   * already exists further down the Details tab. */
  onViewAllOdds?: () => void;
}

function MovementIndicator({ direction }: { direction: OddsMovementDirection }) {
  if (direction === 'up') return <ChevronUp className="h-3 w-3 text-primary" aria-label="odds increased" />;
  if (direction === 'down') return <ChevronDown className="h-3 w-3 text-down" aria-label="odds decreased" />;
  return <Minus className="h-3 w-3 text-muted-foreground/30" aria-label="odds stable" />;
}

function OddsBox({
  label, value, decimalMode, direction, flashing,
}: {
  label: string; value: number; decimalMode: boolean; direction: OddsMovementDirection; flashing: boolean;
}) {
  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center justify-center gap-1 rounded-lg border p-3 transition-colors duration-500',
        flashing && direction === 'up' && 'bg-primary/10 border-primary/40',
        flashing && direction === 'down' && 'bg-down/10 border-down/40',
        !flashing && 'bg-card border-border'
      )}
    >
      <span className="label text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="num text-base font-bold text-foreground">
          {decimalMode ? value.toFixed(2) : toAmerican(value)}
        </span>
        <MovementIndicator direction={direction} />
      </div>
    </div>
  );
}

export function LiveOddsBar({ fixtureId, isLive, homeTeam, awayTeam, onViewAllOdds }: LiveOddsBarProps) {
  const [odds, setOdds] = useState<LiveOdds | null>(null);
  const [decimalMode, setDecimalMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      matchApi.liveOdds(fixtureId, isLive)
        .then(({ data }) => {
          if (cancelled) return;
          const next = data as LiveOdds;
          setOdds((prev) => {
            const changed = prev && (
              prev.home_odds !== next.home_odds
              || prev.draw_odds !== next.draw_odds
              || prev.away_odds !== next.away_odds
            );
            if (changed) {
              setFlashing(true);
              if (flashTimeout.current) clearTimeout(flashTimeout.current);
              flashTimeout.current = setTimeout(() => { if (!cancelled) setFlashing(false); }, FLASH_MS);
            }
            return next;
          });
          setUnavailable(false);
        })
        .catch((err) => {
          if (cancelled) return;
          // No bookmaker has priced this match yet — a real, unremarkable
          // state (common for fixtures well before kickoff), not an error to
          // alarm over.
          logger.debug('Live odds unavailable', { fixtureId, error: String(err) });
          setUnavailable(true);
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    // See MomentumChart.tsx's comment on the same pattern: no synchronous
    // setLoading(true) here — the parent mounts this with key={fixtureId} so
    // a match change remounts (and resets) it cleanly instead.
    load();

    if (!isLive) return () => { cancelled = true; };

    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
    };
  }, [fixtureId, isLive]);

  if (loading) {
    return (
      <div className="flex gap-2">
        <Skeleton className="h-16 flex-1" />
        <Skeleton className="h-16 flex-1" />
        <Skeleton className="h-16 flex-1" />
      </div>
    );
  }

  if (unavailable || !odds) return null; // not an error state worth a whole card — just omitted

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Live Odds</h3>
        <div className="flex bg-card rounded-lg p-0.5 border border-border">
          <button
            type="button"
            onClick={() => setDecimalMode(false)}
            className={cn('px-2 py-0.5 rounded label transition-colors', !decimalMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
          >
            US
          </button>
          <button
            type="button"
            onClick={() => setDecimalMode(true)}
            className={cn('px-2 py-0.5 rounded label transition-colors', decimalMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
          >
            Dec
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <OddsBox label={`1 · ${homeTeam}`} value={odds.home_odds} decimalMode={decimalMode} direction={odds.movement.home} flashing={flashing} />
        <OddsBox label="X · Draw" value={odds.draw_odds} decimalMode={decimalMode} direction={odds.movement.draw} flashing={flashing} />
        <OddsBox label={`2 · ${awayTeam}`} value={odds.away_odds} decimalMode={decimalMode} direction={odds.movement.away} flashing={flashing} />
      </div>

      {onViewAllOdds && (
        <button
          type="button"
          onClick={onViewAllOdds}
          className="text-xs text-primary hover:underline"
        >
          Additional odds →
        </button>
      )}
    </div>
  );
}
