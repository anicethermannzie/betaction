'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon:            LucideIcon;
  value:           string | number;
  label:           string;
  trend?:          'up' | 'down';
  valueClassName?: string;
  className?:      string;
}

export function StatsCard({
  icon: Icon,
  value,
  label,
  trend,
  valueClassName,
  className,
}: StatsCardProps) {
  // Auto-size: large number/short string → text-2xl, long string → text-sm
  const autoValueClass =
    String(value).length <= 5 ? 'text-2xl' :
    String(value).length <= 9 ? 'text-lg'  :
    'text-sm';

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-4 flex flex-col gap-3',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-border text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {trend && (
          <span className={cn('flex items-center', trend === 'up' ? 'text-primary' : 'text-down')}>
            {trend === 'up'
              ? <TrendingUp   className="h-3.5 w-3.5" aria-label="up" />
              : <TrendingDown className="h-3.5 w-3.5" aria-label="down" />
            }
          </span>
        )}
      </div>

      <div>
        <div className={cn('num font-bold leading-tight text-foreground', valueClassName ?? autoValueClass)}>
          {value}
        </div>
        <div className="label mt-1">{label}</div>
      </div>
    </div>
  );
}
