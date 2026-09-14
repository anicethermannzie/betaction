'use client';

import Link from 'next/link';
import { Lock, BarChart3, Bell, Layers, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * VIP upsell.
 *
 * Two things were removed here:
 *
 * 1. The waitlist form. It validated the address, set `joined = true` and told
 *    the visitor "You're on the list" — while making no network call at all.
 *    The email went nowhere. Collecting an address under a promise we do not
 *    keep is worse than not collecting it.
 *
 * 2. The claim "Historical accuracy 72%+". Nothing measures prediction accuracy:
 *    no service records outcomes against predictions. An unverifiable performance
 *    claim on a paid betting product is the kind of statement regulators read
 *    closely. It can return when the tracking exists to back it.
 *
 * The features listed now are exactly the entitlements the server enforces in
 * prediction-service/src/services/entitlements.py.
 */

const FEATURES = [
  { icon: Layers,    text: 'All 18 markets per match (free plan: 6)' },
  { icon: Ticket,    text: 'Every ticket tier, up to 10 legs (free plan: 1 ticket, 3 legs)' },
  { icon: BarChart3, text: 'Full algorithm factor breakdown' },
  { icon: Bell,      text: 'Priority notifications' },
];

export function VIPTeaser() {

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <span className="flex items-center gap-2">
          <span className="flex items-center justify-center h-6 w-6 rounded-sm border border-border text-primary">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="font-mono text-sm font-bold uppercase tracking-wide text-foreground">VIP Tickets</span>
        </span>
        <span className="tick bg-primary/10 text-primary">Coming soon</span>
      </div>

      <div className="px-6 py-6 grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Premium curated tickets with higher accuracy and exclusive analysis.
          </p>
          <ul className="space-y-2.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                <span className="text-[13px] text-foreground/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center gap-3">
          <p className="text-sm text-muted-foreground">
            Create a free account to get started — VIP unlocks everything above.
          </p>
          <Button asChild size="sm" className="self-start">
            <Link href="/register">Create free account</Link>
          </Button>
          <p className="label">Paid VIP plans are not yet available.</p>
        </div>
      </div>
    </div>
  );
}
