import { cn } from '@/lib/utils';

export type MatchDetailTab = 'details' | 'commentary' | 'ai-insights' | 'lineups';

interface MatchTabsProps {
  activeTab: MatchDetailTab;
  onChange: (tab: MatchDetailTab) => void;
}

const TABS: { key: MatchDetailTab; label: string }[] = [
  { key: 'details',     label: 'Details' },
  { key: 'commentary',  label: 'Commentary' },
  { key: 'ai-insights', label: 'AI Insights' },
  { key: 'lineups',     label: 'Lineups' },
];

/**
 * Top-level match-detail navigation (Details | Commentary | AI Insights |
 * Lineups) — distinct from, and rendered above, MarketTabs (the SGP/Totals/
 * Corners/etc. category tabs nested inside the Details tab's own content).
 *
 * Deliberately not sticky, unlike MarketTabs: this page already has a sticky
 * match header above it and a sticky MarketTabs below it (only while Details
 * is active); stacking a third independently-sticky bar between them would
 * need the two existing offsets re-tuned against a live layout to avoid
 * overlap, which cannot be verified without a running browser in this
 * environment. Revisit if the design calls for it once eyes are on it.
 */
export function MatchTabs({ activeTab, onChange }: MatchTabsProps) {
  return (
    <div className="w-full border-b border-border bg-card">
      <div
        className="flex overflow-x-auto px-4 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        role="tablist"
        aria-label="Match sections"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.key)}
              className={cn(
                'px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-b-primary text-primary'
                  : 'border-b-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
