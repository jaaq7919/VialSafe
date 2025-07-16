
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, FilterX, Search, Loader2, MoreHorizontal, FilePenLine, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { getSettings, type SettingItem } from '@/services/settings';
import { getAccidents, deleteAccident, type Accident } from "@/services/accidents";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
    const { toast } = useToast();
    const router = useRouter();

    // Data and loading state
    const [allAccidents, setAllAccidents] = useState<Accident[]>([]);
    const [filteredAccidents, setFilteredAccidents] = useState<Accident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    // Filter states
    const [causeFilter, setCauseFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    // Options for filters
    const [causeOptions, setCauseOptions] = useState<SettingItem[]>([]);
    const [typeOptions, setTypeOptions] = useState<SettingItem[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    
    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [accidentToDelete, setAccidentToDelete] = useState<Accident | null>(null);

    // Fetch initial data (settings and all accidents)
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [settings, accidents] = await Promise.all([getSettings(), getAccidents()]);
            if (settings) {
                setCauseOptions(settings.accidentCauses || []);
                setTypeOptions(settings.accidentTypes || []);
            }
            setAllAccidents(accidents);
            setFilteredAccidents(accidents); // Initially show all
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                variant: "destructive",
                title: "Error de Carga",
                description: "No se pudieron cargar los datos iniciales.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClearFilters = () => {
        setCauseFilter("all");
        setTypeFilter("all");
        setStartDate(undefined);
        setEndDate(undefined);
        setFilteredAccidents(allAccidents);
        setCurrentPage(1);
    };

    const handleSearch = () => {
        setIsSearching(true);
        setCurrentPage(1);
        const results = allAccidents.filter(accident => {
            const accidentDate = new Date(accident.dateTime);
            const from = startDate;
            const to = endDate;

            if (from && accidentDate < from) return false;
            if (to) {
                const endOfDay = new Date(to);
                endOfDay.setHours(23, 59, 59, 999);
                if (accidentDate > endOfDay) return false;
            }
            if (typeFilter !== 'all' && accident.type !== typeFilter) return false;
            if (causeFilter !== 'all' && accident.cause !== causeFilter) return false;
            
            return true;
        });
        setFilteredAccidents(results);
        setIsSearching(false);
    };

    const handleDelete = (accident: Accident) => {
        setAccidentToDelete(accident);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!accidentToDelete) return;
        try {
            await deleteAccident(accidentToDelete.id);
            toast({ title: "Accidente Eliminado", description: "El reporte ha sido eliminado exitosamente." });
            fetchData(); // Refresh data
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el reporte." });
        } finally {
            setIsDeleteDialogOpen(false);
            setAccidentToDelete(null);
        }
    };

    const paginatedAccidents = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredAccidents.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredAccidents, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredAccidents.length / rowsPerPage);

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Histórico de Accidentes</h1>
                <p className="text-muted-foreground mt-1">
                    Filtre y consulte los accidentes registrados en el sistema.
                </p>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Filtros de Búsqueda</CardTitle>
                    <CardDescription>
                      Defina los parámetros para consultar el histórico de accidentes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                        <div className="flex flex-col gap-2">
                             <label className="text-sm font-medium">Fecha de Inicio</label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(date) => date > new Date() || (endDate ? date > endDate : false)} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="flex flex-col gap-2">
                             <label className="text-sm font-medium">Fecha de Fin</label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => date > new Date() || (startDate ? date < startDate : false)} initialFocus locale={es} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Tipo de Accidente</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los tipos</SelectItem>
                                    {typeOptions.map((option) => ( <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Causa de Accidente</label>
                            <Select value={causeFilter} onValueChange={setCauseFilter}>
                                <SelectTrigger><SelectValue placeholder="Todas las causas" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las causas</SelectItem>
                                    {causeOptions.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 lg:col-span-3 xl:col-span-1">
                            <Button onClick={handleSearch} disabled={isSearching} className="w-full">
                                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Buscar
                            </Button>
                            <Button variant="ghost" onClick={handleClearFilters} size="icon" className="shrink-0">
                                <FilterX className="h-4 w-4" />
                                <span className="sr-only">Limpiar Filtros</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Resultados</CardTitle>
                    <CardDescription>Se encontraron {filteredAccidents.length} registros que coinciden con su búsqueda.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Responsive Table/Card List */}
                    <div className="hidden md:block border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Fecha y Hora</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Causa</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                                ) : paginatedAccidents.length > 0 ? (
                                    paginatedAccidents.map(accident => (
                                        <TableRow key={accident.id}>
                                            <TableCell className="font-medium">{accident.location}</TableCell>
                                            <TableCell>{format(new Date(accident.dateTime), "dd/MM/yyyy HH:mm")}</TableCell>
                                            <TableCell>{accident.type}</TableCell>
                                            <TableCell>{accident.cause}</TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/accidents?edit=${accident.id}`)}>
                                                            <FilePenLine className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(accident)} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No se encontraron accidentes con los filtros seleccionados.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : paginatedAccidents.length > 0 ? (
                            paginatedAccidents.map(accident => (
                                <Card key={accident.id} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold">{accident.location}</p>
                                            <p className="text-sm text-muted-foreground">{format(new Date(accident.dateTime), "dd/MM/yyyy, HH:mm")}</p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/accidents?edit=${accident.id}`)}>
                                                    <FilePenLine className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(accident)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="mt-2 pt-2 border-t text-sm">
                                        <p><strong>Tipo:</strong> {accident.type}</p>
                                        <p><strong>Causa:</strong> {accident.cause}</p>
                                    </div>
                                </Card>
                            ))
                        ) : (
                             <div className="h-24 text-center text-muted-foreground flex items-center justify-center">No se encontraron accidentes.</div>
                        )}
                    </div>
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex items-center justify-between pt-6">
                        <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
                        </div>
                    </CardFooter>
                )}
            </Card>

             <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente el reporte de accidente en <strong>{accidentToDelete?.location}</strong>. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
