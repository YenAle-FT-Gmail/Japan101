/**
 * Japan GOV-OS API Client
 * Typed fetch wrapper for all backend endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || `API error: ${res.status}`);
    }
    return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────

export const auth = {
    startOIDC: () => request<{ authorization_url: string; state: string }>("/auth/start"),
    callback: (code: string, state: string) =>
        request<{ access_token: string }>(`/auth/callback?code=${code}&state=${state}`),
    logout: () => request("/auth/logout", { method: "POST" }),
};

// ── Zenkaku ──────────────────────────────────────────────────────────────

export const zenkaku = {
    toFullwidth: (text: string) =>
        request<{ original: string; fullwidth: string }>("/zenkaku/to-fullwidth", {
            method: "POST",
            body: JSON.stringify({ text }),
        }),
    toAscii: (text: string) =>
        request<{ original: string; ascii: string }>("/zenkaku/to-ascii", {
            method: "POST",
            body: JSON.stringify({ text }),
        }),
    dateToEra: (date: string) =>
        request<{
            era_kanji: string;
            era_romaji: string;
            year: number;
            formatted: string;
        }>("/zenkaku/date-to-era", {
            method: "POST",
            body: JSON.stringify({ date }),
        }),
    romajiToKatakana: (romaji: string) =>
        request<{ original: string; katakana: string; hiragana: string }>(
            "/zenkaku/romaji-to-katakana",
            { method: "POST", body: JSON.stringify({ romaji }) }
        ),
    normalizeAll: (data: {
        name_ascii?: string;
        birthday?: string;
        address_ascii?: string;
        phone?: string;
    }) =>
        request("/zenkaku/normalize-all", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// ── Municipal ────────────────────────────────────────────────────────────

export interface Ward {
    ward_id: string;
    name_en: string;
    name_ja: string;
    prefecture: string;
    gov_cloud_status: "migrated" | "legacy" | "partial";
    portal_url: string;
    reservation_api?: string;
    notes?: string;
}

export interface Procedure {
    form_id: string;
    name_en: string;
    name_ja: string;
    description: string;
    category: string;
    required_documents: string[];
    estimated_time_minutes: number;
    can_do_online: boolean;
    gov_url: string;
    related_forms?: string[];
}

export const municipal = {
    getWards: (params?: { prefecture?: string; status?: string }) => {
        const qs = params
            ? "?" + new URLSearchParams(params as Record<string, string>).toString()
            : "";
        return request<{ wards: Ward[]; total: number }>(`/municipal/wards${qs}`);
    },
    getWard: (wardId: string) => request<Ward>(`/municipal/wards/${wardId}`),
    getProcedures: (category?: string) => {
        const qs = category ? `?category=${category}` : "";
        return request<{ procedures: Procedure[]; total: number }>(
            `/municipal/procedures${qs}`
        );
    },
    getProcedure: (formId: string) =>
        request<Procedure>(`/municipal/procedures/${formId}`),
    getSteps: (formId: string, wardId: string) =>
        request(`/municipal/procedures/${formId}/steps?ward_id=${wardId}`),
};

// ── Tax ──────────────────────────────────────────────────────────────────

export const tax = {
    calculateInvoice: (data: {
        purchase_amount: number;
        is_registered_invoice: boolean;
        purchase_date: string;
        tax_rate?: number;
    }) =>
        request("/tax/invoice/calculate", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    simplifiedTax: (data: {
        annual_sales: number;
        business_category: number;
    }) =>
        request("/tax/simplified", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    furusatoLimit: (data: {
        annual_income: number;
        dependents?: number;
        social_insurance?: number;
        is_one_stop?: boolean;
    }) =>
        request("/tax/furusato/limit", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    fullEstimate: (data: {
        annual_income: number;
        income_type: string;
        deductions?: Record<string, number>;
        is_invoice_registered?: boolean;
        business_category?: number;
    }) =>
        request("/tax/estimate", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// ── Hikkoshi ─────────────────────────────────────────────────────────────

export const hikkoshi = {
    start: (data: {
        current_ward_id: string;
        destination_ward_id: string;
        moving_date: string;
        household_members?: number;
        has_school_children?: boolean;
        has_vehicle?: boolean;
        is_pet_owner?: boolean;
    }) =>
        request("/hikkoshi/start", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    reserve: (data: {
        destination_ward_id: string;
        preferred_date: string;
        preferred_time?: string;
        reference_number: string;
        services_needed?: string[];
    }) =>
        request("/hikkoshi/reserve", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getTasks: (data: {
        current_ward_id: string;
        destination_ward_id: string;
        moving_date: string;
        household_members?: number;
        has_school_children?: boolean;
        has_vehicle?: boolean;
        is_pet_owner?: boolean;
    }) =>
        request("/hikkoshi/tasks", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// ── Visa ─────────────────────────────────────────────────────────────────

export const visa = {
    getFees: () => request("/visa/fees"),
    calculateFee: (data: {
        application_type: string;
        visa_category?: string;
    }) =>
        request("/visa/fees/calculate", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getCategories: () => request("/visa/categories"),
    getCategory: (key: string) => request(`/visa/categories/${key}`),
    generateXML: (data: Record<string, unknown>) =>
        request("/visa/xml-draft", {
            method: "POST",
            body: JSON.stringify(data),
        }),
};

// ── Search ───────────────────────────────────────────────────────────────

export interface SearchResult {
    form_id: string;
    title: string;
    title_ja: string;
    category: string;
    description: string;
    relevance_score: number;
    url: string;
    gov_url: string;
    logic_flow?: string;
}

export const search = {
    query: (q: string, limit = 5) =>
        request<{ query: string; results: SearchResult[]; total_matches: number }>(
            `/search/?q=${encodeURIComponent(q)}&limit=${limit}`
        ),
    allProcedures: () => request("/search/all"),
};

// ── PDF Overlay ──────────────────────────────────────────────────────────

export const pdf = {
    listForms: () => request("/pdf/forms"),
    getFormOverlay: (formId: string) => request(`/pdf/forms/${formId}`),
    prefillForm: (formId: string, userData: Record<string, string>) =>
        request(`/pdf/forms/${formId}/prefill`, {
            method: "POST",
            body: JSON.stringify({ form_id: formId, user_data: userData }),
        }),
};
