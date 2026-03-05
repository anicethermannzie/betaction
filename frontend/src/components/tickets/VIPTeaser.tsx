'use client';

import { useState } from 'react';
import { Lock, CheckCircle2, Zap, BarChart3, Bell, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { cn }     from '@/lib/utils';

// ── Feature list ──────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Trophy,    text: 'Expert-curated picks' },
  { icon: BarChart3, text: 'In-depth match analysis' },
  { icon: Bell,      text: 'Priority notifications' },
  { icon: Zap,       text: 'Historical accuracy: 72%+' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function VIPTeaser() {
  const [email,    setEmail]    = useState('');
  const [joined,   setJoined]   = useState(false);
  const [emailErr, setEmailErr] = useState('');

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      setEmailErr('Please enter a valid email address.');
      return;
    }
    setEmailErr('');
    setJoined(true);
  }

  return (
    <div className={cn(
      'relative rounded-2xl overflow-hidden',
      'border border-transparent bg-gradient-to-br from-purple-950/60 via-card to-amber-950/40',
      // Glowing gradient border via box-shadow simulation
      'shadow-[inset_0_0_0_1px_rgba(168,85,247,0.3),inset_0_0_0_2px_rgba(245,158,11,0.1)]',
    )}>
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl translate-y-1/2 -translate-x-1/4" />
      </div>

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <Lock className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-foreground">💎 VIP Tickets</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Premium curated tickets with higher accuracy &amp; exclusive analysis
            </p>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-6">
          {/* Feature list */}
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 shrink-0">
                  <Icon className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <span className="text-sm text-foreground/80">{text}</span>
              </li>
            ))}
          </ul>

          {/* Waitlist form */}
          <div className="flex flex-col justify-center">
            {joined ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">You&apos;re on the list!</p>
                  <p className="text-xs text-muted-foreground">We&apos;ll notify you when VIP launches.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-3">
                <p className="text-sm font-medium text-foreground/90">
                  Join the waitlist for early access
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailErr(''); }}
                    className="h-9 text-sm"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="shrink-0 bg-purple-600 hover:bg-purple-500 text-white border-0"
                  >
                    Join
                  </Button>
                </div>
                {emailErr && <p className="text-xs text-destructive">{emailErr}</p>}
                <p className="text-[11px] text-muted-foreground">
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
