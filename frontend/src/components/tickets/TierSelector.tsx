'use client';

import { cn } from '@/lib/utils';
import type { Ticket, TicketTierKey } from '@/types';

// ── Tier config — one signal colour per risk band ───────────────────────────

export const TIER_META: Record<TicketTierKey, {
  label:        string;
  range:        string;
  dot:          string;   // colour chip
  color:        string;
  emoji:        string;    // kept for back-compat (ticket copy text, legacy views)
  activeColor:  string;
  activeBorder: string;
}> = {
  ultra_safe: { label: 'Ultra Safe', range: '2-3 legs · low risk',     dot: 'bg-up',            color: 'text-up',        emoji: '🟢', activeColor: 'bg-up/10',        activeBorder: 'border-b-2 border-up' },
  safe:       { label: 'Safe',       range: '4-5 legs · moderate risk', dot: 'bg-foreground/60', color: 'text-foreground', emoji: '🔵', activeColor: 'bg-muted',       activeBorder: 'border-b-2 border-foreground/40' },
  moderate:   { label: 'Moderate',   range: '6-7 legs · medium risk',   dot: 'bg-hold',          color: 'text-hold',      emoji: '🟡', activeColor: 'bg-hold/10',      activeBorder: 'border-b-2 border-hold' },
  risky:      { label: 'Risky',      range: '8-10 legs · high risk',    dot: 'bg-down',          color: 'text-down',      emoji: '🔴', activeColor: 'bg-down/10',      activeBorder: 'border-b-2 border-down' },
};

interface TierSelectorProps {
  tickets:      Ticket[];
  selectedTier: TicketTierKey | 'all';
  onSelect:     (tier: TicketTierKey | 'all') => void;
}

export function TierSelector({ tickets, selectedTier, onSelect }: TierSelectorProps) {
  const countForTier = (tier: TicketTierKey) => tickets.filter((t) => t.tier === tier).length;

  const tiers: Array<{ key: TicketTierKey | 'all'; label: string; sub: string; dot?: string; color?: string; count?: number }> = [
    { key: 'all', label: 'All tiers', sub: `${tickets.length} tickets` },
    ...Object.entries(TIER_META).map(([key, m]) => ({
      key:   key as TicketTierKey,
      label: m.label,
      sub:   m.range,
      dot:   m.dot,
      color: m.color,
      count: countForTier(key as TicketTierKey),
    })),
  ];

  return (
    <div className="overflow-x-auto -mx-4 px-4 scrollbar-none">
      <div className="flex min-w-max border border-border rounded-lg divide-x divide-border overflow-hidden">
        {tiers.map(({ key, label, sub, dot, color, count }) => {
          const isActive = selectedTier === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={cn(
                'flex flex-col items-start gap-1 px-4 py-2.5 min-w-[128px] text-left transition-colors',
                isActive ? 'bg-muted' : 'bg-card hover:bg-muted/40'
              )}
            >
              <span className="flex items-center gap-1.5">
                {dot && <span className={cn('h-1.5 w-1.5 rounded-sm', dot)} />}
                <span className={cn('font-mono text-[11px] font-semibold uppercase tracking-wide', isActive && color ? color : 'text-foreground')}>
                  {label}
                </span>
                {typeof count === 'number' && (
                  <span className="num text-[10px] text-muted-foreground">({count})</span>
                )}
              </span>
              <span className="label normal-case tracking-normal text-muted-foreground/70">{sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
