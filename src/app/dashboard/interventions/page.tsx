"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, TrafficCone, OctagonAlert, Signal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestRoadInterventions, type SuggestRoadInterventionsOutput } from '@/ai/flows/suggest-road-interventions';
import { analyzeCriticalZones } from '@/ai/flows/analyze-critical-zones';
import { getAccidents } from '@/services/accidents';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

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
    const [recommendations, setRecommendations] = React.useState<SuggestRoadInterventionsOutput['recommendations'] | null>(null);
    const [error, setError] = React.useState<string | null>(null);


    const handleGenerate = async () => {
        setIsLoading(true);
        setRecommendations(null);
        setError(null);
        
        try {
            const allAccidents = await getAccidents();
            
            if (allAccidents.length === 0) {
                setError("No hay accidentes registrados para analizar. Agregue algunos datos primero.");
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

            const analysisResult = await analyzeCriticalZones({
                historicalAccidentData,
                criteria: 'Identificar las 3 zonas con mayor número de accidentes para priorizar las recomendaciones.',
            });

            if (!analysisResult || analysisResult.criticalZones.length === 0) {
                setError("No se pudieron identificar zonas críticas para analizar. No es posible generar recomendaciones.");
                setIsLoading(false);
                return;
            }

            const interventionsResult = await suggestRoadInterventions({
                accidentData: historicalAccidentData,
                criticalZoneAnalysis: JSON.stringify(analysisResult),
            });
            
            if (interventionsResult && interventionsResult.recommendations.length > 0) {
                setRecommendations(interventionsResult.recommendations);
            } else {
                setError("La IA no generó ninguna recomendación para las zonas analizadas en esta ocasión.");
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
                        Utilice la IA para obtener recomendaciones de intervenciones basadas en datos históricos.
                    </p>
                </div>
                 <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                    Generar Sugerencias con IA
                </Button>
            </div>
            
            <div className="mt-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card p-8 rounded-lg border">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Generando recomendaciones...</h3>
                        <p className="mt-2 max-w-md">
                           La IA está analizando patrones de accidentalidad y las características de las vías para proponer las soluciones más efectivas. Esto puede tardar unos segundos.
                        </p>
                    </div>
                )}
                
                {error && (
                     <Alert variant="destructive">
                        <OctagonAlert className="h-4 w-4" />
                        <AlertTitle>No se pudieron generar sugerencias</AlertTitle>
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
                                    <p className="text-sm text-muted-foreground">{rec.justification}</p>
                                </CardContent>
                            </Card>
                        )})}
                    </div>
                )} 
                
                {!isLoading && !recommendations && !error && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <p>Presione el botón "Generar Sugerencias con IA" para obtener recomendaciones inteligentes basadas en el historial completo de accidentes.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
