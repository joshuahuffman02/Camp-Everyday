"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "../../components/ui/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { apiClient } from "../../lib/api-client";
import { useToast } from "../../components/ui/use-toast";

type FormTemplateInput = {
  title: string;
  type: "waiver" | "vehicle" | "intake" | "custom";
  description: string;
  fields: string;
  isActive: boolean;
};

const emptyForm: FormTemplateInput = {
  title: "",
  type: "waiver",
  description: "",
  fields: "{\n  \"questions\": []\n}",
  isActive: true,
};

export default function FormsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [campgroundId, setCampgroundId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormTemplateInput>(emptyForm);
  const [attachReservationId, setAttachReservationId] = useState("");
  const [attachGuestId, setAttachGuestId] = useState("");
  const [attachTemplateId, setAttachTemplateId] = useState("");

  useEffect(() => {
    const cg = typeof window !== "undefined" ? localStorage.getItem("campreserv:selectedCampground") : null;
    setCampgroundId(cg);
  }, []);

  const templatesQuery = useQuery({
    queryKey: ["form-templates", campgroundId],
    queryFn: () => apiClient.getFormTemplates(campgroundId!),
    enabled: !!campgroundId,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      let parsed: Record<string, any> | undefined;
      if (form.fields.trim()) {
        try {
          parsed = JSON.parse(form.fields);
        } catch (e) {
          throw new Error("Fields must be valid JSON");
        }
      }
      if (editingId) {
        return apiClient.updateFormTemplate(editingId, {
          title: form.title,
          type: form.type,
          description: form.description || null,
          fields: parsed,
          isActive: form.isActive,
        });
      }
      return apiClient.createFormTemplate({
        campgroundId: campgroundId!,
        title: form.title,
        type: form.type,
        description: form.description || undefined,
        fields: parsed,
        isActive: form.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-templates", campgroundId] });
      setIsModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: "Form saved" });
    },
    onError: (err: any) => {
      toast({ title: err?.message || "Failed to save form", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteFormTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-templates", campgroundId] });
      toast({ title: "Form deleted" });
    },
    onError: () => toast({ title: "Failed to delete form", variant: "destructive" }),
  });

  const editingTemplate = useMemo(
    () => templatesQuery.data?.find((t) => t.id === editingId),
    [editingId, templatesQuery.data]
  );

  const attachMutation = useMutation({
    mutationFn: () => {
      return apiClient.createFormSubmission({
        formTemplateId: attachTemplateId,
        reservationId: attachReservationId || undefined,
        guestId: attachGuestId || undefined,
        responses: {}
      });
    },
    onSuccess: () => {
      setAttachReservationId("");
      setAttachGuestId("");
      setAttachTemplateId("");
      toast({ title: "Form attached" });
    },
    onError: (err: any) => toast({ title: err?.message || "Failed to attach form", variant: "destructive" })
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (id: string) => {
    const t = templatesQuery.data?.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id);
    setForm({
      title: t.title,
      type: t.type as FormTemplateInput["type"],
      description: t.description || "",
      fields: t.fields ? JSON.stringify(t.fields, null, 2) : "",
      isActive: t.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  return (
    <DashboardShell>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Forms & docs</CardTitle>
            <CardDescription>Waivers, vehicle/rig intake, and custom questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!campgroundId && <div className="text-sm text-slate-500">Select a campground to manage forms.</div>}
            {templatesQuery.isLoading && <div className="text-sm text-slate-500">Loading forms…</div>}
            {campgroundId && !templatesQuery.isLoading && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Create templates; attach to bookings/guests in a future release.
                </div>
                <Button size="sm" onClick={openCreate}>New form</Button>
              </div>
            )}

            {templatesQuery.data && templatesQuery.data.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                No forms yet. Create a waiver, vehicle intake, or custom questionnaire.
              </div>
            )}

            {templatesQuery.data && templatesQuery.data.length > 0 && (
              <div className="grid gap-3">
                {templatesQuery.data.map((t) => (
                  <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                          <Badge variant="secondary" className="uppercase">{t.type}</Badge>
                          <Badge variant={t.isActive ? "default" : "secondary"}>{t.isActive ? "Active" : "Inactive"}</Badge>
                        </div>
                        {t.description && <div className="text-xs text-slate-600">{t.description}</div>}
                        <div className="text-[11px] text-slate-500">Updated {new Date(t.updatedAt).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(t.id)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(t.id)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {templatesQuery.data && templatesQuery.data.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="text-sm font-semibold text-slate-900">Attach a form to a reservation/guest</div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Form template</label>
                    <Select value={attachTemplateId} onValueChange={setAttachTemplateId}>
                      <SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger>
                      <SelectContent>
                        {templatesQuery.data.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Reservation ID</label>
                    <Input
                      placeholder="Reservation ID"
                      value={attachReservationId}
                      onChange={(e) => setAttachReservationId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">Guest ID</label>
                    <Input
                      placeholder="Guest ID"
                      value={attachGuestId}
                      onChange={(e) => setAttachGuestId(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => attachMutation.mutate()}
                    disabled={!attachTemplateId || attachMutation.isPending}
                  >
                    {attachMutation.isPending ? "Attaching..." : "Attach form"}
                  </Button>
                </div>
                <div className="text-xs text-slate-500">
                  Provide a reservation or guest ID (or both) to create a submission placeholder. Responses can be collected later.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit form" : "New form"}</DialogTitle>
            <DialogDescription>Define the template and optional fields JSON.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Title</label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Type</label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as FormTemplateInput["type"] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiver">Waiver</SelectItem>
                    <SelectItem value="vehicle">Vehicle / rig</SelectItem>
                    <SelectItem value="intake">Custom intake</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Description</label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Fields JSON</label>
              <Textarea
                rows={6}
                value={form.fields}
                onChange={(e) => setForm((f) => ({ ...f, fields: e.target.value }))}
              />
              <div className="text-xs text-slate-500">Example: {"{ \"questions\": [{ \"label\": \"Driver license\", \"type\": \"text\" }] }"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  id="isActive"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive">Active</label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingId(null); }}>Cancel</Button>
                <Button onClick={() => upsertMutation.mutate()} disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
