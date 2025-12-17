"use client";

import { useQuery } from "@tanstack/react-query";
import { useCampground } from "@/contexts/CampgroundContext";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import {
  CreditCard,
  Receipt,
  TrendingUp,
  MessageSquare,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ChevronRight,
  Crown,
  Rocket,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

interface BillingSummary {
  organization: {
    id: string;
    name: string;
    billingEmail: string | null;
  };
  tier: {
    name: string;
    displayName: string;
    lockedBookingFee: number | null;
    monthlyFeeEndsAt: string | null;
  };
  currentPeriod: {
    id: string;
    periodStart: string;
    periodEnd: string;
    status: string;
    dueAt: string | null;
  };
  charges: {
    subscription: { description: string; amountCents: number };
    bookingFees: {
      description: string;
      quantity: number;
      unitCents: number;
      amountCents: number;
    };
    smsOutbound: {
      description: string;
      quantity: number;
      unitCents: number;
      amountCents: number;
    };
    smsInbound: {
      description: string;
      quantity: number;
      unitCents: number;
      amountCents: number;
    };
  };
  totals: {
    subtotalCents: number;
    discountCents: number;
    taxCents: number;
    totalCents: number;
  };
  usage: {
    bookingCount: number;
    smsOutbound: number;
    smsInbound: number;
    aiTokens: number;
  };
}

interface BillingPeriod {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalCents: number;
  paidAt: string | null;
  dueAt: string | null;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPeriod(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
}

const tierIcons: Record<string, React.ReactNode> = {
  founders_circle: <Crown className="h-5 w-5" />,
  pioneer: <Rocket className="h-5 w-5" />,
  trailblazer: <Star className="h-5 w-5" />,
  standard: <CreditCard className="h-5 w-5" />,
};

const tierColors: Record<string, string> = {
  founders_circle: "from-amber-500 to-orange-500",
  pioneer: "from-emerald-500 to-teal-500",
  trailblazer: "from-violet-500 to-purple-500",
  standard: "from-slate-500 to-slate-600",
};

const statusStyles: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  open: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  invoiced: {
    icon: <Receipt className="h-4 w-4" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  paid: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  past_due: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

export default function BillingPage() {
  const { selectedCampground } = useCampground();

  // Fetch full campground data to get organizationId
  const { data: campgroundData } = useQuery<{ organizationId: string }>({
    queryKey: ["campground", selectedCampground?.id],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/campgrounds/${selectedCampground?.id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch campground");
      return res.json();
    },
    enabled: !!selectedCampground?.id,
  });

  const organizationId = campgroundData?.organizationId;

  const { data: summary, isLoading: summaryLoading } = useQuery<BillingSummary>({
    queryKey: ["billing-summary", organizationId],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/organizations/${organizationId}/billing/summary`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch billing summary");
      return res.json();
    },
    enabled: !!organizationId,
  });

  const { data: history, isLoading: historyLoading } = useQuery<BillingPeriod[]>({
    queryKey: ["billing-history", organizationId],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/organizations/${organizationId}/billing/history?limit=6`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch billing history");
      return res.json();
    },
    enabled: !!organizationId,
  });

  if (!organizationId) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Please select a campground first.</p>
        </div>
      </DashboardShell>
    );
  }

  const isLoading = summaryLoading || historyLoading;

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Billing & Usage</h1>
            <p className="text-slate-600 mt-1">
              View your subscription, usage, and payment history
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings/payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Settings
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : summary ? (
          <>
            {/* Tier Badge */}
            <div
              className={`bg-gradient-to-r ${tierColors[summary.tier.name] || tierColors.standard} rounded-2xl p-6 text-white`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    {tierIcons[summary.tier.name] || tierIcons.standard}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">
                      Current Plan
                    </p>
                    <h2 className="text-2xl font-bold">
                      {summary.tier.displayName}
                    </h2>
                  </div>
                </div>
                <div className="text-right">
                  {summary.tier.lockedBookingFee && (
                    <div>
                      <p className="text-white/80 text-sm">Locked Rate</p>
                      <p className="text-xl font-semibold">
                        {formatCents(summary.tier.lockedBookingFee)}/booking
                      </p>
                    </div>
                  )}
                  {summary.tier.monthlyFeeEndsAt && (
                    <p className="text-white/70 text-sm mt-1">
                      Free monthly until{" "}
                      {formatDate(summary.tier.monthlyFeeEndsAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Current Period Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Current Period
                    </h3>
                    <p className="text-slate-600">
                      {formatPeriod(
                        summary.currentPeriod.periodStart,
                        summary.currentPeriod.periodEnd
                      )}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusStyles[summary.currentPeriod.status]?.bg || "bg-slate-100"} ${statusStyles[summary.currentPeriod.status]?.color || "text-slate-600"}`}
                  >
                    {statusStyles[summary.currentPeriod.status]?.icon}
                    <span className="text-sm font-medium capitalize">
                      {summary.currentPeriod.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Charges Breakdown */}
              <div className="divide-y divide-slate-100">
                {/* Subscription */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {summary.charges.subscription.description}
                      </p>
                      <p className="text-sm text-slate-500">Fixed monthly fee</p>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {formatCents(summary.charges.subscription.amountCents)}
                  </p>
                </div>

                {/* Booking Fees */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        Per-Booking Fees
                      </p>
                      <p className="text-sm text-slate-500">
                        {summary.charges.bookingFees.quantity} bookings @{" "}
                        {formatCents(summary.charges.bookingFees.unitCents)} each
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {formatCents(summary.charges.bookingFees.amountCents)}
                  </p>
                </div>

                {/* SMS Outbound */}
                {summary.charges.smsOutbound.quantity > 0 && (
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          Outbound SMS
                        </p>
                        <p className="text-sm text-slate-500">
                          {summary.charges.smsOutbound.quantity} messages @{" "}
                          {formatCents(summary.charges.smsOutbound.unitCents)}{" "}
                          each
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatCents(summary.charges.smsOutbound.amountCents)}
                    </p>
                  </div>
                )}

                {/* SMS Inbound */}
                {summary.charges.smsInbound.quantity > 0 && (
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Inbound SMS</p>
                        <p className="text-sm text-slate-500">
                          {summary.charges.smsInbound.quantity} messages @{" "}
                          {formatCents(summary.charges.smsInbound.unitCents)}{" "}
                          each
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatCents(summary.charges.smsInbound.amountCents)}
                    </p>
                  </div>
                )}

                {/* Total */}
                <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">
                    Estimated Total for Period
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCents(summary.totals.totalCents)}
                  </p>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-600">Bookings</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {summary.usage.bookingCount}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-violet-600" />
                  </div>
                  <span className="text-sm text-slate-600">SMS Sent</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {summary.usage.smsOutbound}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="text-sm text-slate-600">SMS Received</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {summary.usage.smsInbound}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm text-slate-600">AI Tokens</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {summary.usage.aiTokens.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Billing History */}
            {history && history.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Billing History
                  </h3>
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="divide-y divide-slate-100">
                  {history.slice(1).map((period) => (
                    <div
                      key={period.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusStyles[period.status]?.bg || "bg-slate-100"}`}
                        >
                          {statusStyles[period.status]?.icon || (
                            <Receipt className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {formatPeriod(period.periodStart, period.periodEnd)}
                          </p>
                          <p className="text-sm text-slate-500 capitalize">
                            {period.status.replace("_", " ")}
                            {period.paidAt && ` on ${formatDate(period.paidAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-slate-900">
                          {formatCents(period.totalCents)}
                        </p>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Payment Method
                  </h3>
                  <p className="text-slate-600 text-sm mt-1">
                    Manage how you pay for Camp Everyday
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/settings/payments">
                    Update Payment Method
                  </Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No billing data available
            </h3>
            <p className="text-slate-600">
              Billing information will appear here once your account is set up.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
