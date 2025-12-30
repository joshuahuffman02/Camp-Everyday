import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";


interface TransactionLogReportProps {
    campgroundId: string;
    dateRange: { start: string; end: string };
}

// Fallback logic if imported util fails or is missing
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2
    }).format(amount);
};

export function TransactionLogReport({ campgroundId, dateRange }: TransactionLogReportProps) {
    const { data: ledgerEntries, isLoading } = useQuery({
        queryKey: ["ledger", campgroundId],
        queryFn: () => apiClient.getLedgerEntries(campgroundId),
    });

    const reportData = useMemo(() => {
        if (!ledgerEntries) return [];

        const start = startOfDay(new Date(dateRange.start));
        const end = endOfDay(new Date(dateRange.end));

        return ledgerEntries
            .filter(e => {
                const d = new Date(e.occurredAt);
                return isWithinInterval(d, { start, end });
            })
            .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    }, [ledgerEntries, dateRange]);

    if (isLoading) {
        return <div className="text-sm text-slate-500">Loading transactions...</div>;
    }

    if (!ledgerEntries) {
        return <div className="text-sm text-slate-500">No transactions found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Transaction Log</h2>
                    <p className="text-sm text-slate-500">{reportData.length} entries in period</p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">GL Code</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        No transactions for this period.
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((e) => (
                                    <tr key={e.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                                            {format(new Date(e.occurredAt), "yyyy-MM-dd HH:mm")}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {e.description || "N/A"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={e.direction === 'credit' ? 'default' : 'secondary'} className={e.direction === 'credit' ? 'bg-status-success-bg text-status-success-text hover:bg-status-success-bg/80' : ''}>
                                                {e.direction.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            {e.glCode || "—"}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-mono ${e.direction === 'credit' ? 'text-emerald-700' : 'text-slate-900'}`}>
                                            {formatCurrency(e.amountCents / 100)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
