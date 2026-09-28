# BetAction — Design System (MASTER)

> Global source of truth. Page-specific overrides live in `design-system/pages/[page].md`
> and win over this file where they exist.

BetAction is a **market terminal**. Odds are prices, model probabilities are
positions, confidence is signal strength. The interface reads like a trading
desk: a dark cool-neutral field, a crisp hairline grid, monospace numerals with
tabular alignment, and colour used **only** where it carries data meaning.

Boldness is spent in exactly one place — the **market readout**. Everything else
stays quiet.

---

## 1. Colour tokens

Defined as HSL triples on `:root` in `src/styles/globals.css`; consumed through
Tailwind semantic classes (`bg-background`, `text-muted-foreground`, …). Never
hardcode `slate-*` / `emerald-*` / hex.

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--background` | `210 16% 5%` | `#0A0C0F` | app field (cool near-black, never pure black) |
| `--card` / `--panel` | `213 16% 8%` | `#0F1318` | data panels — the default surface |
| `--panel-raised` / `--popover` | `213 15% 11%` | `#161B21` | menus, hovered rows, raised |
| `--muted` / `--secondary` | `213 14% 13%` | — | fills, chips |
| `--border` | `212 14% 18%` | `#262D35` | **hairlines — deliberately visible** |
| `--foreground` | `210 12% 92%` | `#E8EBEE` | primary text |
| `--muted-foreground` | `213 8% 58%` | `#8A929B` | secondary text, labels |
| `--primary` = `--up` | `162 84% 43%` | `#12C892` | brand · CTA · positive signal · home |
| `--down` | `0 100% 68%` | `#FF5A5A` | negative signal · away · no-value |
| `--hold` | `40 85% 55%` | `#E5A93B` | neutral signal · draw · hold |
| `--radius` | — | `4px` | terminal-sharp |

**Colour discipline:** `primary` / `up` / `down` / `hold` appear only on data
(probabilities, deltas, live state, CTAs). No decorative colour, no gradients,
no glows. Signal meaning must never rely on colour alone — pair with a glyph
(`▲` / `▼`), text, or position.

**Anti-patterns (never):** neon, AI purple/pink gradients, glassmorphism,
drop-shadows on panels, `backdrop-blur`, pulsing rings, float animations,
`hover:scale`.

---

## 2. Typography

Loaded via `next/font` in `src/app/layout.tsx`.

| Role | Family | Usage |
|---|---|---|
| Display / UI | **Space Grotesk** (`font-sans`, `font-display`) | headings, nav, body, labels |
| Data | **JetBrains Mono** (`font-mono`, `.num`, `[data-num]`) | every number: odds, probabilities, scores, times, counts, %, currency. `font-variant-numeric: tabular-nums`. |

- Headlines: `font-mono` + `font-bold` + `tracking-tight`.
- Micro-labels: `.label` → mono, `text-[10px]`, `uppercase`, `tracking-label` (0.18em), `text-muted-foreground`.
- Section headers: `.section-title` → mono `text-[11px]` uppercase label + trailing hairline rule (`::after`). Add a 2-digit index only when sections are a genuine sequence.
- No `font-black`. `font-bold` is the ceiling. Uppercase + wide tracking only on labels and `lg` buttons.

---

## 3. Layout & spacing

- Content max width `max-w-7xl`, gutters `px-4 md:px-6`.
- Panels: `.panel` (`border border-border bg-card rounded-lg`). No shadow.
- Hairline grids for feature/stat groups: `grid gap-px bg-border` so the 1px gaps read as rules.
- Density over air: rows `py-2` – `py-2.5`, card padding `p-3.5` – `p-4`.
- Radius: `rounded-lg` (4px) panels · `rounded-sm` (2px) chips/ticks/inputs · `rounded-full` only for avatars/logos.

---

## 4. Components

| Class / component | Spec |
|---|---|
| `.panel` | default surface — hairline, sharp, flat |
| `.section-title` | mono uppercase label + trailing `h-px flex-1 bg-border` rule |
| `.label` | mono 10px uppercase tracking-label muted |
| `.tick` | small **rectangle** status chip (`rounded-sm`), not a pill; mono uppercase |
| `.stat-bar` | `h-1` bar; probability = 3 **abutting** segments (`flex`, no gap, no radius): `bg-primary` / `bg-hold` / `bg-down` |
| `.num` | mono + tabular-nums; apply to any numeric run |
| `Button` | `rounded`; `default` solid primary w/ near-black text; `outline` = hairline; `lg` = uppercase tracking-wider |
| `Input` | `rounded-sm`, hairline, focus = `border-primary` + 1px ring |
| `Tabs` | hairline container, active trigger = `bg-muted text-primary`, no shadow |
| `LiveBadge` | square `bg-down` tick + subtle `animate-live-pulse` + mono `LIVE 67'` |

### Signature — Market readout
`HOME · DRAW · AWAY`: mono percentages, model-vs-implied **edge** as `▲ 4.1` /
`▼ 1.2` in signal colour, a 3-segment `.stat-bar`, bookmaker odds small in mono.
Used in the landing hero board and the base of every `MatchCard`.

---

## 5. Motion

- Allowed: `animate-live-pulse` (2-step, subtle), `flash-up` / `flash-down`
  (0.9s bg tint on value change), hairline hover on links, `ticker` for the
  scores strip.
- Transitions: `transition-colors` only, `duration-150` default.
- Banned: `transition-all`, `hover:scale`, `translate-y` lifts, `duration-300+`,
  scattered fade-ins.
- `prefers-reduced-motion: reduce` → all animation/transition collapsed to ~0
  (global block in `globals.css`).

---

## 6. Pre-delivery checklist

Run before shipping any screen (adapted from `ui-ux-pro-max`):

- [ ] No emoji as UI icons — Lucide SVG only. Emoji allowed only as content (country flags, tier markers).
- [ ] `cursor-pointer` on every clickable element; non-buttons that act like buttons get `role`/`tabIndex` or become real `<button>`.
- [ ] Focus visible for keyboard nav (global `:focus-visible` = 1px primary outline; don't remove it).
- [ ] `prefers-reduced-motion` respected (inherited from globals — don't override).
- [ ] Text / chips / badges reflow with no clipping at 375 / 768 / 1024 / 1440 and at 200% zoom.
- [ ] Chip collections wrap or use an operable `+n` disclosure.
- [ ] Badge/signal meaning not colour-only — glyph or text alongside.
- [ ] Numeric columns use `.num` (tabular) so they align.
- [ ] Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI edges.
- [ ] No hardcoded `slate-*` / `emerald-*` / hex — semantic tokens only.
- [ ] Every recommendation surfaces the "no result is ever guaranteed" disclaimer.

---

## 7. Status

**Hand-finished:** tokens/fonts/utilities · `ui/{button,card,input,tabs}` ·
`Navbar` · `Footer` · `Sidebar` · `MatchCard` · `LiveBadge` · loading state ·
landing `HeroSection` / `FeaturesGrid` / `DiscoverSection` / `HowItWorks` /
`StatsBar` / `SportCategories` / `PricingSection` · predictions family
(`PredictionChart` donut→stacked readout, `PredictionBadge`, `ConfidenceMeter`,
`AlgorithmBreakdown`, `FormDisplay`, `H2HDisplay`, `StatsComparison`,
`OddsComparison`) · `profile/{StatsCard,AccuracyChart,FavoriteLeagues}` ·
`match/{OddsButton,MarketTabs}` · `tickets/{TicketCard,TicketLeg,TierSelector,VIPTeaser}`.
`lib/utils.ts` colour helpers return signal tokens. `AccuracyChart` recharts
colours come from CSS vars; gradient fill removed. Purple anti-pattern removed
from `VIPTeaser`.

**Swept (token-mapped, 4 passes) — light-touch, not individually rebuilt:**
`app/predictions/[matchId]` + `app/profile` page shells (mostly `.section-title` +
`Card`), `landing/TicketPreview`, `match/MarketAccordion`,
`profile/PredictionHistory`, `betslip/BetSlip`, `tickets/{TicketSummary,
CustomTicketBuilder,MatchMarketPreview}`. Render correctly; a bespoke pass
would tighten them further.
