'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// ── Static board rows — the "market" the hero is about ──────────────────────

const BOARD = [
  { home: 'Man City',   away: 'Arsenal',   p: [0.61, 0.22, 0.17], odds: 1.62, edge: +4.1 },
  { home: 'Real Madrid', away: 'Atlético', p: [0.54, 0.26, 0.20], odds: 1.85, edge: +2.7 },
  { home: 'Bayern',     away: 'Dortmund',  p: [0.58, 0.23, 0.19], odds: 1.70, edge: -1.2 },
  { home: 'Inter',      away: 'Juventus',  p: [0.44, 0.30, 0.26], odds: 2.20, edge: +6.3 },
  { home: 'PSG',        away: 'Marseille', p: [0.67, 0.19, 0.14], odds: 1.44, edge: +1.0 },
];

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

function Board() {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2">
        <span className="label">Model board · today</span>
        <span className="flex items-center gap-1.5 label">
          <span className="h-1.5 w-1.5 rounded-sm bg-primary animate-live-pulse" />
          live
        </span>
      </div>

      {/* column header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3.5 py-1.5 border-b border-border label">
        <span>Fixture</span>
        <span className="text-right w-20">H / X / A</span>
        <span className="text-right w-14">Edge</span>
      </div>

      <div className="divide-y divide-border">
        {BOARD.map((r) => (
          <div key={r.home} className="px-3.5 py-2.5">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
              <div className="min-w-0">
                <div className="text-[13px] text-foreground truncate">
                  {r.home} <span className="text-muted-foreground/50">v</span> {r.away}
                </div>
                <div className="num text-[10px] text-muted-foreground mt-0.5">@ {r.odds.toFixed(2)}</div>
              </div>
              <div className="num text-[11px] text-right w-20 tracking-tight">
                <span className="text-primary">{pct(r.p[0])}</span>
                <span className="text-muted-foreground/40"> · </span>
                <span className="text-muted-foreground">{pct(r.p[1])}</span>
                <span className="text-muted-foreground/40"> · </span>
                <span className="text-down">{pct(r.p[2])}</span>
              </div>
              <div
                className={`num text-[11px] font-semibold text-right w-14 ${
                  r.edge >= 0 ? 'text-primary' : 'text-down'
                }`}
              >
                {r.edge >= 0 ? '▲' : '▼'} {Math.abs(r.edge).toFixed(1)}
              </div>
            </div>
            {/* probability bar — three abutting segments */}
            <div className="stat-bar flex mt-2">
              <div className="bg-primary" style={{ width: `${r.p[0] * 100}%` }} />
              <div className="bg-hold"    style={{ width: `${r.p[1] * 100}%` }} />
              <div className="bg-down"    style={{ width: `${r.p[2] * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-3.5 py-2 label">
        Edge = model probability − implied probability
      </div>
    </div>
  );
}

export function HeroSection() {
  const handleScrollToHow = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative border-b border-border bg-background py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — thesis */}
          <div className="space-y-7">
            <span className="label">AI-Powered Predictions · 18 markets</span>

            <h1 className="font-mono text-4xl sm:text-5xl md:text-[3.4rem] font-bold leading-[1.05] tracking-tight text-foreground">
              Read the match<br />
              <span className="text-primary">like a market.</span>
            </h1>

            <p className="text-[15px] text-muted-foreground max-w-md leading-relaxed">
              BetAction turns every fixture into a price board: model probabilities,
              bookmaker odds, and the edge between them — updated as the day moves.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase tracking-wider text-[13px] rounded transition-colors"
              >
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                onClick={handleScrollToHow}
                className="inline-flex items-center justify-center h-11 px-6 border border-border hover:border-muted-foreground/40 text-foreground font-mono uppercase tracking-label text-[11px] rounded transition-colors"
              >
                How it works
              </a>
            </div>

            <p className="label">No card required · 7-day trial</p>
          </div>

          {/* Right — the signature board */}
          <div className="lg:pl-4">
            <Board />
          </div>

        </div>
      </div>
    </section>
  );
}
