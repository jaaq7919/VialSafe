"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { suggestRoadInterventions, SuggestRoadInterventionsOutput } from "@/ai/flows/suggest-road-interventions";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function InterventionsPage() {
  const [accidentData, setAccidentData] = useState("");
  const [analysisData, setAnalysisData] = useState("");
  const [result, setResult] = useState<SuggestRoadInterventionsOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    if (!accidentData.trim() || !analysisData.trim()) {
      toast({
        variant: "destructive",
        title: "Datos Requeridos",
        description: "Por favor, proporcione tanto los datos de accidentes como los de análisis.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await suggestRoadInterventions({
          accidentData: accidentData,
          criticalZoneAnalysis: analysisData,
        });
        setResult(res);
      } catch (error) {
        console.error("La sugerencia falló:", error);
        toast({
          variant: "destructive",
          title: "Sugerencia Fallida",
          description: "Ocurrió un error al generar sugerencias. Por favor, inténtelo de nuevo.",
        });
      }
    });
  };

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Sugerencias de Intervención Vial</h1>
      <p className="text-muted-foreground mt-1">
        Obtenga recomendaciones de intervenciones viales impulsadas por IA.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos de Entrada para Sugerencias</CardTitle>
            <CardDescription>Proporcione datos para generar sugerencias de intervención.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accident-data">Datos Históricos de Accidentes</Label>
                <Textarea
                  id="accident-data"
                  placeholder="Pegue los datos históricos aquí..."
                  value={accidentData}
                  onChange={(e) => setAccidentData(e.target.value)}
                  className="h-32"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analysis-data">Análisis de Zonas Críticas</Label>
                <Textarea
                  id="analysis-data"
                  placeholder="Pegue los resultados del análisis de zonas críticas aquí..."
                  value={analysisData}
                  onChange={(e) => setAnalysisData(e.target.value)}
                  className="h-32"
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Obtener Sugerencias
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Intervenciones Recomendadas</CardTitle>
            <CardDescription>Las sugerencias generadas por IA se listarán a continuación.</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : result && result.recommendations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intervención</TableHead>
                    <TableHead>Justificación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.recommendations.map((rec, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{rec.intervention}</TableCell>
                      <TableCell>{rec.justification}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Las sugerencias se mostrarán aquí después de enviar los datos.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
