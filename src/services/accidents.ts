
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { z } from 'zod';
import { formSchema } from '@/app/dashboard/accidents/page';


// Este tipo representa la estructura del documento en Firestore.
// Los Timestamps se convierten a Date para ser pasados a componentes de cliente.
export type Accident = {
  id: string;
  addressPrefix: string;
  address: string;
  location: string;
  dateTime: Date;
  type: string;
  cause: string;
  crossingStatus: string;
  observations?: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  createdBy: string;
};


const accidentsCollection = collection(db, 'accidents');

// Obtener todos los accidentes
export async function getAccidents(): Promise<Accident[]> {
  const snapshot = await getDocs(accidentsCollection);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dateTime: (data.dateTime as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
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
        dateTime: (data.dateTime as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
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

    