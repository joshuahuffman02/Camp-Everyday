"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/ui/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { Plus, Pencil, Trash2, Loader2, Percent, DollarSign, FileX } from "lucide-react";

type TaxRule = {
    id: string;
    campgroundId: string;
    name: string;
    type: "percentage" | "flat" | "exemption";
    rate: number | null;
    minNights: number | null;
    maxNights: number | null;
    requiresWaiver: boolean;
    waiverText: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

type TaxRuleFormData = {
    name: string;
    type: "percentage" | "flat" | "exemption";
    rate: string;
    minNights: string;
    maxNights: string;
    requiresWaiver: boolean;
    waiverText: string;
    isActive: boolean;
};

const defaultFormData: TaxRuleFormData = {
    name: "",
    type: "percentage",
    rate: "",
    minNights: "",
    maxNights: "",
    requiresWaiver: false,
    waiverText: "",
    isActive: true
};

export default function TaxRulesSettingsPage() {
    const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [campgroundId, setCampgroundId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<TaxRule | null>(null);
    const [formData, setFormData] = useState<TaxRuleFormData>(defaultFormData);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const cg = localStorage.getItem("campreserv:selectedCampground");
        setCampgroundId(cg);
        if (cg) {
            loadTaxRules(cg);
        }
    }, []);

    const loadTaxRules = async (cgId: string) => {
        setLoading(true);
        try {
            const data = await apiClient.getTaxRules(cgId);
            setTaxRules(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingRule(null);
        setFormData(defaultFormData);
        setError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (rule: TaxRule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            type: rule.type,
            rate: rule.rate !== null ? String(rule.rate) : "",
            minNights: rule.minNights !== null ? String(rule.minNights) : "",
            maxNights: rule.maxNights !== null ? String(rule.maxNights) : "",
            requiresWaiver: rule.requiresWaiver,
            waiverText: rule.waiverText || "",
            isActive: rule.isActive
        });
        setError(null);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!campgroundId) return;
        if (!formData.name.trim()) {
            setError("Name is required");
            return;
        }
        if (formData.type !== "exemption" && (!formData.rate || Number(formData.rate) <= 0)) {
            setError("Rate must be greater than 0");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: formData.name.trim(),
                type: formData.type,
                rate: formData.type !== "exemption" ? Number(formData.rate) : undefined,
                minNights: formData.minNights ? Number(formData.minNights) : undefined,
                maxNights: formData.maxNights ? Number(formData.maxNights) : undefined,
                requiresWaiver: formData.requiresWaiver,
                waiverText: formData.waiverText || undefined,
                isActive: formData.isActive
            };

            if (editingRule) {
                await apiClient.updateTaxRule(editingRule.id, payload);
            } else {
                await apiClient.createTaxRule({ campgroundId, ...payload });
            }
            setIsModalOpen(false);
            loadTaxRules(campgroundId);
        } catch (err: any) {
            setError(err.message || "Failed to save tax rule");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tax rule?")) return;
        try {
            await apiClient.deleteTaxRule(id);
            if (campgroundId) loadTaxRules(campgroundId);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleActive = async (rule: TaxRule) => {
        try {
            await apiClient.updateTaxRule(rule.id, { isActive: !rule.isActive });
            if (campgroundId) loadTaxRules(campgroundId);
        } catch (err) {
            console.error(err);
        }
    };

    const formatRate = (rule: TaxRule) => {
        if (rule.type === "exemption") return "Exemption";
        if (rule.type === "percentage") return `${rule.rate}%`;
        return `$${((rule.rate || 0) / 100).toFixed(2)}`;
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "percentage": return <Percent className="h-5 w-5" />;
            case "flat": return <DollarSign className="h-5 w-5" />;
            case "exemption": return <FileX className="h-5 w-5" />;
            default: return null;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "percentage": return "bg-blue-100 text-blue-600";
            case "flat": return "bg-green-100 text-green-600";
            case "exemption": return "bg-amber-100 text-amber-600";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    if (!campgroundId) {
        return (
            <DashboardShell>
                <div className="text-center py-12 text-muted-foreground">
                    Please select a campground first.
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Tax Rules</h1>
                        <p className="text-muted-foreground">Configure tax rates, exemptions, and waivers for reservations.</p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tax Rule
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : taxRules.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Percent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-2">No tax rules configured</h3>
                            <p className="text-muted-foreground mb-4">
                                Create tax rules to automatically apply taxes to reservations.
                            </p>
                            <Button onClick={openCreateModal}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Tax Rule
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {taxRules.map((rule) => (
                            <Card key={rule.id} className={!rule.isActive ? "opacity-60" : ""}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${getTypeColor(rule.type)}`}>
                                                {getTypeIcon(rule.type)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-lg">{rule.name}</span>
                                                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                                                        {rule.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                    {rule.requiresWaiver && (
                                                        <Badge variant="outline" className="border-amber-200 text-amber-700">
                                                            Requires Waiver
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    <span className="font-semibold text-foreground">{formatRate(rule)}</span>
                                                    {rule.minNights && ` • Min ${rule.minNights} nights`}
                                                    {rule.maxNights && ` • Max ${rule.maxNights} nights`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={rule.isActive}
                                                onCheckedChange={() => toggleActive(rule)}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(rule)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingRule ? "Edit Tax Rule" : "Create Tax Rule"}</DialogTitle>
                        <DialogDescription>
                            {editingRule ? "Update the tax rule details." : "Configure a new tax rule for your campground."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Rule Name</Label>
                            <Input
                                placeholder="e.g. State Tax, Local Tax"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="flat">Flat Amount ($)</SelectItem>
                                        <SelectItem value="exemption">Tax Exemption</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {formData.type !== "exemption" && (
                                <div className="space-y-2">
                                    <Label>{formData.type === "percentage" ? "Rate (%)" : "Amount ($)"}</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step={formData.type === "percentage" ? "0.01" : "0.01"}
                                        placeholder={formData.type === "percentage" ? "e.g. 7.5" : "e.g. 5.00"}
                                        value={formData.rate}
                                        onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Min Nights (Optional)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 30"
                                    value={formData.minNights}
                                    onChange={(e) => setFormData({ ...formData, minNights: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Nights (Optional)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 90"
                                    value={formData.maxNights}
                                    onChange={(e) => setFormData({ ...formData, maxNights: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                id="requires-waiver"
                                checked={formData.requiresWaiver}
                                onCheckedChange={(checked) => setFormData({ ...formData, requiresWaiver: checked })}
                            />
                            <Label htmlFor="requires-waiver">Requires Waiver</Label>
                        </div>

                        {formData.requiresWaiver && (
                            <div className="space-y-2">
                                <Label>Waiver Text</Label>
                                <Input
                                    placeholder="Enter waiver agreement text..."
                                    value={formData.waiverText}
                                    onChange={(e) => setFormData({ ...formData, waiverText: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Switch
                                id="is-active"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                            />
                            <Label htmlFor="is-active">Active</Label>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
}
