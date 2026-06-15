"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NetProfitByMonthPoint } from "@/lib/dashboard-stats";

const config = {
  net: {
    label: "Ganancia neta",
    color: "hsl(142 71% 45%)",
  },
} satisfies ChartConfig;

const formatArsCompact = new Intl.NumberFormat("es-AR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatArsFull = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

interface NetProfitByMonthChartProps {
  data: NetProfitByMonthPoint[];
}

export function NetProfitByMonthChart({ data }: NetProfitByMonthChartProps) {
  const totalNet = data.reduce((acc, d) => acc + d.net, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ganancia neta por mes</CardTitle>
        <CardDescription>
          Neta total: {formatArsFull.format(totalNet)} en los últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[240px] w-full">
          <BarChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: number) => `$${formatArsCompact.format(v)}`}
              width={56}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatArsFull.format(Number(value))}
                />
              }
            />
            <Bar dataKey="net" fill="var(--color-net)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
