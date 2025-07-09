"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { analyzeCriticalZones, AnalyzeCriticalZonesOutput } from "@/ai/flows/analyze-critical-zones";
import { Loader2, AlertTriangle, FileText, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initialAccidents } from "@/app/dashboard/accidents/page";
import { format } from "date-fns";


export default function AnalysisPage() {
  const [historicalData, setHistoricalData] = useState("");
  const [criteria, setCriteria] = useState("Más de 2 accidentes en 90 días");
  const [result, setResult] = useState<AnalyzeCriticalZonesOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleLoadSampleData = () => {
    // Convert array of objects to CSV string
    const headers = "ubicacion,fecha,hora,tipo,causa,señalizacion\n";
    const csvData = initialAccidents.map(acc => 
        `${acc.location},${format(new Date(acc.date), 'yyyy-MM-dd')},${acc.time},${acc.accidentType},${acc.cause},${acc.signageStatus}`
    ).join('\n');
    setHistoricalData(headers + csvData);
    toast({
        title: "Datos de Muestra Cargados",
        description: "Se han cargado los accidentes de ejemplo en el área de texto.",
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    if (!historicalData.trim()) {
      toast({
        variant: "destructive",
        title: "Datos Requeridos",
        description: "Por favor, ingrese o cargue los datos históricos para analizar.",
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
        Use IA para agrupar, contar y detectar zonas de alto riesgo a partir de datos históricos.
      </p>

      <Card className="mt-6">
          <CardHeader>
            <CardTitle>1. Datos para el Análisis</CardTitle>
            <CardDescription>
                Proporcione los datos históricos de accidentes. Puede pegarlos directamente
                o cargar los datos de muestra del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="historical-data">Datos Históricos de Accidentes (formato CSV)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleLoadSampleData} disabled={isPending}>
                        <Download className="mr-2 h-4 w-4"/>
                        Cargar datos de muestra
                    </Button>
                </div>
                <Textarea
                  id="historical-data"
                  placeholder="Pegue aquí los datos en formato CSV. Ej: ubicacion,fecha,causa..."
                  value={historicalData}
                  onChange={(e) => setHistoricalData(e.target.value)}
                  className="h-48 font-mono text-xs"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="criteria">2. Criterios para Zona Crítica</Label>
                <Input
                  id="criteria"
                  placeholder="Ej: más de 5 accidentes en 30 días"
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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>3. Resultados del Análisis</CardTitle>
            <CardDescription>Las zonas críticas identificadas por la IA aparecerán aquí.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending ? (
              <div className="space-y-2">
                <Table>
                    <TableHeader>
                        <TableRow>
                           <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                           <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                           <TableHead><Skeleton className="h-5 w-28" /></TableHead>
                           <TableHead><Skeleton className="h-5 w-48" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(3)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Skeleton className="h-8 w-1/3 mt-4" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : result ? (
              <>
                 {result.criticalZones && result.criticalZones.length > 0 ? (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Ubicación (Zona Crítica)</TableHead>
                            <TableHead># Accidentes</TableHead>
                            <TableHead>Periodo</TableHead>
                            <TableHead>Razón</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {result.criticalZones.map((zone, index) => (
                            <TableRow key={index} className="bg-destructive/10">
                                <TableCell className="font-medium flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-2 text-destructive" />
                                    {zone.location}
                                </TableCell>
                                <TableCell className="font-bold text-center">{zone.accidentCount}</TableCell>
                                <TableCell>{zone.analysisPeriod}</TableCell>
                                <TableCell>{zone.reason}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                 ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No se encontraron zonas críticas con los criterios especificados.</p>
                    </div>
                 )}

                <div className="mt-6">
                  <h3 className="font-semibold text-lg flex items-center mb-2">
                    <FileText className="w-5 h-5 mr-2" />
                    Resumen del Analista
                  </h3>
                  <p className="text-sm text-muted-foreground bg-secondary p-4 rounded-md">{result.summary}</p>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Los resultados se mostrarán aquí después del análisis.</p>
              </div>
            )}
          </CardContent>
        </Card>
    </>
  );
}
