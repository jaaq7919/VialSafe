"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AnalysisPage() {
    return (
        <>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Análisis de Zonas Críticas</h1>
                <p className="text-muted-foreground mt-1">
                    Herramientas para visualizar y analizar puntos de alta concentración de accidentes.
                </p>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Módulo en Desarrollo</CardTitle>
                    <CardDescription>
                      Esta sección se encuentra actualmente en desarrollo y estará disponible próximamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                    <Construction className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium">Página en construcción</p>
                </CardContent>
            </Card>
        </>
    );
}
