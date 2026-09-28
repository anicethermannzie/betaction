'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

/**
 * Route-level error boundary.
 *
 * There was none: any exception thrown while rendering a client component —
 * a malformed payload reaching `p.home_win`, a null `fixture.teams` — unmounted
 * the tree and left a blank page in production.
 *
 * The message shown is deliberately generic. `error.message` can contain
 * internals, and in production Next replaces it with a digest anyway; the digest
 * is surfaced so a user can quote it in a support request.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    logger.error('Unhandled render error', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-lg font-bold text-foreground">Something went wrong</h1>
        <p className="mx-auto max-w-[360px] text-sm text-muted-foreground">
          This page failed to load. It&apos;s a problem on our side — your account and
          data are unaffected.
        </p>
        {error.digest && (
          <p className="num pt-1 text-[11px] text-muted-foreground/60">
            Reference: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset} size="sm">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </Button>
        <Button variant="outline" size="sm" onClick={() => router.push('/')}>
          Go to homepage
        </Button>
      </div>
    </div>
  );
}
