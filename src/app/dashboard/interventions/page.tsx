"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InterventionsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Sugerencias de Intervención Vial</h1>
      <p className="text-muted-foreground mt-1">
        Obtenga recomendaciones de intervenciones viales impulsadas por IA.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Funcionalidad de IA Desactivada</CardTitle>
          <CardDescription>Para optimizar costos, las funcionalidades de Inteligencia Artificial han sido desactivadas temporalmente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">
              <p>Cuando decida reactivar esta función, las sugerencias de la IA aparecerán aquí.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
