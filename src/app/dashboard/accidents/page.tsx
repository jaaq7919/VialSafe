"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Loader2, MoreHorizontal, Trash2, FilePenLine } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import React, { useMemo, useEffect, useState, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import { Textarea } from "@/components/ui/textarea";
import { getAccidents, addAccident, updateAccident, deleteAccident, type Accident } from '@/services/accidents'

const formSchema = z.object({
  location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres."),
  date: z.date({ required_error: "La fecha es obligatoria." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora no válido (HH:MM)."),
  accidentType: z.string({ required_error: "Seleccione un tipo de accidente." }),
  cause: z.string({ required_error: "Seleccione una causa probable." }),
  crossingStatus: z.string({ required_error: "Seleccione el estado del cruce." }),
  observations: z.string().optional(),
});


// MOCK DATA - In a real app, this would come from a global state or API call to the settings data
const causeOptions = [
    { value: 'exceso-velocidad', label: 'Exceso de Velocidad' },
    { value: 'distraccion', label: 'Conducción Distraída' },
    { value: 'alcohol', label: 'Conducir Bajo Influencia (CBI)' },
    { value: 'clima', label: 'Condiciones Climáticas' },
    { value: 'imprudencia', label: 'Imprudencia del Conductor' },
    { value: 'falla-mecanica', label: 'Falla Mecánica' },
    { value: 'otro', label: 'Otro' },
];

const typeOptions = [
    { value: 'colision', label: 'Colisión' },
    { value: 'atropello', label: 'Atropello' },
    { value: 'caida-ocupante', label: 'Caída de Ocupante' },
    { value: 'volcamiento', label: 'Volcamiento' },
    { value: 'otro', label: 'Otro' },
];

export const causeLabels: { [key: string]: string } = Object.fromEntries(causeOptions.map(c => [c.value, c.label]));
export const typeLabels: { [key: string]: string } = Object.fromEntries(typeOptions.map(t => [t.value, t.label]));

export const crossingLabels: { [key: string]: string } = {
    'buena': 'Buena',
    'regular': 'Regular',
    'mala': 'Mala',
    'inexistente': 'Inexistente',
};


export default function AccidentsPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [accidents, setAccidents] = useState<Accident[]>([]);
    const [editingAccidentId, setEditingAccidentId] = useState<string | null>(null);

    const [locationFilter, setLocationFilter] = useState("");
    const [causeFilter, setCauseFilter] = useState("");
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
    
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [accidentIdToDelete, setAccidentIdToDelete] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            location: "",
            time: "",
            observations: "",
        },
    });

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

    useEffect(() => {
        fetchAccidents();
    }, [fetchAccidents]);
    
    const filteredAccidents = useMemo(() => {
        return accidents.filter(accident => {
            if (!accident.dateTime) return false;
            const accidentDate = new Date(accident.dateTime.toDate());
            const from = dateFilter?.from;
            const to = dateFilter?.to;

            const dateMatch = !from || (accidentDate >= from && (!to || accidentDate <= to));
            const locationMatch = !locationFilter || accident.location.toLowerCase().includes(locationFilter.toLowerCase());
            const causeMatch = !causeFilter || accident.cause === causeFilter;

            return dateMatch && locationMatch && causeMatch;
        });
    }, [accidents, locationFilter, causeFilter, dateFilter]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            // Combine date and time into a single Date object for Firestore
            const [hours, minutes] = values.time.split(':').map(Number);
            const dateTime = new Date(values.date);
            dateTime.setHours(hours, minutes);

            const accidentData = {
                ...values,
                dateTime
            };
            
            if (editingAccidentId) {
                await updateAccident(editingAccidentId, accidentData);
                toast({
                    title: "Reporte Actualizado",
                    description: "El reporte de accidente se ha actualizado exitosamente.",
                });
                setEditingAccidentId(null);
            } else {
                await addAccident(accidentData);
                toast({
                    title: "Reporte Registrado",
                    description: "El nuevo reporte de accidente se ha guardado.",
                });
            }
            form.reset({ location: "", time: "", date: undefined, accidentType: undefined, cause: undefined, crossingStatus: undefined, observations: "" });
            fetchAccidents(); // Refetch data

        } catch (error) {
            console.error("Error en el registro:", error);
            toast({
                variant: "destructive",
                title: "Error en el Registro",
                description: "No se pudo guardar el reporte.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleEdit = (accident: Accident) => {
        if (!accident.id || !accident.dateTime) return;
        setEditingAccidentId(accident.id);

        const accidentDate = accident.dateTime.toDate();
        form.reset({
            location: accident.location,
            date: accidentDate,
            time: format(accidentDate, 'HH:mm'),
            accidentType: accident.accidentType,
            cause: accident.cause,
            crossingStatus: accident.crossingStatus,
            observations: accident.observations,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteAccident(id);
            toast({
                title: "Reporte Eliminado",
                description: "El reporte de accidente ha sido eliminado.",
            });
            fetchAccidents(); // Refetch data
        } catch (error) {
             console.error("Error deleting accident:", error);
             toast({
                variant: "destructive",
                title: "Error al Eliminar",
                description: "No se pudo eliminar el reporte.",
            });
        }
    };
    
    const handleCancelEdit = () => {
        setEditingAccidentId(null);
        form.reset({ location: "", time: "", date: undefined, accidentType: undefined, cause: undefined, crossingStatus: undefined, observations: "" });
    }

    const handleClearFilters = () => {
        setLocationFilter("");
        setCauseFilter("");
        setDateFilter(undefined);
    }
    
    const openDeleteDialog = (id: string) => {
        setAccidentIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (accidentIdToDelete) {
            handleDelete(accidentIdToDelete);
        }
        setIsDeleteDialogOpen(false);
        setAccidentIdToDelete(null);
    };

    return (
        <>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Accidentes</h1>
            <p className="text-muted-foreground mt-1">
                Registre, consulte y edite los datos de accidentes de tránsito en Florida, Valle.
            </p>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>{editingAccidentId ? 'Editando Reporte de Accidente' : 'Nuevo Reporte de Accidente'}</CardTitle>
                    <CardDescription>Complete los detalles a continuación para registrar o actualizar un accidente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="location" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ubicación</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Carrera 8 con Calle 10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                <FormField control={form.control} name="date" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus locale={es}/>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                <FormField control={form.control} name="time" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hora</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                <FormField control={form.control} name="accidentType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Accidente</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {typeOptions.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                <FormField control={form.control} name="cause" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Causa Probable</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una causa" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {causeOptions.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                <FormField control={form.control} name="crossingStatus" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado del Cruce</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="buena">Buena</SelectItem>
                                                <SelectItem value="regular">Regular</SelectItem>
                                                <SelectItem value="mala">Mala</SelectItem>
                                                <SelectItem value="inexistente">Inexistente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField
                                    control={form.control}
                                    name="observations"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Observaciones</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Añada cualquier detalle relevante del accidente..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingAccidentId ? 'Actualizar Reporte' : 'Enviar Reporte'}
                                </Button>
                                {editingAccidentId && (
                                    <Button variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                                )}
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="mt-8">
                 <CardHeader>
                    <CardTitle>Historial y Reportes de Accidentes</CardTitle>
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
                                {Object.entries(causeLabels).map(([value, label]) => (
                                     <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={handleClearFilters}>Limpiar Filtros</Button>
                    </div>

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
                            ) : filteredAccidents.length > 0 ? (
                                filteredAccidents.map((accident) => (
                                    <TableRow key={accident.id}>
                                        <TableCell className="font-medium">{accident.location}</TableCell>
                                        <TableCell>{accident.dateTime ? format(accident.dateTime.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                                        <TableCell>{typeLabels[accident.accidentType] || 'N/A'}</TableCell>
                                        <TableCell>{causeLabels[accident.cause] || 'N/A'}</TableCell>
                                        <TableCell>{crossingLabels[accident.crossingStatus] || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(accident)}>
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
                        <AlertDialogAction onClick={handleDeleteConfirm}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
