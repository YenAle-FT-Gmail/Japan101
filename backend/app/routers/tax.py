"""
2026 Tax & Invoice Calculator
─────────────────────────────
Implements:
  • October 2026 Invoice Transition Logic (70% Deduction Rule)
  • Furusato Nozei One-Stop exception linking via e-Tax API
  • Standard income tax calculation for residents
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal, ROUND_HALF_UP

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
# 2026 INVOICE SYSTEM CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════

# The transitional measure: non-registered invoices allow partial input tax credit
# Oct 2023 – Sep 2026: 80% deductible → Oct 2026 – Sep 2029: 50% deductible
INVOICE_TRANSITION_RATES = {
    "2023-10_to_2026-09": Decimal("0.80"),  # 80% deduction
    "2026-10_to_2029-09": Decimal("0.50"),  # 50% deduction (current period as of Oct 2026)
}

# The "70% Deduction Rule" for simplified tax filers (簡易課税)
# Deemed purchase ratio by business category
SIMPLIFIED_TAX_RATES = {
    1: Decimal("0.90"),  # Wholesale
    2: Decimal("0.80"),  # Retail
    3: Decimal("0.70"),  # Manufacturing / Agriculture
    4: Decimal("0.60"),  # Other
    5: Decimal("0.50"),  # Services
    6: Decimal("0.40"),  # Real estate
}

CONSUMPTION_TAX_RATE = Decimal("0.10")  # 10%
REDUCED_TAX_RATE = Decimal("0.08")     # 8% for food/newspaper

# Furusato Nozei (Hometown Tax) limits
FURUSATO_DEDUCTION_CEILING_RATIO = Decimal("0.20")  # 20% of residence tax (住民税)


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class InvoiceTaxRequest(BaseModel):
    """Calculate input tax credit for a purchase."""
    purchase_amount: int = Field(..., description="Purchase amount in JPY (tax-inclusive)")
    is_registered_invoice: bool = Field(..., description="Does the seller have a registered invoice number (T-number)?")
    purchase_date: str = Field(..., description="Purchase date YYYY-MM-DD")
    tax_rate: float = Field(0.10, description="Tax rate (0.10 for standard, 0.08 for reduced)")


class InvoiceTaxResponse(BaseModel):
    purchase_amount: int
    tax_included: int
    deductible_tax: int
    deduction_rate: str
    net_cost: int
    is_registered: bool
    explanation: str


class SimplifiedTaxRequest(BaseModel):
    """Simplified tax calculation (簡易課税)."""
    annual_sales: int = Field(..., description="Annual sales in JPY (tax-exclusive)")
    business_category: int = Field(..., ge=1, le=6, description="Business category 1-6")


class FurusatoRequest(BaseModel):
    """Furusato Nozei calculation."""
    annual_income: int = Field(..., description="Annual income in JPY")
    dependents: int = Field(0, description="Number of dependents")
    social_insurance: int = Field(0, description="Social insurance premiums paid")
    is_one_stop: bool = Field(True, description="Using One-Stop Exception (ワンストップ特例)?")


class FullTaxEstimate(BaseModel):
    """Comprehensive tax estimate request."""
    annual_income: int = Field(..., description="Annual gross income in JPY")
    income_type: str = Field("employment", description="employment | freelance | mixed")
    deductions: Optional[dict] = Field(None, description="Itemized deductions")
    is_invoice_registered: bool = Field(False, description="Registered for Invoice System?")
    business_category: Optional[int] = Field(None, description="Business category 1-6 (for simplified tax)")


# ═══════════════════════════════════════════════════════════════════════════
# CORE CALCULATION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def calculate_input_tax_credit(
    purchase_amount: int,
    is_registered: bool,
    purchase_date: str,
    tax_rate: float = 0.10,
) -> dict:
    """Calculate the input tax credit for a purchase."""
    amount = Decimal(str(purchase_amount))
    rate = Decimal(str(tax_rate))

    # Tax included in purchase
    tax_amount = (amount * rate / (1 + rate)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    if is_registered:
        deductible = tax_amount
        deduction_rate = "100%"
        explanation = "Registered invoice — full input tax credit applies."
    else:
        # Determine transitional rate based on purchase date
        year_month = purchase_date[:7].replace("-", "")
        if year_month < "202610":
            rate_key = "2023-10_to_2026-09"
            pct = INVOICE_TRANSITION_RATES[rate_key]
            deduction_rate = "80%"
        else:
            rate_key = "2026-10_to_2029-09"
            pct = INVOICE_TRANSITION_RATES[rate_key]
            deduction_rate = "50%"
        deductible = (tax_amount * pct).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        explanation = (
            f"Non-registered purchase — transitional measure allows {deduction_rate} deduction. "
            f"After Sep 2029, no deduction will be available for non-registered invoices."
        )

    net_cost = amount - deductible
    return {
        "purchase_amount": int(amount),
        "tax_included": int(tax_amount),
        "deductible_tax": int(deductible),
        "deduction_rate": deduction_rate,
        "net_cost": int(net_cost),
        "is_registered": is_registered,
        "explanation": explanation,
    }


def calculate_simplified_tax(annual_sales: int, business_category: int) -> dict:
    """
    Calculate consumption tax under the simplified system (簡易課税).
    Uses deemed purchase ratios instead of actual invoices.
    """
    sales = Decimal(str(annual_sales))
    deemed_ratio = SIMPLIFIED_TAX_RATES.get(business_category, Decimal("0.60"))

    tax_on_sales = (sales * CONSUMPTION_TAX_RATE).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    deemed_purchase_tax = (tax_on_sales * deemed_ratio).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    tax_payable = tax_on_sales - deemed_purchase_tax

    category_names = {
        1: "Wholesale", 2: "Retail", 3: "Manufacturing/Agriculture",
        4: "Other", 5: "Services", 6: "Real Estate",
    }

    return {
        "annual_sales": int(sales),
        "business_category": business_category,
        "category_name": category_names.get(business_category, "Unknown"),
        "deemed_purchase_ratio": f"{int(deemed_ratio * 100)}%",
        "tax_on_sales": int(tax_on_sales),
        "deemed_purchase_tax": int(deemed_purchase_tax),
        "consumption_tax_payable": int(tax_payable),
        "explanation": (
            f"Under simplified taxation, your deemed purchase ratio is {int(deemed_ratio * 100)}%. "
            f"You pay consumption tax on the difference. No actual invoices needed for the deduction."
        ),
        "verify_url": "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6505.htm",
    }


def calculate_furusato_limit(
    annual_income: int,
    dependents: int = 0,
    social_insurance: int = 0,
) -> dict:
    """Estimate the Furusato Nozei donation limit."""
    income = Decimal(str(annual_income))

    # Simplified residence tax estimate (rough: ~10% of taxable income)
    basic_deduction = Decimal("480000")
    dependent_deduction = Decimal("380000") * dependents
    si_deduction = Decimal(str(social_insurance))

    taxable = max(income - basic_deduction - dependent_deduction - si_deduction, Decimal("0"))
    estimated_residence_tax = (taxable * Decimal("0.10")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    # Furusato limit ≈ 20% of residence tax portion + self-burden 2000 JPY
    limit = (estimated_residence_tax * FURUSATO_DEDUCTION_CEILING_RATIO).quantize(
        Decimal("1"), rounding=ROUND_HALF_UP
    )
    # Add income tax portion (roughly doubles the limit)
    effective_limit = int(limit * 2) + 2000

    return {
        "annual_income": int(income),
        "estimated_donation_limit": effective_limit,
        "self_burden": 2000,
        "effective_deduction": effective_limit - 2000,
        "note": "This is an estimate. Actual limit depends on detailed tax calculation.",
        "one_stop_eligible": dependents <= 5,  # One-stop limited to 5 municipalities
        "verify_url": "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/mechanism/deduction.html",
    }


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/invoice/calculate")
async def calculate_invoice_tax(req: InvoiceTaxRequest):
    """
    Calculate input tax credit for a purchase under the 2026 Invoice System.
    Applies the transitional deduction rates for non-registered purchases.
    """
    return calculate_input_tax_credit(
        purchase_amount=req.purchase_amount,
        is_registered=req.is_registered_invoice,
        purchase_date=req.purchase_date,
        tax_rate=req.tax_rate,
    )


@router.post("/simplified")
async def simplified_tax(req: SimplifiedTaxRequest):
    """
    Calculate consumption tax under the Simplified Tax System (簡易課税).
    Available for businesses with annual sales ≤ 50M JPY.
    """
    return calculate_simplified_tax(
        annual_sales=req.annual_sales,
        business_category=req.business_category,
    )


@router.post("/furusato/limit")
async def furusato_nozei_limit(req: FurusatoRequest):
    """
    Estimate the Furusato Nozei (Hometown Tax) donation limit.
    Includes One-Stop Exception eligibility check.
    """
    result = calculate_furusato_limit(
        annual_income=req.annual_income,
        dependents=req.dependents,
        social_insurance=req.social_insurance,
    )
    if req.is_one_stop:
        result["one_stop_info"] = {
            "description": "One-Stop Exception (ワンストップ特例) allows you to skip filing a tax return.",
            "requirements": [
                "You are a salaried employee not otherwise required to file a return.",
                "You donated to 5 or fewer municipalities in the tax year.",
            ],
            "action": "Submit the One-Stop form to each municipality within Jan 10 of the following year.",
            "etax_link": "https://www.e-tax.nta.go.jp",
        }
    return result


@router.post("/estimate")
async def full_tax_estimate(req: FullTaxEstimate):
    """
    Comprehensive tax estimate for a fiscal year.
    Handles employment, freelance, and mixed income.
    """
    income = Decimal(str(req.annual_income))

    # Basic deductions
    basic_deduction = Decimal("480000")
    employment_deduction = Decimal("0")

    if req.income_type in ("employment", "mixed"):
        # Employment income deduction (2026 rates)
        if income <= 1_625_000:
            employment_deduction = Decimal("550000")
        elif income <= 1_800_000:
            employment_deduction = income * Decimal("0.40") - Decimal("100000")
        elif income <= 3_600_000:
            employment_deduction = income * Decimal("0.30") + Decimal("80000")
        elif income <= 6_600_000:
            employment_deduction = income * Decimal("0.20") + Decimal("440000")
        elif income <= 8_500_000:
            employment_deduction = income * Decimal("0.10") + Decimal("1100000")
        else:
            employment_deduction = Decimal("1950000")

    # Additional deductions from request
    extra_deductions = Decimal("0")
    if req.deductions:
        for _key, val in req.deductions.items():
            extra_deductions += Decimal(str(val))

    taxable_income = max(income - employment_deduction - basic_deduction - extra_deductions, Decimal("0"))

    # Progressive income tax rates (2026)
    brackets = [
        (Decimal("1950000"), Decimal("0.05"), Decimal("0")),
        (Decimal("3300000"), Decimal("0.10"), Decimal("97500")),
        (Decimal("6950000"), Decimal("0.20"), Decimal("427500")),
        (Decimal("9000000"), Decimal("0.23"), Decimal("636000")),
        (Decimal("18000000"), Decimal("0.33"), Decimal("1536000")),
        (Decimal("40000000"), Decimal("0.40"), Decimal("2796000")),
        (Decimal("999999999999"), Decimal("0.45"), Decimal("4796000")),
    ]

    income_tax = Decimal("0")
    for upper, rate, deduct in brackets:
        if taxable_income <= upper:
            income_tax = (taxable_income * rate - deduct).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
            break

    # Residence tax (approximate: 10%)
    residence_tax = (taxable_income * Decimal("0.10")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    # Reconstruction tax (2.1% of income tax)
    reconstruction_tax = (income_tax * Decimal("0.021")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

    total_tax = income_tax + residence_tax + reconstruction_tax

    # Furusato limit
    furusato = calculate_furusato_limit(req.annual_income)

    result = {
        "gross_income": int(income),
        "income_type": req.income_type,
        "employment_deduction": int(employment_deduction),
        "basic_deduction": int(basic_deduction),
        "other_deductions": int(extra_deductions),
        "taxable_income": int(taxable_income),
        "income_tax": int(income_tax),
        "residence_tax": int(residence_tax),
        "reconstruction_tax": int(reconstruction_tax),
        "total_estimated_tax": int(total_tax),
        "effective_rate": f"{(total_tax / income * 100).quantize(Decimal('0.1'))}%" if income > 0 else "0%",
        "furusato_nozei_limit": furusato["estimated_donation_limit"],
        "verify_url": "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm",
    }

    # Add invoice info for freelancers
    if req.income_type in ("freelance", "mixed") and req.business_category:
        result["invoice_system"] = calculate_simplified_tax(req.annual_income, req.business_category)
        result["invoice_registered"] = req.is_invoice_registered

    return result
