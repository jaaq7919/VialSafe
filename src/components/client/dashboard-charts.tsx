"use client";

import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const accidentsByMonthData = [
  { month: "Jan", accidents: 186 },
  { month: "Feb", accidents: 305 },
  { month: "Mar", accidents: 237 },
  { month: "Apr", accidents: 273 },
  { month: "May", accidents: 209 },
  { month: "Jun", accidents: 214 },
];

const accidentsByCauseData = [
    { name: 'Speeding', value: 400, fill: 'var(--color-speeding)' },
    { name: 'Distraction', value: 300, fill: 'var(--color-distraction)' },
    { name: 'Weather', value: 200, fill: 'var(--color-weather)' },
    { name: 'DUI', value: 278, fill: 'var(--color-dui)' },
    { name: 'Other', value: 189, fill: 'var(--color-other)' },
];

const chartConfig = {
  accidents: {
    label: "Accidents",
    color: "hsl(var(--primary))",
  },
   speeding: { label: 'Speeding', color: 'hsl(var(--chart-1))' },
  distraction: { label: 'Distraction', color: 'hsl(var(--chart-2))' },
  weather: { label: 'Weather', color: 'hsl(var(--chart-3))' },
  dui: { label: 'DUI', color: 'hsl(var(--chart-4))' },
  other: { label: 'Other', color: 'hsl(var(--chart-5))' },
};

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Accidents by Month</CardTitle>
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
          <CardTitle>Accidents by Cause</CardTitle>
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
