"use client";

import { useState } from "react";
import { Card, Badge, Button, VerifyButton, Input, Select } from "@/components/ui";

type Tab = "estimate" | "invoice" | "furusato";

export default function TaxPage() {
    const [tab, setTab] = useState<Tab>("estimate");

    // Tax Estimate
    const [income, setIncome] = useState("");
    const [incomeType, setIncomeType] = useState("employment");
    const [estimate, setEstimate] = useState<Record<string, unknown> | null>(null);

    // Invoice Calculator
    const [purchaseAmount, setPurchaseAmount] = useState("");
    const [isRegistered, setIsRegistered] = useState(true);
    const [purchaseDate, setPurchaseDate] = useState("2026-10-15");
    const [invoiceResult, setInvoiceResult] = useState<Record<string, unknown> | null>(null);

    // Furusato
    const [furusatoIncome, setFurusatoIncome] = useState("");
    const [dependents, setDependents] = useState("0");
    const [furusatoResult, setFurusatoResult] = useState<Record<string, unknown> | null>(null);

    const calculateEstimate = () => {
        const inc = parseInt(income) || 0;
        // Client-side estimate (mirrors backend logic)
        const basicDeduction = 480000;
        let empDeduction = 0;
        if (incomeType === "employment" || incomeType === "mixed") {
            if (inc <= 1625000) empDeduction = 550000;
            else if (inc <= 1800000) empDeduction = inc * 0.4 - 100000;
            else if (inc <= 3600000) empDeduction = inc * 0.3 + 80000;
            else if (inc <= 6600000) empDeduction = inc * 0.2 + 440000;
            else if (inc <= 8500000) empDeduction = inc * 0.1 + 1100000;
            else empDeduction = 1950000;
        }
        const taxableIncome = Math.max(inc - empDeduction - basicDeduction, 0);

        let incomeTax = 0;
        const brackets: [number, number, number][] = [
            [1950000, 0.05, 0], [3300000, 0.10, 97500], [6950000, 0.20, 427500],
            [9000000, 0.23, 636000], [18000000, 0.33, 1536000], [40000000, 0.40, 2796000],
            [Infinity, 0.45, 4796000],
        ];
        for (const [upper, rate, deduct] of brackets) {
            if (taxableIncome <= upper) {
                incomeTax = Math.round(taxableIncome * rate - deduct);
                break;
            }
        }
        const residenceTax = Math.round(taxableIncome * 0.10);
        const reconstructionTax = Math.round(incomeTax * 0.021);
        const totalTax = incomeTax + residenceTax + reconstructionTax;

        setEstimate({
            gross_income: inc,
            taxable_income: taxableIncome,
            employment_deduction: Math.round(empDeduction),
            income_tax: incomeTax,
            residence_tax: residenceTax,
            reconstruction_tax: reconstructionTax,
            total_tax: totalTax,
            effective_rate: inc > 0 ? (totalTax / inc * 100).toFixed(1) + "%" : "0%",
        });
    };

    const calculateInvoice = () => {
        const amount = parseInt(purchaseAmount) || 0;
        const taxRate = 0.10;
        const taxAmount = Math.round(amount * taxRate / (1 + taxRate));

        if (isRegistered) {
            setInvoiceResult({
                deductible_tax: taxAmount,
                deduction_rate: "100%",
                net_cost: amount - taxAmount,
                explanation: "Registered invoice — full input tax credit applies.",
            });
        } else {
            const yearMonth = purchaseDate.substring(0, 7).replace("-", "");
            const rate = yearMonth < "202610" ? 0.80 : 0.50;
            const rateLabel = yearMonth < "202610" ? "80%" : "50%";
            const deductible = Math.round(taxAmount * rate);
            setInvoiceResult({
                deductible_tax: deductible,
                deduction_rate: rateLabel,
                net_cost: amount - deductible,
                explanation: `Non-registered — transitional measure allows ${rateLabel} deduction.`,
            });
        }
    };

    const calculateFurusato = () => {
        const inc = parseInt(furusatoIncome) || 0;
        const deps = parseInt(dependents) || 0;
        const taxable = Math.max(inc - 480000 - 380000 * deps, 0);
        const residenceTax = Math.round(taxable * 0.10);
        const limit = Math.round(residenceTax * 0.20 * 2) + 2000;
        setFurusatoResult({
            estimated_limit: limit,
            self_burden: 2000,
            effective_deduction: limit - 2000,
            one_stop_eligible: deps <= 5,
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">💰</span>
                    <div>
                        <h1 className="text-3xl font-bold">2026 Tax & Invoice Calculator</h1>
                        <p className="text-slate-400">確定申告・インボイス — Tax Return & Invoice System</p>
                    </div>
                </div>
                <VerifyButton url="https://www.e-tax.nta.go.jp" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-slate-800 pb-1">
                {(["estimate", "invoice", "furusato"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${tab === t
                                ? "bg-slate-800 text-white border-b-2 border-blue-500"
                                : "text-slate-500 hover:text-white"
                            }`}
                    >
                        {t === "estimate" ? "📊 Tax Estimate" : t === "invoice" ? "🧾 Invoice Calculator" : "🏡 Furusato Nozei"}
                    </button>
                ))}
            </div>

            {/* Tax Estimate */}
            {tab === "estimate" && (
                <div className="space-y-4">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Income Tax Estimate</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Annual Income (JPY)" value={income} onChange={setIncome} placeholder="5000000" type="number" required />
                            <Select
                                label="Income Type"
                                value={incomeType}
                                onChange={setIncomeType}
                                options={[
                                    { value: "employment", label: "Employment (会社員)" },
                                    { value: "freelance", label: "Freelance (フリーランス)" },
                                    { value: "mixed", label: "Mixed (複合)" },
                                ]}
                            />
                        </div>
                        <Button onClick={calculateEstimate} className="mt-4" disabled={!income}>
                            Calculate
                        </Button>
                    </Card>

                    {estimate && (
                        <Card>
                            <h3 className="font-semibold text-white mb-4">Tax Breakdown</h3>
                            <div className="space-y-3">
                                {[
                                    ["Gross Income", `¥${(estimate.gross_income as number).toLocaleString()}`],
                                    ["Employment Deduction", `−¥${(estimate.employment_deduction as number).toLocaleString()}`],
                                    ["Basic Deduction", "−¥480,000"],
                                    ["Taxable Income", `¥${(estimate.taxable_income as number).toLocaleString()}`],
                                ].map(([label, value], i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-slate-400">{label}</span>
                                        <span className="text-white font-mono">{value}</span>
                                    </div>
                                ))}
                                <hr className="border-slate-700" />
                                {[
                                    ["Income Tax (所得税)", `¥${(estimate.income_tax as number).toLocaleString()}`],
                                    ["Residence Tax (住民税)", `¥${(estimate.residence_tax as number).toLocaleString()}`],
                                    ["Reconstruction Tax", `¥${(estimate.reconstruction_tax as number).toLocaleString()}`],
                                ].map(([label, value], i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-slate-400">{label}</span>
                                        <span className="text-white font-mono">{value}</span>
                                    </div>
                                ))}
                                <hr className="border-slate-700" />
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-white">Total Estimated Tax</span>
                                    <span className="text-blue-400 font-mono text-lg">¥{(estimate.total_tax as number).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Effective Rate</span>
                                    <span className="text-slate-300">{estimate.effective_rate as string}</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <VerifyButton url="https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm" label="Verify Tax Brackets" />
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Invoice Calculator */}
            {tab === "invoice" && (
                <div className="space-y-4">
                    <Card className="border-blue-500/30 bg-blue-500/5">
                        <h3 className="font-semibold text-blue-400 mb-2">October 2026 Invoice Transition</h3>
                        <p className="text-sm text-slate-400">
                            From October 2026, the transitional deduction rate for non-registered purchases drops from 80% to <strong className="text-white">50%</strong>.
                            After September 2029, no deduction will be available for non-registered invoices.
                        </p>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Input Tax Credit Calculator</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Purchase Amount (JPY, tax-inclusive)" value={purchaseAmount} onChange={setPurchaseAmount} placeholder="110000" type="number" required />
                            <Input label="Purchase Date" value={purchaseDate} onChange={setPurchaseDate} type="date" />
                        </div>
                        <label className="flex items-center gap-3 text-sm text-slate-400 mt-4 cursor-pointer">
                            <input type="checkbox" checked={isRegistered} onChange={(e) => setIsRegistered(e.target.checked)} className="rounded bg-slate-800 border-slate-600" />
                            Seller has a registered invoice number (T-number)
                        </label>
                        <Button onClick={calculateInvoice} className="mt-4" disabled={!purchaseAmount}>
                            Calculate Deduction
                        </Button>
                    </Card>

                    {invoiceResult && (
                        <Card>
                            <h3 className="font-semibold text-white mb-3">Result</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Deductible Tax</span>
                                    <span className="text-emerald-400 font-mono">¥{(invoiceResult.deductible_tax as number).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Deduction Rate</span>
                                    <Badge variant={invoiceResult.deduction_rate === "100%" ? "green" : "yellow"}>
                                        {invoiceResult.deduction_rate as string}
                                    </Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Net Cost</span>
                                    <span className="text-white font-mono">¥{(invoiceResult.net_cost as number).toLocaleString()}</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-3">{invoiceResult.explanation as string}</p>
                        </Card>
                    )}
                </div>
            )}

            {/* Furusato Nozei */}
            {tab === "furusato" && (
                <div className="space-y-4">
                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Furusato Nozei Limit Calculator</h2>
                        <p className="text-sm text-slate-400 mb-4">
                            Estimate how much you can donate through the Hometown Tax (ふるさと納税) program and receive as a tax deduction.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Annual Income (JPY)" value={furusatoIncome} onChange={setFurusatoIncome} placeholder="5000000" type="number" required />
                            <Input label="Number of Dependents" value={dependents} onChange={setDependents} type="number" />
                        </div>
                        <Button onClick={calculateFurusato} className="mt-4" disabled={!furusatoIncome}>
                            Calculate Limit
                        </Button>
                    </Card>

                    {furusatoResult && (
                        <Card>
                            <h3 className="font-semibold text-white mb-3">Your Furusato Nozei Limit</h3>
                            <div className="text-center py-4">
                                <p className="text-4xl font-bold text-blue-400 font-mono">
                                    ¥{(furusatoResult.estimated_limit as number).toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">Estimated maximum donation</p>
                            </div>
                            <div className="space-y-2 mt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Self-burden</span>
                                    <span className="text-white font-mono">¥2,000</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Effective Deduction</span>
                                    <span className="text-emerald-400 font-mono">¥{(furusatoResult.effective_deduction as number).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">One-Stop Eligible</span>
                                    <Badge variant={furusatoResult.one_stop_eligible ? "green" : "red"}>
                                        {furusatoResult.one_stop_eligible ? "Yes" : "No — must file tax return"}
                                    </Badge>
                                </div>
                            </div>
                            <div className="mt-4">
                                <VerifyButton url="https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/mechanism/deduction.html" label="Verify Furusato Rules" />
                            </div>
                        </Card>
                    )}

                    <Card className="border-emerald-500/30 bg-emerald-500/5">
                        <h3 className="font-semibold text-emerald-400 mb-2">One-Stop Exception (ワンストップ特例)</h3>
                        <p className="text-sm text-slate-400">
                            If you&apos;re a salaried employee donating to 5 or fewer municipalities, you can use the One-Stop form
                            instead of filing a tax return. Submit to each municipality by January 10 of the following year.
                        </p>
                    </Card>
                </div>
            )}
        </div>
    );
}
