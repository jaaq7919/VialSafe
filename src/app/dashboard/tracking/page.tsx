
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRecommendations, updateRecommendationStatus, type Recommendation, type RecommendationStatus } from "@/services/recommendations";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrackingPage() {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecs = useCallback(async () => {
    setIsLoading(true);
    try {
        const data = await getRecommendations();
        setRecommendations(data);
    } catch (error) {
        console.error("Failed to fetch recommendations", error);
        toast({
            variant: "destructive",
            title: "Error al cargar",
            description: "No se pudieron cargar las recomendaciones desde la base de datos."
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);


  const handleStatusChange = async (id: string, newStatus: RecommendationStatus) => {
    setRecommendations(prev =>
      prev.map(rec => (rec.id === id ? { ...rec, status: newStatus } : rec))
    );

    try {
        await updateRecommendationStatus(id, newStatus);
        toast({
            title: "Estado Actualizado",
            description: `La recomendación ha sido actualizada a "${newStatus}".`
        });
    } catch (error) {
        console.error("Failed to update status", error);
        toast({
            variant: "destructive",
            title: "Error al Actualizar",
            description: "No se pudo guardar el nuevo estado. Revirtiendo cambio."
        });
        fetchRecs(); 
    }
  };

  const handleExportTracking = () => {
    if (recommendations.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay datos para exportar",
      });
      return;
    }

    const headers = ["Tipo", "Descripcion", "Ubicacion", "Justificacion", "Estado", "Fecha Sugerida"];
    const rows = recommendations.map(rec => [
      `"${rec.type}"`,
      `"${rec.description.replace(/"/g, '""')}"`,
      `"${rec.location.replace(/"/g, '""')}"`,
      `"${rec.justification.replace(/"/g, '""')}"`,
      `"${rec.status}"`,
      `"${format(new Date(rec.createdAt), 'yyyy-MM-dd')}"`
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `seguimiento_medidas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seguimiento de Medidas</h1>
          <p className="text-muted-foreground mt-1">
            Gestione el ciclo de vida y el estado de las recomendaciones generadas.
          </p>
        </div>
        <Button variant="outline" onClick={handleExportTracking} disabled={recommendations.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Descargar CSV
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Todas las Recomendaciones</CardTitle>
          <CardDescription>Una lista de todas las sugerencias de intervención y puestos de control guardadas en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción de la Medida</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha Sugerida</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                ) : recommendations.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No hay recomendaciones guardadas. Genere algunas desde las páginas de "Sugerencias" o "Puestos de Control".
                      </TableCell>
                    </TableRow>
                ) : (
                  recommendations.map((rec) => (
                      <TableRow key={rec.id}>
                      <TableCell>
                          <p className="font-medium">{rec.description}</p>
                          <p className="text-sm text-muted-foreground">{rec.location}</p>
                      </TableCell>
                      <TableCell>
                          <Badge variant={rec.type === 'Intervención Vial' ? 'secondary' : 'outline'}>{rec.type}</Badge>
                      </TableCell>
                      <TableCell>
                          {format(new Date(rec.createdAt), 'dd \'de\' LLLL, yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                          <Select value={rec.status} onValueChange={(value: RecommendationStatus) => handleStatusChange(rec.id, value)}>
                          <SelectTrigger className="w-40 ml-auto">
                              <SelectValue placeholder="Cambiar estado" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Sugerida">Sugerida</SelectItem>
                              <SelectItem value="Aprobada">Aprobada</SelectItem>
                              <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                              <SelectItem value="Implementada">Implementada</SelectItem>
                              <SelectItem value="Rechazada">Rechazada</SelectItem>
                          </SelectContent>
                          </Select>
                      </TableCell>
                      </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
           <div className="md:hidden space-y-4">
              {isLoading ? (
                  <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : recommendations.length > 0 ? (
                  recommendations.map(rec => (
                      <Card key={rec.id} className="p-4">
                          <div className="space-y-2">
                              <div>
                                  <p className="font-bold">{rec.description}</p>
                                  <p className="text-sm text-muted-foreground">{rec.location}</p>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                  <Badge variant={rec.type === 'Intervención Vial' ? 'secondary' : 'outline'}>{rec.type}</Badge>
                                  <p className="text-muted-foreground">{format(new Date(rec.createdAt), 'dd/MM/yyyy', { locale: es })}</p>
                              </div>
                              <div className="pt-2">
                                   <Select value={rec.status} onValueChange={(value: RecommendationStatus) => handleStatusChange(rec.id, value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Cambiar estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sugerida">Sugerida</SelectItem>
                                            <SelectItem value="Aprobada">Aprobada</SelectItem>
                                            <SelectItem value="En Ejecución">En Ejecución</SelectItem>
                                            <SelectItem value="Implementada">Implementada</SelectItem>
                                            <SelectItem value="Rechazada">Rechazada</SelectItem>
                                        </SelectContent>
                                    </Select>
                              </div>
                          </div>
                      </Card>
                  ))
              ) : (
                  <div className="h-24 text-center text-muted-foreground flex items-center justify-center">
                      No hay recomendaciones guardadas.
                  </div>
              )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
