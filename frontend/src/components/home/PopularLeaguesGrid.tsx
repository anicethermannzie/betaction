'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import {
  TIER_1_POPULAR,
  TIER_2_EUROPEAN,
  getLeagueFlag,
  type PriorityLeague,
} from '@/lib/leaguePriority';
import type { League } from '@/types';

// Tier 1 first, then the UEFA club competitions.
const LEAGUE_CARDS: PriorityLeague[] = [...TIER_1_POPULAR, ...TIER_2_EUROPEAN];

// ── "Your Leagues" — favorited leagues, shown above Popular Leagues ──────────

function YourLeaguesRow() {
  const leagues = useFavoritesStore((s) => s.favoriteLeagueDetails);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || leagues.length === 0) return null;

  return (
    <section>
      <h2 className="section-title mb-4">⭐ Your Leagues</h2>

      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {leagues.map((league) => (
          <Link
            key={league.id}
            href={`/matches?league=${league.id}`}
            className={cn(
              'group flex w-44 shrink-0 items-center gap-3 rounded-xl border border-border bg-card p-4',
              'hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-200',
            )}
          >
            <span className="text-3xl leading-none shrink-0" role="img" aria-label={league.country ?? league.name}>
              {league.flag ?? getLeagueFlag(league.id)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate leading-tight group-hover:text-amber-500 transition-colors">
                {league.name}
              </p>
              {league.country && (
                <p className="text-xs text-muted-foreground truncate">{league.country}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Popular Leagues grid ────────────────────────────────────────────────────

export function PopularLeaguesGrid() {
  return (
    <div className="space-y-10">
      <YourLeaguesRow />

      <section>
        <h2 className="section-title mb-4">Popular Leagues</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {LEAGUE_CARDS.map((league) => (
            <div
              key={league.id}
              className="group relative flex items-center gap-3 rounded-xl border border-border bg-card p-4
                         hover:border-primary/50 hover:bg-primary/5 hover-glow
                         transition-all duration-200"
            >
              <Link
                href={`/leagues/${league.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                {/* Flag */}
                <span
                  className="text-3xl leading-none shrink-0"
                  role="img"
                  aria-label={league.country}
                >
                  {league.flag}
                </span>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">
                    {league.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{league.country}</p>
                </div>
              </Link>

              {/* Favorite toggle */}
              <FavoriteButton
                type="league"
                id={league.id}
                data={{
                  id:      league.id,
                  name:    league.name,
                  country: league.country,
                  flag:    league.flag,
                } as League}
                size="sm"
              />

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
