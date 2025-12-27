"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sparkles,
  Shield,
  Clock,
  Activity,
  Settings,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteClass {
  id: string;
  name: string;
  siteCount: number;
}

interface OptimizationSettings {
  enabled: boolean;
  previewMode: boolean;
  daysBeforeArrival: number;
  selectedSiteClasses: string[];
  optimizeForRevenue: boolean;
  optimizeForOccupancy: boolean;
  fillGaps: boolean;
  respectGuestPreferences: boolean;
  respectAccessibility: boolean;
}

interface OptimizationCardProps {
  settings: OptimizationSettings;
  siteClasses: SiteClass[];
  lastRunAt?: Date;
  onSettingsChange: (settings: Partial<OptimizationSettings>) => void;
  onViewLog: () => void;
  className?: string;
}

export function OptimizationCard({
  settings,
  siteClasses,
  lastRunAt,
  onSettingsChange,
  onViewLog,
  className,
}: OptimizationCardProps) {
  const [isExpanded, setIsExpanded] = useState(settings.enabled);

  const handleToggleEnabled = (enabled: boolean) => {
    onSettingsChange({ enabled });
    setIsExpanded(enabled);
  };

  const toggleSiteClass = (siteClassId: string) => {
    const current = settings.selectedSiteClasses;
    const updated = current.includes(siteClassId)
      ? current.filter((id) => id !== siteClassId)
      : [...current, siteClassId];
    onSettingsChange({ selectedSiteClasses: updated });
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        settings.enabled
          ? "border-purple-200 bg-gradient-to-br from-purple-50/50 to-white"
          : "border-dashed",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                settings.enabled ? "bg-purple-100" : "bg-slate-100"
              )}
            >
              <Sparkles
                className={cn(
                  "h-5 w-5",
                  settings.enabled ? "text-purple-600" : "text-slate-500"
                )}
              />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Grid Optimization
                <Badge
                  variant="secondary"
                  className="text-xs bg-purple-100 text-purple-700"
                >
                  Smart
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Automatically optimize site assignments to maximize revenue
              </CardDescription>
            </div>
          </div>

          <Switch
            checked={settings.enabled}
            onCheckedChange={handleToggleEnabled}
            aria-describedby="optimization-description"
          />
        </div>
      </CardHeader>

      {(isExpanded || settings.enabled) && (
        <CardContent className="space-y-6 pt-0">
          {/* Trust-building message */}
          <Alert className="bg-purple-50 border-purple-200">
            <Shield className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-900">You're always in control</AlertTitle>
            <AlertDescription className="text-purple-800">
              Optimization respects guest preferences, accessibility requirements,
              and locked sites. Enable preview mode to review changes before they're applied.
            </AlertDescription>
          </Alert>

          {/* Preview Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Settings className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Preview Mode</p>
                <p className="text-sm text-slate-500">
                  See suggested changes without applying them
                </p>
              </div>
            </div>
            <Switch
              checked={settings.previewMode}
              onCheckedChange={(previewMode) => onSettingsChange({ previewMode })}
            />
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-900">Configuration</h4>

            {/* Days Buffer */}
            <div className="space-y-2">
              <Label htmlFor="days-buffer">Stop optimizing reservations</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="days-buffer"
                  type="number"
                  min={0}
                  max={30}
                  value={settings.daysBeforeArrival}
                  onChange={(e) =>
                    onSettingsChange({ daysBeforeArrival: parseInt(e.target.value) || 0 })
                  }
                  className="w-20"
                />
                <span className="text-sm text-slate-500">days before arrival</span>
              </div>
              <p className="text-xs text-slate-500">
                Reservations within this window won't be moved
              </p>
            </div>

            {/* Site Classes */}
            <div className="space-y-2">
              <Label>Optimize these site types</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {siteClasses.map((sc) => {
                  const isSelected = settings.selectedSiteClasses.includes(sc.id);
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => toggleSiteClass(sc.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                        isSelected
                          ? "bg-purple-100 border-purple-300 text-purple-800"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {sc.name}
                      <span className="ml-1 text-xs opacity-70">({sc.siteCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optimization Goals */}
            <div className="space-y-3">
              <Label>Optimization goals</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={settings.optimizeForRevenue}
                    onChange={(e) => onSettingsChange({ optimizeForRevenue: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="font-medium text-slate-900">Maximize revenue</p>
                    <p className="text-sm text-slate-500">
                      Move reservations to premium sites when possible
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={settings.fillGaps}
                    onChange={(e) => onSettingsChange({ fillGaps: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="font-medium text-slate-900">Fill gaps</p>
                    <p className="text-sm text-slate-500">
                      Consolidate reservations to eliminate 1-night gaps
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Constraints */}
            <div className="space-y-3">
              <Label>Always respect (cannot be changed)</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-slate-700">Accessibility requirements</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-slate-700">Guest-locked sites</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-slate-700">RV length requirements</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log Link */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              {lastRunAt ? (
                <span>Last run: {lastRunAt.toLocaleDateString()} at {lastRunAt.toLocaleTimeString()}</span>
              ) : (
                <span>Never run</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewLog}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Activity className="h-4 w-4 mr-2" />
              View optimization log
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
