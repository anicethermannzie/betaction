import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';

// ── shadcn/ui utility ────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date / time helpers ───────────────────────────────────────────────────────

export function formatMatchDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (isToday(date))     return `Today • ${format(date, 'HH:mm')}`;
    if (isTomorrow(date))  return `Tomorrow • ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Yesterday • ${format(date, 'HH:mm')}`;
    return format(date, 'MMM d • HH:mm');
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'HH:mm');
  } catch {
    return '--:--';
  }
}

export function formatFullDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d');
  } catch {
    return dateString;
  }
}

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// ── Score helpers ─────────────────────────────────────────────────────────────

export function formatScore(home: number | null, away: number | null): string {
  if (home === null || away === null) return 'vs';
  return `${home} - ${away}`;
}

// ── Match status helpers ──────────────────────────────────────────────────────

const LIVE_STATUSES   = new Set(['1H', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']);
const HT_STATUSES     = new Set(['HT']);
const FINISH_STATUSES = new Set(['FT', 'AET', 'PEN']);

export function isMatchLive(status: string): boolean {
  return LIVE_STATUSES.has(status);
}

export function isMatchHalftime(status: string): boolean {
  return HT_STATUSES.has(status);
}

export function isMatchFinished(status: string): boolean {
  return FINISH_STATUSES.has(status);
}

export function isMatchInProgress(status: string): boolean {
  return isMatchLive(status) || isMatchHalftime(status);
}

export function getMatchStatusLabel(status: string, elapsed: number | null): string {
  if (LIVE_STATUSES.has(status))   return elapsed ? `${elapsed}'` : 'LIVE';
  if (HT_STATUSES.has(status))     return 'HT';
  if (FINISH_STATUSES.has(status)) return 'FT';
  return '';
}

// ── Prediction color helpers ──────────────────────────────────────────────────

export function getPredictionColors(prediction: string) {
  switch (prediction) {
    case 'HOME_WIN':
      return { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' };
    case 'AWAY_WIN':
      return { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' };
    case 'DRAW':
      return { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' };
    default:
      return { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/30' };
  }
}

export function getConfidenceConfig(confidence: string) {
  switch (confidence) {
    case 'high':   return { label: 'High',   color: 'text-emerald-400', bg: 'bg-emerald-500', width: '85%' };
    case 'medium': return { label: 'Medium', color: 'text-amber-400',   bg: 'bg-amber-500',   width: '55%' };
    case 'low':    return { label: 'Low',    color: 'text-red-400',     bg: 'bg-red-500',      width: '25%' };
    default:       return { label: 'N/A',    color: 'text-slate-400',   bg: 'bg-slate-500',    width: '0%' };
  }
}

export function formatProbability(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ── Team initials (fallback for missing logos) ────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}
