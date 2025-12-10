"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "../../components/ui/layout/DashboardShell";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { Button } from "../../components/ui/button";
import { apiClient } from "../../lib/api-client";
import { HelpAnchor } from "../../components/help/HelpAnchor";

export default function PricingPage() {
  const [campgroundId, setCampgroundId] = useState<string>("");
  const [form, setForm] = useState({
    label: "",
    ruleType: "flat",
    siteClassId: "",
    startDate: "",
    endDate: "",
    dayOfWeek: "",
    percentAdjust: "",
    flatAdjust: "",
    minNights: "",
    isActive: true
  });
  const [quotePreview, setQuotePreview] = useState<string>("");
  const qc = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cg = localStorage.getItem("campreserv:selectedCampground");
    if (cg) setCampgroundId(cg);
  }, []);

  const siteClassesQuery = useQuery({
    queryKey: ["pricing-site-classes", campgroundId],
    queryFn: () => apiClient.getSiteClasses(campgroundId),
    enabled: !!campgroundId
  });

  const rulesQuery = useQuery({
    queryKey: ["pricing-rules", campgroundId],
    queryFn: () => apiClient.getPricingRules(campgroundId),
    enabled: !!campgroundId
  });

  const createRule = useMutation({
    mutationFn: () =>
      apiClient.createPricingRule(campgroundId, {
        campgroundId,
        siteClassId: form.siteClassId || null,
        label: form.label || undefined,
        ruleType: form.ruleType as any,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        dayOfWeek: form.dayOfWeek ? Number(form.dayOfWeek) : undefined,
        percentAdjust: form.percentAdjust ? Number(form.percentAdjust) : undefined,
        flatAdjust: form.flatAdjust ? Math.round(Number(form.flatAdjust) * 100) : undefined,
        minNights: form.minNights ? Number(form.minNights) : undefined,
        isActive: form.isActive
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricing-rules", campgroundId] });
      setForm({
        label: "",
        ruleType: "flat",
        siteClassId: "",
        startDate: "",
        endDate: "",
        dayOfWeek: "",
        percentAdjust: "",
        flatAdjust: "",
        minNights: "",
        isActive: true
      });
    }
  });

  const toggleRule = useMutation({
    mutationFn: (payload: { id: string; isActive: boolean }) =>
      apiClient.updatePricingRule(payload.id, { isActive: payload.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-rules", campgroundId] })
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => apiClient.deletePricingRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-rules", campgroundId] })
  });

  const rules = rulesQuery.data || [];
  const siteClassMap = useMemo(() => {
    const map: Record<string, string> = {};
    siteClassesQuery.data?.forEach((cls) => (map[cls.id] = cls.name));
    return map;
  }, [siteClassesQuery.data]);

  useEffect(() => {
    // simple inline preview helper
    const parts: string[] = [];
    if (form.flatAdjust) parts.push(`Flat $${form.flatAdjust}/night`);
    if (form.percentAdjust) parts.push(`Percent ${(Number(form.percentAdjust) * 100).toFixed(1)}%`);
    if (form.dayOfWeek) parts.push(`DOW ${form.dayOfWeek}`);
    if (form.startDate || form.endDate) parts.push(`Range ${form.startDate || "?"} → ${form.endDate || "?"}`);
    if (form.minNights) parts.push(`Min nights ${form.minNights}`);
    setQuotePreview(parts.join(" • "));
  }, [form.flatAdjust, form.percentAdjust, form.dayOfWeek, form.startDate, form.endDate, form.minNights]);

  return (
    <DashboardShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between" data-testid="pricing-header">
          <Breadcrumbs items={[{ label: "Pricing" }]} />
          <HelpAnchor topicId="pricing-rules" label="Pricing help" />
        </div>

        {!campgroundId && (
          <div className="card p-5">
            <div className="text-lg font-semibold text-slate-900">Select a campground</div>
            <p className="text-sm text-slate-600 mt-1">Use the left sidebar switcher to choose a campground.</p>
          </div>
        )}

        {campgroundId && (
          <>
              <div className="card p-4 space-y-3" data-testid="pricing-form">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Add pricing rule</h2>
                </div>
                {quotePreview && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    {quotePreview}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <input
                  className="rounded-md border border-slate-200 px-3 py-2"
                  placeholder="Label (optional)"
                  value={form.label}
                  onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
                />
                <select
                  className="rounded-md border border-slate-200 px-3 py-2"
                  value={form.ruleType}
                  onChange={(e) => setForm((s) => ({ ...s, ruleType: e.target.value }))}
                >
                  <option value="flat">Flat ($/night)</option>
                  <option value="percent">Percent (%)</option>
                  <option value="seasonal">Seasonal range</option>
                  <option value="dow">Day of week</option>
                </select>
                <select
                  className="rounded-md border border-slate-200 px-3 py-2"
                  value={form.siteClassId}
                  onChange={(e) => setForm((s) => ({ ...s, siteClassId: e.target.value }))}
                >
                  <option value="">All site classes</option>
                  {siteClassesQuery.data?.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="rounded-md border border-slate-200 px-3 py-2"
                  value={form.startDate}
                  onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))}
                />
                <input
                  type="date"
                  className="rounded-md border border-slate-200 px-3 py-2"
                  value={form.endDate}
                  onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))}
                />
                <select
                  className="rounded-md border border-slate-200 px-3 py-2"
                  value={form.dayOfWeek}
                  onChange={(e) => setForm((s) => ({ ...s, dayOfWeek: e.target.value }))}
                >
                  <option value="">Any day</option>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="rounded-md border border-slate-200 px-3 py-2"
                  placeholder="Percent adjust (e.g. 0.1 = +10%)"
                  value={form.percentAdjust}
                  onChange={(e) => setForm((s) => ({ ...s, percentAdjust: e.target.value }))}
                />
                <input
                  type="number"
                  className="rounded-md border border-slate-200 px-3 py-2"
                  placeholder="Flat adjust ($ per night)"
                  value={form.flatAdjust}
                  onChange={(e) => setForm((s) => ({ ...s, flatAdjust: e.target.value }))}
                />
                <input
                  type="number"
                  className="rounded-md border border-slate-200 px-3 py-2"
                  placeholder="Min nights"
                  value={form.minNights}
                  onChange={(e) => setForm((s) => ({ ...s, minNights: e.target.value }))}
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => createRule.mutate()}
                  disabled={createRule.isPending || !campgroundId}
                  data-testid="pricing-save-button"
                >
                  {createRule.isPending ? "Saving..." : "Save rule"}
                </Button>
              </div>
            </div>

          <div className="card p-4 space-y-3" data-testid="pricing-rules-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Pricing rules</h2>
              <Button
                size="sm"
                variant="secondary"
                  onClick={() => {
                    if (!rules.length) return;
                    const headers = [
                      "label",
                      "ruleType",
                      "siteClass",
                      "startDate",
                      "endDate",
                      "dayOfWeek",
                      "percentAdjust",
                      "flatAdjust",
                      "minNights",
                      "isActive"
                    ];
                    const rows = rules.map((r) => [
                      r.label || "",
                      r.ruleType,
                      r.siteClassId ? siteClassMap[r.siteClassId] || r.siteClassId : "All",
                      r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : "",
                      r.endDate ? new Date(r.endDate).toISOString().slice(0, 10) : "",
                      r.dayOfWeek ?? "",
                      r.percentAdjust ?? "",
                      r.flatAdjust ? (r.flatAdjust / 100).toFixed(2) : "",
                      r.minNights ?? "",
                      r.isActive ? "true" : "false"
                    ]);
                    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "pricing-rules.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export CSV
                </Button>
              </div>

              {rulesQuery.isLoading && <div className="text-sm text-slate-600" data-testid="pricing-loading">Loading rules…</div>}
              {!rulesQuery.isLoading && !rules.length && (
                <div className="text-sm text-slate-600" data-testid="pricing-empty">No pricing rules yet.</div>
              )}
              <div className="overflow-auto">
                <table className="min-w-full text-sm" data-testid="pricing-rules-table">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="px-2 py-2">Label</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Site class</th>
                      <th className="px-2 py-2">Dates</th>
                      <th className="px-2 py-2">DOW</th>
                      <th className="px-2 py-2">Adjust</th>
                      <th className="px-2 py-2">Min nights</th>
                      <th className="px-2 py-2">Impact</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-b border-slate-100" data-testid="pricing-rule-row">
                        <td className="px-2 py-2" data-testid="pricing-rule-label">{rule.label || "—"}</td>
                        <td className="px-2 py-2">{rule.ruleType}</td>
                        <td className="px-2 py-2">{rule.siteClassId ? siteClassMap[rule.siteClassId] || rule.siteClassId : "All"}</td>
                        <td className="px-2 py-2">
                          {[rule.startDate, rule.endDate].some(Boolean)
                            ? `${rule.startDate ? rule.startDate.toString().slice(0, 10) : ""} → ${
                                rule.endDate ? rule.endDate.toString().slice(0, 10) : ""
                              }`
                            : "Any"}
                        </td>
                        <td className="px-2 py-2">{rule.dayOfWeek ?? "Any"}</td>
                        <td className="px-2 py-2">
                          {rule.flatAdjust ? `$${(rule.flatAdjust / 100).toFixed(2)}/night` : ""}
                          {rule.percentAdjust ? ` ${rule.percentAdjust * 100}%` : ""}
                          {!rule.flatAdjust && !rule.percentAdjust ? "—" : ""}
                        </td>
                        <td className="px-2 py-2">{rule.minNights ?? "—"}</td>
                        <td className="px-2 py-2 text-xs text-slate-600">
                          {[
                            rule.ruleType === "dow" && rule.dayOfWeek !== null && rule.dayOfWeek !== undefined
                              ? `Applies on ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][rule.dayOfWeek]}`
                              : null,
                            rule.startDate || rule.endDate
                              ? `Range ${rule.startDate || "?"} → ${rule.endDate || "?"}`
                              : null,
                            rule.flatAdjust
                              ? `Flat $${(rule.flatAdjust / 100).toFixed(2)}`
                              : null,
                            rule.percentAdjust
                              ? `Percent ${(Number(rule.percentAdjust) * 100).toFixed(1)}%`
                              : null,
                            rule.minNights ? `Min nights ${rule.minNights}` : null
                          ]
                            .filter(Boolean)
                            .join(" • ") || "—"}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs ${
                              rule.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {rule.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => toggleRule.mutate({ id: rule.id, isActive: !rule.isActive })}
                            disabled={toggleRule.isPending}
                          >
                            {rule.isActive ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteRule.mutate(rule.id)}
                            disabled={deleteRule.isPending}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      {campgroundId && siteClassesQuery.data && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Site classes</h2>
              <p className="text-xs text-slate-600">Reference-only snapshot; edit classes under Campgrounds → Site classes.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {siteClassesQuery.data.map((cls) => (
              <div key={cls.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{cls.name}</div>
                    <div className="text-sm text-slate-600">
                      {cls.siteType} • Max {cls.maxOccupancy} • ${(cls.defaultRate / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500 space-y-1">
                    {cls.glCode && <div>GL {cls.glCode}</div>}
                    {cls.clientAccount && <div>Acct {cls.clientAccount}</div>}
                    {cls.policyVersion && <div>Policy {cls.policyVersion}</div>}
                  </div>
                </div>
                {cls.description && <div className="text-xs text-slate-500">{cls.description}</div>}
                <div className="text-xs text-slate-500">
                  Min nights {cls.minNights ?? "n/a"} • Max nights {cls.maxNights ?? "n/a"} • Pet {cls.petFriendly ? "yes" : "no"} • Accessible{" "}
                  {cls.accessible ? "yes" : "no"}
                </div>
                {cls.photos && cls.photos.length > 0 && <div className="text-xs text-slate-500">Photos: {cls.photos.length}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
