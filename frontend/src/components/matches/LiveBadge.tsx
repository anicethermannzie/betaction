import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  elapsed?: number | null;
  className?: string;
}

export function LiveBadge({ elapsed, className }: LiveBadgeProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="relative flex h-2 w-2">
        <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      <span className="text-xs font-bold text-red-500">
        LIVE{elapsed != null ? ` ${elapsed}'` : ''}
      </span>
    </div>
  );
}
