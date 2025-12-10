"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useWhoami } from "@/hooks/use-whoami";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TicketForm = {
  title: string;
  notes: string;
  category: "issue" | "question" | "feature" | "other";
  url?: string;
  path?: string;
  pageTitle?: string;
  userAgent?: string;
  selection?: string;
};

const LS_TICKET_DRAFT = "campreserv:ticket:draft";
const LS_TICKET_OPEN = "campreserv:ticket:open";

export function FloatingTicketWidget() {
  const { toast } = useToast();
  const { data: whoami } = useWhoami();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<TicketForm>({
    title: "",
    notes: "",
    category: "issue",
  });

  const selectionText = useMemo(() => {
    if (typeof window === "undefined") return "";
    return (window.getSelection()?.toString() ?? "").slice(0, 500);
  }, [open]);

  // Restore draft on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LS_TICKET_DRAFT);
      const wasOpen = localStorage.getItem(LS_TICKET_OPEN) === "true";
      if (raw) {
        const parsed = JSON.parse(raw);
        setForm((prev) => ({ ...prev, ...parsed }));
        if (wasOpen) setOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    setForm((prev) => ({
      ...prev,
      url: window.location.href,
      path: window.location.pathname,
      pageTitle: document.title,
      userAgent: navigator.userAgent,
      selection: selectionText || prev.selection,
    }));
  }, [open, selectionText]);

  const isDirty = form.title.trim().length > 0 || form.notes.trim().length > 0;

  // Persist draft while typing
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isDirty) {
      localStorage.setItem(LS_TICKET_DRAFT, JSON.stringify({ title: form.title, notes: form.notes, category: form.category }));
    } else {
      localStorage.removeItem(LS_TICKET_DRAFT);
    }
  }, [form.title, form.notes, form.category, isDirty]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isDirty && !isSubmitting) {
      const confirmClose = window.confirm("Close and discard this ticket draft?");
      if (!confirmClose) return;
    }
    setOpen(nextOpen);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_TICKET_OPEN, String(nextOpen));
    }
    if (!nextOpen && !isSubmitting) {
      setForm({ title: "", notes: "", category: "issue" });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submitter = {
        id: (whoami as any)?.id ?? (whoami as any)?.user?.id ?? null,
        name:
          (whoami as any)?.name ??
          (whoami as any)?.user?.name ??
          (whoami as any)?.email ??
          (whoami as any)?.user?.email ??
          null,
        email: (whoami as any)?.email ?? (whoami as any)?.user?.email ?? null,
      };

      const payload = {
        ...form,
        extra: {
          viewport: typeof window !== "undefined" ? { width: window.innerWidth, height: window.innerHeight } : undefined,
          referrer: typeof document !== "undefined" ? document.referrer : undefined,
        },
        submitter,
        category: form.category,
        client:
          typeof window !== "undefined"
            ? {
                userAgent: navigator.userAgent,
                platform: (navigator as any)?.platform ?? null,
                language: navigator.language ?? null,
                deviceType: /ipad|tablet/i.test(navigator.userAgent)
                  ? "tablet"
                  : /mobi|android|iphone/i.test(navigator.userAgent)
                  ? "mobile"
                  : "desktop",
              }
            : undefined,
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to submit ticket (${res.status})`);
      }

      setOpen(false);
      setForm({ title: "", notes: "", category: "issue" });
      if (typeof window !== "undefined") {
        localStorage.removeItem(LS_TICKET_DRAFT);
        localStorage.removeItem(LS_TICKET_OPEN);
      }
      toast({
        title: "Ticket submitted",
        description: "We captured the page details.",
        action: (
          <ToastAction altText="View tickets" onClick={() => window.open("/tickets", "_blank")}>
            View
          </ToastAction>
        ),
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Submission failed",
        description: "Could not save the ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1200] flex flex-col items-end gap-2">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button size="lg" variant="default" className="shadow-lg">
            Submit ticket
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-w-lg"
          onRequestClose={() => {
            if (isDirty) {
              const ok = window.confirm("Close and discard this ticket draft?");
              return ok;
            }
            return true;
          }}
        >
          <DialogHeader>
            <DialogTitle>Submit a ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Type</label>
              <Select
                value={form.category}
                onValueChange={(val: TicketForm["category"]) => setForm((prev) => ({ ...prev, category: val }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent className="z-[1400]">
                  <SelectItem value="issue">Issue / bug</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="feature">Feature request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {[
                  { id: "issue", label: "Issue" },
                  { id: "question", label: "Question" },
                  { id: "feature", label: "Feature" },
                  { id: "other", label: "Other" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category: opt.id as TicketForm["category"] }))}
                    className={`rounded-full border px-2 py-1 ${
                      form.category === opt.id ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Title</label>
              <Input
                placeholder="What went wrong?"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Details</label>
              <Textarea
                placeholder="Steps to reproduce, expected vs actual, etc."
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-600">
              {form.url && (
                <div className="break-all">
                  <span className="font-semibold">URL:</span> {form.url}
                </div>
              )}
              {form.path && (
                <div className="break-all">
                  <span className="font-semibold">Path:</span> {form.path}
                </div>
              )}
              {form.pageTitle && (
                <div className="break-all">
                  <span className="font-semibold">Page:</span> {form.pageTitle}
                </div>
              )}
              {form.selection && (
                <div className="break-all">
                  <span className="font-semibold">Selection:</span> “{form.selection}”
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !form.title.trim()}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <a
        href="/tickets"
        className="text-xs text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
        target="_blank"
        rel="noreferrer"
      >
        View tickets
      </a>
    </div>
  );
}
