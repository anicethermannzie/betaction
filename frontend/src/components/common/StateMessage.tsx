'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CalendarDays, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Shared empty and error states.
 *
 * These exist because failure used to be indistinguishable from emptiness: a
 * backend outage rendered as "No matches scheduled today", and two pages
 * swallowed their errors into console.error. A user cannot act on that — they
 * conclude the product has no data rather than retrying in a minute.
 *
 * ErrorState never displays a raw exception. `detail` is for messages the API
 * wrote for users; anything else stays in the logger.
 */

interface BaseProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
}

function Shell({ title, description, icon: Icon, className, children }: BaseProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-14 px-4 text-center',
        className,
      )}
    >
      {Icon && <Icon className="h-9 w-9 text-muted-foreground/40" aria-hidden="true" />}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon = CalendarDays,
  action,
  className,
}: BaseProps & { action?: React.ReactNode }) {
  return (
    <Shell title={title} description={description} icon={icon} className={className}>
      {action}
    </Shell>
  );
}

interface ErrorStateProps {
  /** Short, plain statement of what failed. */
  title?: string;
  /** User-facing detail from the API, when there is one. Never a stack trace. */
  detail?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "We couldn't load this right now",
  detail,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Shell
      title={title}
      description={
        detail ??
        'This is a problem on our side, not with your account. Please try again in a moment.'
      }
      icon={WifiOff}
      className={className}
    >
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          Try again
        </Button>
      )}
    </Shell>
  );
}

/**
 * Inline banner for partial failure — the page rendered, but one section is
 * missing or stale. Used where replacing the whole view would be heavy-handed.
 */
export function ErrorBanner({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive',
        className,
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
        >
          Retry
        </button>
      )}
    </div>
  );
}
