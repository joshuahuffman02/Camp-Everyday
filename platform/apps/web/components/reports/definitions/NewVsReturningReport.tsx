import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface NewVsReturningReportProps {
    campgroundId: string;
    dateRange: { start: string; end: string };
}

const COLORS = ['#8b5cf6', '#3b82f6']; // Purple (New), Blue (Returning)

export function NewVsReturningReport({ campgroundId, dateRange }: NewVsReturningReportProps) {
    const { data: reservations } = useQuery({
        queryKey: ["reservations", campgroundId],
        queryFn: () => apiClient.getReservations(campgroundId),
    });

    const reportData = useMemo(() => {
        if (!reservations) return { pieData: [], total: 0, newCount: 0, returningCount: 0 };

        const start = startOfDay(new Date(dateRange.start));
        const end = endOfDay(new Date(dateRange.end));

        let newCount = 0;
        let returningCount = 0;
        const processedGuestIds = new Set<string>();

        reservations.forEach(r => {
            if (r.status === 'cancelled') return;
            const rStart = startOfDay(new Date(r.arrivalDate));

            // Filter by arrival in date range
            if (!isWithinInterval(rStart, { start, end })) return;

            // Avoid double counting same guest if they have multiple reservations in period?
            // Usually "New vs Returning" is per stay/reservation or per unique guest?
            // " % of arrivals were new guests".
            // If satisfied per reservation basis.

            const guest = r.guest;
            if (!guest) return;

            // Logic: "New" if repeatStays == 0 or 1 (depending on when it's incremented).
            // Usually "repeatStays" implies *past* stays.
            // If this is their first stay, repeatStays might be 0.
            // If they have stayed before, it's > 0.
            // Let's assume repeatStays > 0 means Returning. 0 means New.

            if ((guest.repeatStays || 0) > 0) {
                returningCount++;
            } else {
                newCount++;
            }
        });

        const total = newCount + returningCount;
        const pieData = [
            { name: "New Guests", value: newCount },
            { name: "Returning Guests", value: returningCount }
        ];

        return { pieData, total, newCount, returningCount };
    }, [reservations, dateRange]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-center h-[300px]">
                <div className="w-full md:w-1/2 h-full">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Guest Loyalty Mix</h3>
                    {reportData.total > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={reportData.pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    label={false}
                                >
                                    {reportData.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">No arrivals in period</div>
                    )}
                </div>

                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
                    <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="text-sm font-medium text-purple-600 uppercase tracking-wider">New Guests</div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-purple-900">{reportData.newCount}</span>
                            <span className="text-sm text-purple-700">
                                ({reportData.total > 0 ? ((reportData.newCount / reportData.total) * 100).toFixed(1) : 0}%)
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-purple-600/80">First-time visitors.</p>
                    </div>

                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="text-sm font-medium text-blue-600 uppercase tracking-wider">Returning Guests</div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-blue-900">{reportData.returningCount}</span>
                            <span className="text-sm text-blue-700">
                                ({reportData.total > 0 ? ((reportData.returningCount / reportData.total) * 100).toFixed(1) : 0}%)
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-blue-600/80">Have stayed at least once before.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
