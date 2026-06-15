"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StockAgingPoint } from "@/lib/dashboard-stats";

const config = {
  count: { label: "Vehículos" },
} satisfies ChartConfig;

// De fresco (verde) a parado (rojo) — el orden coincide con los tramos.
const BUCKET_COLORS = [
  "hsl(142 71% 45%)", // 0-30
  "hsl(80 60% 45%)", // 31-60
  "hsl(38 92% 50%)", // 61-90
  "hsl(0 72% 55%)", // +90
];

interface StockAgingChartProps {
  data: StockAgingPoint[];
}

export function StockAgingChart({ data }: StockAgingChartProps) {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const stale = data.find((d) => d.bucket === "+90 d")?.count ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Antigüedad del stock</CardTitle>
        <CardDescription>
          {total} vehículos publicados · {stale} con más de 90 días
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[240px] w-full">
          <BarChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={entry.bucket} fill={BUCKET_COLORS[i] ?? BUCKET_COLORS[0]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
