
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getAccidents, type Accident } from "@/services/accidents";
import dynamic from 'next/dynamic';

const Heatmap = dynamic(() => import('@/components/client/heatmap'), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full rounded-md bg-muted flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>
});

export default function AnalysisPage() {
    const [heatmapData, setHeatmapData] = useState<[number, number, number][] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAccidentData = async () => {
            try {
                const accidents = await getAccidents();
                // Format data for the heatmap: [latitude, longitude, intensity]
                const data = accidents.map((acc: Accident) => [acc.latitude, acc.longitude, 1]);
                setHeatmapData(data);
            } catch (error) {
                console.error("Error fetching accident data for heatmap:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccidentData();
    }, []);

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Análisis de Zonas Críticas</h1>
                <p className="text-muted-foreground mt-1">
                    Visualice las zonas de alta concentración de accidentes en Florida, Valle del Cauca, a través de un mapa de calor interactivo. Las áreas más rojas indican una mayor densidad de incidentes.
                </p>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Mapa de Calor de Siniestralidad</CardTitle>
                    <CardDescription>
                      Este mapa muestra todos los accidentes registrados en la base de datos. Navegue y haga zoom para explorar las áreas de mayor riesgo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[600px] p-0">
                    {isLoading ? (
                         <div className="h-full w-full rounded-md bg-muted flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>
                    ) : (
                        <Heatmap data={heatmapData} />
                    )}
                </CardContent>
            </Card>
        </>
    );
}
