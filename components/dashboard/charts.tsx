"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Paleta institucional UTMACH: gama de azules + el rojo como acento puntual.
const PALETTE = [
  "#005ca2", // Pantone 301 — azul institucional
  "#53aae1", // Pantone 2925 — azul claro
  "#0b78c2",
  "#9fcdeb",
  "#34597a",
  "#cfe3f2",
  "#7aa5c4",
  "#C2354a", // Pantone 185 — rojo (acento)
];

export function BarChartCard({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  if (!data.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} fontSize={12} />
        <YAxis
          type="category"
          dataKey="name"
          width={160}
          fontSize={12}
          tickFormatter={(v: string) =>
            v.length > 22 ? v.slice(0, 21) + "…" : v
          }
        />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#005ca2" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieChartCard({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  if (!data.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={(d) => `${d.label} (${d.count})`}
          fontSize={12}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TimeLineCard({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  if (!data.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: 0, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis allowDecimals={false} fontSize={12} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#005ca2"
          strokeWidth={2}
          dot={{ r: 3, fill: "#53aae1" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
      Sin datos todavía
    </div>
  );
}
