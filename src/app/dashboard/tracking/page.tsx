
"use client";

import React, { useState } from "react";
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
import { cn } from "@/lib/utils";

type RecommendationStatus = "Sugerida" | "Aprobada" | "En Ejecución" | "Implementada" | "Rechazada";

type Recommendation = {
  id: string;
  type: "Intervención Vial" | "Puesto de Control";
  description: string;
  location: string;
  status: RecommendationStatus;
  dateSuggested: Date;
};

const initialRecommendations: Recommendation[] = [
  {
    id: "rec1",
    type: "Intervención Vial",
    description: "Instalación de Semáforo",
    location: "Carrera 7 con Calle 11",
    status: "Sugerida",
    dateSuggested: new Date("2024-07-01"),
  },
  {
    id: "rec2",
    type: "Puesto de Control",
    description: "Control de Velocidad",
    location: "Salida a Palmira",
    status: "Aprobada",
    dateSuggested: new Date("2024-06-25"),
  },
  {
    id: "rec3",
    type: "Intervención Vial",
    description: "Implementar Reductores de Velocidad",
    location: "Frente al parque principal",
    status: "En Ejecución",
    dateSuggested: new Date("2024-06-15"),
  },
  {
    id: "rec4",
    type: "Intervención Vial",
    description: "Mejorar Señal de PARE",
    location: "Calle 8 con Carrera 4",
    status: "Implementada",
    dateSuggested: new Date("2024-05-20"),
  },
  {
    id: "rec5",
    type: "Puesto de Control",
    description: "Control de Alcoholemia",
    location: "Carrera 7 con Calle 11",
    status: "Rechazada",
    dateSuggested: new Date("2024-07-02"),
  },
];

const statusVariant: { [key in RecommendationStatus]: "default" | "secondary" | "outline" | "destructive" } = {
  "Sugerida": "outline",
  "Aprobada": "secondary",
  "En Ejecución": "default",
  "Implementada": "default", // Would be nice with a success variant
  "Rechazada": "destructive",
};

const statusColor: { [key in RecommendationStatus]: string } = {
  "Sugerida": "",
  "Aprobada": "text-blue-600",
  "En Ejecución": "text-yellow-600",
  "Implementada": "text-green-600",
  "Rechazada": "",
}


export default function TrackingPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);

  const handleStatusChange = (id: string, newStatus: RecommendationStatus) => {
    setRecommendations(prev =>
      prev.map(rec => (rec.id === id ? { ...rec, status: newStatus } : rec))
    );
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
          <CardDescription>Una lista de todas las sugerencias de intervención y puestos de control.</CardDescription>
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
              {recommendations.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>
                    <p className="font-medium">{rec.description}</p>
                    <p className="text-sm text-muted-foreground">{rec.location}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rec.type === 'Intervención Vial' ? 'secondary' : 'outline'}>{rec.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {rec.dateSuggested.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

