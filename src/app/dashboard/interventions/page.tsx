
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, TrafficCone, OctagonAlert, Signal, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAccidents, type Accident } from '@/services/accidents';
import { useToast } from "@/hooks/use-toast";
import { format, min, max } from 'date-fns';
import { dbscan } from "@/lib/dbscan";

// Lazy-loaded AI functions
import type { suggestRoadInterventions, SuggestRoadInterventionsOutput } from '@/ai/flows/suggest-road-interventions';
import type { analyzeCriticalZones, AnalyzeCriticalZonesInput, AnalyzeCriticalZonesOutput } from "@/ai/flows/analyze-critical-zones";

type Recommendation = SuggestRoadInterventionsOutput['recommendations'][0];

const interventionIcons: { [key: string]: React.ElementType } = {
    'semáforo': Signal,
    'reductores de velocidad': TrafficCone,
    'reductor de velocidad': TrafficCone,
    'señal de pare': OctagonAlert,
    'señalización': OctagonAlert,
    'cebra peatonal': OctagonAlert,
    'paso peatonal': OctagonAlert,
    'mejorar iluminación': Lightbulb,
    'iluminación': Lightbulb,
    'default': Lightbulb
};

const getIconForIntervention = (intervention: string): React.ElementType => {
    const lowerIntervention = intervention.toLowerCase();
    for (const key in interventionIcons) {
        if (lowerIntervention.includes(key)) {
            return interventionIcons[key];
        }
    }
    return interventionIcons['default'];
};


export default function InterventionsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [recommendations, setRecommendations] = React.useState<Recommendation[] | null>(null);
    const [error, setError] = React.useState<string | null>(null);


    const handleGenerate = async () => {
        setIsLoading(true);
        setRecommendations(null);
        setError(null);
        
        try {
            // Step 1: Data Collection
            const allAccidents = await getAccidents();
             if (allAccidents.length < 3) {
                setError("Se necesitan al menos 3 accidentes registrados para generar sugerencias de intervención.");
                setIsLoading(false);
                return;
            }

            // Step 2.1: Critical Zone Analysis (DBSCAN)
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
                 setError("El análisis no encontró agrupaciones geográficas de accidentes (zonas críticas). No se pueden generar recomendaciones.");
                 setIsLoading(false);
                 return;
            }

            // Step 2.2: Critical Zone Analysis (AI Flow)
            const { analyzeCriticalZones }: { analyzeCriticalZones: analyzeCriticalZones } = await import('@/ai/flows/analyze-critical-zones');
            
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

            const dates = allAccidents.map(acc => new Date(acc.dateTime));
            const analysisPeriod = `del ${format(min(dates), 'yyyy-MM-dd')} al ${format(max(dates), 'yyyy-MM-dd')}`;
            
            const aiInput: AnalyzeCriticalZonesInput = {
                accidentClusters: accidentClustersForAI,
                analysisPeriod: analysisPeriod
            };
            
            const analysisResult: AnalyzeCriticalZonesOutput = await analyzeCriticalZones(aiInput);

            if (!analysisResult || analysisResult.criticalZones.length === 0) {
                setError("La IA no pudo identificar zonas críticas con los datos actuales. No es posible generar recomendaciones.");
                setIsLoading(false);
                return;
            }

            // Step 3: Generate Suggestions
            const { suggestRoadInterventions }: { suggestRoadInterventions: suggestRoadInterventions } = await import('@/ai/flows/suggest-road-interventions');
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

            const interventionsResult = await suggestRoadInterventions({
                criticalZoneAnalysis: JSON.stringify(analysisResult),
                accidentData: historicalAccidentData
            });
            
            // Step 4: Display Results
            if (interventionsResult && interventionsResult.recommendations.length > 0) {
                setRecommendations(interventionsResult.recommendations);
            } else {
                setError("La IA no generó ninguna recomendación en esta ocasión. Puede que los datos actuales no sugieran patrones claros para intervenciones.");
            }

        } catch (e) {
             console.error(e);
             setError("Ocurrió un error inesperado al contactar al servicio de IA. Por favor, intente de nuevo más tarde.");
             toast({
                variant: "destructive",
                title: "Error de IA",
                description: "No se pudieron generar las sugerencias. Verifique la consola para más detalles.",
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
                        Genere recomendaciones de infraestructura vial basadas en IA y en el análisis de datos.
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
                        <h3 className="text-lg font-semibold text-foreground">Generando recomendaciones...</h3>
                        <p className="mt-2 max-w-md">
                           Analizando clusters de accidentes, consultando al experto en tráfico de IA y formulando sugerencias. Esto puede tardar unos segundos.
                        </p>
                    </div>
                )}
                
                {error && (
                     <Alert variant="destructive">
                        <OctagonAlert className="h-4 w-4" />
                        <AlertTitle>No se pudieron generar las sugerencias</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {recommendations && (
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
                                    <p className="text-sm font-semibold">{rec.justification}</p>
                                </CardContent>
                            </Card>
                        )})}
                    </div>
                )} 
                
                {!isLoading && !recommendations && !error && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <p>Presione "Generar Sugerencias" para que la IA analice los datos de accidentes y proponga intervenciones viales.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
