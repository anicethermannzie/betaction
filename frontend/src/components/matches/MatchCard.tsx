'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  cn,
  formatTime,
  formatProbability,
  isMatchLive,
  isMatchFinished,
  getMatchStatusLabel,
} from '@/lib/utils';
import { LiveBadge } from './LiveBadge';
import { Card } from '@/components/ui/card';
import type { ApiFixture, Prediction } from '@/types';

interface MatchCardProps {
  fixture:     ApiFixture;
  /** Optional: renders a prediction probability bar at the bottom of the card */
  prediction?: Prediction;
  className?:  string;
}

export function MatchCard({ fixture, prediction, className }: MatchCardProps) {
  const { fixture: f, league, teams, goals } = fixture;
  const live     = isMatchLive(f.status.short);
  const finished = isMatchFinished(f.status.short);
  const hasScore = goals.home !== null && goals.away !== null;

  return (
    <Link href={`/predictions/${f.id}`}>
      <Card
        className={cn(
          'hover-glow cursor-pointer transition-all duration-200 hover:border-primary/50',
          live && 'border-red-500/30 bg-red-950/10',
          className
        )}
      >
        <div className="p-4">
          {/* League row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {league.logo && (
                <Image
                  src={league.logo}
                  alt={league.name}
                  width={16}
                  height={16}
                  className="object-contain opacity-80 shrink-0"
                />
              )}
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {league.name}
              </span>
            </div>

            {live ? (
              <LiveBadge elapsed={f.status.elapsed} />
            ) : (
              <span
                className={cn(
                  'text-xs font-medium shrink-0',
                  finished ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {finished ? 'FT' : formatTime(f.date)}
              </span>
            )}
          </div>

          {/* Teams + Score */}
          <div className="flex items-center gap-3">
            {/* Home */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {teams.home.logo && (
                <Image
                  src={teams.home.logo}
                  alt={teams.home.name}
                  width={24}
                  height={24}
                  className="object-contain shrink-0"
                />
              )}
              <span
                className={cn(
                  'text-sm font-medium truncate',
                  hasScore && goals.home! > goals.away!
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {teams.home.name}
              </span>
            </div>

            {/* Score */}
            <div
              className={cn(
                'text-lg font-bold tabular-nums shrink-0 min-w-[48px] text-center',
                live ? 'text-primary' : 'text-foreground'
              )}
            >
              {hasScore ? `${goals.home} - ${goals.away}` : 'vs'}
            </div>

            {/* Away */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span
                className={cn(
                  'text-sm font-medium truncate',
                  hasScore && goals.away! > goals.home!
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {teams.away.name}
              </span>
              {teams.away.logo && (
                <Image
                  src={teams.away.logo}
                  alt={teams.away.name}
                  width={24}
                  height={24}
                  className="object-contain shrink-0"
                />
              )}
            </div>
          </div>

          {/* Live status label */}
          {live && (
            <div className="mt-2 flex justify-center">
              <span className="text-[11px] text-red-400 font-medium">
                {getMatchStatusLabel(f.status.short, f.status.elapsed)}
              </span>
            </div>
          )}

          {/* Prediction probability bar ── only rendered when prediction is passed */}
          {prediction && (
            <div className="mt-3 space-y-1">
              {/* Tri-color bar */}
              <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                <div
                  className="bg-emerald-500 rounded-l-full"
                  style={{ width: `${prediction.home_win * 100}%` }}
                />
                <div
                  className="bg-amber-400"
                  style={{ width: `${prediction.draw * 100}%` }}
                />
                <div
                  className="bg-red-400 rounded-r-full"
                  style={{ width: `${prediction.away_win * 100}%` }}
                />
              </div>

              {/* Probability labels */}
              <div className="flex justify-between text-[10px] text-muted-foreground/70">
                <span>{formatProbability(prediction.home_win)}</span>
                <span>Draw {formatProbability(prediction.draw)}</span>
                <span>{formatProbability(prediction.away_win)}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
