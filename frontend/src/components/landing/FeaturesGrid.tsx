'use client';

import React from 'react';
import { Layers, Shield, Sliders, RefreshCw, LineChart } from 'lucide-react';

const FEATURES = [
  { n: '01', title: '18 Markets',        description: 'Match result, over/under, BTTS, corners, correct score — every market modelled.', icon: Layers },
  { n: '02', title: '4 Risk Levels',     description: 'Ultra safe, safe, moderate, risky. Pick the band that matches your appetite.', icon: Shield },
  { n: '03', title: 'Build Your Own',    description: 'Assemble custom tickets from the market analysis, leg by leg.',                  icon: Sliders },
  { n: '04', title: 'Real-Time Updates', description: 'Live scores and probabilities move as the matches do.',                          icon: RefreshCw },
  { n: '05', title: 'Track Accuracy',    description: 'Your prediction history and hit rate, kept honest.',                             icon: LineChart },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <div className="max-w-2xl mb-12 space-y-2">
          <p className="section-title">What you get</p>
          <h2 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Everything the desk needs
          </h2>
          <p className="text-sm text-muted-foreground">
            One tool for reading the board, sizing the risk, and keeping score.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {FEATURES.map(({ n, title, description, icon: Icon }) => (
            <div key={n} className="bg-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-border text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="num text-[11px] text-muted-foreground/50">{n}</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-mono text-[13px] font-semibold uppercase tracking-wide text-foreground">
                  {title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
          {/* fills the 6th grid cell so the hairline grid stays square on lg */}
          <div className="bg-card p-6 hidden lg:block" aria-hidden="true" />
        </div>

      </div>
    </section>
  );
}
