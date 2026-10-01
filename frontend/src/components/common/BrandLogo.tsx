import { cn } from '@/lib/utils';

type BrandLogoProps = { className?: string; compact?: boolean; light?: boolean };

/** Production MatchWise mark: an upward M/data signal with a football counter. */
export function BrandLogo({ className, compact = false, light = false }: BrandLogoProps) {
  return <span className={cn('inline-flex items-center gap-2', className)} aria-label="MatchWise">
    <svg viewBox="0 0 48 48" className={cn(compact ? 'h-7 w-7' : 'h-8 w-8')} aria-hidden="true">
      <path d="M5 37V13l10 10 9-13 9 13 10-10v24h-8V27l-11 12-11-12v10H5Z" fill="currentColor" />
      <circle cx="24" cy="12" r="7" fill={light ? '#0A0C0F' : '#0A0C0F'} stroke="currentColor" strokeWidth="2" />
      <path d="m24 8 2.2 1.6-.8 2.6h-2.8l-.8-2.6L24 8Zm-5.2 4.1 2.7.2 1.1 2.4-1.7 2.1-2.4-1.4.3-3.3Zm10.4 0 .3 3.3-2.4 1.4-1.7-2.1 1.1-2.4 2.7-.2Z" fill={light ? '#0A0C0F' : '#0A0C0F'} />
    </svg>
    {!compact && <span className="font-display text-[18px] font-semibold tracking-tight"><span className={light ? 'text-foreground' : 'text-foreground'}>Match</span><span className="text-primary">Wise</span></span>}
  </span>;
}

