"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesByMonthPoint } from "@/lib/dashboard-stats";

const config = {
  total: {
    label: "Ventas",
    color: "hsl(217 91% 60%)",
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

interface SalesByMonthChartProps {
  data: SalesByMonthPoint[];
}

export function SalesByMonthChart({ data }: SalesByMonthChartProps) {
  const totalLast6 = data.reduce((acc, d) => acc + d.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por mes</CardTitle>
        <CardDescription>
          Total facturado: {formatArsFull.format(totalLast6)} en los últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[240px] w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
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
            <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              dataKey="total"
              type="monotone"
              fill="url(#fillSales)"
              stroke="var(--color-total)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
