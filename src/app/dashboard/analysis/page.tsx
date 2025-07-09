"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, Lightbulb } from "lucide-react";
import { initialAccidents, Accident } from "@/app/dashboard/accidents/page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


type CriticalZone = {
    location: string;
    accidentCount: number;
    reason: string;
};

export default function AnalysisPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [analysisResult, setAnalysisResult] = React.useState<CriticalZone[] | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        // Lógica de simulación
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // 1. Agrupar por ubicación (RF04)
            const accidentsByLocation: { [key: string]: Accident[] } = initialAccidents.reduce((acc, current) => {
                acc[current.location] = acc[current.location] || [];
                acc[current.location].push(current);
                return acc;
            }, {} as { [key: string]: Accident[] });

            // 2. Calcular frecuencia y detectar zonas críticas (RF05, RF06)
            const criticalZones: CriticalZone[] = Object.entries(accidentsByLocation)
                .map(([location, accidents]) => ({
                    location,
                    accidentCount: accidents.length,
                    // Lógica de ejemplo para la razón
                    reason: `Se supera el umbral de 2 accidentes. Causas comunes: ${[...new Set(accidents.map(a => a.cause))].join(', ')}.`
                }))
                .filter(zone => zone.accidentCount > 2); // Umbral de ejemplo: más de 2 accidentes

            if(criticalZones.length === 0) {
                 setError("No se identificaron zonas críticas con los datos de muestra actuales. Se necesitan más de 2 accidentes en una misma ubicación para que se considere crítica.");
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Análisis de Zonas Críticas</h1>
                    <p className="text-muted-foreground mt-1">
                        Agrupe, cuente y detecte zonas de alto riesgo a partir de datos históricos.
                    </p>
                </div>
                <Button onClick={handleAnalyze} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                    Analizar Datos de Muestra
                </Button>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Resultados del Análisis</CardTitle>
                    <CardDescription>
                        Las zonas críticas se identifican cuando una ubicación registra más de 2 accidentes.
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
                            <p>Presione el botón "Analizar Datos de Muestra" para iniciar el análisis.</p>
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
