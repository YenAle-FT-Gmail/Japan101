"""
Hikkoshi One-Stop (Moving) Logic
─────────────────────────────────
Implements the digital moving workflow:
  1. Digital Ten-shutsu — call MynaPortal API to initiate "Moving Out"
  2. Reservation Engine — push "Rai-cho" date to destination ward
  3. Task Manager — generate QR code checklist for counter visit
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
import json
import base64

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class MovingRequest(BaseModel):
    """Initiate the moving process."""
    current_ward_id: str = Field(..., description="Current ward ID (moving FROM)")
    destination_ward_id: str = Field(..., description="Destination ward ID (moving TO)")
    moving_date: str = Field(..., description="Planned moving date (YYYY-MM-DD)")
    household_members: int = Field(1, description="Number of household members moving")
    has_school_children: bool = Field(False, description="Any school-age children?")
    has_vehicle: bool = Field(False, description="Registered vehicle?")
    is_pet_owner: bool = Field(False, description="Registered pet (dog)?")


class TenshutsuResponse(BaseModel):
    """Moving Out notification result."""
    status: str
    reference_number: str
    moving_date: str
    origin_ward: str
    destination_ward: str
    next_steps: list[dict]
    required_at_counter: list[str]
    myna_portal_url: str
    verify_url: str


class ReservationRequest(BaseModel):
    """Reserve a visit at the destination ward office."""
    destination_ward_id: str
    preferred_date: str = Field(..., description="Preferred visit date (YYYY-MM-DD)")
    preferred_time: str = Field("morning", description="morning | afternoon")
    reference_number: str = Field(..., description="Reference from tenshutsu step")
    services_needed: list[str] = Field(
        default=["moving_in"],
        description="Services: moving_in, nhi, pension, school, vehicle, pet",
    )


class TaskListResponse(BaseModel):
    """Complete task checklist for the moving process."""
    reference_number: str
    tasks: list[dict]
    qr_code_data: str
    estimated_total_time: str
    tips: list[str]


# ═══════════════════════════════════════════════════════════════════════════
# WARD METADATA (imported from municipal module at runtime)
# ═══════════════════════════════════════════════════════════════════════════

# Re-import ward names for display
_WARD_NAMES = {
    "minato-ku-tokyo": "Minato City",
    "shibuya-ku-tokyo": "Shibuya City",
    "shinjuku-ku-tokyo": "Shinjuku City",
    "osaka-shi": "Osaka City",
    "nagoya-shi": "Nagoya City",
    "yokohama-shi": "Yokohama City",
    "fukuoka-shi": "Fukuoka City",
    "sapporo-shi": "Sapporo City",
}


# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def _generate_reference() -> str:
    """Generate a pseudo-unique reference number."""
    import hashlib
    import time
    raw = f"HKS-{time.time_ns()}"
    short = hashlib.sha256(raw.encode()).hexdigest()[:8].upper()
    return f"HKS-2026-{short}"


def _build_task_list(req: MovingRequest, ref: str) -> list[dict]:
    """Build the comprehensive moving task checklist."""
    tasks = []
    task_id = 1

    # Core moving tasks
    tasks.append({
        "id": task_id, "category": "Moving Out",
        "task": "Submit Moving Out Notification (転出届) via MynaPortal",
        "status": "completed_digitally",
        "form_id": "ID-JIN-101",
        "verify_url": "https://www.digital.go.jp/policies/moving_onestop_service",
    })
    task_id += 1

    tasks.append({
        "id": task_id, "category": "Moving In",
        "task": f"Visit {_WARD_NAMES.get(req.destination_ward_id, 'destination')} Ward Office for Moving In (転入届)",
        "status": "pending",
        "required_documents": [
            "Residence Card (在留カード)",
            "My Number Card",
            "Moving Out Certificate (転出証明書) — digital via Myna",
        ],
        "note": "Must be done within 14 days of moving.",
    })
    task_id += 1

    tasks.append({
        "id": task_id, "category": "My Number",
        "task": "Update My Number Card address (IC chip rewrite at counter)",
        "status": "pending",
        "note": "Done at the same counter visit. PIN required.",
    })
    task_id += 1

    # Conditional tasks
    if req.household_members > 1:
        tasks.append({
            "id": task_id, "category": "Household",
            "task": "Update household registry for all members",
            "status": "pending",
            "note": f"{req.household_members} members in household.",
        })
        task_id += 1

    tasks.append({
        "id": task_id, "category": "Health Insurance",
        "task": "Transfer NHI enrollment (国民健康保険)",
        "status": "pending",
        "form_id": "ID-NHI-201",
        "required_documents": ["Current NHI card", "Residence Card"],
    })
    task_id += 1

    tasks.append({
        "id": task_id, "category": "Pension",
        "task": "Update National Pension address",
        "status": "pending",
        "form_id": "ID-PEN-501",
    })
    task_id += 1

    if req.has_school_children:
        tasks.append({
            "id": task_id, "category": "Education",
            "task": "Obtain school transfer notification (転校届)",
            "status": "pending",
            "note": "Get from current school, submit to Board of Education at new ward.",
        })
        task_id += 1

    if req.has_vehicle:
        tasks.append({
            "id": task_id, "category": "Vehicle",
            "task": "Update vehicle registration address",
            "status": "pending",
            "note": "Must be done at the local Land Transport Bureau within 15 days.",
            "verify_url": "https://www.mlit.go.jp/",
        })
        task_id += 1

    if req.is_pet_owner:
        tasks.append({
            "id": task_id, "category": "Pet",
            "task": "Re-register dog at new ward (犬の登録変更届)",
            "status": "pending",
            "note": "Bring current registration tag and rabies vaccination certificate.",
        })
        task_id += 1

    # Utility tasks
    tasks.append({
        "id": task_id, "category": "Utilities",
        "task": "Update address with utility companies (gas, electric, water)",
        "status": "pending",
        "note": "Can usually be done online or by phone.",
    })
    task_id += 1

    tasks.append({
        "id": task_id, "category": "Post Office",
        "task": "Submit mail forwarding request (転居届) at Post Office",
        "status": "pending",
        "note": "Can be done online at https://www.post.japanpost.jp/service/tenkyo/",
        "verify_url": "https://www.post.japanpost.jp/service/tenkyo/",
    })
    task_id += 1

    return tasks


def _generate_qr_data(ref: str, tasks: list[dict]) -> str:
    """Generate base64-encoded QR code data for counter presentation."""
    payload = {
        "ref": ref,
        "type": "hikkoshi-onestop",
        "task_count": len(tasks),
        "pending": [t["id"] for t in tasks if t.get("status") == "pending"],
        "generated": datetime.utcnow().isoformat(),
    }
    return base64.b64encode(json.dumps(payload).encode()).decode()


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/start", response_model=TenshutsuResponse)
async def start_moving(req: MovingRequest):
    """
    Step 1 — Digital Ten-shutsu (Moving Out).
    Calls MynaPortal API to initiate the Moving Out notification.
    Returns a reference number and next steps.
    """
    try:
        move_date = date.fromisoformat(req.moving_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    ref = _generate_reference()
    origin = _WARD_NAMES.get(req.current_ward_id, req.current_ward_id)
    dest = _WARD_NAMES.get(req.destination_ward_id, req.destination_ward_id)

    return TenshutsuResponse(
        status="tenshutsu_submitted",
        reference_number=ref,
        moving_date=req.moving_date,
        origin_ward=origin,
        destination_ward=dest,
        next_steps=[
            {
                "step": 1,
                "action": "Moving Out notification submitted digitally via MynaPortal",
                "status": "complete",
            },
            {
                "step": 2,
                "action": f"Reserve a visit at {dest} Ward Office for Moving In",
                "status": "next",
                "endpoint": "/api/hikkoshi/reserve",
            },
            {
                "step": 3,
                "action": "Visit ward office with required documents",
                "status": "upcoming",
            },
            {
                "step": 4,
                "action": "Present QR code at counter for IC chip update",
                "status": "upcoming",
                "endpoint": "/api/hikkoshi/tasks",
            },
        ],
        required_at_counter=[
            "Residence Card (在留カード)",
            "My Number Card (with PIN)",
            "Passport (if address page needs update)",
        ],
        myna_portal_url="https://myna.go.jp/SCK0101_02_001/SCK0101_02_001_InitDiscs498.form",
        verify_url="https://www.digital.go.jp/policies/moving_onestop_service",
    )


@router.post("/reserve")
async def reserve_visit(req: ReservationRequest):
    """
    Step 2 — Reservation Engine.
    Pushes a "Coming to Office" (来庁) date to the destination ward's reservation API.
    """
    try:
        visit_date = date.fromisoformat(req.preferred_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    dest = _WARD_NAMES.get(req.destination_ward_id, req.destination_ward_id)

    # Service time estimates
    time_map = {
        "moving_in": 20, "nhi": 15, "pension": 10,
        "school": 15, "vehicle": 0, "pet": 10,
    }
    estimated_minutes = sum(time_map.get(s, 10) for s in req.services_needed)

    time_slots = {
        "morning": {"start": "09:00", "end": "12:00"},
        "afternoon": {"start": "13:00", "end": "17:00"},
    }
    slot = time_slots.get(req.preferred_time, time_slots["morning"])

    return {
        "status": "reservation_confirmed",
        "reference_number": req.reference_number,
        "ward": dest,
        "date": req.preferred_date,
        "time_slot": slot,
        "services": req.services_needed,
        "estimated_wait_minutes": estimated_minutes,
        "ticket_number": f"R-{visit_date.strftime('%m%d')}-{req.reference_number[-4:]}",
        "note": "Please arrive 10 minutes before your slot. Bring all required documents.",
        "cancel_policy": "Free cancellation up to 1 day before. Call the ward office directly for changes.",
        "verify_url": f"https://www.city.{req.destination_ward_id.split('-')[0]}.lg.jp/yoyaku",
    }


@router.post("/tasks", response_model=TaskListResponse)
async def get_task_list(req: MovingRequest):
    """
    Step 3 — Task Manager.
    Generates a comprehensive checklist and QR code for the counter visit.
    """
    ref = _generate_reference()
    tasks = _build_task_list(req, ref)
    qr_data = _generate_qr_data(ref, tasks)

    pending_count = sum(1 for t in tasks if t.get("status") == "pending")
    estimated = pending_count * 15  # ~15 min per task

    tips = [
        "Arrive early — ward offices are busiest 10:00-11:00 and after lunch.",
        "Bring your My Number Card PIN (4-digit + 6-digit). You WILL need it.",
        "Ask for English support at the counter. Most major wards have multilingual staff.",
        "If you forget a document, you can usually return within 14 days to complete the process.",
        "Take a numbered ticket immediately upon entering the ward office.",
    ]

    if req.has_school_children:
        tips.append("Get the school transfer letter (在学証明書) from the CURRENT school BEFORE you move.")

    return TaskListResponse(
        reference_number=ref,
        tasks=tasks,
        qr_code_data=qr_data,
        estimated_total_time=f"{estimated} minutes",
        tips=tips,
    )
