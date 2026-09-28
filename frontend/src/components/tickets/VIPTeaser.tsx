'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock, BarChart3, Bell, Layers, Loader2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

/**
 * VIP upsell.
 *
 * History, from the production readiness audit and the Stripe billing work
 * that followed it:
 *
 * 1. A waitlist form used to live here. It validated an email, set
 *    `joined = true` and said "You're on the list" — making no network call
 *    at all. The email went nowhere. Removed rather than fixed, because
 *    collecting an address under a promise nothing keeps is worse than not
 *    collecting it.
 *
 * 2. "Historical accuracy 72%+" used to be listed as a feature. Nothing
 *    measures prediction accuracy — no service records outcomes against
 *    predictions. Removed until that tracking exists.
 *
 * 3. "Paid VIP plans are not yet available" was true when this comment was
 *    first written and is no longer true — Stripe billing shipped. The CTA
 *    below now starts real Checkout for a signed-in free user.
 *
 * Feature list mirrors the entitlements the server actually enforces in
 * prediction-service/src/services/entitlements.py.
 */

const FEATURES = [
  { icon: Layers,    text: 'All 18 markets per match (free plan: 6)' },
  { icon: Ticket,    text: 'Every ticket tier, up to 10 legs (free plan: 1 ticket, 3 legs)' },
  { icon: BarChart3, text: 'Full algorithm factor breakdown' },
  { icon: Bell,      text: 'Priority notifications' },
];

export function VIPTeaser() {
  const { isAuthenticated } = useAuth();
  const { plan, loaded, isRedirecting, fetchStatus, startCheckout } = useSubscriptionStore();

  useEffect(() => {
    if (isAuthenticated && !loaded) void fetchStatus();
  }, [isAuthenticated, loaded, fetchStatus]);

  const isVip = isAuthenticated && plan === 'vip';

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <span className="flex items-center gap-2">
          <span className="flex items-center justify-center h-6 w-6 rounded-sm border border-border text-primary">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="font-mono text-sm font-bold uppercase tracking-wide text-foreground">VIP Tickets</span>
        </span>
        {isVip && <span className="tick bg-primary/10 text-primary">Active</span>}
      </div>

      <div className="px-6 py-6 grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Premium curated tickets with full market access and exclusive analysis.
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
          {isVip ? (
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              You have VIP — enjoy every market and tier.
            </div>
          ) : isAuthenticated ? (
            <>
              <p className="text-sm text-muted-foreground">$9.99/month, cancel anytime.</p>
              <Button size="sm" className="self-start" onClick={() => void startCheckout()} disabled={isRedirecting}>
                {isRedirecting
                  ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                  : null}
                {isRedirecting ? 'Redirecting…' : 'Upgrade to VIP'}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Create a free account to get started — VIP unlocks everything above.
              </p>
              <Button asChild size="sm" className="self-start">
                <Link href="/register">Create free account</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
