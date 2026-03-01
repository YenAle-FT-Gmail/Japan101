"""
Global Search — Natural Language to Procedure Mapping
─────────────────────────────────────────────────────
Maps user queries in English to the correct Japanese administrative procedure.
Uses keyword matching + fuzzy matching for MVP.
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
# SEARCH INDEX — Keyword → Procedure mapping
# ═══════════════════════════════════════════════════════════════════════════

SEARCH_INDEX: list[dict] = [
    {
        "form_id": "ID-JIN-101",
        "title": "Moving / Change of Address",
        "title_ja": "転入届・転出届",
        "keywords": [
            "move", "moving", "relocate", "relocation", "address change",
            "transfer", "new apartment", "new house", "hikkoshi",
            "tenshutsu", "tennyu", "change address", "moved",
        ],
        "category": "Residency",
        "description": "File a moving notification when changing your address within or between municipalities.",
        "logic_flow": "hikkoshi",
        "url": "/procedures/moving",
        "gov_url": "https://www.digital.go.jp/policies/moving_onestop_service",
    },
    {
        "form_id": "ID-NHI-201",
        "title": "National Health Insurance (NHI) Enrollment",
        "title_ja": "国民健康保険加入届",
        "keywords": [
            "health insurance", "nhi", "kokumin kenko hoken",
            "medical insurance", "doctor", "hospital", "clinic",
            "left job", "quit job", "freelancer", "self-employed",
            "no insurance", "insurance card",
        ],
        "category": "Health Insurance",
        "description": "Enroll in NHI if you're self-employed, freelance, or between jobs.",
        "logic_flow": None,
        "url": "/procedures/nhi",
        "gov_url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryouhoken/",
    },
    {
        "form_id": "ID-TAX-301",
        "title": "Tax Return (Kakutei Shinkoku)",
        "title_ja": "確定申告",
        "keywords": [
            "tax", "tax return", "kakutei shinkoku", "income tax",
            "file taxes", "e-tax", "tax refund", "freelance tax",
            "deductions", "furusato nozei", "hometown tax",
            "invoice", "consumption tax",
        ],
        "category": "Tax",
        "description": "File your annual income tax return. Includes invoice system and Furusato Nozei support.",
        "logic_flow": "tax",
        "url": "/procedures/tax",
        "gov_url": "https://www.e-tax.nta.go.jp",
    },
    {
        "form_id": "ID-VISA-401",
        "title": "Visa Extension / Status Change",
        "title_ja": "在留期間更新許可申請",
        "keywords": [
            "visa", "visa extension", "visa renewal", "residence card",
            "zairyu card", "immigration", "isa", "status change",
            "work permit", "permanent residence", "PR", "highly skilled",
            "spouse visa", "business manager", "engineer visa",
        ],
        "category": "Immigration",
        "description": "Extend your visa, change status, or apply for permanent residence.",
        "logic_flow": "visa",
        "url": "/procedures/visa",
        "gov_url": "https://www.isa.go.jp/en/applications/procedures/16-2.html",
    },
    {
        "form_id": "ID-PEN-501",
        "title": "National Pension (Kokumin Nenkin)",
        "title_ja": "国民年金加入届",
        "keywords": [
            "pension", "nenkin", "kokumin nenkin", "national pension",
            "retirement", "social security", "pension book",
            "pension number", "pension exemption",
        ],
        "category": "Pension",
        "description": "Enroll in or manage your National Pension. Required for residents aged 20-59.",
        "logic_flow": None,
        "url": "/procedures/pension",
        "gov_url": "https://www.nenkin.go.jp/",
    },
    {
        "form_id": "ID-MYNUMBER-601",
        "title": "My Number Card",
        "title_ja": "マイナンバーカード",
        "keywords": [
            "my number", "mynumber", "myna", "individual number",
            "card application", "my number card", "notification card",
            "social security number", "tax number",
        ],
        "category": "Identity",
        "description": "Apply for, replace, or update your My Number Card.",
        "logic_flow": None,
        "url": "/procedures/mynumber",
        "gov_url": "https://www.kojinbango-card.go.jp/en/",
    },
    {
        "form_id": "ID-BANK-701",
        "title": "Bank Account Opening",
        "title_ja": "銀行口座開設",
        "keywords": [
            "bank", "bank account", "open account", "banking",
            "ATM", "transfer", "remittance", "send money",
        ],
        "category": "Banking",
        "description": "Guidance for opening a bank account as a foreign resident.",
        "logic_flow": None,
        "url": "/procedures/banking",
        "gov_url": "https://www.fsa.go.jp/en/",
    },
    {
        "form_id": "ID-BIRTH-801",
        "title": "Birth Registration",
        "title_ja": "出生届",
        "keywords": [
            "birth", "baby", "newborn", "birth certificate",
            "birth registration", "maternity", "child",
        ],
        "category": "Family",
        "description": "Register a birth within 14 days. Required for all births in Japan.",
        "logic_flow": None,
        "url": "/procedures/birth",
        "gov_url": "https://www.moj.go.jp/MINJI/minji04_00034.html",
    },
]


# ═══════════════════════════════════════════════════════════════════════════
# SEARCH LOGIC
# ═══════════════════════════════════════════════════════════════════════════

def _score_result(query_lower: str, entry: dict) -> float:
    """Score a search result against a query. Higher = better match."""
    score = 0.0
    words = query_lower.split()

    # Exact keyword match (highest weight)
    for kw in entry.get("keywords", []):
        if kw in query_lower:
            score += 10.0
        for word in words:
            if word in kw or kw.startswith(word):
                score += 3.0

    # Title match
    title_lower = entry.get("title", "").lower()
    for word in words:
        if word in title_lower:
            score += 5.0

    # Category match
    cat_lower = entry.get("category", "").lower()
    for word in words:
        if word in cat_lower:
            score += 2.0

    # Description match
    desc_lower = entry.get("description", "").lower()
    for word in words:
        if word in desc_lower:
            score += 1.0

    return score


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class SearchResult(BaseModel):
    form_id: str
    title: str
    title_ja: str
    category: str
    description: str
    relevance_score: float
    url: str
    gov_url: str
    logic_flow: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/")
async def global_search(
    q: str = Query(..., min_length=1, description="Natural language search query"),
    limit: int = Query(5, ge=1, le=20, description="Max results"),
):
    """
    Global Search — Maps natural language English queries to Japanese procedures.
    Example: "I just moved to Shibuya" → Moving Notification (転入届)
    """
    query_lower = q.strip().lower()

    scored = []
    for entry in SEARCH_INDEX:
        score = _score_result(query_lower, entry)
        if score > 0:
            scored.append(SearchResult(
                form_id=entry["form_id"],
                title=entry["title"],
                title_ja=entry["title_ja"],
                category=entry["category"],
                description=entry["description"],
                relevance_score=round(score, 1),
                url=entry["url"],
                gov_url=entry["gov_url"],
                logic_flow=entry.get("logic_flow"),
            ))

    scored.sort(key=lambda x: x.relevance_score, reverse=True)
    results = scored[:limit]

    return {
        "query": q,
        "results": results,
        "total_matches": len(scored),
        "suggestion": results[0].title if results else "No matching procedures found. Try different keywords.",
    }


@router.get("/categories")
async def list_search_categories():
    """List all available procedure categories."""
    categories = set()
    for entry in SEARCH_INDEX:
        categories.add(entry["category"])
    return {"categories": sorted(categories)}


@router.get("/all")
async def list_all_procedures():
    """List all indexed procedures."""
    return {
        "procedures": [
            {
                "form_id": e["form_id"],
                "title": e["title"],
                "title_ja": e["title_ja"],
                "category": e["category"],
                "description": e["description"],
                "url": e["url"],
                "gov_url": e["gov_url"],
            }
            for e in SEARCH_INDEX
        ],
        "total": len(SEARCH_INDEX),
    }
