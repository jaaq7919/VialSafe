
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardCharts } from "@/components/client/dashboard-charts";
import { Eye, MapPin, Wrench, Siren, CheckCircle, Loader2, Calendar as CalendarIcon, FilterX } from "lucide-react";
import { getAccidents, type Accident } from "@/services/accidents";
import { getRecommendations, type Recommendation } from "@/services/recommendations";
import { getSettings, type AppSettings } from "@/services/settings";
import { dbscan } from "@/lib/dbscan";
import { format }s from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// Helper function to process data for charts
const processChartData = (accidents: Accident[], causeLabels: { [key: string]: string }) => {
    const accidentsByMonth: { [key: string]: number } = {};
    const accidentsByCause: { [key: string]: number } = {};

    accidents.forEach(accident => {
        const date = new Date(accident.dateTime);
        const monthYearKey = format(date, 'MMM-yy', { locale: es });
        
        accidentsByMonth[monthYearKey] = (accidentsByMonth[monthYearKey] || 0) + 1;
        
        const causeLabel = causeLabels[accident.cause] || 'Otro';
        accidentsByCause[causeLabel] = (accidentsByCause[causeLabel] || 0) + 1;
    });

    const dateMap = new Map<string, Date>();
    Object.keys(accidentsByMonth).forEach(key => {
        const [monthStr, yearStr] = key.split('-');
        const monthIndex = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'].indexOf(monthStr.toLowerCase());
        const year = parseInt(yearStr, 10) + 2000;
        if(monthIndex !== -1) {
            dateMap.set(key, new Date(year, monthIndex));
        }
    });

    const accidentsByMonthData = Object.entries(accidentsByMonth)
        .map(([month, accidents]) => ({ month: month.charAt(0).toUpperCase() + month.slice(1), accidents }))
        .sort((a, b) => {
            const dateA = dateMap.get(a.month.toLowerCase());
            const dateB = dateMap.get(b.month.toLowerCase());
            if (dateA && dateB) {
                return dateA.getTime() - dateB.getTime();
            }
            return 0;
        });

    const accidentsByCauseData = Object.entries(accidentsByCause)
        .map(([name, value]) => ({ name, value }));

    return { accidentsByMonthData, accidentsByCauseData };
};


export default function DashboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Raw data from Firestore
  const [allAccidents, setAllAccidents] = useState<Accident[]>([]);
  const [allRecommendations, setAllRecommendations] = useState<Recommendation[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState("all");
  const [causeFilter, setCauseFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [accidents, recommendations, settingsData] = await Promise.all([
            getAccidents(),
            getRecommendations(),
            getSettings()
        ]);
        setAllAccidents(accidents);
        setAllRecommendations(recommendations);
        setSettings(settingsData);
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Error al Cargar Datos",
            description: "No se pudieron obtener los datos para el panel.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const filteredAccidents = useMemo(() => {
    return allAccidents.filter(accident => {
        if (!accident.dateTime) return false;
        const accidentDate = new Date(accident.dateTime);
        const from = dateFilter?.from;
        const to = dateFilter?.to;

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

        if (typeFilter && typeFilter !== 'all' && accident.type !== typeFilter) return false;
        if (causeFilter && causeFilter !== 'all' && accident.cause !== causeFilter) return false;
        
        return true;
    });
  }, [allAccidents, dateFilter, typeFilter, causeFilter]);
  
  const handleClearFilters = () => {
      setDateFilter(undefined);
      setTypeFilter("all");
      setCauseFilter("all");
  };

  const causeLabels = useMemo(() => Object.fromEntries((settings?.accidentCauses || []).map(c => [c.value, c.label])), [settings]);
  const typeOptions = useMemo(() => settings?.accidentTypes || [], [settings]);
  const causeOptions = useMemo(() => settings?.accidentCauses || [], [settings]);
  
  const { accidentsByMonthData, accidentsByCauseData } = useMemo(() => processChartData(filteredAccidents, causeLabels), [filteredAccidents, causeLabels]);

  const { criticalZonesCount, pendingInterventionsCount, implementedMeasuresCount } = useMemo(() => {
    let zonesCount = 0;
    if (filteredAccidents.length >= 2) {
      const points = filteredAccidents.map(acc => [acc.latitude, acc.longitude] as [number, number]);
      const clusterAssignments = dbscan(points, 0.0005, 2); 
      const uniqueClusters = new Set(clusterAssignments.filter(c => c !== -1));
      zonesCount = uniqueClusters.size;
    }
    
    // Recommendations are not filtered by date/type/cause, they show the global status.
    const pendingCount = allRecommendations.filter(rec => 
      rec.status === 'Sugerida' || rec.status === 'Aprobada' || rec.status === 'En Ejecución'
    ).length;
    const implementedCount = allRecommendations.filter(rec => rec.status === 'Implementada').length;

    return { 
        criticalZonesCount: zonesCount, 
        pendingInterventionsCount: pendingCount, 
        implementedMeasuresCount: implementedCount 
    };
  }, [filteredAccidents, allRecommendations]);

  const stats = [
    { title: "Accidentes en Periodo", value: filteredAccidents.length.toString(), icon: Siren, change: "Según filtros aplicados" },
    { title: "Zonas Críticas en Periodo", value: criticalZonesCount.toString(), icon: MapPin, change: "Basado en análisis DBSCAN" },
    { title: "Intervenciones Pendientes (Total)", value: pendingInterventionsCount.toString(), icon: Wrench, change: "Sugeridas, aprobadas o en ejecución" },
    { title: "Medidas Implementadas (Total)", value: implementedMeasuresCount.toString(), icon: CheckCircle, change: "Recomendaciones completadas" },
  ];

  if (isLoading) {
      return (
          <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
      <p className="text-muted-foreground mt-1">
        Resumen de métricas y tendencias de seguridad vial.
      </p>

      <Card className="mt-6">
          <CardHeader>
              <CardTitle>Filtros del Panel</CardTitle>
              <CardDescription>
                Ajuste los filtros para explorar los datos de accidentes en periodos o categorías específicas. Las estadísticas de intervenciones son globales.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Rango de Fechas</label>
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
                                  <span>Todo el tiempo</span>
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
                </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Tipo de Accidente</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos" />
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
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las causas</SelectItem>
                             {causeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="lg:col-span-2 flex justify-end gap-2">
                    <Button variant="ghost" onClick={handleClearFilters}>
                        <FilterX className="mr-2 h-4 w-4" />
                        Limpiar Filtros
                    </Button>
                 </div>
              </div>
          </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <DashboardCharts accidentsByMonthData={accidentsByMonthData} accidentsByCauseData={accidentsByCauseData} />
    </>
  );
}

    