'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, User, LogOut, ChevronDown, Trophy, FileText, Gift, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const NAV_LINKS = [
  { href: '/', label: 'Home', badge: null },
  { href: '/matches', label: 'Matches', badge: null },
  { href: '/tickets', label: 'Tickets', badge: 'NEW' },
  { href: '/predictions', label: 'Predictions', badge: null },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-primary mr-6">
          <Activity className="h-5 w-5" />
          <span className="hidden sm:inline">BetAction</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ href, label, badge }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                pathname === href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
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

        {/* Right section */}
        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-8 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{user.username}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
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
    </header>
  );
}
