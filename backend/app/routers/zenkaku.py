"""
Zenkaku Normalization Engine
────────────────────────────
Converts Western data formats into Japanese administrative requirements:
  • ASCII → Full-width (全角)
  • Western dates → Japanese Era dates (令和 / 平成 / 昭和)
  • Half-width Katakana validation for banking
  • Full-width Hiragana validation for name fields
"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
# CORE CONVERSION UTILITIES
# ═══════════════════════════════════════════════════════════════════════════

# ASCII half-width → full-width offset
_HW_TO_FW_OFFSET = 0xFEE0  # U+FF01 - U+0021 = 0xFEE0

# Japanese Eras with start dates
_ERAS = [
    ("令和", "Reiwa", date(2019, 5, 1)),
    ("平成", "Heisei", date(1989, 1, 8)),
    ("昭和", "Showa", date(1926, 12, 25)),
    ("大正", "Taisho", date(1912, 7, 30)),
    ("明治", "Meiji", date(1868, 1, 25)),
]

# Half-width katakana range: U+FF65 – U+FF9F
_HW_KATA_START = 0xFF65
_HW_KATA_END = 0xFF9F

# Full-width hiragana range: U+3040 – U+309F
_FW_HIRA_START = 0x3040
_FW_HIRA_END = 0x309F

# Full-width katakana range: U+30A0 – U+30FF
_FW_KATA_START = 0x30A0
_FW_KATA_END = 0x30FF


def ascii_to_fullwidth(text: str) -> str:
    """Convert ASCII (0x21-0x7E) characters to their full-width equivalents."""
    result = []
    for ch in text:
        cp = ord(ch)
        if 0x21 <= cp <= 0x7E:
            result.append(chr(cp + _HW_TO_FW_OFFSET))
        elif ch == " ":
            result.append("\u3000")  # full-width space
        else:
            result.append(ch)
    return "".join(result)


def fullwidth_to_ascii(text: str) -> str:
    """Convert full-width characters back to ASCII."""
    result = []
    for ch in text:
        cp = ord(ch)
        if 0xFF01 <= cp <= 0xFF5E:
            result.append(chr(cp - _HW_TO_FW_OFFSET))
        elif ch == "\u3000":
            result.append(" ")
        else:
            result.append(ch)
    return "".join(result)


def western_to_japanese_era(d: date) -> dict:
    """
    Convert a Western date to Japanese Era format.
    Returns: {"era_kanji": "令和", "era_romaji": "Reiwa", "year": 7, "formatted": "令和7年3月1日"}
    """
    for era_kanji, era_romaji, era_start in _ERAS:
        if d >= era_start:
            era_year = d.year - era_start.year + 1
            return {
                "era_kanji": era_kanji,
                "era_romaji": era_romaji,
                "year": era_year,
                "month": d.month,
                "day": d.day,
                "formatted": f"{era_kanji}{era_year}年{d.month}月{d.day}日",
                "western": d.isoformat(),
            }
    return {"error": "Date is before Meiji era", "western": d.isoformat()}


def validate_halfwidth_katakana(text: str) -> dict:
    """Validate if text contains only half-width katakana (banking fields)."""
    invalid_chars = []
    for i, ch in enumerate(text):
        cp = ord(ch)
        if not (_HW_KATA_START <= cp <= _HW_KATA_END) and ch not in (" ", "\u0020"):
            invalid_chars.append({"position": i, "char": ch, "codepoint": f"U+{cp:04X}"})
    return {
        "valid": len(invalid_chars) == 0,
        "input": text,
        "invalid_characters": invalid_chars,
        "field_type": "half-width katakana (banking)",
    }


def validate_fullwidth_hiragana(text: str) -> dict:
    """Validate if text contains only full-width hiragana (name fields)."""
    invalid_chars = []
    for i, ch in enumerate(text):
        cp = ord(ch)
        is_hiragana = _FW_HIRA_START <= cp <= _FW_HIRA_END
        is_fw_space = ch == "\u3000"
        is_prolonged = ch == "ー"
        if not (is_hiragana or is_fw_space or is_prolonged):
            invalid_chars.append({"position": i, "char": ch, "codepoint": f"U+{cp:04X}"})
    return {
        "valid": len(invalid_chars) == 0,
        "input": text,
        "invalid_characters": invalid_chars,
        "field_type": "full-width hiragana (name)",
    }


def katakana_to_hiragana(text: str) -> str:
    """Convert full-width katakana to hiragana."""
    result = []
    for ch in text:
        cp = ord(ch)
        if _FW_KATA_START <= cp <= _FW_KATA_END:
            result.append(chr(cp - 0x60))
        else:
            result.append(ch)
    return "".join(result)


def romaji_to_katakana(text: str) -> str:
    """Basic romaji → katakana conversion for common name patterns."""
    _MAP = {
        "a": "ア", "i": "イ", "u": "ウ", "e": "エ", "o": "オ",
        "ka": "カ", "ki": "キ", "ku": "ク", "ke": "ケ", "ko": "コ",
        "sa": "サ", "shi": "シ", "si": "シ", "su": "ス", "se": "セ", "so": "ソ",
        "ta": "タ", "chi": "チ", "ti": "チ", "tsu": "ツ", "tu": "ツ", "te": "テ", "to": "ト",
        "na": "ナ", "ni": "ニ", "nu": "ヌ", "ne": "ネ", "no": "ノ",
        "ha": "ハ", "hi": "ヒ", "fu": "フ", "hu": "フ", "he": "ヘ", "ho": "ホ",
        "ma": "マ", "mi": "ミ", "mu": "ム", "me": "メ", "mo": "モ",
        "ya": "ヤ", "yu": "ユ", "yo": "ヨ",
        "ra": "ラ", "ri": "リ", "ru": "ル", "re": "レ", "ro": "ロ",
        "wa": "ワ", "wi": "ヰ", "we": "ヱ", "wo": "ヲ",
        "n": "ン",
        "ga": "ガ", "gi": "ギ", "gu": "グ", "ge": "ゲ", "go": "ゴ",
        "za": "ザ", "ji": "ジ", "zi": "ジ", "zu": "ズ", "ze": "ゼ", "zo": "ゾ",
        "da": "ダ", "di": "ヂ", "du": "ヅ", "de": "デ", "do": "ド",
        "ba": "バ", "bi": "ビ", "bu": "ブ", "be": "ベ", "bo": "ボ",
        "pa": "パ", "pi": "ピ", "pu": "プ", "pe": "ペ", "po": "ポ",
        "kya": "キャ", "kyu": "キュ", "kyo": "キョ",
        "sha": "シャ", "shu": "シュ", "sho": "ショ",
        "cha": "チャ", "chu": "チュ", "cho": "チョ",
        "nya": "ニャ", "nyu": "ニュ", "nyo": "ニョ",
        "hya": "ヒャ", "hyu": "ヒュ", "hyo": "ヒョ",
        "mya": "ミャ", "myu": "ミュ", "myo": "ミョ",
        "rya": "リャ", "ryu": "リュ", "ryo": "リョ",
        "gya": "ギャ", "gyu": "ギュ", "gyo": "ギョ",
        "ja": "ジャ", "ju": "ジュ", "jo": "ジョ",
        "bya": "ビャ", "byu": "ビュ", "byo": "ビョ",
        "pya": "ピャ", "pyu": "ピュ", "pyo": "ピョ",
    }
    text_lower = text.lower()
    result = []
    i = 0
    while i < len(text_lower):
        # Try 3-char, 2-char, 1-char matches
        matched = False
        for length in (3, 2, 1):
            chunk = text_lower[i:i + length]
            if chunk in _MAP:
                result.append(_MAP[chunk])
                i += length
                matched = True
                break
        if not matched:
            ch = text_lower[i]
            if ch == " ":
                result.append("・")
            elif ch == "-":
                result.append("ー")
            else:
                result.append(ascii_to_fullwidth(ch.upper()))
            i += 1
    return "".join(result)


# ═══════════════════════════════════════════════════════════════════════════
# API SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class ConvertTextRequest(BaseModel):
    text: str = Field(..., description="ASCII text to convert to full-width")

class ConvertTextResponse(BaseModel):
    original: str
    fullwidth: str

class DateConvertRequest(BaseModel):
    date: str = Field(..., description="ISO 8601 date string (YYYY-MM-DD)")

class ValidateFieldRequest(BaseModel):
    text: str = Field(..., description="Text to validate")
    field_type: str = Field(..., description="'banking' for half-width katakana, 'name' for full-width hiragana")

class RomajiConvertRequest(BaseModel):
    romaji: str = Field(..., description="Romaji text to convert (e.g. 'SMITH JOHN')")

class NormalizeAllRequest(BaseModel):
    """Full normalization request for a form submission."""
    name_ascii: str = Field("", description="Name in ASCII (e.g. 'JOHN SMITH')")
    name_katakana: Optional[str] = Field(None, description="Name in katakana, if already known")
    birthday: Optional[str] = Field(None, description="Birthday in ISO format (YYYY-MM-DD)")
    address_ascii: Optional[str] = Field(None, description="Address in ASCII")
    phone: Optional[str] = Field(None, description="Phone number (digits and hyphens)")


# ═══════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/to-fullwidth", response_model=ConvertTextResponse)
async def convert_to_fullwidth(req: ConvertTextRequest):
    """Convert ASCII text to full-width Japanese characters."""
    return ConvertTextResponse(original=req.text, fullwidth=ascii_to_fullwidth(req.text))


@router.post("/to-ascii")
async def convert_to_ascii(req: ConvertTextRequest):
    """Convert full-width text back to ASCII."""
    return {"original": req.text, "ascii": fullwidth_to_ascii(req.text)}


@router.post("/date-to-era")
async def convert_date_to_era(req: DateConvertRequest):
    """Convert a Western date (ISO 8601) to Japanese Era format."""
    try:
        d = date.fromisoformat(req.date)
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD."}
    return western_to_japanese_era(d)


@router.post("/validate-field")
async def validate_field(req: ValidateFieldRequest):
    """Validate text against Japanese field type requirements."""
    if req.field_type == "banking":
        return validate_halfwidth_katakana(req.text)
    elif req.field_type == "name":
        return validate_fullwidth_hiragana(req.text)
    else:
        return {"error": f"Unknown field_type: '{req.field_type}'. Use 'banking' or 'name'."}


@router.post("/romaji-to-katakana")
async def convert_romaji(req: RomajiConvertRequest):
    """Convert romaji (English transliteration) to katakana."""
    katakana = romaji_to_katakana(req.romaji)
    return {
        "original": req.romaji,
        "katakana": katakana,
        "hiragana": katakana_to_hiragana(katakana),
    }


@router.post("/normalize-all")
async def normalize_all(req: NormalizeAllRequest):
    """
    Full-field normalization for a government form submission.
    Converts all fields to their required Japanese administrative formats.
    """
    result = {}

    # Name → Full-width + Katakana
    if req.name_ascii:
        result["name_fullwidth"] = ascii_to_fullwidth(req.name_ascii)
        result["name_katakana"] = req.name_katakana or romaji_to_katakana(req.name_ascii)
        result["name_hiragana"] = katakana_to_hiragana(result["name_katakana"])

    # Birthday → Japanese Era
    if req.birthday:
        try:
            d = date.fromisoformat(req.birthday)
            result["birthday_era"] = western_to_japanese_era(d)
        except ValueError:
            result["birthday_era"] = {"error": "Invalid date format"}

    # Address → Full-width
    if req.address_ascii:
        result["address_fullwidth"] = ascii_to_fullwidth(req.address_ascii)

    # Phone → Full-width digits
    if req.phone:
        result["phone_fullwidth"] = ascii_to_fullwidth(req.phone)

    return {"normalized": result}
