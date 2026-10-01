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
import { ProfileWorkspace }   from '@/components/profile/ProfileWorkspace';

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
  // has been open; the free entitlements (1 combo, 3 picks, 6 markets) apply
  // whether or not the trial has expired. "Free trial" vs "Free plan" is purely
  // a label distinction for the user, not a difference in what they can see.
  const trialEndsAt = trialEndsAtRaw ? new Date(trialEndsAtRaw) : null;
  const trialActive = trialEndsAt !== null && trialEndsAt.getTime() > mountedAt;
  const planLabel = plan === 'vip' ? 'VIP' : trialActive ? 'Free trial' : 'Free plan';
  const restrictedDetail = 'One combo a day, three picks per combo, six markets per match.';

  const renewalNote = (() => {
    if (plan !== 'vip' || !subscription) return null;
    if (!subscription.currentPeriodEnd) return null;
    const date = formatFullDate(subscription.currentPeriodEnd);
    return subscription.cancelAtPeriodEnd
      ? `Cancels on ${date} — you'll keep VIP until then.`
      : `Renews ${date}.`;
  })();

  const planDetail = plan === 'vip'
    ? `Full access to every market, confidence level and analysis breakdown.${renewalNote ? ` ${renewalNote}` : ''}`
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
    <ProfileWorkspace
      user={user}
      avatarBg={avatarBg}
      plan={plan}
      planLabel={planLabel}
      planDetail={planDetail}
      trialActive={trialActive}
      subscription={subscription}
      billingError={billingError}
      paymentFailed={paymentFailed}
      isRedirecting={isRedirecting}
      savedTickets={savedTickets}
      onLogout={logout}
      onUpgrade={() => void startCheckout()}
      onManage={() => void openPortal()}
      onClearBillingError={clearBillingError}
      onRemoveTicket={removeTicket}
    />
  );

  /* Legacy JSX retained in git history; rendering uses ProfileWorkspace above. */
}


