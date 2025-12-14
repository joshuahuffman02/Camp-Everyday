"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, ClipboardList, HeartPulse, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableEmpty } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { useWhoami } from "@/hooks/use-whoami";
import { MobileQuickActionsBar } from "@/components/staff/MobileQuickActionsBar";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("campreserv:authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Member = {
  id: string;
  role: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
};

type Staff = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  region?: string | null;
  ownershipRoles?: string[] | null;
  notifyChannels?: string[];
  memberships?: { campgroundId: string; role?: string | null }[];
};

type Report = {
  id: string;
  createdAt: string;
  description: string;
  status: string;
  path?: string;
  campground?: { id: string; name: string };
  author?: { email: string; firstName?: string | null; lastName?: string | null };
  assignee?: { id: string; email: string; firstName?: string | null; lastName?: string | null };
  steps?: string;
  contactEmail?: string;
  timezone?: string;
  userAgent?: string;
  language?: string;
  roleFilter?: string;
  pinnedIds?: string[];
  recentIds?: string[];
};

const statusColor: Record<string, string> = {
  new: "bg-emerald-50 text-emerald-700 border-emerald-200",
  triage: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-slate-50 text-slate-600 border-slate-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200"
};

export default function SupportAdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [campgroundId, setCampgroundId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();
  const { data: whoami, isLoading: whoamiLoading, error: whoamiError } = useWhoami();
  const hasMembership = (whoami?.user?.memberships?.length ?? 0) > 0;
  const platformRole = (whoami?.user as any)?.platformRole as string | undefined;
  const supportAllowed =
    whoami?.allowed?.supportRead || whoami?.allowed?.supportAssign || whoami?.allowed?.supportAnalytics;
  const allowSupport = !!supportAllowed && (!!platformRole || hasMembership);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("campreserv:selectedCampground");
      if (stored) setCampgroundId(stored);
    }
  }, []);

  useEffect(() => {
    if (!campgroundId) return;
    const loadMembers = async () => {
      setMembersLoading(true);
      setMembersError(null);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const res = await fetch(`${base}/campgrounds/${campgroundId}/members`, {
          credentials: "include",
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
        const data = await res.json();
        setMembers(data as Member[]);
      } catch (err: any) {
        setMembersError(err?.message || "Failed to load members");
      } finally {
        setMembersLoading(false);
      }
    };
    if (!whoamiLoading && allowSupport) {
      void loadMembers();
    } else if (!whoamiLoading) {
      setMembers([]);
      setMembersLoading(false);
    }
  }, [campgroundId, whoamiLoading, allowSupport]);

  useEffect(() => {
    if (whoamiLoading) return;
    const viewerRegion = (whoami?.user as any)?.platformRegion ?? whoami?.user?.region ?? null;
    const regionAllowed = regionFilter === "all" || !viewerRegion || viewerRegion === regionFilter;
    const campgroundAllowed =
      !campgroundId || platformRole || whoami?.user?.memberships?.some((m: any) => m.campgroundId === campgroundId);

    if (!allowSupport || !regionAllowed || !campgroundAllowed) {
      setReports([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const parts: string[] = [];
        if (regionFilter !== "all") parts.push(`region=${encodeURIComponent(regionFilter)}`);
        if (campgroundId) parts.push(`campgroundId=${encodeURIComponent(campgroundId)}`);
        const qs = parts.length ? `?${parts.join("&")}` : "";
        const res = await fetch(`${base}/support/reports${qs}`, {
          credentials: "include",
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Failed to load reports (${res.status})`);
        const data = await res.json();
        setReports(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [regionFilter, campgroundId, whoami, whoamiLoading, allowSupport]);

  useEffect(() => {
    if (whoamiLoading) return;
    const viewerRegion = (whoami?.user as any)?.platformRegion ?? whoami?.user?.region ?? null;
    const regionAllowed = regionFilter === "all" || !viewerRegion || viewerRegion === regionFilter;
    const campgroundAllowed =
      !campgroundId || platformRole || whoami?.user?.memberships?.some((m: any) => m.campgroundId === campgroundId);

    if (!allowSupport || !regionAllowed || !campgroundAllowed) {
      setStaff([]);
      setStaffLoading(false);
      return;
    }

    const loadStaff = async () => {
      setStaffLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const parts: string[] = [];
        if (regionFilter !== "all") parts.push(`region=${encodeURIComponent(regionFilter)}`);
        if (campgroundId) parts.push(`campgroundId=${encodeURIComponent(campgroundId)}`);
        const qs = parts.length ? `?${parts.join("&")}` : "";
        const res = await fetch(`${base}/support/reports/staff/directory${qs}`, {
          credentials: "include",
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Failed to load staff (${res.status})`);
        const data = await res.json();
        setStaff(data);
      } catch {
        setStaff([]);
      } finally {
        setStaffLoading(false);
      }
    };
    loadStaff();
  }, [regionFilter, campgroundId, whoami, whoamiLoading, allowSupport]);

  const regionAllowed = regionFilter === "all" || !whoami?.user?.region || whoami?.user?.region === regionFilter;
  const campgroundAllowed =
    !campgroundId || whoami?.user?.memberships?.some((m: any) => m.campgroundId === campgroundId);
  const canMutate = !!whoami && regionAllowed && campgroundAllowed && allowSupport;
  const canReadSupport = !!whoami && allowSupport && regionAllowed && campgroundAllowed;
  const openReports = reports.filter((r) => r.status !== "closed").length;
  const triagePending = reports.filter((r) => r.status === "new" || r.status === "triage").length;

  const filtered = reports.filter((r) => statusFilter === "all" || r.status === statusFilter);
  const selected = useMemo(() => reports.find((r) => r.id === selectedId) || null, [reports, selectedId]);

  if (!whoamiLoading && !allowSupport) {
    return (
      <div>
        <div className="space-y-3">
          <div className="text-xs uppercase font-semibold text-slate-500">Support</div>
          <h1 className="text-2xl font-bold text-white">Support reports</h1>
          <div className="rounded-lg border border-amber-200/20 bg-amber-500/10 text-amber-400 p-4">
            You do not have permission to view or assign support reports.
          </div>
        </div>
      </div>
    );
  }

  const updateStatus = async (id: string, status: string) => {
    if (!canMutate) {
      toast({ title: "Out of scope", description: "You cannot update reports for this scope.", variant: "destructive" });
      return;
    }
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetch(`${base}/support/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error(`Failed to update (${res.status})`);
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast({ title: "Updated", description: `Status set to ${status}` });
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.message || "Try again", variant: "destructive" });
    }
  };

  const updateAssignee = async (id: string, assigneeId: string | null) => {
    if (!canMutate) {
      toast({ title: "Out of scope", description: "You cannot reassign for this scope.", variant: "destructive" });
      return;
    }
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetch(`${base}/support/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ assigneeId })
      });
      if (!res.ok) throw new Error(`Failed to update (${res.status})`);
      const member = staff.find((s) => s.id === assigneeId);
      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
              ...r,
              assignee: assigneeId
                ? {
                  id: assigneeId,
                  email: member?.email || session?.user?.email || r.assignee?.email || "",
                  firstName: member?.firstName ?? r.assignee?.firstName,
                  lastName: member?.lastName ?? r.assignee?.lastName
                }
                : undefined
            }
            : r
        )
      );
      toast({ title: assigneeId ? "Assigned" : "Unassigned", description: assigneeId ? "Assigned to user" : "Cleared" });
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.message || "Try again", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="space-y-4 pb-24 md:pb-10" id="support-queue">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-semibold text-slate-500">Internal</div>
            <h1 className="text-2xl font-bold text-slate-900">Support reports</h1>
            <p className="text-sm text-slate-600">Staff-only queue of in-app issue submissions.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="triage">Triage</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => location.reload()}>Refresh</Button>
          </div>
        </div>

        {whoamiError && <div className="p-6 text-rose-600">Scope fetch failed: {(whoamiError as Error)?.message || "Unable to load scope"}</div>}
        {!whoamiLoading && !canReadSupport && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 p-4">
            You do not have permission to view or assign support reports for this scope.
          </div>
        )}

        {loading && canReadSupport && <div className="p-6 text-slate-500">Loading...</div>}
        {error && canReadSupport && <div className="p-6 text-rose-600">{error}</div>}
        <div className="flex flex-col gap-1 text-sm text-slate-600">
          <div>
            Scope: {whoamiLoading ? "Loading..." : whoami?.user ? `Region ${whoami.user.region ?? "any"} • Campgrounds ${whoami.user.memberships?.map((m: any) => m.campgroundId).join(", ") || "none"}` : "Unavailable"}
          </div>
          {!canMutate && whoami && (
            <div className="rounded border border-amber-200 bg-amber-50 text-amber-700 px-3 py-2">
              You are out of scope for this region/campground. Updates are disabled.
            </div>
          )}
        </div>

        {canReadSupport && (
          <div className="grid gap-3">
            {filtered.map((r) => (
              <Card key={r.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`border ${statusColor[r.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {r.status}
                    </Badge>
                    {r.campground?.name && <span className="text-xs text-slate-600">Campground: {r.campground.name}</span>}
                    {regionFilter !== "all" && <span className="text-xs text-slate-600">Region: {regionFilter}</span>}
                    {r.path && <span className="text-xs text-slate-600">Path: {r.path}</span>}
                  </div>
                  <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-sm text-slate-900 font-semibold line-clamp-2">{r.description}</div>
                {r.author?.email && <div className="text-xs text-slate-500">Author: {r.author.email}</div>}
                {r.contactEmail && <div className="text-xs text-slate-500">Contact: {r.contactEmail}</div>}
                {r.steps && <div className="text-xs text-slate-600">Steps: {r.steps}</div>}
                <div className="flex flex-col gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)} disabled={!canMutate}>
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="triage">Triage</SelectItem>
                        <SelectItem value="in_progress">In progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(r.id)}>
                      View details
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateAssignee(r.id, session?.user?.id || null)}
                      disabled={!session?.user?.id || !canMutate}
                    >
                      Assign to me
                    </Button>
                    {staff.length > 0 && (
                      <Select
                        value={r.assignee?.id || ""}
                        onValueChange={(v) => updateAssignee(r.id, v || null)}
                        disabled={!canMutate}
                      >
                        <SelectTrigger className="h-8 w-44">
                          <SelectValue placeholder="Assign user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {staff.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {(s.firstName || s.lastName)
                                ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim()
                                : s.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {r.assignee && (
                      <Button size="sm" variant="ghost" onClick={() => updateAssignee(r.id, null)} disabled={!canMutate}>
                        Unassign
                      </Button>
                    )}
                  </div>
                  {staffLoading && <div className="text-slate-400">Loading assignees…</div>}
                  {membersError && <div className="text-rose-500">Assignee list unavailable: {membersError}</div>}
                  {!campgroundId && <div className="text-slate-400">Select a campground (top bar) to apply scoping.</div>}
                </div>
              </Card>
            ))}
            {!loading && !error && reports.length === 0 && (
              <div className="overflow-hidden rounded-lg border bg-white">
                <table className="w-full text-sm">
                  <tbody>
                    <TableEmpty>No support reports for this scope.</TableEmpty>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {canReadSupport && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase font-semibold text-slate-500">Staff directory</div>
                <p className="text-sm text-slate-600">Assign/notify staff by region.</p>
              </div>
              {staffLoading && <div className="text-xs text-slate-500">Loading…</div>}
            </div>
            <div className="grid gap-2">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{s.email}</div>
                    <div className="text-xs text-slate-600">
                      {(s.firstName || s.lastName) ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() : "—"} • Region {s.region ?? "n/a"}
                    </div>
                    {s.memberships?.length ? (
                      <div className="text-[11px] text-slate-500">
                        Campgrounds: {s.memberships.map((m) => m.campgroundId).join(", ")}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toast({ title: "Notify (stub)", description: `Sent to ${s.email}` })} disabled={!canMutate}>
                      Notify
                    </Button>
                  </div>
                </div>
              ))}
              {staff.length === 0 && !staffLoading && (
                <div className="overflow-hidden rounded border">
                  <table className="w-full text-sm">
                    <tbody>
                      <TableEmpty>No staff for this filter.</TableEmpty>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        )}

        {selected && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-end z-40" onClick={() => setSelectedId(null)}>
            <div
              className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase font-semibold text-slate-500">Report</div>
                  <div className="text-lg font-bold text-slate-900 line-clamp-2">{selected.description}</div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="font-semibold">Status:</span>
                  <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)} disabled={!canMutate}>
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="triage">Triage</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="font-semibold">Assignee:</span>
                  {selected.assignee ? (
                    <span className="text-slate-800">
                      {selected.assignee.firstName || selected.assignee.lastName
                        ? `${selected.assignee.firstName ?? ""} ${selected.assignee.lastName ?? ""}`.trim()
                        : selected.assignee.email || selected.assignee.id}
                    </span>
                  ) : (
                    <span className="text-slate-500">Unassigned</span>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateAssignee(selected.id, session?.user?.id || null)}
                    disabled={!session?.user?.id || !canMutate}
                  >
                    Assign to me
                  </Button>
                  {staff.length > 0 && (
                    <Select
                      value={selected.assignee?.id || ""}
                      onValueChange={(v) => updateAssignee(selected.id, v || null)}
                      disabled={!canMutate}
                    >
                      <SelectTrigger className="h-8 w-44">
                        <SelectValue placeholder="Assign user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {(s.firstName || s.lastName)
                              ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim()
                              : s.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selected.assignee && (
                    <Button size="sm" variant="ghost" onClick={() => updateAssignee(selected.id, null)} disabled={!canMutate}>
                      Unassign
                    </Button>
                  )}
                </div>

                {selected.steps && (
                  <div>
                    <div className="text-sm font-semibold text-slate-800 mb-1">Steps</div>
                    <div className="whitespace-pre-wrap text-sm text-slate-700">{selected.steps}</div>
                  </div>
                )}

                <div className="space-y-2 text-sm text-slate-700">
                  {selected.contactEmail && <div><span className="font-semibold">Contact:</span> {selected.contactEmail}</div>}
                  {selected.author?.email && <div><span className="font-semibold">Author:</span> {selected.author.email}</div>}
                  {selected.campground?.name && <div><span className="font-semibold">Campground:</span> {selected.campground.name}</div>}
                  {selected.path && <div><span className="font-semibold">Path:</span> {selected.path}</div>}
                </div>

                <div className="space-y-1 text-xs text-slate-600 border-t border-slate-200 pt-3">
                  <div className="font-semibold text-slate-700">Captured context</div>
                  {selected.timezone && <div>Timezone: {selected.timezone}</div>}
                  {selected.language && <div>Language: {selected.language}</div>}
                  {selected.userAgent && <div>Browser: {selected.userAgent}</div>}
                  {selected.roleFilter && <div>Role filter: {selected.roleFilter}</div>}
                  {selected.pinnedIds?.length ? <div>Pinned: {selected.pinnedIds.join(", ")}</div> : null}
                  {selected.recentIds?.length ? <div>Recent: {selected.recentIds.join(", ")}</div> : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <MobileQuickActionsBar
        active="tasks"
        items={[
          { key: "tasks", label: "Tasks", href: "#support-queue", icon: <ClipboardList className="h-4 w-4" />, badge: openReports },
          { key: "messages", label: "Messages", href: "/messages", icon: <MessageSquare className="h-4 w-4" /> },
          { key: "checklists", label: "Checklists", href: "/operations#checklists", icon: <ClipboardCheck className="h-4 w-4" /> },
          { key: "ops-health", label: "Ops health", href: "/operations#ops-health", icon: <HeartPulse className="h-4 w-4" />, badge: triagePending },
        ]}
      />
    </div>
  );
}

