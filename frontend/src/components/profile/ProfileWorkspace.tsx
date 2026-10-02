'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Inbox, LogOut, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/common/StateMessage';
import { TicketCard } from '@/components/tickets/TicketCard';
import { cn, formatFullDate, getInitials } from '@/lib/utils';
import type { SubscriptionDetail, Ticket, User } from '@/types';

interface Props {
  user: User;
  avatarBg: string;
  plan: 'free' | 'vip';
  planLabel: string;
  planDetail: string;
  trialActive: boolean;
  subscription: SubscriptionDetail | null;
  billingError: string | null;
  paymentFailed: boolean;
  isRedirecting: boolean;
  savedTickets: Ticket[];
  onLogout: () => void;
  onUpgrade: () => void;
  onManage: () => void;
  onClearBillingError: () => void;
  onRemoveTicket: (id: string) => void;
  onDeleteAccount: (password: string) => Promise<void>;
}

export function ProfileWorkspace({ user, avatarBg, plan, planLabel, planDetail, trialActive, subscription, billingError, paymentFailed, isRedirecting, savedTickets, onLogout, onUpgrade, onManage, onClearBillingError, onRemoveTicket, onDeleteAccount }: Props) {
  const renewal = subscription?.currentPeriodEnd ? formatFullDate(subscription.currentPeriodEnd) : null;

  // ── Delete account — confirm-with-password, local to this component since
  // nothing outside it needs to know the panel is open or what's been typed.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const cancelDelete = () => { setDeleteOpen(false); setDeletePassword(''); setDeleteError(null); };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteAccount(deletePassword);
      // No further cleanup here: onDeleteAccount (useAuth.deleteAccount) only
      // resolves after the redirect away from this page has been kicked off.
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07100e] px-4 pb-16 pt-6 text-[#edf5f0] md:px-6 lg:pt-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00d084]">Account & intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your MatchWise workspace</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">Manage access and revisit the model signal sets you have saved on this device.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-[#0b1714] p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 shrink-0 border border-white/10"><AvatarFallback className={cn('text-2xl font-bold text-[#03100b]', avatarBg)}>{getInitials(user.username)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1"><p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Account overview</p><h2 className="mt-1 truncate text-2xl font-semibold">{user.username}</h2><p className="truncate text-sm text-white/55">{user.email}</p>{user.createdAt && <p className="mt-2 text-xs text-white/35">Member since {formatFullDate(user.createdAt)}</p>}</div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#00d084]/30 bg-[#00d084]/10 px-3 py-1.5 text-xs font-semibold text-[#00d084]"><ShieldCheck className="h-3.5 w-3.5" /> {planLabel}</span>
            </div>
          </div>

          <section className="rounded-2xl border border-[#00d084]/25 bg-[#0b1d17] p-5 sm:p-7">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#00d084]" /><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00d084]">Plan & access</p></div>
            <h2 className="mt-3 text-xl font-semibold">{planLabel}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{planDetail}</p>
            {trialActive && <p className="mt-2 text-xs text-[#00d084]">Trial period active · Free access level</p>}
            {renewal && plan === 'vip' && <p className="mt-2 text-xs text-white/40">{subscription?.cancelAtPeriodEnd ? `Access continues until ${renewal}.` : `Renews ${renewal}.`}</p>}
            {billingError && <p role="alert" className="mt-3 text-xs text-red-300">{billingError}</p>}
            {paymentFailed && <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> Your last payment failed. Update your payment method to keep VIP access.</div>}
            <div className="mt-5 flex flex-wrap gap-2">{plan !== 'vip' && <Button size="sm" onClick={() => { onClearBillingError(); onUpgrade(); }} disabled={isRedirecting}>{isRedirecting ? 'Opening checkout…' : 'Upgrade to VIP'}</Button>}{subscription && <Button variant="outline" size="sm" onClick={() => { onClearBillingError(); onManage(); }} disabled={isRedirecting}>{isRedirecting ? 'Opening portal…' : 'Manage subscription'}</Button>}</div>
          </section>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0b1714] p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00d084]">Saved intelligence</p><h2 className="mt-2 text-xl font-semibold">Signal sets saved on this device</h2><p className="mt-1 text-sm text-white/45">These records stay in this browser and are not cloud-synchronized.</p></div><span className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-white/55">{savedTickets.length} saved</span></div>
          <div className="mt-6">{savedTickets.length === 0 ? <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8"><EmptyState icon={Inbox} title="No saved intelligence yet" description="Save a generated signal set or build an analysis set from the Picks workspace." /></div> : <div className="space-y-4">{savedTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} isSaved onSave={() => onRemoveTicket(ticket.id)} />)}</div>}</div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-white/10 bg-[#0b1714] p-5 sm:p-7"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00d084]">Product status</p><h2 className="mt-2 text-xl font-semibold">Analysis history</h2><p className="mt-1 text-sm text-white/45">Personal prediction history is not available yet.</p><div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-5"><EmptyState icon={Inbox} title="Analysis history is coming soon" description="MatchWise does not currently record which predictions you have viewed or followed." /></div></div>
          <div className="rounded-2xl border border-white/10 bg-[#0b1714] p-5 sm:min-w-[250px] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Account action</p>
            <h2 className="mt-2 text-lg font-semibold">Sign out</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">End this session and clear local user state.</p>
            <Button variant="outline" size="sm" className="mt-5 border-red-400/30 text-red-300 hover:bg-red-400/10" onClick={onLogout}><LogOut className="mr-2 h-3.5 w-3.5" /> Log out</Button>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h2 className="text-lg font-semibold text-red-300">Delete account</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/45">Permanently deletes your account and saved data, and cancels any active subscription. This cannot be undone.</p>
              {!deleteOpen ? (
                <Button variant="outline" size="sm" className="mt-5 border-red-400/30 text-red-300 hover:bg-red-400/10" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete account
                </Button>
              ) : (
                <div className="mt-5 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="delete-password" className="text-xs text-white/55">Enter your password to confirm</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      autoComplete="current-password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      disabled={deleting}
                    />
                  </div>
                  {deleteError && <p role="alert" className="text-xs text-red-300">{deleteError}</p>}
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleting || !deletePassword}>
                      {deleting ? 'Deleting…' : 'Permanently delete'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={cancelDelete} disabled={deleting}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

