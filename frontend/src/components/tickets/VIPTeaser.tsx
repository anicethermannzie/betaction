'use client';

import { useState } from 'react';
import { Lock, CheckCircle2, Zap, BarChart3, Bell, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';

const FEATURES = [
  { icon: Trophy,    text: 'Expert-curated picks' },
  { icon: BarChart3, text: 'In-depth match analysis' },
  { icon: Bell,      text: 'Priority notifications' },
  { icon: Zap,       text: 'Historical accuracy 72%+' },
];

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

        <div className="flex flex-col justify-center">
          {joined ? (
            <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/[0.04]">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <div>
                <p className="text-[13px] font-semibold text-primary">You&apos;re on the list</p>
                <p className="label mt-0.5">We&apos;ll notify you at launch</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-3">
              <p className="label">Join the waitlist</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailErr(''); }}
                  className="h-9 text-sm"
                  aria-label="Email address"
                />
                <Button type="submit" size="sm" className="shrink-0">Join</Button>
              </div>
              {emailErr && <p className="text-xs text-destructive">{emailErr}</p>}
              <p className="label">No spam · unsubscribe anytime</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
