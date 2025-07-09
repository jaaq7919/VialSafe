"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, FileDown, Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { initialAccidents, Accident, causeLabels, typeLabels } from "@/app/dashboard/accidents/page";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

export default function ReportsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [reportData, setReportData] = React.useState<Accident[] | null>(null);
    
    // Filters
    const [dateFilter, setDateFilter] = React.useState<DateRange | undefined>();
    const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
    const [selectedCauses, setSelectedCauses] = React.useState<string[]>([]);
    const [reportCriteria, setReportCriteria] = React.useState<any>(null);


    const handleTypeToggle = (type: string) => {
        setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    }

    const handleCauseToggle = (cause: string) => {
        setSelectedCauses(prev => prev.includes(cause) ? prev.filter(c => c !== cause) : [...prev, cause]);
    }

    const handleGenerateReport = () => {
        setIsLoading(true);
        setReportData(null);
        
        // Simulate generation
        setTimeout(() => {
            const filteredAccidents = initialAccidents.filter(accident => {
                const accidentDate = new Date(accident.date);
                const from = dateFilter?.from;
                const to = dateFilter?.to;

                const dateMatch = !from || (accidentDate >= from && (!to || accidentDate <= to));
                const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(accident.accidentType);
                const causeMatch = selectedCauses.length === 0 || selectedCauses.includes(accident.cause);

                return dateMatch && typeMatch && causeMatch;
            });

            setReportData(filteredAccidents);
            setReportCriteria({
                dates: dateFilter,
                types: selectedTypes.map(t => typeLabels[t]).join(', ') || 'Todos',
                causes: selectedCauses.map(c => causeLabels[c]).join(', ') || 'Todas',
            });
            setIsLoading(false);
        }, 1500);
    }

    const handleDownloadCsv = () => {
        if (!reportData) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Ubicacion,Fecha,Hora,Tipo,Causa,Estado del Cruce,Observaciones\n"; // Header

        reportData.forEach(row => {
            const rowArray = [
                `"${row.location}"`,
                `"${format(row.date, 'yyyy-MM-dd')}"`,
                `"${row.time}"`,
                `"${typeLabels[row.accidentType]}"`,
                `"${causeLabels[row.cause]}"`,
                `"${row.crossingStatus}"`,
                `"${row.observations || ''}"`
            ];
            csvContent += rowArray.join(",") + "\n";
        });
        
        console.log("Generated CSV data:", csvContent);
        
        toast({
            title: "Reporte Generado",
            description: "La descarga del archivo CSV ha comenzado (simulación).",
        });
    }

    const allTypes = Object.keys(typeLabels);
    const allCauses = Object.keys(causeLabels);
    
    return (
        <>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Generador de Reportes</h1>
                <p className="text-muted-foreground mt-1">
                    Cree y exporte reportes personalizados basados en los datos de accidentalidad.
                </p>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Configuración del Reporte</CardTitle>
                    <CardDescription>
                        Seleccione los filtros para generar su reporte. Deje un campo en blanco para incluir todos los registros de esa categoría.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Date Filter */}
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-medium">Rango de Fechas</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFilter?.from ? (
                                            dateFilter.to ? (
                                                <>
                                                    {format(dateFilter.from, "LLL dd, y", { locale: es })} -{" "}
                                                    {format(dateFilter.to, "LLL dd, y", { locale: es })}
                                                </>
                                            ) : (
                                                format(dateFilter.from, "LLL dd, y", { locale: es })
                                            )
                                        ) : (
                                            <span>Cualquier fecha</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar initialFocus mode="range" selected={dateFilter} onSelect={setDateFilter} numberOfMonths={2} locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        
                        {/* Type Filter */}
                         <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-medium">Tipo de Accidente</label>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="justify-between w-full">
                                        <span className="truncate">{selectedTypes.length > 0 ? `${selectedTypes.length} seleccionados` : 'Todos los tipos'}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64">
                                     {allTypes.map(type => (
                                         <DropdownMenuItem key={type} onSelect={(e) => e.preventDefault()} onClick={() => handleTypeToggle(type)} >
                                            <Checkbox checked={selectedTypes.includes(type)} className="mr-2"/>
                                            {typeLabels[type]}
                                        </DropdownMenuItem>
                                     ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        {/* Cause Filter */}
                        <div className="flex flex-col space-y-1.5">
                           <label className="text-sm font-medium">Causa Probable</label>
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="justify-between w-full">
                                        <span className="truncate">{selectedCauses.length > 0 ? `${selectedCauses.length} seleccionadas` : 'Todas las causas'}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64">
                                     {allCauses.map(cause => (
                                         <DropdownMenuItem key={cause} onSelect={(e) => e.preventDefault()} onClick={() => handleCauseToggle(cause)}>
                                            <Checkbox checked={selectedCauses.includes(cause)} className="mr-2"/>
                                            {causeLabels[cause]}
                                        </DropdownMenuItem>
                                     ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                     <Button onClick={handleGenerateReport} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                        Generar Reporte
                    </Button>
                </CardFooter>
            </Card>
            
             {isLoading && (
                 <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 mt-8 border rounded-lg">
                    <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Generando reporte...</h3>
                    <p>Estamos recopilando y filtrando los datos según sus criterios.</p>
                </div>
            )}
            
            {reportData && (
                <Card className="mt-8">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Resultados del Reporte</CardTitle>
                            <CardDescription>
                                Se encontraron {reportData.length} registros que coinciden con sus criterios.
                            </CardDescription>
                        </div>
                         <Button onClick={handleDownloadCsv} variant="outline" disabled={reportData.length === 0}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Descargar CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Fecha y Hora</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Causa</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.length > 0 ? (
                                    reportData.map((accident) => (
                                        <TableRow key={accident.id}>
                                            <TableCell className="font-medium">{accident.location}</TableCell>
                                            <TableCell>{format(accident.date, 'dd/MM/yyyy')} {accident.time}</TableCell>
                                            <TableCell>{typeLabels[accident.accidentType] || 'N/A'}</TableCell>
                                            <TableCell>{causeLabels[accident.cause] || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No se encontraron accidentes para los criterios seleccionados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !reportData && (
                <div className="text-center text-muted-foreground p-8 mt-8 border rounded-lg bg-card">
                    <p>Ajuste los filtros y presione "Generar Reporte" para ver los resultados aquí.</p>
                </div>
            )}
        </>
    );
}
