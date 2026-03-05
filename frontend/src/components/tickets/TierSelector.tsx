'use client';

import { cn } from '@/lib/utils';
import type { Ticket, TicketTierKey } from '@/types';

// ── Tier config ───────────────────────────────────────────────────────────────

export const TIER_META: Record<TicketTierKey, {
  label:   string;
  emoji:   string;
  range:   string;
  color:   string;
  activeColor: string;
  activeBorder: string;
}> = {
  ultra_safe: {
    label:        'Ultra Safe',
    emoji:        '🟢',
    range:        '2-3 legs · Low risk',
    color:        'text-emerald-400',
    activeColor:  'bg-emerald-500/10',
    activeBorder: 'border-b-2 border-emerald-500',
  },
  safe: {
    label:        'Safe',
    emoji:        '🔵',
    range:        '4-5 legs · Moderate risk',
    color:        'text-blue-400',
    activeColor:  'bg-blue-500/10',
    activeBorder: 'border-b-2 border-blue-500',
  },
  moderate: {
    label:        'Moderate',
    emoji:        '🟡',
    range:        '6-7 legs · Medium risk',
    color:        'text-amber-400',
    activeColor:  'bg-amber-500/10',
    activeBorder: 'border-b-2 border-amber-500',
  },
  risky: {
    label:        'Risky',
    emoji:        '🔴',
    range:        '8-10 legs · High risk',
    color:        'text-red-400',
    activeColor:  'bg-red-500/10',
    activeBorder: 'border-b-2 border-red-500',
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface TierSelectorProps {
  tickets:      Ticket[];
  selectedTier: TicketTierKey | 'all';
  onSelect:     (tier: TicketTierKey | 'all') => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TierSelector({ tickets, selectedTier, onSelect }: TierSelectorProps) {
  const countForTier = (tier: TicketTierKey) =>
    tickets.filter((t) => t.tier === tier).length;

  const tiers: Array<{ key: TicketTierKey | 'all'; label: string; emoji: string; sub: string; count?: number }> = [
    { key: 'all', label: 'All Tiers', emoji: '🎰', sub: `${tickets.length} tickets` },
    ...Object.entries(TIER_META).map(([key, m]) => ({
      key:   key as TicketTierKey,
      label: m.label,
      emoji: m.emoji,
      sub:   m.range,
      count: countForTier(key as TicketTierKey),
    })),
    { key: 'all' as never, label: 'VIP', emoji: '💎', sub: 'Coming Soon' },
  ];

  return (
    <div className="overflow-x-auto -mx-4 px-4 scrollbar-none">
      <div className="flex gap-2 min-w-max pb-1">
        {tiers.map(({ key, label, emoji, sub, count }, idx) => {
          const isVip = label === 'VIP';
          const meta  = key !== 'all' && !isVip ? TIER_META[key as TicketTierKey] : null;
          const isActive = !isVip && selectedTier === key;

          return (
            <button
              key={`${key}-${idx}`}
              disabled={isVip}
              onClick={() => !isVip && onSelect(key as TicketTierKey | 'all')}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl border transition-all duration-200 min-w-[110px]',
                isVip
                  ? 'border-border/30 opacity-40 cursor-not-allowed bg-muted/20'
                  : isActive
                    ? cn('border-border', meta?.activeColor ?? 'bg-muted/50', meta?.activeBorder ?? '')
                    : 'border-border/50 hover:border-border hover:bg-muted/30 cursor-pointer'
              )}
            >
              <span className="text-lg">{emoji}</span>
              <span className={cn(
                'text-xs font-semibold',
                isVip ? 'text-muted-foreground' : isActive && meta ? meta.color : 'text-foreground'
              )}>
                {label}
                {isVip && <span className="ml-1 text-[10px]">🔒</span>}
              </span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{sub}</span>
              {typeof count === 'number' && !isVip && (
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                  isActive && meta ? cn(meta.activeColor, meta.color) : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
