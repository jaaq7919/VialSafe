"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { analyzeCriticalZones, AnalyzeCriticalZonesOutput } from "@/ai/flows/analyze-critical-zones";
import { Loader2, Lightbulb, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalysisPage() {
  const [historicalData, setHistoricalData] = useState("");
  const [criteria, setCriteria] = useState("");
  const [result, setResult] = useState<AnalyzeCriticalZonesOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    if (!historicalData.trim()) {
      toast({
        variant: "destructive",
        title: "Datos Requeridos",
        description: "Por favor, ingrese los datos históricos de accidentes para analizar.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await analyzeCriticalZones({
          historicalAccidentData: historicalData,
          criteria: criteria,
        });
        setResult(res);
      } catch (error) {
        console.error("El análisis falló:", error);
        toast({
          variant: "destructive",
          title: "Análisis Fallido",
          description: "Ocurrió un error al analizar los datos. Por favor, inténtelo de nuevo.",
        });
      }
    });
  };

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Análisis de Zonas Críticas</h1>
      <p className="text-muted-foreground mt-1">
        Use IA para identificar zonas de alto riesgo a partir de datos históricos de accidentes.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos de Entrada para Análisis</CardTitle>
            <CardDescription>Proporcione datos y criterios para el análisis.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="historical-data">Datos Históricos de Accidentes (formato CSV preferido)</Label>
                <Textarea
                  id="historical-data"
                  placeholder="Pegue los datos históricos aquí. Ej: fecha,ubicacion,causa,gravedad..."
                  value={historicalData}
                  onChange={(e) => setHistoricalData(e.target.value)}
                  className="h-48"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="criteria">Criterios Opcionales</Label>
                <Input
                  id="criteria"
                  placeholder="Ej: densidad de accidentes > 5 por mes"
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analizar Zonas
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultados del Análisis</CardTitle>
            <CardDescription>Las zonas críticas y recomendaciones identificadas por la IA aparecerán aquí.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending ? (
              <div className="space-y-4">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-8 w-1/3 mt-4" />
                  <Skeleton className="h-20 w-full" />
              </div>
            ) : result ? (
              <div>
                <div className="mb-4">
                  <h3 className="font-semibold text-lg flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
                    Zonas Críticas Identificadas
                  </h3>
                  <p className="text-sm text-muted-foreground bg-secondary p-4 rounded-md">{result.criticalZones}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center mb-2">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    Recomendaciones
                  </h3>
                  <p className="text-sm text-muted-foreground bg-secondary p-4 rounded-md">{result.recommendations}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Los resultados se mostrarán aquí después del análisis.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
