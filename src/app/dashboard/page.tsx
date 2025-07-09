import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "@/components/client/dashboard-charts";
import { Eye, MapPin, Wrench, Siren } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { title: "Total Accidentes Registrados", value: "146", icon: Siren, change: "Datos simulados" },
    { title: "Zonas Críticas", value: "4", icon: MapPin, change: "+1 esta semana" },
    { title: "Intervenciones Pendientes", value: "15", icon: Wrench, change: "3 esperando aprobación" },
    { title: "Reportes Activos", value: "28", icon: Eye, change: "Actualizado hace 2 horas" },
  ];

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
      <p className="text-muted-foreground mt-1">
        Resumen de métricas y tendencias de seguridad vial.
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
