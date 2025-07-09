"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb, Wind, Beer, FileText, OctagonAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { suggestControlPosts, type SuggestControlPostsOutput } from '@/ai/flows/suggest-control-posts';
import { initialAccidents } from '@/app/dashboard/accidents/page';
import { format } from 'date-fns';

const controlIcons: { [key: string]: React.ElementType } = {
    'velocidad': Wind,
    'alcoholemia': Beer,
    'documentos': FileText,
    'soat': FileText,
    'preventivo': FileText,
    'default': Lightbulb
};

const getIconForControl = (controlType: string): React.ElementType => {
    const lowerType = controlType.toLowerCase();
    for (const key in controlIcons) {
        if (lowerType.includes(key)) {
            return controlIcons[key];
        }
    }
    return controlIcons['default'];
};


export default function ControlsPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [recommendations, setRecommendations] = React.useState<SuggestControlPostsOutput['recommendations'] | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setRecommendations(null);
        setError(null);
        
        try {
            const headers = "ubicacion,fecha,hora,tipo,causa,estado_cruce,observaciones";
            const csvData = initialAccidents.map(acc => {
                return [
                    `"${acc.location}"`,
                    `"${format(new Date(acc.date), 'yyyy-MM-dd')}"`,
                    `"${acc.time}"`,
                    `"${acc.accidentType}"`,
                    `"${acc.cause}"`,
                    `"${acc.crossingStatus}"`,
                    `"${acc.observations || ''}"`
                ].join(',');
            }).join('\\n');
            const historicalAccidentData = `${headers}\\n${csvData}`;

            const result = await suggestControlPosts({
                accidentData: historicalAccidentData,
            });

            if (result && result.recommendations.length > 0) {
                setRecommendations(result.recommendations);
            } else {
                setError("La IA no generó ninguna recomendación en esta ocasión. Puede que los datos actuales no sugieran patrones claros para puestos de control.");
            }

        } catch (e) {
             console.error(e);
             setError("Ocurrió un error inesperado al contactar al servicio de IA. Por favor, intente de nuevo más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recomendación de Puestos de Control</h1>
                    <p className="text-muted-foreground mt-1">
                        Sugerencias estratégicas para la ubicación y horario de puestos de control, generadas por IA.
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
                           La IA está correlacionando horarios, ubicaciones y causas de accidentes para optimizar la ubicación de los puestos de control. Esto puede tardar unos segundos.
                        </p>
                    </div>
                )}
                
                 {error && (
                     <Alert variant="destructive">
                        <OctagonAlert className="h-4 w-4" />
                        <AlertTitle>No se pudieron generar recomendaciones</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {recommendations ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {recommendations.map((rec, index) => {
                            const Icon = getIconForControl(rec.controlType);
                            return (
                                <Card key={index}>
                                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                        <div className="bg-primary/10 p-3 rounded-full">
                                          <Icon className="w-6 h-6 text-primary" />
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
                            )
                        })}
                    </div>
                ) : !isLoading && !error && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <p>Presione el botón "Generar Recomendaciones" para obtener sugerencias de puestos de control basadas en la IA y los datos de accidentes.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
