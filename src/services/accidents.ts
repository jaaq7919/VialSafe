
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, getDoc, query, orderBy } from 'firebase/firestore';
import { z } from 'zod';
import { formSchema } from '@/app/dashboard/accidents/page';


// Este tipo representa la estructura del documento en Firestore.
// Los Timestamps se convierten a strings (ISO) para ser pasados a componentes de cliente de forma segura.
export type Accident = {
  id: string;
  addressPrefix: string;
  address: string;
  location: string;
  dateTime: string; // Changed from Date to string
  type: string;
  cause: string;
  crossingStatus: string;
  weather: string;
  specialEvent: string;
  observations?: string;
  latitude: number;
  longitude: number;
  createdAt: string; // Changed from Date to string
  createdBy: string;
};

// Zod schema for validating a row from the CSV
const csvRowSchema = z.object({
  addressPrefix: z.string().min(1, "El prefijo es requerido."),
  address: z.string().min(3, "La dirección es requerida."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha debe ser YYYY-MM-DD."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora debe ser HH:MM."),
  type: z.string().min(1, "El tipo es requerido."),
  cause: z.string().min(1, "La causa es requerida."),
  crossingStatus: z.enum(['Buena', 'Regular', 'Mala', 'Inexistente']),
  latitude: z.number(),
  longitude: z.number(),
  weather: z.string().min(1, "El clima es requerido."),
  specialEvent: z.string().min(1, "El evento especial es requerido."),
  observations: z.string().optional(),
});


const accidentsCollection = collection(db, 'accidents');

// Obtener todos los accidentes, ordenados por fecha de creación descendente
export async function getAccidents(): Promise<Accident[]> {
  const q = query(accidentsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dateTime: (data.dateTime as Timestamp).toDate().toISOString(),
      createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    } as Accident;
  });
}

// Obtener un solo accidente por ID
export async function getAccident(id: string): Promise<Accident | null> {
    const docRef = doc(db, 'accidents', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return null;
    }
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        dateTime: (data.dateTime as Timestamp).toDate().toISOString(),
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    } as Accident;
}


// Añadir un nuevo accidente
export async function addAccident(data: z.infer<typeof formSchema>) {
  try {
    const [hours, minutes] = data.time.split(':').map(Number);
    const dateTime = new Date(data.date);
    dateTime.setHours(hours, minutes);

    const docRef = await addDoc(accidentsCollection, {
      ...data,
      location: `${data.addressPrefix} ${data.address}`,
      dateTime: Timestamp.fromDate(dateTime),
      createdAt: serverTimestamp(),
      createdBy: "admin_user" // Placeholder
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding accident: ", error);
    throw new Error("Failed to add accident to the database.");
  }
}

// Actualizar un accidente existente
export async function updateAccident(id: string, data: z.infer<typeof formSchema>) {
  const accidentDoc = doc(db, 'accidents', id);
  try {
    const [hours, minutes] = data.time.split(':').map(Number);
    const dateTime = new Date(data.date);
    dateTime.setHours(hours, minutes);

    await updateDoc(accidentDoc, {
        ...data,
        location: `${data.addressPrefix} ${data.address}`,
        dateTime: Timestamp.fromDate(dateTime)
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating accident: ", error);
    throw new Error("Failed to update accident in the database.");
  }
}

// Eliminar un accidente
export async function deleteAccident(id: string) {
  const accidentDoc = doc(db, 'accidents', id);
  try {
    await deleteDoc(accidentDoc);
    return { success: true };
  } catch (error) {
    console.error("Error deleting accident: ", error);
    throw new Error("Failed to delete accident from the database.");
  }
}

// Añadir un nuevo accidente desde una fila de CSV
export async function addAccidentFromCsvRow(csvRow: string) {
  const values = csvRow.split(',');
  const rawData = {
    addressPrefix: values[0]?.trim(),
    address: values[1]?.trim(),
    date: values[2]?.trim(),
    time: values[3]?.trim(),
    type: values[4]?.trim(),
    cause: values[5]?.trim(),
    crossingStatus: values[6]?.trim(),
    latitude: parseFloat(values[7]?.trim()),
    longitude: parseFloat(values[8]?.trim()),
    weather: values[9]?.trim(),
    specialEvent: values[10]?.trim(),
    observations: values[11]?.trim() || '',
  };

  const validationResult = csvRowSchema.safeParse(rawData);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    throw new Error(`Validación fallida: ${firstError.path.join('.')} - ${firstError.message}`);
  }

  const data = validationResult.data;

  try {
    const dateTimeString = `${data.date}T${data.time}:00`;
    const dateTime = new Date(dateTimeString);
    if (isNaN(dateTime.getTime())) {
      throw new Error("Formato de fecha o hora inválido.");
    }

    await addDoc(accidentsCollection, {
      ...data,
      location: `${data.addressPrefix} ${data.address}`,
      dateTime: Timestamp.fromDate(dateTime),
      createdAt: serverTimestamp(),
      createdBy: "bulk_import"
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding accident from CSV: ", error);
    throw new Error("Error al guardar en la base de datos.");
  }
}

    