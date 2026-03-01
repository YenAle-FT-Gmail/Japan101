"use client";

import { Card, Badge, VerifyButton, Button } from "@/components/ui";
import Link from "next/link";

const PENSION_TYPES = [
    {
        type: "National Pension (国民年金)",
        who: "Self-employed, freelancers, unemployed, students",
        monthly: "¥16,980 (2026)",
        badge: "Category 1" as const,
    },
    {
        type: "Employees' Pension (厚生年金)",
        who: "Company employees — deducted from salary automatically",
        monthly: "~8-9% of salary (employer matches)",
        badge: "Category 2" as const,
    },
    {
        type: "Dependent Spouse (第3号)",
        who: "Spouse of Category 2 insured with income < ¥1.3M/yr",
        monthly: "¥0 (covered by spouse's employer)",
        badge: "Category 3" as const,
    },
];

const KEY_FACTS = [
    "Pension enrollment is mandatory for all residents aged 20–60",
    "10 years of contributions required to receive pension benefits",
    "Japan has totalization agreements with 23 countries to combine contribution periods",
    "Lump-sum withdrawal available when leaving Japan (within 2 years of departure)",
    "Students and low-income residents can apply for exemption (免除)",
];

export default function PensionPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🏦</span>
                <div>
                    <h1 className="text-3xl font-bold">Pension (年金)</h1>
                    <p className="text-slate-400">National Pension System Guide for Foreign Residents</p>
                </div>
            </div>

            <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
                <p className="text-sm text-slate-300">
                    All residents of Japan aged 20–60, including foreign nationals, are required to enroll in the pension system.
                    If you are not enrolled through an employer, you must enroll in the <strong className="text-white">National Pension (国民年金)</strong> at your ward office.
                </p>
            </Card>

            <h2 className="text-xl font-semibold mb-4">Pension Categories</h2>
            <div className="space-y-4 mb-8">
                {PENSION_TYPES.map((p, i) => (
                    <Card key={i}>
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-white">{p.type}</h3>
                            <Badge variant="blue">{p.badge}</Badge>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{p.who}</p>
                        <div className="text-sm">
                            <span className="text-slate-500">Monthly: </span>
                            <span className="text-blue-400 font-medium">{p.monthly}</span>
                        </div>
                    </Card>
                ))}
            </div>

            <h2 className="text-xl font-semibold mb-4">Key Facts</h2>
            <Card className="mb-8">
                <ul className="space-y-3">
                    {KEY_FACTS.map((fact, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-blue-400 mt-0.5">•</span>
                            {fact}
                        </li>
                    ))}
                </ul>
            </Card>

            <h2 className="text-xl font-semibold mb-4">Lump-sum Withdrawal</h2>
            <Card className="mb-8 border-amber-500/30 bg-amber-500/5">
                <h3 className="font-medium text-amber-400 mb-2">Leaving Japan?</h3>
                <p className="text-sm text-slate-400 mb-3">
                    If you contributed to the pension system and are leaving Japan permanently, you can claim a
                    <strong className="text-white"> lump-sum withdrawal (脱退一時金)</strong> within 2 years of departure.
                    Apply to the Japan Pension Service after leaving.
                </p>
                <div className="text-sm text-slate-300">
                    <div>6–60 months of contributions → proportional refund</div>
                    <div>Max refund period: 60 months (as of 2021 revision)</div>
                </div>
            </Card>

            <div className="flex flex-wrap gap-3">
                <VerifyButton url="https://www.nenkin.go.jp/international/index.html" label="Japan Pension Service (English)" />
                <Link href="/tools/zenkaku">
                    <Button variant="secondary">🔤 Zenkaku Converter for Forms</Button>
                </Link>
            </div>
        </div>
    );
}
