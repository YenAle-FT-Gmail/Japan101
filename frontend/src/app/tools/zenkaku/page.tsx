"use client";

import { useState } from "react";
import { Card, Badge, Button, VerifyButton, Input } from "@/components/ui";

// ── Zenkaku conversion (client-side mirror of backend) ──────────────────
const HW_TO_FW_OFFSET = 0xfee0;

function asciiToFullwidth(text: string): string {
    return [...text]
        .map((ch) => {
            const cp = ch.codePointAt(0)!;
            if (cp >= 0x21 && cp <= 0x7e) return String.fromCodePoint(cp + HW_TO_FW_OFFSET);
            if (ch === " ") return "\u3000";
            return ch;
        })
        .join("");
}

const ERAS: [string, string, Date][] = [
    ["令和", "Reiwa", new Date("2019-05-01")],
    ["平成", "Heisei", new Date("1989-01-08")],
    ["昭和", "Showa", new Date("1926-12-25")],
    ["大正", "Taisho", new Date("1912-07-30")],
    ["明治", "Meiji", new Date("1868-01-25")],
];

function dateToEra(dateStr: string): { kanji: string; romaji: string; year: number; formatted: string } | null {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    for (const [kanji, romaji, start] of ERAS) {
        if (d >= start) {
            const year = d.getFullYear() - start.getFullYear() + 1;
            return {
                kanji,
                romaji,
                year,
                formatted: `${kanji}${year}年${d.getMonth() + 1}月${d.getDate()}日`,
            };
        }
    }
    return null;
}

const ROMAJI_MAP: Record<string, string> = {
    a: "ア", i: "イ", u: "ウ", e: "エ", o: "オ",
    ka: "カ", ki: "キ", ku: "ク", ke: "ケ", ko: "コ",
    sa: "サ", shi: "シ", su: "ス", se: "セ", so: "ソ",
    ta: "タ", chi: "チ", tsu: "ツ", te: "テ", to: "ト",
    na: "ナ", ni: "ニ", nu: "ヌ", ne: "ネ", no: "ノ",
    ha: "ハ", hi: "ヒ", fu: "フ", he: "ヘ", ho: "ホ",
    ma: "マ", mi: "ミ", mu: "ム", me: "メ", mo: "モ",
    ya: "ヤ", yu: "ユ", yo: "ヨ",
    ra: "ラ", ri: "リ", ru: "ル", re: "レ", ro: "ロ",
    wa: "ワ", wo: "ヲ", n: "ン",
    ga: "ガ", gi: "ギ", gu: "グ", ge: "ゲ", go: "ゴ",
    za: "ザ", ji: "ジ", zu: "ズ", ze: "ゼ", zo: "ゾ",
    da: "ダ", de: "デ", do: "ド",
    ba: "バ", bi: "ビ", bu: "ブ", be: "ベ", bo: "ボ",
    pa: "パ", pi: "ピ", pu: "プ", pe: "ペ", po: "ポ",
    sha: "シャ", shu: "シュ", sho: "ショ",
    cha: "チャ", chu: "チュ", cho: "チョ",
    kya: "キャ", kyu: "キュ", kyo: "キョ",
    nya: "ニャ", nyu: "ニュ", nyo: "ニョ",
    ja: "ジャ", ju: "ジュ", jo: "ジョ",
};

function romajiToKatakana(text: string): string {
    const lower = text.toLowerCase();
    const result: string[] = [];
    let i = 0;
    while (i < lower.length) {
        let matched = false;
        for (const len of [3, 2, 1]) {
            const chunk = lower.substring(i, i + len);
            if (ROMAJI_MAP[chunk]) {
                result.push(ROMAJI_MAP[chunk]);
                i += len;
                matched = true;
                break;
            }
        }
        if (!matched) {
            if (lower[i] === " ") result.push("・");
            else if (lower[i] === "-") result.push("ー");
            else result.push(asciiToFullwidth(lower[i].toUpperCase()));
            i++;
        }
    }
    return result.join("");
}

type Tool = "fullwidth" | "date" | "katakana" | "normalize";

export default function ZenkakuPage() {
    const [tool, setTool] = useState<Tool>("fullwidth");

    // Fullwidth
    const [fwInput, setFwInput] = useState("SMITH JOHN");
    const fwOutput = asciiToFullwidth(fwInput);

    // Date
    const [dateInput, setDateInput] = useState("1990-05-15");
    const eraOutput = dateToEra(dateInput);

    // Katakana
    const [kataInput, setKataInput] = useState("SMITH JOHN");
    const kataOutput = romajiToKatakana(kataInput);

    // Normalize all
    const [normName, setNormName] = useState("JOHN SMITH");
    const [normDob, setNormDob] = useState("1990-05-15");
    const [normAddr, setNormAddr] = useState("1-2-3 Roppongi, Minato-ku");
    const [normPhone, setNormPhone] = useState("03-1234-5678");

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">🔤</span>
                    <div>
                        <h1 className="text-3xl font-bold">Zenkaku Normalization Engine</h1>
                        <p className="text-slate-400">Convert Western data formats to Japanese administrative requirements</p>
                    </div>
                </div>
            </div>

            {/* Tool Tabs */}
            <div className="flex gap-1 mb-6 border-b border-slate-800 pb-1 overflow-x-auto">
                {(["fullwidth", "date", "katakana", "normalize"] as Tool[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTool(t)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${tool === t ? "bg-slate-800 text-white border-b-2 border-blue-500" : "text-slate-500 hover:text-white"
                            }`}
                    >
                        {t === "fullwidth" ? "Ａ Full-width" : t === "date" ? "📅 Date → Era" : t === "katakana" ? "カ Katakana" : "✨ Normalize All"}
                    </button>
                ))}
            </div>

            {/* Full-width */}
            {tool === "fullwidth" && (
                <div className="space-y-4">
                    <Card>
                        <h2 className="text-xl font-semibold mb-2">ASCII → Full-width (全角)</h2>
                        <p className="text-sm text-slate-400 mb-4">
                            Japanese government forms require full-width characters. Type in English and see the full-width conversion instantly.
                        </p>
                        <Input label="Input (ASCII)" value={fwInput} onChange={setFwInput} placeholder="SMITH JOHN" />
                        <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
                            <label className="text-xs text-slate-500 block mb-1">Full-width Output (全角)</label>
                            <p className="text-2xl font-mono text-blue-400 break-all">{fwOutput || "—"}</p>
                        </div>
                        <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigator.clipboard.writeText(fwOutput)}>
                            📋 Copy Full-width
                        </Button>
                    </Card>
                    <Card className="border-slate-700 bg-slate-800/30">
                        <h3 className="text-sm font-medium text-slate-300 mb-2">When to use full-width?</h3>
                        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                            <li>Name fields on residency forms (転入届)</li>
                            <li>Address fields on any government form</li>
                            <li>Phone numbers on some ward forms</li>
                            <li>Basically any text field that says 全角 (zenkaku)</li>
                        </ul>
                    </Card>
                </div>
            )}

            {/* Date → Era */}
            {tool === "date" && (
                <div className="space-y-4">
                    <Card>
                        <h2 className="text-xl font-semibold mb-2">Western Date → Japanese Era</h2>
                        <p className="text-sm text-slate-400 mb-4">
                            Many government forms require dates in the Japanese Era format (令和, 平成, 昭和).
                        </p>
                        <Input label="Date (YYYY-MM-DD)" value={dateInput} onChange={setDateInput} type="date" />
                        {eraOutput && (
                            <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
                                <label className="text-xs text-slate-500 block mb-1">Japanese Era Format</label>
                                <p className="text-2xl font-mono text-blue-400">{eraOutput.formatted}</p>
                                <p className="text-sm text-slate-400 mt-2">
                                    {eraOutput.romaji} {eraOutput.year} ({eraOutput.kanji}{eraOutput.year}年)
                                </p>
                            </div>
                        )}
                    </Card>
                    <Card className="border-slate-700 bg-slate-800/30">
                        <h3 className="text-sm font-medium text-slate-300 mb-2">Era Reference</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                            <div>令和 (Reiwa): 2019/5/1 ~ present</div>
                            <div>平成 (Heisei): 1989/1/8 ~ 2019/4/30</div>
                            <div>昭和 (Showa): 1926/12/25 ~ 1989/1/7</div>
                            <div>大正 (Taisho): 1912/7/30 ~ 1926/12/24</div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Katakana */}
            {tool === "katakana" && (
                <div className="space-y-4">
                    <Card>
                        <h2 className="text-xl font-semibold mb-2">Romaji → Katakana</h2>
                        <p className="text-sm text-slate-400 mb-4">
                            Convert your name from English to katakana. Used for the フリガナ (furigana) field on forms.
                        </p>
                        <Input label="Name in Romaji" value={kataInput} onChange={setKataInput} placeholder="SMITH JOHN" />
                        <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
                            <label className="text-xs text-slate-500 block mb-1">Katakana Output</label>
                            <p className="text-2xl font-mono text-blue-400">{kataOutput || "—"}</p>
                        </div>
                        <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigator.clipboard.writeText(kataOutput)}>
                            📋 Copy Katakana
                        </Button>
                    </Card>
                    <Card className="border-amber-500/30 bg-amber-500/5">
                        <h3 className="text-sm font-medium text-amber-400 mb-2">⚠️ Important</h3>
                        <p className="text-xs text-slate-400">
                            This is an approximate conversion. Japanese katakana for foreign names can vary.
                            Check your Residence Card (在留カード) for the official katakana spelling of your name.
                        </p>
                    </Card>
                </div>
            )}

            {/* Normalize All */}
            {tool === "normalize" && (
                <div className="space-y-4">
                    <Card>
                        <h2 className="text-xl font-semibold mb-2">Full Form Normalization</h2>
                        <p className="text-sm text-slate-400 mb-4">
                            Convert all your information at once — ready for Japanese government forms.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Full Name (ASCII)" value={normName} onChange={setNormName} placeholder="JOHN SMITH" />
                            <Input label="Date of Birth" value={normDob} onChange={setNormDob} type="date" />
                            <Input label="Address (ASCII)" value={normAddr} onChange={setNormAddr} placeholder="1-2-3 Roppongi" />
                            <Input label="Phone Number" value={normPhone} onChange={setNormPhone} placeholder="03-1234-5678" />
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-white mb-4">Normalized Output</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Name (Full-width)", value: asciiToFullwidth(normName), field: "Full-width text field" },
                                { label: "Name (Katakana)", value: romajiToKatakana(normName), field: "フリガナ field" },
                                { label: "Birthday (Era)", value: dateToEra(normDob)?.formatted || "—", field: "Date field (和暦)" },
                                { label: "Address (Full-width)", value: asciiToFullwidth(normAddr), field: "Address field" },
                                { label: "Phone (Full-width)", value: asciiToFullwidth(normPhone), field: "Phone field" },
                            ].map((item, i) => (
                                <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-slate-500">{item.label}</span>
                                        <Badge variant="slate">{item.field}</Badge>
                                    </div>
                                    <p className="text-lg font-mono text-blue-400 break-all">{item.value}</p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(item.value)}
                                        className="text-xs text-slate-500 hover:text-white mt-1 transition-colors"
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
