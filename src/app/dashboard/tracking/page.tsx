
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
import { Loader2 } from "lucide-react";

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
    // Optimistically update UI
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
        // Revert UI on failure
        fetchRecs(); 
    }
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
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Todas las Recomendaciones</CardTitle>
          <CardDescription>Una lista de todas las sugerencias de intervención y puestos de control guardadas en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </>
  );
}
