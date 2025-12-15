import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";


interface OverviewReportProps {
    campgroundId: string;
}

const formatCurrencyLocal = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

export function OverviewReport({ campgroundId }: OverviewReportProps) {
    const summaryQuery = useQuery({
        queryKey: ["reports-summary", campgroundId],
        queryFn: () => apiClient.getDashboardSummary(campgroundId),
        enabled: !!campgroundId
    });

    const npsMetricsQuery = useQuery({
        queryKey: ["nps-metrics", campgroundId],
        queryFn: () => apiClient.getNpsMetrics(campgroundId),
        enabled: !!campgroundId
    });

    const reservationsQuery = useQuery({
        queryKey: ["reservations-all", campgroundId],
        queryFn: () => apiClient.getReservations(campgroundId),
        enabled: !!campgroundId
    });

    const sitesQuery = useQuery({
        queryKey: ["sites", campgroundId],
        queryFn: () => apiClient.getSites(campgroundId),
        enabled: !!campgroundId
    });

    const cards = useMemo(() => {
        if (!summaryQuery.data) return [];
        const s = summaryQuery.data;
        return [
            { label: "Revenue (30d)", value: formatCurrencyLocal(s.revenue) },
            { label: "ADR", value: formatCurrencyLocal(s.adr) },
            { label: "RevPAR", value: formatCurrencyLocal(s.revpar) },
            { label: "Occupancy", value: `${s.occupancy}%` },
            { label: "Future reservations", value: s.futureReservations },
            { label: "Sites", value: s.sites },
            { label: "Overdue balance", value: formatCurrencyLocal(s.overdueBalance) },
            { label: "Maintenance open", value: s.maintenanceOpen },
            { label: "Maintenance overdue", value: s.maintenanceOverdue }
        ];
    }, [summaryQuery.data]);

    // Year-over-year comparison
    const yearOverYearStats = useMemo(() => {
        if (!reservationsQuery.data) return null;

        const now = new Date();
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

        const thisYear = reservationsQuery.data.filter((r: any) => {
            const arrival = new Date(r.arrivalDate);
            return arrival >= thisYearStart && r.status !== 'cancelled';
        });

        const lastYear = reservationsQuery.data.filter((r: any) => {
            const arrival = new Date(r.arrivalDate);
            return arrival >= lastYearStart && arrival <= lastYearEnd && r.status !== 'cancelled';
        });

        const thisYearRevenue = thisYear.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0) / 100;
        const lastYearRevenue = lastYear.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0) / 100;

        const revenueChange = lastYearRevenue > 0 ? (((thisYearRevenue - lastYearRevenue) / lastYearRevenue) * 100).toFixed(1) : '0';

        return {
            thisYear: { bookings: thisYear.length, revenue: thisYearRevenue },
            lastYear: { bookings: lastYear.length, revenue: lastYearRevenue },
            change: {
                bookings: thisYear.length - lastYear.length,
                revenuePercent: revenueChange
            }
        };
    }, [reservationsQuery.data]);

    // Seasonal stats (Derived)
    const seasonalStats = useMemo(() => {
        if (!reservationsQuery.data) return null;

        const stats: Record<string, { revenue: number, bookings: number, nights: number }> = {
            'Spring': { revenue: 0, bookings: 0, nights: 0 },
            'Summer': { revenue: 0, bookings: 0, nights: 0 },
            'Fall': { revenue: 0, bookings: 0, nights: 0 },
            'Winter': { revenue: 0, bookings: 0, nights: 0 }
        };

        const getSeason = (date: Date) => {
            const month = date.getMonth();
            if (month >= 2 && month <= 4) return 'Spring';
            if (month >= 5 && month <= 7) return 'Summer';
            if (month >= 8 && month <= 10) return 'Fall';
            return 'Winter';
        };

        reservationsQuery.data.forEach((r: any) => {
            if (r.status === 'cancelled') return;
            const arrival = new Date(r.arrivalDate);
            const departure = new Date(r.departureDate);
            const season = getSeason(arrival);

            const rev = (r.totalAmount || 0) / 100;
            const nights = Math.max(1, Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24)));

            stats[season].revenue += rev;
            stats[season].bookings += 1;
            stats[season].nights += nights;
        });

        return Object.entries(stats).map(([season, data]) => ({
            season,
            revenue: data.revenue,
            bookings: data.bookings,
            avgNights: data.bookings > 0 ? (data.nights / data.bookings).toFixed(1) : '0'
        }));
    }, [reservationsQuery.data]);

    if (summaryQuery.isLoading) {
        return <div className="text-sm text-slate-500">Loading metrics…</div>;
    }

    if (summaryQuery.error) {
        return (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Some report data failed to load. Try again or refresh.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            {summaryQuery.data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-2"
                        >
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                                {card.label}
                            </div>
                            <div className="text-xl font-semibold text-slate-900">{card.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* NPS Metrics */}
            {npsMetricsQuery.data && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="text-[11px] uppercase tracking-wide text-emerald-700 font-semibold">NPS</div>
                        <div className="text-3xl font-bold text-emerald-900 mt-1">{npsMetricsQuery.data.nps ?? "—"}</div>
                        <div className="text-xs text-emerald-700">Promoters {npsMetricsQuery.data.promoters} · Detractors {npsMetricsQuery.data.detractors}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Responses</div>
                        <div className="text-3xl font-bold text-slate-900 mt-1">{npsMetricsQuery.data.totalResponses}</div>
                        <div className="text-xs text-slate-500">Response rate {npsMetricsQuery.data.responseRate ?? "—"}%</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Passives</div>
                        <div className="text-3xl font-bold text-slate-900 mt-1">{npsMetricsQuery.data.passives}</div>
                        <div className="text-xs text-slate-500">Balanced feedback</div>
                    </div>
                </div>
            )}

            {/* Year-over-Year Comparison */}
            {yearOverYearStats && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-900">Year-over-Year Comparison</div>
                        <div className="text-xs text-slate-500">{new Date().getFullYear()} vs {new Date().getFullYear() - 1}</div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-slate-700 uppercase">This Year</div>
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 shadow-inner">
                                <div className="text-xs text-blue-700 mb-1">Bookings</div>
                                <div className="text-2xl font-bold text-blue-900">{yearOverYearStats.thisYear.bookings}</div>
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 shadow-inner">
                                <div className="text-xs text-emerald-700 mb-1">Revenue</div>
                                <div className="text-2xl font-bold text-emerald-900">{formatCurrencyLocal(yearOverYearStats.thisYear.revenue, 0)}</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-slate-700 uppercase">Last Year</div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-inner">
                                <div className="text-xs text-slate-600 mb-1">Bookings</div>
                                <div className="text-2xl font-bold text-slate-900">{yearOverYearStats.lastYear.bookings}</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-inner">
                                <div className="text-xs text-slate-600 mb-1">Revenue</div>
                                <div className="text-2xl font-bold text-slate-900">{formatCurrencyLocal(yearOverYearStats.lastYear.revenue, 0)}</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-slate-700 uppercase">Growth</div>
                            <div className={`rounded-lg border p-3 ${yearOverYearStats.change.bookings >= 0 ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
                                <div className={`text-xs mb-1 ${yearOverYearStats.change.bookings >= 0 ? 'text-green-700' : 'text-rose-700'}`}>Bookings</div>
                                <div className={`text-2xl font-bold ${yearOverYearStats.change.bookings >= 0 ? 'text-green-900' : 'text-rose-900'}`}>
                                    {yearOverYearStats.change.bookings >= 0 ? '+' : ''}{yearOverYearStats.change.bookings}
                                </div>
                            </div>
                            <div className={`rounded-lg border p-3 ${parseFloat(yearOverYearStats.change.revenuePercent) >= 0 ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
                                <div className={`text-xs mb-1 ${parseFloat(yearOverYearStats.change.revenuePercent) >= 0 ? 'text-green-700' : 'text-rose-700'}`}>Revenue</div>
                                <div className={`text-2xl font-bold ${parseFloat(yearOverYearStats.change.revenuePercent) >= 0 ? 'text-green-900' : 'text-rose-900'}`}>
                                    {parseFloat(yearOverYearStats.change.revenuePercent) >= 0 ? '+' : ''}{yearOverYearStats.change.revenuePercent}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Seasonal Performance */}
            {seasonalStats && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-900">Seasonal Performance</div>
                        <div className="text-xs text-slate-500">Revenue and bookings by season</div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {seasonalStats.map(({ season, revenue, bookings, avgNights }) => {
                            const colorMap: Record<string, string> = {
                                'Spring': 'bg-green-50 border-green-200',
                                'Summer': 'bg-orange-50 border-orange-200',
                                'Fall': 'bg-amber-50 border-amber-200',
                                'Winter': 'bg-blue-50 border-blue-200'
                            };
                            const textColorMap: Record<string, string> = {
                                'Spring': 'text-green-900',
                                'Summer': 'text-orange-900',
                                'Fall': 'text-amber-900',
                                'Winter': 'text-blue-900'
                            };
                            return (
                                <div key={season} className={`rounded-xl border shadow-sm ${colorMap[season]} p-3 space-y-2`}>
                                    <div className={`text-sm font-bold ${textColorMap[season]}`}>{season}</div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-slate-600">Revenue</div>
                                        <div className="text-lg font-bold text-slate-900">{formatCurrencyLocal(revenue, 0)}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <div className="text-slate-500">Bookings</div>
                                            <div className="font-semibold text-slate-900">{bookings}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500">Avg Nights</div>
                                            <div className="font-semibold text-slate-900">{avgNights}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
