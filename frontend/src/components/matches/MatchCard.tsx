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

const COUNTRY_FLAGS: Record<string, string> = {
  'Panama': '🇵🇦',
  'Dominican Republic': '🇩🇴',
  'Dominican Rep.': '🇩🇴',
  'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'USA': '🇺🇸',
  'Mexico': '🇲🇽',
  'Nigeria': '🇳🇬',
  'Ghana': '🇬🇭',
};

const INTL_LEAGUE_IDS = [1, 4, 9, 6, 7, 5, 8, 32, 33, 34, 35, 36, 481, 10];

interface MatchCardProps {
  fixture:     ApiFixture;
  /** Optional: renders the market readout at the bottom of the card */
  prediction?: Prediction;
  className?:  string;
}

export function MatchCard({ fixture, prediction, className }: MatchCardProps) {
  const { fixture: f, league, teams, goals } = fixture;
  const live     = isMatchLive(f.status.short);
  const finished = isMatchFinished(f.status.short);
  const hasScore = goals.home !== null && goals.away !== null;
  const isIntl   = INTL_LEAGUE_IDS.includes(league.id) || (fixture as any).competition_type === 'international';

  return (
    <Link href={`/predictions/${f.id}`}>
      <Card
        className={cn(
          'cursor-pointer transition-colors duration-150 hover:border-muted-foreground/30 hover:bg-[hsl(var(--panel-raised))]',
          live && 'border-l-2 border-l-down',
          className
        )}
      >
        <div className="p-3.5">
          {/* League row */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {league.logo && (
                <Image
                  src={league.logo}
                  alt={league.name}
                  width={14}
                  height={14}
                  className="object-contain opacity-70 shrink-0"
                />
              )}
              <span className="label truncate">{league.name}</span>
            </div>

            {live ? (
              <LiveBadge elapsed={f.status.elapsed} />
            ) : (
              <span
                className={cn(
                  'num text-[11px] shrink-0',
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
                  width={22}
                  height={22}
                  className="object-contain shrink-0"
                />
              )}
              <span
                className={cn(
                  'text-[13px] truncate flex items-center gap-1',
                  hasScore && goals.home! > goals.away!
                    ? 'text-foreground font-semibold'
                    : 'text-foreground/85'
                )}
              >
                {isIntl && COUNTRY_FLAGS[teams.home.name] && (
                  <span className="text-sm shrink-0 mr-0.5 leading-none">{COUNTRY_FLAGS[teams.home.name]}</span>
                )}
                {teams.home.name}
              </span>
            </div>

            {/* Score */}
            <div
              className={cn(
                'num text-base font-semibold shrink-0 min-w-[46px] text-center',
                live ? 'text-primary' : hasScore ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {hasScore ? `${goals.home} : ${goals.away}` : 'v'}
            </div>

            {/* Away */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span
                className={cn(
                  'text-[13px] truncate flex items-center gap-1 text-right',
                  hasScore && goals.away! > goals.home!
                    ? 'text-foreground font-semibold'
                    : 'text-foreground/85'
                )}
              >
                {teams.away.name}
                {isIntl && COUNTRY_FLAGS[teams.away.name] && (
                  <span className="text-sm shrink-0 ml-0.5 leading-none">{COUNTRY_FLAGS[teams.away.name]}</span>
                )}
              </span>
              {teams.away.logo && (
                <Image
                  src={teams.away.logo}
                  alt={teams.away.name}
                  width={22}
                  height={22}
                  className="object-contain shrink-0"
                />
              )}
            </div>
          </div>

          {/* Live status label */}
          {live && (
            <div className="mt-1.5 flex justify-center">
              <span className="num text-[10px] text-down">
                {getMatchStatusLabel(f.status.short, f.status.elapsed)}
              </span>
            </div>
          )}

          {/* ── Market readout ── rendered only when a prediction is passed */}
          {prediction && (
            <div className="mt-3 border-t border-border pt-2.5 space-y-1.5">
              {/* Three abutting probability segments — hard edges */}
              <div className="stat-bar flex">
                <div className="bg-primary" style={{ width: `${prediction.home_win * 100}%` }} />
                <div className="bg-hold"    style={{ width: `${prediction.draw * 100}%` }} />
                <div className="bg-down"    style={{ width: `${prediction.away_win * 100}%` }} />
              </div>

              <div className="flex justify-between">
                <span className="num text-[10px] text-primary">{formatProbability(prediction.home_win)}</span>
                <span className="num text-[10px] text-muted-foreground">
                  <span className="text-muted-foreground/50">X</span> {formatProbability(prediction.draw)}
                </span>
                <span className="num text-[10px] text-down">{formatProbability(prediction.away_win)}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
