import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketAccordionProps {
  title: string;
  sgpBadge?: boolean;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
}

export function MarketAccordion({
  title,
  sgpBadge = false,
  children,
  initiallyExpanded = false,
}: MarketAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  return (
    <div className="border border-border bg-card rounded-lg overflow-hidden mb-3">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-card transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-sm tracking-wide text-foreground truncate">{title}</span>
          {sgpBadge && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border border-hold/80 bg-hold/10 text-hold uppercase tracking-wider select-none leading-none">
              SGP
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-250 shrink-0 ml-2',
            isExpanded ? 'rotate-180 text-primary' : ''
          )}
        />
      </button>

      {/* Content */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          isExpanded ? 'max-h-[1200px] border-t border-border' : 'max-h-0'
        )}
      >
        <div className="p-4 bg-background">{children}</div>
      </div>
    </div>
  );
}
