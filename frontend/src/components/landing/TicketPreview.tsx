'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, ShieldCheck, Sparkles, AlertCircle, TrendingUp } from 'lucide-react';

export function TicketPreview() {
  return (
    <section id="predictions" className="py-20 bg-[#1a2332] relative overflow-hidden border-t border-border scroll-mt-16">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-bold tracking-widest uppercase">
            <TrendingUp className="h-3.5 w-3.5" />
            Today&apos;s AI Tickets
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-tight">
            Today&apos;s AI Tickets — Preview
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base font-medium">
            Explore a teaser of our top picks. Sign up to see full details and odds.
          </p>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          {/* Card 1: Ultra Safe (VISIBLE, teaser) */}
          <div className="bg-background/95 border-2 border-primary/40 rounded-lg p-5 flex flex-col justify-between relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[5rem] pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Ultra Safe
                </span>
                <span className="text-[10px] text-muted-foreground font-bold">3 LEGS</span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Match Day Multi</h4>
                <p className="text-xs text-muted-foreground font-medium">High Probability Accumulator</p>
              </div>

              {/* Legs */}
              <div className="space-y-3.5 pt-2 border-t border-border">
                {/* Leg 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-foreground/80">
                    <span className="truncate">Arsenal vs Chelsea</span>
                    <span className="text-primary">Locked</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Over 1.5 Goals</p>
                </div>

                {/* Leg 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-foreground/80">
                    <span className="truncate">Real Madrid vs Valencia</span>
                    <span className="text-primary">Locked</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Real Madrid Win or Draw</p>
                </div>

                {/* Leg 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-foreground/80">
                    <span className="truncate">Bayern Munich vs Stuttgart</span>
                    <span className="text-primary">Locked</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Bayern Win</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Combined Odds</span>
                  <span className="text-muted-foreground font-bold text-xs">Unlock to View</span>
                </div>
                <Link
                  href="/register"
                  className="px-3.5 py-2 bg-primary/10 hover:bg-primary/25 border border-primary/30 hover:border-primary/60 text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Unlock Odds
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Safe (BLURRED with lock) */}
          <div className="bg-background/90 border border-border rounded-lg p-5 flex flex-col justify-between relative overflow-hidden h-[340px] select-none">
            {/* Blurry Background Preview */}
            <div className="filter blur-md opacity-25 space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Safe</span>
                <span className="text-[10px] text-muted-foreground font-bold">4 Legs</span>
              </div>
              <h4 className="text-base font-bold text-white">Weekend Builder</h4>
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </div>
            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-background/70 -[4px] flex flex-col items-center justify-center p-4 text-center z-10 space-y-3">
              <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-foreground/80">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-wider">Safe Ticket</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Locked for Members</p>
              </div>
            </div>
          </div>

          {/* Card 3: Moderate (BLURRED with lock) */}
          <div className="bg-background/90 border border-border rounded-lg p-5 flex flex-col justify-between relative overflow-hidden h-[340px] select-none">
            {/* Blurry Background Preview */}
            <div className="filter blur-md opacity-25 space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Moderate</span>
                <span className="text-[10px] text-muted-foreground font-bold">5 Legs</span>
              </div>
              <h4 className="text-base font-bold text-white">Value Acca</h4>
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-background/70 -[4px] flex flex-col items-center justify-center p-4 text-center z-10 space-y-3">
              <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-foreground/80">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-wider">Moderate Ticket</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Locked for Members</p>
              </div>
            </div>
          </div>

          {/* Card 4: Risky (BLURRED with lock) */}
          <div className="bg-background/90 border border-border rounded-lg p-5 flex flex-col justify-between relative overflow-hidden h-[340px] select-none">
            {/* Blurry Background Preview */}
            <div className="filter blur-md opacity-25 space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Risky</span>
                <span className="text-[10px] text-muted-foreground font-bold">6 Legs</span>
              </div>
              <h4 className="text-base font-bold text-white">Big Multiplier</h4>
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-background/70 -[4px] flex flex-col items-center justify-center p-4 text-center z-10 space-y-3">
              <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-foreground/80">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-wider">Risky Ticket</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Locked for Members</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Text & CTA */}
        <div className="text-center space-y-4">
          <p className="text-foreground/80 font-bold text-base">
            🔒 Sign up to unlock all tickets and detailed analytics
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary hover:bg-[#0d9668] text-white font-bold tracking-wider uppercase rounded-lg transition-all duration-300 transform hover:scale-[1.02] text-sm group"
          >
            Unlock All Tickets Now
            <ArrowRight className="ml-2.5 h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
