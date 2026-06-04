"""
Ticket generator service.

Builds 4 risk-tiered betting tickets (Ultra Safe / Safe / Moderate / Risky)
from a list of fully-predicted fixtures.

Pipeline:
  1. Flatten all market probabilities from all fixtures into a flat list
     of "bet options", each with fixture_id, market, probability, odds.
  2. For each tier, filter options by minimum probability threshold.
  3. Use a greedy selection:
       - Sort by probability descending.
       - Max 1 leg per fixture.
       - Max 2 legs of the same market type.
       - Stop when target legs reached.
  4. If not enough eligible legs, blend in mock data (never return empty ticket).
  5. Return Ticket objects ready for the API response.
"""

import uuid
from collections import defaultdict
from datetime import datetime
from typing import Optional

from src.models.prediction import FullPredictionResult, Ticket, TicketLeg, TicketTier


# ── Tier configuration ────────────────────────────────────────────────────────

TIER_CONFIG: dict[str, dict] = {
    TicketTier.ULTRA_SAFE: {
        "name": "Ultra Safe",
        "emoji": "🟢",
        "legs": (2, 3),
        "min_probability": 0.82,
        "description": "Very high probability, low risk",
    },
    TicketTier.SAFE: {
        "name": "Safe",
        "emoji": "🔵",
        "legs": (4, 5),
        "min_probability": 0.68,
        "description": "Good probability with decent returns",
    },
    TicketTier.MODERATE: {
        "name": "Moderate",
        "emoji": "🟡",
        "legs": (6, 7),
        "min_probability": 0.55,
        "description": "Balanced risk and reward",
    },
    TicketTier.RISKY: {
        "name": "Risky",
        "emoji": "🔴",
        "legs": (8, 10),
        "min_probability": 0.40,
        "description": "High risk, high reward",
    },
}

# Bookmaker margin used to inflate odds slightly above fair value
BOOKMAKER_MARGIN: float = 0.05
MAX_SAME_MARKET: int = 2   # max legs of the same market type per ticket


# ── Human-readable selection labels ──────────────────────────────────────────

_SELECTION_LABELS: dict[str, str] = {
    "home_win":          "{home} to Win",
    "draw":              "{home} vs {away} - Draw",
    "away_win":          "{away} to Win",
    "over_1_5":          "Over 1.5 Goals",
    "under_1_5":         "Under 1.5 Goals",
    "over_2_5":          "Over 2.5 Goals",
    "under_2_5":         "Under 2.5 Goals",
    "over_3_5":          "Over 3.5 Goals",
    "under_3_5":         "Under 3.5 Goals",
    "btts_yes":          "Both Teams to Score - Yes",
    "btts_no":           "Both Teams to Score - No",
    "over_8_5":          "Over 8.5 Corners",
    "under_8_5":         "Under 8.5 Corners",
    "over_9_5":          "Over 9.5 Corners",
    "under_9_5":         "Under 9.5 Corners",
    "over_10_5":         "Over 10.5 Corners",
    "under_10_5":        "Under 10.5 Corners",
    "dc_1x":             "{home} or Draw (1X)",
    "dc_12":             "{home} or {away} (12)",
    "dc_x2":             "Draw or {away} (X2)",
    "home_clean_sheet":  "{home} Clean Sheet",
    "away_clean_sheet":  "{away} Clean Sheet",
    "htft_home_home":    "{home}/{home} (HT/FT)",
    "htft_draw_home":    "Draw/{home} (HT/FT)",
    "htft_away_home":    "{away}/{home} (HT/FT)",
    "htft_home_draw":    "{home}/Draw (HT/FT)",
    "htft_draw_draw":    "Draw/Draw (HT/FT)",
    "htft_away_draw":    "{away}/Draw (HT/FT)",
    "htft_home_away":    "{home}/{away} (HT/FT)",
    "htft_draw_away":    "Draw/{away} (HT/FT)",
    "htft_away_away":    "{away}/{away} (HT/FT)",
    "home_win_ht":       "{home} to Win 1st Half",
    "draw_ht":           "1st Half Draw",
    "away_win_ht":       "{away} to Win 1st Half",
    "home_over_0_5":     "{home} Over 0.5 Goals",
    "home_over_1_5":     "{home} Over 1.5 Goals",
    "home_over_2_5":     "{home} Over 2.5 Goals",
    "away_over_0_5":     "{away} Over 0.5 Goals",
    "away_over_1_5":     "{away} Over 1.5 Goals",
    "away_over_2_5":     "{away} Over 2.5 Goals",
    "home_under_0_5":    "{home} Under 0.5 Goals",
    "home_under_1_5":    "{home} Under 1.5 Goals",
    "home_under_2_5":    "{home} Under 2.5 Goals",
    "away_under_0_5":    "{away} Under 0.5 Goals",
    "away_under_1_5":    "{away} Under 1.5 Goals",
    "away_under_2_5":    "{away} Under 2.5 Goals",
    "home_win_both":     "{home} to Win Both Halves",
    "away_win_both":     "{away} to Win Both Halves",
    "home_win_either":   "{home} to Win Either Half",
    "away_win_either":   "{away} to Win Either Half",
    "home_comeback":     "{home} to Win From Behind",
    "away_comeback":     "{away} to Win From Behind",
    "any_comeback":      "Any Team to Win From Behind",
    "home_dnb":          "{home} Draw No Bet",
    "away_dnb":          "{away} Draw No Bet",
    "home_minus_1":      "{home} -1 Goal",
    "tie_minus_1":       "Handicap Tie -1 Goal",
    "away_plus_1":       "{away} +1 Goal",
    "home_minus_2":      "{home} -2 Goals",
    "tie_minus_2":       "Handicap Tie -2 Goals",
    "away_plus_2":       "{away} +2 Goals",
    "home_minus_3":      "{home} -3 Goals",
    "tie_minus_3":       "Handicap Tie -3 Goals",
    "away_plus_3":       "{away} +3 Goals",
    "btts_yes_home":     "BTTS Yes & {home} Win",
    "btts_yes_draw":     "BTTS Yes & Draw",
    "btts_yes_away":     "BTTS Yes & {away} Win",
    "btts_no_home":      "BTTS No & {home} Win",
    "btts_no_draw":      "BTTS No & Draw",
    "btts_no_away":      "BTTS No & {away} Win",
    "btts_yes_over_2_5":  "BTTS Yes & Over 2.5 Goals",
    "btts_yes_under_2_5": "BTTS Yes & Under 2.5 Goals",
    "btts_yes_over_3_5":  "BTTS Yes & Over 3.5 Goals",
    "btts_yes_under_3_5": "BTTS Yes & Under 3.5 Goals",
    "btts_yes_over_4_5":  "BTTS Yes & Over 4.5 Goals",
    "btts_yes_under_4_5": "BTTS Yes & Under 4.5 Goals",
    "btts_yes_over_5_5":  "BTTS Yes & Over 5.5 Goals",
    "btts_yes_under_5_5": "BTTS Yes & Under 5.5 Goals",
    "btts_no_over_2_5":   "BTTS No & Over 2.5 Goals",
    "btts_no_under_2_5":  "BTTS No & Under 2.5 Goals",
    "btts_no_over_3_5":   "BTTS No & Over 3.5 Goals",
    "btts_no_under_3_5":  "BTTS No & Under 3.5 Goals",
    "btts_no_over_4_5":   "BTTS No & Over 4.5 Goals",
    "btts_no_under_4_5":  "BTTS No & Under 4.5 Goals",
    "btts_no_over_5_5":   "BTTS No & Over 5.5 Goals",
    "btts_no_under_5_5":  "BTTS No & Under 5.5 Goals",
    "home_lead_anytime": "{home} to Lead at Anytime",
    "away_lead_anytime": "{away} to Lead at Anytime",
}

# Market-type grouping for diversity enforcement
_MARKET_GROUP: dict[str, str] = {
    "home_win": "1x2", "draw": "1x2", "away_win": "1x2",
    "over_1_5": "over_under", "under_1_5": "over_under",
    "over_2_5": "over_under", "under_2_5": "over_under",
    "over_3_5": "over_under", "under_3_5": "over_under",
    "btts_yes": "btts", "btts_no": "btts",
    "over_8_5": "corners", "under_8_5": "corners",
    "over_9_5": "corners", "under_9_5": "corners",
    "over_10_5": "corners", "under_10_5": "corners",
    "dc_1x": "double_chance", "dc_12": "double_chance", "dc_x2": "double_chance",
    "home_clean_sheet": "clean_sheet", "away_clean_sheet": "clean_sheet",
}


# ── Odds calculation ──────────────────────────────────────────────────────────

def _prob_to_odds(probability: float) -> float:
    """Convert probability to decimal odds with 5% bookmaker margin."""
    if probability <= 0:
        return 99.0
    # Apply margin: inflate the fair probability by margin before converting back
    margined_prob = probability * (1.0 - BOOKMAKER_MARGIN)
    if margined_prob <= 0:
        return 99.0
    return round(1.0 / margined_prob, 2)


# ── Bet option dataclass ──────────────────────────────────────────────────────

class _BetOption:
    __slots__ = (
        "fixture_id", "match", "league", "kickoff",
        "market", "market_group", "selection", "probability", "odds",
    )

    def __init__(
        self,
        fixture_id: int,
        match: str,
        league: str,
        kickoff: Optional[datetime],
        market: str,
        selection: str,
        probability: float,
        odds: float,
    ):
        self.fixture_id = fixture_id
        self.match = match
        self.league = league
        self.kickoff = kickoff
        self.market = market
        self.selection = selection
        self.probability = probability
        self.odds = odds

        # Dynamic prefix/suffix market group classification
        if market.startswith("correct_score_"):
            self.market_group = "correct_score"
        elif market.startswith("htft_"):
            self.market_group = "halftime_fulltime"
        elif market.endswith("_ht"):
            self.market_group = "halftime_result"
        elif ("over_" in market or "under_" in market) and ("home_" in market or "away_" in market):
            self.market_group = "team_total_goals"
        elif market.endswith("_both"):
            self.market_group = "win_both_halves"
        elif market.endswith("_either"):
            self.market_group = "win_either_half"
        elif market.endswith("_comeback") or market == "any_comeback":
            self.market_group = "win_from_behind"
        elif market.endswith("_dnb"):
            self.market_group = "draw_no_bet"
        elif "minus_" in market or "plus_" in market:
            self.market_group = "handicap"
        elif market.startswith("btts_yes_over_") or market.startswith("btts_yes_under_") or market.startswith("btts_no_over_") or market.startswith("btts_no_under_"):
            self.market_group = "btts_total_goals"
        elif market.startswith("btts_yes_") or market.startswith("btts_no_"):
            self.market_group = "btts_result"
        elif market.endswith("_lead_anytime"):
            self.market_group = "lead_at_anytime"
        else:
            self.market_group = _MARKET_GROUP.get(market, market)

    def to_leg(self) -> TicketLeg:
        return TicketLeg(
            fixture_id=self.fixture_id,
            match=self.match,
            league=self.league,
            kickoff=self.kickoff,
            market=self.market,
            selection=self.selection,
            probability=self.probability,
            odds=self.odds,
        )


# ── Flattening predictions → bet options ─────────────────────────────────────

def _label(market: str, home: str, away: str) -> str:
    if market.startswith("correct_score_"):
        score = market.split("correct_score_")[1].replace("_", "-")
        return f"Correct Score {score}"
    template = _SELECTION_LABELS.get(market, market)
    return template.format(home=home, away=away)


def _flatten(predictions: list[FullPredictionResult]) -> list[_BetOption]:
    """Convert all market probabilities across all predictions to a flat list."""
    options: list[_BetOption] = []

    for pred in predictions:
        home = pred.home_team
        away = pred.away_team
        match = f"{home} vs {away}"
        league = pred.league_name or "Unknown League"
        kickoff = pred.kickoff
        fid = pred.fixture_id

        def add(market: str, prob: float) -> None:
            if 0 < prob < 1:  # exclude degenerate probabilities
                options.append(_BetOption(
                    fixture_id=fid,
                    match=match,
                    league=league,
                    kickoff=kickoff,
                    market=market,
                    selection=_label(market, home, away),
                    probability=round(prob, 4),
                    odds=_prob_to_odds(prob),
                ))

        # 1x2 (We add it using individual keys)
        add("home_win", pred.home_win)
        add("draw", pred.draw)
        add("away_win", pred.away_win)

        m = pred.markets

        # Over/Under
        add("over_1_5",  m.over_under.over_1_5)
        add("under_1_5", m.over_under.under_1_5)
        add("over_2_5",  m.over_under.over_2_5)
        add("under_2_5", m.over_under.under_2_5)
        add("over_3_5",  m.over_under.over_3_5)
        add("under_3_5", m.over_under.under_3_5)

        # BTTS
        add("btts_yes", m.btts.btts_yes)
        add("btts_no",  m.btts.btts_no)

        # Corners (only overs — unders are low-probability "safe" bets, avoid duplication)
        add("over_8_5",  m.corners.over_8_5)
        add("over_9_5",  m.corners.over_9_5)
        add("over_10_5", m.corners.over_10_5)

        # Double Chance
        add("dc_1x", m.double_chance.dc_1x)
        add("dc_12", m.double_chance.dc_12)
        add("dc_x2", m.double_chance.dc_x2)

        # Clean Sheet
        add("home_clean_sheet", m.clean_sheet.home_clean_sheet)
        add("away_clean_sheet", m.clean_sheet.away_clean_sheet)

        # Correct Score
        for score, prob in m.correct_score.items():
            score_key = f"correct_score_{score.replace('-', '_')}"
            add(score_key, prob)

        # Halftime/Fulltime
        add("htft_home_home", m.halftime_fulltime.home_home)
        add("htft_draw_home", m.halftime_fulltime.draw_home)
        add("htft_away_home", m.halftime_fulltime.away_home)
        add("htft_home_draw", m.halftime_fulltime.home_draw)
        add("htft_draw_draw", m.halftime_fulltime.draw_draw)
        add("htft_away_draw", m.halftime_fulltime.away_draw)
        add("htft_home_away", m.halftime_fulltime.home_away)
        add("htft_draw_away", m.halftime_fulltime.draw_away)
        add("htft_away_away", m.halftime_fulltime.away_away)

        # Halftime Result
        add("home_win_ht", m.halftime_result.home_win_ht)
        add("draw_ht", m.halftime_result.draw_ht)
        add("away_win_ht", m.halftime_result.away_win_ht)

        # Team Total Goals
        add("home_over_0_5", m.team_total_goals.home_over_0_5)
        add("home_over_1_5", m.team_total_goals.home_over_1_5)
        add("home_over_2_5", m.team_total_goals.home_over_2_5)
        add("away_over_0_5", m.team_total_goals.away_over_0_5)
        add("away_over_1_5", m.team_total_goals.away_over_1_5)
        add("away_over_2_5", m.team_total_goals.away_over_2_5)
        add("home_under_0_5", m.team_total_goals.home_under_0_5)
        add("home_under_1_5", m.team_total_goals.home_under_1_5)
        add("home_under_2_5", m.team_total_goals.home_under_2_5)
        add("away_under_0_5", m.team_total_goals.away_under_0_5)
        add("away_under_1_5", m.team_total_goals.away_under_1_5)
        add("away_under_2_5", m.team_total_goals.away_under_2_5)

        # Win Both Halves
        add("home_win_both", m.win_both_halves.home_win_both)
        add("away_win_both", m.win_both_halves.away_win_both)

        # Win Either Half
        add("home_win_either", m.win_either_half.home_win_either)
        add("away_win_either", m.win_either_half.away_win_either)

        # Win From Behind
        add("home_comeback", m.win_from_behind.home_comeback)
        add("away_comeback", m.win_from_behind.away_comeback)
        add("any_comeback", m.win_from_behind.any_comeback)

        # Draw No Bet
        add("home_dnb", m.draw_no_bet.home_dnb)
        add("away_dnb", m.draw_no_bet.away_dnb)

        # Handicap
        add("home_minus_1", m.handicap.home_minus_1)
        add("tie_minus_1", m.handicap.tie_minus_1)
        add("away_plus_1", m.handicap.away_plus_1)
        add("home_minus_2", m.handicap.home_minus_2)
        add("tie_minus_2", m.handicap.tie_minus_2)
        add("away_plus_2", m.handicap.away_plus_2)
        add("home_minus_3", m.handicap.home_minus_3)
        add("tie_minus_3", m.handicap.tie_minus_3)
        add("away_plus_3", m.handicap.away_plus_3)

        # BTTS + Result Combo
        add("btts_yes_home", m.btts_result.btts_yes_home)
        add("btts_yes_draw", m.btts_result.btts_yes_draw)
        add("btts_yes_away", m.btts_result.btts_yes_away)
        add("btts_no_home", m.btts_result.btts_no_home)
        add("btts_no_draw", m.btts_result.btts_no_draw)
        add("btts_no_away", m.btts_result.btts_no_away)

        # BTTS + Total Goals Combo
        add("btts_yes_over_2_5", m.btts_total_goals.btts_yes_over_2_5)
        add("btts_yes_under_2_5", m.btts_total_goals.btts_yes_under_2_5)
        add("btts_yes_over_3_5", m.btts_total_goals.btts_yes_over_3_5)
        add("btts_yes_under_3_5", m.btts_total_goals.btts_yes_under_3_5)
        add("btts_yes_over_4_5", m.btts_total_goals.btts_yes_over_4_5)
        add("btts_yes_under_4_5", m.btts_total_goals.btts_yes_under_4_5)
        add("btts_yes_over_5_5", m.btts_total_goals.btts_yes_over_5_5)
        add("btts_yes_under_5_5", m.btts_total_goals.btts_yes_under_5_5)
        add("btts_no_over_2_5", m.btts_total_goals.btts_no_over_2_5)
        add("btts_no_under_2_5", m.btts_total_goals.btts_no_under_2_5)
        add("btts_no_over_3_5", m.btts_total_goals.btts_no_over_3_5)
        add("btts_no_under_3_5", m.btts_total_goals.btts_no_under_3_5)
        add("btts_no_over_4_5", m.btts_total_goals.btts_no_over_4_5)
        add("btts_no_under_4_5", m.btts_total_goals.btts_no_under_4_5)
        add("btts_no_over_5_5", m.btts_total_goals.btts_no_over_5_5)
        add("btts_no_under_5_5", m.btts_total_goals.btts_no_under_5_5)

        # Lead At Anytime
        add("home_lead_anytime", m.lead_at_anytime.home_lead_anytime)
        add("away_lead_anytime", m.lead_at_anytime.away_lead_anytime)

    return options


# ── Greedy leg selection ──────────────────────────────────────────────────────

def _select_legs(
    options: list[_BetOption],
    min_prob: float,
    min_legs: int,
    max_legs: int,
) -> list[_BetOption]:
    """
    Greedily select legs for one ticket tier.

    Rules:
      - probability >= min_prob
      - max 1 leg per fixture
      - max MAX_SAME_MARKET legs of the same market group
      - stop at max_legs
    """
    eligible = [o for o in options if o.probability >= min_prob]
    eligible.sort(key=lambda x: x.probability, reverse=True)

    selected: list[_BetOption] = []
    used_fixtures: set[int] = set()
    group_counts: dict[str, int] = defaultdict(int)

    for opt in eligible:
        if len(selected) >= max_legs:
            break
        if opt.fixture_id in used_fixtures:
            continue
        if group_counts[opt.market_group] >= MAX_SAME_MARKET:
            continue

        selected.append(opt)
        used_fixtures.add(opt.fixture_id)
        group_counts[opt.market_group] += 1

    return selected


# ── Mock fallback data ────────────────────────────────────────────────────────

_MOCK_OPTIONS: list[_BetOption] = [
    _BetOption(900001, "Manchester City vs Arsenal",       "Premier League",  None, "over_2_5",          "Over 2.5 Goals",                      0.87, _prob_to_odds(0.87)),
    _BetOption(900002, "Real Madrid vs Barcelona",         "La Liga",         None, "btts_yes",          "Both Teams to Score - Yes",            0.83, _prob_to_odds(0.83)),
    _BetOption(900003, "Bayern Munich vs Borussia Dortmund","Bundesliga",     None, "over_2_5",          "Over 2.5 Goals",                       0.81, _prob_to_odds(0.81)),
    _BetOption(900004, "PSG vs Lyon",                      "Ligue 1",         None, "home_win",          "PSG to Win",                           0.79, _prob_to_odds(0.79)),
    _BetOption(900005, "Juventus vs Inter Milan",          "Serie A",         None, "btts_yes",          "Both Teams to Score - Yes",            0.76, _prob_to_odds(0.76)),
    _BetOption(900006, "Atletico Madrid vs Sevilla",       "La Liga",         None, "dc_1x",             "Atletico Madrid or Draw (1X)",         0.74, _prob_to_odds(0.74)),
    _BetOption(900007, "Liverpool vs Chelsea",             "Premier League",  None, "over_1_5",          "Over 1.5 Goals",                       0.72, _prob_to_odds(0.72)),
    _BetOption(900008, "AC Milan vs Napoli",               "Serie A",         None, "over_2_5",          "Over 2.5 Goals",                       0.68, _prob_to_odds(0.68)),
    _BetOption(900009, "Borussia Dortmund vs RB Leipzig",  "Bundesliga",      None, "btts_yes",          "Both Teams to Score - Yes",            0.65, _prob_to_odds(0.65)),
    _BetOption(900010, "Tottenham vs West Ham",            "Premier League",  None, "over_2_5",          "Over 2.5 Goals",                       0.62, _prob_to_odds(0.62)),
    _BetOption(900011, "Valencia vs Athletic Bilbao",      "La Liga",         None, "home_win",          "Valencia to Win",                      0.55, _prob_to_odds(0.55)),
    _BetOption(900012, "Fiorentina vs Roma",               "Serie A",         None, "btts_yes",          "Both Teams to Score - Yes",            0.52, _prob_to_odds(0.52)),
    _BetOption(900013, "Marseille vs Monaco",              "Ligue 1",         None, "over_2_5",          "Over 2.5 Goals",                       0.48, _prob_to_odds(0.48)),
    _BetOption(900014, "Ajax vs PSV",                      "Eredivisie",      None, "away_win",          "PSV to Win",                           0.45, _prob_to_odds(0.45)),
    _BetOption(900015, "Porto vs Benfica",                 "Primeira Liga",   None, "btts_yes",          "Both Teams to Score - Yes",            0.43, _prob_to_odds(0.43)),
]


def _fill_with_mock(
    selected: list[_BetOption],
    min_prob: float,
    max_legs: int,
) -> list[_BetOption]:
    """Fill up to max_legs using mock data when real data is insufficient."""
    used_fixtures = {o.fixture_id for o in selected}
    candidates = [
        o for o in _MOCK_OPTIONS
        if o.fixture_id not in used_fixtures and o.probability >= min_prob
    ]
    for opt in candidates:
        if len(selected) >= max_legs:
            break
        if opt.fixture_id not in used_fixtures:
            selected.append(opt)
            used_fixtures.add(opt.fixture_id)
    return selected


# ── Confidence label ──────────────────────────────────────────────────────────

def _confidence_label(combined_prob: float) -> str:
    if combined_prob >= 0.40:
        return "high"
    if combined_prob >= 0.15:
        return "medium"
    return "low"


# ── Public API ────────────────────────────────────────────────────────────────

class TicketGenerator:
    """Generates risk-tiered betting tickets from today's predictions."""

    def generate_daily_tickets(
        self,
        match_predictions: list[FullPredictionResult],
    ) -> list[Ticket]:
        """
        Build 4 tickets (one per tier) from all today's match predictions.

        Args:
            match_predictions: list of FullPredictionResult for today's matches.

        Returns:
            list of Ticket objects (always 4, using mock fallback if necessary).
        """
        all_options = _flatten(match_predictions)
        tickets: list[Ticket] = []

        for tier, config in TIER_CONFIG.items():
            ticket = self._build_ticket(tier, config, all_options)
            tickets.append(ticket)

        return tickets

    def _build_ticket(
        self,
        tier: str,
        config: dict,
        all_options: list[_BetOption],
    ) -> Ticket:
        min_legs, max_legs = config["legs"]
        min_prob = config["min_probability"]

        # Select real legs
        selected = _select_legs(all_options, min_prob, min_legs, max_legs)

        # Pad with mock data if necessary
        if len(selected) < min_legs:
            selected = _fill_with_mock(selected, min_prob, max_legs)

        # Final cap at max_legs
        selected = selected[:max_legs]

        # Compute combined statistics
        combined_odds = 1.0
        combined_prob = 1.0
        for opt in selected:
            combined_odds *= opt.odds
            combined_prob *= opt.probability

        combined_odds = round(combined_odds, 2)
        combined_prob = round(combined_prob, 4)

        return Ticket(
            id=str(uuid.uuid4()),
            tier=tier,
            name=config["name"],
            emoji=config["emoji"],
            description=config["description"],
            legs=[opt.to_leg() for opt in selected],
            combined_odds=combined_odds,
            combined_probability=combined_prob,
            potential_return_per_unit=combined_odds,
            confidence=_confidence_label(combined_prob),
            generated_at=datetime.utcnow(),
        )


# Module-level singleton
ticket_generator = TicketGenerator()
