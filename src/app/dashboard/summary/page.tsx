
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, FileText, OctagonAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAccidents } from '@/services/accidents';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function SummaryPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [summary, setSummary] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setSummary(null);
        setError(null);
        
        try {
            const allAccidents = await getAccidents();
            
            if (allAccidents.length < 5) { // Require a minimum number of accidents for a meaningful summary
                setError("No hay suficientes datos de accidentes registrados (< 5) para generar un resumen ejecutivo significativo. Registre más datos primero.");
                setIsLoading(false);
                return;
            }

            const headers = "ubicacion,fecha,hora,tipo,causa,estado_cruce,observaciones,latitud,longitud";
            const csvData = allAccidents.map(acc => {
                const accDate = new Date(acc.dateTime);
                return [
                    `"${acc.addressPrefix} ${acc.address}"`,
                    `"${format(accDate, 'yyyy-MM-dd')}"`,
                    `"${format(accDate, 'HH:mm')}"`,
                    `"${acc.type}"`,
                    `"${acc.cause}"`,
                    `"${acc.crossingStatus}"`,
                    `"${acc.observations || ''}"`,
                    `"${acc.latitude}"`,
                    `"${acc.longitude}"`
                ].join(',');
            }).join('\\n');
            const historicalAccidentData = `${headers}\\n${csvData}`;

            // Lazy load AI actions
            const { analyzeCriticalZones } = await import('@/ai/flows/analyze-critical-zones');
            const { suggestRoadInterventions } = await import('@/ai/flows/suggest-road-interventions');
            const { suggestControlPosts } = await import('@/ai/flows/suggest-control-posts');
            const { generateExecutiveSummary } = await import('@/ai/flows/generate-executive-summary');

            // Step 1: Analyze critical zones
            const analysisResult = await analyzeCriticalZones({
                historicalAccidentData,
                criteria: 'Identificar las 3 zonas con mayor número de accidentes.',
            });

            if (!analysisResult || analysisResult.criticalZones.length === 0) {
                setError("La IA no pudo identificar zonas críticas con los datos actuales. No es posible generar el resumen.");
                setIsLoading(false);
                return;
            }

            // Step 2: Get recommendations (interventions and control posts)
            const [interventionsResult, controlsResult] = await Promise.all([
                suggestRoadInterventions({
                    accidentData: historicalAccidentData,
                    criticalZoneAnalysis: JSON.stringify(analysisResult),
                }),
                suggestControlPosts({
                    accidentData: historicalAccidentData,
                })
            ]);

            // Step 3: Generate the executive summary
            const summaryResult = await generateExecutiveSummary({
                criticalZonesAnalysis: JSON.stringify(analysisResult),
                interventionRecommendations: JSON.stringify(interventionsResult),
                controlPostRecommendations: JSON.stringify(controlsResult),
            });

            if (summaryResult && summaryResult.summary) {
                setSummary(summaryResult.summary);
            } else {
                setError("La IA no pudo generar el resumen ejecutivo en esta ocasión.");
            }

        } catch (e) {
             console.error(e);
             setError("Ocurrió un error inesperado al contactar a los servicios de IA. Por favor, intente de nuevo más tarde.");
             toast({
                variant: "destructive",
                title: "Error de IA",
                description: "No se pudieron generar el resumen. Verifique la consola para más detalles.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Informe Ejecutivo con IA</h1>
                    <p className="text-muted-foreground mt-1">
                        Genere un resumen de alto nivel sobre la situación de seguridad vial para directivos.
                    </p>
                </div>
                 <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    Generar Informe
                </Button>
            </div>
            
            <div className="mt-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card p-8 rounded-lg border">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Contactando Asesor IA...</h3>
                        <p className="mt-2 max-w-md">
                           El agente de IA está analizando todos los datos y redactando el informe ejecutivo. Este proceso puede tardar varios segundos...
                        </p>
                    </div>
                )}
                
                {error && (
                     <Alert variant="destructive">
                        <OctagonAlert className="h-4 w-4" />
                        <AlertTitle>No se pudo generar el informe</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {summary && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-6 h-6" />
                                Resumen Ejecutivo: Estado de la Seguridad Vial
                            </CardTitle>
                            <CardDescription>
                                Generado por el Asesor de IA de Centinela Vial. Este texto está en formato Markdown y puede ser copiado.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/50 rounded-md border">
                                {summary.split('\\n\\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph.replace(/\\n/g, ' ')}</p>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )} 
                
                {!isLoading && !summary && !error && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <Lightbulb className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold">Listo para analizar</h3>
                            <p className="mt-2 max-w-md mx-auto">
                                Presione el botón "Generar Informe" para que el agente de IA analice todos los datos de accidentes, identifique zonas críticas, sugiera acciones y redacte un informe ejecutivo completo.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
