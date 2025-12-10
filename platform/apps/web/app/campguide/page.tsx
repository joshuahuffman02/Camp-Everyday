"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function CampGuidePage() {
  const [campgroundId, setCampgroundId] = useState<string | null>(null);
  const [intent, setIntent] = useState("Fill shoulder dates and upsell bundles");
  const [guestId, setGuestId] = useState("");
  const [pricingNotes, setPricingNotes] = useState("Next 2 weekends");
  const [searchQuery, setSearchQuery] = useState("guest asked for late checkout fire pit");
  const [copilotPrompt, setCopilotPrompt] = useState("Draft a friendly reply offering late checkout and a firewood bundle.");

  useEffect(() => {
    const cg = typeof window !== "undefined" ? localStorage.getItem("campreserv:selectedCampground") : null;
    if (cg) setCampgroundId(cg);
  }, []);

  const campgroundsQuery = useQuery({
    queryKey: ["campguide-campgrounds"],
    queryFn: () => apiClient.getCampgrounds(),
  });

  useEffect(() => {
    if (!campgroundId && campgroundsQuery.data?.length) {
      setCampgroundId(campgroundsQuery.data[0].id);
    }
  }, [campgroundId, campgroundsQuery.data]);

  const recommendationsMutation = useMutation({
    mutationFn: () => apiClient.getAiRecommendations({ campgroundId: campgroundId!, guestId: guestId || undefined, intent }),
  });

  const pricingMutation = useMutation({
    mutationFn: () =>
      apiClient.getAiPricingSuggestions({
        campgroundId: campgroundId!,
        demandIndex: 0.78,
        arrivalDate: "2025-12-12",
        departureDate: "2025-12-15",
      }),
  });

  const semanticMutation = useMutation({
    mutationFn: () => apiClient.searchSemantic({ campgroundId: campgroundId || undefined, query: searchQuery }),
  });

  const copilotMutation = useMutation({
    mutationFn: () => apiClient.runCopilot({ campgroundId: campgroundId!, action: "draft_reply", prompt: copilotPrompt }),
  });

  const currentCampground = useMemo(
    () => campgroundsQuery.data?.find((c) => c.id === campgroundId),
    [campgroundId, campgroundsQuery.data]
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">CampGuide</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline">Demo-safe (mock data)</Badge>
            <Badge variant="outline">No external keys</Badge>
            {currentCampground && <Badge variant="outline">Campground: {currentCampground.name}</Badge>}
            <Badge variant="outline">
              API: {typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api" : "…" }
            </Badge>
          </div>
          <p className="text-slate-600 mt-2">Pick an intent or question, click the buttons, and we’ll return ready-to-demo sample outputs. Nothing you do here changes real rates or guest data.</p>
          <ul className="text-sm text-slate-500 mt-2 list-disc list-inside space-y-1">
            <li>Recommendations: type an intent like “upsell bundles for long weekends,” then Generate.</li>
            <li>Pricing: click Get pricing suggestion to see a sample rate uplift.</li>
            <li>Semantic search: type a natural question (e.g., “shaded pull-through near dog park”).</li>
            <li>Copilot: ask for a reply or what-if; we show a preview only.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Site and upsell ideas from guest intent. No external keys needed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  "Upsell bundles for long weekends",
                  "Keep families near activities",
                  "Fill shoulder dates with deals",
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                    onClick={() => setIntent(sample)}
                  >
                    {sample}
                  </button>
                ))}
              </div>
              <Input value={intent} onChange={(e) => setIntent(e.target.value)} placeholder="Guest intent or goal" />
              <Input value={guestId} onChange={(e) => setGuestId(e.target.value)} placeholder="Optional guest id" />
              <Button
                onClick={() => recommendationsMutation.mutate()}
                disabled={!campgroundId || recommendationsMutation.isPending}
                title="Uses mock data only; safe to click"
                className={cn("inline-flex items-center gap-2")}
              >
                {recommendationsMutation.isPending ? "Generating..." : "Generate recommendations"}
                <Badge variant="outline" className="text-[10px]">Mocked</Badge>
              </Button>
              {recommendationsMutation.error && (
                <div className="text-sm text-rose-600">
                  {(recommendationsMutation.error as any)?.message || "Request failed"} — ensure API is running at {process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api"}
                </div>
              )}
              {recommendationsMutation.data && (
                <div className="space-y-2">
                  {recommendationsMutation.data.items.map((item) => (
                    <div key={item.title} className="rounded-lg border p-3 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{item.type}</Badge>
                        <div className="font-semibold text-slate-900">{item.title}</div>
                      </div>
                      <div className="text-sm text-slate-700 mt-1">{item.reason}</div>
                      {item.cta && <div className="text-xs text-emerald-700 mt-1">{item.cta}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dynamic pricing AI</CardTitle>
              <CardDescription>Suggested rates from demand, comps, and rules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {["Next 2 weekends", "Holiday surge", "Low season fill"].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                    onClick={() => setPricingNotes(sample)}
                  >
                    {sample}
                  </button>
                ))}
              </div>
              <Input value={pricingNotes} onChange={(e) => setPricingNotes(e.target.value)} placeholder="Notes (optional)" />
              <Button
                onClick={() => pricingMutation.mutate()}
                disabled={!campgroundId || pricingMutation.isPending}
                title="Uses mock data only; safe to click"
                className={cn("inline-flex items-center gap-2")}
              >
                {pricingMutation.isPending ? "Calculating..." : "Get pricing suggestion"}
                <Badge variant="outline" className="text-[10px]">Mocked</Badge>
              </Button>
              {pricingMutation.error && (
                <div className="text-sm text-rose-600">
                  {(pricingMutation.error as any)?.message || "Request failed"} — ensure API is running at {process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api"}
                </div>
              )}
              {pricingMutation.data && (
                <div className="rounded-lg border p-3 bg-slate-50 space-y-2">
                  <div className="text-lg font-semibold text-slate-900">
                    ${Math.round(pricingMutation.data.suggestedRateCents / 100).toLocaleString()} <span className="text-sm text-slate-500">suggested</span>
                  </div>
                  <div className="text-sm text-slate-700">Base ${Math.round(pricingMutation.data.baseRateCents / 100)} | Demand {Math.round(pricingMutation.data.demandIndex * 100)}%</div>
                  <div className="space-y-1">
                    {pricingMutation.data.factors.map((f) => (
                      <div key={f.label} className="text-xs text-slate-600">• {f.label}: {f.value}</div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Semantic search</CardTitle>
              <CardDescription>Natural language across guests, sites, and messages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  "shaded pull-through near dog park",
                  "late checkout requests",
                  "VIP guests with long stays",
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                    onClick={() => setSearchQuery(sample)}
                  >
                    {sample}
                  </button>
                ))}
              </div>
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g., guest wants shaded pull-through near dog park" />
              <Button
                onClick={() => semanticMutation.mutate()}
                disabled={semanticMutation.isPending || !searchQuery}
                title="Uses mock data only; safe to click"
                className={cn("inline-flex items-center gap-2")}
              >
                {semanticMutation.isPending ? "Searching..." : "Search"}
                <Badge variant="outline" className="text-[10px]">Mocked</Badge>
              </Button>
              {semanticMutation.error && (
                <div className="text-sm text-rose-600">
                  {(semanticMutation.error as any)?.message || "Request failed"} — ensure API is running at {process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api"}
                </div>
              )}
              {semanticMutation.data && (
                <div className="space-y-2">
                  {semanticMutation.data.results.map((r) => (
                    <div key={r.id} className="rounded-lg border p-3 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{r.type}</Badge>
                        <div className="font-semibold text-slate-900">{r.title}</div>
                        <span className="text-xs text-slate-500 ml-auto">Score {(r.score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-sm text-slate-700 mt-1">{r.snippet}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Copilot</CardTitle>
              <CardDescription>Assistant for bulk changes, replies, and what-if planning.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  "Draft a friendly reply offering late checkout and firewood bundle.",
                  "What-if: raise weekend rates 8% during the fair.",
                  "Summarize guest questions about hookups.",
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100"
                    onClick={() => setCopilotPrompt(sample)}
                  >
                    {sample}
                  </button>
                ))}
              </div>
              <Textarea value={copilotPrompt} onChange={(e) => setCopilotPrompt(e.target.value)} rows={4} />
              <Button
                onClick={() => copilotMutation.mutate()}
                disabled={!campgroundId || copilotMutation.isPending}
                title="Uses mock data only; safe to click"
                className={cn("inline-flex items-center gap-2")}
              >
                {copilotMutation.isPending ? "Drafting..." : "Run copilot"}
                <Badge variant="outline" className="text-[10px]">Mocked</Badge>
              </Button>
              {copilotMutation.error && (
                <div className="text-sm text-rose-600">
                  {(copilotMutation.error as any)?.message || "Request failed"} — ensure API is running at {process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api"}
                </div>
              )}
              {copilotMutation.data && (
                <div className="rounded-lg border p-3 bg-slate-50 space-y-2">
                  <div className="text-sm text-slate-500 uppercase">Preview</div>
                  <div className="text-slate-900 text-sm">{copilotMutation.data.preview}</div>
                  {copilotMutation.data.steps && (
                    <div className="text-sm text-slate-700 space-y-1">
                      {copilotMutation.data.steps.map((s, idx) => (
                        <div key={s} className="text-xs text-slate-600">Step {idx + 1}: {s}</div>
                      ))}
                    </div>
                  )}
                  {copilotMutation.data.impact && <div className="text-xs text-emerald-700">Impact: {copilotMutation.data.impact}</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}


