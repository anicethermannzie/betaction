import Link from 'next/link';
import { Activity } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-6 mt-auto">
      <div className="px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">BetAction</span>
          <span>· Sports Prediction Platform</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/matches" className="hover:text-foreground transition-colors">Matches</Link>
          <Link href="/predictions" className="hover:text-foreground transition-colors">Predictions</Link>
        </nav>
        <p className="text-xs">
          © {new Date().getFullYear()} BetAction. For educational purposes only.
        </p>
      </div>
    </footer>
  );
}
