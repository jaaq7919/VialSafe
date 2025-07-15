
import { z } from 'zod';

export const itemTypes = ["Señal Vertical", "Semáforo", "Reductor de Velocidad", "Señalización Horizontal", "Otro"] as const;
export const itemStatuses = ["Bueno", "Regular", "Malo", "Necesita Reemplazo", "Inexistente"] as const;

export const statusColors: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "Bueno": "secondary",
  "Regular": "default",
  "Malo": "outline",
  "Necesita Reemplazo": "destructive",
  "Inexistente": "destructive",
};

// Zod schema for validation
export const inventoryItemSchema = z.object({
  type: z.enum(itemTypes, { required_error: "Debe seleccionar un tipo de elemento." }),
  subtype: z.string().min(3, "El subtipo/nombre debe tener al menos 3 caracteres."),
  status: z.enum(itemStatuses, { required_error: "Debe seleccionar un estado." }),
  latitude: z.number(),
  longitude: z.number(),
  locationDescription: z.string().optional(),
  notes: z.string().optional(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema> & {
  id: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
};
