
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Loader2, Hospital, Phone, Shield, Flame } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { getAccident, addAccident, updateAccident, type Accident } from '@/services/accidents';
import { getSettings, type SettingItem } from '@/services/settings';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';

const LocationPicker = dynamic(() => import('@/components/client/location-picker'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full rounded-md bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

const addressPrefixes = [
    { value: 'CLL', label: 'CLL - Calle' },
    { value: 'CRA', label: 'CRA / CR - Carrera' },
    { value: 'AV', label: 'AV / AVE - Avenida' },
    { value: 'DG', label: 'DG - Diagonal' },
    { value: 'TR', label: 'TR / TRV - Transversal' },
    { value: 'CT', label: 'CT / CCT - Circunvalar' },
    { value: 'AUT', label: 'AUT - Autopista' },
    { value: 'KM', label: 'KM - Kilómetro' },
    { value: 'TV', label: 'TV - Transversal' },
    { value: 'AC', label: 'AC - Avenida Calle' },
    { value: 'AK', label: 'AK - Avenida Carrera' },
    { value: 'BLV', label: 'BLV / BV - Bulevar' },
    { value: 'PJE', label: 'PJE - Pasaje' },
    { value: 'PSJ', label: 'PSJ - Paseo' },
    { value: 'PLZ', label: 'PLZ / PLAZ - Plaza' },
    { value: 'CL', label: 'CL - Calle (corta)' },
    { value: 'CA', label: 'CA / CAM - Camino' },
    { value: 'CARR', label: 'CARR - Carrera (larga)' },
    { value: 'MZ', label: 'MZ - Manzana' },
    { value: 'LT', label: 'LT / LOTE - Lote' },
    { value: 'URB', label: 'URB - Urbanización' },
    { value: 'INT', label: 'INT - Interior' },
    { value: 'ET', label: 'ET / ETAPA - Etapa' },
    { value: 'TO', label: 'TO / TORRE - Torre' },
    { value: 'APT', label: 'APT / APTO - Apartamento' },
    { value: 'ED', label: 'ED / EDIF - Edificio' },
    { value: 'ZN', label: 'ZN - Zona' },
];

const emergencyContacts = [
    { name: 'Hospital Benjamín Barney Gasca', phone: '(602) 264-4632', tel: '+576022644632', icon: Hospital },
    { name: 'Cuerpo de Bomberos', phone: '119 o (602) 264-4119', tel: '119', icon: Flame },
    { name: 'Policía Nacional', phone: '123', tel: '123', icon: Shield },
];

export const formSchema = z.object({
  addressPrefix: z.string({ required_error: "Seleccione un prefijo." }),
  address: z.string().min(3, "La dirección debe tener al menos 3 caracteres."),
  date: z.date({ required_error: "La fecha es obligatoria." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora no válido (HH:MM)."),
  type: z.string({ required_error: "Seleccione un tipo de accidente." }),
  cause: z.string({ required_error: "Seleccione una causa probable." }),
  crossingStatus: z.string({ required_error: "Seleccione el estado del cruce." }),
  observations: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).refine(data => data.latitude !== undefined && data.longitude !== undefined, {
    message: "Debe seleccionar una ubicación en el mapa.",
    path: ["address"],
});

export default function AccidentsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAccidentId, setEditingAccidentId] = useState<string | null>(null);

    const [causeOptions, setCauseOptions] = useState<SettingItem[]>([]);
    const [typeOptions, setTypeOptions] = useState<SettingItem[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            address: "",
            time: "",
            observations: "",
        },
    });

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

    const fetchAccidentToEdit = useCallback(async (id: string) => {
        try {
            const accident = await getAccident(id);
            if (!accident) {
                toast({ variant: "destructive", title: "Error", description: "No se encontró el accidente a editar." });
                router.push('/dashboard/history');
                return;
            }
            const accidentDate = new Date(accident.dateTime);
            form.reset({
                addressPrefix: accident.addressPrefix,
                address: accident.address,
                date: accidentDate,
                time: format(accidentDate, 'HH:mm'),
                type: accident.type,
                cause: accident.cause,
                crossingStatus: accident.crossingStatus,
                observations: accident.observations,
                latitude: accident.latitude,
                longitude: accident.longitude,
            });
            setEditingAccidentId(id);
        } catch (error) {
            console.error("Error fetching accident to edit:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el accidente." });
        }
    }, [form, toast, router]);


    useEffect(() => {
        fetchSettings();
        const editId = searchParams.get('edit');
        if (editId) {
            fetchAccidentToEdit(editId);
        }
    }, [fetchSettings, searchParams, fetchAccidentToEdit]);


    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            if (values.latitude === undefined || values.longitude === undefined) {
                form.setError("address", { type: "manual", message: "Por favor, seleccione un punto en el mapa." });
                setIsSubmitting(false);
                return;
            }

            if (editingAccidentId) {
                await updateAccident(editingAccidentId, values);
                toast({
                    title: "Reporte Actualizado",
                    description: "El reporte de accidente se ha actualizado exitosamente.",
                });
            } else {
                await addAccident(values);
                toast({
                    title: "Reporte Registrado",
                    description: "El nuevo reporte de accidente se ha guardado.",
                });
            }
            router.push('/dashboard/history');

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

    const handleCancel = () => {
        setEditingAccidentId(null);
        form.reset({ addressPrefix: undefined, address: "", time: "", date: undefined, type: undefined, cause: undefined, crossingStatus: undefined, observations: "", latitude: undefined, longitude: undefined });
        router.push('/dashboard/history');
    }

    const handleLocationSelect = useCallback((location: { prefix: string, street: string, lat: number, lng: number }) => {
        const matchingPrefix = addressPrefixes.find(p => p.value.toUpperCase() === location.prefix.toUpperCase());
        form.setValue('addressPrefix', matchingPrefix ? matchingPrefix.value : 'CLL', { shouldValidate: true });
        form.setValue('address', location.street, { shouldValidate: true });
        form.setValue('latitude', location.lat, { shouldValidate: true });
        form.setValue('longitude', location.lng, { shouldValidate: true });
        form.clearErrors("address");
    }, [form]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Accidentes</h1>
                <p className="text-muted-foreground mt-1">
                    {editingAccidentId ? 'Edite los datos del accidente.' : 'Registre un nuevo accidente de tránsito en Florida, Valle.'}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{editingAccidentId ? 'Editando Reporte de Accidente' : 'Nuevo Reporte de Accidente'}</CardTitle>
                        <CardDescription>Complete los detalles del formulario o haga clic en el mapa para autocompletar la ubicación.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 grid grid-cols-3 gap-4">
                                        <FormField control={form.control} name="addressPrefix" render={({ field }) => (
                                            <FormItem className="col-span-1">
                                                <FormLabel>Prefijo</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {addressPrefixes.map(option => (
                                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <FormField control={form.control} name="address" render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Dirección</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: 8 con Calle 10" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                </div>

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

                                    <FormField control={form.control} name="type" render={({ field }) => (
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
                                        <FormItem className="md:col-span-2">
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
                                    <Button variant="outline" type="button" onClick={handleCancel}>Cancelar</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ubicar en el Mapa</CardTitle>
                            <CardDescription>Haga clic en el mapa para obtener la ubicación precisa.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="h-[400px] w-full rounded-md overflow-hidden border">
                              <LocationPicker onLocationSelect={handleLocationSelect} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Contactos de Emergencia</CardTitle>
                            <CardDescription>Acceso rápido a números importantes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {emergencyContacts.map((contact) => (
                                <div key={contact.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <contact.icon className="h-6 w-6 text-primary" />
                                        <div>
                                            <p className="font-semibold">{contact.name}</p>
                                            <p className="text-sm text-muted-foreground">{contact.phone}</p>
                                        </div>
                                    </div>
                                    <Button asChild size="sm">
                                        <a href={`tel:${contact.tel}`}>
                                            <Phone className="mr-2 h-4 w-4" />
                                            Llamar
                                        </a>
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
