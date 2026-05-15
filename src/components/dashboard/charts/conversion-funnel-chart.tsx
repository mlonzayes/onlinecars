"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversionFunnelData } from "@/lib/dashboard-stats";

const config = {
  count: { label: "Cantidad", color: "hsl(217 91% 60%)" },
} satisfies ChartConfig;

interface ConversionFunnelChartProps {
  data: ConversionFunnelData;
}

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  const stages = [
    { name: "Leads", count: data.totalLeads },
    { name: "Contactados", count: data.contacted },
    { name: "Calificados", count: data.qualified },
    { name: "Ventas", count: data.completedSales },
  ];

  // Tasa de conversión global = ventas / leads totales (si hay leads).
  const conversionRate =
    data.totalLeads > 0 ? (data.completedSales / data.totalLeads) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embudo de conversión</CardTitle>
        <CardDescription>
          {conversionRate.toFixed(1)}% de leads se convierten en ventas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[240px] w-full">
          <BarChart
            data={stages}
            layout="vertical"
            margin={{ left: 0, right: 32, top: 8, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]}>
              <LabelList
                dataKey="count"
                position="right"
                offset={8}
                className="fill-foreground text-xs font-medium"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
