
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, FilterX, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { getSettings, type SettingItem } from '@/services/settings';
import { useToast } from "@/hooks/use-toast";

export default function HistoryPage() {
    const { toast } = useToast();
    const [causeOptions, setCauseOptions] = useState<SettingItem[]>([]);
    const [typeOptions, setTypeOptions] = useState<SettingItem[]>([]);

    const [causeFilter, setCauseFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchSettingsForFilters = async () => {
            try {
                const settings = await getSettings();
                if (settings) {
                    setCauseOptions(settings.accidentCauses || []);
                    setTypeOptions(settings.accidentTypes || []);
                }
            } catch (error) {
                console.error("Error fetching settings for filters:", error);
                toast({
                    variant: "destructive",
                    title: "Error de Configuración",
                    description: "No se pudieron cargar las opciones de filtro.",
                });
            }
        };
        fetchSettingsForFilters();
    }, [toast]);

    const handleClearFilters = () => {
        setCauseFilter("all");
        setTypeFilter("all");
        setStartDate(undefined);
        setEndDate(undefined);
    };

    const handleSearch = () => {
        // Lógica de búsqueda se implementará aquí
        console.log({
            startDate,
            endDate,
            typeFilter,
            causeFilter,
        });
        toast({
            title: "Búsqueda iniciada",
            description: "Los filtros se han aplicado (ver consola).",
        });
    };

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="flex flex-col gap-2">
                             <label className="text-sm font-medium">Fecha de Inicio</label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="flex flex-col gap-2">
                             <label className="text-sm font-medium">Fecha de Fin</label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "justify-start text-left font-normal",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Tipo de Accidente</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos los tipos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los tipos</SelectItem>
                                    {typeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Causa de Accidente</label>
                            <Select value={causeFilter} onValueChange={setCauseFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas las causas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las causas</SelectItem>
                                    {causeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button onClick={handleSearch} disabled={isLoading} className="w-full">
                                <Search className="mr-2 h-4 w-4" />
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
        </>
    );
}
