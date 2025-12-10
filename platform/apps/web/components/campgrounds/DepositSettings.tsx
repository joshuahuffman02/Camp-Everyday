"use client";

import { Campground } from "@campreserv/shared";
import { DepositSettingsForm } from "../settings/DepositSettingsForm";

interface DepositSettingsProps {
    campground: Campground;
}

export function DepositSettings({ campground }: DepositSettingsProps) {
    return (
        <div className="card p-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-900">Deposit Rules</h3>
                <p className="text-sm text-slate-600">Configure how deposits are calculated for reservations.</p>
            </div>

            <DepositSettingsForm
                campgroundId={campground.id}
                initialRule={campground.depositRule || "none"}
                initialPercentage={campground.depositPercentage || null}
                initialConfig={(campground as any).depositConfig || null}
            />
        </div>
    );
}
