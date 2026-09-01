'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useFavoritesStore } from '@/stores/favoritesStore';
import {
  TIER_1_POPULAR,
  TIER_2_EUROPEAN,
  TIER_3_EURO_CLUBS,
  getLeagueFlag,
  type PriorityLeague,
} from '@/lib/leaguePriority';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import type { League } from '@/types';

// ── One league row ───────────────────────────────────────────────────────────

interface LeagueRowProps {
  id:       number;
  name:     string;
  country?: string;
  flag:     string;
}

function LeagueRow({ id, name, country, flag }: LeagueRowProps) {
  const pathname = usePathname();
  const href = `/leagues/${id}`;
  const active = pathname === href;

  const isFav = useFavoritesStore((s) => s.favoriteLeagues.includes(id));

  return (
    <div
      className={cn(
        'group relative flex items-center rounded-md pr-1 transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        active
          ? 'bg-accent text-accent-foreground border-l-2 border-l-emerald-500'
          : 'text-muted-foreground border-l-2 border-l-transparent',
      )}
    >
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-sm font-medium">
        <span className="text-lg leading-none shrink-0" role="img" aria-label={country ?? name}>
          {flag}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{name}</span>
          {country && (
            <span className="text-[11px] text-muted-foreground truncate">{country}</span>
          )}
        </div>
      </Link>

      {/* Revealed on hover; stays visible while the league is favorited. */}
      <div
        className={cn(
          'transition-opacity focus-within:opacity-100 group-hover:opacity-100',
          isFav ? 'opacity-100' : 'opacity-0',
        )}
      >
        <FavoriteButton
          type="league"
          id={id}
          data={{ id, name, country, flag } as League}
          size="sm"
        />
      </div>
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-2 mb-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

function toRow(l: PriorityLeague): LeagueRowProps {
  return { id: l.id, name: l.name, country: l.country, flag: l.flag };
}

// ── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const favLeagues = useFavoritesStore((s) => s.favoriteLeagueDetails);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-card/50">
      <ScrollArea className="flex-1 py-4">
        {/* ── Favorites ── */}
        {mounted && favLeagues.length > 0 && (
          <>
            <div className="px-3 mb-2">
              <SectionLabel>⭐ Favorites</SectionLabel>
              <nav className="space-y-1">
                {favLeagues.map((l) => (
                  <LeagueRow
                    key={l.id}
                    id={l.id}
                    name={l.name}
                    country={l.country}
                    flag={l.flag ?? getLeagueFlag(l.id)}
                  />
                ))}
              </nav>
            </div>
            <Separator className="my-3 mx-3" />
          </>
        )}

        {/* ── Popular ── */}
        <div className="px-3 mb-2">
          <div className="flex items-center gap-2 px-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              🏆 Popular
            </span>
          </div>
          <nav className="space-y-1">
            {TIER_1_POPULAR.map((l) => (
              <LeagueRow key={l.id} {...toRow(l)} />
            ))}
          </nav>
        </div>

        <Separator className="my-3 mx-3" />

        {/* ── European ── */}
        <div className="px-3 mb-2">
          <SectionLabel>🌟 European</SectionLabel>
          <nav className="space-y-1">
            {TIER_2_EUROPEAN.map((l) => (
              <LeagueRow key={l.id} {...toRow(l)} />
            ))}
          </nav>
        </div>

        <Separator className="my-3 mx-3" />

        {/* ── More (expandable) ── */}
        <div className="px-3 mb-2">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-2 mb-2 text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              More
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                moreOpen && 'rotate-180',
              )}
            />
          </button>
          {moreOpen && (
            <nav className="space-y-1">
              {TIER_3_EURO_CLUBS.map((l) => (
                <LeagueRow key={l.id} {...toRow(l)} />
              ))}
            </nav>
          )}
        </div>

        <Separator className="my-3 mx-3" />

        <div className="px-3">
          <p className="px-2 text-[11px] text-muted-foreground">
            Data provided by API-Football
          </p>
        </div>
      </ScrollArea>
    </aside>
  );
}
