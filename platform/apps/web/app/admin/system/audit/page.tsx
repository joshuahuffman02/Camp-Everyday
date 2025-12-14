"use client";

import { useState, useMemo } from "react";
import { History, User, Settings, Database, Search, Filter } from "lucide-react";

type AuditEntry = {
    id: string;
    timestamp: Date;
    user: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: string;
    ip?: string;
};

// Stub data for demonstration
const stubAuditLog: AuditEntry[] = [
    {
        id: "1",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        user: "admin@campeveryday.com",
        userId: "user-1",
        action: "CREATE",
        resource: "Campground",
        resourceId: "cg-123",
        details: "Created 'Pine Valley RV Resort'",
        ip: "192.168.1.1",
    },
    {
        id: "2",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        user: "josh@campeveryday.com",
        userId: "user-2",
        action: "UPDATE",
        resource: "User",
        resourceId: "user-5",
        details: "Changed platformRole to 'platform_admin'",
        ip: "192.168.1.2",
    },
    {
        id: "3",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        user: "admin@campeveryday.com",
        userId: "user-1",
        action: "DELETE",
        resource: "Reservation",
        resourceId: "res-456",
        details: "Cancelled reservation #456",
        ip: "192.168.1.1",
    },
    {
        id: "4",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        user: "system",
        userId: "system",
        action: "SYNC",
        resource: "OTA",
        details: "Synced 15 reservations from Hipcamp",
        ip: "internal",
    },
    {
        id: "5",
        timestamp: new Date(Date.now() - 1000 * 60 * 90),
        user: "josh@campeveryday.com",
        userId: "user-2",
        action: "LOGIN",
        resource: "Auth",
        details: "Successful login",
        ip: "192.168.1.2",
    },
    {
        id: "6",
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        user: "admin@campeveryday.com",
        userId: "user-1",
        action: "UPDATE",
        resource: "Settings",
        details: "Changed timezone to America/Chicago",
        ip: "192.168.1.1",
    },
];

const actionColors: Record<string, string> = {
    CREATE: "bg-emerald-500/20 text-emerald-400",
    UPDATE: "bg-blue-500/20 text-blue-400",
    DELETE: "bg-red-500/20 text-red-400",
    LOGIN: "bg-purple-500/20 text-purple-400",
    SYNC: "bg-cyan-500/20 text-cyan-400",
};

const resourceIcons: Record<string, typeof User> = {
    Campground: Database,
    User: User,
    Reservation: History,
    Settings: Settings,
    Auth: User,
    OTA: Database,
};

export default function AuditLogPage() {
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [resourceFilter, setResourceFilter] = useState<string>("all");

    const filtered = useMemo(() => {
        return stubAuditLog.filter((entry) => {
            if (actionFilter !== "all" && entry.action !== actionFilter) return false;
            if (resourceFilter !== "all" && entry.resource !== resourceFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                return (
                    entry.user.toLowerCase().includes(q) ||
                    entry.details?.toLowerCase().includes(q) ||
                    entry.resource.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [search, actionFilter, resourceFilter]);

    const actions = [...new Set(stubAuditLog.map((e) => e.action))];
    const resources = [...new Set(stubAuditLog.map((e) => e.resource))];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Audit Log</h1>
                <p className="text-slate-400 mt-1">
                    Track all admin actions and system events
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by user, action, or details..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Actions</option>
                        {actions.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                    <select
                        value={resourceFilter}
                        onChange={(e) => setResourceFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Resources</option>
                        {resources.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Log Entries */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <div className="divide-y divide-slate-700">
                    {filtered.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            No audit entries found
                        </div>
                    )}
                    {filtered.map((entry) => {
                        const Icon = resourceIcons[entry.resource] || History;
                        return (
                            <div key={entry.id} className="p-4 hover:bg-slate-750 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-slate-700 rounded-lg">
                                        <Icon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${actionColors[entry.action] || "bg-slate-700 text-slate-300"}`}>
                                                {entry.action}
                                            </span>
                                            <span className="text-white font-medium">{entry.resource}</span>
                                            {entry.resourceId && (
                                                <span className="text-slate-500 text-sm font-mono">{entry.resourceId}</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-300 mt-1">{entry.details}</div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                                            <span>by {entry.user}</span>
                                            <span>{entry.timestamp.toLocaleString()}</span>
                                            {entry.ip && <span>IP: {entry.ip}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="text-sm text-slate-500 text-center">
                Showing {filtered.length} of {stubAuditLog.length} entries • Data is stubbed for demo
            </div>
        </div>
    );
}
