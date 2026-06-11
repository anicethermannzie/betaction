'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Check } from 'lucide-react';

export function HeroSection() {
  const handleScrollToHow = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] flex items-center bg-[#0f1419] overflow-hidden py-16 lg:py-24">
      {/* ── 1. CUSTOM PROFESSIONAL KEYFRAME ANIMATIONS ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 0.85;
            transform: translateX(0);
          }
        }
        @keyframes floatMockup {
          0%, 100% {
            transform: translateY(0px) rotate(1deg);
          }
          50% {
            transform: translateY(-12px) rotate(-1deg);
          }
        }
        @keyframes floatBadge1 {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(-6px, -10px); }
        }
        @keyframes floatBadge2 {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(8px, -6px); }
        }
        @keyframes floatBadge3 {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(-8px, 8px); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-right {
          animation: fadeInRight 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float-mockup {
          animation: floatMockup 6s ease-in-out infinite;
        }
        .animate-float-badge1 {
          animation: floatBadge1 6s ease-in-out infinite;
        }
        .animate-float-badge2 {
          animation: floatBadge2 6.5s ease-in-out infinite;
        }
        .animate-float-badge3 {
          animation: floatBadge3 5.8s ease-in-out infinite;
        }
        .text-shadow-premium {
          text-shadow: 0 4px 16px rgba(0, 0, 0, 0.95), 0 2px 4px rgba(0, 0, 0, 0.8);
        }
      `}} />

      {/* Decorative background grid and gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* ── DRAFTKINGS-STYLE BACKGROUND PLAYER COMPOSITION ── */}
      {/* Covers full background, with slanted design shapes and text-safe gradients */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden animate-fade-in-right" style={{ opacity: 0 }}>
        
        {/* Slanted color background shapes */}
        <div className="absolute inset-y-0 right-0 w-[55%] bg-gradient-to-tr from-emerald-500/10 via-emerald-600/5 to-transparent skew-x-[-15deg] origin-bottom translate-x-28 blur-[1px] hidden md:block" />
        <div className="absolute right-0 bottom-0 top-0 w-[10%] bg-gradient-to-t from-[#d4a017]/20 via-[#d4a017]/10 to-transparent skew-x-[-15deg] origin-bottom translate-x-20 hidden md:block" />

        {/* Large player cut-out image set to cover the full width & height background */}
        <img 
          src="/images/soccer_player_hero.png" 
          alt="Professional soccer player action background" 
          className="absolute right-0 bottom-0 h-full w-full object-cover object-right-bottom filter brightness-110 contrast-110 mix-blend-screen opacity-25 md:opacity-100"
        />

        {/* Soft edge masking to blend player into dark background and ensure text readability */}
        <div className="absolute inset-y-0 left-0 w-full md:w-[65%] bg-gradient-to-r from-[#0f1419] via-[#0f1419]/95 md:via-[#0f1419]/80 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0f1419] to-transparent z-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Side: Hero content (60%) */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left animate-fade-in-up" style={{ opacity: 0 }}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-black tracking-widest uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Predictions
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-none uppercase tracking-tight text-shadow-premium">
              PREDICT SMARTER.<br />
              <span className="text-[#10b981]">BET BETTER.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed text-shadow-premium">
              Get AI-generated betting tickets with up to 85% accuracy across 18 markets. Built for serious football fans.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center px-8 py-4 bg-[#10b981] hover:bg-[#0d9668] text-white font-black tracking-wider uppercase rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-emerald-500/20 group text-sm"
              >
                Start Free Trial
                <ArrowRight className="ml-2.5 h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#how-it-works"
                onClick={handleScrollToHow}
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white/20 hover:border-white/50 text-white font-black tracking-wider uppercase rounded-xl transition-all duration-300 transform hover:scale-[1.02] text-sm"
              >
                See How It Works
              </a>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-500 font-semibold select-none">
              <ShieldCheck className="h-4 w-4 text-[#10b981]" />
              <span>No credit card required · 7-day free trial</span>
            </div>
          </div>

          {/* Right Side: Mockup & Floating Badges (40%) */}
          {/* Shifted lg:justify-start so the mockup sits slightly left on desktop, showing the athlete on the right */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-start lg:pl-10 items-center py-8 z-10">
            
            {/* Main Phone App Mockup (Gently floats, styled smaller than before) */}
            <div className="relative w-[155px] sm:w-[170px] h-[310px] sm:h-[340px] rounded-[1.5rem] border-[4px] border-slate-800 bg-[#0f1419] shadow-2xl overflow-hidden flex flex-col p-1.5 z-10 transition-transform duration-500 hover:rotate-1 animate-float-mockup">
              {/* Speaker / Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2.5 bg-slate-800 rounded-b-lg z-20 flex items-center justify-center">
                <div className="w-5 h-0.5 bg-slate-900 rounded-full" />
              </div>
              
              {/* Mockup Content Screen */}
              <div className="flex-1 rounded-[1.1rem] overflow-y-auto bg-slate-950 p-2 pt-3.5 space-y-2.5 scrollbar-none flex flex-col justify-between">
                
                {/* Mockup Header */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-1">
                  <div className="flex items-center gap-0.5">
                    <span className="text-[#10b981] font-black text-[8px]">Bet</span>
                    <span className="text-white font-black text-[8px] -ml-0.5">Action</span>
                  </div>
                  <span className="text-[6.5px] text-slate-500 font-bold">1:15 PM</span>
                </div>

                {/* Safe Ticket Card */}
                <div className="border border-emerald-500/20 bg-[#1a2332]/80 rounded-lg p-2 space-y-1.5 shadow-lg flex-1 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[6.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded-full">
                        Ultra Safe
                      </span>
                      <span className="text-[6.5px] text-slate-400 font-black">4 LEGS</span>
                    </div>
                    <h4 className="text-[9.5px] font-black text-white leading-tight">Daily Multi-Bet</h4>
                  </div>

                  <div className="space-y-1 my-1 flex-1 flex flex-col justify-center">
                    {/* Leg 1 */}
                    <div className="flex justify-between items-center text-[7.5px] border-b border-slate-900/60 pb-0.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-300 truncate">Manchester City vs Arsenal</p>
                        <p className="text-[6.5px] text-slate-500">Match Winner · <span className="text-emerald-400 font-bold">Man City</span></p>
                      </div>
                      <span className="text-emerald-400 font-extrabold text-[6.5px] bg-slate-950 px-0.8 py-0.1 rounded">1.62</span>
                    </div>

                    {/* Leg 2 */}
                    <div className="flex justify-between items-center text-[7.5px] border-b border-slate-900/60 pb-0.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-300 truncate">Real Madrid vs Atletico</p>
                        <p className="text-[6.5px] text-slate-500">Double Chance · <span className="text-emerald-400 font-bold">RM or X</span></p>
                      </div>
                      <span className="text-emerald-400 font-extrabold text-[6.5px] bg-slate-950 px-0.8 py-0.1 rounded">1.25</span>
                    </div>

                    {/* Leg 3 */}
                    <div className="flex justify-between items-center text-[7.5px] border-b border-slate-900/60 pb-0.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-300 truncate">Bayern vs Dortmund</p>
                        <p className="text-[6.5px] text-slate-500">Over/Under 1.5 · <span className="text-emerald-400 font-bold">Over 1.5</span></p>
                      </div>
                      <span className="text-emerald-400 font-extrabold text-[6.5px] bg-slate-950 px-0.8 py-0.1 rounded">1.18</span>
                    </div>

                    {/* Leg 4 */}
                    <div className="flex justify-between items-center text-[7.5px] pb-0.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-300 truncate">PSG vs Marseille</p>
                        <p className="text-[6.5px] text-slate-500">Draw No Bet · <span className="text-emerald-400 font-bold">PSG</span></p>
                      </div>
                      <span className="text-emerald-400 font-extrabold text-[6.5px] bg-slate-950 px-0.8 py-0.1 rounded">1.33</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/60 pt-1.5 mt-auto">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[6px] text-slate-500 uppercase font-black block">Combined Odds</span>
                        <span className="text-emerald-400 font-black text-[9px] leading-none">3.18 (+218)</span>
                      </div>
                      <button className="px-1.5 py-0.5 bg-[#10b981] hover:bg-[#0d9668] text-white rounded text-[6.5px] font-black uppercase tracking-wider transition-colors">
                        COPY SLIP
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mockup CTA */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-md p-1.5 text-center">
                  <span className="text-[7.5px] font-black text-slate-300 uppercase tracking-widest block mb-0.5">
                    Ready to Play?
                  </span>
                  <div className="text-[6px] text-slate-500 leading-normal">
                    AI updates odds and recommendations.
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stat Badges (Floats independently, adjusted spacing for smaller phone) */}
            {/* Badge 1: 18 Markets Analyzed (Top Left) */}
            <div className="absolute top-4 left-[-20px] sm:left-[-35px] bg-[#1a2332]/95 border border-emerald-500/20 backdrop-blur rounded-xl p-2 shadow-xl z-20 flex items-center gap-1.5 transition-transform duration-300 hover:scale-105 animate-float-badge1">
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                <Check className="h-2.5 w-2.5 text-[#10b981] stroke-[3]" />
              </div>
              <div>
                <p className="text-white text-[9px] font-black leading-none">18 Markets</p>
                <p className="text-[7px] text-slate-500 font-bold mt-0.5">Analyzed Daily</p>
              </div>
            </div>

            {/* Badge 2: 85% Accuracy (Middle Right) */}
            <div className="absolute top-1/4 right-[-20px] sm:right-[-35px] bg-[#1a2332]/95 border border-emerald-500/20 backdrop-blur rounded-xl p-2 shadow-xl z-20 flex items-center gap-1.5 transition-transform duration-300 hover:scale-105 animate-float-badge2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                <Sparkles className="h-2.5 w-2.5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-white text-[9px] font-black leading-none">85% Accuracy</p>
                <p className="text-[7px] text-slate-500 font-bold mt-0.5">Top Predictions</p>
              </div>
            </div>

            {/* Badge 3: 4 Risk Levels (Bottom Left) */}
            <div className="absolute bottom-6 left-[-15px] sm:left-[-25px] bg-[#1a2332]/95 border border-emerald-500/20 backdrop-blur rounded-xl p-2 shadow-xl z-20 flex items-center gap-1.5 transition-transform duration-300 hover:scale-105 animate-float-badge3">
              <div className="h-5 w-5 rounded-full bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/30">
                <ShieldCheck className="h-2.5 w-2.5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-white text-[9px] font-black leading-none">4 Risk Levels</p>
                <p className="text-[7px] text-slate-500 font-bold mt-0.5">Safe to Risky</p>
              </div>
            </div>

        </div>
      </div>
    </div>
  </section>
  );
}
