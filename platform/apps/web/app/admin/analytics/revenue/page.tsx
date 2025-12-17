"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Building2, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  KpiCard,
  TrendChart,
  BreakdownPie,
  DataTable,
  DateRangePicker,
  formatCurrency,
} from "@/components/analytics";

// Mock data
const mockRevenueData = {
  overview: {
    totalRevenue: 2847500,
    totalReservations: 12450,
    averageOrderValue: 228.71,
    revenuePerAvailableNight: 45.32,
    yoyGrowth: 18.5,
  },
  byAccommodationType: [
    { type: "rv", revenue: 1480300, reservations: 6475, percentage: 52.0, adr: 68.50 },
    { type: "tent", revenue: 797300, reservations: 3486, percentage: 28.0, adr: 35.20 },
    { type: "cabin", revenue: 427125, reservations: 1868, percentage: 15.0, adr: 95.80 },
    { type: "glamping", revenue: 142375, reservations: 621, percentage: 5.0, adr: 125.40 },
  ],
  monthlyTrends: [
    { month: "Jan 2024", revenue: 185000, reservations: 820, adr: 55.2 },
    { month: "Feb 2024", revenue: 195000, reservations: 890, adr: 56.8 },
    { month: "Mar 2024", revenue: 245000, reservations: 1050, adr: 58.1 },
    { month: "Apr 2024", revenue: 312000, reservations: 1340, adr: 62.4 },
    { month: "May 2024", revenue: 385000, reservations: 1650, adr: 65.8 },
    { month: "Jun 2024", revenue: 420000, reservations: 1780, adr: 68.2 },
    { month: "Jul 2024", revenue: 445000, reservations: 1890, adr: 72.5 },
    { month: "Aug 2024", revenue: 432000, reservations: 1820, adr: 71.8 },
    { month: "Sep 2024", revenue: 298000, reservations: 1280, adr: 64.3 },
    { month: "Oct 2024", revenue: 245000, reservations: 1050, adr: 58.9 },
    { month: "Nov 2024", revenue: 178000, reservations: 780, adr: 52.4 },
    { month: "Dec 2024", revenue: 165000, reservations: 720, adr: 48.6 },
  ],
  topCampgrounds: [
    { campground: { name: "Sunset Ridge RV Park", city: "Austin", state: "TX" }, revenue: 425000, reservations: 1850 },
    { campground: { name: "Mountain View Camping", city: "Boulder", state: "CO" }, revenue: 387000, reservations: 1620 },
    { campground: { name: "Lakeside Resort", city: "Orlando", state: "FL" }, revenue: 356000, reservations: 1480 },
    { campground: { name: "Pine Forest Camp", city: "San Diego", state: "CA" }, revenue: 312000, reservations: 1340 },
    { campground: { name: "Desert Oasis RV", city: "Phoenix", state: "AZ" }, revenue: 298000, reservations: 1250 },
    { campground: { name: "Coastal Haven", city: "Portland", state: "OR" }, revenue: 275000, reservations: 1180 },
    { campground: { name: "Valley View Park", city: "Nashville", state: "TN" }, revenue: 256000, reservations: 1120 },
    { campground: { name: "River Bend Camp", city: "Boise", state: "ID" }, revenue: 234000, reservations: 1020 },
  ],
};

export default function RevenueIntelligencePage() {
  const [dateRange, setDateRange] = useState("last_12_months");
  const [data, setData] = useState(mockRevenueData);
  const [loading, setLoading] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/platform-analytics/revenue?range=${dateRange}`);
        if (response.ok) {
          const result = await response.json();
          if (result.overview?.totalRevenue > 0) {
            setData(result);
            setIsUsingMockData(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch revenue data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const pieData = data.byAccommodationType.map((item, idx) => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    value: item.percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Revenue Intelligence</h1>
            {isUsingMockData && (
              <Badge className="bg-amber-600/20 text-amber-400 border border-amber-600/50">
                Demo Data
              </Badge>
            )}
          </div>
          <p className="text-slate-400 mt-1">
            Deep dive into platform revenue metrics and trends
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Revenue"
          value={data.overview.totalRevenue}
          change={data.overview.yoyGrowth}
          changeLabel="YoY"
          format="currency"
          loading={loading}
          icon={<DollarSign className="h-5 w-5 text-green-400" />}
        />
        <KpiCard
          title="Total Reservations"
          value={data.overview.totalReservations}
          format="number"
          loading={loading}
        />
        <KpiCard
          title="Avg Order Value"
          value={data.overview.averageOrderValue}
          format="currency"
          loading={loading}
          icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
        />
        <KpiCard
          title="RevPAN"
          value={data.overview.revenuePerAvailableNight}
          format="currency"
          loading={loading}
          subtitle="Revenue per Available Night"
        />
        <KpiCard
          title="YoY Growth"
          value={data.overview.yoyGrowth || 0}
          format="percent"
          loading={loading}
          icon={<Award className="h-5 w-5 text-amber-400" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart
            title="Monthly Revenue Trend"
            description="Revenue and booking volume over time"
            data={data.monthlyTrends}
            dataKeys={[
              { key: "revenue", color: "#3b82f6", name: "Revenue" },
            ]}
            xAxisKey="month"
            type="area"
            height={350}
            formatYAxis={(v) => `$${(v / 1000).toFixed(0)}K`}
            formatTooltip={(v) => formatCurrency(v)}
            loading={loading}
          />
        </div>
        <BreakdownPie
          title="Revenue by Type"
          description="Accommodation type distribution"
          data={pieData}
          height={350}
          formatValue={(v) => `${v.toFixed(1)}%`}
          loading={loading}
        />
      </div>

      {/* ADR Trend */}
      <TrendChart
        title="Average Daily Rate (ADR) Trend"
        description="Track rate changes over time"
        data={data.monthlyTrends}
        dataKeys={[
          { key: "adr", color: "#10b981", name: "ADR" },
        ]}
        xAxisKey="month"
        type="line"
        height={250}
        formatYAxis={(v) => `$${v.toFixed(0)}`}
        formatTooltip={(v) => `$${v.toFixed(2)}`}
        loading={loading}
      />

      {/* Revenue by Type Table */}
      <DataTable
        title="Revenue by Accommodation Type"
        description="Detailed breakdown with ADR metrics"
        columns={[
          {
            key: "type",
            label: "Type",
            format: (v) => v.charAt(0).toUpperCase() + v.slice(1),
          },
          {
            key: "revenue",
            label: "Revenue",
            align: "right",
            format: (v) => formatCurrency(v),
          },
          {
            key: "reservations",
            label: "Reservations",
            align: "right",
            format: (v) => v.toLocaleString(),
          },
          {
            key: "percentage",
            label: "% of Total",
            align: "right",
            format: (v) => `${v.toFixed(1)}%`,
          },
          {
            key: "adr",
            label: "ADR",
            align: "right",
            format: (v) => `$${v.toFixed(2)}`,
          },
        ]}
        data={data.byAccommodationType}
        loading={loading}
      />

      {/* Top Campgrounds */}
      <DataTable
        title="Top Performing Campgrounds"
        description="Ranked by total revenue"
        columns={[
          {
            key: "campground",
            label: "Campground",
            format: (v) => v.name,
          },
          {
            key: "campground",
            label: "Location",
            format: (v) => `${v.city}, ${v.state}`,
          },
          {
            key: "revenue",
            label: "Revenue",
            align: "right",
            format: (v) => formatCurrency(v),
          },
          {
            key: "reservations",
            label: "Reservations",
            align: "right",
            format: (v) => v.toLocaleString(),
          },
        ]}
        data={data.topCampgrounds}
        loading={loading}
      />
    </div>
  );
}
