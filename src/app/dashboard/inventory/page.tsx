
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Trash2, FilePenLine, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/services/inventory";
import { type InventoryItem, itemTypes, itemStatuses, statusColors, inventoryItemSchema } from "@/types/inventory";
import dynamic from "next/dynamic";
import { Textarea } from "@/components/ui/textarea";

const LocationPicker = dynamic(() => import('@/components/client/location-picker'), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full rounded-md bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

const formSchema = inventoryItemSchema.refine(data => data.latitude !== undefined && data.longitude !== undefined, {
    message: "Debe seleccionar una ubicación en el mapa.",
    path: ["subtype"], // Attach error to a visible field
});

export default function InventoryPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | undefined>();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subtype: "",
      locationDescription: "",
      notes: "",
    },
  });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedItems = await getInventoryItems();
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      toast({
        variant: "destructive",
        title: "Error al cargar inventario",
        description: "No se pudieron obtener los datos de inventario.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddNew = () => {
    setEditingItem(null);
    form.reset({ type: undefined, subtype: "", status: undefined, latitude: undefined, longitude: undefined, locationDescription: "", notes: "" });
    form.clearErrors();
    setCurrentLocation(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset({
        type: item.type,
        subtype: item.subtype,
        status: item.status,
        latitude: item.latitude,
        longitude: item.longitude,
        locationDescription: item.locationDescription,
        notes: item.notes
    });
    form.clearErrors();
    setCurrentLocation([item.latitude, item.longitude]);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteInventoryItem(itemToDelete.id);
        toast({
          title: "Elemento Eliminado",
          description: `El elemento '${itemToDelete.subtype}' ha sido eliminado del inventario.`,
        });
        fetchItems();
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Error al eliminar",
            description: "No se pudo eliminar el elemento del inventario."
        });
      }
    }
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateInventoryItem(editingItem.id, values);
        toast({
          title: "Elemento Actualizado",
          description: `Los datos de '${values.subtype}' han sido actualizados.`,
        });
      } else {
        await addInventoryItem(values);
        toast({
          title: "Elemento Añadido",
          description: `El elemento '${values.subtype}' ha sido añadido al inventario.`,
        });
      }
      fetchItems();
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error al guardar",
            description: error.message || "No se pudo guardar el elemento.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleLocationSelect = useCallback((location: { lat: number, lng: number, street: string }) => {
    form.setValue('latitude', location.lat, { shouldValidate: true });
    form.setValue('longitude', location.lng, { shouldValidate: true });
    form.setValue('locationDescription', location.street, { shouldValidate: true });
    form.clearErrors("subtype");
  }, [form]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario de Señalización Vial</h1>
          <p className="text-muted-foreground mt-1">
            Gestione el inventario de señales, semáforos y otros elementos viales.
          </p>
        </div>
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Elemento
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
            <CardTitle>Inventario Actual</CardTitle>
            <CardDescription>Una lista de toda la señalización vial registrada en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nombre / Subtipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No hay elementos en el inventario. Empiece por agregar uno.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.type}</TableCell>
                      <TableCell className="font-medium">{item.subtype}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.locationDescription || 'Ver en mapa'}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[item.status] || 'secondary'}>{item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <FilePenLine className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

           <div className="md:hidden space-y-4">
            {isLoading ? (
                <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : items.length > 0 ? (
                items.map(item => (
                    <Card key={item.id} className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold">{item.subtype}</p>
                                <p className="text-sm text-muted-foreground">{item.locationDescription || 'Ubicación no descrita'}</p>
                            </div>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(item)}>
                                        <FilePenLine className="mr-2 h-4 w-4" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="mt-2 pt-2 border-t text-sm flex justify-between items-center">
                            <p><strong>Tipo:</strong> {item.type}</p>
                            <Badge variant={statusColors[item.status] || 'secondary'}>{item.status}</Badge>
                        </div>
                    </Card>
                ))
            ) : (
                <div className="h-24 text-center text-muted-foreground flex items-center justify-center">No hay elementos en el inventario.</div>
            )}
        </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                  <DialogTitle>{editingItem ? "Editar Elemento de Inventario" : "Agregar Nuevo Elemento"}</DialogTitle>
                  <DialogDescription>
                      {editingItem ? "Modifique los detalles del elemento." : "Complete el formulario para añadir un nuevo elemento al inventario."}
                  </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} id="inventory-form">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                          <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Elemento</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {itemTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="subtype"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre o Subtipo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Pare, Ceda el Paso, Semáforo Peatonal" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado Actual</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Seleccione el estado" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {itemStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notas Adicionales</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Ej: Visibilidad reducida por un árbol, necesita repintado, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                          </div>
                          <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="locationDescription"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción de Ubicación</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Autocompletado desde el mapa..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div>
                              <FormLabel>Geolocalización</FormLabel>
                              <div className="h-64 mt-2 rounded-md overflow-hidden border">
                                  <LocationPicker 
                                      initialCenter={currentLocation}
                                      onLocationSelect={handleLocationSelect}
                                  />
                              </div>
                            </div>
                          </div>
                      </div>
                  </form>
              </Form>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" form="inventory-form" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingItem ? "Guardar Cambios" : "Agregar Elemento"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta acción eliminará permanentemente el elemento <strong>{itemToDelete?.subtype}</strong> del inventario. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
