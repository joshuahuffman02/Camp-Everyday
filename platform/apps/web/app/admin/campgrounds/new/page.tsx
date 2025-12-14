"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

function getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("campreserv:authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "Pacific/Honolulu",
];

const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export default function CreateCampgroundPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        slug: "",
        city: "",
        state: "",
        country: "USA",
        timezone: "America/Chicago",
        phone: "",
        email: "",
        website: "",
    });

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    const handleNameChange = (name: string) => {
        setForm((prev) => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const base = process.env.NEXT_PUBLIC_API_BASE || "";
            const res = await fetch(`${base}/campgrounds`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                credentials: "include",
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || `Failed to create campground (${res.status})`);
            }

            const campground = await res.json();
            router.push(`/campgrounds/${campground.id}`);
        } catch (err: any) {
            setError(err.message || "Failed to create campground");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin"
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Create Campground</h1>
                    <p className="text-slate-400 mt-1">Add a new campground to the platform</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Building2 className="h-5 w-5 text-slate-400" />
                        <h2 className="text-lg font-semibold text-white">Basic Info</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Campground Name *
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Pine Valley RV Resort"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            URL Slug *
                        </label>
                        <input
                            type="text"
                            value={form.slug}
                            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                            required
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="pine-valley-rv-resort"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Used in URLs: /park/{form.slug || "your-slug"}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                City *
                            </label>
                            <input
                                type="text"
                                value={form.city}
                                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                                required
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                State *
                            </label>
                            <select
                                value={form.state}
                                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                                required
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select state</option>
                                {states.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Timezone *
                        </label>
                        <select
                            value={form.timezone}
                            onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                            required
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {timezones.map((tz) => (
                                <option key={tz} value={tz}>
                                    {tz}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">Contact (Optional)</h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="(555) 123-4567"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="info@campground.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Website</label>
                        <input
                            type="url"
                            value={form.website}
                            onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://campground.com"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link
                        href="/admin"
                        className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {loading ? "Creating..." : "Create Campground"}
                    </button>
                </div>
            </form>
        </div>
    );
}
