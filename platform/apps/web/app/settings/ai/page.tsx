"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DashboardShell } from "../../../components/ui/layout/DashboardShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../components/ui/use-toast";
import { apiClient } from "../../../lib/api-client";

type AiUsage = { promptTokens: number | null; completionTokens: number | null; totalTokens: number | null; at: string };

export default function AiSettingsPage() {
  const { toast } = useToast();
  const [campgroundId, setCampgroundId] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [lastUsage, setLastUsage] = useState<AiUsage | null>(null);

  useEffect(() => {
    const cg = typeof window !== "undefined" ? localStorage.getItem("campreserv:selectedCampground") : null;
    setCampgroundId(cg);
    if (cg && typeof window !== "undefined") {
      const stored = localStorage.getItem(`aiUsage:${cg}`);
      if (stored) {
        try {
          setLastUsage(JSON.parse(stored));
        } catch {
          setLastUsage(null);
        }
      }
    }
  }, []);

  const campgroundQuery = useQuery({
    queryKey: ["campground", campgroundId],
    queryFn: () => apiClient.getCampground(campgroundId!),
    enabled: !!campgroundId,
  });

  useEffect(() => {
    const cg = campgroundQuery.data;
    if (!cg) return;
    setAiEnabled((cg as any).aiSuggestionsEnabled || false);
  }, [campgroundQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!campgroundId) throw new Error("Select a campground");
      return apiClient.updateAiSettings(campgroundId, { aiEnabled, aiApiKey: openaiKey || undefined });
    },
    onSuccess: () => {
      toast({ title: "AI settings saved" });
      setOpenaiKey("");
    },
    onError: (err: any) => toast({ title: "Save failed", description: err?.message || "Unknown error", variant: "destructive" }),
  });

  return (
    <DashboardShell>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>AI Suggestions</CardTitle>
            <CardDescription>Enable per-campground AI with your own OpenAI API key. No guest PII is sent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!campgroundId && <div className="text-sm text-slate-500">Select a campground to configure AI.</div>}
            {campgroundId && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-slate-700">Enable AI suggestions for this campground</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">OpenAI API key (not displayed after save)</label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Stored per campground. Keys are not shared across properties. Never include guest PII in prompts; only aggregates are sent.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save AI settings"}
                  </Button>
                </div>

                <div className="border rounded-md p-3 bg-slate-50">
                  <div className="text-sm font-semibold text-slate-800 mb-1">Recent AI usage</div>
                  {lastUsage ? (
                    <div className="text-sm text-slate-700 space-y-1">
                      <div>Total tokens: {lastUsage.totalTokens ?? "n/a"}</div>
                      <div>Prompt tokens: {lastUsage.promptTokens ?? "n/a"}</div>
                      <div>Completion tokens: {lastUsage.completionTokens ?? "n/a"}</div>
                      <div className="text-xs text-slate-500">Last run: {new Date(lastUsage.at).toLocaleString()}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No usage recorded yet. Generate suggestions from the Analytics page to see usage.</div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

