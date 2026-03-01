"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Badge, Button, VerifyButton } from "@/components/ui";

// ── Search index (client-side for instant results) ──────────────────────
const PROCEDURES = [
  {
    id: "ID-JIN-101",
    title: "Moving / Change of Address",
    titleJa: "転入届・転出届",
    category: "Residency",
    description:
      "File a moving notification when changing your address within or between municipalities.",
    href: "/procedures/moving",
    govUrl: "https://www.digital.go.jp/policies/moving_onestop",
    keywords: "move moving relocate address hikkoshi tenshutsu apartment house",
    icon: "🏠",
  },
  {
    id: "ID-NHI-201",
    title: "National Health Insurance",
    titleJa: "国民健康保険",
    category: "Health Insurance",
    description:
      "Enroll in NHI if you're self-employed, freelance, or between jobs.",
    href: "/procedures/nhi",
    govUrl:
      "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryouhoken/",
    keywords: "health insurance nhi doctor hospital clinic freelance",
    icon: "🏥",
  },
  {
    id: "ID-TAX-301",
    title: "Tax Return & Invoice System",
    titleJa: "確定申告・インボイス",
    category: "Tax",
    description:
      "File taxes, calculate invoice deductions, and manage Furusato Nozei.",
    href: "/procedures/tax",
    govUrl: "https://www.e-tax.nta.go.jp",
    keywords: "tax return kakutei shinkoku invoice furusato nozei deduction",
    icon: "💰",
  },
  {
    id: "ID-VISA-401",
    title: "Visa Extension / Status Change",
    titleJa: "在留期間更新",
    category: "Immigration",
    description:
      "Extend your visa, change status, or apply for permanent residence.",
    href: "/procedures/visa",
    govUrl: "https://www.isa.go.jp/en/applications/procedures/16-2.html",
    keywords: "visa extension renewal immigration permanent residence PR",
    icon: "🛂",
  },
  {
    id: "ID-PEN-501",
    title: "National Pension",
    titleJa: "国民年金",
    category: "Pension",
    description:
      "Enroll in or manage your National Pension. Required for ages 20-59.",
    href: "/procedures/pension",
    govUrl: "https://www.nenkin.go.jp/",
    keywords: "pension nenkin retirement social security",
    icon: "🏦",
  },
  {
    id: "ID-MYNUMBER-601",
    title: "My Number Card",
    titleJa: "マイナンバーカード",
    category: "Identity",
    description: "Apply for, replace, or update your My Number Card.",
    href: "/procedures/mynumber",
    govUrl: "https://www.kojinbango-card.go.jp/en/",
    keywords: "my number mynumber myna card individual number",
    icon: "💳",
  },
];

const QUICK_LINKS = [
  { label: "I just moved", query: "moved new address" },
  { label: "I need health insurance", query: "health insurance enrollment" },
  { label: "Extend my visa", query: "visa extension" },
  { label: "File my taxes", query: "tax return" },
  { label: "Are you freelancer?", query: "freelance NHI invoice" },
];

function searchProcedures(query: string) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return PROCEDURES.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.titleJa.includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.keywords.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const results = searchProcedures(query);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
          <Badge variant="blue" className="mb-6">
            March 2026 — Tax Reform & Myna App Consolidation Ready
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Navigate Japanese
            <br />
            <span className="text-blue-400">Bureaucracy</span> in English
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            A unified wrapper for Japan&apos;s fragmented digital government.
            Moving, taxes, visa, insurance — all in one place, all in English.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try "I just moved to Shibuya" or "extend my visa"...'
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-lg"
              />
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => setQuery(link.query)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Search Results */}
            {query && (
              <div className="mt-4 text-left">
                {results.length > 0 ? (
                  <div className="space-y-3">
                    {results.map((proc) => (
                      <Link key={proc.id} href={proc.href}>
                        <Card hover className="flex items-start gap-4">
                          <span className="text-3xl">{proc.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">
                                {proc.title}
                              </h3>
                              <Badge variant="slate">{proc.category}</Badge>
                            </div>
                            <p className="text-sm text-slate-400">
                              {proc.description}
                            </p>
                            <span className="text-xs text-slate-500 mt-1 block">
                              {proc.titleJa} — {proc.id}
                            </span>
                          </div>
                          <VerifyButton url={proc.govUrl} />
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <p className="text-slate-400 text-center py-4">
                      No matching procedures found. Try different keywords.
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Procedure Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">All Procedures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROCEDURES.map((proc) => (
            <Link key={proc.id} href={proc.href}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{proc.icon}</span>
                  <Badge variant="slate">{proc.category}</Badge>
                </div>
                <h3 className="font-semibold text-white mb-1">{proc.title}</h3>
                <p className="text-xs text-slate-500 mb-2">{proc.titleJa}</p>
                <p className="text-sm text-slate-400 line-clamp-2">
                  {proc.description}
                </p>
                <div className="mt-4">
                  <VerifyButton url={proc.govUrl} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Banner */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-3xl mb-3">🔤</div>
            <h3 className="font-semibold text-white mb-2">
              Zenkaku Normalization
            </h3>
            <p className="text-sm text-slate-400">
              Auto-converts your English input to full-width Japanese characters,
              era dates, and katakana — exactly what government forms require.
            </p>
            <Link href="/tools/zenkaku">
              <Button variant="ghost" size="sm" className="mt-3">
                Try the Engine →
              </Button>
            </Link>
          </Card>
          <Card>
            <div className="text-3xl mb-3">🏛️</div>
            <h3 className="font-semibold text-white mb-2">
              Municipal Adapter
            </h3>
            <p className="text-sm text-slate-400">
              Automatically detects whether your ward uses Gov-Cloud or legacy
              systems and adjusts the workflow accordingly.
            </p>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mt-3">
                View Dashboard →
              </Button>
            </Link>
          </Card>
          <Card>
            <div className="text-3xl mb-3">⚖️</div>
            <h3 className="font-semibold text-white mb-2">
              Legal Compliance
            </h3>
            <p className="text-sm text-slate-400">
              Every instruction links to the official .go.jp source. We guide —
              you submit. Compliant with Administrative Scrivener Law Art. 19.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
