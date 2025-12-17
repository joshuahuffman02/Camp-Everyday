"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, RefreshCw, Heart, TrendingUp, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  KpiCard,
  TrendChart,
  BreakdownPie,
  DataTable,
  DateRangePicker,
  formatCurrency,
} from "@/components/analytics";

// Mock data
const mockGuestData = {
  overview: {
    totalGuests: 8234,
    newGuests: 3456,
    returningGuests: 4778,
    returnRate: 58.0,
    averageStaysPerGuest: 1.51,
  },
  accommodationProgression: {
    progressions: [
      { fromType: "tent", toType: "cabin", count: 234, percentage: 28.5 },
      { fromType: "tent", toType: "rv", count: 189, percentage: 23.0 },
      { fromType: "cabin", toType: "rv", count: 156, percentage: 19.0 },
      { fromType: "cabin", toType: "glamping", count: 98, percentage: 11.9 },
      { fromType: "rv", toType: "glamping", count: 67, percentage: 8.2 },
      { fromType: "tent", toType: "glamping", count: 78, percentage: 9.5 },
    ],
    upgradeRate: 68.5,
    downgradeRate: 31.5,
  },
  lifetimeValue: {
    tiers: [
      { tier: "$0-100", guestCount: 2450, totalRevenue: 122500, averageLtv: 50, averageStays: 1.0 },
      { tier: "$100-500", guestCount: 3280, totalRevenue: 820000, averageLtv: 250, averageStays: 1.8 },
      { tier: "$500-1K", guestCount: 1560, totalRevenue: 1170000, averageLtv: 750, averageStays: 3.2 },
      { tier: "$1K-5K", guestCount: 780, totalRevenue: 1560000, averageLtv: 2000, averageStays: 6.5 },
      { tier: "$5K+", guestCount: 164, totalRevenue: 1640000, averageLtv: 10000, averageStays: 15.2 },
    ],
    averageLtv: 645,
    topPercentileLtv: 2850,
  },
  retentionCohorts: [
    { cohortMonth: "2024-01", totalGuests: 580, retention30: 12.5, retention90: 28.4, retention180: 42.1 },
    { cohortMonth: "2024-02", totalGuests: 620, retention30: 13.2, retention90: 29.8, retention180: 44.2 },
    { cohortMonth: "2024-03", totalGuests: 780, retention30: 14.1, retention90: 31.2, retention180: 45.8 },
    { cohortMonth: "2024-04", totalGuests: 920, retention30: 15.5, retention90: 33.4, retention180: 48.2 },
    { cohortMonth: "2024-05", totalGuests: 1050, retention30: 16.2, retention90: 35.1, retention180: null },
    { cohortMonth: "2024-06", totalGuests: 1180, retention30: 17.8, retention90: null, retention180: null },
  ],
};

export default function GuestJourneyPage() {
  const [dateRange, setDateRange] = useState("last_12_months");
  const [data, setData] = useState(mockGuestData);
  const [loading, setLoading] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/platform-analytics/guests/journey?range=${dateRange}`);
        if (response.ok) {
          const result = await response.json();
          if (result.overview?.totalGuests > 0) {
            setData(result);
            setIsUsingMockData(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch guest data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const ltvPieData = data.lifetimeValue.tiers.map((tier) => ({
    name: tier.tier,
    value: tier.guestCount,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Guest Journey Analytics</h1>
            {isUsingMockData && (
              <Badge className="bg-amber-600/20 text-amber-400 border border-amber-600/50">
                Demo Data
              </Badge>
            )}
          </div>
          <p className="text-slate-400 mt-1">
            Understand guest behavior, progression, and lifetime value
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Guests"
          value={data.overview.totalGuests}
          format="number"
          loading={loading}
          icon={<Users className="h-5 w-5 text-blue-400" />}
        />
        <KpiCard
          title="New Guests"
          value={data.overview.newGuests}
          format="number"
          loading={loading}
          icon={<UserPlus className="h-5 w-5 text-green-400" />}
        />
        <KpiCard
          title="Returning Guests"
          value={data.overview.returningGuests}
          format="number"
          loading={loading}
          icon={<RefreshCw className="h-5 w-5 text-purple-400" />}
        />
        <KpiCard
          title="Return Rate"
          value={data.overview.returnRate}
          format="percent"
          loading={loading}
          icon={<Heart className="h-5 w-5 text-red-400" />}
        />
        <KpiCard
          title="Avg Stays/Guest"
          value={data.overview.averageStaysPerGuest}
          format="number"
          loading={loading}
        />
      </div>

      {/* Accommodation Progression */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Accommodation Progression
          </CardTitle>
          <p className="text-sm text-slate-400">
            How guests move between accommodation types over their journey
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upgrade/Downgrade Rates */}
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 font-medium">Upgrade Rate</p>
                <p className="text-3xl font-bold text-white">
                  {data.accommodationProgression.upgradeRate.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Guests moving to higher-tier accommodations
                </p>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400 font-medium">Downgrade Rate</p>
                <p className="text-3xl font-bold text-white">
                  {data.accommodationProgression.downgradeRate.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Guests moving to lower-tier accommodations
                </p>
              </div>
            </div>

            {/* Top Progressions */}
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-slate-400 mb-3">Top Progression Paths</p>
              <div className="space-y-2">
                {data.accommodationProgression.progressions.slice(0, 5).map((prog, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium capitalize">{prog.fromType}</span>
                      <ArrowRight className="h-4 w-4 text-slate-500" />
                      <span className="text-white font-medium capitalize">{prog.toType}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-medium">{prog.count}</span>
                      <span className="text-slate-400 text-sm ml-2">({prog.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LTV Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable
            title="Lifetime Value by Tier"
            description="Guest distribution across value segments"
            columns={[
              { key: "tier", label: "LTV Tier" },
              { key: "guestCount", label: "Guests", align: "right", format: (v) => v.toLocaleString() },
              { key: "totalRevenue", label: "Total Revenue", align: "right", format: (v) => formatCurrency(v) },
              { key: "averageLtv", label: "Avg LTV", align: "right", format: (v) => formatCurrency(v) },
              { key: "averageStays", label: "Avg Stays", align: "right", format: (v) => v.toFixed(1) },
            ]}
            data={data.lifetimeValue.tiers}
            loading={loading}
          />
        </div>
        <div className="space-y-4">
          <KpiCard
            title="Average LTV"
            value={data.lifetimeValue.averageLtv}
            format="currency"
            loading={loading}
          />
          <KpiCard
            title="Top 10% LTV"
            value={data.lifetimeValue.topPercentileLtv}
            format="currency"
            loading={loading}
            subtitle="90th percentile guest value"
          />
          <BreakdownPie
            title="Guests by LTV Tier"
            data={ltvPieData}
            height={200}
            showLegend={false}
            loading={loading}
          />
        </div>
      </div>

      {/* Retention Cohorts */}
      <DataTable
        title="Retention Cohorts"
        description="Track how guest cohorts return over time"
        columns={[
          { key: "cohortMonth", label: "Cohort" },
          { key: "totalGuests", label: "Guests", align: "right", format: (v) => v.toLocaleString() },
          { key: "retention30", label: "30-Day", align: "right", format: (v) => v !== null ? `${v.toFixed(1)}%` : "—" },
          { key: "retention90", label: "90-Day", align: "right", format: (v) => v !== null ? `${v.toFixed(1)}%` : "—" },
          { key: "retention180", label: "180-Day", align: "right", format: (v) => v !== null ? `${v.toFixed(1)}%` : "—" },
        ]}
        data={data.retentionCohorts}
        loading={loading}
      />
    </div>
  );
}
