"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { DashboardShell } from "../../../components/ui/layout/DashboardShell";
import { BlackoutList } from "../../../components/settings/BlackoutList";

export default function BlackoutSettingsPage() {
    const [selectedCg, setSelectedCg] = useState<string>("");

    const { data: campgrounds = [] } = useQuery({
        queryKey: ["campgrounds"],
        queryFn: () => apiClient.getCampgrounds()
    });

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = localStorage.getItem("campreserv:selectedCampground");
        if (stored) {
            setSelectedCg(stored);
        } else if (campgrounds.length > 0) {
            setSelectedCg(campgrounds[0].id);
        }
    }, [campgrounds]);

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Blackout Dates</h1>
                    <p className="text-slate-500">Manage maintenance periods and other blackout dates for your sites.</p>
                </div>

                {selectedCg ? (
                    <BlackoutList campgroundId={selectedCg} />
                ) : (
                    <div className="text-center py-12 text-slate-500">
                        Please select a campground to manage blackout dates.
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
