"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function InterventionsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Sugerencias de Intervención Vial</h1>
            <p className="text-muted-foreground mt-1">
                Obtenga recomendaciones de intervenciones viales impulsadas por IA.
            </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Funcionalidad Desactivada</CardTitle>
          <CardDescription>La generación de sugerencias con inteligencia artificial está temporalmente desactivada.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-secondary/50 p-8 rounded-lg">
            <AlertCircle className="w-12 h-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Estamos resolviendo un problema técnico</h3>
            <p className="mt-2 max-w-md">
              Hemos encontrado un problema con los paquetes de IA y hemos desactivado esta función temporalmente para no bloquear el resto del desarrollo. Volverá a estar disponible pronto.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
