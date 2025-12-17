"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendChartProps {
  title: string;
  description?: string;
  data: any[];
  dataKeys: {
    key: string;
    color: string;
    name?: string;
  }[];
  xAxisKey: string;
  type?: "line" | "area" | "bar";
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
  loading?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

export function TrendChart({
  title,
  description,
  data,
  dataKeys,
  xAxisKey,
  type = "line",
  height = 300,
  showGrid = true,
  showLegend = true,
  formatYAxis = formatNumber,
  formatTooltip = formatNumber,
  loading = false,
}: TrendChartProps) {
  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse flex items-center justify-center" style={{ height }}>
            <div className="h-full w-full bg-slate-700/50 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-slate-400 text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatTooltip(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 20, left: 10, bottom: 5 },
    };

    switch (type) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
            <XAxis dataKey={xAxisKey} tick={{ fill: "#94a3b8", fontSize: 12 }} stroke="#475569" />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} stroke="#475569" tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: 10 }} />}
            {dataKeys.map((dk) => (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name || dk.key}
                stroke={dk.color}
                fill={dk.color}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
            <XAxis dataKey={xAxisKey} tick={{ fill: "#94a3b8", fontSize: 12 }} stroke="#475569" />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} stroke="#475569" tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: 10 }} />}
            {dataKeys.map((dk) => (
              <Bar key={dk.key} dataKey={dk.key} name={dk.name || dk.key} fill={dk.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
            <XAxis dataKey={xAxisKey} tick={{ fill: "#94a3b8", fontSize: 12 }} stroke="#475569" />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} stroke="#475569" tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ paddingTop: 10 }} />}
            {dataKeys.map((dk) => (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name || dk.key}
                stroke={dk.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white">{title}</CardTitle>
        {description && <p className="text-sm text-slate-400">{description}</p>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export { formatCurrency, formatNumber };
