"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "../../../components/ui/layout/DashboardShell";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpAnchor } from "@/components/help/HelpAnchor";

export default function PaymentsSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [campgroundId, setCampgroundId] = useState<string>("");
  const [fee, setFee] = useState<string>("");
  const [plan, setPlan] = useState<"ota_only" | "standard" | "enterprise">("ota_only");
  const [feeMode, setFeeMode] = useState<"absorb" | "pass_through">("absorb");
  const [monthlyFee, setMonthlyFee] = useState<string>("500.00");
  const [refreshingCapabilities, setRefreshingCapabilities] = useState(false);
  const CAPABILITIES_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6h

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("campreserv:selectedCampground");
    if (stored) setCampgroundId(stored);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["payment-settings", campgroundId],
    queryFn: () => apiClient.getCampgroundPaymentSettings(campgroundId),
    enabled: !!campgroundId,
    staleTime: 30_000
  });

  useEffect(() => {
    if (!data) return;
    if (data.applicationFeeFlatCents !== undefined && data.applicationFeeFlatCents !== null) {
      setFee(String((data.applicationFeeFlatCents / 100).toFixed(2)));
    }
    if (data.perBookingFeeCents !== undefined && data.perBookingFeeCents !== null) {
      setFee(String((data.perBookingFeeCents / 100).toFixed(2)));
    }
    if (data.billingPlan) {
      setPlan(data.billingPlan);
    }
    if (data.feeMode) {
      setFeeMode(data.feeMode);
    }
    if (data.monthlyFeeCents !== undefined && data.monthlyFeeCents !== null) {
      setMonthlyFee(String((data.monthlyFeeCents / 100).toFixed(2)));
    }
  }, [data]);

  const connectMutation = useMutation({
    mutationFn: () => apiClient.connectCampgroundPayments(campgroundId),
    onSuccess: ({ onboardingUrl }) => {
      window.location.href = onboardingUrl;
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const updateFeeMutation = useMutation({
    mutationFn: (payload: {
      perBookingFeeCents: number;
      billingPlan: "ota_only" | "standard" | "enterprise";
      monthlyFeeCents?: number;
      feeMode?: "absorb" | "pass_through";
    }) =>
      apiClient.updateCampgroundPaymentSettings(campgroundId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings", campgroundId] });
      toast({ title: "Saved", description: "Payment settings updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const planDefaultFee = useMemo(() => {
    switch (plan) {
      case "standard":
        return 2.0;
      case "enterprise":
        return 1.0;
      default:
        return 3.0;
    }
  }, [plan]);

  const effectiveFeeLabel = useMemo(() => {
    const num = parseFloat(fee);
    if (Number.isNaN(num)) return `$${planDefaultFee.toFixed(2)} (plan default)`;
    return `$${num.toFixed(2)} per booking`;
  }, [fee, planDefaultFee]);

  const handleSaveMonthly = () => {
    const value = parseFloat(monthlyFee);
    if (Number.isNaN(value) || value < 0) {
      toast({ title: "Invalid amount", description: "Enter a non-negative monthly fee.", variant: "destructive" });
      return;
    }
    updateFeeMutation.mutate({
      perBookingFeeCents: Math.round(parseFloat(fee || `${planDefaultFee}`) * 100),
      billingPlan: plan,
      monthlyFeeCents: Math.round(value * 100),
      feeMode
    });
  };

  const statusBadge = useMemo(() => {
    if (!data?.stripeAccountId) {
      return <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Not connected</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">Connected</Badge>;
  }, [data?.stripeAccountId]);

  const capabilitiesStale = useMemo(() => {
    if (!data?.stripeCapabilitiesFetchedAt) return true;
    const fetched = new Date(data.stripeCapabilitiesFetchedAt).getTime();
    return Date.now() - fetched > CAPABILITIES_MAX_AGE_MS;
  }, [CAPABILITIES_MAX_AGE_MS, data?.stripeCapabilitiesFetchedAt]);

  const capabilities = data?.stripeCapabilities || {};
  const achActive = capabilities?.us_bank_account_ach_payments === "active";
  const walletsActive = capabilities?.card_payments === "active" && capabilities?.transfers === "active";
  const appleActive = capabilities?.apple_pay === "active";
  const googleActive = capabilities?.google_pay === "active" || capabilities?.link_payments === "active";
  const lastRefreshedLabel = useMemo(() => {
    if (!data?.stripeCapabilitiesFetchedAt) return "Never";
    try {
      return new Date(data.stripeCapabilitiesFetchedAt).toLocaleString();
    } catch {
      return String(data.stripeCapabilitiesFetchedAt);
    }
  }, [data?.stripeCapabilitiesFetchedAt]);

  const handleSaveFee = () => {
    const value = parseFloat(fee);
    if (Number.isNaN(value) || value < 0) {
      toast({ title: "Invalid amount", description: "Enter a non-negative fee.", variant: "destructive" });
      return;
    }
    updateFeeMutation.mutate({
      perBookingFeeCents: Math.round(value * 100),
      billingPlan: plan,
      feeMode
    });
  };

  return (
    <DashboardShell>
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
          <HelpAnchor topicId="payments-config" label="Payments setup help" />
        </div>
        <div>
          <p className="text-slate-600 text-sm">Connect Stripe and set your platform fee per booking.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>Stripe Connect</CardTitle>
                <CardDescription>Each campground uses its own Stripe account for payouts.</CardDescription>
              </div>
              {statusBadge}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Funds route to the campground’s Stripe account; a per-booking application fee goes to the platform.
            </p>
            <div className="text-xs text-slate-700 space-y-1">
              <div>ACH: {achActive ? <Badge className="bg-emerald-100 text-emerald-800">Enabled</Badge> : <Badge className="bg-slate-100 text-slate-700">Disabled</Badge>}</div>
              {walletsActive && (
                <div className="flex items-center gap-2">
                  <span>Wallets:</span>
                  {appleActive && <Badge className="bg-emerald-100 text-emerald-800">Apple Pay</Badge>}
                  {googleActive && <Badge className="bg-emerald-100 text-emerald-800">Google/Link</Badge>}
                  {!appleActive && !googleActive && <Badge className="bg-slate-100 text-slate-700">Disabled</Badge>}
                </div>
              )}
              {!walletsActive && <div>Wallets: <Badge className="bg-slate-100 text-slate-700">Disabled</Badge></div>}
              <div className="text-slate-500">Last refreshed: {lastRefreshedLabel}{capabilitiesStale ? " (stale)" : ""}</div>
            </div>
            {capabilitiesStale && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Payment method capabilities might be stale. Refresh to re-check ACH and wallet status for this campground.
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={!campgroundId || connectMutation.isPending}
              >
                {!data?.stripeAccountId ? "Connect Stripe" : "Reconnect Stripe"}
              </Button>
              {data?.stripeAccountId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setRefreshingCapabilities(true);
                    try {
                      await apiClient.refreshPaymentCapabilities(campgroundId);
                      queryClient.invalidateQueries({ queryKey: ["payment-settings", campgroundId] });
                      toast({ title: "Refreshed", description: "Capabilities refreshed from Stripe." });
                    } catch (err: any) {
                      toast({ title: "Refresh failed", description: err.message, variant: "destructive" });
                    } finally {
                      setRefreshingCapabilities(false);
                    }
                  }}
                  disabled={!campgroundId || refreshingCapabilities}
                >
                  {refreshingCapabilities ? "Refreshing..." : "Refresh capabilities"}
                </Button>
              )}
              <p className="text-xs text-slate-500 self-center">
                Onboarding opens a Stripe-hosted flow for this campground.
              </p>
            </div>
            {!data?.stripeAccountId && (
              <div className="text-xs text-slate-600">
                Connect Stripe to enable ACH and wallet payments for this campground.
              </div>
            )}
            {data?.stripeAccountId && (
              <div className="text-xs text-slate-500">
                Account ID: <code className="bg-slate-100 px-1 rounded">{data.stripeAccountId}</code>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform fee</CardTitle>
            <CardDescription>Flat fee per booking (cents go to the platform).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="plan">Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as any)}>
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ota_only">OTA-only (default $3)</SelectItem>
                  <SelectItem value="standard">Standard (default $2)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (default $1 + monthly)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="fee">Fee per booking (USD)</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="3.00"
              />
            </div>
            <Button
              onClick={handleSaveFee}
              disabled={!campgroundId || updateFeeMutation.isPending || isLoading}
            >
              Save fee
            </Button>
            <p className="text-xs text-slate-500">
              This applies per campground. Defaults by plan: OTA $3, Standard $2, Enterprise $1 (+ monthly).
            </p>
            <div className="text-xs text-slate-500">
              Effective: {effectiveFeeLabel}
            </div>
            <div className="space-y-1 pt-2">
              <Label htmlFor="fee-mode">Who pays the fee?</Label>
              <Select value={feeMode} onValueChange={(v) => setFeeMode(v as any)}>
                <SelectTrigger id="fee-mode">
                  <SelectValue placeholder="Select fee mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="absorb">Campground absorbs (reduces payout)</SelectItem>
                  <SelectItem value="pass_through">Guest pays (add to total)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Pass-through will add this fee to the guest total; absorb will deduct it from the campground payout.
              </p>
            </div>
            {plan === "enterprise" && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <Label htmlFor="monthly">Monthly fee (USD)</Label>
                  <Input
                    id="monthly"
                    type="number"
                    step="0.01"
                    min="0"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    placeholder="500.00"
                  />
                </div>
                <Button
                  onClick={handleSaveMonthly}
                  disabled={!campgroundId || updateFeeMutation.isPending || isLoading}
                  variant="secondary"
                >
                  Save monthly fee
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}