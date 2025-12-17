"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Insight {
  type: "positive" | "negative" | "neutral" | "warning";
  title: string;
  description: string;
  metric?: {
    label: string;
    value: string | number;
    change?: number;
  };
}

interface AiInsightCardProps {
  title?: string;
  summary: string;
  insights: Insight[];
  recommendations?: string[];
  isLoading?: boolean;
  onRefresh?: () => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function AiInsightCard({
  title = "AI Analysis",
  summary,
  insights,
  recommendations = [],
  isLoading = false,
  onRefresh,
  collapsible = true,
  defaultExpanded = true,
}: AiInsightCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-400" />;
    }
  };

  const getInsightBg = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return "bg-green-500/10 border-green-500/20";
      case "negative":
        return "bg-red-500/10 border-red-500/20";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20";
      default:
        return "bg-blue-500/10 border-blue-500/20";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-slate-800/50 border-purple-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <CardTitle className="text-base text-white">{title}</CardTitle>
            <Badge className="bg-purple-600/20 text-purple-400 border border-purple-600/50 text-xs">
              AI-Powered
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            )}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-8 w-8 p-0"
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Summary */}
          <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>

          {/* Key Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Key Insights
              </p>
              <div className="grid gap-2">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${getInsightBg(insight.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {insight.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {insight.description}
                        </p>
                        {insight.metric && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-500">
                              {insight.metric.label}:
                            </span>
                            <span className="text-sm font-medium text-white">
                              {insight.metric.value}
                            </span>
                            {insight.metric.change !== undefined && (
                              <span
                                className={`text-xs ${
                                  insight.metric.change >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {insight.metric.change >= 0 ? "+" : ""}
                                {insight.metric.change}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Recommendations
              </p>
              <ul className="space-y-1.5">
                {recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="text-purple-400 mt-1">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Loading skeleton for AI Insight Card
 */
export function AiInsightCardSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-slate-800/50 border-purple-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg animate-pulse">
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="h-5 w-24 bg-slate-700 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-16 w-full bg-slate-700/50 rounded animate-pulse" />
          <div className="h-16 w-full bg-slate-700/50 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
