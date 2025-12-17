"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Users,
  Building2,
  Calendar,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  KpiCard,
  TrendChart,
  BreakdownPie,
  DataTable,
  DateRangePicker,
  formatCurrency,
} from "@/components/analytics";

interface AnalyticsOverview {
  dateRange: { start: string; end: string };
  revenue: {
    totalRevenue: number;
    totalReservations: number;
    averageOrderValue: number;
    revenuePerAvailableNight: number;
    yoyGrowth: number | null;
  };
  guests: {
    totalGuests: number;
    newGuests: number;
    returningGuests: number;
    returnRate: number;
    averageStaysPerGuest: number;
  };
  accommodations: {
    totalSites: number;
    activeReservations: number;
    overallOccupancy: number;
    topPerformingType: string;
  };
  booking: {
    totalBookings: number;
    averageLeadTime: number;
    cancellationRate: number;
    lastMinutePercentage: number;
  };
  los: {
    averageLos: number;
    medianLos: number;
    weeklyStayPercentage: number;
    monthlyStayPercentage: number;
  };
  generatedAt: string;
}

// Mock data for demo
const mockOverview: AnalyticsOverview = {
  dateRange: {
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  },
  revenue: {
    totalRevenue: 2847500,
    totalReservations: 12450,
    averageOrderValue: 228.71,
    revenuePerAvailableNight: 45.32,
    yoyGrowth: 18.5,
  },
  guests: {
    totalGuests: 8234,
    newGuests: 3456,
    returningGuests: 4778,
    returnRate: 58.0,
    averageStaysPerGuest: 1.51,
  },
  accommodations: {
    totalSites: 1250,
    activeReservations: 342,
    overallOccupancy: 67.8,
    topPerformingType: "rv",
  },
  booking: {
    totalBookings: 12450,
    averageLeadTime: 21.5,
    cancellationRate: 8.2,
    lastMinutePercentage: 15.3,
  },
  los: {
    averageLos: 3.8,
    medianLos: 3,
    weeklyStayPercentage: 22.5,
    monthlyStayPercentage: 4.2,
  },
  generatedAt: new Date().toISOString(),
};

const mockRevenueTrends = [
  { month: "2024-01", revenue: 185000, reservations: 820 },
  { month: "2024-02", revenue: 195000, reservations: 890 },
  { month: "2024-03", revenue: 245000, reservations: 1050 },
  { month: "2024-04", revenue: 312000, reservations: 1340 },
  { month: "2024-05", revenue: 385000, reservations: 1650 },
  { month: "2024-06", revenue: 420000, reservations: 1780 },
  { month: "2024-07", revenue: 445000, reservations: 1890 },
  { month: "2024-08", revenue: 432000, reservations: 1820 },
  { month: "2024-09", revenue: 298000, reservations: 1280 },
  { month: "2024-10", revenue: 245000, reservations: 1050 },
  { month: "2024-11", revenue: 178000, reservations: 780 },
  { month: "2024-12", revenue: 165000, reservations: 720 },
];

const mockAccommodationMix = [
  { name: "RV Sites", value: 52, color: "#3b82f6" },
  { name: "Tent Sites", value: 28, color: "#10b981" },
  { name: "Cabins", value: 15, color: "#f59e0b" },
  { name: "Glamping", value: 5, color: "#8b5cf6" },
];

const mockTopCampgrounds = [
  { name: "Sunset Ridge RV Park", state: "TX", revenue: 425000, reservations: 1850 },
  { name: "Mountain View Camping", state: "CO", revenue: 387000, reservations: 1620 },
  { name: "Lakeside Resort", state: "FL", revenue: 356000, reservations: 1480 },
  { name: "Pine Forest Camp", state: "CA", revenue: 312000, reservations: 1340 },
  { name: "Desert Oasis RV", state: "AZ", revenue: 298000, reservations: 1250 },
];

export default function AnalyticsOverviewPage() {
  const [dateRange, setDateRange] = useState("last_12_months");
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/platform-analytics/overview?range=${dateRange}`);
      if (response.ok) {
        const result = await response.json();
        // Check if we have meaningful data
        if (result.revenue?.totalRevenue > 0) {
          setData(result);
          setIsUsingMockData(false);
        } else {
          setData(mockOverview);
          setIsUsingMockData(true);
        }
      } else {
        setData(mockOverview);
        setIsUsingMockData(true);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setData(mockOverview);
      setIsUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Analytics Hub</h1>
            {isUsingMockData && (
              <Badge className="bg-amber-600/20 text-amber-400 border border-amber-600/50">
                Demo Data
              </Badge>
            )}
          </div>
          <p className="text-slate-400 mt-1">
            Platform-wide analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => window.location.href = "/admin/analytics/export"}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue KPIs */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-400" />
          Revenue Intelligence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Revenue"
            value={data?.revenue.totalRevenue || 0}
            change={data?.revenue.yoyGrowth}
            changeLabel="YoY"
            format="currency"
            loading={loading}
            icon={<DollarSign className="h-5 w-5 text-green-400" />}
          />
          <KpiCard
            title="Total Reservations"
            value={data?.revenue.totalReservations || 0}
            format="number"
            loading={loading}
            icon={<Calendar className="h-5 w-5 text-blue-400" />}
          />
          <KpiCard
            title="Average Order Value"
            value={data?.revenue.averageOrderValue || 0}
            format="currency"
            loading={loading}
            icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
          />
          <KpiCard
            title="RevPAN"
            value={data?.revenue.revenuePerAvailableNight || 0}
            format="currency"
            loading={loading}
            subtitle="Revenue per Available Night"
            icon={<Building2 className="h-5 w-5 text-amber-400" />}
          />
        </div>
      </div>

      {/* Guest & Booking KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Guest Insights
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              title="Total Guests"
              value={data?.guests.totalGuests || 0}
              format="number"
              loading={loading}
            />
            <KpiCard
              title="Return Rate"
              value={data?.guests.returnRate || 0}
              format="percent"
              loading={loading}
            />
            <KpiCard
              title="New Guests"
              value={data?.guests.newGuests || 0}
              format="number"
              loading={loading}
            />
            <KpiCard
              title="Avg Stays/Guest"
              value={data?.guests.averageStaysPerGuest || 0}
              format="number"
              loading={loading}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-400" />
            Booking Behavior
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              title="Avg Lead Time"
              value={data?.booking.averageLeadTime || 0}
              format="days"
              loading={loading}
            />
            <KpiCard
              title="Cancellation Rate"
              value={data?.booking.cancellationRate || 0}
              format="percent"
              loading={loading}
            />
            <KpiCard
              title="Avg Length of Stay"
              value={data?.los.averageLos || 0}
              format="days"
              loading={loading}
            />
            <KpiCard
              title="Occupancy Rate"
              value={data?.accommodations.overallOccupancy || 0}
              format="percent"
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart
            title="Revenue Trends"
            description="Monthly revenue over time"
            data={mockRevenueTrends}
            dataKeys={[
              { key: "revenue", color: "#3b82f6", name: "Revenue" },
            ]}
            xAxisKey="month"
            type="area"
            height={300}
            formatYAxis={(v) => `$${(v / 1000).toFixed(0)}K`}
            formatTooltip={(v) => formatCurrency(v)}
            loading={loading}
          />
        </div>
        <BreakdownPie
          title="Accommodation Mix"
          description="Revenue distribution by type"
          data={mockAccommodationMix}
          height={300}
          formatValue={(v) => `${v}%`}
          loading={loading}
        />
      </div>

      {/* Top Campgrounds Table */}
      <DataTable
        title="Top Performing Campgrounds"
        description="Ranked by total revenue"
        columns={[
          { key: "name", label: "Campground" },
          { key: "state", label: "State", align: "center" },
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
        data={mockTopCampgrounds}
        loading={loading}
        maxRows={5}
      />

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {data?.accommodations.totalSites?.toLocaleString() || "—"}
          </p>
          <p className="text-sm text-slate-400">Total Sites</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {data?.los.weeklyStayPercentage?.toFixed(1) || "—"}%
          </p>
          <p className="text-sm text-slate-400">Weekly Stays</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            {data?.booking.lastMinutePercentage?.toFixed(1) || "—"}%
          </p>
          <p className="text-sm text-slate-400">Last-Minute Bookings</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white capitalize">
            {data?.accommodations.topPerformingType || "—"}
          </p>
          <p className="text-sm text-slate-400">Top Site Type</p>
        </div>
      </div>
    </div>
  );
}
