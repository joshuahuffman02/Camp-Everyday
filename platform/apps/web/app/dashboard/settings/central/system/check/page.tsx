"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  RefreshCw,
  Loader2,
  Settings,
  DollarSign,
  Calendar,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SystemCheckIssue {
  id: string;
  severity: "error" | "warning" | "info";
  category: "pricing" | "bookings" | "access" | "property" | "system";
  message: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

// Mock data - in production this would come from an API
const mockIssues: SystemCheckIssue[] = [
  {
    id: "1",
    severity: "warning",
    category: "pricing",
    message: "Tax rules not configured for Tent sites",
    description: "Tent site bookings won't have taxes applied until configured.",
    actionLabel: "Configure taxes",
    actionHref: "/dashboard/settings/central/pricing/taxes",
  },
  {
    id: "2",
    severity: "warning",
    category: "pricing",
    message: "No rate groups defined for 2026",
    description: "Rate groups help you organize seasonal pricing on the calendar.",
    actionLabel: "Add rate groups",
    actionHref: "/dashboard/settings/central/pricing/rate-groups",
  },
  {
    id: "3",
    severity: "info",
    category: "bookings",
    message: "Grid optimization is disabled",
    description: "Enable to automatically optimize site assignments for revenue.",
    actionLabel: "Enable optimization",
    actionHref: "/dashboard/settings/central/bookings/optimization",
  },
  {
    id: "4",
    severity: "info",
    category: "bookings",
    message: "No custom fields configured",
    description: "Custom fields let you collect additional info from guests.",
    actionLabel: "Add custom fields",
    actionHref: "/dashboard/settings/central/bookings/custom-fields",
  },
  {
    id: "5",
    severity: "error",
    category: "access",
    message: "No backup admin user configured",
    description: "It's recommended to have at least 2 admin users for account recovery.",
    actionLabel: "Add admin user",
    actionHref: "/dashboard/settings/central/access/users",
  },
];

const categoryConfig = {
  pricing: { icon: DollarSign, label: "Pricing" },
  bookings: { icon: Calendar, label: "Bookings" },
  access: { icon: Users, label: "Access" },
  property: { icon: Settings, label: "Property" },
  system: { icon: Settings, label: "System" },
};

const severityConfig = {
  error: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-800 border-red-200",
    label: "Error",
    priority: 1,
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    label: "Warning",
    priority: 2,
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Suggestion",
    priority: 3,
  },
};

type FilterValue = "all" | "actionable" | "info";

export default function SystemCheckPage() {
  const [issues, setIssues] = useState<SystemCheckIssue[]>(mockIssues);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterValue>("actionable");

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  }, []);

  // Sort by severity priority
  const sortedIssues = [...issues].sort(
    (a, b) => severityConfig[a.severity].priority - severityConfig[b.severity].priority
  );

  // Filter issues
  const filteredIssues = sortedIssues.filter((issue) => {
    if (filter === "all") return true;
    if (filter === "actionable") return issue.severity !== "info";
    if (filter === "info") return issue.severity === "info";
    return true;
  });

  // Count by severity
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;
  const actionableCount = errorCount + warningCount;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Check</h2>
          <p className="text-slate-500 mt-1">
            Review configuration issues and recommendations
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Errors */}
        <Card className={cn(errorCount > 0 ? "border-red-200 bg-red-50/50" : "")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                errorCount > 0 ? "bg-red-100" : "bg-slate-100"
              )}>
                <XCircle className={cn(
                  "h-5 w-5",
                  errorCount > 0 ? "text-red-500" : "text-slate-400"
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{errorCount}</p>
                <p className="text-sm text-slate-500">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        <Card className={cn(warningCount > 0 ? "border-amber-200 bg-amber-50/50" : "")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                warningCount > 0 ? "bg-amber-100" : "bg-slate-100"
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  warningCount > 0 ? "text-amber-500" : "text-slate-400"
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{warningCount}</p>
                <p className="text-sm text-slate-500">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-100">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{infoCount}</p>
                <p className="text-sm text-slate-500">Suggestions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-4">
        <Button
          variant={filter === "actionable" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("actionable")}
          className={filter === "actionable" ? "" : "text-slate-600"}
        >
          Actionable
          {actionableCount > 0 && (
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {actionableCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === "info" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("info")}
          className={filter === "info" ? "" : "text-slate-600"}
        >
          Suggestions
          {infoCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {infoCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "" : "text-slate-600"}
        >
          All
        </Button>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">All clear!</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              {filter === "actionable"
                ? "No errors or warnings to address."
                : filter === "info"
                ? "No additional suggestions at this time."
                : "Your system configuration looks great."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => {
            const severity = severityConfig[issue.severity];
            const category = categoryConfig[issue.category];
            const SeverityIcon = severity.icon;
            const CategoryIcon = category.icon;

            return (
              <Card
                key={issue.id}
                className={cn(
                  "transition-all duration-200 hover:shadow-md group",
                  severity.border
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    {/* Severity Icon */}
                    <div className={cn("p-2 rounded-lg flex-shrink-0", severity.bg)}>
                      <SeverityIcon className={cn("h-5 w-5", severity.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-slate-900">
                          {issue.message}
                        </h4>
                        <Badge variant="outline" className={cn("text-xs", severity.badge)}>
                          {severity.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-slate-600">
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {category.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {issue.description}
                      </p>
                    </div>

                    {/* Action */}
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                    >
                      <Link href={issue.actionHref}>
                        {issue.actionLabel}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
