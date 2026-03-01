"use client";

import { Card, Badge, VerifyButton, Button } from "@/components/ui";
import Link from "next/link";

const DOCUMENTS = [
    "Residence Card (在留カード)",
    "Move-in Notification (転入届) — completed",
    "Passport",
    "Previous Health Insurance Certificate (if applicable)",
    "My Number Notification Card or My Number Card",
];

const STEPS = [
    { title: "Complete Move-in", desc: "File your 転入届 at your new ward office first." },
    { title: "Go to NHI Counter", desc: 'At the same ward office, visit the National Health Insurance (国民健康保険) window — usually labeled 国保年金課.' },
    { title: "Submit Enrollment Form", desc: "Fill out the 国民健康保険加入届. Use full-width characters for all text fields." },
    { title: "Receive Insurance Card", desc: "Your NHI card is usually mailed within 1–2 weeks. Some wards issue a temporary certificate same-day." },
];

export default function NhiPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🏥</span>
                <div>
                    <h1 className="text-3xl font-bold">National Health Insurance</h1>
                    <p className="text-slate-400">国民健康保険 (Kokumin Kenkō Hoken) Enrollment Guide</p>
                </div>
            </div>

            <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
                <p className="text-sm text-slate-300">
                    If you are not covered by employer-provided health insurance (社会保険), you must enroll in NHI within
                    <strong className="text-white"> 14 days</strong> of moving in or losing your previous coverage.
                </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <h2 className="font-semibold text-lg mb-3">Required Documents</h2>
                    <ul className="space-y-2">
                        {DOCUMENTS.map((doc, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-blue-400 mt-0.5">✓</span>
                                {doc}
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card>
                    <h2 className="font-semibold text-lg mb-3">Premiums</h2>
                    <p className="text-sm text-slate-400 mb-2">
                        NHI premiums are based on your previous year&apos;s income. Approximate ranges:
                    </p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-300">
                            <span>Low income (¥2M/yr)</span>
                            <span className="text-blue-400">~¥15,000/mo</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                            <span>Mid income (¥5M/yr)</span>
                            <span className="text-blue-400">~¥30,000/mo</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                            <span>Annual cap (2026)</span>
                            <span className="text-amber-400">¥1,060,000</span>
                        </div>
                    </div>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mb-4">Enrollment Steps</h2>
            <div className="space-y-4 mb-8">
                {STEPS.map((step, i) => (
                    <Card key={i} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                            {i + 1}
                        </div>
                        <div>
                            <h3 className="font-medium text-white">{step.title}</h3>
                            <p className="text-sm text-slate-400">{step.desc}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex flex-wrap gap-3">
                <Link href="/tools/pdf-overlay">
                    <Button variant="secondary">📝 Fill NHI Form with PDF Overlay</Button>
                </Link>
                <VerifyButton url="https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryouhoken/" label="MHLW: NHI Official Information" />
            </div>
        </div>
    );
}
