import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "@/components/client/dashboard-charts";
import { Eye, MapPin, Wrench, Siren, CheckCircle } from "lucide-react";
import { getAccidents, type Accident } from "@/services/accidents";
import { getRecommendations } from "@/services/recommendations";
import { getSettings } from "@/services/settings";
import { dbscan } from "@/lib/dbscan";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Helper function to process data for charts
const processChartData = (accidents: Accident[], causeLabels: { [key: string]: string }) => {
    const accidentsByMonth: { [key: string]: number } = {};
    const accidentsByCause: { [key: string]: number } = {};

    accidents.forEach(accident => {
        const date = new Date(accident.dateTime);
        // Format as "Mmm-yy" e.g., "Ene-24"
        const monthYearKey = format(date, 'MMM-yy', { locale: es });
        
        accidentsByMonth[monthYearKey] = (accidentsByMonth[monthYearKey] || 0) + 1;
        
        const causeLabel = causeLabels[accident.cause] || 'Otro';
        accidentsByCause[causeLabel] = (accidentsByCause[causeLabel] || 0) + 1;
    });

    // Create a map to convert "ene-24" to a Date object for sorting
    const dateMap = new Map<string, Date>();
    Object.keys(accidentsByMonth).forEach(key => {
        const [monthStr, yearStr] = key.split('-');
        const monthIndex = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'].indexOf(monthStr.toLowerCase());
        const year = parseInt(yearStr, 10) + 2000;
        if(monthIndex !== -1) {
            dateMap.set(key, new Date(year, monthIndex));
        }
    });

    const accidentsByMonthData = Object.entries(accidentsByMonth)
        .map(([month, accidents]) => ({ month: month.charAt(0).toUpperCase() + month.slice(1), accidents }))
        .sort((a, b) => {
            const dateA = dateMap.get(a.month.toLowerCase());
            const dateB = dateMap.get(b.month.toLowerCase());
            if (dateA && dateB) {
                return dateA.getTime() - dateB.getTime();
            }
            return 0;
        });

    const accidentsByCauseData = Object.entries(accidentsByCause)
        .map(([name, value]) => ({ name, value }));

    return { accidentsByMonthData, accidentsByCauseData };
};


export default async function DashboardPage() {
  const [accidents, recommendations, settings] = await Promise.all([
    getAccidents(),
    getRecommendations(),
    getSettings()
  ]);
  
  const causeLabels = Object.fromEntries((settings?.accidentCauses || []).map(c => [c.value, c.label]));

  const { accidentsByMonthData, accidentsByCauseData } = processChartData(accidents, causeLabels);

  // Calculate critical zones from accidents
  let criticalZonesCount = 0;
  if (accidents.length >= 2) {
    const points = accidents.map(acc => [acc.latitude, acc.longitude] as [number, number]);
    const clusterAssignments = dbscan(points, 0.0005, 2); 
    const uniqueClusters = new Set(clusterAssignments.filter(c => c !== -1));
    criticalZonesCount = uniqueClusters.size;
  }
  
  // Calculate pending interventions
  const pendingInterventionsCount = recommendations.filter(rec => 
    rec.status === 'Sugerida' || rec.status === 'Aprobada' || rec.status === 'En Ejecución'
  ).length;

  // Calculate implemented measures
  const implementedMeasuresCount = recommendations.filter(rec => rec.status === 'Implementada').length;

  const stats = [
    { title: "Total Accidentes Registrados", value: accidents.length.toString(), icon: Siren, change: "Datos en tiempo real" },
    { title: "Zonas Críticas Identificadas", value: criticalZonesCount.toString(), icon: MapPin, change: "Basado en análisis DBSCAN" },
    { title: "Intervenciones Pendientes", value: pendingInterventionsCount.toString(), icon: Wrench, change: "Sugeridas, aprobadas o en ejecución" },
    { title: "Medidas Implementadas", value: implementedMeasuresCount.toString(), icon: CheckCircle, change: "Recomendaciones completadas" },
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
      <DashboardCharts accidentsByMonthData={accidentsByMonthData} accidentsByCauseData={accidentsByCauseData} />
    </>
  );
}
