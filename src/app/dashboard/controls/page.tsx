"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, Wind, Beer, FileText } from "lucide-react";

type ControlRecommendation = {
    location: string;
    justification: string;
    controlType: string;
    schedule: string;
    icon: React.ElementType;
};

const mockRecommendations: ControlRecommendation[] = [
    {
        location: 'Carrera 7 con Calle 11',
        justification: 'Zona de alta siniestralidad nocturna y reportes de carreras ilegales. Foco en exceso de velocidad.',
        controlType: 'Control de Velocidad',
        schedule: 'Viernes y Sábados, 10 PM - 2 AM',
        icon: Wind,
    },
    {
        location: 'Salida a Palmira, Cerca de la bomba',
        justification: 'Varios accidentes vinculados al consumo de alcohol, especialmente en fines de semana festivos.',
        controlType: 'Control de Alcoholemia',
        schedule: 'Fines de semana con puente festivo, 8 PM - 1 AM',
        icon: Beer,
    },
    {
        location: 'Calle 8 con Carrera 4 (Cerca a zona comercial)',
        justification: 'Alto flujo de motocicletas y vehículos de carga. Se recomienda control preventivo de documentación.',
        controlType: 'Control de Documentos y SOAT',
        schedule: 'Miércoles y Jueves, 2 PM - 5 PM',
        icon: FileText,
    }
];

export default function ControlsPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [recommendations, setRecommendations] = React.useState<ControlRecommendation[] | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setRecommendations(null);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI call
        setRecommendations(mockRecommendations);
        setIsLoading(false);
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recomendación de Puestos de Control</h1>
                    <p className="text-muted-foreground mt-1">
                        Sugerencias estratégicas para la ubicación y horario de puestos de control.
                    </p>
                </div>
                 <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                    Generar Recomendaciones
                </Button>
            </div>
            
            <div className="mt-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card p-8 rounded-lg border">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Analizando patrones...</h3>
                        <p className="mt-2 max-w-md">
                           La IA está correlacionando horarios, ubicaciones y causas de accidentes para optimizar la ubicación de los puestos de control.
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
                                       <CardTitle>{rec.controlType}</CardTitle>
                                       <CardDescription>{rec.location}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Justificación:</strong> {rec.justification}</p>
                                    <p className="text-sm text-muted-foreground"><strong className="text-foreground">Horario Sugerido:</strong> {rec.schedule}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !isLoading && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <p>Presione el botón "Generar Recomendaciones" para obtener sugerencias de puestos de control basadas en los datos de muestra.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
