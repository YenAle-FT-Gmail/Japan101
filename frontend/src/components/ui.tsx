import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
    return (
        <div
            className={`rounded-2xl border border-slate-800 bg-slate-900/50 p-6 ${hover ? "hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer" : ""
                } ${className}`}
        >
            {children}
        </div>
    );
}

interface BadgeProps {
    children: ReactNode;
    variant?: "blue" | "green" | "yellow" | "red" | "slate";
    className?: string;
}

const BADGE_VARIANTS = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    yellow: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export function Badge({ children, variant = "blue", className = "" }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${BADGE_VARIANTS[variant]} ${className}`}
        >
            {children}
        </span>
    );
}

interface ButtonProps {
    children: ReactNode;
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit";
}

const BTN_VARIANTS = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",
    ghost: "hover:bg-slate-800 text-slate-400 hover:text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white",
};

const BTN_SIZES = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
};

export function Button({
    children,
    variant = "primary",
    size = "md",
    className = "",
    onClick,
    disabled,
    type = "button",
}: ButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
        >
            {children}
        </button>
    );
}

interface VerifyButtonProps {
    url: string;
    label?: string;
}

export function VerifyButton({ url, label = "Verify Original" }: VerifyButtonProps) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
        >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
            </svg>
            {label}
            <span className="text-slate-500">.go.jp</span>
        </a>
    );
}

interface InputProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: string;
    hint?: string;
    required?: boolean;
}

export function Input({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    hint,
    required,
}: InputProps) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
            />
            {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
    );
}

interface SelectProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
    hint?: string;
}

export function Select({ label, value, onChange, options, hint }: SelectProps) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
    );
}

interface StepIndicatorProps {
    steps: { label: string; status: "complete" | "current" | "upcoming" }[];
}

export function StepIndicator({ steps }: StepIndicatorProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${step.status === "complete"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : step.status === "current"
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                    >
                        {step.status === "complete" ? "✓" : i + 1}
                    </div>
                    <span
                        className={`text-xs font-medium whitespace-nowrap ${step.status === "complete"
                                ? "text-emerald-400"
                                : step.status === "current"
                                    ? "text-blue-400"
                                    : "text-slate-500"
                            }`}
                    >
                        {step.label}
                    </span>
                    {i < steps.length - 1 && (
                        <div
                            className={`w-8 h-px ${step.status === "complete" ? "bg-emerald-500/40" : "bg-slate-700"
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
