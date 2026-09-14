'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useAuthStore } from '@/stores/authStore';
import { logger } from '@/lib/logger';

/**
 * Landed on after Stripe Checkout succeeds (see success_url in
 * billingController.createCheckoutSession).
 *
 * Two things are async at this point and this page waits for both:
 *
 * 1. Stripe's webhook has not necessarily reached auth-service yet — Checkout
 *    redirects the browser back immediately on payment success, but
 *    `checkout.session.completed` is delivered separately and can lag by a
 *    few seconds. GET /billing/status is polled until it reports 'vip' (or a
 *    timeout is hit and a friendlier "still finishing up" message shows).
 * 2. Once the database says 'vip', the access token this browser is holding
 *    still carries the OLD plan claim — it is a 15-minute-lived JWT, not
 *    re-issued just because the database changed under it. Refreshing it
 *    here means prediction-service's server-side entitlement check (which
 *    reads the JWT claim, not the database) reflects VIP immediately rather
 *    than up to 15 minutes later.
 */

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 8; // ~12 seconds

export default function BillingSuccessPage() {
  const fetchStatus = useSubscriptionStore((s) => s.fetchStatus);
  const plan = useSubscriptionStore((s) => s.plan);
  const [attempt, setAttempt] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const settling = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (cancelled) return;
        setAttempt(i + 1);

        const status = await fetchStatus();
        if (status?.plan === 'vip') {
          if (!settling.current) {
            settling.current = true;
            // Best-effort: a failed refresh here does not block the page —
            // the token will pick up the new claim on its next natural
            // refresh regardless (see authStore's 401-triggered refresh).
            try { await useAuthStore.getState().refreshAccessToken(); }
            catch (err) { logger.warn('Post-checkout token refresh failed', { error: String(err) }); }
          }
          if (!cancelled) setConfirmed(true);
          return;
        }

        if (i < MAX_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      }
    }

    void poll();
    return () => { cancelled = true; };
    // fetchStatus is a stable store action reference; omitting it from deps
    // avoids re-starting the poll loop on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timedOut = attempt >= MAX_ATTEMPTS && !confirmed;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
      {confirmed ? (
        <>
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-foreground">You&apos;re VIP</h1>
            <p className="mx-auto max-w-[360px] text-sm text-muted-foreground">
              Payment received — every market, every ticket tier, and the full
              analysis breakdown are unlocked.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm">
              <Link href="/tickets">See today&apos;s tickets</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile">Go to profile</Link>
            </Button>
          </div>
        </>
      ) : timedOut ? (
        <>
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-hidden="true" />
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-foreground">Still finishing up</h1>
            <p className="mx-auto max-w-[360px] text-sm text-muted-foreground">
              Your payment went through — activation is just taking a little
              longer than usual. Your profile will show VIP as soon as it lands,
              usually within a minute.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/profile">Go to profile</Link>
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-foreground">Activating VIP…</h1>
            <p className="text-sm text-muted-foreground">This only takes a moment.</p>
          </div>
        </>
      )}
    </div>
  );
}
