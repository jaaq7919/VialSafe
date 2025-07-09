"use client";

import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const accidentsByMonthData = [
  { month: "Ene", accidents: 18 },
  { month: "Feb", accidents: 25 },
  { month: "Mar", accidents: 21 },
  { month: "Abr", accidents: 30 },
  { month: "May", accidents: 24 },
  { month: "Jun", accidents: 28 },
];

const accidentsByCauseData = [
    { name: 'Exceso de Velocidad', value: 42, fill: 'var(--color-velocidad)' },
    { name: 'Imprudencia', value: 35, fill: 'var(--color-imprudencia)' },
    { name: 'Clima', value: 15, fill: 'var(--color-clima)' },
    { name: 'Alcohol (CBI)', value: 25, fill: 'var(--color-alcohol)' },
    { name: 'Falla Mecánica', value: 18, fill: 'var(--color-mecanica)' },
];

const chartConfig = {
  accidents: {
    label: "Accidentes",
    color: "hsl(var(--primary))",
  },
  velocidad: { label: 'Exceso de Velocidad', color: 'hsl(var(--chart-1))' },
  imprudencia: { label: 'Imprudencia', color: 'hsl(var(--chart-2))' },
  clima: { label: 'Clima', color: 'hsl(var(--chart-3))' },
  alcohol: { label: 'Alcohol (CBI)', color: 'hsl(var(--chart-4))' },
  mecanica: { label: 'Falla Mecánica', color: 'hsl(var(--chart-5))' },
};

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Accidentes por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <BarChart data={accidentsByMonthData} accessibilityLayer>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="accidents" fill="var(--color-accidents)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Accidentes por Causa</CardTitle>
        </CardHeader>
        <CardContent>
           <ChartContainer config={chartConfig} className="h-72 w-full">
            <PieChart>
              <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={accidentsByCauseData}
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
                  index,
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
                  {accidentsByCauseData.map((entry) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
