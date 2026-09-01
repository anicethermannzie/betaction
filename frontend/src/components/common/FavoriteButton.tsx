'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { League, Team } from '@/types';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FavoriteButtonProps {
  type:       'league' | 'team';
  id:         number;
  data:       League | Team;
  size?:      'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ICON_PX = { sm: 16, md: 20, lg: 24 } as const;
const HIT_PX  = { sm: 'h-6 w-6', md: 'h-8 w-8', lg: 'h-9 w-9' } as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function FavoriteButton({
  type,
  id,
  data,
  size = 'md',
  showLabel = false,
  className,
}: FavoriteButtonProps) {
  const toggleLeague = useFavoritesStore((s) => s.toggleFavoriteLeague);
  const toggleTeam   = useFavoritesStore((s) => s.toggleFavoriteTeam);
  const leagueIds    = useFavoritesStore((s) => s.favoriteLeagues);
  const teamIds      = useFavoritesStore((s) => s.favoriteTeams);

  // Avoid a hydration mismatch: persisted state only exists client-side, so
  // render the neutral (not-favorited) look until after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [pulse, setPulse] = useState(false);
  const pulseTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(pulseTimer.current), []);

  const isFav =
    mounted && (type === 'league' ? leagueIds.includes(id) : teamIds.includes(id));

  const handleClick = (e: MouseEvent) => {
    // These buttons live inside clickable rows / links — don't trigger those.
    e.preventDefault();
    e.stopPropagation();

    if (type === 'league') toggleLeague(id, data as League);
    else                   toggleTeam(id, data as Team);

    setPulse(true);
    clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulse(false), 200);
  };

  const label = isFav ? 'Remove from favorites' : 'Add to favorites';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          aria-pressed={isFav}
          aria-label={label}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-full',
            'transition-colors duration-200 shrink-0',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
            HIT_PX[size],
            showLabel && 'w-auto px-2',
            isFav
              ? 'text-amber-500 hover:text-amber-400'
              : 'text-muted-foreground/50 hover:text-amber-500',
            className,
          )}
        >
          <Star
            size={ICON_PX[size]}
            strokeWidth={2}
            className={cn(
              'transition-transform duration-200 ease-out',
              isFav && 'fill-current',
              pulse && 'scale-125',
            )}
          />
          {showLabel && (
            <span className="text-xs font-medium whitespace-nowrap">
              {isFav ? 'Favorited' : 'Favorite'}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
