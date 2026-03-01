"use client";

import { useState } from "react";
import { Card, Badge, Button, VerifyButton, Input, Select } from "@/components/ui";

const VISA_CATEGORIES = [
    { value: "", label: "Select visa category..." },
    { value: "engineer_specialist", label: "Engineer / Specialist in Humanities / International Services" },
    { value: "highly_skilled_professional", label: "Highly Skilled Professional (HSP)" },
    { value: "permanent_resident", label: "Permanent Resident" },
    { value: "spouse_of_japanese", label: "Spouse of Japanese National" },
    { value: "business_manager", label: "Business Manager" },
];

const FEE_SCHEDULE: Record<string, { fee: number; label: string; note?: string }> = {
    engineer_specialist: { fee: 4000, label: "Standard Extension" },
    highly_skilled_professional: { fee: 4000, label: "HSP Extension" },
    permanent_resident: { fee: 200000, label: "Permanent Residence", note: "Fee increased from ¥8,000 to ¥200,000 under the 2024 Immigration Control Act revision." },
    spouse_of_japanese: { fee: 4000, label: "Spouse Visa Extension" },
    business_manager: { fee: 4000, label: "Business Manager Extension" },
};

const DOCUMENTS: Record<string, string[]> = {
    engineer_specialist: [
        "Application form (在留期間更新許可申請書)",
        "Passport and Residence Card",
        "Photo (4cm × 3cm, taken within 3 months)",
        "Company letter of guarantee (身元保証書)",
        "Employment contract or appointment letter",
        "Company registration certificate (登記事項証明書)",
        "Company tax certificates (納税証明書)",
        "Withholding tax slip (源泉徴収票)",
    ],
    highly_skilled_professional: [
        "Application form",
        "Passport and Residence Card",
        "Photo (4cm × 3cm)",
        "Points calculation sheet (ポイント計算表)",
        "Supporting documents for claimed points",
        "Employment contract",
        "Academic credentials (degree certificates)",
        "Annual income proof",
    ],
    permanent_resident: [
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
    spouse_of_japanese: [
        "Application form",
        "Passport and Residence Card",
        "Photo",
        "Marriage certificate (戸籍謄本)",
        "Japanese spouse's resident certificate",
        "Tax certificates",
        "Proof of cohabitation",
    ],
    business_manager: [
        "Application form",
        "Passport and Residence Card",
        "Photo",
        "Business plan",
        "Company registration certificate",
        "Financial statements",
        "Office lease agreement",
        "Proof of ¥5M+ investment or 2+ full-time employees",
    ],
};

type Tab = "overview" | "xml" | "evidence";

export default function VisaPage() {
    const [tab, setTab] = useState<Tab>("overview");
    const [category, setCategory] = useState("");
    const [familyName, setFamilyName] = useState("");
    const [givenName, setGivenName] = useState("");
    const [nationality, setNationality] = useState("US");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("M");
    const [expiryDate, setExpiryDate] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [employer, setEmployer] = useState("");
    const [reason, setReason] = useState("Continuation of employment");

    const fee = category ? FEE_SCHEDULE[category] : null;
    const docs = category ? DOCUMENTS[category] || [] : [];

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">🛂</span>
                    <div>
                        <h1 className="text-3xl font-bold">Visa Extension & ISA 2026</h1>
                        <p className="text-slate-400">在留期間更新許可申請 — Immigration Services Agency</p>
                    </div>
                </div>
                <VerifyButton url="https://www.isa.go.jp/en/applications/procedures/16-2.html" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-slate-800 pb-1">
                {(["overview", "xml", "evidence"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === t
                            ? "bg-slate-800 text-white border-b-2 border-blue-500"
                            : "text-slate-500 hover:text-white"
                            }`}
                    >
                        {t === "overview" ? "📋 Overview & Fees" : t === "xml" ? "📄 XML Draft Generator" : "📁 Evidence Batcher"}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === "overview" && (
                <div className="space-y-4">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Select Your Visa Category</h2>
                        <Select label="Visa Category" value={category} onChange={setCategory} options={VISA_CATEGORIES} />
                    </Card>

                    {fee && (
                        <>
                            <Card className={fee.fee >= 200000 ? "border-red-500/30 bg-red-500/5" : ""}>
                                <h3 className="font-semibold text-white mb-2">Fee: ¥{fee.fee.toLocaleString()}</h3>
                                <p className="text-sm text-slate-400">{fee.label}</p>
                                {fee.note && (
                                    <p className="text-sm text-amber-400 mt-2">⚠️ {fee.note}</p>
                                )}
                                <p className="text-xs text-slate-500 mt-2">
                                    Paid via Revenue Stamp (収入印紙) — purchase at convenience store or post office.
                                </p>
                            </Card>

                            <Card>
                                <h3 className="font-semibold text-white mb-3">Required Documents</h3>
                                <div className="space-y-2">
                                    {docs.map((doc, i) => (
                                        <label key={i} className="flex items-start gap-3 text-sm">
                                            <input type="checkbox" className="mt-0.5 rounded bg-slate-800 border-slate-600" />
                                            <span className="text-slate-300">{doc}</span>
                                        </label>
                                    ))}
                                </div>
                            </Card>
                        </>
                    )}

                    <Card className="border-amber-500/30 bg-amber-500/5">
                        <h3 className="font-semibold text-amber-400 mb-2">ISA Fee Update</h3>
                        <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                            <li>Permanent Residence fee increased to ¥200,000 (from ¥8,000) under 2024 revision</li>
                            <li>Standard visa extension / change of status: ¥4,000</li>
                            <li>Online application available via ISA Online System</li>
                            <li>25 MB multi-file upload limit for evidence documents</li>
                        </ul>
                    </Card>
                </div>
            )}

            {/* XML Draft Tab */}
            {tab === "xml" && (
                <div className="space-y-4">
                    <Card>
                        <h2 className="text-xl font-semibold mb-2">ISA XML Draft Generator</h2>
                        <p className="text-sm text-slate-400 mb-6">
                            Generate a &quot;Temporary Save&quot; XML file that can be imported into the ISA Online System to pre-fill your application.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Family Name" value={familyName} onChange={setFamilyName} placeholder="SMITH" required />
                            <Input label="Given Name" value={givenName} onChange={setGivenName} placeholder="JOHN" required />
                            <Input label="Nationality (ISO)" value={nationality} onChange={setNationality} placeholder="US" />
                            <Input label="Date of Birth" value={dob} onChange={setDob} type="date" required />
                            <Select label="Gender" value={gender} onChange={setGender} options={[{ value: "M", label: "Male" }, { value: "F", label: "Female" }]} />
                            <Select label="Visa Category" value={category} onChange={setCategory} options={VISA_CATEGORIES} />
                            <Input label="Current Visa Expiry" value={expiryDate} onChange={setExpiryDate} type="date" required />
                            <Input label="Phone" value={phone} onChange={setPhone} placeholder="090-1234-5678" />
                            <div className="md:col-span-2">
                                <Input label="Address in Japan" value={address} onChange={setAddress} placeholder="東京都港区..." required />
                            </div>
                            <Input label="Employer / School" value={employer} onChange={setEmployer} placeholder="Company name" />
                            <Input label="Reason for Extension" value={reason} onChange={setReason} placeholder="Continuation of employment" />
                        </div>

                        <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                            <h4 className="text-sm font-medium text-slate-300 mb-2">After generating:</h4>
                            <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                                <li>Download the XML file</li>
                                <li>Go to <a href="https://www.isa.go.jp" className="text-blue-400 underline" target="_blank">isa.go.jp</a> and log in</li>
                                <li>Select &quot;Temporary Save Import&quot; (一時保存読込)</li>
                                <li>Upload the XML to pre-fill your application</li>
                                <li>Review ALL fields carefully — this is a draft only</li>
                                <li>Attach required documents and submit</li>
                            </ol>
                        </div>

                        <a href="https://www.isa.go.jp" target="_blank" rel="noopener noreferrer">
                            <Button className="w-full mt-4">
                                Open ISA Online System →
                            </Button>
                        </a>
                    </Card>

                    <Card className="border-amber-500/30 bg-amber-500/5">
                        <h3 className="font-semibold text-amber-400 mb-2">⚠️ Legal Notice</h3>
                        <p className="text-sm text-slate-400">
                            This XML draft is generated as a convenience tool. Final submission MUST be made through the official ISA Online System at isa.go.jp.
                            Japan GOV-OS does not submit applications on your behalf, in compliance with Administrative Scrivener Law Article 19.
                        </p>
                    </Card>
                </div>
            )}

            {/* Evidence Tab */}
            {tab === "evidence" && (
                <div className="space-y-4">
                    <Card>
                        <h2 className="text-xl font-semibold mb-2">Evidence Document Batcher</h2>
                        <p className="text-sm text-slate-400 mb-6">
                            The ISA Online System has a 25 MB multi-file upload limit. This tool helps you compress and validate your documents.
                        </p>

                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
                            <div className="text-4xl mb-3">📁</div>
                            <p className="text-sm text-slate-400 mb-2">Drag & drop your documents here</p>
                            <p className="text-xs text-slate-500">PDF, JPEG, PNG — Max 25 MB total</p>
                            <Button variant="secondary" size="sm" className="mt-4">
                                Browse Files
                            </Button>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Upload limit:</span>
                                <span className="text-white font-mono">25 MB</span>
                            </div>
                            <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "0%" }} />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">0 MB / 25 MB used</p>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-white mb-3">Compression Tips</h3>
                        <ul className="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
                            <li>Compress images to JPEG quality 70 — usually sufficient for ISA</li>
                            <li>Convert color scans to grayscale to reduce size by ~60%</li>
                            <li>Reduce PDF resolution to 150 DPI if over limit</li>
                            <li>Combine multiple small documents into a single PDF</li>
                        </ul>
                    </Card>
                </div>
            )}
        </div>
    );
}
