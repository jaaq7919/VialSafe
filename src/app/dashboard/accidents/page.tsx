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
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Loader2, MoreHorizontal, Trash2, FilePenLine } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import React, { useMemo } from "react";
import type { DateRange } from "react-day-picker";


const formSchema = z.object({
  location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres."),
  date: z.date({ required_error: "La fecha es obligatoria." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora no válido (HH:MM)."),
  accidentType: z.string({ required_error: "Seleccione un tipo de accidente." }),
  cause: z.string({ required_error: "Seleccione una causa probable." }),
  signageStatus: z.string({ required_error: "Seleccione el estado de la señalización." }),
});

export type Accident = z.infer<typeof formSchema> & { id: string };

export const initialAccidents: Accident[] = [
    { id: '1', location: 'Carrera 7 con Calle 11', date: new Date('2024-05-20'), time: '14:30', accidentType: 'colision', cause: 'imprudencia', signageStatus: 'buena' },
    { id: '2', location: 'Salida a Palmira, Cerca de la bomba', date: new Date('2024-05-18'), time: '08:15', accidentType: 'atropello', cause: 'exceso-velocidad', signageStatus: 'regular' },
    { id: '3', location: 'Frente al parque principal', date: new Date('2024-05-15'), time: '19:00', accidentType: 'caida-ocupante', cause: 'distraccion', signageStatus: 'inexistente' },
    { id: '4', location: 'Carrera 7 con Calle 11', date: new Date('2024-04-28'), time: '11:00', accidentType: 'colision', cause: 'exceso-velocidad', signageStatus: 'buena' },
    { id: '5', location: 'Calle 8 con Carrera 4', date: new Date('2024-04-22'), time: '21:45', accidentType: 'volcamiento', cause: 'alcohol', signageStatus: 'mala' },
    { id: '6', location: 'Carrera 7 con Calle 11', date: new Date('2024-03-10'), time: '17:20', accidentType: 'colision', cause: 'distraccion', signageStatus: 'buena' },
];


export default function AccidentsPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [accidents, setAccidents] = React.useState<Accident[]>(initialAccidents);
    const [editingAccidentId, setEditingAccidentId] = React.useState<string | null>(null);

    const [locationFilter, setLocationFilter] = React.useState("");
    const [causeFilter, setCauseFilter] = React.useState("");
    const [dateFilter, setDateFilter] = React.useState<DateRange | undefined>();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            location: "",
            time: "",
        },
    });
    
    const filteredAccidents = useMemo(() => {
        return accidents.filter(accident => {
            const accidentDate = new Date(accident.date);
            const from = dateFilter?.from;
            const to = dateFilter?.to;

            const dateMatch = !from || (accidentDate >= from && (!to || accidentDate <= to));
            const locationMatch = !locationFilter || accident.location.toLowerCase().includes(locationFilter.toLowerCase());
            const causeMatch = !causeFilter || accident.cause === causeFilter;

            return dateMatch && locationMatch && causeMatch;
        });
    }, [accidents, locationFilter, causeFilter, dateFilter]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            if (editingAccidentId) {
                // Update existing accident
                setAccidents(accs => accs.map(acc => acc.id === editingAccidentId ? { ...acc, ...values } : acc));
                toast({
                    title: "Reporte Actualizado",
                    description: "El reporte de accidente se ha actualizado exitosamente.",
                });
                setEditingAccidentId(null);
            } else {
                // Add new accident
                const newAccident: Accident = { ...values, id: new Date().getTime().toString() };
                setAccidents(accs => [newAccident, ...accs]);
                toast({
                    title: "Reporte Registrado",
                    description: "El nuevo reporte de accidente se ha guardado.",
                });
            }
            form.reset({ location: "", time: "", date: undefined, accidentType: undefined, cause: undefined, signageStatus: undefined });

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
        setEditingAccidentId(accident.id);
        form.reset({
            ...accident,
            date: new Date(accident.date),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        setAccidents(accs => accs.filter(acc => acc.id !== id));
        toast({
            title: "Reporte Eliminado",
            description: "El reporte de accidente ha sido eliminado.",
        });
    };
    
    const handleCancelEdit = () => {
        setEditingAccidentId(null);
        form.reset({ location: "", time: "", date: undefined, accidentType: undefined, cause: undefined, signageStatus: undefined });
    }

    const handleClearFilters = () => {
        setLocationFilter("");
        setCauseFilter("");
        setDateFilter(undefined);
    }

    const causeLabels: { [key: string]: string } = {
        'exceso-velocidad': 'Exceso de Velocidad',
        'distraccion': 'Conducción Distraída',
        'alcohol': 'Conducir Bajo Influencia (CBI)',
        'clima': 'Condiciones Climáticas',
        'imprudencia': 'Imprudencia del Conductor',
        'falla-mecanica': 'Falla Mecánica',
        'otro': 'Otro',
    };

    const typeLabels: { [key: string]: string } = {
        'colision': 'Colisión',
        'atropello': 'Atropello',
        'caida-ocupante': 'Caída de Ocupante',
        'volcamiento': 'Volcamiento',
        'otro': 'Otro',
    };
    
    const signageLabels: { [key: string]: string } = {
        'buena': 'Buena',
        'regular': 'Regular',
        'mala': 'Mala',
        'inexistente': 'Inexistente',
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
                                                <SelectItem value="colision">Colisión</SelectItem>
                                                <SelectItem value="atropello">Atropello</SelectItem>
                                                <SelectItem value="caida-ocupante">Caída de Ocupante</SelectItem>
                                                <SelectItem value="volcamiento">Volcamiento</SelectItem>
                                                <SelectItem value="otro">Otro</SelectItem>
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
                                                <SelectItem value="exceso-velocidad">Exceso de Velocidad</SelectItem>
                                                <SelectItem value="distraccion">Conducción Distraída</SelectItem>
                                                <SelectItem value="alcohol">Conducir Bajo Influencia (CBI)</SelectItem>
                                                <SelectItem value="clima">Condiciones Climáticas</SelectItem>
                                                <SelectItem value="imprudencia">Imprudencia del Conductor</SelectItem>
                                                <SelectItem value="falla-mecanica">Falla Mecánica</SelectItem>
                                                <SelectItem value="otro">Otro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                <FormField control={form.control} name="signageStatus" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado de Señalización</FormLabel>
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
                                <TableHead>Señalización</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAccidents.length > 0 ? (
                                filteredAccidents.map((accident) => (
                                    <TableRow key={accident.id}>
                                        <TableCell className="font-medium">{accident.location}</TableCell>
                                        <TableCell>{format(accident.date, 'dd/MM/yyyy')} {accident.time}</TableCell>
                                        <TableCell>{typeLabels[accident.accidentType] || 'N/A'}</TableCell>
                                        <TableCell>{causeLabels[accident.cause] || 'N/A'}</TableCell>
                                        <TableCell>{signageLabels[accident.signageStatus] || 'N/A'}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => handleDelete(accident.id)} className="text-destructive">
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
        </>
    );
}
