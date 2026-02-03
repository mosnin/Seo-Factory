"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";

interface PlanPieChartProps {
  data: { name: string; value: number }[];
}

const COLORS: Record<string, string> = {
  FREE: "hsl(var(--muted-foreground))",
  STARTER: "hsl(var(--primary))",
  PRO: "hsl(var(--success, 142 76% 36%))",
  ENTERPRISE: "hsl(var(--warning, 38 92% 50%))",
};

const FALLBACK_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
];

export function PlanPieChart({ data }: PlanPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No plan data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={COLORS[entry.name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: unknown) => [String(value), "Users"]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
