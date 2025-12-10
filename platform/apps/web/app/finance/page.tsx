"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

type DisputeSummary = { open: number; won: number; lost: number; total: number };

export default function FinancePage() {
  const [campgroundId, setCampgroundId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("campreserv:selectedCampground");
    if (stored) setCampgroundId(stored);
  }, []);

  const payoutsQuery = useQuery({
    queryKey: ["finance-health-payouts", campgroundId],
    queryFn: () => apiClient.listPayouts(campgroundId),
    enabled: !!campgroundId,
    staleTime: 30_000
  });

  const disputesQuery = useQuery({
    queryKey: ["finance-health-disputes", campgroundId],
    queryFn: () => apiClient.listDisputes(campgroundId),
    enabled: !!campgroundId,
    staleTime: 30_000
  });

  const lastPayoutSync = useMemo(() => {
    const payouts = payoutsQuery.data ?? [];
    if (!payouts.length) return null;
    const latest = payouts.reduce((latest, payout) => {
      const ts = payout.arrivalDate || payout.paidAt || payout.createdAt;
      const time = ts ? new Date(ts).getTime() : 0;
      return time > latest ? time : latest;
    }, 0);
    return latest ? new Date(latest) : null;
  }, [payoutsQuery.data]);

  const disputeSummary: DisputeSummary = useMemo(() => {
    const summary: DisputeSummary = { open: 0, won: 0, lost: 0, total: 0 };
    (disputesQuery.data ?? []).forEach((d) => {
      summary.total += 1;
      if (d.status === "won") summary.won += 1;
      else if (d.status === "lost" || d.status === "charge_refunded") summary.lost += 1;
      else summary.open += 1;
    });
    return summary;
  }, [disputesQuery.data]);

  const fallbackDisputes: DisputeSummary = { open: 2, won: 1, lost: 0, total: 3 };
  const displayDisputes = campgroundId ? disputeSummary : fallbackDisputes;
  const displayLastSync = lastPayoutSync
    ? lastPayoutSync.toLocaleString()
    : campgroundId
      ? "Awaiting first payout sync"
      : new Date(Date.now() - 15 * 60 * 1000).toLocaleString();

  return (
    <DashboardShell>
      <Breadcrumbs items={[{ label: "Finance", href: "/finance" }]} />

      <div className="mb-3">
        <h1 className="text-2xl font-semibold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-600">Payouts, disputes, and alerts (stub snapshot).</p>
      </div>

      <div className="grid gap-4 lg:max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Finance health</CardTitle>
            <CardDescription>Lightweight snapshot sourced from payouts and disputes (stub fallback when none).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs font-medium uppercase text-slate-500">Last payout sync</div>
                <div className="text-lg font-semibold text-slate-900">{displayLastSync}</div>
                <div className="text-xs text-slate-500">
                  {campgroundId ? "From payout listing" : "Stubbed while no campground is selected"}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-500">
                  <span>Disputes</span>
                  <Badge variant="outline">Total {displayDisputes.total}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Open / pending</span>
                  <span className="font-semibold text-amber-700">{displayDisputes.open}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Won</span>
                  <span className="font-semibold text-emerald-700">{displayDisputes.won}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Lost / refunded</span>
                  <span className="font-semibold text-rose-700">{displayDisputes.lost}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Counts reflect the dispute list{campgroundId ? "" : " (stubbed for demo)"}.
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="text-xs font-medium uppercase text-slate-500">Alerting</div>
                <div className="text-sm text-slate-700">
                  Triggers a stubbed alert to simulate finance paging and webhook wiring.
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!campgroundId || payoutsQuery.isFetching || disputesQuery.isFetching}
                    onClick={async () => {
                      if (!campgroundId) return;
                      await Promise.all([payoutsQuery.refetch(), disputesQuery.refetch()]);
                    }}
                  >
                    Refresh data
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => toast({
                      title: "Test finance alert (stub)",
                      description: "Would send a payout/drift or dispute alert to on-call.",
                    })}
                  >
                    Test alert
                  </Button>
                </div>
                <div className="text-xs text-slate-500">No external calls are made here; values are mocked when unavailable.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}


