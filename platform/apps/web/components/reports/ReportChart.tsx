"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

type Point = { x: string; y: number };
type Series = { label: string; chart: string; points: Point[] };

const palette = ["#2563eb", "#16a34a", "#f59e0b", "#ec4899", "#0ea5e9", "#8b5cf6"];

export function ReportChart({ series, chart }: { series: Series[]; chart: "line" | "bar" | "pie" }) {
  if (!series?.length) return null;

  const sharedData = series[0].points;
  if (chart === "pie") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={sharedData} dataKey="y" nameKey="x" innerRadius={60} outerRadius={100} paddingAngle={2}>
            {sharedData.map((_entry, idx) => (
              <Cell key={idx} fill={palette[idx % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart === "bar") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={sharedData}>
          <XAxis dataKey="x" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="y" name={series[0].label} fill={palette[0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={sharedData}>
        <XAxis dataKey="x" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {series.map((s, idx) => (
          <Line key={s.label} dataKey="y" name={s.label} data={s.points} stroke={palette[idx % palette.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
