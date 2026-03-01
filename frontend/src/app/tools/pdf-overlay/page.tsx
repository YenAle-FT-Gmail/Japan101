"use client";

import { useState } from "react";
import { Card, Badge, Button, VerifyButton, Input, Select } from "@/components/ui";

// ── Form overlay definitions (client-side mirror of backend) ──────────
interface FieldOverlay {
    id: string;
    label_en: string;
    label_ja: string;
    hint: string;
    type: "text" | "date" | "select";
    zenkaku: boolean;
    options?: string[];
}

interface FormDefinition {
    id: string;
    title_en: string;
    title_ja: string;
    description: string;
    fields: FieldOverlay[];
    official_url: string;
}

const FORMS: FormDefinition[] = [
    {
        id: "ID-JIN-101",
        title_en: "Move-in Notification",
        title_ja: "転入届",
        description:
            "Required within 14 days of moving to a new municipality. Submit to the ward office of your NEW address.",
        official_url: "https://www.city.minato.tokyo.jp/",
        fields: [
            { id: "name_kanji", label_en: "Full Name (Kanji/Romaji)", label_ja: "氏名", hint: "As shown on Residence Card — FULL-WIDTH required", type: "text", zenkaku: true },
            { id: "name_furigana", label_en: "Name Reading (Katakana)", label_ja: "フリガナ", hint: "Full-width katakana — check Residence Card for official spelling", type: "text", zenkaku: true },
            { id: "dob", label_en: "Date of Birth", label_ja: "生年月日", hint: "Japanese Era format required (e.g., 平成2年5月15日)", type: "date", zenkaku: false },
            { id: "sex", label_en: "Sex", label_ja: "性別", hint: "As shown on Residence Card", type: "select", zenkaku: false, options: ["Male / 男", "Female / 女"] },
            { id: "nationality", label_en: "Nationality", label_ja: "国籍", hint: "Full-width characters", type: "text", zenkaku: true },
            { id: "new_address", label_en: "New Address", label_ja: "新住所", hint: "Full address in full-width — ward, city, building name", type: "text", zenkaku: true },
            { id: "old_address", label_en: "Previous Address", label_ja: "旧住所", hint: "Full address of where you are moving FROM", type: "text", zenkaku: true },
            { id: "move_date", label_en: "Moving Date", label_ja: "転入年月日", hint: "Date you actually moved (not the submission date)", type: "date", zenkaku: false },
            { id: "household_head", label_en: "Head of Household", label_ja: "世帯主", hint: "Name of the head of household at the new address", type: "text", zenkaku: true },
            { id: "relationship", label_en: "Relationship to Head", label_ja: "世帯主との続柄", hint: "e.g., 本人 (self), 妻 (wife), 夫 (husband)", type: "select", zenkaku: false, options: ["本人 (Self)", "妻 (Wife)", "夫 (Husband)", "子 (Child)", "親 (Parent)"] },
        ],
    },
    {
        id: "ID-NHI-201",
        title_en: "National Health Insurance Enrollment",
        title_ja: "国民健康保険加入届",
        description:
            "Required if you are not covered by employer-provided insurance (社会保険). Must be filed within 14 days of eligibility.",
        official_url: "https://www.city.minato.tokyo.jp/",
        fields: [
            { id: "name_kanji", label_en: "Full Name", label_ja: "氏名", hint: "Full-width required", type: "text", zenkaku: true },
            { id: "name_furigana", label_en: "Name Reading (Katakana)", label_ja: "フリガナ", hint: "Full-width katakana", type: "text", zenkaku: true },
            { id: "dob", label_en: "Date of Birth", label_ja: "生年月日", hint: "Japanese Era format", type: "date", zenkaku: false },
            { id: "address", label_en: "Current Address", label_ja: "住所", hint: "Must match registered address at ward office", type: "text", zenkaku: true },
            { id: "phone", label_en: "Phone Number", label_ja: "電話番号", hint: "Full-width numbers", type: "text", zenkaku: true },
            { id: "enrollment_reason", label_en: "Reason for Enrollment", label_ja: "届出理由", hint: "Why you are enrolling now", type: "select", zenkaku: false, options: ["New move-in / 転入", "Left employer / 退職", "Lost dependent status / 扶養離脱", "Other / その他"] },
            { id: "previous_insurance", label_en: "Previous Insurance Type", label_ja: "前の保険の種類", hint: "What insurance you had before", type: "select", zenkaku: false, options: ["Employer / 社会保険", "None / なし", "Other municipality NHI / 他市区町村の国保"] },
        ],
    },
];

// ── Zenkaku helper (for live preview) ──────────────────────
function toFullwidth(text: string): string {
    return [...text]
        .map((ch) => {
            const cp = ch.codePointAt(0)!;
            if (cp >= 0x21 && cp <= 0x7e) return String.fromCodePoint(cp + 0xfee0);
            if (ch === " ") return "\u3000";
            return ch;
        })
        .join("");
}

const ERAS: [string, Date][] = [
    ["令和", new Date("2019-05-01")],
    ["平成", new Date("1989-01-08")],
    ["昭和", new Date("1926-12-25")],
    ["大正", new Date("1912-07-30")],
];

function dateToEra(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    for (const [kanji, start] of ERAS) {
        if (d >= start) {
            const year = d.getFullYear() - start.getFullYear() + 1;
            return `${kanji}${year}年${d.getMonth() + 1}月${d.getDate()}日`;
        }
    }
    return dateStr;
}

export default function PdfOverlayPage() {
    const [selectedForm, setSelectedForm] = useState(0);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    const form = FORMS[selectedForm];

    const updateField = (fieldId: string, value: string) => {
        setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const getTransformed = (field: FieldOverlay): string => {
        const raw = fieldValues[field.id] || "";
        if (!raw) return "";
        if (field.type === "date") return dateToEra(raw);
        if (field.zenkaku) return toFullwidth(raw);
        return raw;
    };

    const allFilled = form.fields.every((f) => fieldValues[f.id]?.trim());

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">📝</span>
                    <div>
                        <h1 className="text-3xl font-bold">PDF Form Overlay</h1>
                        <p className="text-slate-400">English-labeled guide for Japanese government forms with auto-conversion</p>
                    </div>
                </div>
            </div>

            {/* Form Selector */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                {FORMS.map((f, i) => (
                    <button
                        key={f.id}
                        onClick={() => {
                            setSelectedForm(i);
                            setFieldValues({});
                        }}
                        className={`px-4 py-3 rounded-xl border text-left transition-all min-w-[200px] ${selectedForm === i
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
                            }`}
                    >
                        <div className="text-xs text-slate-500">{f.id}</div>
                        <div className="font-medium text-white">{f.title_en}</div>
                        <div className="text-sm text-slate-400">{f.title_ja}</div>
                    </button>
                ))}
            </div>

            {/* Form Description */}
            <Card className="mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            {form.title_en} <span className="text-slate-400">({form.title_ja})</span>
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">{form.description}</p>
                    </div>
                    <Badge variant="blue">{form.id}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <Badge variant="slate">{form.fields.length} fields</Badge>
                    <Badge variant="green">
                        {form.fields.filter((f) => f.zenkaku).length} auto-convert
                    </Badge>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Panel */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-blue-400">①</span> Fill in English
                    </h3>
                    <div className="space-y-3">
                        {form.fields.map((field) => (
                            <div key={field.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <label className="text-sm font-medium text-white">{field.label_en}</label>
                                    <span className="text-xs text-slate-500">({field.label_ja})</span>
                                    {field.zenkaku && <Badge variant="blue" className="text-[10px]">全角</Badge>}
                                </div>
                                <p className="text-xs text-slate-500 mb-2">{field.hint}</p>
                                {field.type === "select" ? (
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={fieldValues[field.id] || ""}
                                        onChange={(e) => updateField(field.id, e.target.value)}
                                    >
                                        <option value="">Select…</option>
                                        {field.options?.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                ) : field.type === "date" ? (
                                    <input
                                        type="date"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={fieldValues[field.id] || ""}
                                        onChange={(e) => updateField(field.id, e.target.value)}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={fieldValues[field.id] || ""}
                                        onChange={(e) => updateField(field.id, e.target.value)}
                                        placeholder={field.label_en}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview Panel */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-green-400">②</span> Form-Ready Preview
                    </h3>
                    <Card>
                        <div className="space-y-4">
                            {form.fields.map((field) => {
                                const transformed = getTransformed(field);
                                return (
                                    <div key={field.id} className="flex items-start justify-between gap-4 py-2 border-b border-slate-700/50 last:border-0">
                                        <div className="min-w-0">
                                            <div className="text-xs text-slate-500">{field.label_ja}</div>
                                            <div className="text-sm text-slate-400">{field.label_en}</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            {transformed ? (
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(transformed)}
                                                    className="text-base font-mono text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                                    title="Click to copy"
                                                >
                                                    {transformed}
                                                </button>
                                            ) : (
                                                <span className="text-sm text-slate-600">—</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-slate-400">
                                    {Object.values(fieldValues).filter((v) => v?.trim()).length} / {form.fields.length} fields filled
                                </span>
                                {allFilled && <Badge variant="green">Ready</Badge>}
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full mb-2"
                                onClick={() => {
                                    const lines = form.fields
                                        .map((f) => `${f.label_ja}: ${getTransformed(f) || "（未入力）"}`)
                                        .join("\n");
                                    navigator.clipboard.writeText(lines);
                                }}
                            >
                                📋 Copy All Fields
                            </Button>
                        </div>
                    </Card>

                    {/* Submit Notice */}
                    <Card className="mt-4 border-amber-500/30 bg-amber-500/5">
                        <h4 className="text-sm font-medium text-amber-400 mb-2">⚖️ Legal Notice</h4>
                        <p className="text-xs text-slate-400 mb-3">
                            Per Administrative Scrivener Law (行政書士法) Article 19, this tool generates reference data only.
                            Actual form submission must be performed by you at the official government portal or ward office.
                        </p>
                        <VerifyButton url={form.official_url} label={`Open ${form.title_en} Official Page`} />
                    </Card>
                </div>
            </div>
        </div>
    );
}
