"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, TrafficCone, OctagonAlert, Signal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Recommendation = {
    location: string;
    intervention: string;
    justification: string;
    icon: React.ElementType;
};

// Datos simulados (RF07, RF08)
const mockRecommendations: Recommendation[] = [
    {
        location: 'Carrera 7 con Calle 11',
        intervention: 'Instalación de Semáforo',
        justification: 'Debido a la alta recurrencia de colisiones (3 en los últimos 90 días), se recomienda un semáforo para regular el flujo y mejorar la seguridad.',
        icon: Signal,
    },
    {
        location: 'Salida a Palmira, Cerca de la bomba',
        intervention: 'Instalación de Reductores de Velocidad',
        justification: 'La causa principal de accidentes es el exceso de velocidad. Los reductores ayudarán a calmar el tráfico en esta zona de transición.',
        icon: TrafficCone,
    },
    {
        location: 'Frente al parque principal',
        intervention: 'Mejora de Señalización (PARE y Cebra)',
        justification: 'Se registran atropellos y la señalización es inexistente. Es crucial instalar señales de PARE y demarcar un paso peatonal para proteger a los transeúntes.',
        icon: OctagonAlert,
    }
];


export default function InterventionsPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [recommendations, setRecommendations] = React.useState<Recommendation[] | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setRecommendations(null);
        // Simula una llamada a la IA
        await new Promise(resolve => setTimeout(resolve, 2000));
        setRecommendations(mockRecommendations);
        setIsLoading(false);
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sugerencias de Intervención Vial</h1>
                    <p className="text-muted-foreground mt-1">
                        Obtenga recomendaciones de intervenciones viales basadas en el análisis de datos.
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
                           Analizando patrones de accidentalidad y características de las vías para proponer las mejores soluciones.
                        </p>
                    </div>
                )}

                {recommendations ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {recommendations.map((rec, index) => (
                             <Card key={index}>
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                      <rec.icon className="w-6 h-6 text-primary" />
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
                        ))}
                    </div>
                ) : !isLoading && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <p>Presione el botón "Generar Sugerencias" para obtener recomendaciones basadas en los datos de muestra.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
