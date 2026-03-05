'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Menu, User, LogOut, ChevronDown } from 'lucide-react';
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
  { href: '/',            label: 'Home',        badge: null },
  { href: '/matches',     label: 'Matches',     badge: null },
  { href: '/tickets',     label: 'Tickets',     badge: 'NEW' },
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

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 pt-10">
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map(({ href, label, badge }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent',
                      pathname === href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                    {badge && (
                      <span className="text-[9px] font-bold px-1 py-px rounded bg-emerald-500 text-white leading-none">
                        {badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
