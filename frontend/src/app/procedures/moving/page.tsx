"use client";

import { useState } from "react";
import { Card, Badge, Button, VerifyButton, Input, Select, StepIndicator } from "@/components/ui";

const WARDS = [
    { value: "", label: "Select your ward..." },
    { value: "minato-ku-tokyo", label: "Minato City (港区) — Tokyo" },
    { value: "shibuya-ku-tokyo", label: "Shibuya City (渋谷区) — Tokyo" },
    { value: "shinjuku-ku-tokyo", label: "Shinjuku City (新宿区) — Tokyo" },
    { value: "yokohama-shi", label: "Yokohama City (横浜市) — Kanagawa" },
    { value: "osaka-shi", label: "Osaka City (大阪市) — Osaka" },
    { value: "nagoya-shi", label: "Nagoya City (名古屋市) — Aichi" },
    { value: "fukuoka-shi", label: "Fukuoka City (福岡市) — Fukuoka" },
    { value: "sapporo-shi", label: "Sapporo City (札幌市) — Hokkaido" },
];

type Step = "info" | "review" | "tasks";

export default function MovingPage() {
    const [step, setStep] = useState<Step>("info");
    const [fromWard, setFromWard] = useState("");
    const [toWard, setToWard] = useState("");
    const [movingDate, setMovingDate] = useState("");
    const [members, setMembers] = useState("1");
    const [hasChildren, setHasChildren] = useState(false);
    const [hasVehicle, setHasVehicle] = useState(false);
    const [hasPet, setHasPet] = useState(false);

    const tasks = [
        { category: "Moving Out", task: "Submit Moving Out Notification (転出届) via MynaPortal", status: "digital", formId: "ID-JIN-101" },
        { category: "Moving In", task: `Visit destination ward for Moving In (転入届)`, status: "pending", note: "Must be done within 14 days." },
        { category: "My Number", task: "Update My Number Card address (IC chip rewrite)", status: "pending", note: "PIN required at counter." },
        { category: "Health Insurance", task: "Transfer NHI enrollment (国民健康保険)", status: "pending", formId: "ID-NHI-201" },
        { category: "Pension", task: "Update National Pension address", status: "pending", formId: "ID-PEN-501" },
        ...(hasChildren ? [{ category: "Education", task: "Obtain school transfer notification (転校届)", status: "pending", note: "Get from current school." }] : []),
        ...(hasVehicle ? [{ category: "Vehicle", task: "Update vehicle registration address", status: "pending", note: "Land Transport Bureau within 15 days." }] : []),
        ...(hasPet ? [{ category: "Pet", task: "Re-register dog at new ward (犬の登録変更届)", status: "pending", note: "Bring tag + rabies cert." }] : []),
        { category: "Utilities", task: "Update address with utility companies", status: "pending" },
        { category: "Post Office", task: "Submit mail forwarding request (転居届)", status: "pending" },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">🏠</span>
                    <div>
                        <h1 className="text-3xl font-bold">Hikkoshi One-Stop</h1>
                        <p className="text-slate-400">Moving / Change of Address — 転入届・転出届</p>
                    </div>
                </div>
                <VerifyButton url="https://www.digital.go.jp/policies/moving_onestop" />
            </div>

            {/* Steps Indicator */}
            <div className="mb-8">
                <StepIndicator
                    steps={[
                        { label: "Your Info", status: step === "info" ? "current" : step === "review" || step === "tasks" ? "complete" : "upcoming" },
                        { label: "Review & Submit", status: step === "review" ? "current" : step === "tasks" ? "complete" : "upcoming" },
                        { label: "Task Checklist", status: step === "tasks" ? "current" : "upcoming" },
                    ]}
                />
            </div>

            {/* Step: Info */}
            {step === "info" && (
                <Card>
                    <h2 className="text-xl font-semibold mb-6">Where are you moving?</h2>
                    <div className="space-y-4">
                        <Select label="Moving FROM" value={fromWard} onChange={setFromWard} options={WARDS} hint="Your current municipality" />
                        <Select label="Moving TO" value={toWard} onChange={setToWard} options={WARDS} hint="Your new municipality" />
                        <Input label="Moving Date" value={movingDate} onChange={setMovingDate} type="date" required />
                        <Input label="Household Members" value={members} onChange={setMembers} type="number" hint="Including yourself" />

                        <div className="space-y-3 pt-2">
                            <h3 className="text-sm font-medium text-slate-300">Additional Circumstances</h3>
                            <label className="flex items-center gap-3 text-sm text-slate-400 cursor-pointer">
                                <input type="checkbox" checked={hasChildren} onChange={(e) => setHasChildren(e.target.checked)} className="rounded bg-slate-800 border-slate-600" />
                                I have school-age children
                            </label>
                            <label className="flex items-center gap-3 text-sm text-slate-400 cursor-pointer">
                                <input type="checkbox" checked={hasVehicle} onChange={(e) => setHasVehicle(e.target.checked)} className="rounded bg-slate-800 border-slate-600" />
                                I have a registered vehicle
                            </label>
                            <label className="flex items-center gap-3 text-sm text-slate-400 cursor-pointer">
                                <input type="checkbox" checked={hasPet} onChange={(e) => setHasPet(e.target.checked)} className="rounded bg-slate-800 border-slate-600" />
                                I have a registered pet (dog)
                            </label>
                        </div>

                        <Button onClick={() => fromWard && toWard && movingDate ? setStep("review") : undefined} disabled={!fromWard || !toWard || !movingDate} className="w-full mt-4">
                            Continue to Review
                        </Button>
                    </div>
                </Card>
            )}

            {/* Step: Review */}
            {step === "review" && (
                <div className="space-y-4">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Review Your Move</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-slate-500">From:</span><br /><span className="text-white">{WARDS.find(w => w.value === fromWard)?.label}</span></div>
                            <div><span className="text-slate-500">To:</span><br /><span className="text-white">{WARDS.find(w => w.value === toWard)?.label}</span></div>
                            <div><span className="text-slate-500">Date:</span><br /><span className="text-white">{movingDate}</span></div>
                            <div><span className="text-slate-500">Members:</span><br /><span className="text-white">{members}</span></div>
                        </div>
                    </Card>

                    <Card className="border-blue-500/30 bg-blue-500/5">
                        <h3 className="font-semibold text-blue-400 mb-2">⚡ Digital Moving-Out via MynaPortal</h3>
                        <p className="text-sm text-slate-400 mb-3">
                            Your Moving-Out notification (転出届) will be submitted digitally through MynaPortal.
                            You will NOT need to visit your current ward office.
                        </p>
                        <p className="text-xs text-slate-500">
                            The digital Ten-shutsu certificate will be available via your My Number Card IC chip.
                        </p>
                    </Card>

                    <Card className="border-amber-500/30 bg-amber-500/5">
                        <h3 className="font-semibold text-amber-400 mb-2">⚠️ Legal Notice</h3>
                        <p className="text-sm text-slate-400">
                            Japan GOV-OS prepares your request but does NOT submit on your behalf.
                            You will be redirected to MynaPortal (.go.jp) for the actual submission.
                            This complies with Administrative Scrivener Law Article 19.
                        </p>
                    </Card>

                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setStep("info")}>← Back</Button>
                        <a
                            href="https://myna.go.jp/SCK0101_02_001/SCK0101_02_001_InitDiscs498.form"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                        >
                            <Button className="w-full">
                                Submit via MynaPortal →
                            </Button>
                        </a>
                    </div>

                    <Button variant="ghost" onClick={() => setStep("tasks")} className="w-full">
                        Skip to Task Checklist
                    </Button>
                </div>
            )}

            {/* Step: Tasks */}
            {step === "tasks" && (
                <div className="space-y-4">
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Your Moving Checklist</h2>
                            <Badge variant="blue">{tasks.length} tasks</Badge>
                        </div>
                        <p className="text-sm text-slate-400 mb-6">
                            Complete these tasks within 14 days of your move. Estimated time: ~{tasks.length * 15} minutes at the ward office.
                        </p>

                        <div className="space-y-3">
                            {tasks.map((task, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                                >
                                    <div className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${task.status === "digital"
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-slate-700 text-slate-400"
                                        }`}>
                                        {task.status === "digital" ? "✓" : i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={task.status === "digital" ? "green" : "slate"} className="text-[10px]">
                                                {task.category}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-white mt-1">{task.task}</p>
                                        {task.note && (
                                            <p className="text-xs text-slate-500 mt-0.5">{task.note}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-emerald-500/30 bg-emerald-500/5">
                        <h3 className="font-semibold text-emerald-400 mb-2">💡 Tips for Your Ward Visit</h3>
                        <ul className="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
                            <li>Arrive early — busiest 10:00-11:00 and after lunch.</li>
                            <li>Bring your My Number Card PIN (4-digit + 6-digit).</li>
                            <li>Ask for English support at the counter (most major wards have multilingual staff).</li>
                            <li>Take a numbered ticket immediately upon entering.</li>
                        </ul>
                    </Card>

                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setStep("review")}>← Back</Button>
                        <Button variant="ghost" onClick={() => setStep("info")}>Start Over</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
