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
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 bg-background">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-sm bg-primary animate-live-pulse" />
          <span className="font-mono text-lg font-bold tracking-tight text-foreground">
            BET<span className="text-primary">ACTION</span>
          </span>
        </div>
        <div className="label">loading market</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <LandingPage />;
}

