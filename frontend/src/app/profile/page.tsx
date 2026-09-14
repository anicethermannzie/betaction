'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogOut, Inbox, Loader2, ShieldCheck } from 'lucide-react';
import { Button }    from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth }   from '@/hooks/useAuth';
import { cn, getInitials, formatFullDate } from '@/lib/utils';

import { useProfileStore }      from '@/stores/profileStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { TicketCard }        from '@/components/tickets/TicketCard';
import { EmptyState }        from '@/components/common/StateMessage';
import { LoadingSkeleton }   from '@/components/common/LoadingSkeleton';

// ── Avatar color (hash-based, deterministic) ──────────────────────────────────

const AVATAR_COLORS = [
  'bg-primary', 'bg-blue-600', 'bg-violet-600', 'bg-hold', 'bg-rose-600',
];

function getAvatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Prediction history ────────────────────────────────────────────────────────
//
// REMOVED: ACCURACY_DATA, MOCK_HISTORY and USER_LEAGUES — 20 invented
// predictions with outcomes, an accuracy chart claiming 55-72%, and a hardcoded
// 5-match "streak", all displayed under the headings "Your Prediction History"
// and "Prediction Accuracy Over Time" to paying customers.
//
// None of it could be real: no service records which predictions a user has
// seen or backed. There is no users_predictions table, no endpoint, and no
// client call. Restoring these sections requires that tracking to exist first;
// until then the page shows what is actually known about the account.
//
// The components themselves (StatsCard, AccuracyChart, PredictionHistory,
// FavoriteLeagues) are kept in src/components/profile/ for that work.

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isAuthenticated, initialized, logout, error } = useAuth();
  const router = useRouter();
  const { savedTickets, removeTicket } = useProfileStore();
  const {
    plan: livePlan, trialEndsAt: liveTrialEndsAt, subscription,
    loaded: billingLoaded, isRedirecting, error: billingError,
    fetchStatus, startCheckout, openPortal, clearError: clearBillingError,
  } = useSubscriptionStore();

  // Read the clock once, in a lazy initializer, rather than during render:
  // reading it on every render is impure and would risk a hydration mismatch.
  const [mountedAt] = useState(() => Date.now());

  // Client-side guard. The API is protected independently — GET
  // /api/auth/profile requires a valid access token — so this is a redirect for
  // the user's benefit, not the security boundary.
  useEffect(() => {
    if (initialized && !isAuthenticated) router.push('/login');
  }, [initialized, isAuthenticated, router]);

  // GET /billing/status hits the database directly, so it reflects a just-
  // completed checkout or a just-failed payment sooner than user.plan (a JWT
  // claim, only as fresh as the last login/token refresh).
  useEffect(() => {
    if (isAuthenticated && !billingLoaded) void fetchStatus();
  }, [isAuthenticated, billingLoaded, fetchStatus]);

  // Auth state is still resolving: show the skeleton rather than a blank page.
  if (!initialized && !user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (!user) return null;

  const avatarBg = getAvatarBg(user.username);

  // Prefer the freshly-fetched billing status once it has loaded (it reads
  // the database directly); fall back to the JWT claim so the page shows its
  // best-known answer immediately instead of flashing "Free plan" while the
  // request is in flight.
  const plan = billingLoaded ? livePlan : (user.plan ?? 'free');
  const trialEndsAtRaw = billingLoaded ? liveTrialEndsAt : (user.trialEndsAt ?? null);

  // The trial window does NOT unlock VIP — see TRIAL_GRANTS_VIP in
  // auth-service/src/utils/entitlements.js. It only tracks how long the account
  // has been open; the free entitlements (1 ticket, 3 legs, 6 markets) apply
  // whether or not the trial has expired. "Free trial" vs "Free plan" is purely
  // a label distinction for the user, not a difference in what they can see.
  const trialEndsAt = trialEndsAtRaw ? new Date(trialEndsAtRaw) : null;
  const trialActive = trialEndsAt !== null && trialEndsAt.getTime() > mountedAt;
  const planLabel = plan === 'vip' ? 'VIP' : trialActive ? 'Free trial' : 'Free plan';
  const restrictedDetail = 'One ticket a day, three legs per ticket, six markets per match.';

  const renewalNote = (() => {
    if (plan !== 'vip' || !subscription) return null;
    if (!subscription.currentPeriodEnd) return null;
    const date = formatFullDate(subscription.currentPeriodEnd);
    return subscription.cancelAtPeriodEnd
      ? `Cancels on ${date} — you'll keep VIP until then.`
      : `Renews ${date}.`;
  })();

  const planDetail = plan === 'vip'
    ? `Full access to every market, ticket tier and analysis breakdown.${renewalNote ? ` ${renewalNote}` : ''}`
    : trialActive
      ? `${restrictedDetail} Trial period ends ${formatFullDate(trialEndsAt!.toISOString())}.`
      : restrictedDetail;

  // A Stripe customer exists (billing history of some kind) whenever the
  // status endpoint returned a subscription row at all — including a
  // canceled one, so a lapsed VIP can still reach their invoices/payment
  // methods in the portal.
  const hasBillingAccount = subscription !== null;
  const paymentFailed = subscription?.status === 'past_due';

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-12">
      {error && <p role="alert" className="text-down">{error}</p>}

      {/* ── 1. Profile header ─────────────────────────────────────────────── */}
      <Card className="bg-card border-border/60">
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className={cn('text-xl font-bold text-foreground', avatarBg)}>
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{user.username}</h1>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              {user.createdAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Member since {formatFullDate(user.createdAt)}
                </p>
              )}
            </div>

            {/* Action buttons — "Edit Profile" removed: it was onClick={() => {}}
                with no endpoint behind it. */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-red-900/60 text-down hover:bg-down/10 hover:text-down hover:border-down/50"
                onClick={logout}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Plan ───────────────────────────────────────────────────────── */}
      <Card className="bg-card border-border/60">
        <CardContent className="py-4 space-y-3">
          {billingError && (
            <p role="alert" className="text-xs text-destructive">{billingError}</p>
          )}

          {paymentFailed && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-900/40 bg-amber-500/10 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-amber-200/90">
                Your last payment failed. Update your payment method to keep VIP —
                we&apos;ll keep retrying automatically in the meantime.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold capitalize">{planLabel}</p>
              <p className="text-xs text-muted-foreground">{planDetail}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {plan !== 'vip' && (
              <Button
                size="sm"
                onClick={() => { clearBillingError(); void startCheckout(); }}
                disabled={isRedirecting}
              >
                {isRedirecting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />}
                {isRedirecting ? 'Redirecting…' : 'Upgrade to VIP'}
              </Button>
            )}
            {hasBillingAccount && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { clearBillingError(); void openPortal(); }}
                disabled={isRedirecting}
              >
                {isRedirecting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />}
                {isRedirecting ? 'Redirecting…' : 'Manage Subscription'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Prediction history ─────────────────────────────────────────────
          The accuracy chart, "Total Predictions"/"Accuracy"/"Streak" tiles and
          the 20-row history table that used to sit here were fabricated — see
          the note at the top of this file. They return when per-user prediction
          tracking exists in the backend. */}
      <Card className="bg-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground/80">
            Your Prediction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Inbox}
            title="Prediction tracking is coming soon"
            description="We don't yet record which predictions you've followed, so there is nothing to report here. Your saved tickets are below."
          />
        </CardContent>
      </Card>

      {/* ── 5. Saved Tickets & Parlays ───────────────────────────────────── */}
      <Card className="bg-card border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
            <span>Saved Tickets & Parlays</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              {savedTickets.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-border rounded-lg bg-background/20">
              <p className="text-sm font-bold text-foreground/80">No saved tickets or parlays yet</p>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Build your own custom ticket on the tickets page or click &quot;Save&quot; on any AI predictions ticket.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isSaved={true}
                  onSave={() => removeTicket(ticket.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 4. Account settings ───────────────────────────────────────────────
          REMOVED, because none of it did anything:
            - two notification toggles held in useState and discarded on
              navigation (no preferences endpoint, no notification service hook);
            - "Change Password" with onClick={() => {}} (no reset flow exists);
            - "Delete Account", which showed "This action cannot be undone. All
              your predictions, streaks, and account data will be permanently
              deleted" and then called logout(). Nothing was deleted. For a paid
              product reachable from the EU/UK that is a GDPR Art. 17 exposure,
              not just a dead button.
          These return when the endpoints behind them exist. */}
    </div>
  );
}
