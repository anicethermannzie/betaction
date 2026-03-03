'use client';

import { useEffect, useRef } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { cn, getTodayString } from '@/lib/utils';

interface DatePickerProps {
  selectedDate: string;           // 'yyyy-MM-dd'
  onChange:     (date: string) => void;
}

interface DayItem {
  dateStr:  string;
  dayName:  string;   // "Mon"
  dayNum:   string;   // "1"
  month:    string;   // "Mar"
  isToday:  boolean;
}

function buildDays(): DayItem[] {
  const today    = new Date();
  const todayStr = getTodayString();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d       = addDays(today, i - 3);
    const dateStr = format(d, 'yyyy-MM-dd');
    return {
      dateStr,
      dayName: format(d, 'EEE'),
      dayNum:  format(d, 'd'),
      month:   format(d, 'MMM'),
      isToday: dateStr === todayStr,
    };
  });
}

export function DatePicker({ selectedDate, onChange }: DatePickerProps) {
  const days         = buildDays();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll the selected pill into view on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const selected = el.querySelector('[data-selected="true"]') as HTMLElement | null;
    if (!selected) return;
    const scrollTo = selected.offsetLeft - el.offsetWidth / 2 + selected.offsetWidth / 2;
    el.scrollLeft = Math.max(0, scrollTo);
  }, []); // only on mount

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 overflow-x-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {days.map(({ dateStr, dayName, dayNum, month, isToday }) => {
        const isSelected = dateStr === selectedDate;

        return (
          <button
            key={dateStr}
            type="button"
            data-selected={isSelected}
            onClick={() => onChange(dateStr)}
            className={cn(
              // Base
              'flex flex-col items-center gap-0.5 rounded-xl px-3 py-2',
              'min-w-[52px] shrink-0 border transition-all duration-150',
              // Selected
              isSelected && 'bg-primary text-primary-foreground border-primary shadow-sm',
              // Today (not selected)
              !isSelected && isToday && 'border-primary/40 text-primary hover:bg-primary/10',
              // Other days
              !isSelected && !isToday &&
                'border-border text-muted-foreground hover:text-foreground hover:border-border/70 bg-card/50'
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide leading-none">
              {dayName}
            </span>
            <span className="text-xl font-black leading-none mt-0.5">{dayNum}</span>
            <span className={cn('text-[10px] leading-none mt-0.5', isSelected ? 'opacity-80' : 'opacity-60')}>
              {month}
            </span>
          </button>
        );
      })}
    </div>
  );
}
