"""
Configuration — loaded from environment variables.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ──
    app_name: str = "Japan GOV-OS"
    debug: bool = False

    # ── OIDC / Myna ──
    myna_oidc_issuer: str = "https://mynaportal.go.jp"
    myna_oidc_client_id: str = ""
    myna_oidc_client_secret: str = ""
    myna_oidc_redirect_uri: str = "http://localhost:3000/api/auth/callback"

    # ── External APIs ──
    egov_api_base: str = "https://api.e-gov.go.jp/v5.6"
    egov_api_key: str = ""
    isa_online_base: str = "https://www.isa.go.jp"
    etax_api_base: str = "https://www.e-tax.nta.go.jp"

    # ── JWT ──
    jwt_secret: str = "CHANGE-ME-IN-PRODUCTION"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # ── CORS ──
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
