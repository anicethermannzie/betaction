"""
Access-token verification and plan resolution.

This service holds the data customers pay for, so entitlement is decided here —
not in nginx (which cannot see trial expiry) and not in the frontend (which the
customer controls). The token is verified locally with the shared access secret:
no network hop to auth-service, and a plan change propagates within the token's
15-minute lifetime.

Claim contract — mirrors auth-service/src/utils/entitlements.js:
    { id, email, role, sid, plan: "free"|"vip", trial_ends_at: ISO8601|null }
Any change to those names must ship on both sides together.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import jwt
from fastapi import Header, HTTPException

from src.config.settings import settings

logger = logging.getLogger(__name__)

# PRODUCT DECISION (confirmed 2026-09-14): the trial does NOT grant VIP access.
# A trial user is a free caller — same 6-of-18 markets, no factor breakdown,
# 1 ticket capped at 3 legs, matching the "Free trial" column on the pricing
# table. Mirrors TRIAL_GRANTS_VIP in auth-service/src/utils/entitlements.js —
# keep the two in step.
TRIAL_GRANTS_VIP = False

PLAN_VIP = "vip"
PLAN_FREE = "free"


@dataclass(frozen=True)
class Viewer:
    """Who is asking, and what they are entitled to see."""

    user_id: Optional[int]
    plan: str
    authenticated: bool

    @property
    def is_vip(self) -> bool:
        return self.plan == PLAN_VIP


ANONYMOUS = Viewer(user_id=None, plan=PLAN_FREE, authenticated=False)


def resolve_plan(claims: dict) -> str:
    """Return the plan a set of claims is entitled to right now."""
    if claims.get("plan") == PLAN_VIP:
        return PLAN_VIP

    trial_ends_at = claims.get("trial_ends_at")
    if TRIAL_GRANTS_VIP and trial_ends_at:
        try:
            expiry = datetime.fromisoformat(str(trial_ends_at).replace("Z", "+00:00"))
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            if expiry > datetime.now(timezone.utc):
                return PLAN_VIP
        except ValueError:
            # A malformed claim must not silently upgrade the caller.
            logger.warning("Unparseable trial_ends_at claim", extra={"value": str(trial_ends_at)})

    return PLAN_FREE


async def get_viewer(authorization: Optional[str] = Header(None)) -> Viewer:
    """
    FastAPI dependency: resolve the caller from the Authorization header.

    No header means an anonymous visitor on the free tier — these endpoints stay
    publicly readable, just limited. A header that is present but invalid is a
    401 rather than a silent downgrade, so the client's refresh flow can react
    instead of quietly showing a paying customer the free response.
    """
    if not authorization:
        return ANONYMOUS

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Malformed Authorization header")

    if not settings.jwt_access_secret:
        # Fail closed: without the secret no token can be trusted, so treat the
        # caller as anonymous rather than honouring unverified claims.
        logger.error("JWT_ACCESS_SECRET is not configured — refusing to trust access tokens")
        return ANONYMOUS

    try:
        claims = jwt.decode(token, settings.jwt_access_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Access token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid access token")

    return Viewer(
        user_id=claims.get("id"),
        plan=resolve_plan(claims),
        authenticated=True,
    )
