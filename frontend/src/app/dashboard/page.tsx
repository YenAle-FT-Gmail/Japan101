"use client";

import { Card, Badge, VerifyButton } from "@/components/ui";

const WARDS = [
    {
        id: "minato-ku-tokyo",
        name: "Minato City",
        nameJa: "港区",
        prefecture: "Tokyo",
        status: "migrated" as const,
        url: "https://www.city.minato.tokyo.jp",
        notes: "Full Gov-Cloud migration completed Feb 2026.",
    },
    {
        id: "shibuya-ku-tokyo",
        name: "Shibuya City",
        nameJa: "渋谷区",
        prefecture: "Tokyo",
        status: "migrated" as const,
        url: "https://www.city.shibuya.tokyo.jp",
    },
    {
        id: "shinjuku-ku-tokyo",
        name: "Shinjuku City",
        nameJa: "新宿区",
        prefecture: "Tokyo",
        status: "partial" as const,
        url: "https://www.city.shinjuku.lg.jp",
        notes: "Moving forms migrated, NHI still legacy.",
    },
    {
        id: "yokohama-shi",
        name: "Yokohama City",
        nameJa: "横浜市",
        prefecture: "Kanagawa",
        status: "migrated" as const,
        url: "https://www.city.yokohama.lg.jp",
    },
    {
        id: "osaka-shi",
        name: "Osaka City",
        nameJa: "大阪市",
        prefecture: "Osaka",
        status: "legacy" as const,
        url: "https://www.city.osaka.lg.jp",
        notes: "Full migration scheduled for Oct 2026.",
    },
    {
        id: "nagoya-shi",
        name: "Nagoya City",
        nameJa: "名古屋市",
        prefecture: "Aichi",
        status: "legacy" as const,
        url: "https://www.city.nagoya.jp",
        notes: "Legacy NTT Data system.",
    },
    {
        id: "fukuoka-shi",
        name: "Fukuoka City",
        nameJa: "福岡市",
        prefecture: "Fukuoka",
        status: "migrated" as const,
        url: "https://www.city.fukuoka.lg.jp",
    },
    {
        id: "sapporo-shi",
        name: "Sapporo City",
        nameJa: "札幌市",
        prefecture: "Hokkaido",
        status: "partial" as const,
        url: "https://www.city.sapporo.jp",
    },
];

const statusConfig = {
    migrated: { label: "Gov-Cloud ✓", variant: "green" as const, description: "Full online submission available" },
    partial: { label: "Partial", variant: "yellow" as const, description: "Some services online, some require in-person" },
    legacy: { label: "Legacy", variant: "red" as const, description: "In-person visit required" },
};

export default function DashboardPage() {
    const migrated = WARDS.filter((w) => w.status === "migrated").length;
    const partial = WARDS.filter((w) => w.status === "partial").length;
    const legacy = WARDS.filter((w) => w.status === "legacy").length;

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Ward Selector Dashboard</h1>
                <p className="text-slate-400">
                    Gov-Cloud migration status for major municipalities. Your workflow adapts based on your ward&apos;s status.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-emerald-400">{migrated}</div>
                        <div className="text-sm text-slate-400 mt-1">Migrated to Gov-Cloud</div>
                        <div className="mt-2 w-full bg-slate-800 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(migrated / WARDS.length) * 100}%` }} />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-amber-400">{partial}</div>
                        <div className="text-sm text-slate-400 mt-1">Partial Migration</div>
                        <div className="mt-2 w-full bg-slate-800 rounded-full h-2">
                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(partial / WARDS.length) * 100}%` }} />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-red-400">{legacy}</div>
                        <div className="text-sm text-slate-400 mt-1">Legacy Systems</div>
                        <div className="mt-2 w-full bg-slate-800 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(legacy / WARDS.length) * 100}%` }} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Ward Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WARDS.map((ward) => {
                    const config = statusConfig[ward.status];
                    return (
                        <Card key={ward.id} hover>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-white text-lg">{ward.name}</h3>
                                    <p className="text-sm text-slate-500">{ward.nameJa} — {ward.prefecture}</p>
                                </div>
                                <Badge variant={config.variant}>{config.label}</Badge>
                            </div>

                            <p className="text-sm text-slate-400 mb-3">{config.description}</p>

                            {ward.notes && (
                                <p className="text-xs text-slate-500 mb-3 italic">{ward.notes}</p>
                            )}

                            {/* Provider indicator */}
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 mb-3">
                                <div className={`w-2 h-2 rounded-full ${ward.status === "migrated" ? "bg-emerald-500" : ward.status === "partial" ? "bg-amber-500" : "bg-red-500"
                                    }`} />
                                <span className="text-xs text-slate-400">
                                    Provider: {ward.status === "migrated" ? "Gov-Cloud API (Standard)" : ward.status === "partial" ? "Mixed (Gov-Cloud + K-Search)" : "K-Search Legacy Scraper"}
                                </span>
                            </div>

                            {/* Procedure support */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                <Badge variant={ward.status !== "legacy" ? "green" : "red"}>
                                    Moving {ward.status !== "legacy" ? "✓ Online" : "✗ In-person"}
                                </Badge>
                                <Badge variant={ward.status === "migrated" ? "green" : "red"}>
                                    NHI {ward.status === "migrated" ? "✓ Online" : "✗ In-person"}
                                </Badge>
                                <Badge variant={ward.status === "migrated" ? "green" : "yellow"}>
                                    Tax {ward.status === "migrated" ? "✓ e-Tax" : "◐ Partial"}
                                </Badge>
                            </div>

                            <VerifyButton url={ward.url} label="Ward Portal" />
                        </Card>
                    );
                })}
            </div>

            {/* Info */}
            <Card className="mt-8 border-blue-500/30 bg-blue-500/5">
                <h3 className="font-semibold text-blue-400 mb-2">About Gov-Cloud Migration</h3>
                <p className="text-sm text-slate-400">
                    Japan&apos;s Digital Agency is migrating all 1,741 municipalities to the Gov-Cloud standardized system.
                    As of March 2026, migration is incomplete. This dashboard shows the real-time status for major cities.
                    The Municipal Adapter Layer automatically selects the right provider (Gov-Cloud API or K-Search Legacy Scraper)
                    based on your ward&apos;s migration status.
                </p>
                <div className="mt-3">
                    <VerifyButton url="https://www.digital.go.jp/policies/gov-cloud" label="Digital Agency Gov-Cloud" />
                </div>
            </Card>
        </div>
    );
}
