"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";

function statusVariant(status: string) {
  switch (status) {
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "pending_second":
      return "secondary";
    default:
      return "outline";
  }
}

export default function ApprovalsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const approvalsQuery = useQuery({ queryKey: ["approvals"], queryFn: apiClient.listApprovals });
  const [comment, setComment] = useState("");

  const approveMutation = useMutation({
    mutationFn: ({ id, approver }: { id: string; approver: string }) => apiClient.approveRequest(id, approver),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      toast({ title: "Approved" });
    },
    onError: (err: any) => toast({ title: "Approval failed", description: err?.message ?? "Try again", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, approver, reason }: { id: string; approver: string; reason?: string }) => apiClient.rejectRequest(id, approver, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      toast({ title: "Rejected" });
    },
    onError: (err: any) => toast({ title: "Rejection failed", description: err?.message ?? "Try again", variant: "destructive" }),
  });

  return (
    <DashboardShell>
      <Breadcrumbs
        items={[
          { label: "Finance", href: "/finance" },
          { label: "Approvals", href: "/approvals" },
        ]}
      />

      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-slate-900">Approvals</h1>
        <p className="text-sm text-slate-600">Dual control for refunds, payouts, and high-value changes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pending approvals</CardTitle>
            <CardDescription>Stubbed list exercising the approvals API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approvals</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(approvalsQuery.data?.requests ?? []).map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-semibold uppercase">{req.type}</TableCell>
                      <TableCell className="max-w-xs text-sm text-slate-700">{req.reason}</TableCell>
                      <TableCell>
                        {req.amount ? `${req.currency} ${req.amount.toLocaleString()}` : req.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(req.status)}>{req.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-600">
                          {req.approvals.length}/{req.requiredApprovals} approvals
                        </div>
                        <div className="text-xs text-slate-500">
                          {req.approvals.map((a) => `${a.approver} (${new Date(a.at).toLocaleTimeString()})`).join(", ") || "None yet"}
                        </div>
                      </TableCell>
                      <TableCell className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveMutation.mutate({ id: req.id, approver: "Demo Approver" })}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => rejectMutation.mutate({ id: req.id, approver: "Demo Approver", reason: comment })}
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policies</CardTitle>
            <CardDescription>What requires dual control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(approvalsQuery.data?.policies ?? []).map((policy) => (
              <div key={policy.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{policy.name}</div>
                  <Badge variant="secondary">{policy.approversNeeded} approver(s)</Badge>
                </div>
                <div className="text-xs text-slate-500 uppercase">{policy.appliesTo.join(", ")}</div>
                <div className="text-xs text-slate-600">{policy.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comment</CardTitle>
            <CardDescription>Optional note on approvals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add an optional note" />
            <div className="text-xs text-slate-500">Notes are attached to rejection payloads in this stub.</div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

