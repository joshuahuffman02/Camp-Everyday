"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api-client";
import { Button } from "../../components/ui/button";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { DashboardShell } from "../../components/ui/layout/DashboardShell";
import { CampgroundSchema } from "@campreserv/shared";
import type { z } from "zod";

function CampgroundsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skipRedirect = searchParams.get("all") === "true";
  const goto = searchParams.get("goto"); // Support redirect to specific sub-page

  const { data, isLoading, error } = useQuery({
    queryKey: ["campgrounds"],
    queryFn: () => apiClient.getCampgrounds()
  });
  const qc = useQueryClient();

  // Auto-redirect to single campground for better UX
  useEffect(() => {
    if (!isLoading && !skipRedirect && data?.length === 1) {
      const subPage = goto || "sites";
      router.replace(`/campgrounds/${data[0].id}/${subPage}`);
    }
  }, [data, isLoading, skipRedirect, router, goto]);
  const depositMutation = useMutation({
    mutationFn: ({ id, rule }: { id: string; rule: z.infer<typeof CampgroundSchema>["depositRule"] }) =>
      apiClient.updateCampgroundDeposit(id, rule),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campgrounds"] })
  });

  return (
    <DashboardShell>
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Campgrounds" }]} />
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Campgrounds</h2>
          <div className="text-xs text-slate-500">Creation is admin-only</div>
        </div>
        {isLoading && <p className="text-slate-600">Loading…</p>}
        {error && <p className="text-red-600">Error loading campgrounds</p>}
        <div className="grid gap-3">
          {data?.map((cg) => (
            <div key={cg.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{cg.name}</div>
                  <div className="text-sm text-slate-600">
                    {cg.city || "-"}, {cg.state || ""} {cg.country || ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" asChild>
                    <Link href={`/campgrounds/${cg.id}/sites`}>Sites</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href={`/campgrounds/${cg.id}/classes`}>Classes</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/campgrounds/${cg.id}/reservations`}>Reservations</Link>
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <div className="text-xs uppercase tracking-wide text-slate-500">Deposit rule</div>
                <select
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={cg.depositRule || "none"}
                  onChange={(e) => depositMutation.mutate({ id: cg.id, rule: e.target.value as z.infer<typeof CampgroundSchema>["depositRule"] })}
                  disabled={depositMutation.isPending}
                >
                  <option value="none">None</option>
                  <option value="full">Full (100%)</option>
                  <option value="half">Half (50%)</option>
                  <option value="first_night">First night</option>
                  <option value="first_night_fees">First night + fees</option>
                </select>
                {depositMutation.isPending && <span className="text-xs text-slate-500">Saving…</span>}
                {depositMutation.isError && <span className="text-xs text-rose-600">Failed to save</span>}
              </div>
            </div>
          ))}
          {!isLoading && !data?.length && <div className="text-slate-600">No campgrounds available.</div>}
        </div>
      </div>
    </DashboardShell>
  );
}

export default function CampgroundsPage() {
  return (
    <Suspense fallback={
      <DashboardShell>
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: "Campgrounds" }]} />
          <p className="text-slate-600">Loading...</p>
        </div>
      </DashboardShell>
    }>
      <CampgroundsPageContent />
    </Suspense>
  );
}
