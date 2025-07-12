
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, TrafficCone, OctagonAlert, Signal, Wifi } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAccidents } from '@/services/accidents';
import { useToast } from "@/hooks/use-toast";
import { suggestRoadInterventions } from '@/ai/flows/suggest-road-interventions';

type Recommendation = {
    location: string;
    intervention: string;
    justification: string;
};

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
    'respuesta de la ia': Wifi,
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
            // Llamamos a la función de prueba. No necesitamos datos de accidentes para esto.
            const interventionsResult = await suggestRoadInterventions({});
            
            if (interventionsResult && interventionsResult.recommendations.length > 0) {
                setRecommendations(interventionsResult.recommendations);
            } else {
                setError("La IA no generó una respuesta válida para la prueba de conexión.");
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
                    <h1 className="text-3xl font-bold tracking-tight">TEST IA FUNCIONANDO</h1>
                    <p className="text-muted-foreground mt-1">
                        Verifique la conexión con el modelo de IA de Google.
                    </p>
                </div>
                 <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
                    Realizar Prueba
                </Button>
            </div>
            
            <div className="mt-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card p-8 rounded-lg border">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Contactando a la IA...</h3>
                        <p className="mt-2 max-w-md">
                           Enviando un saludo al modelo de IA. Esto puede tardar unos segundos.
                        </p>
                    </div>
                )}
                
                {error && (
                     <Alert variant="destructive">
                        <OctagonAlert className="h-4 w-4" />
                        <AlertTitle>No se pudo completar la prueba</AlertTitle>
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
                            <p>Presione el botón "Realizar Prueba" para enviar un saludo a la IA y verificar la conexión.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
