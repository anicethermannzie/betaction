'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn, formatTime, isMatchLive, isMatchFinished, getMatchStatusLabel } from '@/lib/utils';
import { LiveBadge } from './LiveBadge';
import { Card } from '@/components/ui/card';
import type { ApiFixture } from '@/types';

interface MatchCardProps {
  fixture: ApiFixture;
  className?: string;
}

export function MatchCard({ fixture, className }: MatchCardProps) {
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
            <div className="flex items-center gap-2">
              {league.logo && (
                <Image
                  src={league.logo}
                  alt={league.name}
                  width={16}
                  height={16}
                  className="object-contain opacity-80"
                />
              )}
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {league.name}
              </span>
            </div>

            {live ? (
              <LiveBadge elapsed={f.status.elapsed} />
            ) : (
              <span className={cn(
                'text-xs font-medium',
                finished ? 'text-muted-foreground' : 'text-foreground'
              )}>
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
              <span className={cn(
                'text-sm font-medium truncate',
                hasScore && goals.home! > goals.away! ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {teams.home.name}
              </span>
            </div>

            {/* Score */}
            <div className={cn(
              'text-lg font-bold tabular-nums shrink-0 min-w-[48px] text-center',
              live ? 'text-primary' : 'text-foreground'
            )}>
              {hasScore ? `${goals.home} - ${goals.away}` : 'vs'}
            </div>

            {/* Away */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className={cn(
                'text-sm font-medium truncate',
                hasScore && goals.away! > goals.home! ? 'text-foreground' : 'text-muted-foreground'
              )}>
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

          {/* Status bar for live */}
          {live && (
            <div className="mt-2 flex justify-center">
              <span className="text-[11px] text-red-400 font-medium">
                {getMatchStatusLabel(f.status.short, f.status.elapsed)}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
