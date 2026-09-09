'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { getLeagueFlag } from '@/lib/leaguePriority';

// ── Props ─────────────────────────────────────────────────────────────────────

interface FavoritesSectionProps {
  /** Hide entirely (rather than showing the empty hint) when there are none. */
  hideWhenEmpty?: boolean;
  className?:     string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FavoritesSection({ hideWhenEmpty = false, className }: FavoritesSectionProps) {
  const leagues = useFavoritesStore((s) => s.favoriteLeagueDetails);
  const remove  = useFavoritesStore((s) => s.removeFavoriteLeague);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (leagues.length === 0 && hideWhenEmpty) return null;

  return (
    <section
      className={cn(
        'rounded-xl border border-border/60 bg-card/40 px-3 py-2.5',
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ⭐ Your Favorites
        </span>
        {leagues.length > 0 && (
          <span className="rounded-full bg-amber-500/15 text-amber-500 px-1.5 py-px text-[10px] font-bold leading-none">
            {leagues.length}
          </span>
        )}
      </div>

      {leagues.length === 0 ? (
        <p className="text-xs text-muted-foreground/70">
          Add leagues to favorites by clicking ★ on any league.
        </p>
      ) : (
        <div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {leagues.map((league) => (
            <div
              key={league.id}
              className={cn(
                'group flex items-center gap-1.5 rounded-full border border-border',
                'bg-card/70 pl-2.5 pr-1 py-1 text-xs font-medium whitespace-nowrap shrink-0',
              )}
            >
              <Link
                href={`/matches?league=${league.id}`}
                className="flex items-center gap-1.5 hover:text-amber-500 transition-colors"
              >
                <span className="text-sm leading-none" aria-hidden="true">
                  {league.flag ?? getLeagueFlag(league.id)}
                </span>
                <span>{league.name}</span>
              </Link>
              <button
                type="button"
                onClick={() => remove(league.id)}
                aria-label={`Remove ${league.name} from favorites`}
                className="rounded-full p-0.5 text-muted-foreground/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
