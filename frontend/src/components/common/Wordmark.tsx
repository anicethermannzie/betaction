import { cn } from '@/lib/utils';
import { BrandLogo } from './BrandLogo';

/** "Match" in white + "wise" in emerald (#10b981) — the one place the brand is drawn. */
export function WordmarkText({ className }: { className?: string }) {
  return <BrandLogo className={cn(className)} />;
}

