"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Shield, Users, HeadphonesIcon, BarChart3, RefreshCw, Megaphone, ArrowRight } from "lucide-react";

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
        description: "View and manage support tickets and reports",
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
        title: "Support Staff",
        description: "Manage support team members",
        href: "/admin/support/staff",
        icon: Shield,
        color: "bg-orange-500",
    },
    {
        title: "Sync Summary",
        description: "View data synchronization status",
        href: "/admin/sync-summary",
        icon: RefreshCw,
        color: "bg-cyan-500",
    },
    {
        title: "Marketing Leads",
        description: "View and manage marketing leads",
        href: "/admin/marketing/leads",
        icon: Megaphone,
        color: "bg-pink-500",
    },
];

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    // @ts-ignore - platformRole might not be in types
    const isPlatformAdmin = session?.user?.platformRole === "platform_admin";

    if (!session || !isPlatformAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                    <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-4">
                        You need platform admin privileges to access this area.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                        Return to Home <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Platform Admin</h1>
                    <p className="text-gray-600 mt-1">
                        Manage platform-wide settings and support operations
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminSections.map((section) => (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`${section.color} p-3 rounded-lg`}>
                                    <section.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {section.title}
                                    </h2>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {section.description}
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> You're logged in as{" "}
                        <span className="font-mono bg-blue-100 px-1 rounded">
                            {session.user?.email}
                        </span>{" "}
                        with platform admin access.
                    </p>
                </div>
            </div>
        </div>
    );
}
