
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Calendar as CalendarIcon, FileDown, MoreHorizontal, FilePenLine, Trash2, PlusCircle, Eye } from "lucide-react";
import { getAccidents, deleteAccident, type Accident } from "@/services/accidents";
import { getSettings, type SettingItem } from '@/services/settings';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { Label } from "@/components/ui/label";

const LocationPicker = dynamic(() => import('@/components/client/location-picker'), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full rounded-md bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

export const crossingLabels: { [key: string]: string } = {
    'buena': 'Buena',
    'regular': 'Regular',
    'mala': 'Mala',
    'inexistente': 'Inexistente',
};

export default function ReportsHistoryPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [accidents, setAccidents] = useState<Accident[]>([]);
    const [locationFilter, setLocationFilter] = useState("");
    const [causeFilter, setCauseFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [accidentIdToDelete, setAccidentIdToDelete] = useState<string | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null);
    const [causeOptions, setCauseOptions] = useState<SettingItem[]>([]);
    const [typeOptions, setTypeOptions] = useState<SettingItem[]>([]);

    const fetchAccidents = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedAccidents = await getAccidents();
            setAccidents(fetchedAccidents);
        } catch (error) {
            console.error("Error fetching accidents:", error);
            toast({
                variant: "destructive",
                title: "Error al Cargar Datos",
                description: "No se pudieron obtener los reportes de accidentes desde la base de datos.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    const fetchSettings = useCallback(async () => {
        try {
            const settings = await getSettings();
            if (settings) {
                setCauseOptions(settings.accidentCauses || []);
                setTypeOptions(settings.accidentTypes || []);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast({
                variant: "destructive",
                title: "Error al Cargar Configuración",
                description: "No se pudieron cargar las opciones de tipo y causa.",
            });
        }
    }, [toast]);
    
    useEffect(() => {
        fetchAccidents();
        fetchSettings();
    }, [fetchAccidents, fetchSettings]);

    const causeLabels = useMemo(() => Object.fromEntries(causeOptions.map(c => [c.value, c.label])), [causeOptions]);
    const typeLabels = useMemo(() => Object.fromEntries(typeOptions.map(t => [t.value, t.label])), [typeOptions]);

    const handleEdit = (accidentId: string) => {
        router.push(`/dashboard/accidents?edit=${accidentId}`);
    };
    
    const handleDeleteConfirm = async () => {
        if (!accidentIdToDelete) return;
        try {
            await deleteAccident(accidentIdToDelete);
            toast({
                title: "Reporte Eliminado",
                description: "El reporte de accidente ha sido eliminado.",
            });
            fetchAccidents();
        } catch (error) {
             console.error("Error deleting accident:", error);
             toast({
                variant: "destructive",
                title: "Error al Eliminar",
                description: "No se pudo eliminar el reporte.",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setAccidentIdToDelete(null);
        }
    };
    
    const openDeleteDialog = (id: string) => {
        setAccidentIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleViewDetails = (accident: Accident) => {
        setSelectedAccident(accident);
        setIsDetailsDialogOpen(true);
    };

    const handleClearFilters = () => {
        setLocationFilter("");
        setCauseFilter("all");
        setDateFilter(undefined);
    };

    const filteredAccidents = useMemo(() => {
        return accidents.filter(accident => {
            if (!accident.dateTime) return false;
            const accidentDate = new Date(accident.dateTime);
            const from = dateFilter?.from;
            const to = dateFilter?.to;
            const fullLocation = `${accident.addressPrefix} ${accident.address}`;
            if (from) {
                const startOfDay = new Date(from);
                startOfDay.setHours(0, 0, 0, 0);
                if (accidentDate < startOfDay) return false;
            }
            if (to) {
                const endOfDay = new Date(to);
                endOfDay.setHours(23, 59, 59, 999);
                if (accidentDate > endOfDay) return false;
            }
            const locationMatch = !locationFilter || fullLocation.toLowerCase().includes(locationFilter.toLowerCase());
            const causeMatch = !causeFilter || causeFilter === 'all' || accident.cause === causeFilter;
            return locationMatch && causeMatch;
        });
    }, [accidents, locationFilter, causeFilter, dateFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredAccidents.length]);

    const totalPages = useMemo(() => {
      return Math.ceil(filteredAccidents.length / rowsPerPage);
    }, [filteredAccidents.length, rowsPerPage]);
    
    const paginatedAccidents = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredAccidents.slice(startIndex, endIndex);
    }, [filteredAccidents, currentPage, rowsPerPage]);
    
    const handleDownloadCsv = () => {
        const accidentsToExport = filteredAccidents;
        if (accidentsToExport.length === 0) {
            toast({
                variant: "destructive",
                title: "No hay datos",
                description: "No hay datos para exportar con los filtros actuales.",
            });
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = ["Ubicacion", "Fecha", "Hora", "Tipo", "Causa", "Estado del Cruce", "Observaciones", "Latitud", "Longitud"];
        csvContent += headers.join(",") + "\n"; 

        accidentsToExport.forEach(row => {
            const rowArray = [
                `"${row.addressPrefix} ${row.address}"`,
                `"${format(new Date(row.dateTime), 'yyyy-MM-dd')}"`,
                `"${format(new Date(row.dateTime), 'HH:mm')}"`,
                `"${typeLabels[row.type] || row.type}"`,
                `"${causeLabels[row.cause] || row.cause}"`,
                `"${crossingLabels[row.crossingStatus] || row.crossingStatus}"`,
                `"${(row.observations || '').replace(/"/g, '""')}"`,
                `"${row.latitude}"`,
                `"${row.longitude}"`,
            ];
            csvContent += rowArray.join(",") + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_accidentes_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
            title: "Reporte Descargado",
            description: "El archivo CSV ha sido generado exitosamente.",
        });
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reporte e Histórico</h1>
                    <p className="text-muted-foreground mt-1">
                        Consulte, filtre y exporte los datos de accidentalidad.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleDownloadCsv} variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Descargar CSV
                    </Button>
                    <Button onClick={() => router.push('/dashboard/accidents')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Registrar Accidente
                    </Button>
                </div>
            </div>

            <Card className="mt-8">
                 <CardHeader>
                    <CardTitle>Reportes de Accidentes</CardTitle>
                    <CardDescription>Filtre y consulte los accidentes registrados en el sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-center">
                        <Input
                            placeholder="Filtrar por ubicación..."
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="md:col-span-1"
                        />
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "justify-start text-left font-normal",
                                        !dateFilter && "text-muted-foreground"
                                    )}
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
                                        <span>Filtrar por fecha</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateFilter?.from}
                                    selected={dateFilter}
                                    onSelect={setDateFilter}
                                    numberOfMonths={2}
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                         <Select value={causeFilter} onValueChange={setCauseFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por causa" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las causas</SelectItem>
                                {causeOptions.map((option) => (
                                     <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={handleClearFilters}>Limpiar Filtros</Button>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Fecha y Hora</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Causa</TableHead>
                                    <TableHead>Estado del Cruce</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedAccidents.length > 0 ? (
                                    paginatedAccidents.map((accident) => (
                                        <TableRow key={accident.id}>
                                            <TableCell className="font-medium">{accident.addressPrefix} {accident.address}</TableCell>
                                            <TableCell>{accident.dateTime ? format(new Date(accident.dateTime), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                                            <TableCell>{typeLabels[accident.type] || 'N/A'}</TableCell>
                                            <TableCell>{causeLabels[accident.cause] || 'N/A'}</TableCell>
                                            <TableCell>{crossingLabels[accident.crossingStatus] || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleViewDetails(accident)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Ver Detalles
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEdit(accident.id!)}>
                                                            <FilePenLine className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openDeleteDialog(accident.id!)} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No se encontraron resultados para los filtros aplicados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="flex items-center gap-2">
                             <Label htmlFor="rows-per-page" className="text-sm text-muted-foreground whitespace-nowrap">Registros por página</Label>
                             <Select
                                value={`${rowsPerPage}`}
                                onValueChange={(value) => {
                                    setRowsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger id="rows-per-page" className="h-8 w-[70px]">
                                    <SelectValue placeholder={`${rowsPerPage}`} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Página {totalPages > 0 ? currentPage : 0} de {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || totalPages === 0}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

             <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El reporte de accidente será eliminado permanentemente de nuestros servidores.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAccidentIdToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    {selectedAccident && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Detalles del Reporte de Accidente</DialogTitle>

                                <DialogDescription>
                                    Información completa del accidente ocurrido en {selectedAccident.addressPrefix} {selectedAccident.address}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-sm">Ubicación</h4>
                                        <p className="text-muted-foreground">{selectedAccident.addressPrefix} {selectedAccident.address}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Fecha y Hora</h4>
                                        <p className="text-muted-foreground">{format(new Date(selectedAccident.dateTime), 'dd \\'de\\' LLLL \\'de\\' yyyy, HH:mm', { locale: es })}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Tipo de Accidente</h4>
                                        <p className="text-muted-foreground">{typeLabels[selectedAccident.type] || 'No especificado'}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Causa Probable</h4>
                                        <p className="text-muted-foreground">{causeLabels[selectedAccident.cause] || 'No especificada'}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Estado del Cruce</h4>
                                        <p className="text-muted-foreground">{crossingLabels[selectedAccident.crossingStatus] || 'No especificado'}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">Observaciones</h4>
                                        <p className="text-muted-foreground text-pretty">{selectedAccident.observations || 'Sin observaciones.'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                     <div>
                                        <h4 className="font-semibold text-sm">Ubicación Geográfica</h4>
                                        <div className="h-64 mt-2 rounded-md overflow-hidden">
                                        <LocationPicker 
                                            initialCenter={selectedAccident ? [selectedAccident.latitude, selectedAccident.longitude] : undefined}
                                            onLocationSelect={() => {}} 
                                            readOnly={true}
                                        />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cerrar</Button>
                                </DialogClose>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
