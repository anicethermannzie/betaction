'use client';

import React from 'react';
import { Bot, Ticket, BarChart3, ArrowRight } from 'lucide-react';

const CARDS = [
  { n: '01', title: 'AI Predictions', description: 'The model reads 18 markets across every match to surface the highest-probability picks.', icon: Bot, targetId: 'predictions' },
  { n: '02', title: 'Smart Tickets',  description: 'Ready-to-play accumulators at 4 risk levels — Ultra Safe to Risky — or build your own.', icon: Ticket, targetId: 'predictions' },
  { n: '03', title: 'Deep Analysis',  description: 'Every call is backed by form, head-to-head, home/away splits, goal ratios and odds.', icon: BarChart3, targetId: 'how-it-works' },
];

export function DiscoverSection() {
  const handleScroll = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="features" className="py-20 bg-card border-t border-border scroll-mt-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <div className="max-w-2xl mb-12 space-y-2">
          <p className="section-title">Overview</p>
          <h2 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Discover BetAction
          </h2>
          <p className="text-sm text-muted-foreground">
            A sports-forecasting desk built by ZahTech LLC.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {CARDS.map(({ n, title, description, icon: Icon, targetId }) => (
            <div key={n} className="bg-background p-6 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-border text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="num text-[11px] text-muted-foreground/50">{n}</span>
                </div>
                <h3 className="font-mono text-[13px] font-semibold uppercase tracking-wide text-foreground">
                  {title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>

              <a
                href={`#${targetId}`}
                onClick={(e) => handleScroll(e, targetId)}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-label text-primary hover:text-primary/80 transition-colors"
              >
                Learn more
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
