"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, AlertTriangle, Lightbulb, Calendar as CalendarIcon } from "lucide-react";
import { initialAccidents, Accident } from "@/app/dashboard/accidents/page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";

type CriticalZone = {
    location: string;
    accidentCount: number;
    reason: string;
};

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
    const [isLoading, setIsLoading] = React.useState(false);
    const [analysisResult, setAnalysisResult] = React.useState<CriticalZone[] | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const [dateFilter, setDateFilter] = React.useState<DateRange | undefined>();
    const [typeFilter, setTypeFilter] = React.useState("");
    const [causeFilter, setCauseFilter] = React.useState("");

    const handleClearFilters = () => {
        setDateFilter(undefined);
        setTypeFilter("");
        setCauseFilter("");
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const filteredAccidents = initialAccidents.filter(accident => {
                const accidentDate = new Date(accident.date);
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

            const accidentsByLocation: { [key: string]: Accident[] } = filteredAccidents.reduce((acc, current) => {
                acc[current.location] = acc[current.location] || [];
                acc[current.location].push(current);
                return acc;
            }, {} as { [key: string]: Accident[] });

            const criticalZones: CriticalZone[] = Object.entries(accidentsByLocation)
                .map(([location, accidents]) => ({
                    location,
                    accidentCount: accidents.length,
                    reason: `Se supera el umbral de 2 accidentes. Causas comunes: ${[...new Set(accidents.map(a => causeLabels[a.cause] || a.cause))].join(', ')}.`
                }))
                .filter(zone => zone.accidentCount > 2);

            if(criticalZones.length === 0) {
                 setError("No se identificaron zonas críticas con los filtros seleccionados. Se necesitan más de 2 accidentes en una misma ubicación para que se considere crítica.");
            } else {
                 setAnalysisResult(criticalZones);
            }

        } catch (e) {
            console.error(e);
            setError("Ocurrió un error inesperado durante el análisis simulado.");
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

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Resultados del Análisis</CardTitle>
                    <CardDescription>
                        Las zonas críticas se identifican cuando una ubicación registra más de 2 accidentes según los filtros aplicados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                            <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">Analizando datos...</h3>
                            <p className="mt-2 max-w-md">
                                La IA está procesando el historial de accidentes para identificar patrones y zonas de alta concentración.
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
                    {analysisResult && analysisResult.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ubicación Crítica</TableHead>
                                    <TableHead className="text-center">Nº de Accidentes</TableHead>
                                    <TableHead>Justificación</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysisResult.map((zone) => (
                                    <TableRow key={zone.location}>
                                        <TableCell className="font-medium">{zone.location}</TableCell>
                                        <TableCell className="text-center">{zone.accidentCount}</TableCell>
                                        <TableCell>{zone.reason}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {!isLoading && !error && !analysisResult && (
                        <div className="text-center text-muted-foreground p-8">
                            <p>Ajuste los filtros y presione "Analizar Datos" para iniciar el análisis.</p>
                        </div>
                    )}

                </CardContent>
            </Card>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Mapa de Calor de Zonas Críticas</CardTitle>
                    <CardDescription>
                        Visualización geográfica de la concentración de accidentes. Esta funcionalidad estará disponible próximamente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
                        <Image
                            src="https://placehold.co/800x500.png"
                            alt="Mapa de calor de ejemplo"
                            fill={true}
                            style={{objectFit: 'cover'}}
                            data-ai-hint="heat map"
                        />
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <p className="text-lg font-semibold text-foreground bg-white/80 px-4 py-2 rounded-md shadow-lg">PRÓXIMAMENTE</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
