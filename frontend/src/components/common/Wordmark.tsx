import { cn } from '@/lib/utils';

/** "Match" in white + "wise" in emerald (#10b981) — the one place the brand is drawn. */
export function WordmarkText({ className }: { className?: string }) {
  return (
    <span className={cn('font-bold tracking-tight', className)}>
      <span className="text-white">Match</span>
      <span className="text-[#10b981]">wise</span>
    </span>
  );
}
