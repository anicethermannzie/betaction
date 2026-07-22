'use client';

import React from 'react';
import Link from 'next/link';
import { Check, X, Award, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-[#1a2332] relative overflow-hidden border-t border-slate-900/60 scroll-mt-16">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#d4a017]/30 bg-[#d4a017]/10 text-[#d4a017] text-xs font-black tracking-widest uppercase">
            <Star className="h-3.5 w-3.5 fill-current" />
            Pricing Plans
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Simple Pricing
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium">
            Choose the tier that fits your betting strategy. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* Card 1: Free Trial */}
          <div className="bg-[#0f1419] border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover-glow transition-all duration-300">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Free Trial</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">/ 7 days</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Test our algorithms with zero risk.</p>
              </div>

              {/* Features List */}
              <ul className="space-y-3.5 text-sm border-t border-slate-800 pt-6">
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[#10b981] shrink-0" />
                  <span className="font-semibold text-xs text-slate-300">1 AI ticket per day</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[#10b981] shrink-0" />
                  <span className="font-semibold text-xs text-slate-300">Up to 3 legs per ticket</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[#10b981] shrink-0" />
                  <span className="font-semibold text-xs text-slate-300">6 basic markets</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[#10b981] shrink-0" />
                  <span className="font-semibold text-xs text-slate-300">Basic predictions</span>
                </li>
                <li className="flex items-center gap-3 text-slate-500/80">
                  <X className="h-4.5 w-4.5 text-slate-600 shrink-0" />
                  <span className="font-semibold text-xs line-through">Full match analysis</span>
                </li>
                <li className="flex items-center gap-3 text-slate-500/80">
                  <X className="h-4.5 w-4.5 text-slate-600 shrink-0" />
                  <span className="font-semibold text-xs line-through">Copy/Save tickets</span>
                </li>
                <li className="flex items-center gap-3 text-slate-500/80">
                  <X className="h-4.5 w-4.5 text-slate-600 shrink-0" />
                  <span className="font-semibold text-xs line-through">All 18 markets</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-800">
              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center py-3.5 border-2 border-white/20 hover:border-white/50 text-white font-black tracking-wider uppercase rounded-xl transition-all duration-300 text-xs"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Card 2: VIP */}
          <div className="bg-[#0f1419] border-2 border-[#10b981] rounded-3xl p-8 flex flex-col justify-between hover-glow shadow-xl shadow-emerald-500/5 relative transition-all duration-300 transform md:-translate-y-2">
            {/* POPULAR badge */}
            <div className="absolute top-0 right-8 -translate-y-1/2 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#d4a017] to-[#f59e0b] rounded-full text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md">
              <Award className="h-3 w-3 stroke-[2.5]" />
              Popular
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-[#d4a017]">
                  <Star className="h-4.5 w-4.5 fill-current" />
                  <h3 className="text-xl font-black uppercase tracking-wider">VIP</h3>
                </div>
                
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">$9.99</span>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">/ month</span>
                  </div>
                  <div className="text-[10px] text-[#d4a017] font-extrabold uppercase mt-1">
                    or $59.99/year (Save 50%)
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium">Unlock full power of BetAction AI engine.</p>
              </div>

              {/* Features List */}
              <ul className="space-y-3.5 text-sm border-t border-slate-800 pt-6">
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[#10b981] shrink-0" />
                  <span className="font-semibold text-xs text-slate-200">Unlimited AI tickets</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[#10b981] shrink-0" />
                  <span className="font-semibold text-xs text-slate-200">Up to 10 legs per ticket</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[#10b981] shrink-0" />
                  <span className="font-semibold text-xs text-slate-200">All 18 markets</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[#10b981] shrink-0" />
                  <span className="font-semibold text-xs text-slate-200">Full match analysis breakdown</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[#10b981] shrink-0" />
                  <span className="font-semibold text-xs text-slate-200">Copy, Save, Share tickets</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Check className="h-4.5 w-4.5 text-[#10b981] shrink-0" />
                  <span className="font-semibold text-xs text-slate-200">Build your own tickets</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Star className="h-4.5 w-4.5 text-[#d4a017] fill-[#d4a017]/20 shrink-0" />
                  <span className="font-semibold text-xs text-slate-200">Priority support</span>
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <Star className="h-4.5 w-4.5 text-[#d4a017] fill-[#d4a017]/20 shrink-0" />
                  <span className="font-semibold text-xs text-slate-200">Early access to new sports</span>
                </li>
              </ul>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-800">
              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center py-4 bg-[#10b981] hover:bg-[#0d9668] text-white font-black tracking-wider uppercase rounded-xl transition-all duration-300 text-xs shadow-lg shadow-emerald-500/25 transform hover:scale-[1.01]"
              >
                Get VIP Access
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
