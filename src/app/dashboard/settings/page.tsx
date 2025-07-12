
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, Edit, Save, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSettings, updateSettings, type SettingItem, type AppSettings } from '@/services/settings';
import { Skeleton } from '@/components/ui/skeleton';


function ConfigSection({ title, description, items, setItems, itemNoun, onSave }: { title: string, description: string, items: SettingItem[], setItems: React.Dispatch<React.SetStateAction<SettingItem[]>>, itemNoun: string, onSave: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [newItemText, setNewItemText] = useState("");

  const handleEdit = (item: SettingItem) => {
    setEditingId(item.id);
    setEditText(item.label);
  };

  const handleSaveEdit = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, label: editText } : item));
    setEditingId(null);
    setEditText("");
  };
  
  const handleAdd = () => {
    if (!newItemText.trim()) return;
    const newItem: SettingItem = {
      id: new Date().getTime().toString(),
      label: newItemText,
      value: newItemText.toLowerCase().replace(/\s+/g, '-'),
    };
    setItems([...items, newItem]);
    setNewItemText("");
  };
  
  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md">
              {editingId === item.id ? (
                <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="h-9"/>
              ) : (
                <p className="flex-grow">{item.label}</p>
              )}
              {editingId === item.id ? (
                <>
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleSaveEdit(item.id)}><Save className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditingId(null)}><X className="h-4 w-4"/></Button>
                </>
              ) : (
                <>
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleEdit(item)}><Edit className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4"/></Button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-4 border-t">
          <Input 
            placeholder={`Añadir nueva ${itemNoun.toLowerCase()}...`} 
            value={newItemText} 
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir
          </Button>
        </div>
        <Button onClick={onSave} className="mt-4 w-full">
            <Save className="mr-2 h-4 w-4" /> Guardar cambios en {itemNoun.toLowerCase()}
        </Button>
      </CardContent>
    </Card>
  );
}

function SettingsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="flex items-center gap-2 pt-4 border-t">
                    <Skeleton className="h-10 flex-grow" />
                    <Skeleton className="h-10 w-24" />
                 </div>
                 <Skeleton className="h-10 w-full mt-4" />
            </CardContent>
        </Card>
    );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [causes, setCauses] = useState<SettingItem[]>([]);
  const [types, setTypes] = useState<SettingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
        const settings = await getSettings();
        if (settings) {
            setCauses(settings.accidentCauses || []);
            setTypes(settings.accidentTypes || []);
        }
    } catch (error) {
        console.error("Error fetching settings: ", error);
        toast({
            variant: "destructive",
            title: "Error al cargar configuración",
            description: "No se pudieron obtener los datos de la base de datos.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
        await updateSettings({
            accidentCauses: causes,
            accidentTypes: types,
        });
        toast({
            title: "Configuración Guardada",
            description: "Los cambios han sido guardados exitosamente.",
        });
    } catch (error) {
         console.error("Error saving settings: ", error);
         toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: "No se pudieron guardar los cambios en la base de datos.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Personalice las opciones y parámetros utilizados en los formularios de la aplicación.
        </p>
      </div>
      <div className="mt-6">
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SettingsSkeleton />
                <SettingsSkeleton />
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ConfigSection 
                    title="Causas de Accidentes"
                    description="Gestione la lista de causas probables de accidentes que aparecen en los formularios de registro."
                    items={causes}
                    setItems={setCauses}
                    itemNoun="Causa"
                    onSave={async () => {
                        await updateSettings({ accidentCauses: causes, accidentTypes: types });
                        toast({ title: 'Causas actualizadas' });
                    }}
                />
                <ConfigSection 
                    title="Tipos de Accidentes"
                    description="Gestione la lista de tipos de accidentes disponibles al registrar un nuevo incidente."
                    items={types}
                    setItems={setTypes}
                    itemNoun="Tipo"
                     onSave={async () => {
                        await updateSettings({ accidentCauses: causes, accidentTypes: types });
                        toast({ title: 'Tipos actualizados' });
                    }}
                />
            </div>
        )}
         <Card className="mt-8">
            <CardHeader>
                <CardTitle>Guardar Todos los Cambios</CardTitle>
                <CardDescription>
                    Presione este botón para persistir todas las modificaciones realizadas en las listas en la base de datos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleSaveSettings} disabled={isSaving || isLoading} className="w-full md:w-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar toda la configuración
                </Button>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
