
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, OctagonAlert, Bot } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getAccidents } from '@/services/accidents';
import { analyzePatterns, type AnalyzePatternsOutput } from '@/ai/flows/analyze-patterns';

export default function PatternsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [analysisResult, setAnalysisResult] = React.useState<AnalyzePatternsOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setAnalysisResult(null);
        setError(null);
        
        try {
            const allAccidents = await getAccidents();

            if (allAccidents.length < 5) {
                setError("No hay suficientes datos de accidentes para un análisis de patrones significativo. Se recomiendan al menos 5 registros.");
                setIsLoading(false);
                return;
            }

            const headers = "ubicacion,fecha,hora,tipo,causa,estado_cruce,clima,evento_especial,observaciones,latitud,longitud";
            const csvData = allAccidents.map(acc => {
                const accDate = new Date(acc.dateTime);
                const datePart = accDate.toISOString().split('T')[0];
                const timePart = accDate.toTimeString().split(' ')[0].substring(0, 5);

                return [
                    `"${acc.location}"`,
                    `"${datePart}"`,
                    `"${timePart}"`,
                    `"${acc.type}"`,
                    `"${acc.cause}"`,
                    `"${acc.crossingStatus}"`,
                    `"${acc.weather}"`,
                    `"${acc.specialEvent}"`,
                    `"${(acc.observations || '').replace(/"/g, '""')}"`,
                    `"${acc.latitude}"`,
                    `"${acc.longitude}"`
                ].join(',');
            }).join('\\n');
            const historicalAccidentData = `${headers}\\n${csvData}`;

            const result = await analyzePatterns({
                accidentData: historicalAccidentData,
            });

            if (result && result.findings.length > 0) {
                setAnalysisResult(result);
            } else {
                setError("La IA no encontró patrones o correlaciones significativas en los datos actuales.");
            }

        } catch (e) {
             console.error(e);
             setError("Ocurrió un error inesperado al contactar al servicio de IA. Por favor, intente de nuevo más tarde.");
             toast({
                variant: "destructive",
                title: "Error de IA",
                description: "No se pudo generar el análisis. Verifique la consola para más detalles.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Análisis de Patrones Externos</h1>
                    <p className="text-muted-foreground mt-1">
                        Descubra cómo el clima y los eventos especiales influyen en la accidentalidad.
                    </p>
                </div>
                 <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Analizar Patrones
                </Button>
            </div>
            
            <div className="mt-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card p-8 rounded-lg border">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Buscando correlaciones...</h3>
                        <p className="mt-2 max-w-md">
                           La IA está analizando todos los accidentes en busca de patrones ocultos relacionados con el clima y eventos. Esto puede tardar unos segundos.
                        </p>
                    </div>
                )}
                
                 {error && (
                     <Alert variant="destructive">
                        <OctagonAlert className="h-4 w-4" />
                        <AlertTitle>No se pudo completar el análisis</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {analysisResult ? (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen General del Análisis</CardTitle>
                                <CardDescription>Conclusión principal de la IA sobre los patrones encontrados.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{analysisResult.summary}</p>
                            </CardContent>
                        </Card>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {analysisResult.findings.map((finding, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                       <CardTitle className="text-lg">{finding.patternTitle}</CardTitle>
                                       <CardDescription>Correlación Identificada</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm">{finding.description}</p>
                                        <div className="bg-muted/50 p-3 rounded-md">
                                            <h4 className="font-semibold text-sm mb-1">Recomendación de la IA</h4>
                                            <p className="text-sm text-muted-foreground">{finding.recommendation}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : !isLoading && !error && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <Lightbulb className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold">Listo para el Análisis de Patrones</h3>
                            <p className="mt-2 max-w-md mx-auto">
                                Presione "Analizar Patrones" para que la IA busque correlaciones entre los accidentes, el clima y eventos especiales en la ciudad.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

    