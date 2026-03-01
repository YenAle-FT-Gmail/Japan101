"""
PDF Form Overlay Tool
─────────────────────
Interactive tool that superimposes English text guidance over Japanese
government PDF forms. Generates annotated PDFs with:
  • Field labels in English
  • Example values
  • Zenkaku-converted text ready for copy-paste
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
# FORM FIELD DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════

# Mapping of Japanese form fields to English translations + hints
FORM_OVERLAYS: dict[str, dict] = {
    "ID-JIN-101": {
        "form_name": "Moving-In Notification (転入届)",
        "fields": [
            {
                "field_id": "f1",
                "japanese_label": "届出日",
                "english_label": "Date of Filing",
                "hint": "Today's date in Japanese format: 令和○年○月○日",
                "type": "date",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 750},
            },
            {
                "field_id": "f2",
                "japanese_label": "届出人の氏名",
                "english_label": "Applicant's Full Name",
                "hint": "FULL-WIDTH characters required (e.g., ＳＭＩＴＨ　ＪＯＨＮ)",
                "type": "text_fullwidth",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 700},
            },
            {
                "field_id": "f3",
                "japanese_label": "届出人のフリガナ",
                "english_label": "Name Reading (Katakana)",
                "hint": "Your name in full-width katakana (e.g., スミス　ジョン)",
                "type": "text_katakana",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 670},
            },
            {
                "field_id": "f4",
                "japanese_label": "生年月日",
                "english_label": "Date of Birth",
                "hint": "Use Japanese Era: 平成○年○月○日 (Heisei year)",
                "type": "date_era",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 640},
            },
            {
                "field_id": "f5",
                "japanese_label": "性別",
                "english_label": "Gender",
                "hint": "男 (Male) / 女 (Female)",
                "type": "select",
                "options": ["男", "女"],
                "required": True,
                "position": {"page": 1, "x": 120, "y": 610},
            },
            {
                "field_id": "f6",
                "japanese_label": "新住所",
                "english_label": "New Address",
                "hint": "Full address in Japanese/Full-width (prefecture → city → block → apartment)",
                "type": "text_fullwidth",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 560},
            },
            {
                "field_id": "f7",
                "japanese_label": "旧住所",
                "english_label": "Previous Address",
                "hint": "Address you are moving FROM",
                "type": "text_fullwidth",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 510},
            },
            {
                "field_id": "f8",
                "japanese_label": "転入の事由",
                "english_label": "Reason for Moving",
                "hint": "転居 (Relocation) / 転入 (Moving in from another municipality)",
                "type": "select",
                "options": ["転居", "転入", "その他"],
                "required": True,
                "position": {"page": 1, "x": 120, "y": 460},
            },
            {
                "field_id": "f9",
                "japanese_label": "世帯主の氏名",
                "english_label": "Head of Household",
                "hint": "Name of the head of household (usually YOU if living alone)",
                "type": "text_fullwidth",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 420},
            },
            {
                "field_id": "f10",
                "japanese_label": "届出人との続柄",
                "english_label": "Relationship to Head of Household",
                "hint": "本人 (Self) / 配偶者 (Spouse) / 子 (Child)",
                "type": "select",
                "options": ["本人", "配偶者", "子", "父", "母", "その他"],
                "required": True,
                "position": {"page": 1, "x": 120, "y": 390},
            },
        ],
    },
    "ID-NHI-201": {
        "form_name": "NHI Enrollment (国民健康保険加入届)",
        "fields": [
            {
                "field_id": "n1",
                "japanese_label": "届出日",
                "english_label": "Date of Filing",
                "hint": "Today's date in Japanese Era format",
                "type": "date_era",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 750},
            },
            {
                "field_id": "n2",
                "japanese_label": "届出人の氏名",
                "english_label": "Applicant's Full Name",
                "hint": "FULL-WIDTH characters",
                "type": "text_fullwidth",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 700},
            },
            {
                "field_id": "n3",
                "japanese_label": "届出人の住所",
                "english_label": "Address",
                "hint": "Current registered address in full-width",
                "type": "text_fullwidth",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 660},
            },
            {
                "field_id": "n4",
                "japanese_label": "届出人の電話番号",
                "english_label": "Phone Number",
                "hint": "Phone in full-width digits (e.g., ０３－１２３４－５６７８)",
                "type": "phone_fullwidth",
                "required": True,
                "position": {"page": 1, "x": 120, "y": 630},
            },
            {
                "field_id": "n5",
                "japanese_label": "加入の理由",
                "english_label": "Reason for Enrollment",
                "hint": "退職 (Left job) / 転入 (Moved in) / 扶養喪失 (Lost dependent status)",
                "type": "select",
                "options": ["退職", "転入", "扶養喪失", "その他"],
                "required": True,
                "position": {"page": 1, "x": 120, "y": 580},
            },
            {
                "field_id": "n6",
                "japanese_label": "以前の保険の種類",
                "english_label": "Previous Insurance Type",
                "hint": "社会保険 (Company insurance) / 国民健康保険 (NHI elsewhere) / なし (None)",
                "type": "select",
                "options": ["社会保険", "国民健康保険", "共済保険", "なし"],
                "required": True,
                "position": {"page": 1, "x": 120, "y": 540},
            },
            {
                "field_id": "n7",
                "japanese_label": "口座情報",
                "english_label": "Bank Account (for premiums)",
                "hint": "Bank name + branch + account number in HALF-WIDTH KATAKANA for name",
                "type": "banking",
                "required": False,
                "position": {"page": 1, "x": 120, "y": 480},
            },
        ],
    },
}


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class OverlayRequest(BaseModel):
    form_id: str = Field(..., description="Form ID (e.g., ID-JIN-101)")
    user_data: Optional[dict] = Field(None, description="Pre-fill with user data")
    language: str = Field("en", description="Overlay language (en)")


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/forms")
async def list_overlay_forms():
    """List all forms that have English overlay support."""
    forms = []
    for form_id, data in FORM_OVERLAYS.items():
        forms.append({
            "form_id": form_id,
            "form_name": data["form_name"],
            "field_count": len(data["fields"]),
        })
    return {"forms": forms}


@router.get("/forms/{form_id}")
async def get_form_overlay(form_id: str):
    """
    Get the English overlay data for a specific Japanese government form.
    Returns field positions, translations, and input hints.
    """
    overlay = FORM_OVERLAYS.get(form_id)
    if not overlay:
        raise HTTPException(
            status_code=404,
            detail=f"No overlay available for form '{form_id}'. See /api/pdf/forms for available forms.",
        )

    return {
        "form_id": form_id,
        **overlay,
        "instructions": [
            "Each field shows the Japanese label, English translation, and a hint.",
            "Fields marked 'text_fullwidth' require full-width (全角) characters.",
            "Use the Zenkaku Engine (/api/zenkaku) to convert your inputs.",
            "Fields marked 'date_era' require Japanese Era dates.",
            "Fields marked 'banking' require half-width katakana for the account holder name.",
        ],
        "legal_notice": (
            "This overlay is for guidance only. Always verify against the original form. "
            "Japan GOV-OS does not fill or submit forms on your behalf."
        ),
    }


@router.post("/forms/{form_id}/prefill")
async def prefill_form(form_id: str, req: OverlayRequest):
    """
    Generate pre-filled overlay data using Zenkaku conversions.
    Returns form fields with both English input and Japanese-converted values.
    """
    from app.routers.zenkaku import (
        ascii_to_fullwidth,
        western_to_japanese_era,
        romaji_to_katakana,
    )
    from datetime import date as date_type

    overlay = FORM_OVERLAYS.get(form_id)
    if not overlay:
        raise HTTPException(status_code=404, detail=f"No overlay for '{form_id}'.")

    user_data = req.user_data or {}
    filled_fields = []

    for field in overlay["fields"]:
        fid = field["field_id"]
        value = user_data.get(fid, "")

        converted = None
        if value:
            if field["type"] == "text_fullwidth":
                converted = ascii_to_fullwidth(str(value))
            elif field["type"] == "text_katakana":
                converted = romaji_to_katakana(str(value))
            elif field["type"] in ("date", "date_era"):
                try:
                    d = date_type.fromisoformat(str(value))
                    era = western_to_japanese_era(d)
                    converted = era.get("formatted", str(value))
                except (ValueError, AttributeError):
                    converted = str(value)
            elif field["type"] == "phone_fullwidth":
                converted = ascii_to_fullwidth(str(value))
            else:
                converted = str(value)

        filled_fields.append({
            **field,
            "user_input": value,
            "converted_value": converted,
        })

    return {
        "form_id": form_id,
        "form_name": overlay["form_name"],
        "fields": filled_fields,
        "note": "Review all converted values. Copy the 'converted_value' into the actual form.",
    }
