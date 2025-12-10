"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { DashboardShell } from "../../../components/ui/layout/DashboardShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";

const channelUsage = [
  { channel: "Direct", redemptions: 124, revenue: "$18,400", avgDiscount: "12%", share: "38%" },
  { channel: "Email", redemptions: 98, revenue: "$14,250", avgDiscount: "10%", share: "30%" },
  { channel: "OTA-safe", redemptions: 46, revenue: "$6,980", avgDiscount: "8%", share: "18%" },
  { channel: "Social", redemptions: 28, revenue: "$4,050", avgDiscount: "15%", share: "9%" },
  { channel: "On-site", redemptions: 22, revenue: "$3,200", avgDiscount: "5%", share: "5%" },
];

const dailyUsage = [
  { date: "Mon", redemptions: 22, revenue: "$3,250", topChannel: "Email" },
  { date: "Tue", redemptions: 31, revenue: "$4,620", topChannel: "Direct" },
  { date: "Wed", redemptions: 28, revenue: "$4,180", topChannel: "Direct" },
  { date: "Thu", redemptions: 36, revenue: "$5,540", topChannel: "Email" },
  { date: "Fri", redemptions: 44, revenue: "$6,780", topChannel: "OTA-safe" },
  { date: "Sat", redemptions: 57, revenue: "$8,110", topChannel: "Social" },
  { date: "Sun", redemptions: 50, revenue: "$7,400", topChannel: "Direct" },
];

const liftSummary = {
  baselineConversion: 2.1,
  promoConversion: 2.9,
  baselineBookings: 180,
  promoBookings: 226,
  incrementalRevenue: "$12,400",
};

const abResults = [
  { test: "Autumn push", variant: "Control", conversion: "2.5%", revenuePerBooking: "$412", lift: "—" },
  { test: "Autumn push", variant: "Variant B (15% off)", conversion: "2.7%", revenuePerBooking: "$397", lift: "+8%", winner: true },
  { test: "Winter kickoff", variant: "Control", conversion: "2.2%", revenuePerBooking: "$388", lift: "—" },
  { test: "Winter kickoff", variant: "Variant A (BOGO night)", conversion: "2.6%", revenuePerBooking: "$401", lift: "+12%", winner: true },
];

const optimizerTests = [
  { name: "Winter kickoff", variant: "B: 12% off email-first", conversion: "2.7%", revenuePerBooking: "$392", lift: "+11%" },
  { name: "Autumn push", variant: "B: 15% off w/ min nights", conversion: "2.7%", revenuePerBooking: "$397", lift: "+8%" },
  { name: "Weekday fill", variant: "B: 1 night free (Sun–Thu)", conversion: "2.3%", revenuePerBooking: "$376", lift: "+6%" },
];

const optimizerNextStep = {
  headline: "Roll out the winter variant to email + social, keep control on OTA-safe.",
  bullets: [
    "Make Variant B the default for owned channels for the next 10 days.",
    "Hold OTA-safe/control pricing to preserve ADR; retest revenue/booking after 1 week.",
    "Spin a follow-up test on weekday fill with a smaller give (8–10%) to protect margin.",
  ],
};

type ReferralStatus = "pending" | "approved" | "paid";

type ReferralRow = {
  id: string;
  partner: string;
  code: string;
  clicks: number;
  signups: number;
  bookings: number;
  revenue: string;
  status: ReferralStatus;
  lastActivity: string;
};

const statusStyles: Record<ReferralStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-blue-200 bg-blue-50 text-blue-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const defaultReferrals: ReferralRow[] = [
  {
    id: "AFF-1042",
    partner: "Happy Campers Club",
    code: "HAPPY-CAMP",
    clicks: 82,
    signups: 19,
    bookings: 7,
    revenue: "$1,540",
    status: "approved",
    lastActivity: "2h ago",
  },
  {
    id: "AFF-1043",
    partner: "Vanlife Vibes",
    code: "VANLIFE-10",
    clicks: 41,
    signups: 9,
    bookings: 3,
    revenue: "$780",
    status: "pending",
    lastActivity: "1d ago",
  },
  {
    id: "AFF-1044",
    partner: "Trailhead Guides",
    code: "TRAILHEAD",
    clicks: 29,
    signups: 6,
    bookings: 2,
    revenue: "$430",
    status: "paid",
    lastActivity: "3d ago",
  },
];

const defaultBaseUrl = "https://campreserv.com/book?campground=demo-park";
const defaultCampaign = "referrals-pilot";
const defaultRefCode = "AFF-DEMO";

function buildReferralLink(baseUrl: string, campaign: string, refCode: string) {
  const safeBase = baseUrl?.trim() || defaultBaseUrl;
  const searchParams = new URLSearchParams({
    utm_source: "affiliate",
    utm_medium: "referral",
    utm_campaign: campaign || "referrals",
    ref: refCode || "campref",
  });

  try {
    const url = new URL(safeBase);
    searchParams.forEach((value, key) => url.searchParams.set(key, value));
    return url.toString();
  } catch {
    const separator = safeBase.includes("?") ? "&" : "?";
    return `${safeBase}${separator}${searchParams.toString()}`;
  }
}

export default function PromotionsPage() {
  const conversionLift = (liftSummary.promoConversion - liftSummary.baselineConversion).toFixed(1);
  const bookingLift = liftSummary.promoBookings - liftSummary.baselineBookings;
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [campaign, setCampaign] = useState(defaultCampaign);
  const [refCode, setRefCode] = useState(defaultRefCode);
  const [referrals, setReferrals] = useState<ReferralRow[]>(defaultReferrals);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [lastAction, setLastAction] = useState("Payout/export is stubbed here — no real money movement.");

  const generatedLink = useMemo(() => buildReferralLink(baseUrl, campaign, refCode), [baseUrl, campaign, refCode]);

  const handleCopy = async () => {
    try {
      await navigator?.clipboard?.writeText(generatedLink);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("idle");
    }
  };

  const markBatchPaid = () => {
    setReferrals((rows) =>
      rows.map((row) => (row.status === "approved" || row.status === "pending" ? { ...row, status: "paid" } : row)),
    );
    setLastAction("Marked current batch as paid (stub only).");
  };

  const exportCsv = () => {
    setLastAction("CSV export prepared (stub only).");
  };

  const resetParams = () => {
    setBaseUrl(defaultBaseUrl);
    setCampaign(defaultCampaign);
    setRefCode(defaultRefCode);
    setLastAction("Reset link inputs to defaults (stub).");
    setCopyState("idle");
  };

  return (
    <DashboardShell>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Promotions & discounts</CardTitle>
              <Badge variant="secondary">Stub data</Badge>
            </div>
            <CardDescription>Manage promo codes, keep them synced with booking, and review performance snapshots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-600">
              Create percentage or flat promos, set validity windows and usage caps, and toggle availability without code changes.
            </div>
            <div className="text-xs text-slate-600">
              Promotions apply to admin and public booking flows; OTA-safe pricing is respected by hold/blackout logic.
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/settings/promotions">
                <Button size="sm">Open Promotions settings</Button>
              </Link>
              <Link href="/reports?tab=marketing&subTab=booking-sources">
                <Button size="sm" variant="outline">View channel mix</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Promo optimizer</CardTitle>
              <Badge variant="secondary">Stubbed</Badge>
            </div>
            <CardDescription>Compact readout of promo experiments plus a next-step suggestion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                    <TableHead className="text-right">Revenue/booking</TableHead>
                    <TableHead className="text-right">Lift</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optimizerTests.map((row) => (
                    <TableRow key={`${row.name}-${row.variant}`}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-sm text-slate-700">{row.variant}</TableCell>
                      <TableCell className="text-right">{row.conversion}</TableCell>
                      <TableCell className="text-right">{row.revenuePerBooking}</TableCell>
                      <TableCell className="text-right text-emerald-600">{row.lift}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 p-3">
              <div className="text-sm font-semibold text-emerald-900">What to do next (stub)</div>
              <div className="text-xs text-emerald-800">{optimizerNextStep.headline}</div>
              <ul className="mt-2 space-y-1 text-xs text-emerald-900 list-disc pl-4">
                {optimizerNextStep.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="text-[11px] text-emerald-800/80 mt-2">Stub recommendations only — no live changes are triggered.</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Usage by channel</CardTitle>
              <CardDescription>Aggregated promo redemptions by source (stub).</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Redemptions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Avg discount</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channelUsage.map((row) => (
                    <TableRow key={row.channel}>
                      <TableCell className="font-medium">{row.channel}</TableCell>
                      <TableCell className="text-right">{row.redemptions}</TableCell>
                      <TableCell className="text-right">{row.revenue}</TableCell>
                      <TableCell className="text-right">{row.avgDiscount}</TableCell>
                      <TableCell className="text-right text-slate-600">{row.share}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage by day</CardTitle>
              <CardDescription>Seven-day redemption and revenue trend (stub).</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead className="text-right">Redemptions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Top channel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyUsage.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="font-medium">{row.date}</TableCell>
                      <TableCell className="text-right">{row.redemptions}</TableCell>
                      <TableCell className="text-right">{row.revenue}</TableCell>
                      <TableCell className="text-right text-slate-600">{row.topChannel}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Lift vs baseline (stub)</CardTitle>
              <CardDescription>Week over week, comparing to prior 4-week average.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-slate-500">Conversion rate</div>
                  <div className="text-2xl font-semibold">{liftSummary.promoConversion}%</div>
                </div>
                <Badge variant="outline">+{conversionLift} pts</Badge>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-slate-500">Bookings vs baseline</div>
                  <div className="text-lg font-semibold">{liftSummary.promoBookings}</div>
                  <div className="text-xs text-slate-500">Baseline {liftSummary.baselineBookings}</div>
                </div>
                <span className="text-sm text-emerald-600">+{bookingLift} incremental</span>
              </div>
              <div>
                <div className="text-xs text-slate-500">Incremental revenue (stub)</div>
                <div className="text-lg font-semibold">{liftSummary.incrementalRevenue}</div>
              </div>
              <p className="text-xs text-slate-500">
                Data shown for illustration only. Replace with real baselines when telemetry is wired.
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>A/B experiments</CardTitle>
                <Badge variant="outline">Stubbed results</Badge>
              </div>
              <CardDescription>Lightweight experiment readout for promo variants.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                    <TableHead className="text-right">Revenue/booking</TableHead>
                    <TableHead className="text-right">Lift</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abResults.map((row, idx) => (
                    <TableRow key={`${row.test}-${idx}`}>
                      <TableCell className="font-medium">{row.test}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        {row.variant}
                        {row.winner ? <Badge variant="secondary">Winner</Badge> : null}
                      </TableCell>
                      <TableCell className="text-right">{row.conversion}</TableCell>
                      <TableCell className="text-right">{row.revenuePerBooking}</TableCell>
                      <TableCell className={`text-right ${row.lift.startsWith("+") ? "text-emerald-600" : "text-slate-600"}`}>
                        {row.lift}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Referrals & affiliates</CardTitle>
              <Badge variant="secondary">Stub</Badge>
            </div>
            <CardDescription>Generate referral links with tracking params and simulate payouts/exports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base link</Label>
                <Input
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder="https://campreserv.com/book"
                />
                <p className="text-xs text-slate-500">Use a public booking or landing page.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Input
                  id="campaign"
                  value={campaign}
                  onChange={(event) => setCampaign(event.target.value)}
                  placeholder="spring-promo"
                />
                <p className="text-xs text-slate-500">Appended as utm_campaign.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refCode">Referral code</Label>
                <Input
                  id="refCode"
                  value={refCode}
                  onChange={(event) => setRefCode(event.target.value)}
                  placeholder="AFF-123"
                />
                <p className="text-xs text-slate-500">Appended as ref plus affiliate code.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-3">
              <div className="flex-1 space-y-1">
                <div className="text-xs font-semibold text-slate-900">Generated link</div>
                <div className="break-all text-xs text-slate-800">{generatedLink}</div>
                <div className="text-[11px] text-slate-600">
                  Tracking params auto-append: utm_source=affiliate, utm_medium=referral, utm_campaign, and ref={refCode || "campref"}.
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCopy} variant="secondary">
                  {copyState === "copied" ? "Copied" : "Copy link"}
                </Button>
                <Button size="sm" onClick={resetParams} variant="outline">
                  Reset to defaults
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Payout/export (stub)</div>
                  <div className="text-xs text-slate-600">
                    Mark affiliate commissions as paid and export a CSV without touching live processors.
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{lastAction}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={exportCsv}>
                    Export CSV
                  </Button>
                  <Button size="sm" variant="secondary" onClick={markBatchPaid}>
                    Mark batch paid
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral performance</CardTitle>
            <CardDescription>Stubbed affiliates and statuses to validate tracking and payouts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Signups</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Attributed rev</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">{row.partner}</div>
                      <div className="text-xs text-slate-500">{row.id}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">{row.code}</TableCell>
                    <TableCell className="text-right text-sm text-slate-700">{row.clicks}</TableCell>
                    <TableCell className="text-right text-sm text-slate-700">{row.signups}</TableCell>
                    <TableCell className="text-right text-sm text-slate-700">{row.bookings}</TableCell>
                    <TableCell className="text-right text-sm text-slate-900">{row.revenue}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusStyles[row.status]}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{row.lastActivity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-xs text-slate-600">
              Statuses are stubbed (pending → approved → paid) for demos; no live payouts or exports are triggered.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
