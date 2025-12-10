"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { DashboardShell } from "../../../components/ui/layout/DashboardShell";
import { useState } from "react";

export default function FeedbackDashboard() {
  const qc = useQueryClient();
  const { data: campgrounds = [] } = useQuery({
    queryKey: ["campgrounds"],
    queryFn: () => apiClient.getCampgrounds()
  });
  const selectedCampground = campgrounds[0];

  const metricsQuery = useQuery({
    queryKey: ["nps-metrics", selectedCampground?.id],
    queryFn: () => apiClient.getNpsMetrics(selectedCampground!.id),
    enabled: !!selectedCampground?.id
  });

  const surveysQuery = useQuery({
    queryKey: ["nps-surveys", selectedCampground?.id],
    queryFn: () => apiClient.listNpsSurveys(selectedCampground!.id),
    enabled: !!selectedCampground?.id
  });

  const reviewsQuery = useQuery({
    queryKey: ["reviews-admin", selectedCampground?.id],
    queryFn: () => apiClient.getAdminReviews(selectedCampground!.id),
    enabled: !!selectedCampground?.id
  });
  const [showRemoved, setShowRemoved] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [surveyName, setSurveyName] = useState("Guest NPS");
  const createSurveyMutation = useMutation({
    mutationFn: () => apiClient.createNpsSurvey({
      campgroundId: selectedCampground!.id,
      name: surveyName,
      question: "How likely are you to recommend us to a friend?",
      cooldownDays: 30,
      samplingPercent: 100
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nps-surveys", selectedCampground?.id] });
    }
  });
  const inviteMutation = useMutation({
    mutationFn: () => {
      const surveyId = surveysQuery.data?.[0]?.id;
      if (!surveyId) throw new Error("Create a survey first");
      return apiClient.createNpsInvite({
        surveyId,
        campgroundId: selectedCampground!.id,
        channel: "email",
        email: inviteEmail
      });
    },
    onSuccess: () => {
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["nps-metrics", selectedCampground?.id] });
    }
  });

  const moderateMutation = useMutation({
    mutationFn: (payload: { reviewId: string; status: "approved" | "rejected" | "pending" }) => apiClient.moderateReview(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews-admin", selectedCampground?.id] })
  });

  if (!selectedCampground) {
    return (
      <DashboardShell>
        <div className="p-6">Select a campground to view feedback.</div>
      </DashboardShell>
    );
  }

  const metrics = metricsQuery.data;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Guest Feedback</h1>
          <p className="text-slate-600">NPS, detractors, and reviews for {selectedCampground.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard label="NPS" value={metrics?.nps ?? 0} suffix="" highlight />
          <MetricCard label="Responses" value={metrics?.totalResponses ?? 0} />
          <MetricCard label="Promoters" value={metrics?.promoters ?? 0} />
          <MetricCard label="Detractors" value={metrics?.detractors ?? 0} />
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Send an NPS email</h2>
          {(!surveysQuery.data || surveysQuery.data.length === 0) ? (
            <div className="space-y-3">
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">Create an NPS survey first so we know which question to send.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={surveyName}
                  onChange={(e) => setSurveyName(e.target.value)}
                  className="flex-1 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Survey name"
                />
                <button
                  disabled={!surveyName || createSurveyMutation.isPending}
                  onClick={() => createSurveyMutation.mutate()}
                  className="px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50"
                >
                  {createSurveyMutation.isPending ? "Creating..." : "Create survey"}
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="guest@example.com"
              className="flex-1 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              disabled={!inviteEmail || inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
              className="px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50"
            >
              {inviteMutation.isPending ? "Sending..." : "Send invite"}
            </button>
          </div>
          {inviteMutation.error ? (
            <p className="text-sm text-red-600">{(inviteMutation.error as Error).message}</p>
          ) : null}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Latest reviews</h2>
              <p className="text-sm text-slate-600">Approve or reject new reviews</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={showRemoved}
                onChange={(e) => setShowRemoved(e.target.checked)}
              />
              Show removed
            </label>
          </div>
          <div className="space-y-4">
            {(reviewsQuery.data || [])
              .filter((r) => showRemoved || r.status !== "removed")
              .slice(0, 6)
              .map((review) => (
              <div key={review.id} className="border rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded">{review.rating} / 5</span>
                  <span className="text-xs text-slate-500 capitalize">{review.status}</span>
                </div>
                {review.title ? <div className="text-base font-semibold text-slate-900">{review.title}</div> : null}
                {review.body ? <p className="text-sm text-slate-700">{review.body}</p> : null}
                <div className="flex gap-2">
                  <button
                    onClick={() => moderateMutation.mutate({ reviewId: review.id, status: "approved" })}
                    className="text-sm px-3 py-1 rounded bg-emerald-600 text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => moderateMutation.mutate({ reviewId: review.id, status: "rejected" })}
                    className="text-sm px-3 py-1 rounded border border-slate-300 text-slate-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => moderateMutation.mutate({ reviewId: review.id, status: "rejected" })}
                    className="text-sm px-3 py-1 rounded border border-rose-200 text-rose-700 bg-rose-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )) || <p className="text-sm text-slate-600">No reviews yet.</p>}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function MetricCard({ label, value, suffix, highlight }: { label: string; value: number; suffix?: string; highlight?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? "border-emerald-200" : ""}`}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="text-3xl font-bold text-slate-900 mt-1">{value}{suffix}</div>
    </div>
  );
}

