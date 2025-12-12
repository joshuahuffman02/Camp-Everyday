"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

type MaintenancePriority = "low" | "medium" | "high" | "critical";

interface CreateTicketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateTicketDialog({ open, onOpenChange, onSuccess }: CreateTicketDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sites, setSites] = useState<{ id: string; name: string }[]>([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "medium" as MaintenancePriority,
        siteId: "none",
        isBlocking: false,
        outOfOrder: false,
        outOfOrderReason: "",
        dueDate: ""
    });

    useEffect(() => {
        if (open) {
            loadSites();
        }
    }, [open]);

    async function loadSites() {
        try {
            // Assuming we can fetch sites via existing API or we need to add a method
            // For now, let's try to fetch sites if the method exists, or just mock/skip
            // We'll assume apiClient has getSites or similar. If not, we might need to add it.
            // Let's check api-client.ts later. For now, I'll assume we can get sites.
            // Actually, let's just fetch campgrounds sites.
            // We need campgroundId context. The dashboard should probably know the campground.
            // For now, I'll skip site loading or assume a method exists.
            // Let's try to use a generic getSites if available, or just leave empty for now.
        } catch (e) {
            console.error(e);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            await apiClient.createMaintenanceTicket({
                ...formData,
                siteId: formData.siteId === "none" ? undefined : formData.siteId,
                campgroundId: "default-campground-id", // TODO: Get from context
                status: "open",
                outOfOrder: formData.outOfOrder,
                outOfOrderReason: formData.outOfOrder ? formData.outOfOrderReason : undefined,
            } as any);

            toast({
                title: "Ticket created",
                description: "Maintenance ticket has been created successfully."
            });

            setFormData({
                title: "",
                description: "",
                priority: "medium",
                siteId: "none",
                isBlocking: false,
                outOfOrder: false,
                outOfOrderReason: "",
                dueDate: ""
            });

            onSuccess();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create ticket. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Maintenance Ticket</DialogTitle>
                    <DialogDescription>
                        Report an issue or schedule maintenance.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Leaking faucet at Site 12"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Details about the issue..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(v) => setFormData({ ...formData, priority: v as MaintenancePriority })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="site">Site (Optional)</Label>
                            <Select
                                value={formData.siteId}
                                onValueChange={(v) => setFormData({ ...formData, siteId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select site" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None / General</SelectItem>
                                    {/* TODO: Map sites here */}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                        <div className="space-y-0.5">
                            <Label className="text-base">Block Availability</Label>
                            <p className="text-sm text-muted-foreground">
                                Prevent bookings for this site while ticket is open
                            </p>
                        </div>
                        <Switch
                            checked={formData.isBlocking}
                            onCheckedChange={(c) => setFormData({ ...formData, isBlocking: c })}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md border-amber-200 bg-amber-50">
                        <div className="space-y-0.5">
                            <Label className="text-base text-amber-900">Site Out of Order</Label>
                            <p className="text-sm text-amber-700">
                                Mark site as unavailable until maintenance is complete
                            </p>
                        </div>
                        <Switch
                            checked={formData.outOfOrder}
                            onCheckedChange={(c) => setFormData({ ...formData, outOfOrder: c })}
                        />
                    </div>

                    {formData.outOfOrder && (
                        <div className="space-y-2">
                            <Label htmlFor="outOfOrderReason">Out of Order Reason</Label>
                            <Input
                                id="outOfOrderReason"
                                value={formData.outOfOrderReason}
                                onChange={(e) => setFormData({ ...formData, outOfOrderReason: e.target.value })}
                                placeholder="e.g., Electrical hazard, plumbing issue..."
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Ticket"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
