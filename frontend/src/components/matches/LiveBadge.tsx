import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  elapsed?: number | null;
  className?: string;
}

export function LiveBadge({ elapsed, className }: LiveBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 shrink-0', className)}>
      <span className="h-1.5 w-1.5 rounded-sm bg-down animate-live-pulse" />
      <span className="num text-[10px] font-semibold uppercase tracking-wider text-down">
        LIVE{elapsed != null ? ` ${elapsed}'` : ''}
      </span>
    </span>
  );
}
