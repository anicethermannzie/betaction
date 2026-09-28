"""
Plan entitlements — what a free caller actually receives.

The rule this module exists to enforce: **a free response is shaped on the
server**. Nothing is sent and then hidden by the client, because anyone can read
the network tab. Everything gated here maps to a row on the pricing page
(frontend/src/components/landing/PricingSection.tsx); if the two disagree, the
pricing page is the specification and this file is the bug.

Limits (free tier):
  - 6 of the 18 markets per fixture
  - no algorithm factor breakdown ("Match analysis breakdown")
  - 1 ticket per day, 3 legs per ticket
  - deep-analysis: the top-level recommendation only, no reasoning, no market
    table, no factor breakdown (see limit_deep_analysis)
"""

from src.models.prediction import FullPredictionResult, MarketsResult, PredictionResult, Ticket

# The six markets a free caller can see. These are the mainstream ones — the
# value of VIP is the long tail (handicaps, halftime combos, SGP-style combos).
FREE_MARKET_FIELDS: frozenset[str] = frozenset(
    {
        "one_x_two",
        "over_under",
        "btts",
        "double_chance",
        "clean_sheet",
        "corners",
    }
)

FREE_TICKETS_PER_DAY = 1
FREE_LEGS_PER_TICKET = 3

# Which single ticket a free caller gets: the safest one, so the free experience
# showcases the product at its most accurate.
FREE_TIER_ORDER = ["ultra_safe", "safe", "moderate", "risky"]


def limit_markets(result: FullPredictionResult, plan: str) -> FullPredictionResult:
    """Return a copy carrying only the markets `plan` is entitled to."""
    if plan == "vip":
        return result

    kept = {
        field: getattr(result.markets, field)
        for field in result.markets.model_fields
        if field in FREE_MARKET_FIELDS
    }

    limited = result.model_copy(deep=True)
    limited.markets = MarketsResult(**kept)
    limited.factors = None  # analysis breakdown is a VIP row on the pricing page
    return limited


def limit_prediction(result: PredictionResult, plan: str) -> PredictionResult:
    """Strip the factor breakdown from a 1x2 prediction for free callers."""
    if plan == "vip":
        return result

    limited = result.model_copy(deep=True)
    limited.factors = None
    return limited


def _recombine(ticket: Ticket) -> Ticket:
    """
    Recompute a ticket's aggregate numbers after its legs were cut.

    Without this the ticket would advertise the combined odds of the full parlay
    while listing three legs — a number the customer could not actually win.
    """
    combined_odds = 1.0
    combined_probability = 1.0
    for leg in ticket.legs:
        combined_odds *= leg.odds
        combined_probability *= leg.probability

    ticket.combined_odds = round(combined_odds, 2)
    ticket.combined_probability = round(combined_probability, 4)
    ticket.potential_return_per_unit = ticket.combined_odds
    return ticket


def limit_tickets(tickets: list[Ticket], plan: str) -> list[Ticket]:
    """Return the tickets `plan` is entitled to, with legs capped."""
    if plan == "vip":
        return tickets

    by_tier = {ticket.tier: ticket for ticket in tickets}
    selected: list[Ticket] = []
    for tier in FREE_TIER_ORDER:
        if tier in by_tier:
            selected.append(by_tier[tier])
        if len(selected) >= FREE_TICKETS_PER_DAY:
            break

    limited: list[Ticket] = []
    for ticket in selected:
        capped = ticket.model_copy(deep=True)
        capped.legs = capped.legs[:FREE_LEGS_PER_TICKET]
        limited.append(_recombine(capped))

    return limited


def limit_deep_analysis(analysis: dict, plan: str) -> tuple[dict, bool]:
    """
    Shape a DeepAnalysisService.analyze_match() payload for `plan`.

    Free callers get the "Smart Recommendation" heading's facts only — market,
    odds, confidence — never the reasoning text, the all_markets side-by-side
    table, or any of the supporting sections (form, h2h, standings,
    top-vs-bottom, the smart-filter breakdown). Those are the "How We Got
    Here" / "All Markets" / "Top vs Bottom Context" rows the pricing page
    lists as VIP-only.

    Returns (shaped_payload, limited) — `limited` feeds the same
    EntitlementMixin.limited flag every other prediction-service response
    uses, so the frontend can say "upgrade to see more" honestly rather than
    guessing from what did/didn't arrive.
    """
    if plan == "vip":
        return analysis, False

    odds = analysis.get("odds_analysis") or {}
    rec = analysis.get("final_recommendation") or {}

    shaped = {
        # The alert flag is kept — it is one bit of information, not the
        # detailed margin/probability breakdown behind it.
        "odds_analysis": {
            "anomaly_detected": odds.get("anomaly_detected", False),
            "insufficient_data": odds.get("insufficient_data", False),
        },
        "home_form": {},
        "away_form": {},
        "h2h": {},
        "standings": {},
        "top_vs_bottom": {},
        "smart_filter": {},
        "final_recommendation": {
            "market": rec.get("market"),
            "odds": rec.get("odds"),
            "confidence": rec.get("confidence", 0),
            "never_guaranteed": rec.get("never_guaranteed", True),
            "disclaimer": rec.get("disclaimer"),
        },
        "disclaimer": analysis.get("disclaimer"),
    }
    return shaped, True
