"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function RepeatChargesPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Get campground ID from localStorage
    const [campgroundId, setCampgroundId] = useState<string>("");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = localStorage.getItem("campreserv:selectedCampground");
        if (stored) setCampgroundId(stored);
    }, []);

    const { data: charges, isLoading, error } = useQuery({
        queryKey: ["repeat-charges", campgroundId],
        queryFn: () => apiClient.getRepeatChargesByCampground(campgroundId),
        enabled: !!campgroundId
    });

    const handleProcess = async (id: string) => {
        setProcessingId(id);
        try {
            await apiClient.processRepeatCharge(id);
            toast({
                title: "Charge Processed",
                description: "The payment has been successfully processed.",
            });
            queryClient.invalidateQueries({ queryKey: ["repeat-charges", campgroundId] });
        } catch (err) {
            toast({
                title: "Processing Failed",
                description: "Failed to process the charge. Please try again.",
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    if (error) return <div>Failed to load charges</div>;
    if (isLoading || !charges) return <div>Loading...</div>;

    return (
        <DashboardShell>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Scheduled Charges</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="border-b">
                                        <th className="h-12 px-4 text-left font-medium">Due Date</th>
                                        <th className="h-12 px-4 text-left font-medium">Guest</th>
                                        <th className="h-12 px-4 text-left font-medium">Site</th>
                                        <th className="h-12 px-4 text-left font-medium">Amount</th>
                                        <th className="h-12 px-4 text-left font-medium">Status</th>
                                        <th className="h-12 px-4 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {charges.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No scheduled charges found.
                                            </td>
                                        </tr>
                                    ) : (
                                        charges.map((charge) => (
                                            <tr key={charge.id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="p-4">
                                                    {format(new Date(charge.dueDate), "MMM d, yyyy")}
                                                </td>
                                                <td className="p-4">
                                                    {charge.reservation?.guest ? (
                                                        <div className="font-medium">
                                                            {charge.reservation.guest.primaryFirstName} {charge.reservation.guest.primaryLastName}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Unknown Guest</span>
                                                    )}
                                                    <div className="text-xs text-muted-foreground">
                                                        Res #{charge.reservation?.id.slice(-6)}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {charge.reservation?.site?.siteNumber || "N/A"}
                                                </td>
                                                <td className="p-4 font-medium">
                                                    ${(charge.amount / 100).toFixed(2)}
                                                </td>
                                                <td className="p-4">
                                                    <Badge
                                                        variant={
                                                            charge.status === "paid"
                                                                ? "default"
                                                                : charge.status === "failed"
                                                                    ? "destructive"
                                                                    : "secondary"
                                                        }
                                                    >
                                                        {charge.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {charge.status === "pending" && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleProcess(charge.id)}
                                                            disabled={processingId === charge.id}
                                                        >
                                                            {processingId === charge.id ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CreditCard className="mr-2 h-4 w-4" />
                                                            )}
                                                            Process
                                                        </Button>
                                                    )}
                                                    {charge.status === "paid" && (
                                                        <div className="flex items-center justify-end text-green-600">
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Paid
                                                        </div>
                                                    )}
                                                    {charge.status === "failed" && (
                                                        <div className="flex items-center justify-end text-red-600">
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Failed
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    );
}
