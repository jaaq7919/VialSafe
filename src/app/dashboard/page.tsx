import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "@/components/client/dashboard-charts";
import { Eye, MapPin, Wrench, Siren } from "lucide-react";

const stats = [
    { title: "Total Accidents", value: "1,423", icon: Siren, change: "+20.1% from last month" },
    { title: "Critical Zones", value: "12", icon: MapPin, change: "+2 this week" },
    { title: "Pending Interventions", value: "34", icon: Wrench, change: "5 waiting for approval" },
    { title: "Active Reports", value: "57", icon: Eye, change: "Updated 2 hours ago" },
];

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-1">
        Overview of traffic safety metrics and trends.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <DashboardCharts />
    </>
  );
}
