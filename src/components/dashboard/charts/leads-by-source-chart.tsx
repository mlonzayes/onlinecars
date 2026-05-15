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
import type { LeadsBySourcePoint } from "@/lib/dashboard-stats";

const config = {
  count: { label: "Leads" },
  web: { label: "Sitio web", color: "hsl(217 91% 60%)" },
  whatsapp: { label: "WhatsApp", color: "hsl(142 71% 45%)" },
  mercadolibre: { label: "MercadoLibre", color: "hsl(48 96% 53%)" },
} satisfies ChartConfig;

interface LeadsBySourceChartProps {
  data: LeadsBySourcePoint[];
}

export function LeadsBySourceChart({ data }: LeadsBySourceChartProps) {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  // Padding con todas las fuentes en 0 para que la leyenda muestre las 3
  // siempre, aunque alguna no tenga datos. El donut igual se ve correcto.
  const fullData = (["web", "whatsapp", "mercadolibre"] as const).map((source) => {
    const found = data.find((d) => d.source === source);
    return { source, count: found?.count ?? 0, fill: `var(--color-${source})` };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por origen</CardTitle>
        <CardDescription>
          {total} consultas recibidas en total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square h-[240px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="source" hideLabel />} />
            <Pie data={fullData} dataKey="count" nameKey="source" innerRadius={55} strokeWidth={2}>
              {fullData.map((entry) => (
                <Cell key={entry.source} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="source" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
