'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, ShieldCheck, Sparkles, AlertCircle, TrendingUp } from 'lucide-react';

export function TicketPreview() {
  return (
    <section id="predictions" className="py-20 bg-[#1a2332] relative overflow-hidden border-t border-slate-900/60 scroll-mt-16">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-black tracking-widest uppercase">
            <TrendingUp className="h-3.5 w-3.5" />
            Today&apos;s AI Tickets
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Today&apos;s AI Tickets — Preview
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium">
            Explore a teaser of our top picks. Sign up to see full details and odds.
          </p>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          {/* Card 1: Ultra Safe (VISIBLE, teaser) */}
          <div className="bg-[#0f1419]/95 border-2 border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[5rem] pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  Ultra Safe
                </span>
                <span className="text-[10px] text-slate-500 font-bold">3 LEGS</span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-base font-black text-white">Match Day Multi</h4>
                <p className="text-xs text-slate-500 font-medium">High Probability Accumulator</p>
              </div>

              {/* Legs */}
              <div className="space-y-3.5 pt-2 border-t border-slate-800">
                {/* Leg 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="truncate">Arsenal vs Chelsea</span>
                    <span className="text-emerald-500">Locked</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Over 1.5 Goals</p>
                </div>

                {/* Leg 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="truncate">Real Madrid vs Valencia</span>
                    <span className="text-emerald-500">Locked</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Real Madrid Win or Draw</p>
                </div>

                {/* Leg 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="truncate">Bayern Munich vs Stuttgart</span>
                    <span className="text-emerald-500">Locked</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Bayern Win</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-black block">Combined Odds</span>
                  <span className="text-slate-400 font-black text-xs">Unlock to View</span>
                </div>
                <Link
                  href="/register"
                  className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  Unlock Odds
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Safe (BLURRED with lock) */}
          <div className="bg-[#0f1419]/90 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden h-[340px] select-none">
            {/* Blurry Background Preview */}
            <div className="filter blur-md opacity-25 space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Safe</span>
                <span className="text-[10px] text-slate-500 font-bold">4 Legs</span>
              </div>
              <h4 className="text-base font-black text-white">Weekend Builder</h4>
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
                <div className="h-4 bg-slate-800 rounded w-2/3" />
                <div className="h-4 bg-slate-800 rounded w-3/4" />
              </div>
            </div>
            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-[#0f1419]/70 backdrop-blur-[4px] flex flex-col items-center justify-center p-4 text-center z-10 space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white text-xs font-black uppercase tracking-wider">Safe Ticket</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Locked for Members</p>
              </div>
            </div>
          </div>

          {/* Card 3: Moderate (BLURRED with lock) */}
          <div className="bg-[#0f1419]/90 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden h-[340px] select-none">
            {/* Blurry Background Preview */}
            <div className="filter blur-md opacity-25 space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Moderate</span>
                <span className="text-[10px] text-slate-500 font-bold">5 Legs</span>
              </div>
              <h4 className="text-base font-black text-white">Value Acca</h4>
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="h-4 bg-slate-800 rounded w-2/3" />
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-[#0f1419]/70 backdrop-blur-[4px] flex flex-col items-center justify-center p-4 text-center z-10 space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white text-xs font-black uppercase tracking-wider">Moderate Ticket</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Locked for Members</p>
              </div>
            </div>
          </div>

          {/* Card 4: Risky (BLURRED with lock) */}
          <div className="bg-[#0f1419]/90 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden h-[340px] select-none">
            {/* Blurry Background Preview */}
            <div className="filter blur-md opacity-25 space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Risky</span>
                <span className="text-[10px] text-slate-500 font-bold">6 Legs</span>
              </div>
              <h4 className="text-base font-black text-white">Big Multiplier</h4>
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-800 rounded w-2/3" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-[#0f1419]/70 backdrop-blur-[4px] flex flex-col items-center justify-center p-4 text-center z-10 space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white text-xs font-black uppercase tracking-wider">Risky Ticket</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Locked for Members</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Text & CTA */}
        <div className="text-center space-y-4">
          <p className="text-slate-300 font-bold text-base">
            🔒 Sign up to unlock all tickets and detailed analytics
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#10b981] hover:bg-[#0d9668] text-white font-black tracking-wider uppercase rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/20 text-sm group"
          >
            Unlock All Tickets Now
            <ArrowRight className="ml-2.5 h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
