/**
 * Browser-side logger.
 *
 * Replaces scattered console.* calls. In development it writes to the console;
 * in production it stays silent unless a reporter is installed, so we neither
 * leak internals into a customer's console nor lose the ability to report.
 *
 * `report` is the hook for an error tracker (Sentry et al) once one is added —
 * call `setErrorReporter` from a client component at start-up.
 */

type Meta = Record<string, unknown>;
type Reporter = (error: unknown, meta?: Meta) => void;

const isDev = process.env.NODE_ENV !== 'production';

let reporter: Reporter | null = null;

export function setErrorReporter(fn: Reporter): void {
  reporter = fn;
}

export const logger = {
  debug(message: string, meta?: Meta): void {
    if (isDev) console.debug(`[betaction] ${message}`, meta ?? '');
  },

  info(message: string, meta?: Meta): void {
    if (isDev) console.info(`[betaction] ${message}`, meta ?? '');
  },

  warn(message: string, meta?: Meta): void {
    if (isDev) console.warn(`[betaction] ${message}`, meta ?? '');
  },

  /**
   * Log an error and forward it to the reporter when one is installed.
   * Never rethrows — logging must not become its own failure.
   */
  error(message: string, error?: unknown, meta?: Meta): void {
    if (isDev) console.error(`[betaction] ${message}`, error ?? '', meta ?? '');
    try {
      reporter?.(error ?? new Error(message), { message, ...meta });
    } catch {
      /* A failing reporter must not break the caller. */
    }
  },
};

/**
 * Turn an unknown thrown value into a message safe to show a user.
 *
 * Axios errors carry server text in `response.data.error`; those messages are
 * written for users. Anything else falls back to the caller's wording rather
 * than surfacing a stack or a driver string.
 */
export function userMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { error?: string; detail?: string; message?: string } } })
    ?.response?.data;
  return data?.error ?? data?.detail ?? data?.message ?? fallback;
}
