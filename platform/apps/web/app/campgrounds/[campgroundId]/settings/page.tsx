"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DepositSettings } from "@/components/campgrounds/DepositSettings";
import { CampgroundProfileForm } from "@/components/campgrounds/CampgroundProfileForm";

export default function CampgroundSettingsPage() {
    const params = useParams();
    const campgroundId = params?.campgroundId as string;

    const campgroundQuery = useQuery({
        queryKey: ["campground", campgroundId],
        queryFn: () => apiClient.getCampground(campgroundId),
        enabled: !!campgroundId
    });

    const cg = campgroundQuery.data;

    if (campgroundQuery.isLoading) {
        return (
            <DashboardShell>
                <div className="p-6">Loading...</div>
            </DashboardShell>
        );
    }

    if (!cg) {
        return (
            <DashboardShell>
                <div className="p-6 text-red-600">Campground not found</div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell>
            <div className="space-y-6">
                <Breadcrumbs
                    items={[
                        { label: "Campgrounds", href: "/campgrounds" },
                        { label: cg.name, href: `/campgrounds/${campgroundId}` },
                        { label: "Settings" }
                    ]}
                />

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                </div>

                <div className="grid gap-6">
                    <CampgroundProfileForm campground={cg} />
                    <DepositSettings campground={cg} />
                </div>
            </div>
        </DashboardShell>
    );
}
