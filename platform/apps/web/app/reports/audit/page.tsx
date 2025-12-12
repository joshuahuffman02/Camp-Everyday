"use client";

import { useEffect, useState, useMemo as useReactMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "../../../components/ui/layout/DashboardShell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { apiClient } from "@/lib/api-client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMemo } from "react";

export default function AuditLogPage() {
  const [campgroundId, setCampgroundId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("campreserv:selectedCampground");
    if (stored) setCampgroundId(stored);
  }, []);

  const auditQuery = useQuery({
    queryKey: ["audit-log", campgroundId, actionFilter],
    queryFn: () => apiClient.getAuditLogs(campgroundId!, {
      action: actionFilter === "all" ? undefined : actionFilter,
      start: start || undefined,
      end: end || undefined,
      limit: 200
    }),
    enabled: !!campgroundId
  });

  const actions = useReactMemo(() => {
    const set = new Set<string>();
    auditQuery.data?.forEach((row) => set.add(row.action));
    return Array.from(set).sort();
  }, [auditQuery.data]);

  const entities = useReactMemo(() => {
    const set = new Set<string>();
    auditQuery.data?.forEach((row) => set.add(row.entity));
    return Array.from(set).sort();
  }, [auditQuery.data]);

  const rows = useReactMemo(() => {
    let filtered = auditQuery.data || [];
    if (entityFilter !== "all") {
      filtered = filtered.filter(row => row.entity === entityFilter);
    }
    return filtered;
  }, [auditQuery.data, entityFilter]);

  const formatDiff = (before: any, after: any) => {
    if (!before && !after) return null;
    const keys = Array.from(new Set([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])]));
    if (keys.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        {keys.map((key) => {
          const prev = before ? before[key] : undefined;
          const next = after ? after[key] : undefined;
          if (prev === next) return null;
          return (
            <span key={key} className="rounded bg-slate-100 px-2 py-1 border border-slate-200">
              <span className="font-semibold">{key}</span>: {String(prev ?? "—")} → <span className="font-semibold text-emerald-700">{String(next ?? "—")}</span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardShell>
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: "Reports" }, { label: "Audit log" }]} />
        <div className="card p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-semibold text-slate-900">Audit log</div>
            <div className="text-sm text-slate-600">Role changes, invites, and future sensitive actions.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" />
              <span className="text-slate-500 text-xs">to</span>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-40" />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => auditQuery.refetch()}
              disabled={auditQuery.isFetching}
            >
              {auditQuery.isFetching ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!campgroundId) return;
                const q = new URLSearchParams();
                if (actionFilter !== "all") q.set("action", actionFilter);
                if (start) q.set("start", start);
                if (end) q.set("end", end);
                q.set("format", "csv");
                window.open(`/api-proxy/campgrounds/${campgroundId}/audit?${q.toString()}`, "_blank");
              }}
            >
              Export CSV
            </Button>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">Showing {rows.length} entries</div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Details</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">User agent</th>
                </tr>
              </thead>
              <tbody>
                {auditQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-sm text-slate-500">Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-sm text-slate-500">No audit entries yet.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary">{row.action}</Badge>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.entity}:{row.entityId.slice(0, 6)}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.actor ? `${row.actor.firstName ?? ""} ${row.actor.lastName ?? ""}`.trim() || row.actor.email : "System"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {formatDiff(row.before, row.after) ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{row.ip || "—"}</td>
                      <td className="px-3 py-2 text-slate-700 max-w-xs truncate" title={row.userAgent || undefined}>
                        {row.userAgent || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
