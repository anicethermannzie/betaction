'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="bg-[#0a0f14] border-t border-slate-900 text-slate-400 py-16 text-xs select-none relative z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ── 4-COLUMN GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">
          
          {/* Column 1 (Brand): 4 cols */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-primary">
              <Activity className="h-5 w-5 text-[#10b981]" />
              <span className="text-white font-black text-lg">Bet</span>
              <span className="text-[#10b981] font-black text-lg -ml-1.5">Action</span>
            </Link>
            <p className="text-slate-500 font-medium text-xs leading-normal max-w-sm">
              AI-Powered Sports Predictions. Get advanced statistics, probabilities, and custom ticket recommendations generated in real-time.
            </p>

            <div className="space-y-1.5 pt-2">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Product Development</p>
              <a href="https://zahtech.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold hover:border-emerald-800 hover:text-white transition-colors">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Built by <span className="text-white">ZahTech LLC</span>
              </a>
            </div>
          </div>

          {/* Column 2 (Product): 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2.5 font-bold text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#predictions" className="hover:text-white transition-colors">Predictions</a></li>
              <li><a href="#predictions" className="hover:text-white transition-colors">Tickets</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Markets</a></li>
            </ul>
          </div>

          {/* Column 3 (Company): 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px]">Company</h4>
            <ul className="space-y-2.5 font-bold text-xs">
              <li><a href="https://zahtech.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">About ZahTech</a></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Careers</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Contact</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Blog</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Press</span></li>
            </ul>
          </div>

          {/* Column 4 (Legal): 4 cols */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-slate-200 font-black uppercase tracking-wider text-[11px]">Legal</h4>
            <ul className="space-y-2.5 font-bold text-xs">
              <li><span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Responsible Gambling</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Cookie Policy</span></li>
            </ul>
          </div>

        </div>

        {/* ── SOCIAL LINKS & DISCLOSURE ── */}
        <div className="border-t border-slate-900 pt-8 mt-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Social Networks List */}
            <div className="flex items-center gap-4 text-slate-500">
              <span className="hover:text-white cursor-pointer transition-colors"><Twitter className="h-4 w-4" /></span>
              <span className="hover:text-white cursor-pointer transition-colors"><Instagram className="h-4 w-4" /></span>
              <span className="hover:text-white cursor-pointer transition-colors"><Linkedin className="h-4 w-4" /></span>
              <span className="hover:text-white cursor-pointer transition-colors"><Youtube className="h-4 w-4" /></span>
              <span className="text-[10px] hover:text-white cursor-pointer font-bold uppercase transition-colors">TikTok</span>
            </div>

            {/* Powered Badge (Similar to Vercel/NextJS style) */}
            <div className="flex items-center gap-2 select-none">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Powered By</span>
              <div className="px-2.5 py-1 bg-white text-slate-950 font-black rounded text-[9px] uppercase tracking-wider shadow-sm">
                ▲ ZahTech
              </div>
            </div>
          </div>

          {/* Detailed Legal Disclosure */}
          <div className="bg-slate-950/40 border border-slate-900/60 p-4 rounded-xl text-slate-600 font-medium text-[11px] leading-relaxed">
            <span className="text-slate-500 font-bold block mb-1">Disclaimer & Responsibility:</span>
            BetAction is a prediction tool for entertainment purposes. We do not accept bets, process payments, or operate as a sportsbook. 
            Sports predictions carry inherent risks. We encourage you to bet responsibly and check your local laws before participating in real money wagering.
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="border-t border-slate-900 pt-6 mt-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-600 font-bold gap-3">
          <p>© {currentYear} ZahTech LLC. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <span>Product availability varies by jurisdiction.</span>
            <span>·</span>
            <span>BetAction is a prediction tool. We do not accept bets or process payments.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
