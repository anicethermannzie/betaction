'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, ChevronDown, Trophy, FileText, Gift, DollarSign, Menu, X as CloseIcon } from 'lucide-react';
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

// ── Wordmark ────────────────────────────────────────────────────────────────

function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 shrink-0', className)}>
      <span className="h-1.5 w-1.5 rounded-sm bg-primary" />
      <span className="font-mono text-[15px] font-bold tracking-tight text-foreground">
        BET<span className="text-primary">ACTION</span>
      </span>
    </Link>
  );
}

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
      const id = targetId === 'about' ? 'footer' : targetId;
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const showLandingNav = mounted && !isAuthenticated;
  const showAppNav = mounted && isAuthenticated;

  return (
    <div className="w-full flex flex-col sticky top-0 z-50">

      {/* ── 1. PROMO STRIP — thin hairline, not a billboard ── */}
      {showLandingNav && isBannerVisible && (
        <div className="bg-card border-b border-border py-1.5 px-4 flex items-center justify-center relative select-none">
          <p className="font-mono text-[10px] uppercase tracking-label text-muted-foreground">
            Free trial open <span className="text-primary">/</span> no card required
          </p>
          <button
            onClick={() => setIsBannerVisible(false)}
            className="p-1 text-muted-foreground/60 hover:text-foreground transition-colors absolute right-2"
            aria-label="Dismiss"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── 2. NAVBAR BODY ── */}
      <header className="w-full border-b border-border bg-background select-none">
        <div className="flex h-14 items-center px-4 md:px-6 max-w-7xl mx-auto justify-between">

          <Wordmark />

          {/* ── LANDING NAV: desktop center ── */}
          {showLandingNav && (
            <nav className="hidden md:flex items-center gap-7">
              {LANDING_NAV_LINKS.map(({ id, label }) => (
                <Link
                  key={id}
                  href={`/#${id}`}
                  onClick={(e) => handleNavClick(e, id)}
                  className="font-mono text-[11px] uppercase tracking-label text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* ── APP NAV: desktop center ── */}
          {showAppNav && (
            <nav className="hidden md:flex items-center gap-1">
              {APP_NAV_LINKS.map(({ href, label, badge }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3 h-14 font-mono text-[11px] uppercase tracking-label transition-colors',
                      'border-b-2',
                      active
                        ? 'text-primary border-b-primary'
                        : 'text-muted-foreground border-b-transparent hover:text-foreground'
                    )}
                  >
                    {label}
                    {badge && (
                      <span className="tick bg-primary/10 text-primary">{badge}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right section */}
          <div className="flex items-center gap-3 shrink-0">

            {/* ── LANDING ACTIONS ── */}
            {showLandingNav && (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/login"
                  className="font-mono text-[11px] uppercase tracking-label text-muted-foreground hover:text-foreground transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase tracking-wider text-[11px] rounded transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* ── APP PROFILE MENU ── */}
            {showAppNav && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                    <Avatar className="h-7 w-7 rounded-sm border border-border">
                      <AvatarFallback className="rounded-sm text-[10px] font-mono bg-muted text-foreground font-bold">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-xs text-foreground font-medium">{user.username}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 bg-popover border border-border">
                  <DropdownMenuItem asChild className="focus:bg-muted cursor-pointer">
                    <Link href="/profile" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-down focus:text-down focus:bg-muted cursor-pointer flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile burger (landing only) */}
            {showLandingNav && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-background border-l border-border w-64 p-6 flex flex-col justify-between">
                  <div className="space-y-8">
                    <Wordmark />
                    <nav className="flex flex-col gap-5">
                      {LANDING_NAV_LINKS.map(({ id, label }) => (
                        <Link
                          key={id}
                          href={`/#${id}`}
                          onClick={(e) => handleNavClick(e, id)}
                          className="font-mono text-xs uppercase tracking-label text-muted-foreground hover:text-foreground transition-colors block"
                        >
                          {label}
                        </Link>
                      ))}
                    </nav>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-border">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full inline-flex items-center justify-center h-10 border border-border hover:border-muted-foreground/40 text-foreground/80 font-mono text-[11px] uppercase tracking-label rounded transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full inline-flex items-center justify-center h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[11px] uppercase tracking-wider rounded transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            )}

          </div>
        </div>
      </header>

      {/* ── 3. APP MOBILE BOTTOM BAR ── */}
      {showAppNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border flex justify-around items-center h-16 px-2 select-none">
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
                  'flex flex-col items-center justify-center flex-1 h-full py-2 gap-1 font-mono text-[9px] uppercase tracking-label transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
