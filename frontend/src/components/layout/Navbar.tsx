'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, User, LogOut, ChevronDown, Trophy, FileText, Gift, DollarSign, Menu, X as CloseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const APP_NAV_LINKS = [
  { href: '/', label: 'Home', badge: null },
  { href: '/matches', label: 'Matches', badge: null },
  { href: '/tickets', label: 'Tickets', badge: 'NEW' },
  { href: '/predictions', label: 'Predictions', badge: null },
];

const LANDING_NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'about', label: 'About' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (pathname === '/') {
      e.preventDefault();
      setIsMobileMenuOpen(false);
      
      // If clicking 'about', scroll to footer
      const id = targetId === 'about' ? 'footer' : targetId;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const showLandingNav = mounted && !isAuthenticated;
  const showAppNav = mounted && isAuthenticated;

  return (
    <div className="w-full flex flex-col sticky top-0 z-50">
      
      {/* ── 1. PROMO BANNER ── */}
      {showLandingNav && isBannerVisible && (
        <div className="bg-[#10b981] text-slate-950 text-xs font-black py-2 px-4 flex items-center justify-between relative shadow-sm select-none">
          <div className="flex-1 text-center">
            🎯 Join thousands of smart bettors. Start your free trial today
          </div>
          <button 
            onClick={() => setIsBannerVisible(false)}
            className="p-1 rounded hover:bg-black/10 text-slate-950/80 hover:text-slate-950 transition-colors shrink-0 absolute right-3"
            aria-label="Dismiss banner"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── 2. NAVBAR BODY ── */}
      <header className="w-full border-b border-slate-800/80 bg-[#0f1419]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[#0f1419]/80 transition-all select-none">
        <div className="flex h-16 items-center px-4 md:px-6 max-w-7xl mx-auto justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-primary shrink-0">
            <Activity className="h-5 w-5 text-[#10b981]" />
            <span className="text-white font-black text-lg">Bet</span>
            <span className="text-[#10b981] font-black text-lg -ml-1.5">Action</span>
          </Link>

          {/* ── LANDING NAV: desktop center ── */}
          {showLandingNav && (
            <nav className="hidden md:flex items-center gap-6">
              {LANDING_NAV_LINKS.map(({ id, label }) => (
                <Link
                  key={id}
                  href={`/#${id}`}
                  onClick={(e) => handleNavClick(e, id)}
                  className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* ── APP NAV: desktop center ── */}
          {showAppNav && (
            <nav className="hidden md:flex items-center gap-1.5">
              {APP_NAV_LINKS.map(({ href, label, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-slate-800/60 hover:text-white',
                    pathname === href ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  )}
                >
                  {label}
                  {badge && (
                    <span className="relative flex items-center">
                      <span className="text-[9px] font-bold px-1 py-px rounded bg-emerald-500 text-white leading-none">
                        {badge}
                      </span>
                      <span className="absolute inset-0 rounded bg-emerald-500 animate-ping opacity-40" />
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* ── LANDING ACTION BUTTONS (Right Side) ── */}
            {showLandingNav && (
              <div className="hidden md:flex items-center gap-4">
                <Link 
                  href="/login" 
                  className="text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex items-center justify-center px-4 py-2 bg-[#10b981] hover:bg-[#0d9668] text-white font-black tracking-wider uppercase text-xs rounded-lg transition-colors active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* ── APP PROFILE MENU (Right Side) ── */}
            {showAppNav && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 hover:bg-slate-800/40">
                    <Avatar className="h-7 w-7 border border-slate-700">
                      <AvatarFallback className="text-xs bg-[#10b981] text-slate-950 font-black">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm text-slate-200 font-bold">{user.username}</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-slate-900 border border-slate-800 text-white">
                  <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
                    <Link href="/profile" className="flex items-center gap-2 font-semibold text-xs">
                      <User className="h-4 w-4 text-[#10b981]" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-850" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-400 focus:text-red-400 focus:bg-slate-800 cursor-pointer flex items-center gap-2 font-semibold text-xs"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Burger (Landing page only) */}
            {showLandingNav && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800/40 h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#0f1419] border-l border-slate-800 w-64 text-white p-6 flex flex-col justify-between">
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 font-bold text-primary">
                      <Activity className="h-5 w-5 text-[#10b981]" />
                      <span className="text-white font-black text-lg">Bet</span>
                      <span className="text-[#10b981] font-black text-lg -ml-1.5">Action</span>
                    </div>

                    <nav className="flex flex-col gap-5">
                      {LANDING_NAV_LINKS.map(({ id, label }) => (
                        <Link
                          key={id}
                          href={`/#${id}`}
                          onClick={(e) => handleNavClick(e, id)}
                          className="text-slate-300 hover:text-white text-sm font-black uppercase tracking-wider transition-colors block"
                        >
                          {label}
                        </Link>
                      ))}
                    </nav>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-800">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full inline-flex items-center justify-center py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full inline-flex items-center justify-center py-3 bg-[#10b981] hover:bg-[#0d9668] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Sign Up
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            )}

          </div>
        </div>
      </header>

      {/* ── 3. APP MOBILE BOTTOM BAR (Authenticated only) ── */}
      {showAppNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0b0f19] border-t border-slate-800/80 flex justify-around items-center h-16 px-2 select-none shadow-2xl">
          {[
            { href: '/', label: 'Home', icon: Trophy },
            { href: '/profile', label: 'My Bets', icon: FileText },
            { href: '#', label: 'Rewards', icon: Gift },
            { href: '/profile', label: '$250.00', icon: DollarSign },
          ].map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full py-2 gap-1 text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95',
                  isActive ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-emerald-400' : 'text-slate-400')} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
