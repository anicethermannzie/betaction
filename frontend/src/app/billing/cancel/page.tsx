import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Landed on if Checkout is closed or canceled before payment completes.
 * Nothing changed — no charge, no plan change — so this is purely informational. */
export default function BillingCancelPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="rounded-full bg-muted p-4">
        <XCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-lg font-bold text-foreground">Checkout canceled</h1>
        <p className="mx-auto max-w-[360px] text-sm text-muted-foreground">
          No charge was made and your plan hasn&apos;t changed. You can upgrade
          any time from your profile or the tickets page.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild size="sm">
          <Link href="/tickets">Back to tickets</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/profile">Go to profile</Link>
        </Button>
      </div>
    </div>
  );
}
