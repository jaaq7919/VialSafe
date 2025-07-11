
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ConfigItem = {
  id: string;
  value: string;
  label: string;
};

const initialCauses: ConfigItem[] = [
  { id: '1', value: 'exceso-velocidad', label: 'Exceso de Velocidad' },
  { id: '2', value: 'distraccion', label: 'Conducción Distraída' },
  { id: '3', value: 'alcohol', label: 'Conducir Bajo Influencia (CBI)' },
  { id: '4', value: 'clima', label: 'Condiciones Climáticas' },
  { id: '5', value: 'imprudencia', label: 'Imprudencia del Conductor' },
  { id: '6', value: 'falla-mecanica', label: 'Falla Mecánica' },
  { id: '7', value: 'otro', label: 'Otro' },
];

const initialTypes: ConfigItem[] = [
  { id: '1', value: 'colision', label: 'Colisión' },
  { id: '2', value: 'atropello', label: 'Atropello' },
  { id: '3', value: 'caida-ocupante', label: 'Caída de Ocupante' },
  { id: '4', value: 'volcamiento', label: 'Volcamiento' },
  { id: '5', value: 'otro', label: 'Otro' },
];

function ConfigSection({ title, description, items, setItems, itemNoun }: { title: string, description: string, items: ConfigItem[], setItems: React.Dispatch<React.SetStateAction<ConfigItem[]>>, itemNoun: string }) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [newItemText, setNewItemText] = useState("");

  const handleEdit = (item: ConfigItem) => {
    setEditingId(item.id);
    setEditText(item.label);
  };

  const handleSave = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, label: editText } : item));
    setEditingId(null);
    setEditText("");
    toast({ title: `${itemNoun} actualizada`, description: `Se guardaron los cambios.` });
  };

  const handleAdd = () => {
    if (!newItemText.trim()) return;
    const newItem: ConfigItem = {
      id: new Date().getTime().toString(),
      label: newItemText,
      value: newItemText.toLowerCase().replace(/\s+/g, '-'),
    };
    setItems([...items, newItem]);
    setNewItemText("");
    toast({ title: `Nueva ${itemNoun.toLowerCase()} agregada`, description: `"${newItem.label}" se ha añadido a la lista.` });
  };
  
  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({ title: `${itemNoun} eliminada`});
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
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleSave(item.id)}><Save className="h-4 w-4"/></Button>
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
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [causes, setCauses] = useState<ConfigItem[]>(initialCauses);
  const [types, setTypes] = useState<ConfigItem[]>(initialTypes);

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Personalice las opciones y parámetros utilizados en los formularios de la aplicación.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        <ConfigSection 
          title="Causas de Accidentes"
          description="Gestione la lista de causas probables de accidentes que aparecen en los formularios de registro."
          items={causes}
          setItems={setCauses}
          itemNoun="Causa"
        />
        <ConfigSection 
          title="Tipos de Accidentes"
          description="Gestione la lista de tipos de accidentes disponibles al registrar un nuevo incidente."
          items={types}
          setItems={setTypes}
          itemNoun="Tipo"
        />
      </div>
    </>
  );
}
