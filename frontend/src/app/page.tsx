'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LandingPage } from '@/components/landing/LandingPage';
import { Dashboard } from '@/components/home/Dashboard';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration / initial loading fallback
  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 bg-[#0f1419] text-white">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="flex items-center gap-2 font-black text-xl">
            <span className="text-white">Bet</span>
            <span className="text-[#10b981]">Action</span>
          </div>
          <div className="text-[10px] text-slate-500 font-black tracking-widest uppercase">
            BetAction by ZahTech
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <LandingPage />;
}

