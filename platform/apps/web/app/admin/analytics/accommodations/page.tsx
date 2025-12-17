"use client";

import { useState, useEffect } from "react";
import { Building2, Truck, Tent, Home, Sparkles } from "lucide-react";
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
const mockAccommodationData = {
  overview: {
    totalSites: 1250,
    activeReservations: 342,
    overallOccupancy: 67.8,
    topPerformingType: "rv",
  },
  typeDistribution: [
    { type: "rv", siteCount: 650, reservations: 6475, revenue: 1480300, occupancyRate: 72.5, revenueShare: 52.0 },
    { type: "tent", siteCount: 350, reservations: 3486, revenue: 797300, occupancyRate: 58.2, revenueShare: 28.0 },
    { type: "cabin", siteCount: 150, reservations: 1868, revenue: 427125, occupancyRate: 78.4, revenueShare: 15.0 },
    { type: "glamping", siteCount: 100, reservations: 621, revenue: 142375, occupancyRate: 65.8, revenueShare: 5.0 },
  ],
  rigTypes: [
    { rigType: "Travel Trailer", count: 2850, percentage: 35.2, averageLength: 24, averageSpend: 245 },
    { rigType: "Fifth Wheel", count: 1620, percentage: 20.0, averageLength: 32, averageSpend: 285 },
    { rigType: "Class A", count: 1215, percentage: 15.0, averageLength: 38, averageSpend: 320 },
    { rigType: "Class C", count: 972, percentage: 12.0, averageLength: 28, averageSpend: 265 },
    { rigType: "Class B / Van", count: 810, percentage: 10.0, averageLength: 22, averageSpend: 225 },
    { rigType: "Truck Camper", count: 324, percentage: 4.0, averageLength: 18, averageSpend: 195 },
    { rigType: "Pop-Up", count: 284, percentage: 3.5, averageLength: 16, averageSpend: 175 },
    { rigType: "Other", count: 25, percentage: 0.3, averageLength: 20, averageSpend: 210 },
  ],
  utilizationByType: {
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    byType: {
      rv: [45, 48, 55, 68, 82, 88, 92, 90, 75, 62, 48, 42],
      tent: [25, 28, 38, 52, 72, 85, 90, 88, 65, 45, 28, 22],
      cabin: [55, 58, 62, 72, 80, 85, 88, 86, 78, 68, 58, 52],
      glamping: [35, 38, 48, 58, 72, 78, 82, 80, 68, 55, 38, 32],
    },
  },
};

export default function AccommodationsPage() {
  const [dateRange, setDateRange] = useState("last_12_months");
  const [data, setData] = useState(mockAccommodationData);
  const [loading, setLoading] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/platform-analytics/accommodations?range=${dateRange}`);
        if (response.ok) {
          const result = await response.json();
          if (result.overview?.totalSites > 0) {
            setData(result);
            setIsUsingMockData(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch accommodation data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const typeIcons: Record<string, React.ReactNode> = {
    rv: <Truck className="h-5 w-5 text-blue-400" />,
    tent: <Tent className="h-5 w-5 text-green-400" />,
    cabin: <Home className="h-5 w-5 text-amber-400" />,
    glamping: <Sparkles className="h-5 w-5 text-purple-400" />,
  };

  const pieData = data.typeDistribution.map((item) => ({
    name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
    value: item.revenueShare,
  }));

  const utilizationData = data.utilizationByType.months.map((month, idx) => ({
    month,
    rv: data.utilizationByType.byType.rv[idx],
    tent: data.utilizationByType.byType.tent[idx],
    cabin: data.utilizationByType.byType.cabin[idx],
    glamping: data.utilizationByType.byType.glamping[idx],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Accommodation Mix</h1>
            {isUsingMockData && (
              <Badge className="bg-amber-600/20 text-amber-400 border border-amber-600/50">
                Demo Data
              </Badge>
            )}
          </div>
          <p className="text-slate-400 mt-1">
            Site types, RV breakdown, and utilization analysis
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Sites"
          value={data.overview.totalSites}
          format="number"
          loading={loading}
          icon={<Building2 className="h-5 w-5 text-blue-400" />}
        />
        <KpiCard
          title="Active Reservations"
          value={data.overview.activeReservations}
          format="number"
          loading={loading}
        />
        <KpiCard
          title="Overall Occupancy"
          value={data.overview.overallOccupancy}
          format="percent"
          loading={loading}
        />
        <KpiCard
          title="Top Performer"
          value={data.overview.topPerformingType.toUpperCase()}
          loading={loading}
          subtitle="Highest revenue type"
        />
      </div>

      {/* Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable
            title="Site Type Performance"
            description="Revenue and occupancy by accommodation type"
            columns={[
              {
                key: "type",
                label: "Type",
                format: (v) => (
                  <div className="flex items-center gap-2">
                    {typeIcons[v]}
                    <span className="capitalize">{v}</span>
                  </div>
                ),
              },
              { key: "siteCount", label: "Sites", align: "right", format: (v) => v.toLocaleString() },
              { key: "reservations", label: "Reservations", align: "right", format: (v) => v.toLocaleString() },
              { key: "revenue", label: "Revenue", align: "right", format: (v) => formatCurrency(v) },
              { key: "occupancyRate", label: "Occupancy", align: "right", format: (v) => `${v.toFixed(1)}%` },
            ]}
            data={data.typeDistribution}
            loading={loading}
          />
        </div>
        <BreakdownPie
          title="Revenue Share"
          description="By accommodation type"
          data={pieData}
          height={300}
          formatValue={(v) => `${v.toFixed(1)}%`}
          loading={loading}
        />
      </div>

      {/* Utilization Over Time */}
      <TrendChart
        title="Occupancy by Type Over Time"
        description="Monthly utilization rates by accommodation type"
        data={utilizationData}
        dataKeys={[
          { key: "rv", color: "#3b82f6", name: "RV" },
          { key: "tent", color: "#10b981", name: "Tent" },
          { key: "cabin", color: "#f59e0b", name: "Cabin" },
          { key: "glamping", color: "#8b5cf6", name: "Glamping" },
        ]}
        xAxisKey="month"
        type="line"
        height={300}
        formatYAxis={(v) => `${v}%`}
        formatTooltip={(v) => `${v.toFixed(1)}%`}
        loading={loading}
      />

      {/* RV Type Breakdown */}
      <DataTable
        title="RV Type Breakdown"
        description="Detailed analysis of RV types used by guests"
        columns={[
          { key: "rigType", label: "RV Type" },
          { key: "count", label: "Reservations", align: "right", format: (v) => v.toLocaleString() },
          { key: "percentage", label: "% of Total", align: "right", format: (v) => `${v.toFixed(1)}%` },
          { key: "averageLength", label: "Avg Length (ft)", align: "right", format: (v) => v.toString() },
          { key: "averageSpend", label: "Avg Spend", align: "right", format: (v) => formatCurrency(v) },
        ]}
        data={data.rigTypes}
        loading={loading}
      />
    </div>
  );
}
