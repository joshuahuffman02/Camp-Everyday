"use client";

import Link from "next/link";
import { Users, HeadphonesIcon, BarChart3, RefreshCw, Megaphone, Building2, ArrowRight } from "lucide-react";

const adminSections = [
    {
        title: "Platform Users",
        description: "Manage all users across the platform",
        href: "/admin/platform/users",
        icon: Users,
        color: "bg-blue-500",
    },
    {
        title: "Support Dashboard",
        description: "View and manage support tickets",
        href: "/admin/support",
        icon: HeadphonesIcon,
        color: "bg-purple-500",
    },
    {
        title: "Support Analytics",
        description: "Track support metrics and trends",
        href: "/admin/support/analytics",
        icon: BarChart3,
        color: "bg-green-500",
    },
    {
        title: "Marketing Leads",
        description: "View and manage marketing leads",
        href: "/admin/marketing/leads",
        icon: Megaphone,
        color: "bg-pink-500",
    },
    {
        title: "Sync Summary",
        description: "View data synchronization status",
        href: "/admin/sync-summary",
        icon: RefreshCw,
        color: "bg-cyan-500",
    },
    {
        title: "Create Campground",
        description: "Add a new campground to the platform",
        href: "/admin/campgrounds/new",
        icon: Building2,
        color: "bg-orange-500",
    },
];

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Admin</h1>
                <p className="text-slate-400 mt-1">
                    Manage platform-wide settings and support operations
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminSections.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        className="bg-slate-800 rounded-lg border border-slate-700 p-5 hover:border-slate-600 hover:bg-slate-750 transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`${section.color} p-3 rounded-lg`}>
                                <section.icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                                    {section.title}
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    {section.description}
                                </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
