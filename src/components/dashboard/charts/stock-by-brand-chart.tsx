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
import type { StockByBrandPoint } from "@/lib/dashboard-stats";

const config = {
  count: { label: "Vehículos" },
} satisfies ChartConfig;

// Paleta fija — el color se pasa por celda (los nombres de marca no sirven como
// CSS vars). El legend/tooltip usan el fill de cada celda.
const PALETTE = [
  "hsl(217 91% 60%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(280 65% 60%)",
  "hsl(0 72% 60%)",
  "hsl(190 80% 45%)",
  "hsl(220 9% 55%)",
];

interface StockByBrandChartProps {
  data: StockByBrandPoint[];
}

export function StockByBrandChart({ data }: StockByBrandChartProps) {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const fullData = data.map((d, i) => ({ ...d, fill: PALETTE[i % PALETTE.length] }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock por marca</CardTitle>
        <CardDescription>{total} vehículos en el catálogo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square h-[240px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="brand" hideLabel />} />
            <Pie data={fullData} dataKey="count" nameKey="brand" innerRadius={55} strokeWidth={2}>
              {fullData.map((entry) => (
                <Cell key={entry.brand} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="brand" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
