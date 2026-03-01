import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'match' | 'prediction' | 'standings' | 'card';
  className?: string;
}

export function LoadingSkeleton({ variant = 'card', className }: LoadingSkeletonProps) {
  if (variant === 'match') {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-4 space-y-3', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-6 w-12" />
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'prediction') {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-6 space-y-4', className)}>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-40 w-40 rounded-full mx-auto" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    );
  }

  if (variant === 'standings') {
    return (
      <div className={cn('rounded-xl border border-border overflow-hidden', className)}>
        <Skeleton className="h-10 w-full rounded-none" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border-t border-border/50">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 flex-1 max-w-[120px]" />
            <div className="ml-auto flex gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-6" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <Skeleton className={cn('h-32 w-full rounded-xl', className)} />;
}
