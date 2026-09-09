'use client';

import React from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Row = { label: string; free: boolean | string; vip: boolean | string };

const ROWS: Row[] = [
  { label: 'AI tickets per day',        free: '1',  vip: 'Unlimited' },
  { label: 'Legs per ticket',           free: '3',  vip: '10' },
  { label: 'Markets',                   free: '6',  vip: 'All 18' },
  { label: 'Match analysis breakdown',  free: false, vip: true },
  { label: 'Copy · save · share',       free: false, vip: true },
  { label: 'Build your own tickets',    free: false, vip: true },
  { label: 'Priority support',          free: false, vip: true },
  { label: 'Early access to new sports', free: false, vip: true },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="h-4 w-4 text-primary" aria-label="included" />;
  if (v === false) return <X className="h-4 w-4 text-muted-foreground/40" aria-label="not included" />;
  return <span className="num text-xs text-foreground">{v}</span>;
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-card border-t border-border scroll-mt-14">
      <div className="max-w-3xl mx-auto px-4 md:px-6">

        <div className="mb-10 space-y-2">
          <p className="section-title">Pricing</p>
          <h2 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Two tiers. Cancel anytime.
          </h2>
        </div>

        <div className="panel overflow-hidden">
          {/* header */}
          <div className="grid grid-cols-[1fr_auto_auto] items-end gap-4 border-b border-border p-4">
            <span className="label">Plan</span>
            <div className="w-24 text-center">
              <p className="label mb-1">Free trial</p>
              <p className="num text-lg font-bold text-foreground">$0<span className="text-[11px] text-muted-foreground"> / 7d</span></p>
            </div>
            <div className="w-24 text-center">
              <p className="label mb-1 text-primary">VIP</p>
              <p className="num text-lg font-bold text-foreground">$9.99<span className="text-[11px] text-muted-foreground"> / mo</span></p>
            </div>
          </div>

          {/* rows */}
          <div className="divide-y divide-border">
            {ROWS.map((r) => (
              <div key={r.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2.5">
                <span className="text-[13px] text-foreground/85">{r.label}</span>
                <span className="w-24 flex justify-center"><Cell v={r.free} /></span>
                <span className={cn('w-24 flex justify-center', r.vip && 'bg-primary/[0.03]')}><Cell v={r.vip} /></span>
              </div>
            ))}
          </div>

          {/* actions */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-t border-border p-4">
            <span />
            <Link
              href="/register"
              className="w-24 inline-flex items-center justify-center h-9 border border-border hover:border-muted-foreground/40 text-foreground font-mono text-[10px] uppercase tracking-label rounded transition-colors"
            >
              Try free
            </Link>
            <Link
              href="/register"
              className="w-24 inline-flex items-center justify-center h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[10px] uppercase tracking-wider rounded transition-colors"
            >
              Get VIP
            </Link>
          </div>
        </div>

        <p className="label mt-3">VIP annual $59.99 · saves 50%</p>
      </div>
    </section>
  );
}
