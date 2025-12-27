"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Palette, Calendar, Info } from "lucide-react";
import { RateGroupRow, type RateGroup } from "@/components/settings/rate-groups";
import { ColorPicker, PRESET_COLORS } from "@/components/settings/rate-groups";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Mock data
const initialRateGroups: RateGroup[] = [
  {
    id: "1",
    name: "Peak Summer",
    color: "#ef4444",
    dateRanges: [
      { startDate: "2025-06-15", endDate: "2025-08-15" },
    ],
    totalDays: 62,
    isActive: true,
  },
  {
    id: "2",
    name: "Holiday",
    color: "#f97316",
    dateRanges: [
      { startDate: "2025-07-01", endDate: "2025-07-07" },
      { startDate: "2025-12-20", endDate: "2025-12-31" },
    ],
    totalDays: 18,
    isActive: true,
  },
  {
    id: "3",
    name: "Shoulder Season",
    color: "#84cc16",
    dateRanges: [
      { startDate: "2025-04-01", endDate: "2025-06-14" },
      { startDate: "2025-08-16", endDate: "2025-10-31" },
    ],
    totalDays: 152,
    isActive: true,
  },
  {
    id: "4",
    name: "Off-Peak",
    color: "#3b82f6",
    dateRanges: [
      { startDate: "2025-01-01", endDate: "2025-03-31" },
      { startDate: "2025-11-01", endDate: "2025-12-19" },
    ],
    totalDays: 139,
    isActive: true,
  },
  {
    id: "5",
    name: "Rally Weekend",
    color: "#8b5cf6",
    dateRanges: [],
    totalDays: 0,
    isActive: false,
  },
];

export default function RateGroupsPage() {
  const [rateGroups, setRateGroups] = useState<RateGroup[]>(initialRateGroups);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // New group form state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(PRESET_COLORS[0]);

  const handleAddGroup = useCallback(() => {
    if (!newGroupName.trim()) return;

    const newGroup: RateGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      color: newGroupColor,
      dateRanges: [],
      totalDays: 0,
      isActive: true,
    };

    setRateGroups((prev) => [...prev, newGroup]);
    setNewGroupName("");
    setNewGroupColor(PRESET_COLORS[0]);
    setIsAddDialogOpen(false);
  }, [newGroupName, newGroupColor]);

  const handleUpdateGroup = useCallback((id: string, updates: Partial<RateGroup>) => {
    setRateGroups((prev) =>
      prev.map((group) =>
        group.id === id ? { ...group, ...updates } : group
      )
    );
  }, []);

  const handleDeleteGroup = useCallback((id: string) => {
    setRateGroups((prev) => prev.filter((group) => group.id !== id));
  }, []);

  const handleDuplicateGroup = useCallback((id: string) => {
    const group = rateGroups.find((g) => g.id === id);
    if (!group) return;

    const newGroup: RateGroup = {
      ...group,
      id: Date.now().toString(),
      name: `${group.name} (Copy)`,
    };

    setRateGroups((prev) => [...prev, newGroup]);
  }, [rateGroups]);

  const handleEditDates = useCallback((id: string) => {
    setEditingGroupId(id);
    setIsDateDialogOpen(true);
  }, []);

  const activeGroups = rateGroups.filter((g) => g.isActive);
  const inactiveGroups = rateGroups.filter((g) => !g.isActive);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Rate Groups</h2>
          <p className="text-slate-500 mt-1">
            Define rate periods with colors for your calendar
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rate Group
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-800">
          Rate groups help you organize your pricing calendar. Each group gets a color
          that appears on the reservation calendar, making it easy to see which rates
          apply to which dates.
        </AlertDescription>
      </Alert>

      {/* Calendar Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-slate-500" />
            Calendar Preview
          </CardTitle>
          <CardDescription>
            How your rate groups will appear on the calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {activeGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: group.color }}
              >
                <span>{group.name}</span>
                <span className="opacity-75">({group.totalDays} days)</span>
              </div>
            ))}
            {activeGroups.length === 0 && (
              <p className="text-slate-500 text-sm">
                No active rate groups. Add one to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Rate Groups */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
          <Palette className="h-4 w-4 text-slate-500" />
          Active Rate Groups ({activeGroups.length})
        </h3>
        {activeGroups.length > 0 ? (
          <div className="space-y-2">
            {activeGroups.map((group) => (
              <RateGroupRow
                key={group.id}
                group={group}
                onUpdate={handleUpdateGroup}
                onDelete={handleDeleteGroup}
                onDuplicate={handleDuplicateGroup}
                onEditDates={handleEditDates}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Palette className="h-10 w-10 mx-auto text-slate-400" />
              <h4 className="mt-3 font-medium text-slate-900">No active rate groups</h4>
              <p className="text-sm text-slate-500 mt-1">
                Create rate groups to organize your seasonal pricing
              </p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add your first rate group
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inactive Rate Groups */}
      {inactiveGroups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-500">
            Inactive ({inactiveGroups.length})
          </h3>
          <div className="space-y-2">
            {inactiveGroups.map((group) => (
              <RateGroupRow
                key={group.id}
                group={group}
                onUpdate={handleUpdateGroup}
                onDelete={handleDeleteGroup}
                onDuplicate={handleDuplicateGroup}
                onEditDates={handleEditDates}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Rate Group Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Rate Group</DialogTitle>
            <DialogDescription>
              Create a new rate group for your pricing calendar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Peak Summer, Holiday Weekend"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <ColorPicker
                  value={newGroupColor}
                  onChange={setNewGroupColor}
                  className="h-10 w-10"
                />
                <div
                  className="flex-1 h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: newGroupColor }}
                >
                  {newGroupName || "Preview"}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGroup} disabled={!newGroupName.trim()}>
              Add Rate Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dates Dialog (placeholder - would need calendar date range picker) */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Date Ranges</DialogTitle>
            <DialogDescription>
              Define when this rate group applies
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Calendar className="h-10 w-10 mx-auto text-slate-400" />
              <p className="mt-3 text-slate-500">
                Date range picker would go here
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Select start and end dates for this rate period
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsDateDialogOpen(false)}>
              Save Dates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
