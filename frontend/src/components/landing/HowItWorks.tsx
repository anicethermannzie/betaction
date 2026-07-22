'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-[#0f1419] relative overflow-hidden border-t border-slate-900/60 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Here&apos;s How It Works
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium">
            Start betting smarter in minutes. Follow these simple steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12 relative">
          
          {/* Connector Line (visible on desktop) */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-emerald-500/20 via-[#10b981]/40 to-emerald-500/20 z-0" />

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10 group">
            <div className="w-20 h-20 rounded-full bg-[#1a2332] border-2 border-slate-800 flex items-center justify-center text-white text-2xl font-black transition-all duration-300 group-hover:border-[#10b981] group-hover:bg-[#10b981]/5 select-none shadow-lg">
              1
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wide">
              Sign Up for Free
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Create your account in 30 seconds. No credit card needed.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10 group">
            <div className="w-20 h-20 rounded-full bg-[#1a2332] border-2 border-slate-800 flex items-center justify-center text-white text-2xl font-black transition-all duration-300 group-hover:border-[#10b981] group-hover:bg-[#10b981]/5 select-none shadow-lg">
              2
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wide">
              Get Today&apos;s Predictions
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Our AI analyzes every match and generates smart tickets with the best picks.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10 group">
            <div className="w-20 h-20 rounded-full bg-[#1a2332] border-2 border-slate-800 flex items-center justify-center text-white text-2xl font-black transition-all duration-300 group-hover:border-[#10b981] group-hover:bg-[#10b981]/5 select-none shadow-lg">
              3
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wide">
              Copy & Play
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Copy your ticket to your favorite sportsbook and place your bet.
            </p>
          </div>

        </div>

        {/* CTA Button */}
        <div className="text-center mt-16">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#10b981] hover:bg-[#0d9668] text-white font-black tracking-wider uppercase rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/20 text-sm group"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2.5 h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
