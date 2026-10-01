# MatchWise Design Audit

Audit date: 2026-09-30  
Scope: repository inspection, running Docker stack, Playwright desktop/mobile review, authenticated free-trial review, axe-core scan, and API smoke checks.  
Constraint: this audit makes no application, backend, schema, or API changes.

## Executive assessment

MatchWise already has a coherent product foundation: a Next.js 16 frontend, a four-service backend, real API-Football fixtures, weighted prediction algorithms, server-shaped free/VIP entitlements, Stripe billing routes, Redis caching, Socket.io updates, and a documented dark market-terminal design system. The current visual language is distinctive enough to build on: cool near-black surfaces, teal signal color, hairline borders, Space Grotesk, and JetBrains Mono.

The main redesign opportunity is consolidation. The landing page feels art-directed and premium, while authenticated pages mix that terminal system with older rounded cards, pill controls, emoji labels, gradients, and generic SaaS patterns. The core flows work, but the product feels less trustworthy when empty data, stale claims, inaccessible controls, and inconsistent information density appear beside high-value prediction data.

The local stack was healthy during the audit: gateway, auth, match, prediction, notification, PostgreSQL, and Redis containers were running; health endpoints returned 200. The browser rendered real fixtures and real prediction/odds responses. League standings exposed a functional issue: `/api/leagues/39/standings` returned gateway 404, while the direct match-service request returned 502.

## 1. Architecture and functionality inventory

### Frontend

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Radix UI primitives, Zustand, Axios, Recharts, Socket.io client, and date-fns.
- Routes: `/`, `/matches`, `/predictions`, `/predictions/[matchId]`, `/picks`, `/leagues/[leagueId]`, `/profile`, `/login`, `/register`, `/billing/success`, `/billing/cancel`, plus auth proxy routes and error/not-found routes.
- Shared shell: `MainLayout`, `Navbar`, desktop `Sidebar`, mobile bottom navigation, `Footer`, optional `BetSlip` overlay.
- State is split among auth, match, prediction, ticket, profile, bet slip, and subscription Zustand stores. Saved combos are persisted in browser localStorage; prediction history is not backed by an endpoint.
- The old `/tickets` URL redirects permanently to `/picks`.

### Backend and data

- Nginx API gateway on port 80 routes auth, matches, predictions, notifications, and Socket.io.
- `auth-service`: Express, bcryptjs, JWT access tokens, rotating database-backed refresh sessions, PostgreSQL migrations, Helmet, CORS, rate limits, and Stripe billing routes.
- `match-service`: Express, API-Football integration, Redis cache, league/match/odds/statistics/H2H/events/momentum endpoints, and cron-based fixture/live polling.
- `prediction-service`: FastAPI/Python, Redis-backed prediction caches, APScheduler warm-up, weighted analyzers for form, H2H, home/away, goals, odds, 1X2, totals, BTTS, corners, handicaps, clean sheets, halftime and combination markets.
- `notification-service`: Express + Socket.io + Redis, live match polling, live score events, match/league rooms, and authenticated prediction-room checks.
- PostgreSQL schema is migration-driven for users, sessions, plans/trials, Stripe customer/subscription history, and webhook idempotency.
- External data source is API-Football. The browser talks to `http://localhost/api` through Nginx; auth login/refresh/logout goes through the Next.js cookie proxy.

### Authentication and freemium behavior

- Login and registration are real. Refresh tokens are HttpOnly strict cookies; access tokens are held in memory and refreshed through the cookie proxy.
- `/profile` is guarded by Next middleware and the auth session endpoint, then loads profile and billing status.
- Free responses are shaped on the server: six markets, one daily ticket capped at three legs, and no factor breakdown. VIP receives the full modeled surface. Trial users currently remain on the free entitlement (`TRIAL_GRANTS_VIP = false`).
- Stripe checkout, portal, status, webhook handling, and success/cancel routes exist. The provided local account was a free-trial account; VIP flows were reviewed from source and the locked UI.

### API endpoint groups

- Auth: register, login, refresh-token, logout, session, profile, billing checkout/portal/status/webhook.
- Matches: live, by date, by id, odds, live odds, statistics, H2H, events, momentum, leagues, standings, team stats, club/international variants.
- Predictions: today, by league, by fixture, multi-market fixture predictions, deep analysis, smart picks, odds anomaly, top-vs-bottom, tickets today/by tier.
- Notifications: health, internal match-event notification, internal stats, Socket.io rooms/events.

## 2. Existing design system

The source of truth is `frontend/design-system/MASTER.md` and `frontend/src/styles/globals.css`.

- Colors: background `#0A0C0F`, panel `#0F1318`, raised panel `#161B21`, border `#262D35`, foreground `#E8EBEE`, muted text `#8A929B`, primary/up teal `#12C892`, down red `#FF5A5A`, hold amber `#E5A93B`.
- Typography: Space Grotesk for structural UI; JetBrains Mono for data, labels, odds, times, and counts. Numeric text uses tabular figures.
- Spacing: `max-w-7xl`, `px-4 md:px-6`, dense rows, four-pixel terminal radius, hairline borders, flat panels.
- Motion: live pulse, flash-up/flash-down, ticker, color transitions, and a global reduced-motion override.
- Icons/assets: Lucide React icons, API-Football team/league logos, flags/emoji for countries and league cues, and one soccer hero bitmap in `frontend/public/images`.

The system is strongest on the landing page and authenticated dashboard. It drifts on picks, profile, league, auth, and match controls where rounded pills, gradients, emoji headings, `rounded-full` badges, and generic card treatments replace the stated terminal rules.

## 3. What works well

- The landing page has a clear market-board concept, strong headline hierarchy, restrained teal accent, and an honest product disclaimer.
- The dashboard creates a useful sequence: live ticker, top prediction, today’s matches, top predictions, picks summary, popular leagues.
- Real match data and real prediction responses are visible in the browser. Match detail showed live score, bookmaker odds, model probabilities, momentum, H2H, markets, and analysis.
- URL state is used well on `/matches` for date, league, status, and competition type.
- Prediction markets are assembled from model probabilities; missing model data is omitted instead of invented in the current implementation.
- Distinct loading, empty, and retry states exist for matches, predictions, league data, momentum, deep analysis, picks, and billing.
- Free/VIP shaping is server-side and aligns with the pricing UI.
- The prediction engine has explicit, inspectable factor weights: form 30%, H2H 20%, home/away 15%, goals 20%, odds 15%.
- Auth security has thoughtful details: rotated refresh tokens, revocation checks, strict cookies, request-origin protection, and production-disabled FastAPI docs.
- Responsive coverage is broad. At 320, 390, 768, and 1440 px the document did not create horizontal page overflow; the match list and dashboard reflow rather than breaking the viewport.
- Reduced motion is implemented globally, and most interactive controls have hover/focus-visible styling.

## 4. What looks outdated or generic

- Authenticated picks and profile still use generic SaaS cards, rounded pills, emoji section labels, gradient decoration, and large empty vertical areas. They do not feel like the same market terminal as the landing page.
- The picks page repeats “AI Predictions — Today’s Picks,” four tier panels, a long fixture list, builder, and VIP teaser in one uninterrupted scroll. It reads like a feature inventory rather than a focused decision workspace.
- Profile is a generic account page with a large avatar card, plan card, empty history card, and saved-card stack. It lacks a premium performance workspace or a clear distinction between account, billing, and prediction record.
- Match detail exposes many markets as tall accordion stacks. The density is useful on desktop but becomes a long vertical scan on mobile; the category rail is compressed and hard to parse.
- The UI uses multiple visual languages: terminal labels and hairlines, modern rounded cards, pill filters, emojis, flags, and occasional legacy comments/classes. The mismatch lowers perceived product maturity.

## 5. Inconsistencies

- The landing hero uses a static hardcoded “Model board · today” with famous fixtures and “live,” while the authenticated dashboard uses real fixtures. The static board should be clearly labeled as an example or connected to live data.
- Landing claims “85% peak accuracy,” “Track accuracy,” and “copy & track,” but the profile explicitly says prediction tracking is coming soon and no accuracy endpoint exists.
- The landing page says 18 markets and the picks copy says the algorithm analyzed 18 markets, while a free user sees six and many markets disappear based on model availability. The entitlement should be visible at the moment it matters.
- `/predictions` uses rounded high/medium/low confidence filters; `/matches` uses terminal tabs and date pills; `/picks` uses tier chips and emoji. Selection behavior is functionally similar but visually unrelated.
- Some data uses `American` odds, some `Decimal`, and the landing board uses decimal market odds. The match page control is useful but the chosen format is not clearly persisted or explained.
- Footer company/legal/social items without `href` are rendered as text or inert buttons. They look interactive but do not navigate.
- User-facing strings still contain legacy naming and encoding problems in source/runtime evidence: “BetAction” request headers/storage names, mojibake in several source strings, and inconsistent “Matchwise” casing in comments and old keys.

## 6. UX problems

- `/predictions` can be a blank-feeling empty screen with “0 matches” and a centered no-predictions message while matches exist elsewhere. It needs context, last refresh, and a route to today’s matches.
- A failed league standings request is shown as an error, and the browser/API smoke check confirmed the route itself is not healthy through the gateway. This blocks a core discovery path from sidebar/popular leagues.
- Empty picks are not sufficiently actionable: “No combos available” does not explain whether data is still generating, thresholds were not met, or the user should choose a different day.
- The match page includes tabs for Commentary, AI Insights, and Lineups, but Lineups is explicitly “coming soon.” Commentary can display “Unknown player.” These are honest states, but the product should visually distinguish available, delayed, and not-supported features.
- The profile’s “Prediction tracking is coming soon” makes the “Track accuracy” promise elsewhere feel like a broken feature.
- The login “Forgot password?” button has an empty handler and no recovery flow.
- Registration Terms of Service and Privacy Policy are buttons without destinations or dialogs.
- Social buttons in the footer have labels but no actions.
- Selecting a pick opens the floating My Picks panel. The panel has no dialog role, no focus trap, and Escape does not close it. Focus remained on the underlying odds button during the overlay test.
- Saving a combo clears the builder immediately; the “Saved” confirmation is therefore not reliably visible in the builder path, even though the saved item does appear in profile/localStorage after reload.
- Filter state is URL-synced on Matches but not on dashboard filters or confidence filters on Predictions/Picks, so back/forward and sharing behavior differs by route.
- Live odds and momentum poll independently every 15 seconds, while Socket.io also carries live score events. The user can see score and odds update through different timing models without a shared freshness indicator.

## 7. Responsive problems

- Page-level overflow was not observed at tested widths, but match controls truncate aggressively at 320/390 px. Axe/layout evidence found fixture league text truncation at 320 and many odds labels truncating at 320 and 390.
- In the mobile match screenshot, the category rail (`ALL COMBOS TOTALS CORNERS HALFTIME SPREADS CORRECT SCORE`) is visually compressed into a near-continuous string.
- Odds buttons reserve too little width for long team names, producing labels with only a few visible pixels in the 320/390 measurements.
- The profile mobile view places the fixed bottom nav between the prediction-history card and saved-combos card, which interrupts reading flow and can obscure content near the bottom.
- The picks mobile view is extremely tall because every match is rendered before the builder; the primary action is far below the tier summary.
- The expanded My Picks sheet is usable visually but needs safe-area padding, proper modal semantics, focus management, and an explicit close/escape behavior.
- Footer columns collapse acceptably, but the mobile pages devote a large percentage of the journey to footer/legal content after long data pages.

## 8. Accessibility findings

An axe-core 4.12.0 scan ran on `/login`, `/matches`, `/predictions/1640509`, and `/picks` at 390 px.

- Critical: Radix dropdown trigger/button was reported without a discernible accessible name on all scanned routes.
- Serious: low-contrast text is widespread in muted labels, date captions, disclaimers, footer metadata, “or,” dev hint, and footer legal text. The scan measured ratios as low as 1.77 and 2.90 where 4.5:1 is expected.
- Serious: match detail contains a back link with only an icon and no accessible name.
- Serious: match detail’s horizontally scrollable market table region is not keyboard-focusable in Safari.
- Incomplete: axe reported `aria-valid-attr-value` and target-size checks requiring follow-up.
- Form inputs have labels, correct email/password types, and autocomplete values, but rendered `name` attributes were empty in the browser measurement.
- Global `:focus-visible` exists, but the overlay and several compound controls do not manage focus as a component-level interaction.
- Buttons generally use semantic `<button>` elements. One match-market preview uses a clickable `<div>` for expansion and should be a button.
- Decorative icons are often marked `aria-hidden`, but icon-only share/back/chevron controls need a consistent accessible-name audit.
- No skip link is present in the root layout, and `html` lacks `color-scheme: dark` and a matching `theme-color` meta tag.

## 9. Visual hierarchy and navigation

- Landing navigation is clear for an anonymous visitor; authenticated navigation is clear on desktop but reduced to four bottom-nav items on mobile, hiding Predictions and league discovery.
- The desktop sidebar is useful but only appears at `lg`; the mobile replacement loses league navigation entirely.
- Matches has the strongest information architecture: date, competition, league, status, then grouped fixture cards. It still needs a stronger sticky summary and clearer selected-state treatment at narrow widths.
- Match detail has two navigation layers (match sections and market categories), plus an odds-format row. This is powerful but over-nested; a mobile segmented control or anchored section index would be clearer.
- Picks mixes generated tickets, custom builder, and VIP upsell as equal-weight sections. The user needs a primary “choose a pick” action and a persistent summary of selected legs.
- Profile mixes billing, history, and saved combos without a clear account navigation model. A premium product should separate performance, saved analysis, and subscription management.

## 10. Component and state gaps

Present: loading skeletons, empty states, retry states, errors, live status, odds movement, market accordions, H2H, momentum, AI recommendation, VIP locks, checkout success/cancel.

Missing or incomplete:

- Password recovery and account email/password management.
- Real prediction outcome tracking, accuracy, streaks, and historical performance.
- Persistent saved-combo API; saved combos are localStorage-only and device-specific.
- Real notification preferences and notification delivery UI.
- Lineups data and richer commentary/player identity fallback.
- A populated picks state in the local run: no generated tickets cleared the tier thresholds, so the page’s main value proposition was mostly empty while the custom builder remained available.
- Explicit stale-data/freshness indicators when cached prediction or match data is shown.
- A consistent “data unavailable vs no data vs not entitled vs not supported” state taxonomy.

## 11. Prediction, match, market, ticket, dashboard, and VIP flows

- Prediction flow: `/predictions` loads today’s model list, filters by confidence, and links to detail. Detail loads fixture, markets, odds, H2H, prediction, momentum, deep analysis, and live events. Free users see a server-limited response and VIP locks where detail is absent.
- Match flow: `/matches` loads a date, applies competition/league/status filters, groups by league, and links every fixture to prediction detail. Live score updates come from Socket.io; live odds and momentum poll.
- Market flow: detail supports 1X2, combinations, totals, corners, halftime, spreads, correct score, clean sheets, draw-no-bet, and lead-at-any-time where model data exists. A market disappears if the model has no probability for it.
- Ticket flow: `/picks` requests generated tickets, filters by four confidence tiers, lets users expand/copy/share/save, then offers a custom builder. Free entitlement is one ticket/three legs. The floating My Picks sheet is available across match/prediction surfaces.
- Dashboard flow: authenticated `/` shows live ticker, top prediction, today’s matches, predictions, ticket summary, and popular leagues. It is the strongest logged-in information architecture.
- VIP/freemium: checkout and portal are real; trial remains free; entitlement is enforced in prediction-service. The visible upsell communicates market/leg/factor differences, but the feature promise should be tied to measurable outcomes and live entitlements.

## 12. What feels premium already, and opportunities

Existing premium cues: real-time market language, model-vs-implied edge, factor weights, live odds movement, H2H, momentum, deep analysis, multi-market filtering, and server-side VIP shaping.

Premium opportunities that preserve current functionality:

- A “market desk” home with a single current signal, confidence/edge explanation, data freshness, and next-best action.
- A performance workspace once tracking exists: calibration, hit rate by market/league, confidence buckets, CLV/edge history, and transparent sample sizes.
- Saved research portfolios with notes, tags, alerts, and server persistence.
- Match watchlists and notification preferences tied to live score/odds/prediction changes.
- VIP explainability: factor contribution, market consensus, uncertainty bands, and “what would change this pick.”
- A compact cross-match compare view for selected fixtures, with shared odds format and aligned columns.
- A guided custom combo builder with leg conflict warnings, probability recalculation, market freshness, and a clear saved-state confirmation.
- Premium responsive behavior: bottom-sheet filters, sticky match context, horizontally scrollable but keyboard-accessible tables, and mobile league discovery.

## Proposed redesign plan

### Phase 0 — foundation and truthfulness

1. Preserve all routes, APIs, stores, entitlement rules, and backend behavior.
2. Establish a single UI token layer from `MASTER.md`: surfaces, signal colors, text tiers, radii, spacing, focus, density, and responsive breakpoints.
3. Remove visual drift: gradients, decorative emoji headings, generic rounded cards, inconsistent pills, and legacy BetAction presentation where it is user-facing.
4. Replace unsupported claims with explicit “coming soon” or measured product copy; label the landing board as an example unless it is made data-backed.
5. Define a state taxonomy: loading, cached, live, empty, unavailable, not entitled, and not supported.

### Phase 1 — navigation and information architecture

1. Make the authenticated dashboard the primary workspace: current signal, today’s slate, watchlist, picks, and freshness.
2. Keep Matches as the discovery route with URL-synced filters and a better mobile filter sheet.
3. Make Prediction Detail a two-column desktop desk and a stacked mobile desk: match context, model signal, market comparison, explanation, then supporting history.
4. Split Picks into “Today’s model picks” and “Build a combo,” with a sticky selected-leg summary.
5. Split Profile into Overview, Saved Combos, Performance, and Subscription sections while preserving existing URLs.
6. Add mobile league discovery to the bottom sheet or a dedicated navigation drawer.

### Phase 2 — component system

1. Create shared `SignalCard`, `MarketTable`, `FreshnessLabel`, `StatePanel`, `FilterRail`, `OddsCell`, `ConfidenceBar`, `EntitlementLock`, and `SelectionTray` primitives.
2. Use semantic buttons/links throughout; eliminate clickable divs; add labels/names, skip link, focus traps, escape handling, safe-area padding, and keyboard-focusable scroll regions.
3. Standardize American/Decimal format, date/number formatting, loading copy with ellipses, and status vocabulary.
4. Improve contrast tokens and remove opacity-based text below AA thresholds.

### Phase 3 — premium product layer

1. Add server-backed saved analysis and prediction outcome tracking when the backend contract is ready; until then keep the current local behavior and label its scope.
2. Introduce watchlists, alerts, notes, transparent calibration/performance, and richer VIP explainability without changing existing endpoints.
3. Add visual comparisons and responsive market tables that expose edge, implied probability, model probability, movement, and freshness together.

### Phase 4 — validation

1. Run the same Playwright route matrix at 320, 390, 768, 1440, and ultra-wide widths.
2. Re-run axe on anonymous and authenticated states, including open dropdowns, market accordions, the My Picks sheet, and error states.
3. Verify every route against healthy, empty, stale, unavailable, free, and VIP response states.
4. Validate copy against actual backend capabilities and preserve API/database contracts.

## Evidence and screenshots

Screenshots are in `docs/audit/screenshots/`, including anonymous and authenticated dashboard/profile/match/picks states at desktop and mobile sizes. Playwright and source evidence is in `docs/audit/evidence/`.

The nine user-attached ESPN screenshots were treated as external visual references, not as application requirements or implementation instructions. They suggest useful patterns for a future MatchWise direction—strong editorial hierarchy, large event imagery, clear category rails, prominent plan comparison, and device-aware content grouping—but they do not establish MatchWise features, branding, copy, or API behavior.

Key artifacts:

- `public-capture.log`: anonymous route capture and rendered metadata.
- `member-capture.log`: authenticated dashboard/profile/matches/picks capture.
- `match-capture.log`: details/commentary/AI Insights/Lineups at both viewport sizes.
- `accessibility.log`: axe-core 4.12.0 results and width/truncation measurements.
- `match-public.yml` and `match-member.yml`: browser snapshots of a live fixture.
- `repository-files.txt` and `source-symbols.txt`: repository inventory.

## Validation notes

- Frontend Vitest: 3 files, 30 tests passed.
- Frontend lint started successfully; the command continued beyond the captured output and did not report a failure before the audit was written.
- Browser smoke: all audited public routes rendered; authenticated login succeeded with the supplied local account; health endpoints returned 200.
- No production code, backend code, database schema, or API contract was modified for this audit.
