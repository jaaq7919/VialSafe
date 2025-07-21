
"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileDown, Loader2, CheckCircle, XCircle } from "lucide-react";
import { addAccidentFromCsvRow } from '@/services/accidents';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type ImportStatus = 'pending' | 'success' | 'error';

interface ImportResult {
  rowNumber: number;
  data: string;
  status: ImportStatus;
  message?: string;
}

const csvTemplateHeaders = "addressPrefix,address,date,time,type,cause,crossingStatus,latitude,longitude,weather,specialEvent,observations\n";
const csvTemplateData = "CLL,10 con 8,2024-07-15,14:30,colision,exceso-velocidad,Buena,3.3255,-76.2369,Soleado,Ninguno,El conductor del vehículo A no respetó la señal de pare.\n";

export default function ImportPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "text/csv") {
        toast({
          variant: "destructive",
          title: "Archivo no válido",
          description: "Por favor, seleccione un archivo CSV.",
        });
        return;
      }
      setFile(selectedFile);
      setImportResults([]);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplateHeaders + csvTemplateData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_importacion_accidentes.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = useCallback(async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No hay archivo",
        description: "Por favor, seleccione un archivo CSV para importar.",
      });
      return;
    }

    setIsImporting(true);
    setImportResults([]);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;

      const rows = text.split('\n').filter(row => row.trim() !== '');
      const headers = rows.shift()?.trim().replace(/\r$/, '');
      
      const requiredHeaders = "addressPrefix,address,date,time,type,cause,crossingStatus,latitude,longitude,weather,specialEvent";
      if(headers !== requiredHeaders && headers !== requiredHeaders + ",observations"){
         toast({
          variant: "destructive",
          title: "Formato de CSV incorrecto",
          description: "Las cabeceras del CSV no coinciden con la plantilla. Por favor, descargue y use la plantilla.",
        });
        setIsImporting(false);
        return;
      }

      const results: ImportResult[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if(!row.trim()) continue;

        try {
          await addAccidentFromCsvRow(row);
          results.push({ rowNumber: i + 1, data: row, status: 'success', message: 'Importado correctamente.' });
        } catch (error: any) {
          results.push({ rowNumber: i + 1, data: row, status: 'error', message: error.message || 'Error desconocido.' });
        }
        setImportResults([...results]);
      }
      toast({
        title: "Importación completada",
        description: `${results.filter(r => r.status === 'success').length} de ${rows.length} registros importados.`,
      });
      setIsImporting(false);
    };

    reader.readAsText(file);
  }, [file, toast]);

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importación Masiva de Accidentes</h1>
        <p className="text-muted-foreground mt-1">
          Suba un archivo CSV para registrar múltiples accidentes de forma rápida.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Paso 1: Preparar y Subir Archivo</CardTitle>
          <CardDescription>
            Descargue la plantilla para asegurarse de que su archivo tiene el formato correcto. Luego, seleccione el archivo CSV para la importación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button onClick={handleDownloadTemplate} variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Descargar Plantilla CSV
            </Button>
            <div className="flex-grow">
              <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-1">Subir archivo CSV</label>
              <input 
                id="csv-upload"
                type="file" 
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          </div>
          {file && (
            <Alert>
                <Upload className="h-4 w-4" />
                <AlertTitle>Archivo listo para importar</AlertTitle>
                <AlertDescription>
                    <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB) está seleccionado. Presione "Iniciar Importación" para procesarlo.
                </AlertDescription>
            </Alert>
          )}
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Iniciar Importación
          </Button>
        </CardContent>
      </Card>
      
      {importResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Paso 2: Resultados de la Importación</CardTitle>
            <CardDescription>A continuación se muestra el resultado del proceso de importación fila por fila.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Fila</TableHead>
                    <TableHead className="w-[120px]">Estado</TableHead>
                    <TableHead>Mensaje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((result) => (
                    <TableRow key={result.rowNumber}>
                      <TableCell>{result.rowNumber}</TableCell>
                      <TableCell>
                        <Badge variant={result.status === 'success' ? 'secondary' : 'destructive'}>
                          {result.status === 'success' ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                          {result.status === 'success' ? 'Éxito' : 'Error'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{result.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

    