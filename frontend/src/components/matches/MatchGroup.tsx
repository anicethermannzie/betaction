'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

import { MatchCard }           from './MatchCard';
import { cn, isMatchInProgress } from '@/lib/utils';
import type { ApiFixture, ApiLeague, Prediction } from '@/types';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MatchGroupProps {
  league:       ApiLeague;
  fixtures:     ApiFixture[];
  collapsible?: boolean;
  defaultOpen?: boolean;
  predictions?: Map<number, Prediction>;
  className?:   string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MatchGroup({
  league,
  fixtures,
  collapsible  = true,
  defaultOpen  = true,
  predictions,
  className,
}: MatchGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const hasLive = fixtures.some((f) => isMatchInProgress(f.fixture.status.short));

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden',
        hasLive ? 'border-red-500/25 border-l-2 border-l-red-500' : 'border-border/60',
        className
      )}
    >
      {/* ── League header ── */}
      <button
        type="button"
        aria-expanded={open}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 text-left',
          'hover:bg-muted/30 transition-colors',
          hasLive ? 'bg-red-950/15' : 'bg-muted/20',
          !collapsible && 'cursor-default pointer-events-none'
        )}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        {/* League logo */}
        {league.logo ? (
          <Image
            src={league.logo}
            alt={league.name}
            width={18}
            height={18}
            className="object-contain shrink-0 opacity-90"
          />
        ) : (
          <div className="h-4 w-4 rounded-full bg-muted shrink-0" />
        )}

        {/* Name + country */}
        <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
          <span className="text-sm font-semibold truncate">{league.name}</span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline truncate">
            {league.country}
          </span>
        </div>

        {/* Live indicator */}
        {hasLive && (
          <span className="relative flex h-1.5 w-1.5 shrink-0" aria-label="Live">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
        )}

        {/* Match count */}
        <span className="text-[11px] text-muted-foreground shrink-0">
          {fixtures.length}
        </span>

        {/* Chevron */}
        {collapsible && (
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* ── Fixtures ── */}
      {open && (
        <div className="divide-y divide-border/40">
          {fixtures.map((f) => (
            <MatchCard
              key={f.fixture.id}
              fixture={f}
              prediction={predictions?.get(f.fixture.id)}
              className="rounded-none border-0 shadow-none"
            />
          ))}
        </div>
      )}
    </div>
  );
}
