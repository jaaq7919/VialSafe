
"use client";

import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

type AccidentsByMonth = {
  month: string;
  accidents: number;
};

type AccidentsByCause = {
  name: string;
  value: number;
};

interface DashboardChartsProps {
  accidentsByMonthData: AccidentsByMonth[];
  accidentsByCauseData: AccidentsByCause[];
}

const chartConfig = {
  accidents: {
    label: "Accidentes",
    color: "hsl(var(--primary))",
  },
};

// Generate a color palette for the pie chart
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220, 70%, 50%)',
  'hsl(340, 80%, 60%)',
  'hsl(50, 90%, 55%)'
];

export function DashboardCharts({ accidentsByMonthData, accidentsByCauseData }: DashboardChartsProps) {
  const pieChartDataWithColors = accidentsByCauseData.map((entry, index) => ({
    ...entry,
    fill: COLORS[index % COLORS.length],
  }));

  const pieChartConfig = {
    ...chartConfig,
    ...Object.fromEntries(
      pieChartDataWithColors.map((entry) => [entry.name, { label: entry.name, color: entry.fill }])
    ),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Accidentes por Mes</CardTitle>
          <CardDescription>Número de accidentes registrados mensualmente.</CardDescription>
        </CardHeader>
        <CardContent>
          {accidentsByMonthData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={accidentsByMonthData} accessibilityLayer>
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false} />
                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="accidents" fill="var(--color-accidents)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
             <div className="flex h-72 w-full items-center justify-center">
                <p className="text-muted-foreground">No hay suficientes datos para mostrar el gráfico.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Accidentes por Causa</CardTitle>
           <CardDescription>Distribución de los accidentes según su causa probable.</CardDescription>
        </CardHeader>
        <CardContent>
           {accidentsByCauseData.length > 0 ? (
            <ChartContainer config={pieChartConfig} className="h-72 w-full">
                <PieChart>
                  <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={pieChartDataWithColors}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    labelLine={false}
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          className="text-xs font-medium"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                      {pieChartDataWithColors.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                  </Pie>
                  <Legend content={({ payload }) => {
                      return (
                        <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
                          {payload?.map((entry) => (
                            <li key={`item-${entry.value}`} className="flex items-center gap-2 text-sm">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.value}
                            </li>
                          ))}
                        </ul>
                      )
                    }}/>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-72 w-full items-center justify-center">
                  <p className="text-muted-foreground">No hay suficientes datos para mostrar el gráfico.</p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
