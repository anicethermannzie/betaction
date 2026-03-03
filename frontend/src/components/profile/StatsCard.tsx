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
        'bg-slate-900 border border-slate-800/60 rounded-xl p-4 flex flex-col gap-3',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Icon className="h-4 w-4 text-emerald-400" />
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trend === 'up' ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {trend === 'up'
              ? <TrendingUp   className="h-3.5 w-3.5" />
              : <TrendingDown className="h-3.5 w-3.5" />
            }
          </div>
        )}
      </div>

      <div>
        <div
          className={cn(
            'font-bold tabular-nums leading-tight',
            valueClassName ?? autoValueClass
          )}
        >
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}
