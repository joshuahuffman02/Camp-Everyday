"use client";

import { useState } from "react";
import { Flag, ToggleLeft, ToggleRight, Search, Building2, Globe } from "lucide-react";

type FeatureFlag = {
    id: string;
    name: string;
    key: string;
    description: string;
    enabled: boolean;
    scope: "global" | "campground";
    campgrounds?: string[]; // Enabled for specific campgrounds
};

// Stub data
const stubFlags: FeatureFlag[] = [
    {
        id: "1",
        name: "AI Suggestions",
        key: "ai_suggestions",
        description: "Enable AI-powered recommendations for guests and staff",
        enabled: true,
        scope: "campground",
        campgrounds: ["Camp Everyday - Riverbend"],
    },
    {
        id: "2",
        name: "Beta Booking Flow",
        key: "beta_booking_v2",
        description: "New streamlined booking experience with fewer steps",
        enabled: false,
        scope: "global",
    },
    {
        id: "3",
        name: "Guest Portal",
        key: "guest_portal",
        description: "Allow guests to view/manage their reservations online",
        enabled: true,
        scope: "global",
    },
    {
        id: "4",
        name: "POS Integration",
        key: "pos_integration",
        description: "Enable point-of-sale system for camp stores",
        enabled: true,
        scope: "campground",
        campgrounds: ["Camp Everyday - Riverbend", "Pine Lake"],
    },
    {
        id: "5",
        name: "Kiosk Mode",
        key: "kiosk_mode",
        description: "Self-service check-in kiosk for guests",
        enabled: false,
        scope: "campground",
    },
    {
        id: "6",
        name: "Dark Mode",
        key: "dark_mode",
        description: "Dark theme for staff dashboard",
        enabled: true,
        scope: "global",
    },
    {
        id: "7",
        name: "Analytics Dashboard",
        key: "analytics_v2",
        description: "Enhanced analytics with custom date ranges",
        enabled: false,
        scope: "global",
    },
    {
        id: "8",
        name: "SMS Notifications",
        key: "sms_notifications",
        description: "Send SMS updates to guests",
        enabled: true,
        scope: "campground",
        campgrounds: ["Camp Everyday - Riverbend"],
    },
];

export default function FeatureFlagsPage() {
    const [flags, setFlags] = useState<FeatureFlag[]>(stubFlags);
    const [search, setSearch] = useState("");
    const [scopeFilter, setScopeFilter] = useState<string>("all");

    const toggleFlag = (id: string) => {
        setFlags((prev) =>
            prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
        );
    };

    const filtered = flags.filter((flag) => {
        if (scopeFilter !== "all" && flag.scope !== scopeFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                flag.name.toLowerCase().includes(q) ||
                flag.key.toLowerCase().includes(q) ||
                flag.description.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const enabledCount = flags.filter((f) => f.enabled).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
                    <p className="text-slate-400 mt-1">
                        Enable or disable features across the platform
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white">{enabledCount}/{flags.length}</div>
                    <div className="text-sm text-slate-400">Features enabled</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search features..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={scopeFilter}
                    onChange={(e) => setScopeFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Scopes</option>
                    <option value="global">Global</option>
                    <option value="campground">Per Campground</option>
                </select>
            </div>

            {/* Flags Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((flag) => (
                    <div
                        key={flag.id}
                        className={`bg-slate-800 rounded-lg border p-4 transition-colors ${flag.enabled ? "border-emerald-500/30" : "border-slate-700"
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${flag.enabled ? "bg-emerald-500/20" : "bg-slate-700"}`}>
                                    <Flag className={`h-4 w-4 ${flag.enabled ? "text-emerald-400" : "text-slate-400"}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{flag.name}</span>
                                        <span className="text-xs font-mono text-slate-500">{flag.key}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">{flag.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {flag.scope === "global" ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                <Globe className="h-3 w-3" /> Global
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                <Building2 className="h-3 w-3" /> Per Campground
                                            </span>
                                        )}
                                        {flag.campgrounds && flag.campgrounds.length > 0 && (
                                            <span className="text-xs text-slate-500">
                                                ({flag.campgrounds.length} enabled)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleFlag(flag.id)}
                                className="flex-shrink-0 p-1 hover:bg-slate-700 rounded transition-colors"
                            >
                                {flag.enabled ? (
                                    <ToggleRight className="h-8 w-8 text-emerald-400" />
                                ) : (
                                    <ToggleLeft className="h-8 w-8 text-slate-500" />
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-sm text-slate-500 text-center">
                Changes are saved automatically • Data is stubbed for demo
            </div>
        </div>
    );
}
