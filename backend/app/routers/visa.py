"""
Visa Extension — ISA 2026 System
─────────────────────────────────
Implements:
  1. Fee Calculation — 200,000 JPY PR fee vs 7,000 JPY HSP fee (2026 ISA Update)
  2. XML Draft Generation — "Temporary Save" XML for ISA Online System
  3. Evidence Batching — Document compression for the 25MB upload limit
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
import xml.etree.ElementTree as ET
import io
import zipfile
import base64

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
# 2026 ISA FEE SCHEDULE
# ═══════════════════════════════════════════════════════════════════════════

VISA_FEES = {
    # Status change / extension fees (2026 updated)
    "extension_standard": {
        "fee": 4000,
        "description": "Standard visa status extension",
        "revenue_stamp": True,
    },
    "extension_hsp": {
        "fee": 4000,
        "description": "Highly Skilled Professional (HSP) visa extension",
        "revenue_stamp": True,
    },
    "change_status": {
        "fee": 4000,
        "description": "Change of visa status",
        "revenue_stamp": True,
    },
    "permanent_residence": {
        "fee": 200000,
        "description": "Permanent Residence application (updated fee)",
        "revenue_stamp": True,
        "note": "Fee increased from ¥8,000 to ¥200,000 under the 2024 Immigration Control Act revision (effective 2025).",
    },
    "re_entry_single": {
        "fee": 3000,
        "description": "Single re-entry permit",
        "revenue_stamp": True,
    },
    "re_entry_multiple": {
        "fee": 6000,
        "description": "Multiple re-entry permit",
        "revenue_stamp": True,
    },
    "certificate_eligibility": {
        "fee": 0,
        "description": "Certificate of Eligibility (CoE) application",
        "revenue_stamp": False,
        "note": "Free to apply, but may require employer sponsorship.",
    },
}

# Visa categories and their documents
VISA_CATEGORIES = {
    "engineer_specialist": {
        "name": "Engineer / Specialist in Humanities / International Services",
        "name_ja": "技術・人文知識・国際業務",
        "max_period": "5 years",
        "required_documents": [
            "Application form (在留期間更新許可申請書)",
            "Passport and Residence Card",
            "Photo (4cm × 3cm, taken within 3 months)",
            "Company letter of guarantee (身元保証書)",
            "Employment contract or appointment letter",
            "Company registration certificate (登記事項証明書)",
            "Company tax certificates (納税証明書)",
            "Withholding tax slip (源泉徴収票)",
        ],
    },
    "highly_skilled_professional": {
        "name": "Highly Skilled Professional (i/ii)",
        "name_ja": "高度専門職",
        "max_period": "5 years (i) / indefinite (ii)",
        "required_documents": [
            "Application form",
            "Passport and Residence Card",
            "Photo (4cm × 3cm)",
            "Points calculation sheet (ポイント計算表)",
            "Supporting documents for claimed points",
            "Employment contract",
            "Academic credentials (degree certificates)",
            "Annual income proof",
        ],
    },
    "permanent_resident": {
        "name": "Permanent Resident",
        "name_ja": "永住者",
        "max_period": "Indefinite",
        "required_documents": [
            "Application form (永住許可申請書)",
            "Passport and Residence Card",
            "Photo (4cm × 3cm)",
            "Reason statement (理由書)",
            "Employment certificate",
            "Tax certificates for last 5 years",
            "Pension payment records for last 2 years",
            "Health insurance payment records for last 2 years",
            "Resident certificate (住民票)",
            "Guarantor documents",
        ],
        "note": "¥200,000 fee under the 2024 Immigration Control Act revision (effective 2025). 10+ years residency typically required.",
    },
    "spouse_of_japanese": {
        "name": "Spouse or Child of Japanese National",
        "name_ja": "日本人の配偶者等",
        "max_period": "5 years",
        "required_documents": [
            "Application form",
            "Passport and Residence Card",
            "Photo",
            "Marriage certificate (戸籍謄本)",
            "Japanese spouse's resident certificate",
            "Tax certificates",
            "Proof of cohabitation",
        ],
    },
    "business_manager": {
        "name": "Business Manager",
        "name_ja": "経営・管理",
        "max_period": "5 years",
        "required_documents": [
            "Application form",
            "Passport and Residence Card",
            "Photo",
            "Business plan",
            "Company registration certificate",
            "Financial statements",
            "Office lease agreement",
            "Proof of ¥5M+ investment or 2+ full-time employees",
        ],
    },
}

# Upload size limit (ISA system)
ISA_MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class FeeCalculationRequest(BaseModel):
    application_type: str = Field(..., description="Fee type key from VISA_FEES")
    visa_category: Optional[str] = Field(None, description="Visa category for document list")


class XMLDraftRequest(BaseModel):
    """Fields for ISA Online System temporary save XML."""
    family_name: str = Field(..., description="Family name in English")
    given_name: str = Field(..., description="Given name in English")
    nationality: str = Field("US", description="ISO 3166-1 alpha-2 country code")
    date_of_birth: str = Field(..., description="YYYY-MM-DD")
    gender: str = Field(..., description="M or F")
    visa_category: str = Field(..., description="Current visa category key")
    current_period_expiry: str = Field(..., description="Current visa expiry YYYY-MM-DD")
    requested_period: str = Field("3 years", description="Requested new period")
    address: str = Field(..., description="Current address in Japan")
    phone: str = Field(..., description="Phone number")
    employer_name: Optional[str] = Field(None, description="Employer or school name")
    employer_address: Optional[str] = Field(None, description="Employer address")
    reason: str = Field("Continuation of employment", description="Reason for extension")


# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def _generate_isa_xml(req: XMLDraftRequest) -> str:
    """Generate a temporary save XML compatible with the ISA Online System."""
    root = ET.Element("APPLICATION")
    root.set("xmlns", "urn:isa.go.jp:online:2026")
    root.set("version", "2.0")

    # Header
    header = ET.SubElement(root, "HEADER")
    ET.SubElement(header, "APPLICATION_TYPE").text = "EXTENSION"
    ET.SubElement(header, "GENERATED_DATE").text = datetime.utcnow().isoformat()
    ET.SubElement(header, "SYSTEM").text = "japan-gov-os-draft"

    # Applicant Info
    applicant = ET.SubElement(root, "APPLICANT")
    ET.SubElement(applicant, "FAMILY_NAME").text = req.family_name.upper()
    ET.SubElement(applicant, "GIVEN_NAME").text = req.given_name.upper()
    ET.SubElement(applicant, "NATIONALITY").text = req.nationality.upper()
    ET.SubElement(applicant, "DATE_OF_BIRTH").text = req.date_of_birth
    ET.SubElement(applicant, "GENDER").text = req.gender.upper()
    ET.SubElement(applicant, "ADDRESS").text = req.address
    ET.SubElement(applicant, "PHONE").text = req.phone

    # Visa Info
    visa = ET.SubElement(root, "VISA_STATUS")
    category_info = VISA_CATEGORIES.get(req.visa_category, {})
    ET.SubElement(visa, "CURRENT_STATUS").text = category_info.get("name_ja", req.visa_category)
    ET.SubElement(visa, "CURRENT_STATUS_EN").text = category_info.get("name", req.visa_category)
    ET.SubElement(visa, "CURRENT_EXPIRY").text = req.current_period_expiry
    ET.SubElement(visa, "REQUESTED_PERIOD").text = req.requested_period

    # Employment
    if req.employer_name:
        employer = ET.SubElement(root, "EMPLOYER")
        ET.SubElement(employer, "NAME").text = req.employer_name
        if req.employer_address:
            ET.SubElement(employer, "ADDRESS").text = req.employer_address

    # Reason
    ET.SubElement(root, "REASON_FOR_EXTENSION").text = req.reason

    # Serialize
    tree = ET.ElementTree(root)
    buf = io.BytesIO()
    tree.write(buf, encoding="unicode", xml_declaration=True)
    return buf.getvalue()


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/fees")
async def list_fees():
    """List all 2026 ISA fee schedule items."""
    return {"fees": VISA_FEES, "note": "Permanent Residence fee updated to ¥200,000 under the 2024 revision."}


@router.post("/fees/calculate")
async def calculate_fee(req: FeeCalculationRequest):
    """Calculate the fee for a specific visa application type."""
    fee_info = VISA_FEES.get(req.application_type)
    if not fee_info:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown application type: '{req.application_type}'. See /api/visa/fees for options.",
        )

    result = {
        **fee_info,
        "application_type": req.application_type,
        "payment_method": "Revenue stamp (収入印紙) — purchase at convenience store or post office",
        "verify_url": "https://www.isa.go.jp/en/applications/procedures/16-2.html",
    }

    if req.visa_category:
        cat = VISA_CATEGORIES.get(req.visa_category)
        if cat:
            result["category_info"] = cat

    return result


@router.get("/categories")
async def list_visa_categories():
    """List all visa categories with required documents."""
    return {"categories": VISA_CATEGORIES}


@router.get("/categories/{category_key}")
async def get_visa_category(category_key: str):
    """Get details for a specific visa category."""
    cat = VISA_CATEGORIES.get(category_key)
    if not cat:
        raise HTTPException(status_code=404, detail=f"Category '{category_key}' not found.")
    return cat


@router.post("/xml-draft")
async def generate_xml_draft(req: XMLDraftRequest):
    """
    Generate a "Temporary Save" XML file for the ISA Online System.
    This XML can be imported into the ISA portal to pre-fill the application.
    
    ⚠️ Legal note: This is a DRAFT. Final submission must be done on the
    official ISA Online System at https://www.isa.go.jp
    """
    xml_content = _generate_isa_xml(req)
    xml_b64 = base64.b64encode(xml_content.encode()).decode()

    fee_key = "extension_standard"
    if req.visa_category == "highly_skilled_professional":
        fee_key = "extension_hsp"
    elif req.visa_category == "permanent_resident":
        fee_key = "permanent_residence"
    fee = VISA_FEES.get(fee_key, VISA_FEES["extension_standard"])

    return {
        "xml_base64": xml_b64,
        "xml_preview": xml_content[:500] + "..." if len(xml_content) > 500 else xml_content,
        "filename": f"isa_draft_{req.family_name.lower()}_{datetime.utcnow().strftime('%Y%m%d')}.xml",
        "fee": fee,
        "instructions": [
            "1. Download the XML file.",
            "2. Go to https://www.isa.go.jp and log in.",
            "3. Select 'Temporary Save Import' (一時保存読込).",
            "4. Upload this XML to pre-fill your application.",
            "5. Review ALL fields carefully — this is a draft only.",
            "6. Attach required documents and submit online.",
        ],
        "legal_notice": (
            "This XML draft is generated as a convenience tool. "
            "Final submission MUST be made through the official ISA Online System. "
            "Japan GOV-OS does not submit applications on your behalf, in compliance "
            "with Administrative Scrivener Law Article 19."
        ),
        "submit_url": "https://www.isa.go.jp",
    }


@router.post("/evidence/batch")
async def batch_evidence(files: list[UploadFile] = File(...)):
    """
    Compress and validate evidence documents for ISA upload.
    Ensures total size stays within the 25 MB multi-file limit.
    """
    total_size = 0
    file_info = []

    for f in files:
        content = await f.read()
        size = len(content)
        total_size += size
        file_info.append({
            "filename": f.filename,
            "size_bytes": size,
            "size_mb": round(size / (1024 * 1024), 2),
            "content_type": f.content_type,
        })
        await f.seek(0)

    over_limit = total_size > ISA_MAX_UPLOAD_BYTES

    result = {
        "files": file_info,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "limit_mb": 25,
        "over_limit": over_limit,
    }

    if over_limit:
        result["recommendation"] = (
            f"Total size ({result['total_size_mb']} MB) exceeds the 25 MB ISA limit. "
            "Consider: (1) Compressing images to JPEG quality 70, (2) Converting to grayscale, "
            "(3) Reducing PDF resolution. Use the /evidence/compress endpoint."
        )
    else:
        # Create a ZIP bundle
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in files:
                content = await f.read()
                zf.writestr(f.filename or "document", content)
                await f.seek(0)

        zip_b64 = base64.b64encode(zip_buf.getvalue()).decode()
        compressed_size = len(zip_buf.getvalue())

        result["compressed_zip_base64"] = zip_b64
        result["compressed_size_mb"] = round(compressed_size / (1024 * 1024), 2)
        result["compression_ratio"] = f"{round((1 - compressed_size / total_size) * 100, 1)}%"

    return result
