
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, TrafficCone, OctagonAlert, TrafficSignal, ShieldAlert, CarCrash } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestRoadInterventions, type SuggestRoadInterventionsOutput } from '@/ai/flows/suggest-road-interventions';
import { getAccidents, type Accident } from '@/services/accidents';
import { useToast } from "@/hooks/use-toast";
import { dbscan } from "@/lib/dbscan";
import { format, min, max } from 'date-fns';

const interventionIcons: { [key: string]: React.ElementType } = {
    'semáforo': TrafficSignal,
    'reductor': TrafficCone,
    'señalización': ShieldAlert,
    'iluminación': Lightbulb,
    'radar': CarCrash,
    'default': Lightbulb
};

const getIconForIntervention = (intervention: string): React.ElementType => {
    const lowerType = intervention.toLowerCase();
    for (const key in interventionIcons) {
        if (lowerType.includes(key)) {
            return interventionIcons[key];
        }
    }
    return interventionIcons['default'];
};


export default function InterventionsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [progressMessage, setProgressMessage] = React.useState("");
    const [recommendations, setRecommendations] = React.useState<SuggestRoadInterventionsOutput['recommendations'] | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setRecommendations(null);
        setError(null);
        
        try {
            // Step 1: Get all accidents
            setProgressMessage("Paso 1: Recopilando todos los reportes de accidentes...");
            const allAccidents = await getAccidents();
            
            if (allAccidents.length < 2) {
                setError("Fallo en Paso 1: Se necesitan al menos 2 accidentes registrados para generar sugerencias.");
                setIsLoading(false);
                return;
            }
            setProgressMessage("Paso 1: Completado. Datos de accidentes recopilados.");

            // Step 2: Run DBSCAN to find clusters
            setProgressMessage("Paso 2: Ejecutando análisis geográfico (DBSCAN) para encontrar puntos calientes...");
            const points = allAccidents.map(acc => [acc.latitude, acc.longitude] as [number, number]);
            const clusterAssignments = dbscan(points, 0.0005, 2);

            const clusters: Accident[][] = [];
            clusterAssignments.forEach((clusterIndex, pointIndex) => {
                if (clusterIndex !== -1) { 
                    if (!clusters[clusterIndex]) {
                        clusters[clusterIndex] = [];
                    }
                    clusters[clusterIndex].push(allAccidents[pointIndex]);
                }
            });
            
            const significantClusters = clusters.filter(c => c && c.length > 0);
            if (significantClusters.length === 0) {
                setError("Fallo en Paso 2: No se encontraron zonas de alta concentración de accidentes para analizar.");
                setIsLoading(false);
                return;
            }
             setProgressMessage("Paso 2: Completado. Puntos calientes identificados.");

            // Step 3: Call analyzeCriticalZones AI flow
            setProgressMessage("Paso 3: Enviando puntos calientes a la IA para análisis de criticidad...");
            const { analyzeCriticalZones } = await import('@/ai/flows/analyze-critical-zones');
            const accidentClustersForAI = significantClusters.map((cluster, index) => {
                 const accidentCount = cluster.length;
                const locations = cluster.map(acc => `${acc.addressPrefix} ${acc.address}`);
                const locationCounts = locations.reduce((acc, loc) => { acc[loc] = (acc[loc] || 0) + 1; return acc; }, {} as {[key: string]: number});
                const representativeLocation = Object.keys(locationCounts).reduce((a, b) => locationCounts[a] > locationCounts[b] ? a : b);
                const causes = cluster.map(acc => acc.cause);
                const causeCounts = causes.reduce((acc, cause) => { acc[cause] = (acc[cause] || 0) + 1; return acc; }, {} as {[key: string]: number});
                const causeSummary = Object.entries(causeCounts).map(([cause, count]) => `${count} por ${cause}`).join(', ');
                const dates = cluster.map(acc => new Date(acc.dateTime));
                const period = `${format(min(dates), 'yyyy-MM-dd')} a ${format(max(dates), 'yyyy-MM-dd')}`;
                
                return { clusterId: index, accidentCount, representativeLocation, causeSummary, period };
            });
            const analysisResult = await analyzeCriticalZones({
                accidentClusters: accidentClustersForAI,
                analysisPeriod: "Periodo histórico completo"
            });
            
             if (!analysisResult || analysisResult.criticalZones.length === 0) {
                setError("Fallo en Paso 3: La IA no pudo identificar zonas críticas a partir de los datos. No se pueden generar recomendaciones.");
                setIsLoading(false);
                return;
            }
            setProgressMessage("Paso 3: Completado. Análisis de criticidad recibido.");

            // Step 4: Call suggestRoadInterventions AI flow
            setProgressMessage("Paso 4: Consultando al experto en tráfico de IA para generar sugerencias viales...");
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

            const result = await suggestRoadInterventions({
                criticalZoneAnalysis: JSON.stringify(analysisResult),
                accidentData: historicalAccidentData
            });
            setProgressMessage("Paso 4: Completado. Sugerencias generadas.");

            // Step 5: Present results
             setProgressMessage("Paso 5: Presentando resultados...");
            if (result && result.recommendations.length > 0) {
                setRecommendations(result.recommendations);
            } else {
                setError("Fallo en Paso 4: La IA no generó ninguna recomendación. Puede que los datos actuales no sugieran patrones claros para intervenciones viales.");
            }
            setProgressMessage("Proceso finalizado.");

        } catch (e: any) {
             console.error(e);
             const errorMessage = `Error durante ${progressMessage.toLowerCase().replace('...', '')}: ${e.message || 'Error inesperado.'}`;
             setError(errorMessage);
             toast({
                variant: "destructive",
                title: "Error en la Generación",
                description: "No se pudo completar el proceso. Verifique la consola para más detalles.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sugerencias de Intervención Vial</h1>
                    <p className="text-muted-foreground mt-1">
                        Genere recomendaciones viales basadas en datos y análisis de IA.
                    </p>
                </div>
                 <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                    Generar Sugerencias
                </Button>
            </div>
            
            <div className="mt-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card p-8 rounded-lg border">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Generando sugerencias...</h3>
                         <p className="mt-2 max-w-md text-sm">
                           {progressMessage}
                        </p>
                    </div>
                )}
                
                 {error && !isLoading && (
                     <Alert variant="destructive">
                        <OctagonAlert className="h-4 w-4" />
                        <AlertTitle>No se pudieron generar sugerencias</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {recommendations ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {recommendations.map((rec, index) => {
                            const Icon = getIconForIntervention(rec.intervention);
                            return (
                                <Card key={index}>
                                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                         <div className="bg-primary/10 p-3 rounded-full">
                                          <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>{rec.intervention}</CardTitle>
                                            <CardDescription>{rec.location}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{rec.justification}</p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : !isLoading && !error && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                             <Lightbulb className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold">Listo para Sugerir</h3>
                            <p className="mt-2 max-w-md mx-auto">
                                Presione "Generar Sugerencias" para que la IA analice los datos de accidentes y proponga intervenciones para mejorar la seguridad vial.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
