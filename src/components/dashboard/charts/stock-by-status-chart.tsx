"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StockByStatusPoint } from "@/lib/dashboard-stats";

const config = {
  count: { label: "Vehículos" },
  available: { label: "Disponibles", color: "hsl(142 71% 45%)" },
  reserved: { label: "Reservados", color: "hsl(38 92% 50%)" },
  sold: { label: "Vendidos", color: "hsl(217 91% 60%)" },
} satisfies ChartConfig;

interface StockByStatusChartProps {
  data: StockByStatusPoint[];
}

export function StockByStatusChart({ data }: StockByStatusChartProps) {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const fullData = (["available", "reserved", "sold"] as const).map((status) => {
    const found = data.find((d) => d.status === status);
    return { status, count: found?.count ?? 0, fill: `var(--color-${status})` };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock por status</CardTitle>
        <CardDescription>
          {total} vehículos en el catálogo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square h-[240px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
            <Pie data={fullData} dataKey="count" nameKey="status" innerRadius={55} strokeWidth={2}>
              {fullData.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="status" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
