'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTickets } from '@/hooks/useTickets';
import type { Ticket, TicketTierKey } from '@/types';

// ── Tier colour map ───────────────────────────────────────────────────────────

const TIER_STYLES: Record<TicketTierKey, {
  border:  string;
  text:    string;
  badgeBg: string;
  dot:     string;
}> = {
  ultra_safe: { border: 'border-l-emerald-500', text: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-500' },
  safe:       { border: 'border-l-blue-500',    text: 'text-blue-400',    badgeBg: 'bg-blue-500/10 text-blue-400',       dot: 'bg-blue-500'    },
  moderate:   { border: 'border-l-amber-500',   text: 'text-amber-400',   badgeBg: 'bg-amber-500/10 text-amber-400',     dot: 'bg-amber-500'   },
  risky:      { border: 'border-l-red-500',     text: 'text-red-400',     badgeBg: 'bg-red-500/10 text-red-400',         dot: 'bg-red-500'     },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface TicketSummaryProps {
  ticket: Ticket;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketSummary({ ticket }: TicketSummaryProps) {
  const s = TIER_STYLES[ticket.tier] ?? TIER_STYLES.safe;
  const combinedPct = Math.round(ticket.combined_probability * 100);

  return (
    <div className={cn(
      'rounded-xl border border-border/60 border-l-4 bg-card/60 p-4',
      'hover:border-border hover:bg-card/80 transition-all duration-200 hover:shadow-md',
      s.border,
    )}>
      {/* Tier + odds */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', s.badgeBg)}>
          {ticket.emoji} {ticket.name}
        </span>
        <span className={cn('text-xl font-black tabular-nums', s.text)}>
          {ticket.combined_odds}x
        </span>
      </div>

      {/* Top 2 legs preview */}
      <div className="space-y-1.5 mb-3">
        {ticket.legs.slice(0, 2).map((leg) => (
          <div key={leg.fixture_id} className="flex items-center gap-2">
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
            <span className="text-xs text-muted-foreground truncate">{leg.match}</span>
            <span className={cn('text-xs font-medium shrink-0', s.text)}>{leg.selection}</span>
          </div>
        ))}
        {ticket.legs.length > 2 && (
          <p className="text-xs text-muted-foreground pl-3.5">
            +{ticket.legs.length - 2} more leg{ticket.legs.length - 2 > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Footer: combined % + legs count */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {ticket.legs.length} legs · <span className={s.text}>{combinedPct}% prob</span>
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper for the homepage (self-contained) ────────────────────────

export function TicketSummarySection() {
  const { tickets, isLoading } = useTickets();

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">🎰 Today&apos;s Tickets</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (tickets.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">🎰 Today&apos;s Tickets</h2>
        <Link
          href="/tickets"
          className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tickets.slice(0, 4).map((t) => (
          <Link key={t.id} href="/tickets">
            <TicketSummary ticket={t} />
          </Link>
        ))}
      </div>
    </section>
  );
}
