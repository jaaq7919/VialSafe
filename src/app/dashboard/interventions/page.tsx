
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb } from "lucide-react";
import { suggestRoadInterventions } from '@/ai/flows/suggest-road-interventions';
import { useToast } from "@/hooks/use-toast";

export default function InterventionsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [testResult, setTestResult] = React.useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setTestResult(null);
        try {
            const result = await suggestRoadInterventions();
            setTestResult(result.recommendation);
        } catch (e) {
             console.error(e);
             toast({
                variant: "destructive",
                title: "Error de IA",
                description: "No se pudo completar el test. Verifique la consola para más detalles.",
            });
             setTestResult("Error al ejecutar el test.");
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
                        Esta página ejecuta una prueba simple para verificar la conexión con la IA de Google.
                    </p>
                </div>
                 <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                    Ejecutar Test de IA
                </Button>
            </div>
            
            <div className="mt-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card p-8 rounded-lg border">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">Contactando a la IA...</h3>
                    </div>
                )}
                
                {testResult && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Resultado del Test</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-mono p-4 bg-muted rounded-md">{testResult}</p>
                        </CardContent>
                    </Card>
                )} 
                
                {!isLoading && !testResult && (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <p>Presione el botón "Ejecutar Test de IA" para enviar "buenos dias" y ver la respuesta.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
