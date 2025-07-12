
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, FilterX, Lightbulb, Loader2, OctagonAlert, FileText, Map } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { getSettings, type SettingItem } from '@/services/settings';
import { useToast } from "@/hooks/use-toast";
import { runDbscanAnalysis, type AnalysisResult } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import dynamic from 'next/dynamic';

const AnalysisMap = dynamic(() => import('@/components/client/analysis-map'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full rounded-md bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

export default function AnalysisPage() {
    const { toast } = useToast();
    const [causeOptions, setCauseOptions] = useState<SettingItem[]>([]);
    const [typeOptions, setTypeOptions] = useState<SettingItem[]>([]);

    const [causeFilter, setCauseFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [wasAnalyzed, setWasAnalyzed] = useState(false);

    useEffect(() => {
        const fetchSettingsForFilters = async () => {
            try {
                const settings = await getSettings();
                if (settings) {
                    setCauseOptions(settings.accidentCauses || []);
                    setTypeOptions(settings.accidentTypes || []);
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
        fetchSettingsForFilters();
    }, [toast]);

    const handleClearFilters = () => {
        setCauseFilter("all");
        setTypeFilter("all");
        setStartDate(undefined);
        setEndDate(undefined);
        setWasAnalyzed(false);
        setAnalysisResult(null);
        setAnalysisError(null);
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        setWasAnalyzed(true);
        setAnalysisResult(null);
        setAnalysisError(null);
        try {
            const filters = {
                startDate: startDate?.toISOString().split('T')[0],
                endDate: endDate?.toISOString().split('T')[0],
                type: typeFilter,
                cause: causeFilter,
            };
            const result = await runDbscanAnalysis(filters);
            
            if (result.error) {
                setAnalysisError(result.error);
                setAnalysisResult(null);
            } else if (result.analysis) {
                 setAnalysisResult(result.analysis);
                 setAnalysisError(null);
            }

        } catch (error) {
            console.error("Analysis failed", error);
            setAnalysisError("Ocurrió un error inesperado durante el análisis. Por favor, inténtelo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Análisis de Zonas Críticas</h1>
                <p className="text-muted-foreground mt-1">
                    Use el algoritmo DBSCAN para encontrar y analizar agrupaciones geográficas de accidentes y descubrir puntos críticos.
                </p>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Filtros de Análisis</CardTitle>
                    <CardDescription>
                      Defina los parámetros para la búsqueda de zonas críticas. El análisis se ejecutará sobre los datos filtrados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="flex flex-col gap-2">
                             <label className="text-sm font-medium">Fecha de Inicio</label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="flex flex-col gap-2">
                             <label className="text-sm font-medium">Fecha de Fin</label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "justify-start text-left font-normal",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Tipo de Accidente</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los tipos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los tipos</SelectItem>
                                    {typeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Causa de Accidente</label>
                            <Select value={causeFilter} onValueChange={setCauseFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas las causas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las causas</SelectItem>
                                    {causeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                                Analizar
                            </Button>
                            <Button variant="ghost" onClick={handleClearFilters} size="icon" className="shrink-0">
                                <FilterX className="h-4 w-4" />
                                <span className="sr-only">Limpiar Filtros</span>
                            </Button>
                        </div>

                    </div>
                </CardContent>
            </Card>

            <div className="mt-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card p-8 rounded-lg border">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Analizando datos...</h3>
                        <p className="mt-2 max-w-md">
                           Identificando clusters geográficos con DBSCAN. Esto puede tardar unos segundos.
                        </p>
                    </div>
                )}

                {analysisError && !isLoading && (
                    <Alert variant="destructive">
                        <OctagonAlert className="h-4 w-4" />
                        <AlertTitle>Error en el Análisis</AlertTitle>
                        <AlertDescription>{analysisError}</AlertDescription>
                    </Alert>
                )}

                {!isLoading && !analysisError && wasAnalyzed && (
                    <>
                        {analysisResult && analysisResult.criticalZones.length > 0 ? (
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight mb-4">Resultados del Análisis: {analysisResult.criticalZones.length} Zonas Críticas Identificadas</h2>
                                
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Map className="w-5 h-5" />
                                            Mapa de Calor de Zonas Críticas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[400px] w-full rounded-md overflow-hidden">
                                           <AnalysisMap points={analysisResult.allPoints} />
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                 <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Resumen General del Análisis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
                                    </CardContent>
                                 </Card>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {analysisResult.criticalZones.map((zone, index) => (
                                    <Card key={index} className="flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <OctagonAlert className="w-6 h-6 text-destructive" />
                                                <span>{zone.location}</span>
                                            </CardTitle>
                                             <CardDescription>
                                                {zone.reason}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-2">
                                           <p className="text-sm font-bold">{zone.accidentCount} accidentes registrados</p>
                                           <p className="text-xs text-muted-foreground"><strong>Periodo:</strong> {zone.period}</p>
                                            <p className="text-xs text-muted-foreground"><strong>Fechas:</strong> {zone.accidentDatesSummary}</p>
                                           <p className="text-xs text-muted-foreground"><strong>Causas:</strong> {zone.causeSummary}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                                </div>
                           </div>
                        ) : (
                             <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    <OctagonAlert className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                                    <h3 className="text-lg font-semibold">Análisis Completado Sin Zonas Críticas</h3>
                                    <p className="mt-2 max-w-md mx-auto">
                                        No se encontraron zonas de alta concentración de accidentes con los filtros y parámetros actuales.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
                
                {!isLoading && !wasAnalyzed && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <Lightbulb className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold">Listo para Analizar</h3>
                            <p className="mt-2 max-w-md mx-auto">
                               Ajuste los filtros según sea necesario y presione el botón "Analizar" para que el sistema identifique las zonas con mayor concentración de accidentes.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
