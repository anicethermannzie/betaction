import Link from 'next/link';
import { Compass } from 'lucide-react';

/**
 * 404 page. Without one, an unknown URL fell through to Next's unstyled default.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Compass className="h-9 w-9 text-muted-foreground/40" aria-hidden="true" />
      <div className="space-y-1.5">
        <h1 className="text-lg font-bold text-foreground">Page not found</h1>
        <p className="mx-auto max-w-[320px] text-sm text-muted-foreground">
          That link doesn&apos;t exist, or the match it pointed to is no longer listed.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link href="/" className="text-primary underline underline-offset-4 hover:opacity-80">
          Homepage
        </Link>
        <Link href="/matches" className="text-primary underline underline-offset-4 hover:opacity-80">
          Today&apos;s matches
        </Link>
      </div>
    </div>
  );
}
