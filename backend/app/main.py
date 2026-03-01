"""
Japan GOV-OS — FastAPI Backend
Unified English-language wrapper for Japanese digital bureaucracy.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    zenkaku,
    municipal,
    tax,
    hikkoshi,
    visa,
    search,
    pdf_overlay,
)

app = FastAPI(
    title="Japan GOV-OS API",
    version="1.0.0",
    description="Backend API for Japan GOV-OS — a unified English wrapper for Japanese civic digital services.",
)

# Build allowed origins from env (comma-separated) or default to localhost
_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000")
_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(zenkaku.router, prefix="/api/zenkaku", tags=["Zenkaku Engine"])
app.include_router(municipal.router, prefix="/api/municipal", tags=["Municipal Adapter"])
app.include_router(tax.router, prefix="/api/tax", tags=["Tax & Invoice"])
app.include_router(hikkoshi.router, prefix="/api/hikkoshi", tags=["Hikkoshi One-Stop"])
app.include_router(visa.router, prefix="/api/visa", tags=["Visa Extension"])
app.include_router(search.router, prefix="/api/search", tags=["Global Search"])
app.include_router(pdf_overlay.router, prefix="/api/pdf", tags=["PDF Overlay"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "japan-gov-os", "version": "1.0.0"}
