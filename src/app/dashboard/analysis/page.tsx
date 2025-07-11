"use client";

import React from "react";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, AlertTriangle, Lightbulb, Calendar as CalendarIcon } from "lucide-react";
import { type Accident, getAccidents } from "@/services/accidents";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { analyzeCriticalZones, type AnalyzeCriticalZonesOutput } from "@/ai/flows/analyze-critical-zones";
import { useToast } from "@/hooks/use-toast";

const Heatmap = dynamic(() => import('@/components/client/heatmap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

const causeLabels: { [key: string]: string } = {
    'exceso-velocidad': 'Exceso de Velocidad',
    'distraccion': 'Conducción Distraída',
    'alcohol': 'Conducir Bajo Influencia (CBI)',
    'clima': 'Condiciones Climáticas',
    'imprudencia': 'Imprudencia del Conductor',
    'falla-mecanica': 'Falla Mecánica',
    'otro': 'Otro',
};

const typeLabels: { [key: string]: string } = {
    'colision': 'Colisión',
    'atropello': 'Atropello',
    'caida-ocupante': 'Caída de Ocupante',
    'volcamiento': 'Volcamiento',
    'otro': 'Otro',
};


export default function AnalysisPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [analysisResult, setAnalysisResult] = React.useState<AnalyzeCriticalZonesOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const [dateFilter, setDateFilter] = React.useState<DateRange | undefined>();
    const [typeFilter, setTypeFilter] = React.useState("");
    const [causeFilter, setCauseFilter] = React.useState("");

    const [mapData, setMapData] = React.useState<[number, number, number][] | null>(null);

    const handleClearFilters = () => {
        setDateFilter(undefined);
        setTypeFilter("");
        setCauseFilter("");
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setMapData(null);

        try {
            const allAccidents = await getAccidents();
            
            if (allAccidents.length === 0) {
                 setError("No hay accidentes registrados en la base de datos para analizar. Registre algunos primero.");
                 setIsLoading(false);
                 return;
            }

            const filteredAccidents = allAccidents.filter(accident => {
                if (!accident.dateTime) return false;
                const accidentDate = new Date(accident.dateTime);
                const from = dateFilter?.from;
                const to = dateFilter?.to;

                const dateMatch = !from || (accidentDate >= from && (!to || accidentDate <= to));
                const typeMatch = !typeFilter || accident.accidentType === typeFilter;
                const causeMatch = !causeFilter || accident.cause === causeFilter;

                return dateMatch && typeMatch && causeMatch;
            });
            
            if (filteredAccidents.length === 0) {
                 setError("No se encontraron accidentes con los filtros aplicados. Pruebe con criterios más amplios.");
                 setIsLoading(false);
                 return;
            }

            const headers = "ubicacion,fecha,hora,tipo,causa,estado_cruce,observaciones,latitud,longitud";
            const csvData = filteredAccidents.map(acc => {
                const accDate = new Date(acc.dateTime);
                return [
                    `"${acc.addressPrefix} ${acc.address}"`,
                    `"${format(accDate, 'yyyy-MM-dd')}"`,
                    `"${format(accDate, 'HH:mm')}"`,
                    `"${acc.accidentType}"`,
                    `"${acc.cause}"`,
                    `"${acc.crossingStatus}"`,
                    `"${acc.observations || ''}"`,
                    `"${acc.latitude}"`,
                    `"${acc.longitude}"`
                ].join(',');
            }).join('\\n');
            const historicalAccidentData = `${headers}\\n${csvData}`;
            
            const fromDate = dateFilter?.from ? format(dateFilter.from, 'yyyy-MM-dd') : 'inicio';
            const toDate = dateFilter?.to ? format(dateFilter.to, 'yyyy-MM-dd') : 'fin';
            const criteria = `Analizar accidentes entre ${fromDate} y ${toDate}. Considerar una zona como crítica si tiene más de 2 accidentes.`;

            const result = await analyzeCriticalZones({
                historicalAccidentData,
                criteria,
            });

            if(result.criticalZones.length === 0) {
                 setError("La IA no identificó zonas críticas con los filtros seleccionados. Los datos no superan los umbrales de criticidad.");
            } else {
                 setAnalysisResult(result);
                 const heatMapPoints = filteredAccidents
                    .filter(acc => acc.latitude && acc.longitude)
                    .map(acc => [acc.latitude, acc.longitude, 0.5] as [number, number, number]);
                 setMapData(heatMapPoints);
            }

        } catch (e) {
            console.error(e);
            setError("Ocurrió un error inesperado al contactar al servicio de IA. Por favor, intente de nuevo más tarde.");
            toast({
                variant: "destructive",
                title: "Error de IA",
                description: "No se pudo completar el análisis. Verifique la consola para más detalles.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Análisis de Zonas Críticas</h1>
                <p className="text-muted-foreground mt-1">
                    Filtre los datos y utilice la IA para agrupar, contar y detectar zonas de alto riesgo.
                </p>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Filtros de Análisis</CardTitle>
                    <CardDescription>
                      Seleccione los criterios para analizar las zonas críticas. Los resultados se basarán en estos filtros.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "justify-start text-left font-normal",
                                        !dateFilter && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFilter?.from ? (
                                        dateFilter.to ? (
                                            <>
                                                {format(dateFilter.from, "LLL dd, y", { locale: es })} -{" "}
                                                {format(dateFilter.to, "LLL dd, y", { locale: es })}
                                            </>
                                        ) : (
                                            format(dateFilter.from, "LLL dd, y", { locale: es })
                                        )
                                    ) : (
                                        <span>Filtrar por fecha</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateFilter?.from}
                                    selected={dateFilter}
                                    onSelect={setDateFilter}
                                    numberOfMonths={2}
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(typeLabels).map(([value, label]) => (
                                     <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={causeFilter} onValueChange={setCauseFilter}>
                            <SelectTrigger><SelectValue placeholder="Filtrar por causa" /></SelectTrigger>
                            <SelectContent>
                                 {Object.entries(causeLabels).map(([value, label]) => (
                                     <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                     <Button onClick={handleAnalyze} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                        Analizar Datos
                    </Button>
                    <Button variant="ghost" onClick={handleClearFilters}>Limpiar Filtros</Button>
                </CardFooter>
            </Card>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados del Análisis IA</CardTitle>
                        <CardDescription>
                            Puntos de alta siniestralidad procesados por la IA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && (
                             <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                                <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">Contactando a la IA...</h3>
                                <p className="mt-2 max-w-md">
                                    Procesando historial de accidentes para identificar patrones y zonas críticas.
                                </p>
                            </div>
                        )}
                        {error && (
                             <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Análisis sin resultados</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {analysisResult && analysisResult.criticalZones.length > 0 && (
                           <>
                                <Alert className="mb-6">
                                    <Lightbulb className="h-4 w-4" />
                                    <AlertTitle>Resumen del Analista IA</AlertTitle>
                                    <AlertDescription>{analysisResult.summary}</AlertDescription>
                                </Alert>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ubicación Crítica</TableHead>
                                            <TableHead className="text-center">Nº</TableHead>
                                            <TableHead>Periodo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {analysisResult.criticalZones.map((zone) => (
                                            <TableRow key={zone.location}>
                                                <TableCell className="font-medium">{zone.location}</TableCell>
                                                <TableCell className="text-center">{zone.accidentCount}</TableCell>
                                                <TableCell>{zone.analysisPeriod}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        )}
                         {!isLoading && !error && !analysisResult && (
                            <div className="text-center text-muted-foreground p-8">
                                <p>Ajuste los filtros y presione "Analizar Datos" para iniciar el análisis con IA.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Mapa de Calor de Zonas Críticas</CardTitle>
                        <CardDescription>
                            Visualización geográfica de la concentración de accidentes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-video w-full h-full min-h-[400px] rounded-md overflow-hidden">
                           <Heatmap data={mapData} />
                        </div>
                    </CardContent>
                </Card>
             </div>
        </>
    );
}
