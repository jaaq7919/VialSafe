
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, AlertTriangle, Lightbulb, Calendar as CalendarIcon } from "lucide-react";
import { getAccidents } from "@/services/accidents";
import { getSettings, type SettingItem } from "@/services/settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import type { AnalyzeCriticalZonesOutput } from "@/ai/flows/analyze-critical-zones";

export default function AnalysisPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [analysisResult, setAnalysisResult] = React.useState<AnalyzeCriticalZonesOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const [dateFilter, setDateFilter] = React.useState<DateRange | undefined>();
    const [typeFilter, setTypeFilter] = React.useState("");
    const [causeFilter, setCauseFilter] = React.useState("");

    const [typeOptions, setTypeOptions] = React.useState<SettingItem[]>([]);
    const [causeOptions, setCauseOptions] = React.useState<SettingItem[]>([]);

    React.useEffect(() => {
        const fetchDropdownOptions = async () => {
            try {
                const settings = await getSettings();
                if (settings) {
                    setTypeOptions(settings.accidentTypes || []);
                    setCauseOptions(settings.accidentCauses || []);
                }
            } catch (error) {
                console.error("Error fetching settings for filters:", error);
                toast({
                    variant: "destructive",
                    title: "Error de Configuración",
                    description: "No se pudieron cargar las opciones de filtro.",
                });
            }
        };
        fetchDropdownOptions();
    }, [toast]);


    const handleClearFilters = () => {
        setDateFilter(undefined);
        setTypeFilter("");
        setCauseFilter("");
    };

    const onAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

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
                const typeMatch = !typeFilter || accident.type === typeFilter;
                const causeMatch = !causeFilter || accident.cause === causeFilter;

                return dateMatch && typeMatch && causeMatch;
            });
            
            const { handleAnalysis } = await import('./actions');
            const response = await handleAnalysis(filteredAccidents, dateFilter);

            if (response.error) {
                setError(response.error);
            } else if (response.result) {
                setAnalysisResult(response.result);
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
                    Este módulo utiliza inteligencia artificial para analizar el historial de accidentes y descubrir puntos de alta siniestralidad. Filtre los datos, ejecute el análisis y la IA agrupará los incidentes geográficamente, identificando las intersecciones y tramos viales que requieren mayor atención.
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                {typeOptions.map((option) => (
                                     <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={causeFilter} onValueChange={setCauseFilter}>
                            <SelectTrigger><SelectValue placeholder="Filtrar por causa" /></SelectTrigger>
                            <SelectContent>
                                 {causeOptions.map((option) => (
                                     <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={handleClearFilters}>Limpiar Filtros</Button>
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                     <Button onClick={onAnalyze} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                        Analizar Datos
                    </Button>
                </CardFooter>
            </Card>

             <div className="mt-8">
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
                                        {analysisResult.criticalZones.map((zone, index) => (
                                            <TableRow key={index}>
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
             </div>
        </>
    );
}
