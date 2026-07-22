'use client';

import { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { BetSlip } from '../betslip/BetSlip';
import { useAuth } from '@/hooks/useAuth';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showAppShell = mounted && isAuthenticated;

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1419]">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {showAppShell && <Sidebar />}
        <main className="flex-1 overflow-y-auto relative pb-28 md:pb-20">
          {children}
          {showAppShell && <BetSlip />}
        </main>
      </div>
      <Footer />
    </div>
  );
}

