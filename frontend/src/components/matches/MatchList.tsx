'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, CalendarX } from 'lucide-react';
import { MatchCard } from './MatchCard';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { cn, isMatchInProgress } from '@/lib/utils';
import {
  LEAGUE_TIER,
  getLeaguePriority,
  getLeagueTierHeading,
} from '@/lib/leaguePriority';
import type { ApiFixture, ApiLeague, League, Prediction } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MatchGroup {
  key:      string;
  league:   ApiLeague;
  fixtures: ApiFixture[];
  hasLive:  boolean;
  tier:     number;
}

export interface MatchListProps {
  fixtures:          ApiFixture[];
  isLoading?:        boolean;
  groupByLeague?:    boolean;
  collapsible?:      boolean;
  emptyMessage?:     string;
  predictions?:      Map<number, Prediction>;
  /** Order league groups into priority tiers with separator labels. */
  tiered?:           boolean;
  /** Favorite league IDs — enables the tier-4 "Your Favorites" band. */
  favoriteLeagueIds?: number[];
}

// ── Sort helpers ──────────────────────────────────────────────────────────────

function sortWithinGroup(fixtures: ApiFixture[]): ApiFixture[] {
  return [...fixtures].sort((a, b) => {
    const aLive = isMatchInProgress(a.fixture.status.short);
    const bLive = isMatchInProgress(b.fixture.status.short);
    if (aLive !== bLive) return aLive ? -1 : 1;
    return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
  });
}

function sortGroups(groups: MatchGroup[], tiered: boolean): MatchGroup[] {
  return [...groups].sort((a, b) => {
    if (tiered && a.tier !== b.tier) return a.tier - b.tier;
    if (a.hasLive !== b.hasLive) return a.hasLive ? -1 : 1;
    return a.league.name.localeCompare(b.league.name);
  });
}

function buildGroups(
  fixtures: ApiFixture[],
  tiered: boolean,
  favoriteLeagueIds: number[],
): MatchGroup[] {
  const map = new Map<string, MatchGroup>();

  for (const f of fixtures) {
    const key = `${f.league.id}-${f.league.season}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        league:   f.league,
        fixtures: [],
        hasLive:  false,
        tier:     getLeaguePriority(f.league.id, favoriteLeagueIds),
      });
    }
    const group = map.get(key)!;
    group.fixtures.push(f);
    if (isMatchInProgress(f.fixture.status.short)) group.hasLive = true;
  }

  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    fixtures: sortWithinGroup(g.fixtures),
  }));

  return sortGroups(groups, tiered);
}

// ── Sub-component: tier separator ────────────────────────────────────────────

function TierSeparator({ tier }: { tier: number }) {
  return (
    <div className="flex items-center gap-3 pt-3 first:pt-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0">
        {getLeagueTierHeading(tier)}
      </span>
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}

// ── Sub-component: league group header ────────────────────────────────────────

interface LeagueGroupHeaderProps {
  league:      ApiLeague;
  count:       number;
  hasLive:     boolean;
  open:        boolean;
  collapsible: boolean;
  showFavorite: boolean;
  onToggle:    () => void;
}

function LeagueGroupHeader({
  league,
  count,
  hasLive,
  open,
  collapsible,
  showFavorite,
  onToggle,
}: LeagueGroupHeaderProps) {
  return (
    <div
      className={cn(
        'w-full flex items-center gap-2 pl-3 pr-2 py-2.5',
        hasLive ? 'bg-red-950/15' : 'bg-muted/20',
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        className={cn(
          'flex flex-1 items-center gap-2 min-w-0 text-left',
          'hover:opacity-80 transition-opacity',
          !collapsible && 'cursor-default',
        )}
        onClick={collapsible ? onToggle : undefined}
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
          <div className="h-4.5 w-4.5 rounded-full bg-muted shrink-0" />
        )}

        {/* Name + country */}
        <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
          <span className="text-sm font-semibold truncate">{league.name}</span>
          <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
            {league.country}
          </span>
        </div>

        {/* Live dot */}
        {hasLive && (
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
        )}

        {/* Count */}
        <span className="text-[11px] text-muted-foreground shrink-0">{count}</span>

        {/* Chevron */}
        {collapsible && (
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        )}
      </button>

      {/* Favorite toggle — sibling of the collapse button, never nested */}
      {showFavorite && (
        <FavoriteButton
          type="league"
          id={league.id}
          data={{
            id:      league.id,
            name:    league.name,
            country: league.country,
            logo:    league.logo,
          } as League}
          size="md"
        />
      )}
    </div>
  );
}

// ── Sub-component: one league group card ─────────────────────────────────────

interface LeagueGroupCardProps {
  group:        MatchGroup;
  collapsible:  boolean;
  showFavorite: boolean;
  isOpen:       boolean;
  onToggle:     () => void;
  predictions?: Map<number, Prediction>;
}

function LeagueGroupCard({
  group,
  collapsible,
  showFavorite,
  isOpen,
  onToggle,
  predictions,
}: LeagueGroupCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden',
        group.hasLive
          ? 'border-red-500/25 border-l-2 border-l-red-500'
          : 'border-border/60',
      )}
    >
      <LeagueGroupHeader
        league={group.league}
        count={group.fixtures.length}
        hasLive={group.hasLive}
        open={isOpen}
        collapsible={collapsible}
        showFavorite={showFavorite}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="divide-y divide-border/40">
          {group.fixtures.map((f) => (
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

// ── Main component ────────────────────────────────────────────────────────────

export function MatchList({
  fixtures,
  isLoading,
  groupByLeague = false,
  collapsible   = false,
  emptyMessage  = 'No matches found.',
  predictions,
  tiered = false,
  favoriteLeagueIds = [],
}: MatchListProps) {
  // Set of collapsed group keys
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Tier 5 ("More Leagues") is collapsed by default
  const [showMore, setShowMore] = useState(false);

  // favoriteLeagueIds identity changes every render from a parent selector —
  // depend on its contents, not its reference.
  const favKey = favoriteLeagueIds.join(',');
  const groups = useMemo(
    () => buildGroups(fixtures, tiered, favoriteLeagueIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fixtures, tiered, favKey],
  );

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="match" />
        ))}
      </div>
    );
  }

  // ── Empty ──
  if (fixtures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <CalendarX className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  // ── Flat list (no grouping) ──
  if (!groupByLeague) {
    return (
      <div className="space-y-2">
        {fixtures.map((f) => (
          <MatchCard
            key={f.fixture.id}
            fixture={f}
            prediction={predictions?.get(f.fixture.id)}
          />
        ))}
      </div>
    );
  }

  // ── Grouped, non-tiered (original behaviour) ──
  if (!tiered) {
    return (
      <div className="space-y-3">
        {groups.map((group) => (
          <LeagueGroupCard
            key={group.key}
            group={group}
            collapsible={collapsible}
            showFavorite={false}
            isOpen={!collapsible || !collapsed.has(group.key)}
            onToggle={() => toggle(group.key)}
            predictions={predictions}
          />
        ))}
      </div>
    );
  }

  // ── Grouped + tiered ──
  const mainGroups = groups.filter((g) => g.tier !== LEAGUE_TIER.OTHERS);
  const otherGroups = groups.filter((g) => g.tier === LEAGUE_TIER.OTHERS);

  let lastTier = -1;

  return (
    <div className="space-y-3">
      {mainGroups.map((group) => {
        const showSeparator = group.tier !== lastTier;
        lastTier = group.tier;
        return (
          <div key={group.key} className="space-y-3">
            {showSeparator && <TierSeparator tier={group.tier} />}
            <LeagueGroupCard
              group={group}
              collapsible={collapsible}
              showFavorite
              isOpen={!collapsible || !collapsed.has(group.key)}
              onToggle={() => toggle(group.key)}
              predictions={predictions}
            />
          </div>
        );
      })}

      {otherGroups.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className={cn(
              'flex w-full items-center gap-3 pt-3 text-left',
              'group',
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 shrink-0">
              {showMore
                ? getLeagueTierHeading(LEAGUE_TIER.OTHERS)
                : `Show more leagues (${otherGroups.length})`}
            </span>
            <span className="h-px flex-1 bg-border/60" />
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground/70 shrink-0 transition-transform duration-200',
                showMore && 'rotate-180',
              )}
            />
          </button>

          {showMore &&
            otherGroups.map((group) => (
              <LeagueGroupCard
                key={group.key}
                group={group}
                collapsible={collapsible}
                showFavorite
                isOpen={!collapsible || !collapsed.has(group.key)}
                onToggle={() => toggle(group.key)}
                predictions={predictions}
              />
            ))}
        </div>
      )}
    </div>
  );
}
