"use client";

import { Card, Badge, VerifyButton, Button } from "@/components/ui";
import Link from "next/link";

const USES = [
    { title: "Tax Filing (確定申告)", desc: "Required for online tax filing via e-Tax" },
    { title: "Health Insurance", desc: "Links to your NHI or employer insurance record" },
    { title: "Pension", desc: "View pension records and apply online" },
    { title: "Banking", desc: "Some banks require My Number for account opening" },
    { title: "Residence Procedures", desc: "Used for digital move-in/out notifications" },
    { title: "Disaster Relief", desc: "Identifying aid recipients after natural disasters" },
];

const CARD_VS_NOTIFICATION = [
    { feature: "Physical Card", card: "✅ Yes (IC chip)", notification: "Paper only" },
    { feature: "Photo ID", card: "✅ Yes", notification: "❌ No" },
    { feature: "Online Procedures", card: "✅ Full access", notification: "❌ Limited" },
    { feature: "Convenience Store Certificates", card: "✅ Yes", notification: "❌ No" },
    { feature: "Digital Signatures", card: "✅ Yes (JPKI)", notification: "❌ No" },
    { feature: "Valid Period", card: "10 years (5 for <18)", notification: "N/A" },
];

export default function MyNumberPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🔢</span>
                <div>
                    <h1 className="text-3xl font-bold">My Number (マイナンバー)</h1>
                    <p className="text-slate-400">Individual Number Card Guide for Foreign Residents</p>
                </div>
            </div>

            <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
                <p className="text-sm text-slate-300">
                    Every registered resident of Japan (including foreign nationals) is assigned a 12-digit
                    <strong className="text-white"> My Number (マイナンバー)</strong>. The optional
                    <strong className="text-white"> My Number Card (マイナンバーカード)</strong> is a photo ID with an IC chip
                    that enables digital government services.
                </p>
            </Card>

            <h2 className="text-xl font-semibold mb-4">My Number Card vs Notification</h2>
            <Card className="mb-8 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-2 text-slate-400 font-medium">Feature</th>
                            <th className="text-left py-2 text-blue-400 font-medium">My Number Card</th>
                            <th className="text-left py-2 text-slate-500 font-medium">Notification Only</th>
                        </tr>
                    </thead>
                    <tbody>
                        {CARD_VS_NOTIFICATION.map((row, i) => (
                            <tr key={i} className="border-b border-slate-800 last:border-0">
                                <td className="py-2 text-slate-300">{row.feature}</td>
                                <td className="py-2 text-white">{row.card}</td>
                                <td className="py-2 text-slate-500">{row.notification}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <h2 className="text-xl font-semibold mb-4">What My Number is Used For</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {USES.map((use, i) => (
                    <Card key={i} className="p-4">
                        <h3 className="font-medium text-white text-sm">{use.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{use.desc}</p>
                    </Card>
                ))}
            </div>

            <h2 className="text-xl font-semibold mb-4">How to Apply</h2>
            <div className="space-y-4 mb-8">
                {[
                    { step: 1, title: "Receive Notification", desc: "After completing move-in registration (転入届), you'll receive a My Number Notification Letter by mail within 2–3 weeks." },
                    { step: 2, title: "Apply for Card", desc: "Apply online (via smartphone), by mail, or at a designated photo booth. You'll need a photo meeting passport standards." },
                    { step: 3, title: "Set PINs at Ward Office", desc: "Pick up your card at the ward office. You'll set 4 PINs: signature (6-16 chars), user authentication (4 digits), certificate (4 digits), and card access (4 digits)." },
                    { step: 4, title: "Use MynaPortal", desc: "With your card and PINs, access MynaPortal (マイナポータル) for digital government services." },
                ].map((s) => (
                    <Card key={s.step} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                            {s.step}
                        </div>
                        <div>
                            <h3 className="font-medium text-white">{s.title}</h3>
                            <p className="text-sm text-slate-400">{s.desc}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex flex-wrap gap-3">
                <VerifyButton url="https://myna.go.jp/" label="MynaPortal Official Site" />
                <VerifyButton url="https://www.kojinbango-card.go.jp/en/" label="My Number Card Application (EN)" />
                <Link href="/procedures/moving">
                    <Button variant="secondary">🏠 Moving Procedure (includes My Number)</Button>
                </Link>
            </div>
        </div>
    );
}
