"""
Authentication Router — OIDC flow via MynaPortal.
Acts as a transient state manager. No PII is stored.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from jose import jwt
import httpx

from app.config import settings

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────

class OIDCStartResponse(BaseModel):
    authorization_url: str
    state: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class SessionInfo(BaseModel):
    authenticated: bool
    provider: str = "MynaPortal OIDC"
    note: str = "No PII stored — transient session only."


# ── Helpers ──────────────────────────────────────────────────────────────

def _build_authorization_url(state: str) -> str:
    """Build the MynaPortal OIDC authorization URL."""
    params = {
        "response_type": "code",
        "client_id": settings.myna_oidc_client_id,
        "redirect_uri": settings.myna_oidc_redirect_uri,
        "scope": "openid profile",
        "state": state,
    }
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{settings.myna_oidc_issuer}/authorize?{qs}"


def _create_session_token(sub: str) -> str:
    """Issue a short-lived JWT for the frontend session."""
    payload = {
        "sub": sub,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes),
        "iss": "japan-gov-os",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


# ── Routes ───────────────────────────────────────────────────────────────

@router.get("/start", response_model=OIDCStartResponse)
async def oidc_start():
    """
    Step 1 — Redirect user to MynaPortal OIDC authorization endpoint.
    On mobile, this triggers the Myna App Intent (Android/iOS).
    """
    import secrets
    state = secrets.token_urlsafe(32)
    url = _build_authorization_url(state)
    return OIDCStartResponse(authorization_url=url, state=state)


@router.get("/callback", response_model=TokenResponse)
async def oidc_callback(
    code: str = Query(..., description="Authorization code from MynaPortal"),
    state: str = Query(..., description="CSRF state token"),
):
    """
    Step 2 — Exchange authorization code for tokens.
    Validates with MynaPortal, issues a local session JWT.
    """
    token_url = f"{settings.myna_oidc_issuer}/token"

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                token_url,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.myna_oidc_redirect_uri,
                    "client_id": settings.myna_oidc_client_id,
                    "client_secret": settings.myna_oidc_client_secret,
                },
                timeout=15.0,
            )
            resp.raise_for_status()
        except httpx.HTTPError:
            raise HTTPException(
                status_code=502,
                detail="Failed to exchange code with MynaPortal. Ensure Myna App is properly configured.",
            )

    data = resp.json()
    # Issue our own short-lived token (no PII stored)
    id_token_sub = data.get("sub", "myna-user")
    session_token = _create_session_token(id_token_sub)

    return TokenResponse(
        access_token=session_token,
        expires_in=settings.jwt_expire_minutes * 60,
    )


@router.get("/session", response_model=SessionInfo)
async def session_info():
    """Return session metadata (no PII)."""
    return SessionInfo(authenticated=True)


@router.post("/logout")
async def logout():
    """Invalidate session (stateless — frontend discards token)."""
    return {"status": "logged_out", "message": "Token should be discarded on the client side."}
