'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Last-resort boundary: catches errors thrown in the root layout itself, which
 * app/error.tsx cannot reach because it renders *inside* that layout.
 *
 * It replaces the whole document, so it must render its own <html> and <body>
 * and cannot rely on the app's providers, fonts or Tailwind layer being mounted.
 * Styles are therefore inline and deliberately minimal.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Root layout error', error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0b',
          color: '#e8e8ea',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          padding: '24px',
        }}
      >
        <main style={{ maxWidth: '420px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5 }}>
            BetAction
          </p>
          <h1 style={{ fontSize: '18px', margin: '12px 0 8px' }}>The app failed to start</h1>
          <p style={{ fontSize: '13px', lineHeight: 1.6, opacity: 0.7, margin: 0 }}>
            Something went wrong before the page could load. Please reload; if it
            keeps happening, contact support.
          </p>
          {error.digest && (
            <p style={{ fontSize: '11px', opacity: 0.45, marginTop: '12px' }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '20px',
              padding: '8px 18px',
              fontSize: '13px',
              color: '#0a0a0b',
              background: '#22c55e',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
