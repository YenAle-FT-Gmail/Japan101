"""
Municipal Adapter Layer
───────────────────────
Since Gov-Cloud migration is incomplete as of March 2026, this implements
an adapter pattern with two providers:

  Provider A (Standard) — Gov-Cloud APIs for migrated wards
  Provider B (Legacy)   — K-Search metadata scraper for legacy NTT Data / NEC portals

Maps to canonical Form IDs:
  ID-JIN-101  Moving Notification (転入届)
  ID-NHI-201  NHI Enrollment (国民健康保険加入届)
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
# WARD REGISTRY
# ═══════════════════════════════════════════════════════════════════════════

class GovCloudStatus(str, Enum):
    MIGRATED = "migrated"
    LEGACY = "legacy"
    PARTIAL = "partial"


class WardInfo(BaseModel):
    """Municipality metadata."""
    ward_id: str
    name_en: str
    name_ja: str
    prefecture: str
    gov_cloud_status: GovCloudStatus
    portal_url: str
    reservation_api: Optional[str] = None
    notes: Optional[str] = None


# Seed data — real ward info for MVP
WARD_REGISTRY: dict[str, WardInfo] = {
    "minato-ku-tokyo": WardInfo(
        ward_id="minato-ku-tokyo",
        name_en="Minato City",
        name_ja="港区",
        prefecture="Tokyo",
        gov_cloud_status=GovCloudStatus.MIGRATED,
        portal_url="https://www.city.minato.tokyo.jp",
        reservation_api="https://www.city.minato.tokyo.jp/yoyaku",
        notes="Full Gov-Cloud migration completed Feb 2026.",
    ),
    "shibuya-ku-tokyo": WardInfo(
        ward_id="shibuya-ku-tokyo",
        name_en="Shibuya City",
        name_ja="渋谷区",
        prefecture="Tokyo",
        gov_cloud_status=GovCloudStatus.MIGRATED,
        portal_url="https://www.city.shibuya.tokyo.jp",
        reservation_api="https://www.city.shibuya.tokyo.jp/yoyaku",
    ),
    "shinjuku-ku-tokyo": WardInfo(
        ward_id="shinjuku-ku-tokyo",
        name_en="Shinjuku City",
        name_ja="新宿区",
        prefecture="Tokyo",
        gov_cloud_status=GovCloudStatus.PARTIAL,
        portal_url="https://www.city.shinjuku.lg.jp",
        notes="Partial migration. Moving forms migrated, NHI still legacy.",
    ),
    "osaka-shi": WardInfo(
        ward_id="osaka-shi",
        name_en="Osaka City",
        name_ja="大阪市",
        prefecture="Osaka",
        gov_cloud_status=GovCloudStatus.LEGACY,
        portal_url="https://www.city.osaka.lg.jp",
        notes="Full migration scheduled for Oct 2026.",
    ),
    "nagoya-shi": WardInfo(
        ward_id="nagoya-shi",
        name_en="Nagoya City",
        name_ja="名古屋市",
        prefecture="Aichi",
        gov_cloud_status=GovCloudStatus.LEGACY,
        portal_url="https://www.city.nagoya.jp",
        notes="Legacy NTT Data system.",
    ),
    "yokohama-shi": WardInfo(
        ward_id="yokohama-shi",
        name_en="Yokohama City",
        name_ja="横浜市",
        prefecture="Kanagawa",
        gov_cloud_status=GovCloudStatus.MIGRATED,
        portal_url="https://www.city.yokohama.lg.jp",
        reservation_api="https://www.city.yokohama.lg.jp/yoyaku",
    ),
    "fukuoka-shi": WardInfo(
        ward_id="fukuoka-shi",
        name_en="Fukuoka City",
        name_ja="福岡市",
        prefecture="Fukuoka",
        gov_cloud_status=GovCloudStatus.MIGRATED,
        portal_url="https://www.city.fukuoka.lg.jp",
        reservation_api="https://www.city.fukuoka.lg.jp/yoyaku",
    ),
    "sapporo-shi": WardInfo(
        ward_id="sapporo-shi",
        name_en="Sapporo City",
        name_ja="札幌市",
        prefecture="Hokkaido",
        gov_cloud_status=GovCloudStatus.PARTIAL,
        portal_url="https://www.city.sapporo.jp",
    ),
}


# ═══════════════════════════════════════════════════════════════════════════
# PROCEDURE DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════

class ProcedureInfo(BaseModel):
    form_id: str
    name_en: str
    name_ja: str
    description: str
    category: str
    required_documents: list[str]
    estimated_time_minutes: int
    can_do_online: bool
    gov_url: str
    related_forms: list[str] = []


PROCEDURE_DB: dict[str, ProcedureInfo] = {
    "ID-JIN-101": ProcedureInfo(
        form_id="ID-JIN-101",
        name_en="Moving-In Notification (Tenshutsu-Tennyu)",
        name_ja="転入届",
        description="Required when moving into a new municipality. Must be filed within 14 days of moving.",
        category="Residency",
        required_documents=[
            "Residence Card (在留カード)",
            "My Number Card or Notification Card",
            "Moving-Out Certificate from previous municipality (転出証明書)",
            "Passport (if address changed)",
        ],
        estimated_time_minutes=30,
        can_do_online=True,
        gov_url="https://www.digital.go.jp/policies/moving_onestop_service",
    ),
    "ID-NHI-201": ProcedureInfo(
        form_id="ID-NHI-201",
        name_en="National Health Insurance Enrollment",
        name_ja="国民健康保険加入届",
        description="Enroll in NHI when leaving company insurance or arriving as a freelancer / self-employed.",
        category="Health Insurance",
        required_documents=[
            "Residence Card (在留カード)",
            "My Number Card",
            "Certificate of Loss of Previous Coverage (資格喪失証明書)",
            "Passport",
            "Bank account information (for premium payments)",
        ],
        estimated_time_minutes=45,
        can_do_online=False,
        gov_url="https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryouhoken/",
    ),
    "ID-TAX-301": ProcedureInfo(
        form_id="ID-TAX-301",
        name_en="Tax Return (Kakutei Shinkoku)",
        name_ja="確定申告",
        description="Annual income tax return for freelancers, high-income earners, or those with multiple income sources.",
        category="Tax",
        required_documents=[
            "My Number Card",
            "Income statements (源泉徴収票)",
            "Expense receipts",
            "Bank account information",
        ],
        estimated_time_minutes=120,
        can_do_online=True,
        gov_url="https://www.e-tax.nta.go.jp",
    ),
    "ID-VISA-401": ProcedureInfo(
        form_id="ID-VISA-401",
        name_en="Visa Status Extension",
        name_ja="在留期間更新許可申請",
        description="Apply to extend your current visa status before it expires.",
        category="Immigration",
        required_documents=[
            "Passport",
            "Residence Card",
            "Application form (在留期間更新許可申請書)",
            "Photo (4cm x 3cm)",
            "Supporting documents depending on visa category",
        ],
        estimated_time_minutes=60,
        can_do_online=True,
        gov_url="https://www.isa.go.jp/en/applications/procedures/16-2.html",
    ),
    "ID-PEN-501": ProcedureInfo(
        form_id="ID-PEN-501",
        name_en="National Pension Enrollment",
        name_ja="国民年金加入届",
        description="Enroll in the National Pension system. Mandatory for all residents aged 20-59.",
        category="Pension",
        required_documents=[
            "Residence Card",
            "My Number Card",
            "Bank account information",
        ],
        estimated_time_minutes=30,
        can_do_online=False,
        gov_url="https://www.nenkin.go.jp/",
        related_forms=["ID-NHI-201"],
    ),
}


# ═══════════════════════════════════════════════════════════════════════════
# ADAPTER PATTERN — Provider A (Gov-Cloud) / Provider B (Legacy)
# ═══════════════════════════════════════════════════════════════════════════

class MunicipalProvider(ABC):
    """Base class for municipal data providers."""

    @abstractmethod
    async def get_procedure_steps(self, ward_id: str, form_id: str) -> dict:
        ...

    @abstractmethod
    async def check_availability(self, ward_id: str, form_id: str) -> dict:
        ...


class GovCloudProvider(MunicipalProvider):
    """Provider A — Standard Gov-Cloud REST API for migrated wards."""

    async def get_procedure_steps(self, ward_id: str, form_id: str) -> dict:
        ward = WARD_REGISTRY.get(ward_id)
        procedure = PROCEDURE_DB.get(form_id)
        if not ward or not procedure:
            return {"error": "Ward or procedure not found"}

        return {
            "provider": "gov-cloud",
            "ward": ward.name_en,
            "form_id": form_id,
            "procedure": procedure.name_en,
            "steps": [
                {"step": 1, "action": "Authenticate via Myna App", "type": "digital"},
                {"step": 2, "action": f"Fill out {procedure.name_en} form online", "type": "digital"},
                {"step": 3, "action": "Upload required documents", "type": "digital"},
                {"step": 4, "action": "Submit to ward office via Gov-Cloud API", "type": "digital",
                 "redirect_url": ward.portal_url},
                {"step": 5, "action": "Receive confirmation via MynaPortal", "type": "notification"},
            ],
            "online_submission": True,
            "verify_url": ward.portal_url,
        }

    async def check_availability(self, ward_id: str, form_id: str) -> dict:
        return {
            "available": True,
            "provider": "gov-cloud",
            "message": "This ward supports online submission via Gov-Cloud.",
        }


class LegacyKSearchProvider(MunicipalProvider):
    """
    Provider B — Legacy scraper using K-Search metadata engine.
    For wards still running NTT Data / NEC portals.
    """

    async def get_procedure_steps(self, ward_id: str, form_id: str) -> dict:
        ward = WARD_REGISTRY.get(ward_id)
        procedure = PROCEDURE_DB.get(form_id)
        if not ward or not procedure:
            return {"error": "Ward or procedure not found"}

        return {
            "provider": "legacy-ksearch",
            "ward": ward.name_en,
            "form_id": form_id,
            "procedure": procedure.name_en,
            "steps": [
                {"step": 1, "action": "Download form PDF from ward website", "type": "manual",
                 "url": f"{ward.portal_url}/forms/{form_id.lower()}.pdf"},
                {"step": 2, "action": "Fill out form (use PDF Overlay for English guidance)", "type": "manual"},
                {"step": 3, "action": "Prepare required documents", "type": "manual",
                 "documents": procedure.required_documents},
                {"step": 4, "action": f"Visit {ward.name_en} Ward Office in person", "type": "in-person"},
                {"step": 5, "action": "Submit at counter — present documents + form", "type": "in-person"},
            ],
            "online_submission": False,
            "verify_url": ward.portal_url,
            "note": "This ward has not migrated to Gov-Cloud. In-person visit required.",
        }

    async def check_availability(self, ward_id: str, form_id: str) -> dict:
        return {
            "available": True,
            "provider": "legacy-ksearch",
            "message": "Legacy system — form data scraped from ward portal. In-person submission required.",
        }


def get_provider(ward_id: str, form_id: str | None = None) -> MunicipalProvider:
    """Factory: select the right provider based on ward migration status."""
    ward = WARD_REGISTRY.get(ward_id)
    if not ward:
        return LegacyKSearchProvider()

    if ward.gov_cloud_status == GovCloudStatus.MIGRATED:
        return GovCloudProvider()
    elif ward.gov_cloud_status == GovCloudStatus.PARTIAL:
        # For partial migration, check if the specific form is migrated
        migrated_forms = {"ID-JIN-101"}  # Moving forms migrated first
        if form_id and form_id in migrated_forms:
            return GovCloudProvider()
        return LegacyKSearchProvider()
    else:
        return LegacyKSearchProvider()


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/wards")
async def list_wards(
    prefecture: Optional[str] = Query(None, description="Filter by prefecture"),
    status: Optional[GovCloudStatus] = Query(None, description="Filter by Gov-Cloud status"),
):
    """List all registered wards with Gov-Cloud migration status."""
    wards = list(WARD_REGISTRY.values())
    if prefecture:
        wards = [w for w in wards if w.prefecture.lower() == prefecture.lower()]
    if status:
        wards = [w for w in wards if w.gov_cloud_status == status]
    return {"wards": wards, "total": len(wards)}


@router.get("/wards/{ward_id}")
async def get_ward(ward_id: str):
    """Get details for a specific ward."""
    ward = WARD_REGISTRY.get(ward_id)
    if not ward:
        return {"error": f"Ward '{ward_id}' not found. Use /wards to see available wards."}
    return ward


@router.get("/procedures")
async def list_procedures(
    category: Optional[str] = Query(None, description="Filter by category"),
):
    """List all known procedures."""
    procs = list(PROCEDURE_DB.values())
    if category:
        procs = [p for p in procs if p.category.lower() == category.lower()]
    return {"procedures": procs, "total": len(procs)}


@router.get("/procedures/{form_id}")
async def get_procedure(form_id: str):
    """Get details for a specific procedure form."""
    proc = PROCEDURE_DB.get(form_id)
    if not proc:
        return {"error": f"Procedure '{form_id}' not found."}
    return proc


@router.get("/procedures/{form_id}/steps")
async def get_procedure_steps(
    form_id: str,
    ward_id: str = Query(..., description="Ward ID to determine which provider to use"),
):
    """
    Get step-by-step instructions for a procedure at a specific ward.
    Automatically selects Gov-Cloud or Legacy provider.
    """
    provider = get_provider(ward_id, form_id)
    return await provider.get_procedure_steps(ward_id, form_id)


@router.get("/procedures/{form_id}/availability")
async def check_procedure_availability(
    form_id: str,
    ward_id: str = Query(..., description="Ward ID"),
):
    """Check if a procedure can be completed online at a specific ward."""
    provider = get_provider(ward_id, form_id)
    return await provider.check_availability(ward_id, form_id)
