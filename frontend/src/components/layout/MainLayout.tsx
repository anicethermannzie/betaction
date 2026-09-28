'use client';

import { useHydrated } from '@/hooks/useHydrated';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { BetSlip } from '../betslip/BetSlip';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated } = useAuth();
  const mounted = useHydrated();

  const showAppShell = mounted && isAuthenticated;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {showAppShell && <Sidebar />}
        <main className="flex-1 overflow-y-auto relative pb-28 md:pb-20">
          {/*
            Page content is boundaried separately from the shell so a crash in a
            page leaves the navbar and sidebar usable — the user can navigate
            away instead of staring at a blank screen. app/error.tsx covers the
            same ground for route-level errors; this also catches components
            rendered outside the route tree, such as the bet slip below.
          */}
          <ErrorBoundary>{children}</ErrorBoundary>
          {showAppShell && (
            <ErrorBoundary fallback={null}>
              <BetSlip />
            </ErrorBoundary>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
