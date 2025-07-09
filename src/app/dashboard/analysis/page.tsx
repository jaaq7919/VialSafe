"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalysisPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Análisis de Zonas Críticas</h1>
      <p className="text-muted-foreground mt-1">
        Use IA para agrupar, contar y detectar zonas de alto riesgo a partir de datos históricos.
      </p>

      <Card className="mt-6">
          <CardHeader>
            <CardTitle>Funcionalidad de IA Desactivada</CardTitle>
            <CardDescription>
                Para optimizar costos, las funcionalidades de Inteligencia Artificial han sido desactivadas temporalmente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-10">
                <p>Cuando decida reactivar esta función, el análisis de IA aparecerá aquí.</p>
            </div>
          </CardContent>
        </Card>
    </>
  );
}
