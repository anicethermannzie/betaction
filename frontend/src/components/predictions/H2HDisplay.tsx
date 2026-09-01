'use client';

import { cn } from '@/lib/utils';
import type { H2HMatch } from '@/types';

// ── Props ─────────────────────────────────────────────────────────────────────

interface H2HDisplayProps {
  homeTeam:   string;
  awayTeam:   string;
  h2h:        H2HMatch[];
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function H2HDisplay({ homeTeam, awayTeam, h2h, className }: H2HDisplayProps) {
  // Calculate results from the perspective of homeTeam
  let homeWins = 0;
  let awayWins = 0;
  let draws    = 0;

  for (const m of h2h) {
    if (m.homeGoals === m.awayGoals) {
      draws++;
    } else {
      // Which team won?
      const homeTeamWasHome  = m.homeTeam === homeTeam;
      const homeTeamWasAway  = m.awayTeam === homeTeam;
      const matchWonByHome   = m.homeGoals > m.awayGoals;

      if ((homeTeamWasHome && matchWonByHome) || (homeTeamWasAway && !matchWonByHome)) {
        homeWins++;
      } else {
        awayWins++;
      }
    }
  }

  const total  = h2h.length || 1;
  const homeW  = (homeWins / total) * 100;
  const drawW  = (draws    / total) * 100;
  const awayW  = (awayWins / total) * 100;

  return (
    <div className={cn('space-y-5', className)}>
      {/* Summary — 3 columns */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="num text-2xl font-bold text-primary">{homeWins}</p>
          <p className="label mt-1 truncate">{homeTeam}</p>
        </div>
        <div>
          <p className="num text-2xl font-bold text-muted-foreground">{draws}</p>
          <p className="label mt-1">Draws</p>
        </div>
        <div>
          <p className="num text-2xl font-bold text-down">{awayWins}</p>
          <p className="label mt-1 truncate">{awayTeam}</p>
        </div>
      </div>

      {/* Stacked ratio bar — abutting, hard edges */}
      <div className="stat-bar h-2 flex">
        <div className="bg-primary h-full" style={{ width: `${homeW}%` }} />
        <div className="bg-hold h-full"    style={{ width: `${drawW}%` }} />
        <div className="bg-down h-full"    style={{ width: `${awayW}%` }} />
      </div>

      {/* Meeting history */}
      <div className="space-y-2">
        {h2h.slice(0, 5).map((m, i) => {
          const isHomeTeamHome = m.homeTeam === homeTeam;
          const isDraw         = m.homeGoals === m.awayGoals;
          const homeWon        = m.homeGoals > m.awayGoals;
          const homeTeamWon    = isHomeTeamHome ? homeWon : !homeWon;

          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 text-xs py-1.5 px-2.5 border-l-2 bg-card',
                homeTeamWon ? 'border-l-primary' : isDraw ? 'border-l-hold' : 'border-l-down'
              )}
            >
              {/* Date */}
              <span className="num text-muted-foreground shrink-0 text-[10px]">
                {m.date.slice(0, 7)}
              </span>

              {/* Competition */}
              <span className="text-muted-foreground/60 text-[10px] shrink-0 hidden sm:inline truncate max-w-[80px]">
                {m.competition}
              </span>

              {/* Score */}
              <span className="flex-1 text-center">
                <span className={cn(homeWon ? 'text-foreground' : 'text-muted-foreground')}>
                  {m.homeTeam}
                </span>
                <span className="num text-muted-foreground mx-1.5">
                  {m.homeGoals}:{m.awayGoals}
                </span>
                <span className={cn(!homeWon && !isDraw ? 'text-foreground' : 'text-muted-foreground')}>
                  {m.awayTeam}
                </span>
              </span>

              {/* Result indicator */}
              <span className={cn(
                'num shrink-0 text-[10px] font-bold',
                homeTeamWon ? 'text-primary' : isDraw ? 'text-hold' : 'text-down'
              )}>
                {isDraw ? 'D' : homeTeamWon ? 'W' : 'L'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
