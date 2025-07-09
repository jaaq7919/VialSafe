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
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { addAccident } from "@/services/accidents";

const formSchema = z.object({
  location: z.string().min(2, {
    message: "La ubicación debe tener al menos 2 caracteres.",
  }),
  date: z.date({
    required_error: "La fecha del accidente es obligatoria.",
  }),
  cause: z.string({
    required_error: "Por favor, seleccione una causa para el accidente.",
  }),
});

export default function AccidentsPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
      cause: undefined,
      date: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        const result = await addAccident(values);
        if (result.success) {
            toast({
                title: "Accidente Registrado",
                description: "El nuevo registro de accidente ha sido guardado exitosamente en Firestore.",
            });
            form.reset();
        } else {
            throw new Error(result.error || "Un error desconocido ocurrió al guardar.");
        }
    } catch (error) {
        console.error("Error al registrar el accidente:", error);
        toast({
            variant: "destructive",
            title: "Error al Registrar",
            description: "No se pudo guardar el reporte. Verifique la configuración de Firebase y su conexión a internet.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Registro de Accidentes</h1>
      <p className="text-muted-foreground mt-1">
        Ingrese manualmente los datos de accidentes, incluyendo ubicación, fecha y causa.
      </p>

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
            <CardTitle>Nuevo Reporte de Accidente</CardTitle>
            <CardDescription>Complete los detalles a continuación para registrar un nuevo accidente de tráfico.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Carrera 8 con Calle 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha y Hora</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Elige una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cause"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Causa Principal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una causa principal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="exceso-velocidad">Exceso de Velocidad</SelectItem>
                        <SelectItem value="distraccion">
                          Conducción Distraída
                        </SelectItem>
                        <SelectItem value="alcohol">Conducir Bajo Influencia (CBI)</SelectItem>
                        <SelectItem value="clima">Condiciones Climáticas</SelectItem>
                        <SelectItem value="imprudencia">Imprudencia del Conductor</SelectItem>
                        <SelectItem value="falla-mecanica">Falla Mecánica</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Reporte
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
